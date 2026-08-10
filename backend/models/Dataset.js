const mongoose = require('mongoose');
const { DATASET_STATUSES, DATASET_SOURCES } = require('../config/constants');

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    enum: DATASET_SOURCES,
    required: true,
  },
  fileName: {
    type: String,
    default: null,
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: DATASET_STATUSES,
    default: 'created',
  },
}, {
  timestamps: true,   // auto createdAt + updatedAt
});

module.exports = mongoose.model('Dataset', datasetSchema);
