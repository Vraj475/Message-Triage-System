const mongoose = require('mongoose');

const evaluationRunSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    default: null,
  },
  evaluatedMessageIds: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  datasetSize: {
    type: Number,
    default: 0,
  },
  categoryAccuracy: {
    type: Number,
    default: null,
  },
  priorityAccuracy: {
    type: Number,
    default: null,
  },
  humanEscalationAccuracy: {
    type: Number,
    default: null,
  },
  exactDecisionMatchRate: {
    type: Number,
    default: null,
  },
  confusionMatrix: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  failureCases: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  averageLatencyMs: {
    type: Number,
    default: null,
  },
  averageInputTokens: {
    type: Number,
    default: null,
  },
  averageOutputTokens: {
    type: Number,
    default: null,
  },
  estimatedCost: {
    type: Number,
    default: null,
  },
  optimizationIdea: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,   // auto createdAt + updatedAt
});

module.exports = mongoose.model('EvaluationRun', evaluationRunSchema);
