const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema(
  {
    prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true, index: true },
    channel: {
      type: String,
      enum: ['whatsapp', 'call', 'email', 'meeting', 'other'],
      default: 'whatsapp'
    },
    direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
    summary: { type: String, default: '' },
    outcome: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);
