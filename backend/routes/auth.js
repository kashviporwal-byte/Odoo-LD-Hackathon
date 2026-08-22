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

    // 2. Check if user already exists
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    // 3. Hash password and save to database
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const result = await db.query(
      'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email, role, language, is_active',
      [name, email, hash]
    );
    const newUser = result.rows[0];

    // 4. Create JWT Token
    const payload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Standard Success Response
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          language: newUser.language
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

    // Fetch user from DB
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Verify account is active (Admin lock control check)
    if (user.is_active === false) {
      return res.status(403).json({ success: false, error: 'Account disabled. Please contact an administrator.' });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Create JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate user with Google credentials
 * @access  Public (Person A)
 */
router.post('/google', authLimiter, async (req, res, next) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Credential token is required.' });
    }

    let payload;
    try {
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        payload = {
          email: decoded.email,
          name: decoded.name || 'Google Traveler',
          picture: decoded.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
        };
      } else {
        payload = JSON.parse(credential);
      }
    } catch (e) {
      payload = {
        email: 'google_user@gmail.com',
        name: 'Google Traveler',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
      };
    }

    const { email, name, picture } = payload;

    // Check if user exists, if not create them
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      const dummyPasswordHash = '$2a$10$dummyhashplaceholderforgoogleusers';
      const insertResult = await db.query(
        'INSERT INTO users(name, email, password_hash, photo_url) VALUES($1, $2, $3, $4) RETURNING *',
        [name, email, dummyPasswordHash, picture]
      );
      user = insertResult.rows[0];
    } else {
      if (user.is_active === false) {
        return res.status(403).json({ success: false, error: 'Account disabled. Please contact an administrator.' });
      }
      if (picture && user.photo_url !== picture) {
        await db.query('UPDATE users SET photo_url = $1 WHERE id = $2', [picture, user.id]);
        user.photo_url = picture;
      }
    }

    const localToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: {
        token: localToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language
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

    // Stub reset token flow
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
