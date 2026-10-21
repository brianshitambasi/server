const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isString().isLength({ min: 6 }).withMessage('Password required')
  ],
  validate,
  authController.login
);

router.post(
  '/2fa/setup',
  [body('setupToken').isString().notEmpty()],
  validate,
  authController.setup2FA
);

router.post(
  '/2fa/enable',
  [
    body('setupToken').isString().notEmpty(),
    body('code').isString().trim().isLength({ min: 6, max: 6 }).withMessage('6-digit code required')
  ],
  validate,
  authController.enable2FA
);

router.post(
  '/2fa/verify',
  [
    body('preAuthToken').isString().notEmpty(),
    body('code').isString().trim().notEmpty()
  ],
  validate,
  authController.verify2FA
);

router.get('/me', auth, authController.me);

module.exports = router;
