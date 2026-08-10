const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const TriageResult = require('../models/TriageResult');
const HumanReview = require('../models/HumanReview');
const EvaluationRun = require('../models/EvaluationRun');
const { validateObjectId } = require('../validators');
const { CATEGORY_VALUES } = require('../config/constants');

// POST /api/evaluation/run/:datasetId — run evaluation against human labels
router.post('/run/:datasetId', validateObjectId('datasetId'), async (req, res, next) => {
  try {
    // Find all messages in the dataset that have both a triage result AND a human review
    const messages = await Message.find({ datasetId: req.params.datasetId });
    if (messages.length === 0) {
      return res.status(404).json({ error: 'No messages found for this dataset' });
    }

    const messageIds = messages.map(m => m._id);
    const reviews = await HumanReview.find({ messageId: { $in: messageIds } });
    const triageResults = await TriageResult.find({ messageId: { $in: messageIds } });

    if (reviews.length === 0) {
      return res.json({
        error: 'No human reviews found. Label at least some messages before running evaluation.',
      });
    }

    // Build lookup maps
    const triageMap = {};
    triageResults.forEach(t => { triageMap[t.messageId.toString()] = t; });
    const msgMap = {};
    messages.forEach(m => { msgMap[m._id.toString()] = m; });

    // Only evaluate messages that have BOTH a human review AND an AI triage
    const evaluatable = reviews.filter(r => triageMap[r.messageId.toString()]);

    if (evaluatable.length === 0) {
      return res.json({
        error: 'No messages with both human review and AI triage found.',
      });
    }

    // Compute metrics
    let categoryMatches = 0;
    let priorityMatches = 0;
    let humanFlagMatches = 0;
    let exactMatches = 0;
    const failureCases = [];
    const evaluatedMessageIds = [];

    // Build confusion matrix for categories
    const confusionMatrix = {};
    CATEGORY_VALUES.forEach(c => {
      confusionMatrix[c] = {};
      CATEGORY_VALUES.forEach(c2 => { confusionMatrix[c][c2] = 0; });
    });

    let totalLatency = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    evaluatable.forEach(review => {
      const triage = triageMap[review.messageId.toString()];
      const msg = msgMap[review.messageId.toString()];
      evaluatedMessageIds.push(review.messageId);

      const catMatch = review.category === triage.category;
      const priMatch = review.priority === triage.priority;
      const humanMatch = review.needsHuman === triage.needsHuman;

      if (catMatch) categoryMatches++;
      if (priMatch) priorityMatches++;
      if (humanMatch) humanFlagMatches++;
      if (catMatch && priMatch && humanMatch) exactMatches++;

      // Update confusion matrix
      if (confusionMatrix[review.category] && confusionMatrix[review.category][triage.category] !== undefined) {
        confusionMatrix[review.category][triage.category]++;
      }

      totalLatency += triage.latencyMs || 0;
      totalInputTokens += triage.inputTokens || 0;
      totalOutputTokens += triage.outputTokens || 0;

      // Track failure cases
      if (!catMatch || !priMatch) {
        failureCases.push({
          rawTextPreview: msg ? msg.rawText.slice(0, 80) : '(unknown)',
          humanCategory: review.category,
          aiCategory: triage.category,
          humanPriority: review.priority,
          aiPriority: triage.priority,
          aiConfidence: triage.confidence,
          categoryMatch: catMatch,
          priorityMatch: priMatch,
        });
      }
    });

    const total = evaluatable.length;
    const run = await EvaluationRun.create({
      name: req.body?.name || `Evaluation — ${new Date().toLocaleString()}`,
      datasetId: req.params.datasetId,
      evaluatedMessageIds,
      datasetSize: total,
      categoryAccuracy: Math.round((categoryMatches / total) * 100),
      priorityAccuracy: Math.round((priorityMatches / total) * 100),
      humanEscalationAccuracy: Math.round((humanFlagMatches / total) * 100),
      exactDecisionMatchRate: Math.round((exactMatches / total) * 100),
      confusionMatrix,
      failureCases,
      averageLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
      averageInputTokens: total > 0 ? Math.round(totalInputTokens / total) : 0,
      averageOutputTokens: total > 0 ? Math.round(totalOutputTokens / total) : 0,
      estimatedCost: 0,
      optimizationIdea: 'Cache identical or semantically near-duplicate messages at the batch ingestion layer to avoid redundant API calls. For a dataset with ~20% repeated complaints, this reduces API usage by 15–25%.',
    });

    res.status(201).json(run);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation/:runId — get an evaluation run
router.get('/:runId', validateObjectId('runId'), async (req, res, next) => {
  try {
    const run = await EvaluationRun.findById(req.params.runId);
    if (!run) return res.status(404).json({ error: 'Evaluation run not found' });
    res.json(run);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation/:runId/failures — get failure cases
router.get('/:runId/failures', validateObjectId('runId'), async (req, res, next) => {
  try {
    const run = await EvaluationRun.findById(req.params.runId);
    if (!run) return res.status(404).json({ error: 'Evaluation run not found' });
    res.json(run.failureCases);
  } catch (err) {
    next(err);
  }
});

// GET /api/evaluation — list all evaluation runs
router.get('/', async (req, res, next) => {
  try {
    const runs = await EvaluationRun.find().sort({ createdAt: -1 }).limit(50);
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
