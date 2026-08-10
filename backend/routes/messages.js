const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const TriageResult = require('../models/TriageResult');
const { validateObjectId } = require('../validators');

// GET /api/messages — list messages with optional filters
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.datasetId) filter.datasetId = req.query.datasetId;
    if (req.query.status) filter.status = req.query.status;

    const limit = Math.min(parseInt(req.query.limit) || 200, 200);
    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit);

    // Enrich with triage results
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

// GET /api/messages/:messageId — get a single message with its triage result
router.get('/:messageId', validateObjectId('messageId'), async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const triageResult = await TriageResult.findOne({ messageId: msg._id });

    res.json({
      ...msg.toObject(),
      triage: triageResult || null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
