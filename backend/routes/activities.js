const express = require('express');
const router = express.Router();
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');
const { seedActivities } = require('../scripts/seedActivities');

// Allow optional auth for activities exploration
router.use(optionalAuthMiddleware);

/**
 * @route   GET /api/activities/cities/:cityId
 * @desc    Get filtered activities for a specific city
 * @access  Private (Person B)
 */
router.get('/cities/:cityId', async (req, res, next) => {
  const { cityId } = req.params;
  const { type = '', maxCost, maxDuration, search = '' } = req.query;

  try {
    const conditions = ['city_id = $1'];
    const params = [parseInt(cityId, 10)];
    let paramIndex = 2;

    if (type.trim()) {
      conditions.push(`type ILIKE $${paramIndex}`);
      params.push(type.trim());
      paramIndex++;
    }

    if (maxCost !== undefined && maxCost !== '') {
      conditions.push(`cost <= $${paramIndex}`);
      params.push(parseFloat(maxCost));
      paramIndex++;
    }

    if (maxDuration !== undefined && maxDuration !== '') {
      conditions.push(`duration <= $${paramIndex}`);
      params.push(parseInt(maxDuration, 10));
      paramIndex++;
    }

    if (search.trim()) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const sql = `
      SELECT id, city_id, name, type, cost, duration, description, image_url
      FROM activities
      ${whereClause}
      ORDER BY cost ASC, name ASC
    `;

    const result = await db.query(sql, params);

    const formatted = result.rows.map((a) => ({
      ...a,
      cost: parseFloat(a.cost),
      duration: parseInt(a.duration, 10),
    }));

    res.status(200).json({
      success: true,
      data: formatted,
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
  const { activity_id, day_number = 1, time_slot = 'morning', cost, custom_name, notes } = req.body;

  try {
    if (!activity_id && !custom_name) {
      return res.status(400).json({
        success: false,
        error: 'Either activity_id or custom_name is required.',
      });
    }

    // Verify stop exists
    const stopCheck = await db.query('SELECT id, trip_id FROM stops WHERE id = $1', [stopId]);
    if (!stopCheck.rows || stopCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found.' });
    }

    let finalCost = cost !== undefined ? parseFloat(cost) : 0.00;

    // Pull default cost from activities table if not provided
    if (activity_id && cost === undefined) {
      const actCheck = await db.query('SELECT cost, name FROM activities WHERE id = $1', [activity_id]);
      if (actCheck.rows && actCheck.rows.length > 0) {
        finalCost = parseFloat(actCheck.rows[0].cost || 0);
      }
    }

    const insertSql = `
      INSERT INTO trip_activities (stop_id, activity_id, day_number, time_slot, cost, custom_name, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const insertResult = await db.query(insertSql, [
      parseInt(stopId, 10),
      activity_id ? parseInt(activity_id, 10) : null,
      parseInt(day_number, 10) || 1,
      time_slot || 'morning',
      finalCost,
      custom_name || null,
      notes || null,
    ]);

    const created = insertResult.rows[0];

    // Fetch rich activity details
    let activityDetails = null;
    if (created.activity_id) {
      const actRes = await db.query('SELECT * FROM activities WHERE id = $1', [created.activity_id]);
      if (actRes.rows.length > 0) {
        activityDetails = actRes.rows[0];
      }
    }

    res.status(201).json({
      success: true,
      message: 'Activity linked to stop successfully.',
      data: {
        ...created,
        cost: parseFloat(created.cost),
        activity: activityDetails,
      },
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
    // Allows deleting by either trip_activities.id (primary key) OR activity_id
    const deleteSql = `
      DELETE FROM trip_activities 
      WHERE stop_id = $1 AND (id = $2 OR activity_id = $2)
      RETURNING id
    `;
    const result = await db.query(deleteSql, [parseInt(stopId, 10), parseInt(activityId, 10)]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Activity not found on stop ${stopId}.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Activity unlinked from stop ${stopId}.`,
      data: { deletedId: result.rows[0].id },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/activities/trip-activities/:id
 * @desc    Update a booked activity's day, time slot, notes, or cost
 * @access  Private (Person B)
 */
router.patch('/trip-activities/:id', async (req, res, next) => {
  const { id } = req.params;
  const { day_number, time_slot, cost, notes, custom_name } = req.body;

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

    if (cost !== undefined) {
      fields.push(`cost = $${paramIndex}`);
      params.push(parseFloat(cost));
      paramIndex++;
    }

    if (notes !== undefined) {
      fields.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }

    if (custom_name !== undefined) {
      fields.push(`custom_name = $${paramIndex}`);
      params.push(custom_name);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided for update.' });
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
      message: 'Trip activity updated successfully.',
      data: {
        ...result.rows[0],
        cost: parseFloat(result.rows[0].cost),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/activities/seed
 * @desc    Seeding script trigger endpoint for Activities
 * @access  Private (Person B)
 */
router.post('/seed', async (req, res, next) => {
  try {
    console.log('[Person B] Activities database seeding initiated via API endpoint...');
    const result = await seedActivities();

    res.status(200).json({
      success: true,
      message: 'Activities database seeding completed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
