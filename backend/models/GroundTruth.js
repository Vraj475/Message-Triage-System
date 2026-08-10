const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  category: { type: String },
  priority: { type: String },
  needs_human: { type: Boolean }
}, { _id: false });

const groundTruthSchema = new mongoose.Schema({
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    unique: true   // one ground truth label per message
  },
  raw_text: { type: String, required: true },
  human_label: { type: labelSchema, required: true },
  ai_decision: { type: labelSchema, required: true },
  ai_confidence: { type: Number },
  agrees_category: { type: Boolean },
  agrees_priority: { type: Boolean },
  agrees_human_flag: { type: Boolean },
  created_at: { type: Date, default: Date.now }
});

// Auto-compute agreement fields before saving
groundTruthSchema.pre('save', function (next) {
  this.agrees_category = this.human_label.category === this.ai_decision.category;
  this.agrees_priority = this.human_label.priority === this.ai_decision.priority;
  this.agrees_human_flag = this.human_label.needs_human === this.ai_decision.needs_human;
  next();
});

module.exports = mongoose.model('GroundTruth', groundTruthSchema);
