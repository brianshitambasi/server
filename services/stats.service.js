const Prospect = require('../models/Prospect');
const FollowUp = require('../models/FollowUp');

async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [totalProspects, newProspects, highInterest, followUpsDueToday, bySourceAgg] =
    await Promise.all([
      Prospect.countDocuments({}),
      Prospect.countDocuments({ status: 'NEW' }),
      Prospect.countDocuments({ leadCategory: 'HIGH_INTEREST' }),
      FollowUp.countDocuments({
        completed: false,
        dueDate: { $gte: startOfDay, $lt: endOfDay }
      }),
      Prospect.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

  const bySource = bySourceAgg.reduce((acc, row) => {
    acc[row._id || 'direct'] = row.count;
    return acc;
  }, {});

  return { totalProspects, newProspects, highInterest, followUpsDueToday, bySource };
}

async function getSourceAnalytics() {
  const rows = await Prospect.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  return rows.map((r) => ({ source: r._id || 'direct', count: r.count }));
}

module.exports = { getDashboardStats, getSourceAnalytics };
