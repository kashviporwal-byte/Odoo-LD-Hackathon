const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Secure all admin endpoints with both JWT auth and admin privileges checks
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/admin/stats
 * @desc    Get metrics (total trips, users count, trend) (Person C)
 */
router.get('/stats', async (req, res, next) => {
  try {
    // TODO: Person C run aggregate count queries
    res.status(200).json({
      success: true,
      data: {
        totalTrips: 0,
        totalUsers: 0,
        tripsTrend: []
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/top-cities
 * @desc    Get most-added cities (Person C)
 */
router.get('/top-cities', async (req, res, next) => {
  try {
    // TODO: Person C fetch popular cities count
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/top-activities
 * @desc    Get most-booked activities (Person C)
 */
router.get('/top-activities', async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get list of all users and activity status (Person C)
 */
router.get('/users', async (req, res, next) => {
  try {
    // TODO: Person C list user data
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Enable/disable user account (Person C)
 */
router.patch('/users/:id', async (req, res, next) => {
  try {
    // TODO: Person C toggle user active state
    res.status(200).json({
      success: true,
      message: 'User status updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
