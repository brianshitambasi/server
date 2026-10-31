const Lead = require('../models/Lead');
const asyncHandler = require('../utils/asyncHandler');
const { sendLeadMagnet } = require('../services/mail.service');

exports.capture = asyncHandler(async (req, res) => {
  const { email, name, source, leadType } = req.body;

  const lead = await Lead.findOneAndUpdate(
    { email: email.toLowerCase(), leadType: leadType || 'free_guide' },
    {
      email: email.toLowerCase(),
      name: name || '',
      source: source || 'direct',
      leadType: leadType || 'free_guide'
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Force the email to send and log it
  console.log('Attempting to send free guide to:', email);
  
  if (sendLeadMagnet) {
    sendLeadMagnet(lead)
      .then(() => console.log('Email process finished successfully'))
      .catch((err) => console.error('Email process failed:', err.message));
  } else {
    console.error('sendLeadMagnet function is missing!');
  }

  res.status(201).json({ success: true, message: 'Thank you — check your inbox.' });
});

exports.listAdmin = asyncHandler(async (req, res) => {
  const items = await Lead.find({}).sort({ downloadedAt: -1 }).limit(1000);
  res.json({ success: true, items });
});
