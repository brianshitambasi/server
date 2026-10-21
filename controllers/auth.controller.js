const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Short-lived token used between password step and 2FA step
function signPreAuth(user, purpose) {
  return jwt.sign(
    { id: user._id.toString(), purpose },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
}

function verifyPreAuth(token, purpose) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== purpose) throw new Error('wrong purpose');
    return decoded;
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

// ---------- LOGIN ----------
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  // 2FA already enabled → ask for code
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    return res.json({
      success: true,
      requires2FA: true,
      preAuthToken: signPreAuth(user, '2fa-login')
    });
  }

  // 2FA not enabled → ask them to set it up (first-time only)
  return res.json({
    success: true,
    requiresSetup: true,
    setupToken: signPreAuth(user, '2fa-setup')
  });
});

// ---------- 2FA: SETUP (generate secret + QR) ----------
exports.setup2FA = asyncHandler(async (req, res) => {
  const { setupToken } = req.body;
  const decoded = verifyPreAuth(setupToken, '2fa-setup');

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('User not found');
  if (user.twoFactorEnabled) throw ApiError.badRequest('2FA already enabled');

  // Generate new secret
  const secret = speakeasy.generateSecret({
    name: `BRIAN — CEO TNT (${user.email})`,
    issuer: 'BRIAN — CEO TNT',
    length: 20
  });

  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    qr: qrDataUrl,
    secret: secret.base32 // so they can enter manually if camera fails
  });
});

// ---------- 2FA: ENABLE (verify code + activate) ----------
exports.enable2FA = asyncHandler(async (req, res) => {
  const { setupToken, code } = req.body;
  const decoded = verifyPreAuth(setupToken, '2fa-setup');

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('User not found');
  if (!user.twoFactorSecret) throw ApiError.badRequest('Run setup first');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: String(code).trim(),
    window: 1
  });
  if (!verified) throw ApiError.badRequest('Invalid code — check the time on your phone');

  // Generate 10 single-use recovery codes
  const codes = [];
  for (let i = 0; i < 10; i += 1) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  const hashedCodes = await Promise.all(codes.map((c) => User.hashPassword(c)));

  user.twoFactorEnabled = true;
  user.recoveryCodes = hashedCodes;
  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: '2FA enabled',
    recoveryCodes: codes,
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// ---------- 2FA: VERIFY (normal login) ----------
exports.verify2FA = asyncHandler(async (req, res) => {
  const { preAuthToken, code } = req.body;
  const decoded = verifyPreAuth(preAuthToken, '2fa-login');

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('User not found');

  const token = String(code).trim();
  let verified = false;

  // Try TOTP code first
  verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1
  });

  // If TOTP failed, try recovery codes
  if (!verified) {
    const bcrypt = require('bcryptjs');
    for (let i = 0; i < user.recoveryCodes.length; i += 1) {
      const match = await bcrypt.compare(token, user.recoveryCodes[i]);
      if (match) {
        user.recoveryCodes.splice(i, 1);
        verified = true;
        break;
      }
    }
  }

  if (!verified) throw ApiError.unauthorized('Invalid code');

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

// ---------- ME ----------
exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -twoFactorSecret -recoveryCodes');
  if (!user) throw ApiError.unauthorized('User not found');
  res.json({ success: true, user });
});
