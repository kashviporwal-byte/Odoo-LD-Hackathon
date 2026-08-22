const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');
const { assembleItinerary, assembleCalendarEvents } = require('../services/itineraryService');
const { buildRouteArray, buildRouteGeoJSON } = require('../services/mapService');

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

    // Insert trip details in Postgres
    const result = await db.query(
      `INSERT INTO trips (user_id, name, start_date, end_date, description, cover_photo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        name,
        start_date,
        end_date,
        description || null,
        cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800',
      ]
    );

    const trip = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Trip created successfully.',
      data: {
        trip,
      },
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
      `SELECT t.*, COUNT(s.id) as destination_count
       FROM trips t
       LEFT JOIN stops s ON t.id = s.trip_id
       WHERE t.user_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows.map((t) => ({
        ...t,
        destination_count: parseInt(t.destination_count || 0, 10),
      })),
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
    const result = await db.query('SELECT * FROM trips WHERE id = $1', [id]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        trip: result.rows[0],
      },
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
  const { name, start_date, end_date, description, cover_photo_url } = req.body;

  try {
    const result = await db.query(
      `UPDATE trips
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           description = COALESCE($4, description),
           cover_photo_url = COALESCE($5, cover_photo_url)
       WHERE id = $6
       RETURNING *`,
      [name, start_date, end_date, description, cover_photo_url, id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      data: {
        trip: result.rows[0],
      },
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
    const result = await db.query('DELETE FROM trips WHERE id = $1 RETURNING id', [id]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Trip ${id} deleted successfully.`,
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

    const fileUrl = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800';

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully (Mock Cloudinary URL generated).',
      cover_photo_url: fileUrl,
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
 * @desc    Add a city stop to a trip (Screen 5 & Screen 7 "Add to Trip")
 * @access  Private (Person B)
 */
router.post('/:tripId/stops', async (req, res, next) => {
  const { tripId } = req.params;
  const { city_id, start_date, end_date, order_index } = req.body;

  try {
    if (!city_id) {
      return res.status(400).json({ success: false, error: 'city_id is required.' });
    }

    // Verify trip exists
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }
    const trip = tripRes.rows[0];

    // Determine next order_index if not supplied
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderRes = await db.query(
        'SELECT COALESCE(MAX(order_index) + 1, 0) as next_order FROM stops WHERE trip_id = $1',
        [tripId]
      );
      finalOrderIndex = parseInt(maxOrderRes.rows[0].next_order, 10);
    }

    // Default dates from trip if omitted
    const finalStartDate = start_date || trip.start_date;
    const finalEndDate = end_date || trip.end_date;

    const insertSql = `
      INSERT INTO stops (trip_id, city_id, start_date, end_date, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const insertRes = await db.query(insertSql, [
      parseInt(tripId, 10),
      parseInt(city_id, 10),
      finalStartDate,
      finalEndDate,
      finalOrderIndex,
    ]);

    const stop = insertRes.rows[0];

    // Fetch joined city info for Leaflet map & UI rendering
    const cityRes = await db.query('SELECT * FROM cities WHERE id = $1', [city_id]);
    const city = cityRes.rows[0] || null;

    res.status(201).json({
      success: true,
      message: 'Stop added to itinerary.',
      data: {
        stop: {
          ...stop,
          city_name: city ? city.name : null,
          country: city ? city.country : null,
          lat: city ? parseFloat(city.lat) : null,
          lng: city ? parseFloat(city.lng) : null,
          image_url: city ? city.image_url : null,
          cost_index: city ? city.cost_index : null,
        },
      },
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
  const { tripId, stopId } = req.params;
  const { start_date, end_date, city_id } = req.body;

  try {
    const fields = [];
    const params = [parseInt(stopId, 10), parseInt(tripId, 10)];
    let paramIndex = 3;

    if (start_date !== undefined) {
      fields.push(`start_date = $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date !== undefined) {
      fields.push(`end_date = $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (city_id !== undefined) {
      fields.push(`city_id = $${paramIndex}`);
      params.push(parseInt(city_id, 10));
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No update fields provided.' });
    }

    const updateSql = `
      UPDATE stops
      SET ${fields.join(', ')}
      WHERE id = $1 AND trip_id = $2
      RETURNING *
    `;
    const result = await db.query(updateSql, params);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Stop dates updated.',
      data: {
        stop: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/trips/:tripId/stops/:stopId
 * @desc    Remove a stop from itinerary and resequence remaining stops
 * @access  Private (Person B)
 */
router.delete('/:tripId/stops/:stopId', async (req, res, next) => {
  const { tripId, stopId } = req.params;

  try {
    const deleteSql = 'DELETE FROM stops WHERE id = $1 AND trip_id = $2 RETURNING id';
    const deleteRes = await db.query(deleteSql, [parseInt(stopId, 10), parseInt(tripId, 10)]);

    if (!deleteRes.rows || deleteRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found.' });
    }

    // Resequence order_index for clean sequential indexes 0, 1, 2...
    await db.query(
      `WITH ranked AS (
         SELECT id, ROW_NUMBER() OVER (ORDER BY order_index, id) - 1 AS new_order
         FROM stops
         WHERE trip_id = $1
       )
       UPDATE stops
       SET order_index = ranked.new_order
       FROM ranked
       WHERE stops.id = ranked.id`,
      [parseInt(tripId, 10)]
    );

    res.status(200).json({
      success: true,
      message: `Stop ${stopId} removed from itinerary.`,
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
  const { tripId } = req.params;
  const { stops, stopIds } = req.body;

  try {
    // Supports either [{ id: 501, order_index: 0 }] OR [501, 502, 503]
    let orderedList = [];

    if (Array.isArray(stops)) {
      orderedList = stops.map((s, idx) => ({
        id: s.id,
        order_index: s.order_index !== undefined ? s.order_index : idx,
      }));
    } else if (Array.isArray(stopIds)) {
      orderedList = stopIds.map((id, idx) => ({
        id: parseInt(id, 10),
        order_index: idx,
      }));
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide stops array or stopIds array.',
      });
    }

    for (const item of orderedList) {
      await db.query(
        'UPDATE stops SET order_index = $1 WHERE id = $2 AND trip_id = $3',
        [item.order_index, item.id, parseInt(tripId, 10)]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Itinerary stop order index updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trips/:tripId/itinerary
 * @desc    Get aggregated Day-wise itinerary and Leaflet route polyline path (Screen 6)
 * @access  Private (Person B)
 */
router.get('/:tripId/itinerary', async (req, res, next) => {
  const { tripId } = req.params;

  try {
    // 1. Fetch Trip details
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }
    const trip = tripRes.rows[0];

    // 2. Fetch Stops with joined City coordinates
    const stopsSql = `
      SELECT s.id, s.trip_id, s.city_id, s.start_date, s.end_date, s.order_index,
             c.name AS city_name, c.country, c.region, c.lat, c.lng, c.cost_index, c.popularity, c.image_url
      FROM stops s
      JOIN cities c ON s.city_id = c.id
      WHERE s.trip_id = $1
      ORDER BY s.order_index ASC
    `;
    const stopsRes = await db.query(stopsSql, [tripId]);
    const stops = stopsRes.rows;

    // 3. Fetch Trip Activities joined with Activities
    const actSql = `
      SELECT ta.id, ta.stop_id, ta.activity_id, ta.day_number, ta.time_slot, ta.cost, ta.custom_name, ta.notes,
             a.name AS activity_name, a.type, a.duration, a.description, a.image_url
      FROM trip_activities ta
      LEFT JOIN activities a ON ta.activity_id = a.id
      JOIN stops s ON ta.stop_id = s.id
      WHERE s.trip_id = $1
      ORDER BY ta.day_number ASC, ta.id ASC
    `;
    const actRes = await db.query(actSql, [tripId]);
    const tripActivities = actRes.rows;

    // 4. Assemble Day-wise structured itinerary
    const assembled = assembleItinerary(trip, stops, tripActivities);

    // 5. Generate Leaflet map route array and GeoJSON
    const route = buildRouteArray(stops);
    const geoJson = buildRouteGeoJSON(stops);

    res.status(200).json({
      success: true,
      data: {
        ...assembled,
        route,
        geoJson,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/trips/:tripId/calendar
 * @desc    Get timeline calendar data structure for FullCalendar / UI timeline (Screen 10)
 * @access  Private (Person B)
 */
router.get('/:tripId/calendar', async (req, res, next) => {
  const { tripId } = req.params;

  try {
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (!tripRes.rows || tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }
    const trip = tripRes.rows[0];

    const stopsRes = await db.query(
      `SELECT s.*, c.name as city_name, c.country, c.lat, c.lng, c.image_url
       FROM stops s
       JOIN cities c ON s.city_id = c.id
       WHERE s.trip_id = $1
       ORDER BY s.order_index ASC`,
      [tripId]
    );

    const actRes = await db.query(
      `SELECT ta.*, a.name AS activity_name, a.type, a.duration, a.description, a.image_url
       FROM trip_activities ta
       LEFT JOIN activities a ON ta.activity_id = a.id
       JOIN stops s ON ta.stop_id = s.id
       WHERE s.trip_id = $1
       ORDER BY ta.day_number ASC`,
      [tripId]
    );

    const calendarEvents = assembleCalendarEvents(trip, stopsRes.rows, actRes.rows);

    res.status(200).json({
      success: true,
      data: calendarEvents,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/trips/:tripId/activities/:id
 * @desc    Quick move activity to different day / time slot (Screen 10 drag-and-drop)
 * @access  Private (Person B)
 */
router.patch('/:tripId/activities/:id', async (req, res, next) => {
  const { tripId, id } = req.params;
  const { day_number, time_slot, stop_id, cost } = req.body;

  try {
    const fields = [];
    const params = [parseInt(id, 10)];
    let paramIndex = 2;

    if (day_number !== undefined) {
      fields.push(`day_number = $${paramIndex}`);
      params.push(parseInt(day_number, 10));
      paramIndex++;
    }

    if (time_slot !== undefined) {
      fields.push(`time_slot = $${paramIndex}`);
      params.push(time_slot);
      paramIndex++;
    }

    if (stop_id !== undefined) {
      fields.push(`stop_id = $${paramIndex}`);
      params.push(parseInt(stop_id, 10));
      paramIndex++;
    }

    if (cost !== undefined) {
      fields.push(`cost = $${paramIndex}`);
      params.push(parseFloat(cost));
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No update parameters provided.' });
    }

    const updateSql = `
      UPDATE trip_activities
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(updateSql, params);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip activity not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Activity moved successfully.',
      data: {
        ...result.rows[0],
        cost: parseFloat(result.rows[0].cost),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
