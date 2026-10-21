const Prospect = require('../models/Prospect');
const Product = require('../models/Product');
const FollowUp = require('../models/FollowUp');
const CommunicationLog = require('../models/CommunicationLog');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

exports.download = asyncHandler(async (req, res) => {
  const [prospects, products, followups, logs, reviews] = await Promise.all([
    Prospect.find({}).lean(),
    Product.find({}).lean(),
    FollowUp.find({}).lean(),
    CommunicationLog.find({}).lean(),
    Review.find({}).lean()
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.id,
    version: '1.0',
    counts: {
      prospects: prospects.length,
      products: products.length,
      followups: followups.length,
      communicationLogs: logs.length,
      reviews: reviews.length
    },
    data: { prospects, products, followups, communicationLogs: logs, reviews }
  };

  const filename = `yobbytech-backup-${new Date().toISOString().slice(0, 10)}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(backup, null, 2));
});
