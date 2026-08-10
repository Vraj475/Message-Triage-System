const mongoose = require('mongoose');

const triageSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['billing', 'technical', 'complaint', 'refund', 'account', 'inquiry', 'spam', 'unclear'],
    required: true
  },
  priority: {
    type: String,
    enum: ['P0', 'P1', 'P2', 'P3'],
    required: true
  },
  summary: { type: String, required: true },
  suggested_action: { type: String, required: true },
  needs_human: { type: Boolean, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true }
}, { _id: false });

const metaSchema = new mongoose.Schema({
  tokens_input: { type: Number, default: 0 },
  tokens_output: { type: Number, default: 0 },
  cost_usd: { type: Number, default: 0 },
  latency_ms: { type: Number, default: 0 }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  raw_text: { type: String, required: true },
  batch_id: { type: String, required: true, index: true },
  is_garbage: { type: Boolean, default: false },
  triage: { type: triageSchema, required: true },
  meta: { type: metaSchema, default: () => ({}) },
  error: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
