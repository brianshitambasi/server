const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const prospectController = require('../controllers/prospect.controller');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { submissionLimiter } = require('../middleware/rateLimit.middleware');

// ---- General prospects ----
router.post(
  '/prospects',
  submissionLimiter,
  [
    body('fullName').isString().trim().isLength({ min: 2 }).withMessage('Full name required'),
    body('whatsapp')
      .isString().trim().notEmpty().withMessage('WhatsApp number required')
      .matches(/^[0-9+\-\s()]+$/).withMessage('WhatsApp must contain digits only')
      .custom((v) => {
        const digits = v.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) throw new Error('WhatsApp must be 7–15 digits');
        return true;
      }),
    body('email').isEmail().withMessage('Valid email required'),
    body('country').optional().isString(),
    body('preferredContact').optional().isIn(['whatsapp', 'phone', 'email']),
    body('lookingFor').optional().isIn(['extra_income', 'business_opportunity', 'personal_development', 'networking', 'exploring']),
    body('previousExperience').optional().isBoolean().toBoolean(),
    body('weeklyTime').optional().isString(),
    body('wantsExplanation').optional().isIn(['yes', 'maybe', 'not_now']),
    body('questionsToClarify').optional().isString(),
    body('source').optional().isIn(['instagram', 'tiktok', 'facebook', 'whatsapp', 'direct', 'referral', 'other']),
    body('referralCode').optional().isString()
  ],
  validate,
  prospectController.submitProspect
);

// ---- Students ----
router.post(
  '/students',
  submissionLimiter,
  [
    body('fullName').isString().trim().isLength({ min: 2 }).withMessage('Full name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('school').isString().trim().isLength({ min: 2 }).withMessage('School required'),
    body('daysAvailable').isArray({ min: 1 }).withMessage('Pick at least one day'),
    body('daysAvailable.*').isIn(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']),
    body('course').optional().isString(),
    body('yearOfStudy').optional().isString(),
    body('whatsapp')
      .optional({ checkFalsy: true })
      .isString().trim()
      .matches(/^[0-9+\-\s()]*$/).withMessage('WhatsApp must contain digits only'),
    body('country').optional().isString(),
    body('source').optional().isIn(['instagram', 'tiktok', 'facebook', 'whatsapp', 'direct', 'referral', 'other']),
    body('referralCode').optional().isString()
  ],
  validate,
  prospectController.submitStudent
);

router.get('/products', productController.listPublic);
router.get('/products/:id', productController.getPublic);

module.exports = router;
