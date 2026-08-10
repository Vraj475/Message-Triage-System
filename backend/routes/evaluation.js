const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const GroundTruth = require('../models/GroundTruth');

// POST /api/evaluation/label
// Save or update a human label for a message
// Body: { message_id, human_category, human_priority, human_needs_human }
router.post('/label', async (req, res, next) => {
  try {
    const { message_id, human_category, human_priority, human_needs_human } = req.body;

    if (!message_id || !human_category || !human_priority || human_needs_human === undefined) {
      return res.status(400).json({ error: 'message_id, human_category, human_priority, human_needs_human are all required' });
    }

    const message = await Message.findById(message_id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Upsert: update if exists, create if not
    const gt = await GroundTruth.findOneAndUpdate(
      { message_id },
      {
        message_id,
        raw_text: message.raw_text,
        human_label: {
          category: human_category,
          priority: human_priority,
          needs_human: human_needs_human,
        },
        ai_decision: {
          category: message.triage.category,
          priority: message.triage.priority,
          needs_human: message.triage.needs_human,
        },
        ai_confidence: message.triage.confidence,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(gt);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation/labels — all labeled messages
router.get('/labels', async (req, res, next) => {
  try {
    const labels = await GroundTruth.find().sort({ created_at: -1 });
    res.json(labels);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation/report — evaluation metrics report
router.get('/report', async (req, res, next) => {
  try {
    const labels = await GroundTruth.find();

    if (labels.length === 0) {
      return res.json({ message: 'No labels yet. Label at least 10 messages on the /eval page.' });
    }

    const total = labels.length;
    const categoryAgreements = labels.filter(l => l.agrees_category).length;
    const priorityAgreements = labels.filter(l => l.agrees_priority).length;
    const humanFlagAgreements = labels.filter(l => l.agrees_human_flag).length;

    // Overall agreement: category AND priority AND human_flag all match
    const fullyAgree = labels.filter(l => l.agrees_category && l.agrees_priority && l.agrees_human_flag).length;

    // Failures: cases where AI was wrong
    const failures = labels
      .filter(l => !l.agrees_category || !l.agrees_priority)
      .map(l => ({
        raw_text_preview: l.raw_text.slice(0, 80),
        human: l.human_label,
        ai: l.ai_decision,
        ai_confidence: l.ai_confidence,
        agrees_category: l.agrees_category,
        agrees_priority: l.agrees_priority,
      }));

    // Cost and latency stats from all messages in DB
    const allMessages = await Message.find({});
    const avgLatency = allMessages.length > 0
      ? Math.round(allMessages.reduce((sum, m) => sum + (m.meta?.latency_ms || 0), 0) / allMessages.length)
      : 0;
    const totalTokens = allMessages.reduce((sum, m) => sum + (m.meta?.tokens_input || 0) + (m.meta?.tokens_output || 0), 0);

    res.json({
      labeled_count: total,
      overall_agreement_rate: `${Math.round((fullyAgree / total) * 100)}%`,
      category_agreement_rate: `${Math.round((categoryAgreements / total) * 100)}%`,
      priority_agreement_rate: `${Math.round((priorityAgreements / total) * 100)}%`,
      human_flag_agreement_rate: `${Math.round((humanFlagAgreements / total) * 100)}%`,
      failures,
      system_stats: {
        total_messages_processed: allMessages.length,
        avg_latency_ms: avgLatency,
        total_tokens_used: totalTokens,
        cost_per_message_usd: 0,   // Gemini free tier
        note: 'Running on Gemini free tier — zero API cost.',
      },
      optimization_suggestion: 'Cache identical or semantically near-duplicate messages at the batch ingestion layer to avoid redundant API calls. For a dataset with ~20% repeated complaints, this reduces API usage by 15–25%.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
