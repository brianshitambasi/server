const Prospect = require('../models/Prospect');
const FollowUp = require('../models/FollowUp');
const asyncHandler = require('../utils/asyncHandler');
const { getDashboardStats } = require('../services/stats.service');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

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
  const items = await FollowUp.find({
    completed: false,
    dueDate: { $gte: startOfDay(now), $lte: endOfDay(now) }
  })
    .populate('prospect', 'fullName email whatsapp status leadCategory prospectType')
    .sort({ dueDate: 1 });
  res.json({ success: true, items });
});

exports.upcoming = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = addDays(startOfDay(now), 1);
  const end = addDays(startOfDay(now), 8);
  const items = await FollowUp.find({
    completed: false,
    dueDate: { $gte: start, $lt: end }
  })
    .populate('prospect', 'fullName email whatsapp status leadCategory prospectType')
    .sort({ dueDate: 1 });
  res.json({ success: true, items });
});

// NEW — grouped view for the enhanced Follow-ups page
exports.grouped = asyncHandler(async (req, res) => {
  const { channel, prospectType } = req.query;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const tomorrowEnd = endOfDay(tomorrowStart);
  const weekStart = addDays(todayStart, 2);
  const weekEnd = endOfDay(addDays(todayStart, 7));
  const completedSince = addDays(todayStart, -7);

  // Base match — incomplete by default; completed only for the last group
  const baseIncomplete = { completed: false };
  if (channel) baseIncomplete.channel = channel; // ignored if field missing on FollowUp

  const populateOpts = 'fullName email whatsapp status leadCategory prospectType studentInfo';

  const [overdue, today, tomorrow, thisWeek, later, completed] = await Promise.all([
    FollowUp.find({ ...baseIncomplete, dueDate: { $lt: todayStart } })
      .populate('prospect', populateOpts).sort({ dueDate: 1 }).limit(200),

    FollowUp.find({ ...baseIncomplete, dueDate: { $gte: todayStart, $lte: todayEnd } })
      .populate('prospect', populateOpts).sort({ dueDate: 1 }).limit(200),

    FollowUp.find({ ...baseIncomplete, dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd } })
      .populate('prospect', populateOpts).sort({ dueDate: 1 }).limit(200),

    FollowUp.find({ ...baseIncomplete, dueDate: { $gte: weekStart, $lte: weekEnd } })
      .populate('prospect', populateOpts).sort({ dueDate: 1 }).limit(200),

    FollowUp.find({ ...baseIncomplete, dueDate: { $gt: weekEnd } })
      .populate('prospect', populateOpts).sort({ dueDate: 1 }).limit(200),

    FollowUp.find({ completed: true, completedAt: { $gte: completedSince } })
      .populate('prospect', populateOpts).sort({ completedAt: -1 }).limit(100)
  ]);

  const filterType = (rows) => {
    if (!prospectType) return rows;
    return rows.filter((r) => r.prospect && r.prospect.prospectType === prospectType);
  };

  res.json({
    success: true,
    groups: {
      overdue: filterType(overdue),
      today: filterType(today),
      tomorrow: filterType(tomorrow),
      thisWeek: filterType(thisWeek),
      later: filterType(later),
      completed: filterType(completed)
    },
    counts: {
      overdue: filterType(overdue).length,
      today: filterType(today).length,
      tomorrow: filterType(tomorrow).length,
      thisWeek: filterType(thisWeek).length,
      later: filterType(later).length,
      completed: filterType(completed).length
    }
  });
});

// NEW — snooze an incomplete follow-up by N days
exports.snoozeFollowUp = asyncHandler(async (req, res) => {
  const { days } = req.body;
  const n = Number(days);
  if (!Number.isFinite(n) || n < 1 || n > 60) {
    return res.status(400).json({ success: false, message: 'days must be 1–60' });
  }

  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });

  const base = followUp.dueDate && followUp.dueDate > new Date() ? followUp.dueDate : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + n);

  followUp.dueDate = next;
  await followUp.save();

  // Keep the prospect's nextFollowUpDate in sync if this is the earliest pending one
  if (followUp.prospect) {
    const earliest = await FollowUp.findOne({
      prospect: followUp.prospect,
      completed: false
    }).sort({ dueDate: 1 });
    if (earliest) {
      await Prospect.findByIdAndUpdate(followUp.prospect, { nextFollowUpDate: earliest.dueDate });
    }
  }

  res.json({ success: true, followUp });
});
