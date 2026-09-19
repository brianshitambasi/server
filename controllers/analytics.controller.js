const asyncHandler = require('../utils/asyncHandler');
const { getSourceAnalytics } = require('../services/stats.service');

exports.sources = asyncHandler(async (req, res) => {
  const items = await getSourceAnalytics();
  res.json({ success: true, items });
});
