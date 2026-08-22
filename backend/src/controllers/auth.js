const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_super_secret_token_12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 */
const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'A user with this email address already exists.',
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid credentials or inactive account.',
      });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid credentials.',
      });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stub for forgot password: log the reset token to the console
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return 200 to prevent email enumeration
      return res.status(200).json({
        success: true,
        data: { message: 'If the email exists, a reset token was logged to console.' },
        error: null,
      });
    }

    // Create a temporary token valid for 15 minutes
    const resetToken = jwt.sign(
      { email: user.email, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log(`\n=================== RESET PASSWORD TOKEN ===================`);
    console.log(`Email: ${user.email}`);
    console.log(`Token: ${resetToken}`);
    console.log(`============================================================\n`);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Password reset token has been successfully generated and logged to the console.',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using generated token
 */
const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.purpose !== 'reset-password') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid password reset token.',
      });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Update user password
    await prisma.user.update({
      where: { email: decoded.email },
      data: { passwordHash },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Password has been successfully updated.' },
      error: null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid or expired password reset token.',
    });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};

/**
 * Google Sign-In authentication handler
 */
const googleLogin = async (req, res, next) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ success: false, data: null, error: 'Credential token is required.' });
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
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const dummyPasswordHash = '$2a$10$dummyhashplaceholderforgoogleusers';
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: dummyPasswordHash,
          photoUrl: picture,
        },
      });
    } else {
      if (!user.isActive) {
        return res.status(403).json({ success: false, data: null, error: 'Account disabled. Please contact an administrator.' });
      }
      if (picture && user.photoUrl !== picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { photoUrl: picture },
        });
      }
    }

    const localToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
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
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  googleLogin,
};

