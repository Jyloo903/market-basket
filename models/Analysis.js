const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: String,
  resultData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  parameters: {
    support: { type: Number, default: 0.1 },
    confidence: { type: Number, default: 0.6 },
    totalTransactions: Number,
    totalRules: Number,
    method: { type: String, default: 'FP-Growth' },
    detectedFormat: { type: String, default: 'legacy' }
  },
  pptPath: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analysis', analysisSchema);