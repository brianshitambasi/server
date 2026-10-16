const Prospect = require('../models/Prospect');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { scoreProspect, scoreStudent } = require('../services/leadScore.service');

exports.submitProspect = asyncHandler(async (req, res) => {
  const {
    fullName, whatsapp, email, country,
    preferredContact, lookingFor, previousExperience,
    weeklyTime, wantsExplanation, questionsToClarify,
    source, referralCode
  } = req.body;

  const existing = await Prospect.findOne({ email: (email || '').toLowerCase() });
  if (existing) throw ApiError.conflict('A submission with this email already exists.');

  const { score, category } = scoreProspect({
    lookingFor, previousExperience, weeklyTime, wantsExplanation, preferredContact
  });

  const prospect = await Prospect.create({
    prospectType: 'general',
    fullName, whatsapp, email, country,
    preferredContact, lookingFor,
    previousExperience: !!previousExperience,
    weeklyTime, wantsExplanation, questionsToClarify,
    source: source || 'direct',
    referralCode: referralCode || '',
    leadScore: score,
    leadCategory: category,
    status: 'NEW'
  });

  res.status(201).json({
    success: true,
    message: 'Thank you. We will be in touch.',
    prospect: {
      id: prospect._id,
      leadCategory: prospect.leadCategory,
      status: prospect.status
    }
  });
});

exports.submitStudent = asyncHandler(async (req, res) => {
  const {
    fullName, email, whatsapp,
    school, daysAvailable, course, yearOfStudy,
    country, source, referralCode
  } = req.body;

  const existing = await Prospect.findOne({ email: (email || '').toLowerCase() });
  if (existing) throw ApiError.conflict('A submission with this email already exists.');

  const { score, category } = scoreStudent({ daysAvailable, yearOfStudy, course });

  const prospect = await Prospect.create({
    prospectType: 'student',
    fullName,
    email,
    whatsapp: whatsapp || '',
    country: country || '',
    preferredContact: 'whatsapp',
    lookingFor: 'business_opportunity',
    previousExperience: false,
    weeklyTime: `${(daysAvailable || []).length} day(s) per week`,
    wantsExplanation: 'yes',
    studentInfo: {
      school: school || '',
      daysAvailable: daysAvailable || [],
      course: course || '',
      yearOfStudy: yearOfStudy || ''
    },
    source: source || 'direct',
    referralCode: referralCode || '',
    leadScore: score,
    leadCategory: category,
    status: 'NEW'
  });

  res.status(201).json({
    success: true,
    message: 'Thank you. We will be in touch.',
    prospect: {
      id: prospect._id,
      leadCategory: prospect.leadCategory,
      status: prospect.status
    }
  });
});
