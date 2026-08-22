const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

/**
 * @route   POST /api/sharing/:tripId/share
 * @desc    Generate unique share token for a trip (Person C)
 */
router.post('/:tripId/share', authMiddleware, async (req, res, next) => {
  try {
    // TODO: Person C generate unique token and save to database
    res.status(200).json({
      success: true,
      data: {
        share_token: 'stub_share_token_123'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/sharing/public/:token
 * @desc    Get public read-only trip itinerary (Person C - Public route, no auth)
 */
router.get('/public/:token', async (req, res, next) => {
  try {
    // TODO: Person C retrieve trip and itinerary by token (read-only)
    res.status(200).json({
      success: true,
      message: 'Public read-only trip data stub.',
      data: {
        trip: {},
        itinerary: {},
        ogMeta: { title: 'GlobeTrotter Itinerary', description: 'Check out my trip!' }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/sharing/public/:token/copy
 * @desc    Clone/copy a shared trip to the requesting user's account (Person C)
 */
router.post('/public/:token/copy', authMiddleware, async (req, res, next) => {
  try {
    // TODO: Person C duplicate trip, stops, and activities for req.user.id
    res.status(201).json({
      success: true,
      message: 'Trip cloned successfully into account.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
