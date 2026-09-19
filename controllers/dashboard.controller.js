const Prospect = require('../models/Prospect');
const FollowUp = require('../models/FollowUp');
const asyncHandler = require('../utils/asyncHandler');
const { getDashboardStats } = require('../services/stats.service');

exports.stats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.json({ success: true, stats });
});

exports.recentProspects = asyncHandler(async (req, res) => {
  const items = await Prospect.find({}).sort({ submittedAt: -1 }).limit(10);
  res.json({ success: true, items });
});

exports.dueToday = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const items = await FollowUp.find({
    completed: false,
    dueDate: { $gte: startOfDay, $lt: endOfDay }
  })
    .populate('prospect', 'fullName email whatsapp status leadCategory')
    .sort({ dueDate: 1 });

  res.json({ success: true, items });
});

exports.upcoming = asyncHandler(async (req, res) => {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const inSevenDays = new Date(endOfToday);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const items = await FollowUp.find({
    completed: false,
    dueDate: { $gte: endOfToday, $lt: inSevenDays }
  })
    .populate('prospect', 'fullName email whatsapp status leadCategory')
    .sort({ dueDate: 1 });

  res.json({ success: true, items });
});
