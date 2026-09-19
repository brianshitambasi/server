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

router.get('/me', auth, authController.me);

module.exports = router;
