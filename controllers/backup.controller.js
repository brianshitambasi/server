const Prospect = require('../models/Prospect');
const Product = require('../models/Product');
const FollowUp = require('../models/FollowUp');
const CommunicationLog = require('../models/CommunicationLog');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const xlsx = require('xlsx');

exports.download = asyncHandler(async (req, res) => {
  const [prospects, products, followups, logs, reviews] = await Promise.all([
    Prospect.find({}).lean(),
    Product.find({}).lean(),
    FollowUp.find({}).lean(),
    CommunicationLog.find({}).lean(),
    Review.find({}).lean()
  ]);

  const wb = xlsx.utils.book_new();

  const createSheet = (data, sheetName) => {
    const cleanData = data.map(item => {
      const { __v, ...rest } = item;
      return rest;
    });
    if (cleanData.length === 0) cleanData.push({ Info: "No data found" });
    
    const ws = xlsx.utils.json_to_sheet(cleanData);
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
  };

  createSheet(prospects, 'Prospects');
  createSheet(products, 'Products');
  createSheet(followups, 'FollowUps');
  createSheet(logs, 'CommunicationLogs');
  createSheet(reviews, 'Reviews');

  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `yobbytech-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
});
