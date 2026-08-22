require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/globetrotter',
});

async function run() {
  console.log('==============================================');
  console.log('🚀 Seeding Comprehensive Dummy Data for GlobeTrotter');
  console.log('==============================================');

  const client = await pool.connect();
  try {
    // 1. Ensure schema table columns compatibility
    console.log('1. Checking and harmonizing schema columns...');
    
    await client.query(`
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_token VARCHAR(255);
      ALTER TABLE stops ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
      ALTER TABLE stops ADD COLUMN IF NOT EXISTS start_date DATE;
      ALTER TABLE stops ADD COLUMN IF NOT EXISTS end_date DATE;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS type VARCHAR(100);
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0.00;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
      ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255);
    `);

    // 2. Clean old data for fresh seed
    console.log('2. Resetting data tables...');
    await client.query('TRUNCATE TABLE trip_activities, activities, stops, budgets, trips, cities, users RESTART IDENTITY CASCADE;');

    // 3. Seed Users
    console.log('3. Seeding demo users...');
    const hashedUserPw = await bcrypt.hash('password123', 10);
    const hashedAdminPw = await bcrypt.hash('admin123', 10);

    const userRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, language, photo_url, is_active) VALUES
      ('Demo Traveler', 'traveler@odoo.com', $1, 'user', 'en', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80', TRUE),
      ('System Administrator', 'admin@odoo.com', $2, 'admin', 'en', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', TRUE),
      ('Alex Wanderer', 'alex@globe.io', $1, 'user', 'en', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80', TRUE),
      ('Priya Sharma', 'priya@globe.io', $1, 'user', 'en', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80', TRUE),
      ('Marco Rossi', 'marco@globe.io', $1, 'user', 'it', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', TRUE)
      RETURNING id, email, name;
    `, [hashedUserPw, hashedAdminPw]);

    const travelerUser = userRes.rows.find(u => u.email === 'traveler@odoo.com') || userRes.rows[0];
    const alexUser = userRes.rows.find(u => u.email === 'alex@globe.io') || userRes.rows[2];
    console.log(`✅ Seeded ${userRes.rows.length} demo users.`);

    // 4. Seed Cities
    console.log('4. Seeding curated global destinations...');
    const rawCitiesPath = path.join(__dirname, 'data', 'rawCities.json');
    const rawCities = JSON.parse(fs.readFileSync(rawCitiesPath, 'utf8'));

    const cityMap = {}; // name -> id
    for (const c of rawCities) {
      const res = await client.query(`
        INSERT INTO cities (name, country, region, lat, lng, cost_index, popularity, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name;
      `, [c.name, c.country, c.region || 'World', c.lat, c.lng, c.cost_index || 2, c.popularity || 80, c.image_url]);
      cityMap[c.name.toLowerCase()] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${rawCities.length} global cities.`);

    // 5. Seed Activities
    console.log('5. Seeding city activities...');
    const rawActivitiesPath = path.join(__dirname, 'data', 'rawActivities.json');
    const rawActivitiesData = JSON.parse(fs.readFileSync(rawActivitiesPath, 'utf8'));

    let totalActivities = 0;
    const actMap = {}; // 'cityName:actName' -> id
    for (const group of rawActivitiesData) {
      const cityId = cityMap[group.cityName.toLowerCase()] || 1;
      for (const act of group.activities) {
        const costVal = act.cost !== undefined ? act.cost : (act.est_cost || 25);
        const durationVal = act.duration !== undefined ? act.duration : (act.est_duration_mins || 90);
        const catVal = act.type || act.category || 'sightseeing';

        const res = await client.query(`
          INSERT INTO activities (city_id, name, category, type, description, image_url, est_cost, cost, est_duration_mins, duration)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id;
        `, [
          cityId,
          act.name,
          catVal,
          catVal,
          act.description || '',
          act.image_url || '',
          costVal,
          costVal,
          durationVal,
          durationVal,
        ]);
        actMap[`${group.cityName.toLowerCase()}:${act.name.toLowerCase()}`] = res.rows[0].id;
        totalActivities++;
      }
    }
    console.log(`✅ Seeded ${totalActivities} curated activities across all cities.`);

    // 6. Seed Detailed Trips with Stops, Activities, and Budgets
    console.log('6. Seeding rich trips with itineraries & budgets...');

    async function createFullTrip({
      userId,
      name,
      startDate,
      endDate,
      description,
      coverPhotoUrl,
      isPublic = false,
      shareSlug = null,
      stopsData = [],
      budgetData = {},
    }) {
      const tripRes = await client.query(`
        INSERT INTO trips (user_id, name, start_date, end_date, description, cover_photo_url, is_public, share_slug, share_token)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [userId, name, startDate, endDate, description, coverPhotoUrl, isPublic, shareSlug, shareSlug]);

      const tripId = tripRes.rows[0].id;

      await client.query(`
        INSERT INTO budgets (trip_id, transport_cost, stay_cost, activities_cost, meals_cost, currency)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        tripId,
        budgetData.transport || 250,
        budgetData.stay || 600,
        budgetData.activities || 200,
        budgetData.meals || 300,
        budgetData.currency || 'USD',
      ]);

      let stopOrder = 0;
      for (const stop of stopsData) {
        const cityId = cityMap[stop.cityName.toLowerCase()] || 1;
        const stopRes = await client.query(`
          INSERT INTO stops (trip_id, city_id, arrival_date, departure_date, start_date, end_date, stop_order, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id;
        `, [tripId, cityId, stop.arrivalDate, stop.departureDate, stop.arrivalDate, stop.departureDate, stopOrder, stopOrder]);
        stopOrder++;

        const stopId = stopRes.rows[0].id;

        for (const act of stop.activities || []) {
          const actKey = `${stop.cityName.toLowerCase()}:${act.name.toLowerCase()}`;
          const activityId = actMap[actKey] || 1;
          await client.query(`
            INSERT INTO trip_activities (stop_id, activity_id, day_number, time_slot, cost, custom_name, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [
            stopId,
            activityId,
            act.dayNumber || 1,
            act.timeSlot || 'morning',
            act.cost || 30,
            act.name,
            act.notes || '',
          ]);
        }
      }

      return tripId;
    }

    // Trip 1: Euro Summer Tour 2026
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Euro Summer Tour 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-12',
      description: 'An unforgettable 12-day grand tour across Paris, Amsterdam, and Rome with historical tours and scenic canals.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'euro-summer-2026',
      budgetData: { transport: 450, stay: 1400, activities: 380, meals: 550, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Paris',
          arrivalDate: '2026-07-01',
          departureDate: '2026-07-04',
          activities: [
            { name: 'Eiffel Tower Summit Tour', dayNumber: 1, timeSlot: 'morning', cost: 45, notes: 'Pre-booked skip the line' },
            { name: 'Louvre Museum Guided Walk', dayNumber: 2, timeSlot: 'afternoon', cost: 35, notes: 'Mona Lisa and sculpture wing' },
          ],
        },
        {
          cityName: 'Amsterdam',
          arrivalDate: '2026-07-05',
          departureDate: '2026-07-08',
          activities: [
            { name: 'Canal Ring Sightseeing Cruise', dayNumber: 5, timeSlot: 'morning', cost: 25, notes: 'Audio guide included' },
            { name: 'Van Gogh Museum Skip-the-line', dayNumber: 6, timeSlot: 'afternoon', cost: 24, notes: 'Impressionist paintings' },
          ],
        },
        {
          cityName: 'Rome',
          arrivalDate: '2026-07-09',
          departureDate: '2026-07-12',
          activities: [
            { name: 'Colosseum & Forum Entry', dayNumber: 9, timeSlot: 'morning', cost: 35, notes: 'Ancient gladiator arena' },
            { name: 'Pizza & Gelato Making Class', dayNumber: 10, timeSlot: 'evening', cost: 55, notes: 'Hands-on culinary session' },
          ],
        },
      ],
    });

    // Trip 2: Japan Highlights & Sakura Adventure
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Japan Highlights & Sakura Adventure',
      startDate: '2026-08-10',
      endDate: '2026-08-20',
      description: 'Explore futuristic Tokyo neon districts, ancient Kyoto shrines, and world-class ramen bars.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'japan-sakura-2026',
      budgetData: { transport: 500, stay: 1200, activities: 320, meals: 480, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Tokyo',
          arrivalDate: '2026-08-10',
          departureDate: '2026-08-15',
          activities: [
            { name: 'Shibuya Crossing & Food Tour', dayNumber: 1, timeSlot: 'morning', cost: 50, notes: 'Tasting local street food' },
            { name: 'Senso-ji Asakusa Temple Tour', dayNumber: 2, timeSlot: 'afternoon', cost: 20, notes: 'Historic district walk' },
          ],
        },
        {
          cityName: 'Kyoto',
          arrivalDate: '2026-08-16',
          departureDate: '2026-08-20',
          activities: [
            { name: 'Fushimi Inari Shrine Morning Walk', dayNumber: 7, timeSlot: 'morning', cost: 25, notes: 'Thousands of vermilion torii gates' },
            { name: 'Gion Geisha District Evening Tour', dayNumber: 8, timeSlot: 'evening', cost: 40, notes: 'Traditional wooden machiya houses' },
          ],
        },
      ],
    });

    // Trip 3: Southeast Asia Beach & Food Safari
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Southeast Asia Beach & Food Safari',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      description: 'Tropical beaches, ancient temples, night markets, and delicious cuisine from Bali to Bangkok.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      isPublic: false,
      shareSlug: 'sea-safari-2026',
      budgetData: { transport: 300, stay: 650, activities: 220, meals: 250, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Bali',
          arrivalDate: '2026-09-01',
          departureDate: '2026-09-05',
          activities: [
            { name: 'Ubud Rice Terraces & Waterfall Walk', dayNumber: 1, timeSlot: 'morning', cost: 30, notes: 'Tegalalang scenic views' },
            { name: 'Tanah Lot Sunset Temple Tour', dayNumber: 2, timeSlot: 'evening', cost: 25, notes: 'Sea temple sunset' },
          ],
        },
        {
          cityName: 'Bangkok',
          arrivalDate: '2026-09-06',
          departureDate: '2026-09-10',
          activities: [
            { name: 'Grand Palace & Emerald Buddha Visit', dayNumber: 6, timeSlot: 'morning', cost: 20, notes: 'Royal complex architecture' },
            { name: 'Chao Phraya Sunset Dinner Cruise', dayNumber: 7, timeSlot: 'evening', cost: 45, notes: 'Thai buffet cruise' },
          ],
        },
      ],
    });

    // Trip 4: Arabian Nights & Desert Dunes (for Alex Wanderer)
    await createFullTrip({
      userId: alexUser.id,
      name: 'Arabian Nights & Desert Dunes',
      startDate: '2026-10-05',
      endDate: '2026-10-12',
      description: 'Luxury skyscraper panoramas, thrilling 4x4 dune bashing, and starlit Bedouin BBQ in Dubai.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'arabian-nights-2026',
      budgetData: { transport: 400, stay: 1500, activities: 450, meals: 400, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Dubai',
          arrivalDate: '2026-10-05',
          departureDate: '2026-10-12',
          activities: [
            { name: 'Burj Khalifa Observation Deck (124+125th Floor)', dayNumber: 1, timeSlot: 'morning', cost: 45, notes: 'Highest viewpoint' },
            { name: 'Desert Safari with 4x4 Dune Bashing & BBQ', dayNumber: 2, timeSlot: 'afternoon', cost: 65, notes: 'Camel ride and BBQ' },
          ],
        },
      ],
    });

    console.log('✅ Created 4 rich trips with full stops, activities, and budget breakdowns.');
    console.log('==============================================');
    console.log('🎉 Dummy data successfully added to PostgreSQL!');
    console.log('==============================================');
  } catch (err) {
    console.error('❌ Error seeding dummy data:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
