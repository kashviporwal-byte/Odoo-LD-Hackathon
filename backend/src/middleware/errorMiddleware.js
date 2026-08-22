/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  if (isDevelopment && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
