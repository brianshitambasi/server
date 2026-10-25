const Prospect = require('../models/Prospect');
const asyncHandler = require('../utils/asyncHandler');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

exports.sources = asyncHandler(async (req, res) => {
  const rows = await Prospect.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  res.json({
    success: true,
    items: rows.map((r) => ({ source: r._id || 'direct', count: r.count }))
  });
});

// NEW — full analytics payload for the charts page
exports.overview = asyncHandler(async (req, res) => {
  const now = new Date();
  const days = 14;
  const from = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  const [bySource, byStatus, byCategory, byType, dailyRaw, total] = await Promise.all([
    Prospect.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Prospect.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Prospect.aggregate([
      { $group: { _id: '$leadCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Prospect.aggregate([
      { $group: { _id: '$prospectType', count: { $sum: 1 } } }
    ]),
    Prospect.aggregate([
      { $match: { submittedAt: { $gte: from } } },
      {
        $group: {
          _id: {
            y: { $year: '$submittedAt' },
            m: { $month: '$submittedAt' },
            d: { $dayOfMonth: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]),
    Prospect.countDocuments({})
  ]);

  // Build a continuous 14-day series (fill missing days with 0)
  const daily = [];
  const map = new Map();
  dailyRaw.forEach((row) => {
    const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}-${String(row._id.d).padStart(2, '0')}`;
    map.set(key, row.count);
  });
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    daily.push({ date: key, count: map.get(key) || 0 });
  }

  res.json({
    success: true,
    total,
    bySource: bySource.map((r) => ({ key: r._id || 'direct', count: r.count })),
    byStatus: byStatus.map((r) => ({ key: r._id || 'unknown', count: r.count })),
    byCategory: byCategory.map((r) => ({ key: r._id || 'unknown', count: r.count })),
    byType: byType.map((r) => ({ key: r._id || 'general', count: r.count })),
    daily
  });
});

// NEW — Referral Leaderboard
exports.referrals = asyncHandler(async (req, res) => {
  const rows = await Prospect.aggregate([
    { $match: { referralCode: { $ne: '', $exists: true } } },
    { $group: { _id: '$referralCode', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  res.json({
    success: true,
    items: rows.map((r) => ({ code: r._id, count: r.count }))
  });
});
