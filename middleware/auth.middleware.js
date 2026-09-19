const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(ApiError.unauthorized('Authentication required'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};
