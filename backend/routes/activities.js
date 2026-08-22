const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Secure all activities endpoints
router.use(authMiddleware);

/**
 * @route   GET /api/activities/cities/:cityId
 * @desc    Get filtered activities for a specific city
 * @access  Private (Person B)
 */
router.get('/cities/:cityId', async (req, res, next) => {
  const { cityId } = req.params;
  const { type = '', cost = '', duration = '' } = req.query;

  try {
    // TODO: Person B search db activities by cityId and filters
    // const result = await db.query('SELECT * FROM activities WHERE city_id = $1', [cityId]);

    const mockActivities = [
      { id: 201, city_id: parseInt(cityId), name: 'Eiffel Tower Tour', type: 'sightseeing', cost: 25.00, duration: 120, description: 'Skip the line tickets to the Eiffel Tower summit.', image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400' },
      { id: 202, city_id: parseInt(cityId), name: 'Louvre Museum Visit', type: 'sightseeing', cost: 15.00, duration: 180, description: 'Guided tour around Mona Lisa and museum corridors.', image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400' },
      { id: 203, city_id: parseInt(cityId), name: 'Pizza Cooking Class', type: 'food', cost: 45.00, duration: 150, description: 'Learn to bake authentic Italian pizzas.', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400' }
    ];

    let filtered = mockActivities;
    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }

    res.status(200).json({
      success: true,
      data: filtered
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/activities/stops/:stopId
 * @desc    Link an activity to a specific stop on the itinerary
 * @access  Private (Person B)
 */
router.post('/stops/:stopId', async (req, res, next) => {
  const { stopId } = req.params;
  const { activity_id, day_number, time_slot, cost } = req.body;

  try {
    if (!activity_id || day_number === undefined || !time_slot) {
      return res.status(400).json({ success: false, error: 'activity_id, day_number, and time_slot are required.' });
    }

    // TODO: Person B insert activity mapping into `trip_activities` SQL table
    // NOTE: Coordinate with Person C to trigger budget recalculation on-demand!
    
    res.status(201).json({
      success: true,
      message: 'Activity linked to stop successfully.',
      data: {
        id: 888, // Mock ID
        stop_id: parseInt(stopId),
        activity_id,
        day_number,
        time_slot,
        cost: cost || 0.00
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/activities/stops/:stopId/activities/:activityId
 * @desc    Remove/Unlink an activity from a stop
 * @access  Private (Person B)
 */
router.delete('/stops/:stopId/activities/:activityId', async (req, res, next) => {
  const { stopId, activityId } = req.params;

  try {
    // TODO: Person B delete matching row in `trip_activities` SQL table
    // NOTE: Coordinate with Person C to trigger budget recalculation on-demand!

    res.status(200).json({
      success: true,
      message: `Activity ${activityId} unlinked from stop ${stopId}.`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
