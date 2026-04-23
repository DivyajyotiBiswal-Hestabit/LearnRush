module.exports = (err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    code: err.code || "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};