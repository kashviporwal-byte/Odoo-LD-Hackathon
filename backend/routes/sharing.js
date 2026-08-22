const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

/**
 * @route   POST /api/sharing/:tripId/share
 * @desc    Generate a unique sharing token for a trip
 * @access  Private (Person C)
 */
router.post('/:tripId/share', authMiddleware, async (req, res, next) => {
  const { tripId } = req.params;

  try {
    // Generate secure random sharing token slug
    const token = crypto.randomBytes(8).toString('hex');

    const result = await db.query(
      'UPDATE trips SET share_token = $1 WHERE id = $2 AND user_id = $3 RETURNING share_token',
      [token, tripId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found or unauthorized.' });
    }

    res.status(200).json({
      success: true,
      message: 'Trip shared successfully.',
      data: {
        share_token: result.rows[0].share_token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/sharing/public/:token
 * @desc    Get public read-only trip summary, itinerary route map, and OpenGraph tags
 * @access  Public (Person C)
 */
router.get('/public/:token', async (req, res, next) => {
  const { token } = req.params;

  try {
    // 1. Fetch Trip details
    const tripRes = await db.query(
      'SELECT id, name, start_date, end_date, description, cover_photo_url FROM trips WHERE share_token = $1',
      [token]
    );

    if (tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Shared trip not found.' });
    }

    const trip = tripRes.rows[0];

    // 2. Fetch stops and cities coordinates for Leaflet Route polyline
    const stopsRes = await db.query(
      `SELECT s.id as stop_id, s.city_id, c.name as city_name, c.lat, c.lng
       FROM stops s
       JOIN cities c ON s.city_id = c.id
       WHERE s.trip_id = $1
       ORDER BY s.order_index`,
      [trip.id]
    );
    const route = stopsRes.rows.map(row => ({
      city_id: row.city_id,
      cityName: row.city_name,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng)
    }));

    // 3. Fetch activities linked to the stops
    const activitiesRes = await db.query(
      `SELECT ta.id, ta.stop_id, ta.day_number, ta.time_slot, ta.cost, a.name as activity_name, a.type, s.city_id, c.name as city_name
       FROM trip_activities ta
       JOIN activities a ON ta.activity_id = a.id
       JOIN stops s ON ta.stop_id = s.id
       JOIN cities c ON s.city_id = c.id
       WHERE s.trip_id = $1
       ORDER BY ta.day_number, ta.time_slot`,
      [trip.id]
    );

    // 4. Structure Day-wise layout
    const daysMap = {};
    activitiesRes.rows.forEach(row => {
      const dayKey = row.day_number;
      if (!daysMap[dayKey]) {
        daysMap[dayKey] = {
          date: `Day ${dayKey}`,
          city: row.city_name,
          activities: []
        };
      }
      daysMap[dayKey].activities.push({
        id: row.id,
        time: row.time_slot,
        name: row.activity_name,
        cost: parseFloat(row.cost)
      });
    });

    const days = Object.values(daysMap);

    // 5. Build OG Meta payload
    const ogMeta = {
      title: trip.name,
      description: trip.description || `Check out my travel itinerary for ${trip.name}!`,
      image: trip.cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800'
    };

    res.status(200).json({
      success: true,
      data: {
        trip,
        itinerary: {
          days,
          route
        },
        ogMeta
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/sharing/public/:token/copy
 * @desc    Clone a shared trip (and all stops & activities) into requesting user account
 * @access  Private (Person C)
 */
router.post('/public/:token/copy', authMiddleware, async (req, res, next) => {
  const { token } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch original trip configuration details
    const tripRes = await client.query(
      'SELECT id, name, start_date, end_date, description, cover_photo_url FROM trips WHERE share_token = $1',
      [token]
    );

    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Source trip to clone was not found.' });
    }

    const origTrip = tripRes.rows[0];

    // 2. Create cloned trip row for current user
    const cloneTripRes = await client.query(
      `INSERT INTO trips (user_id, name, start_date, end_date, description, cover_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, `Copy of ${origTrip.name}`, origTrip.start_date, origTrip.end_date, origTrip.description, origTrip.cover_photo_url]
    );
    const newTripId = cloneTripRes.rows[0].id;

    // 3. Fetch original stops
    const stopsRes = await client.query(
      'SELECT id, city_id, start_date, end_date, order_index FROM stops WHERE trip_id = $1',
      [origTrip.id]
    );

    // Duplicate each stop and keep reference of old stop IDs to duplicate activities
    for (const stop of stopsRes.rows) {
      const cloneStopRes = await client.query(
        `INSERT INTO stops (trip_id, city_id, start_date, end_date, order_index)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [newTripId, stop.city_id, stop.start_date, stop.end_date, stop.order_index]
      );
      const newStopId = cloneStopRes.rows[0].id;

      // Fetch original activities linked to this stop
      const activitiesRes = await client.query(
        'SELECT activity_id, day_number, time_slot, cost FROM trip_activities WHERE stop_id = $1',
        [stop.id]
      );

      // Insert duplicate activity rows linked to the new stop
      for (const act of activitiesRes.rows) {
        await client.query(
          `INSERT INTO trip_activities (stop_id, activity_id, day_number, time_slot, cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [newStopId, act.activity_id, act.day_number, act.time_slot, act.cost]
        );
      }
    }

    // 4. Clone Budget config if available
    const budgetRes = await client.query(
      'SELECT transport_cost, stay_cost, activity_cost, meal_cost, total_cost FROM budgets WHERE trip_id = $1',
      [origTrip.id]
    );

    if (budgetRes.rows.length > 0) {
      const b = budgetRes.rows[0];
      await client.query(
        `INSERT INTO budgets (trip_id, transport_cost, stay_cost, activity_cost, meal_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newTripId, b.transport_cost, b.stay_cost, b.activity_cost, b.meal_cost, b.total_cost]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Trip cloned and copied successfully.',
      data: {
        newTripId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
