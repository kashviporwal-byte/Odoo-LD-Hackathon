require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Log API requests in development environment
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy!' });
});

// API Routes Mounting
app.use('/api', apiRoutes);

// Global Error Handler Middleware (must be after routes)
app.use(errorHandler);

// Listen to incoming connections
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`GlobeTrotter Backend API running!`);
  console.log(`Port:    ${PORT}`);
  console.log(`Mode:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health:  http://localhost:${PORT}/health`);
  console.log(`========================================`);
});

module.exports = app;
