const mongoose = require('mongoose');
const {
  CATEGORY_VALUES_WITH_UNKNOWN,
  PRIORITY_VALUES,
  REVIEW_STATUSES,
  VALIDATION_STATUSES,
} = require('../config/constants');

const triageResultSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: CATEGORY_VALUES_WITH_UNKNOWN,
    required: true,
  },
  priority: {
    type: String,
    enum: PRIORITY_VALUES,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  suggestedAction: {
    type: String,
    required: true,
  },
  needsHuman: {
    type: Boolean,
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  reviewStatus: {
    type: String,
    enum: REVIEW_STATUSES,
    default: 'auto_accepted',
  },
  reviewReason: {
    type: String,
    default: null,
  },
  modelName: {
    type: String,
    default: null,
  },
  promptVersion: {
    type: String,
    default: null,
  },
  schemaVersion: {
    type: String,
    default: null,
  },
  rawModelOutput: {
    type: String,
    default: null,
    select: false,   // not returned by default in queries — must be explicitly requested
  },
  validationStatus: {
    type: String,
    enum: VALIDATION_STATUSES,
    default: 'valid',
  },
  validationErrors: {
    type: [String],
    default: [],
  },
  inputTokens: {
    type: Number,
    default: 0,
  },
  outputTokens: {
    type: Number,
    default: 0,
  },
  estimatedCost: {
    type: Number,
    default: 0,
  },
  estimatedCost: {
    type: Number,
    default: 0,
  },
  latencyMs: {
    type: Number,
    default: 0,
  },
  isApiFailure: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,   // auto createdAt + updatedAt
});

module.exports = mongoose.model('TriageResult', triageResultSchema);
