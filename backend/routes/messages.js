const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const { triageMessage } = require('../services/triageService');

// Normalize input — handles both string array and object array formats
function normalizeMessages(raw) {
  if (!Array.isArray(raw)) throw new Error('messages must be an array');
  return raw.map((item, i) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.text || item.message || item.body || item.content || item.Message || JSON.stringify(item);
    }
    return String(item);
  });
}

// POST /api/messages/batch
// Processes all messages in batches of 5 with 3-second delay between batches
// to stay within Gemini free tier rate limits (30 RPM for gemini-2.0-flash-lite)
router.post('/batch', async (req, res, next) => {
  try {
    const { messages: rawMessages } = req.body;

    if (!rawMessages) {
      return res.status(400).json({ error: 'Request body must include a "messages" array' });
    }

    const messages = normalizeMessages(rawMessages);

    if (messages.length === 0) {
      return res.status(400).json({ error: 'messages array is empty' });
    }

    if (messages.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 messages per batch' });
    }

    const batchId = uuidv4();
    const BATCH_SIZE = 5;
    const BATCH_DELAY_MS = 3000;
    const savedDocs = [];

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const chunk = messages.slice(i, i + BATCH_SIZE);

      const chunkResults = await Promise.allSettled(
        chunk.map(text => triageMessage(text))
      );

      for (let j = 0; j < chunk.length; j++) {
        const outcome = chunkResults[j];
        let triageData;

        if (outcome.status === 'fulfilled') {
          triageData = outcome.value;
        } else {
          // Promise itself rejected (should not happen since triageMessage catches internally)
          triageData = {
            success: false,
            is_garbage: false,
            triage: {
              category: 'unclear', priority: 'P3',
              summary: 'Processing error — manual review required.',
              suggested_action: 'Manually review this message.',
              needs_human: true, confidence: 0,
            },
            meta: { tokens_input: 0, tokens_output: 0, cost_usd: 0, latency_ms: 0 },
            error: outcome.reason?.message || 'Unknown error',
          };
        }

        const doc = await Message.create({
          raw_text: chunk[j],
          batch_id: batchId,
          is_garbage: triageData.is_garbage || false,
          triage: triageData.triage,
          meta: triageData.meta,
          error: triageData.error || null,
        });
        savedDocs.push(doc);
      }

      // Rate limit delay — skip after last batch
      if (i + BATCH_SIZE < messages.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    res.json({
      batch_id: batchId,
      total: savedDocs.length,
      results: savedDocs,
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/messages?batch_id=xxx&needs_human=true
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.batch_id) filter.batch_id = req.query.batch_id;
    if (req.query.needs_human === 'true') filter['triage.needs_human'] = true;
    if (req.query.priority) filter['triage.priority'] = req.query.priority;

    const messages = await Message.find(filter).sort({ created_at: -1 }).limit(200);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/batches — list all unique batch IDs with stats
router.get('/batches', async (req, res, next) => {
  try {
    const batches = await Message.aggregate([
      {
        $group: {
          _id: '$batch_id',
          total: { $sum: 1 },
          flagged: { $sum: { $cond: ['$triage.needs_human', 1, 0] } },
          p0: { $sum: { $cond: [{ $eq: ['$triage.priority', 'P0'] }, 1, 0] } },
          p1: { $sum: { $cond: [{ $eq: ['$triage.priority', 'P1'] }, 1, 0] } },
          p2: { $sum: { $cond: [{ $eq: ['$triage.priority', 'P2'] }, 1, 0] } },
          p3: { $sum: { $cond: [{ $eq: ['$triage.priority', 'P3'] }, 1, 0] } },
          avg_confidence: { $avg: '$triage.confidence' },
          avg_latency_ms: { $avg: '$meta.latency_ms' },
          created_at: { $max: '$created_at' },
        }
      },
      { $sort: { created_at: -1 } }
    ]);
    res.json(batches);
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/:id
router.get('/:id', async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
