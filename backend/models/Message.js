const mongoose = require('mongoose');
const { MESSAGE_STATUSES, DATASET_SOURCES } = require('../config/constants');

const messageSchema = new mongoose.Schema({
  externalId: {
    type: String,
    default: null,
    index: true,
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true,
    index: true,
  },
  rawText: {
    type: String,
    default: '',
  },
  normalizedText: {
    type: String,
    default: null,
  },
  source: {
    type: String,
    enum: DATASET_SOURCES,
    default: 'paste',
  },
  status: {
    type: String,
    enum: MESSAGE_STATUSES,
    default: 'pending',
  },
  inputWarnings: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,   // auto createdAt + updatedAt
});

module.exports = mongoose.model('Message', messageSchema);
