const mongoose = require('mongoose');

const prospectSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    country: { type: String, default: '' },
    preferredContact: {
      type: String,
      enum: ['whatsapp', 'phone', 'email'],
      default: 'whatsapp'
    },
    lookingFor: {
      type: String,
      enum: ['extra_income', 'business_opportunity', 'personal_development', 'networking', 'exploring'],
      default: 'exploring'
    },
    previousExperience: { type: Boolean, default: false },
    weeklyTime: { type: String, default: '' },
    wantsExplanation: {
      type: String,
      enum: ['yes', 'maybe', 'not_now'],
      default: 'maybe'
    },
    questionsToClarify: { type: String, default: '' },

    source: {
      type: String,
      enum: ['instagram', 'tiktok', 'facebook', 'whatsapp', 'direct', 'referral', 'other'],
      default: 'direct'
    },
    referralCode: { type: String, default: '' },

    leadScore: { type: Number, default: 0 },
    leadCategory: {
      type: String,
      enum: ['HIGH_INTEREST', 'EXPLORING', 'FOLLOW_UP', 'NOT_READY'],
      default: 'NOT_READY'
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'QUALIFIED', 'NOT_INTERESTED', 'JOINED'],
      default: 'NEW'
    },

    notes: { type: String, default: '' },
    nextFollowUpDate: { type: Date },
    lastContactedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

prospectSchema.index({ email: 1 });
prospectSchema.index({ source: 1 });
prospectSchema.index({ status: 1 });
prospectSchema.index({ leadCategory: 1 });
prospectSchema.index({ nextFollowUpDate: 1 });

module.exports = mongoose.model('Prospect', prospectSchema);
