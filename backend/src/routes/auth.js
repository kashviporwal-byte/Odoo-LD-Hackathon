const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  googleLogin,
} = require('../controllers/auth');

const validate = require('../middleware/validate');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../utils/validation');

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    data: null,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/google', authLimiter, googleLogin);

module.exports = router;
