const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const TriageResult = require('../models/TriageResult');
const HumanReview = require('../models/HumanReview');
const { validate, humanReviewCreateSchema, humanReviewUpdateSchema, validateObjectId } = require('../validators');

// GET /api/reviews — list all human reviews
router.get('/', async (req, res, next) => {
  try {
    const reviews = await HumanReview.find().sort({ createdAt: -1 }).limit(200);

    // Enrich with message text and AI triage
    const messageIds = reviews.map(r => r.messageId);
    const messages = await Message.find({ _id: { $in: messageIds } });
    const triageResults = await TriageResult.find({ messageId: { $in: messageIds } });

    const msgMap = {};
    messages.forEach(m => { msgMap[m._id.toString()] = m; });
    const triageMap = {};
    triageResults.forEach(t => { triageMap[t.messageId.toString()] = t; });

    const enriched = reviews.map(r => ({
      ...r.toObject(),
      message: msgMap[r.messageId.toString()] || null,
      aiTriage: triageMap[r.messageId.toString()] || null,
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/:messageId — create a human review for a message
router.post('/:messageId', validateObjectId('messageId'), validate(humanReviewCreateSchema), async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Check if review already exists
    const existing = await HumanReview.findOne({ messageId: msg._id });
    if (existing) {
      return res.status(409).json({ error: 'Human review already exists for this message. Use PUT to update.' });
    }

    // Find the triage result to link
    const triageResult = await TriageResult.findOne({ messageId: msg._id });

    const review = await HumanReview.create({
      messageId: msg._id,
      originalTriageResultId: triageResult?._id || null,
      category: req.validatedBody.category,
      priority: req.validatedBody.priority,
      needsHuman: req.validatedBody.needsHuman,
      reviewerNote: req.validatedBody.reviewerNote || null,
      reviewerId: req.validatedBody.reviewerId || null,
    });

    // Update triage result review status
    if (triageResult) {
      triageResult.reviewStatus = 'reviewed';
      await triageResult.save();
    }

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:messageId — update an existing human review
router.put('/:messageId', validateObjectId('messageId'), validate(humanReviewUpdateSchema), async (req, res, next) => {
  try {
    const review = await HumanReview.findOne({ messageId: req.params.messageId });
    if (!review) return res.status(404).json({ error: 'Human review not found for this message' });

    const updates = req.validatedBody;
    Object.keys(updates).forEach(key => {
      review[key] = updates[key];
    });
    await review.save();

    res.json(review);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
