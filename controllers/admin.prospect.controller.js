const Prospect = require('../models/Prospect');
const FollowUp = require('../models/FollowUp');
const CommunicationLog = require('../models/CommunicationLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.listProspects = asyncHandler(async (req, res) => {
  const { status, source, category, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (category) filter.leadCategory = category;
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { whatsapp: new RegExp(q, 'i') }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Prospect.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(Number(limit)),
    Prospect.countDocuments(filter)
  ]);

  res.json({ success: true, total, page: Number(page), limit: Number(limit), items });
});

exports.getProspect = asyncHandler(async (req, res) => {
  const prospect = await Prospect.findById(req.params.id);
  if (!prospect) throw ApiError.notFound('Prospect not found');

  const [followUps, logs] = await Promise.all([
    FollowUp.find({ prospect: prospect._id }).sort({ dueDate: 1 }),
    CommunicationLog.find({ prospect: prospect._id }).sort({ createdAt: -1 })
  ]);

  res.json({ success: true, prospect, followUps, logs });
});

exports.updateProspect = asyncHandler(async (req, res) => {
  const allowed = ['status', 'notes', 'nextFollowUpDate', 'lastContactedAt', 'leadCategory'];
  const patch = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

  const prospect = await Prospect.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!prospect) throw ApiError.notFound('Prospect not found');
  res.json({ success: true, prospect });
});

exports.deleteProspect = asyncHandler(async (req, res) => {
  const prospect = await Prospect.findByIdAndDelete(req.params.id);
  if (!prospect) throw ApiError.notFound('Prospect not found');
  await Promise.all([
    FollowUp.deleteMany({ prospect: prospect._id }),
    CommunicationLog.deleteMany({ prospect: prospect._id })
  ]);
  res.json({ success: true, message: 'Prospect deleted' });
});

exports.addLog = asyncHandler(async (req, res) => {
  const { channel, direction, summary, outcome } = req.body;
  const prospect = await Prospect.findById(req.params.id);
  if (!prospect) throw ApiError.notFound('Prospect not found');

  const log = await CommunicationLog.create({
    prospect: prospect._id,
    channel, direction, summary, outcome,
    createdBy: req.user.id
  });

  prospect.lastContactedAt = new Date();
  await prospect.save();

  res.status(201).json({ success: true, log });
});

exports.createFollowUp = asyncHandler(async (req, res) => {
  const { dueDate, reason } = req.body;
  const prospect = await Prospect.findById(req.params.id);
  if (!prospect) throw ApiError.notFound('Prospect not found');

  const followUp = await FollowUp.create({
    prospect: prospect._id,
    dueDate, reason,
    createdBy: req.user.id
  });

  prospect.nextFollowUpDate = dueDate;
  if (prospect.status === 'NEW') prospect.status = 'FOLLOW_UP';
  await prospect.save();

  res.status(201).json({ success: true, followUp });
});

exports.completeFollowUp = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findByIdAndUpdate(
    req.params.id,
    { completed: true, completedAt: new Date() },
    { new: true }
  );
  if (!followUp) throw ApiError.notFound('Follow-up not found');
  res.json({ success: true, followUp });
});
