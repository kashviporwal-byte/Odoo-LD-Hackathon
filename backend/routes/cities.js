const express = require('express');
const router = express.Router();
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');
const { seedCities } = require('../scripts/seedCities');

// Allow optional auth for city discovery
router.use(optionalAuthMiddleware);

/**
 * @route   GET /api/cities
 * @desc    Search and filter cities with pagination & sorting (Person B)
 * @access  Private (Person B)
 */
router.get('/', async (req, res, next) => {
  const {
    search = '',
    country = '',
    region = '',
    cost_index,
    sort = 'popularity_desc',
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search.trim()) {
      conditions.push(`(name ILIKE $${paramIndex} OR country ILIKE $${paramIndex} OR region ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (country.trim()) {
      conditions.push(`country ILIKE $${paramIndex}`);
      params.push(`%${country.trim()}%`);
      paramIndex++;
    }

    if (region.trim()) {
      conditions.push(`region ILIKE $${paramIndex}`);
      params.push(`%${region.trim()}%`);
      paramIndex++;
    }

    if (cost_index !== undefined && cost_index !== '') {
      conditions.push(`cost_index = $${paramIndex}`);
      params.push(parseInt(cost_index, 10));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting options
    let orderByClause = 'ORDER BY popularity DESC, name ASC';
    if (sort === 'cost_asc') {
      orderByClause = 'ORDER BY cost_index ASC, popularity DESC';
    } else if (sort === 'cost_desc') {
      orderByClause = 'ORDER BY cost_index DESC, popularity DESC';
    } else if (sort === 'name_asc') {
      orderByClause = 'ORDER BY name ASC';
    } else if (sort === 'popularity_asc') {
      orderByClause = 'ORDER BY popularity ASC';
    }

    // 1. Total count query
    const countSql = `SELECT COUNT(*) as total FROM cities ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // 2. Paginated data query
    const dataSql = `
      SELECT id, name, country, region, lat, lng, cost_index, popularity, image_url, description
      FROM cities
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataResult = await db.query(dataSql, [...params, limitNum, offset]);

    // Ensure lat/lng are clean numbers for Leaflet
    const formattedCities = dataResult.rows.map((c) => ({
      ...c,
      lat: parseFloat(c.lat),
      lng: parseFloat(c.lng),
      cost_index: parseInt(c.cost_index, 10),
      popularity: parseInt(c.popularity, 10),
    }));

    res.status(200).json({
      success: true,
      data: formattedCities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/cities/:id
 * @desc    Get detailed information for a city including its top activities
 * @access  Private (Person B)
 */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const cityResult = await db.query('SELECT * FROM cities WHERE id = $1', [id]);

    if (!cityResult.rows || cityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'City not found.' });
    }

    const city = cityResult.rows[0];

    // Fetch activities for this city
    const activitiesResult = await db.query(
      'SELECT * FROM activities WHERE city_id = $1 ORDER BY cost ASC',
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...city,
        lat: parseFloat(city.lat),
        lng: parseFloat(city.lng),
        activities: activitiesResult.rows.map((a) => ({
          ...a,
          cost: parseFloat(a.cost),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/cities/:cityId/activities
 * @desc    Get filtered activities for a specific city (Direct City Route)
 * @access  Private (Person B)
 */
router.get('/:cityId/activities', async (req, res, next) => {
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
 * @route   POST /api/cities/seed
 * @desc    Seeding script trigger endpoint using OSM Nominatim API
 * @access  Private (Person B)
 */
router.post('/seed', async (req, res, next) => {
  try {
    console.log('[Person B] Nominatim database seeding initiated via API endpoint...');
    const result = await seedCities();

    res.status(200).json({
      success: true,
      message: 'Nominatim database seeding completed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
