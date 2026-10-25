const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: '' },
    source: { type: String, default: 'direct' },
    leadType: {
      type: String,
      enum: ['free_guide', 'newsletter', 'other'],
      default: 'free_guide'
    },
    downloadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

leadSchema.index({ email: 1, leadType: 1 }, { unique: true });

module.exports = mongoose.model('Lead', leadSchema);
