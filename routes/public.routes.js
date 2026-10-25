const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const prospectController = require('../controllers/prospect.controller');
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const leadController = require('../controllers/lead.controller');
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
      .custom((v) => {
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          throw new Error('Phone number must be complete and include the country code');
        }
        if (digits.startsWith('0')) {
          throw new Error('Phone number must include the country code (do not start with 0)');
        }
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
    body('whatsapp')
      .isString().trim().notEmpty().withMessage('WhatsApp number required')
      .custom((v) => {
        const digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) {
          throw new Error('Phone number must be complete and include the country code');
        }
        if (digits.startsWith('0')) {
          throw new Error('Phone number must include the country code (do not start with 0)');
        }
        return true;
      }),
    body('daysAvailable').isArray({ min: 1 }).withMessage('Pick at least one day'),
    body('daysAvailable.*').isIn(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']),
    body('course').optional().isString(),
    body('yearOfStudy').optional().isString(),
    body('country').optional().isString(),
    body('source').optional().isIn(['instagram', 'tiktok', 'facebook', 'whatsapp', 'direct', 'referral', 'other']),
    body('referralCode').optional().isString()
  ],
  validate,
  prospectController.submitStudent
);

// ---- Lead Magnet ----
router.post(
  '/leads',
  submissionLimiter,
  [
    body('email').isEmail().withMessage('Valid email required')
  ],
  validate,
  leadController.capture
);

// ---- Products ----
router.get('/products', productController.listPublic);
router.get('/products/:id', productController.getPublic);

// ---- Product Reviews ----
router.get('/products/:productId/reviews', reviewController.listPublic);

router.post(
  '/products/:productId/reviews',
  submissionLimiter,
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1–5 required'),
    body('text').isString().trim().isLength({ min: 5, max: 1000 }).withMessage('Review text required')
  ],
  validate,
  reviewController.submit
);

module.exports = router;
