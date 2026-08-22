const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Protected city routes
router.use(authMiddleware);

/**
 * @route   GET /api/cities
 * @desc    Search and filter cities with pagination
 * @access  Private (Person B)
 */
router.get('/', async (req, res, next) => {
  const { search = '', country = '', region = '', page = 1, limit = 10 } = req.query;

  try {
    // TODO: Person B write parameterized Postgres search queries using LIMIT and OFFSET:
    // const result = await db.query('SELECT * FROM cities WHERE name ILIKE $1 AND country ILIKE $2 AND region ILIKE $3 LIMIT $4 OFFSET $5', ...);

    const mockCities = [
      { id: 1, name: 'Paris', country: 'France', region: 'Europe', lat: 48.8566, lng: 2.3522, cost_index: 3, popularity: 5, image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400' },
      { id: 2, name: 'Tokyo', country: 'Japan', region: 'Asia', lat: 35.6762, lng: 139.6503, cost_index: 3, popularity: 5, image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400' },
      { id: 3, name: 'Rome', country: 'Italy', region: 'Europe', lat: 41.9028, lng: 12.4964, cost_index: 2, popularity: 4, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400' },
      { id: 4, name: 'New York', country: 'United States', region: 'North America', lat: 40.7128, lng: -74.0060, cost_index: 3, popularity: 5, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400' }
    ];

    // Filter mocks based on search queries
    let filtered = mockCities;
    if (search) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (country) {
      filtered = filtered.filter(c => c.country.toLowerCase().includes(country.toLowerCase()));
    }

    res.status(200).json({
      success: true,
      data: filtered,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length
      }
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
    // TODO: Person B implement OSM Nominatim loop:
    // 1. Loop static list of popular cities
    // 2. Fetch lat/lng from: https://nominatim.openstreetmap.org/search?format=json&q=City,Country
    // 3. Insert results into `cities` SQL table

    console.log('Seeding endpoint invoked. Nominatim seeding loop logic should be implemented by Person B.');

    res.status(200).json({
      success: true,
      message: 'Nominatim database seeding initiated. (Implement script to see progress in stdout logs)'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
