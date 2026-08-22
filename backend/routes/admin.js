const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Secure all admin endpoints with both JWT auth and admin checks
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/admin/stats
 * @desc    Get aggregate stats (total trips, user count, trip trends)
 * @access  Private/Admin (Person C)
 */
router.get('/stats', async (req, res, next) => {
  try {
    // 1. Get total users count
    const usersCountRes = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCountRes.rows[0].count) || 0;

    // 2. Get total trips count
    const tripsCountRes = await db.query('SELECT COUNT(*) as count FROM trips');
    const totalTrips = parseInt(tripsCountRes.rows[0].count) || 0;

    // 3. Get registration timeline trend (last 10 days)
    const trendRes = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM trips 
       GROUP BY DATE(created_at) 
       ORDER BY DATE(created_at) DESC 
       LIMIT 10`
    );
    const tripsTrend = trendRes.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));

    res.status(200).json({
      success: true,
      data: {
        totalTrips,
        totalUsers,
        tripsTrend
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/top-cities
 * @desc    Get top most-added cities across all itineraries
 * @access  Private/Admin (Person C)
 */
router.get('/top-cities', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.name as city_name, c.country, COUNT(s.id) as count
       FROM stops s
       JOIN cities c ON s.city_id = c.id
       GROUP BY c.name, c.country
       ORDER BY count DESC
       LIMIT 5`
    );

    res.status(200).json({
      success: true,
      data: result.rows.map(row => ({
        city: row.city_name,
        country: row.country,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/top-activities
 * @desc    Get top most-booked activities
 * @access  Private/Admin (Person C)
 */
router.get('/top-activities', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT a.name as activity_name, a.type, COUNT(ta.id) as count
       FROM trip_activities ta
       JOIN activities a ON ta.activity_id = a.id
       GROUP BY a.name, a.type
       ORDER BY count DESC
       LIMIT 5`
    );

    res.status(200).json({
      success: true,
      data: result.rows.map(row => ({
        name: row.activity_name,
        type: row.type,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users list along with their created trip counts
 * @access  Private/Admin (Person C)
 */
router.get('/users', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, COUNT(t.id) as trips_count
       FROM users u
       LEFT JOIN trips t ON u.id = t.user_id
       GROUP BY u.id, u.name, u.email, u.role
       ORDER BY u.id`
    );

    res.status(200).json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        tripsCount: parseInt(row.trips_count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Toggle role authorization between user and admin
 * @access  Private/Admin (Person C)
 */
router.patch('/users/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE users 
       SET role = CASE WHEN role = 'admin' THEN 'user' ELSE 'admin' END 
       WHERE id = $1 
       RETURNING id, name, email, role`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'User privileges updated successfully.',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
