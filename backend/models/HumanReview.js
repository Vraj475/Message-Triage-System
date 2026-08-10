const mongoose = require('mongoose');
const { CATEGORY_VALUES_WITH_UNKNOWN, PRIORITY_VALUES } = require('../config/constants');

const humanReviewSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    unique: true,   // one human review per message
    index: true,
  },
  originalTriageResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TriageResult',
    default: null,
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
  needsHuman: {
    type: Boolean,
    required: true,
  },
  reviewerNote: {
    type: String,
    default: null,
  },
  reviewerId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,   // auto createdAt + updatedAt
});

module.exports = mongoose.model('HumanReview', humanReviewSchema);
