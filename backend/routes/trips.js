const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Multer memory storage configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all trip endpoints
router.use(authMiddleware);

// ==========================================
// 🧑💻 PERSON A — Trip CRUD & Photo Uploads
// ==========================================

/**
 * @route   POST /api/trips
 * @desc    Create a new trip
 * @access  Private (Person A)
 */
router.post('/', async (req, res, next) => {
  const { name, start_date, end_date, description, cover_photo_url } = req.body;

  try {
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'Name, start date, and end date are required.' });
    }

    const defaultCover = cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800';

    // 1. Insert trip details
    const result = await db.query(
      `INSERT INTO trips(user_id, name, start_date, end_date, description, cover_photo_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, to_char(start_date, 'YYYY-MM-DD') as start_date, to_char(end_date, 'YYYY-MM-DD') as end_date, description, cover_photo_url, is_public, share_slug`,
      [req.user.id, name, start_date, end_date, description, defaultCover]
    );
    const newTrip = result.rows[0];

    // 2. Initialize default budget row for Person C
    await db.query(
      `INSERT INTO budgets(trip_id, transport_cost, stay_cost, activities_cost, meals_cost, currency) 
       VALUES ($1, 0.00, 0.00, 0.00, 0.00, 'USD')`,
      [newTrip.id]
    );

    res.status(201).json({
      success: true,
      message: 'Trip created successfully.',
      data: {
        trip: newTrip
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trips
 * @desc    Get all trips of the logged-in user with summary stats
 * @access  Private (Person A)
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.id, t.name, to_char(t.start_date, 'YYYY-MM-DD') as start_date, to_char(t.end_date, 'YYYY-MM-DD') as end_date, 
              t.description, t.cover_photo_url, t.is_public, t.share_slug, 
              COALESCE(COUNT(s.id)::int, 0) as destination_count 
       FROM trips t 
       LEFT JOIN stops s ON t.id = s.trip_id 
       WHERE t.user_id = $1 
       GROUP BY t.id 
       ORDER BY t.start_date ASC`,
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

/**
 * @route   GET /api/trips/:id
 * @desc    Get details of a specific trip
 * @access  Private (Person A)
 */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Fetch trip
    const tripResult = await db.query(
      `SELECT id, user_id, name, to_char(start_date, 'YYYY-MM-DD') as start_date, to_char(end_date, 'YYYY-MM-DD') as end_date, 
              description, cover_photo_url, is_public, share_slug 
       FROM trips 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }

    const trip = tripResult.rows[0];
    trip.share_token = trip.share_slug; // compatibility mapping

    // 2. Fetch stops for this trip, including city details (maps to route array on frontend)
    const stopsResult = await db.query(
      `SELECT s.id, s.trip_id, s.city_id, s.stop_order as order_index, 
              to_char(s.arrival_date, 'YYYY-MM-DD') as start_date, 
              to_char(s.departure_date, 'YYYY-MM-DD') as end_date,
              c.name as "cityName", c.country, c.lat, c.lng, c.image_url, c.region, c.cost_index, c.popularity
       FROM stops s
       JOIN cities c ON s.city_id = c.id
       WHERE s.trip_id = $1
       ORDER BY s.stop_order ASC`,
      [id]
    );

    // 3. Fetch budget
    const budgetResult = await db.query(
      `SELECT id, trip_id, transport_cost, stay_cost, activities_cost, meals_cost, currency 
       FROM budgets 
       WHERE trip_id = $1`,
      [id]
    );
    const budget = budgetResult.rows[0] || {
      transport_cost: 0.00,
      stay_cost: 0.00,
      activities_cost: 0.00,
      meals_cost: 0.00,
      currency: 'USD'
    };

    // 4. Fetch activities for these stops
    const stopIds = stopsResult.rows.map(s => s.id);
    let activities = [];
    if (stopIds.length > 0) {
      const actResult = await db.query(
        `SELECT ta.id, ta.stop_id, ta.activity_id, ta.day_number, ta.time_slot, ta.cost, 
                to_char(ta.scheduled_date, 'YYYY-MM-DD') as scheduled_date, ta.scheduled_time, ta.cost_override, ta.notes,
                a.name, a.category, a.description, a.image_url, a.est_cost, a.est_duration_mins
         FROM trip_activities ta
         JOIN activities a ON ta.activity_id = a.id
         WHERE ta.stop_id = ANY($1)`,
        [stopIds]
      );
      activities = actResult.rows;
    }

    // Nest activities into stops
    const stopsWithActivities = stopsResult.rows.map(stop => ({
      ...stop,
      activities: activities.filter(act => act.stop_id === stop.id)
    }));

    res.status(200).json({
      success: true,
      data: {
        trip,
        stops: stopsWithActivities,
        budget
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/trips/:id
 * @desc    Edit a trip's details
 * @access  Private (Person A)
 */
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, start_date, end_date, description, cover_photo_url, is_public, share_slug } = req.body;

  try {
    const currentTripRes = await db.query('SELECT * FROM trips WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (currentTripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }

    const current = currentTripRes.rows[0];
    const newName = name !== undefined ? name : current.name;
    const newStart = start_date !== undefined ? start_date : current.start_date;
    const newEnd = end_date !== undefined ? end_date : current.end_date;
    const newDesc = description !== undefined ? description : current.description;
    const newCover = cover_photo_url !== undefined ? cover_photo_url : current.cover_photo_url;
    const newPublic = is_public !== undefined ? is_public : current.is_public;
    const newSlug = share_slug !== undefined ? share_slug : current.share_slug;

    const result = await db.query(
      `UPDATE trips 
       SET name = $1, start_date = $2, end_date = $3, description = $4, cover_photo_url = $5, is_public = $6, share_slug = $7
       WHERE id = $8 AND user_id = $9 
       RETURNING id, name, to_char(start_date, 'YYYY-MM-DD') as start_date, to_char(end_date, 'YYYY-MM-DD') as end_date, description, cover_photo_url, is_public, share_slug`,
      [newName, newStart, newEnd, newDesc, newCover, newPublic, newSlug, id, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      data: {
        trip: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete a trip
 * @access  Private (Person A)
 */
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM trips WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Trip ${id} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/trips/upload-cover
 * @desc    Upload trip cover photo
 * @access  Private (Person A)
 */
router.post('/upload-cover', upload.single('cover'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a image file.' });
    }

    // Returning a stock URL for simple local simulation
    const fileUrl = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800';

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      cover_photo_url: fileUrl
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 🧑💻 PERSON B — Itinerary Builder / Stops
// ==========================================

/**
 * @route   POST /api/trips/:tripId/stops
 * @desc    Add a city stop to a trip
 * @access  Private (Person B)
 */
router.post('/:tripId/stops', async (req, res, next) => {
  const { tripId } = req.params;
  const { city_id, start_date, end_date, order_index } = req.body;

  try {
    if (!city_id || order_index === undefined) {
      return res.status(400).json({ success: false, error: 'City ID and order index are required.' });
    }

    // TODO: Person B insert stop in db
    res.status(201).json({
      success: true,
      message: 'Stop added to itinerary.',
      data: {
        stop: {
          id: 501, // Mock Stop ID
          trip_id: parseInt(tripId),
          city_id,
          start_date,
          end_date,
          order_index
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/trips/:tripId/stops/:stopId
 * @desc    Edit stop details (dates, etc)
 * @access  Private (Person B)
 */
router.put('/:tripId/stops/:stopId', async (req, res, next) => {
  const { stopId } = req.params;
  const { start_date, end_date } = req.body;

  try {
    // TODO: Person B update DB row dates
    res.status(200).json({
      success: true,
      message: 'Stop dates updated.',
      data: {
        stopId: parseInt(stopId),
        start_date,
        end_date
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/trips/:tripId/stops/:stopId
 * @desc    Remove a stop from itinerary
 * @access  Private (Person B)
 */
router.delete('/:tripId/stops/:stopId', async (req, res, next) => {
  const { stopId } = req.params;

  try {
    // TODO: Person B delete stop row
    res.status(200).json({
      success: true,
      message: `Stop ${stopId} removed from itinerary.`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/trips/:tripId/stops/reorder
 * @desc    Update stop ordering (drag-and-drop sort)
 * @access  Private (Person B)
 */
router.patch('/:tripId/stops/reorder', async (req, res, next) => {
  const { stops } = req.body; // Expects array: [{ id: 501, order_index: 0 }, { id: 502, order_index: 1 }]

  try {
    if (!stops || !Array.isArray(stops)) {
      return res.status(400).json({ success: false, error: 'Stops reorder array is required.' });
    }

    // TODO: Person B loop through and update order_index values inside database
    console.log(`Reordered stops inside trip: ${JSON.stringify(stops)}`);

    res.status(200).json({
      success: true,
      message: 'Itinerary stop order index updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trips/:tripId/itinerary
 * @desc    Get aggregated Day-wise itinerary and Leaflet route polyline path
 * @access  Private (Person B)
 */
router.get('/:tripId/itinerary', async (req, res, next) => {
  const { tripId } = req.params;

  try {
    // TODO: Person B write aggregate logic to compile stops, cities, activities:
    // Helper buildRouteGeoJSON(stops) can be written inside helper file.

    const mockItinerary = {
      days: [
        {
          date: '2026-07-01',
          city: 'Paris',
          activities: [
            { id: 201, time: '10:00 AM', name: 'Eiffel Tower Tour', cost: 25.00 },
            { id: 202, time: '02:00 PM', name: 'Louvre Museum Visit', cost: 15.00 }
          ]
        },
        {
          date: '2026-07-05',
          city: 'Rome',
          activities: [
            { id: 203, time: '11:00 AM', name: 'Colosseum Guided Tour', cost: 30.00 }
          ]
        }
      ],
      route: [
        { lat: 48.8566, lng: 2.3522, cityName: 'Paris' },
        { lat: 41.9028, lng: 12.4964, cityName: 'Rome' }
      ]
    };

    res.status(200).json({
      success: true,
      data: mockItinerary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trips/:tripId/calendar
 * @desc    Get timeline calendar data structure
 * @access  Private (Person B)
 */
router.get('/:tripId/calendar', async (req, res, next) => {
  const { tripId } = req.params;

  try {
    // TODO: Person B map stops & trip_activities into a calendar UI grid structure
    const mockCalendarData = [
      { id: 201, title: 'Eiffel Tower Tour', start: '2026-07-01T10:00:00', end: '2026-07-01T12:00:00', cost: 25.00 },
      { id: 202, title: 'Louvre Museum Visit', start: '2026-07-01T14:00:00', end: '2026-07-01T17:00:00', cost: 15.00 },
      { id: 203, title: 'Colosseum Guided Tour', start: '2026-07-05T11:00:00', end: '2026-07-05T14:00:00', cost: 30.00 }
    ];

    res.status(200).json({
      success: true,
      data: mockCalendarData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/trips/:tripId/activities/:id
 * @desc    Quick move activity to different day / time
 * @access  Private (Person B)
 */
router.patch('/:tripId/activities/:id', async (req, res, next) => {
  const { id } = req.params;
  const { day_number, time_slot } = req.body;

  try {
    if (day_number === undefined || !time_slot) {
      return res.status(400).json({ success: false, error: 'day_number and time_slot are required.' });
    }

    // TODO: Person B update trip_activities row for day_number and time_slot (supports Calendar drag/drop)
    res.status(200).json({
      success: true,
      message: 'Activity moved successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
