const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Secure all endpoints in this router
router.use(authMiddleware);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (Person A)
 */
router.get('/me', async (req, res, next) => {
  try {
    // TODO: Person A retrieve user details by ID
    // const result = await db.query('SELECT id, name, email, photo_url, language_pref, role, created_at FROM users WHERE id = $1', [req.user.id]);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          name: 'Demo Traveler',
          email: req.user.email,
          photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
          language_pref: 'en',
          role: req.user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile settings
 * @access  Private (Person A)
 */
router.put('/me', async (req, res, next) => {
  const { name, photo_url, email, language_pref } = req.body;

  try {
    // TODO: Person A implement database update
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully (Stub).',
      data: {
        user: {
          id: req.user.id,
          name: name || 'Demo Traveler',
          email: email || req.user.email,
          photo_url: photo_url || null,
          language_pref: language_pref || 'en',
          role: req.user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account (cascades trips deletion)
 * @access  Private (Person A)
 */
router.delete('/me', async (req, res, next) => {
  try {
    // TODO: Person A implement cascade delete users
    // await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    
    res.status(200).json({
      success: true,
      message: 'User account and all related data deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/me/saved-destinations
 * @desc    Get user's list of saved cities
 * @access  Private (Person A)
 */
router.get('/me/saved-destinations', async (req, res, next) => {
  try {
    // TODO: Person A query saved destination list
    // Mock response of saved destination cities
    const savedCities = [
      { id: 1, name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400' },
      { id: 2, name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400' }
    ];

    res.status(200).json({
      success: true,
      data: savedCities
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
