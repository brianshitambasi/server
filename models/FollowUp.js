const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true, index: true },
    dueDate: { type: Date, required: true },
    reason: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FollowUp', followUpSchema);
