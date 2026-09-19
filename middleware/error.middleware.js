function notFound(req, res, next) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: err.message || 'Server error'
  });
}

module.exports = { notFound, errorHandler };
