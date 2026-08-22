const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_super_secret_token_12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public (Person A)
 */
router.post('/signup', authLimiter, async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    // 2. Hash password and save (mock/template logic)
    // TODO: Person A replace with database insert:
    // const salt = await bcrypt.genSalt(10);
    // const hash = await bcrypt.hash(password, salt);
    // const result = await db.query('INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email, role', [name, email, hash]);

    console.log(`Signup request received for: ${email}`);

    // Standard Success Response
    res.status(201).json({
      success: true,
      message: 'User registered successfully (Stub). Ready for Person A database insert implementation.',
      data: {
        user: {
          id: 999, // Stub ID
          name,
          email,
          role: 'user'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get JWT
 * @access  Public (Person A)
 */
router.post('/login', authLimiter, async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password.' });
    }

    // TODO: Person A fetch user from db, compare hashes with bcrypt
    // const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    // const user = result.rows[0];
    // if (!user || !(await bcrypt.compare(password, user.password_hash))) { return error; }

    console.log(`Login request received for: ${email}`);

    // Create JWT Token
    const payload = {
      id: 999, // Mock ID
      email: email,
      role: 'user' // Default to user (can be admin)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: 'Login successful (Stub). Ready for Person A db verify implementation.',
      data: {
        token,
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token
 * @access  Public (Person A)
 */
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide an email address.' });
    }

    // TODO: Person A generate token, save in DB or console log for hackathon stub
    const resetToken = 'stub_reset_token_67890';
    console.log(`PASSWORD RESET: Token for ${email} is: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent (stub log generated in server console).'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public (Person A)
 */
router.post('/reset-password', authLimiter, async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide token and new password.' });
    }

    // TODO: Person A verify reset token from DB, update user hash
    console.log(`Reset password request processed for token: ${token}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
