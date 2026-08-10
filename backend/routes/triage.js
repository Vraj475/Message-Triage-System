const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Dataset = require('../models/Dataset');
const TriageResult = require('../models/TriageResult');
const { triageMessage } = require('../services/triageService');
const { validateObjectId } = require('../validators');
const { BATCH_SETTINGS, AI_SETTINGS } = require('../config/constants');

// POST /api/triage/message/:messageId — triage a single message
router.post('/message/:messageId', validateObjectId('messageId'), async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    if (msg.status === 'completed') {
      const existing = await TriageResult.findOne({ messageId: msg._id });
      if (existing) {
        return res.json({ message: 'Already triaged', triageResult: existing });
      }
    }

    msg.status = 'processing';
    await msg.save();

    const result = await triageMessage(msg.rawText);

    // Add input warnings from triage service
    if (result.inputWarnings && result.inputWarnings.length > 0) {
      msg.inputWarnings = [...new Set([...msg.inputWarnings, ...result.inputWarnings])];
    }

    const triageResultData = {
      messageId: msg._id,
      category: result.triage.category,
      priority: result.triage.priority,
      summary: result.triage.summary,
      suggestedAction: result.triage.suggested_action || result.triage.suggestedAction,
      needsHuman: result.triage.needs_human !== undefined ? result.triage.needs_human : result.triage.needsHuman,
      confidence: result.triage.confidence,
      reviewStatus: result.reviewStatus || (result.success ? 'auto_accepted' : 'failed'),
      reviewReason: result.reviewReason || null,
      modelName: result.modelName,
      promptVersion: result.promptVersion,
      schemaVersion: result.schemaVersion,
      rawModelOutput: result.rawModelOutput,
      validationStatus: result.validationStatus,
      validationErrors: result.validationErrors || [],
      inputTokens: result.meta.tokens_input,
      outputTokens: result.meta.tokens_output,
      estimatedCost: result.meta.cost_usd,
      latencyMs: result.meta.latency_ms,
      isApiFailure: result.triage.isApiFailure || false,
    };

    const triageResult = await TriageResult.findOneAndUpdate(
      { messageId: msg._id },
      triageResultData,
      { upsert: true, new: true, runValidators: true }
    );

    msg.status = result.success ? 'completed' : 'failed';
    await msg.save();

    res.json({ triageResult, message: msg });
  } catch (err) {
    next(err);
  }
});

// POST /api/triage/batch/:datasetId — triage all pending messages in a dataset
router.post('/batch/:datasetId', validateObjectId('datasetId'), async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.datasetId);
    if (!dataset) return res.status(404).json({ success: false, error: 'Dataset not found' });

    // Get all pending or failed messages
    const pendingMessages = await Message.find({
      datasetId: dataset._id,
      status: { $in: ['pending', 'failed'] },
    });

    if (pendingMessages.length === 0) {
      return res.json({ success: true, message: 'No pending messages to triage', processed: 0, succeeded: 0, failed: 0 });
    }

    dataset.status = 'processing';
    await dataset.save();

    let succeeded = 0;
    let failed = 0;

    // Process sequentially (not parallel) using for...of to avoid rate limits
    for (const msg of pendingMessages) {
      msg.status = 'processing';
      await msg.save();

      try {
        const result = await triageMessage(msg.normalizedText || msg.rawText);

        if (result.inputWarnings && result.inputWarnings.length > 0) {
          msg.inputWarnings = [...new Set([...msg.inputWarnings, ...result.inputWarnings])];
        }

        const triageResultData = {
          messageId: msg._id,
          category: result.triage.category,
          priority: result.triage.priority,
          summary: result.triage.summary,
          suggestedAction: result.triage.suggested_action || result.triage.suggestedAction,
          needsHuman: result.triage.needs_human !== undefined ? result.triage.needs_human : result.triage.needsHuman,
          confidence: result.triage.confidence,
          reviewStatus: result.reviewStatus || (result.success ? 'auto_accepted' : 'failed'),
          reviewReason: result.reviewReason || null,
          modelName: result.modelName,
          promptVersion: result.promptVersion,
          schemaVersion: result.schemaVersion,
          rawModelOutput: result.rawModelOutput,
          validationStatus: result.validationStatus,
          validationErrors: result.validationErrors || [],
          inputTokens: result.meta.tokens_input,
          outputTokens: result.meta.tokens_output,
          estimatedCost: result.meta.cost_usd,
          latencyMs: result.meta.latency_ms,
          isApiFailure: result.triage.isApiFailure || false,
        };

        await TriageResult.findOneAndUpdate(
          { messageId: msg._id },
          triageResultData,
          { upsert: true, new: true, runValidators: true }
        );

        msg.status = (result.success && !result.triage.isApiFailure) ? 'completed' : 'failed';
        await msg.save();

        if (result.success && !result.triage.isApiFailure) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (msgErr) {
        console.error(`[triage] Error triaging message ${msg._id}:`, msgErr.message || msgErr);
        msg.status = 'failed';
        await msg.save();
        failed++;
      }

      // Small 300ms delay between API calls to prevent rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    // Update dataset status
    const remaining = await Message.countDocuments({
      datasetId: dataset._id,
      status: 'pending',
    });
    dataset.status = remaining === 0 ? 'completed' : 'processing';
    await dataset.save();

    res.json({
      success: true,
      processed: pendingMessages.length,
      succeeded,
      failed,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/triage/batch/:datasetId/status — processing progress
router.get('/batch/:datasetId/status', validateObjectId('datasetId'), async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.datasetId);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const statusCounts = await Message.aggregate([
      { $match: { datasetId: dataset._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
    statusCounts.forEach(s => { counts[s._id] = s.count; });

    res.json({
      datasetId: dataset._id,
      datasetStatus: dataset.status,
      totalMessages: dataset.messageCount,
      ...counts,
      progress: dataset.messageCount > 0
        ? Math.round(((counts.completed + counts.failed) / dataset.messageCount) * 100)
        : 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/triage/message/:messageId — get triage result for a message
router.get('/message/:messageId', validateObjectId('messageId'), async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const triageResult = await TriageResult.findOne({ messageId: msg._id });
    res.json({ message: msg, triageResult: triageResult || null });
  } catch (err) {
    next(err);
  }
});

// GET /api/triage/results — list all triage results with filtering
router.get('/results', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.datasetId) {
      const msgIds = await Message.find({ datasetId: req.query.datasetId }).select('_id');
      filter.messageId = { $in: msgIds.map(m => m._id) };
    }
    if (req.query.needsHuman === 'true') filter.needsHuman = true;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.reviewStatus) filter.reviewStatus = req.query.reviewStatus;

    const results = await TriageResult.find(filter).sort({ createdAt: -1 }).limit(200);

    // Enrich with message text
    const messageIds = results.map(r => r.messageId);
    const messages = await Message.find({ _id: { $in: messageIds } });
    const msgMap = {};
    messages.forEach(m => { msgMap[m._id.toString()] = m; });

    const enriched = results.map(r => ({
      ...r.toObject(),
      message: msgMap[r.messageId.toString()] || null,
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
