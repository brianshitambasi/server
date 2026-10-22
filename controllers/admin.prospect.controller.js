const Prospect = require('../models/Prospect');
const FollowUp = require('../models/FollowUp');
const CommunicationLog = require('../models/CommunicationLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { scoreProspect } = require('../services/leadScore.service');

exports.listProspects = asyncHandler(async (req, res) => {
  const { status, source, category, q, type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (category) filter.leadCategory = category;
  if (type && ['general', 'student'].includes(type)) filter.prospectType = type;
  if (q) {
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { whatsapp: new RegExp(q, 'i') },
      { 'studentInfo.school': new RegExp(q, 'i') }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Prospect.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(Number(limit)),
    Prospect.countDocuments(filter)
  ]);

  res.json({ success: true, total, page: Number(page), limit: Number(limit), items });
});

exports.createProspect = asyncHandler(async (req, res) => {
  const {
    fullName, whatsapp, email, country,
    preferredContact, lookingFor, previousExperience,
    weeklyTime, wantsExplanation, questionsToClarify,
    source, referralCode
  } = req.body;

  const existing = await Prospect.findOne({ email: (email || '').toLowerCase() });
  if (existing) throw ApiError.conflict('A prospect with this email already exists.');

  const { score, category } = scoreProspect({
    lookingFor, previousExperience, weeklyTime, wantsExplanation, preferredContact
  });

  const prospect = await Prospect.create({
    prospectType: 'general',
    fullName, whatsapp, email, country,
    preferredContact: preferredContact || 'whatsapp',
    lookingFor: lookingFor || 'exploring',
    previousExperience: !!previousExperience,
    weeklyTime: weeklyTime || '',
    wantsExplanation: wantsExplanation || 'yes',
    questionsToClarify: questionsToClarify || '',
    source: source || 'direct',
    referralCode: referralCode || '',
    leadScore: score,
    leadCategory: category,
    status: 'NEW'
  });

  res.status(201).json({
    success: true,
    prospect: { id: prospect._id }
  });
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
  const allowed = ['status', 'notes', 'nextFollowUpDate', 'lastContactedAt', 'leadCategory', 'whatsapp'];
  const patch = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

  if (patch.whatsapp !== undefined) {
    const phone = String(patch.whatsapp).trim();
    const digits = phone.replace(/\D/g, '');
    if (phone && (digits.length < 10 || digits.length > 15 || digits.startsWith('0'))) {
      throw ApiError.badRequest('WhatsApp must be a valid phone number with country code');
    }
    patch.whatsapp = phone;
  }

  const prospect = await Prospect.findById(req.params.id);
  if (!prospect) throw ApiError.notFound('Prospect not found');

  const oldDate = prospect.nextFollowUpDate ? new Date(prospect.nextFollowUpDate) : null;
  const newDate = patch.nextFollowUpDate ? new Date(patch.nextFollowUpDate) : null;
  const dateChanged = newDate && (!oldDate || newDate.toISOString().slice(0, 10) !== oldDate.toISOString().slice(0, 10));

  Object.assign(prospect, patch);
  await prospect.save();

  if (dateChanged) {
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existing = await FollowUp.findOne({
      prospect: prospect._id,
      completed: false,
      dueDate: { $gte: startOfDay, $lt: endOfDay }
    });

    if (!existing) {
      await FollowUp.create({
        prospect: prospect._id,
        dueDate: newDate,
        reason: 'Manual follow-up',
        createdBy: req.user.id
      });
    }
  }

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
