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
    const result = await db.query(
      'SELECT id, name, email, photo_url, language, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const dbUser = result.rows[0];

    if (!dbUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          photo_url: dbUser.photo_url,
          language: dbUser.language,
          language_pref: dbUser.language,
          role: dbUser.role
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
  const { name, photo_url, email, language, language_pref } = req.body;
  const langVal = language || language_pref;

  try {
    const checkUser = await db.query('SELECT name, email, photo_url, language FROM users WHERE id = $1', [req.user.id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const current = checkUser.rows[0];
    const newName = name !== undefined ? name : current.name;
    const newEmail = email !== undefined ? email : current.email;
    const newPhotoUrl = photo_url !== undefined ? photo_url : current.photo_url;
    const newLang = langVal !== undefined ? langVal : current.language;

    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, photo_url = $3, language = $4 WHERE id = $5 RETURNING id, name, email, photo_url, language, role',
      [newName, newEmail, newPhotoUrl, newLang, req.user.id]
    );
    const updatedUser = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          photo_url: updatedUser.photo_url,
          language: updatedUser.language,
          language_pref: updatedUser.language,
          role: updatedUser.role
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
    const result = await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    
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
    const result = await db.query(
      `SELECT DISTINCT c.id, c.name, c.country, c.lat, c.lng, c.region, c.image_url, c.cost_index, c.popularity
       FROM cities c
       JOIN stops s ON s.city_id = c.id
       JOIN trips t ON s.trip_id = t.id
       WHERE t.user_id = $1`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
