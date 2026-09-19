const ApiError = require('../utils/ApiError');

module.exports = function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(ApiError.forbidden('Forbidden'));
    }
    next();
  };
};
