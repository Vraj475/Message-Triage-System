const express = require('express');
const router = express.Router();
const Dataset = require('../models/Dataset');
const Message = require('../models/Message');
const TriageResult = require('../models/TriageResult');
const HumanReview = require('../models/HumanReview');
const EvaluationRun = require('../models/EvaluationRun');

// POST /api/admin/reset-db — Reset/wipe all database collections
router.post('/reset-db', async (req, res, next) => {
  try {
    const datasetRes = await Dataset.deleteMany({});
    const messageRes = await Message.deleteMany({});
    const triageRes = await TriageResult.deleteMany({});
    const reviewRes = await HumanReview.deleteMany({});
    const evalRes = await EvaluationRun.deleteMany({});

    res.json({
      success: true,
      message: 'Database reset successfully. All collections cleared.',
      deletedCounts: {
        datasets: datasetRes.deletedCount,
        messages: messageRes.deletedCount,
        triageResults: triageRes.deletedCount,
        humanReviews: reviewRes.deletedCount,
        evaluationRuns: evalRes.deletedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
