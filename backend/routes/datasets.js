const express = require('express');
const router = express.Router();
const Dataset = require('../models/Dataset');
const Message = require('../models/Message');
const TriageResult = require('../models/TriageResult');
const { validate, datasetPasteSchema, validateObjectId } = require('../validators');

/**
 * Normalize input — handles both string array and object array formats.
 * Extracts text from objects with .text, .message, .body, .content fields.
 */
function normalizeMessages(raw) {
  if (!Array.isArray(raw)) throw new Error('messages must be an array');
  return raw.map((item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.text || item.message || item.body || item.content || item.Message || JSON.stringify(item);
    }
    return String(item);
  });
}

// POST /api/datasets/paste — create dataset from pasted messages
router.post('/paste', validate(datasetPasteSchema), async (req, res, next) => {
  try {
    const { messages: rawMessages, name } = req.validatedBody;
    const texts = normalizeMessages(rawMessages);

    // Create dataset
    const dataset = await Dataset.create({
      name: name || `Paste — ${new Date().toLocaleString()}`,
      source: 'paste',
      messageCount: texts.length,
      status: 'created',
    });

    // Create messages
    const messageDocs = await Message.insertMany(
      texts.map(text => {
        const trimmed = text.trim();
        const warnings = [];
        if (trimmed.length === 0) warnings.push('Empty message');
        if (trimmed.length > 1500) warnings.push(`Long message (${trimmed.length} chars) — will be truncated for AI`);
        return {
          datasetId: dataset._id,
          rawText: text,
          normalizedText: trimmed,
          source: 'paste',
          status: 'pending',
          inputWarnings: warnings,
        };
      })
    );

    res.status(201).json({
      dataset,
      messages: messageDocs,
      total: messageDocs.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/datasets/upload — create dataset from uploaded JSON file
router.post('/upload', async (req, res, next) => {
  try {
    const { messages: rawMessages, name, fileName } = req.body;

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return res.status(400).json({ error: 'Request must include a non-empty "messages" array' });
    }
    if (rawMessages.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 messages per batch' });
    }

    const texts = normalizeMessages(rawMessages);

    const dataset = await Dataset.create({
      name: name || fileName || `Upload — ${new Date().toLocaleString()}`,
      source: 'upload',
      fileName: fileName || null,
      messageCount: texts.length,
      status: 'created',
    });

    const messageDocs = await Message.insertMany(
      texts.map(text => {
        const trimmed = text.trim();
        const warnings = [];
        if (trimmed.length === 0) warnings.push('Empty message');
        if (trimmed.length > 1500) warnings.push(`Long message (${trimmed.length} chars)`);
        return {
          datasetId: dataset._id,
          rawText: text,
          normalizedText: trimmed,
          source: 'upload',
          status: 'pending',
          inputWarnings: warnings,
        };
      })
    );

    res.status(201).json({
      dataset,
      messages: messageDocs,
      total: messageDocs.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/datasets — list all datasets
router.get('/', async (req, res, next) => {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 }).limit(100);
    res.json(datasets);
  } catch (err) {
    next(err);
  }
});

// GET /api/datasets/:datasetId — get dataset details
router.get('/:datasetId', validateObjectId('datasetId'), async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.datasetId);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    // Include message counts by status
    const statusCounts = await Message.aggregate([
      { $match: { datasetId: dataset._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ ...dataset.toObject(), statusCounts });
  } catch (err) {
    next(err);
  }
});

// GET /api/datasets/:datasetId/messages — get messages in a dataset
router.get('/:datasetId/messages', validateObjectId('datasetId'), async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.datasetId);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const messages = await Message.find({ datasetId: dataset._id }).sort({ createdAt: 1 }).limit(200);

    // Also fetch triage results for these messages
    const messageIds = messages.map(m => m._id);
    const triageResults = await TriageResult.find({ messageId: { $in: messageIds } });
    const triageMap = {};
    triageResults.forEach(tr => { triageMap[tr.messageId.toString()] = tr; });

    const enriched = messages.map(m => ({
      ...m.toObject(),
      triage: triageMap[m._id.toString()] || null,
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
