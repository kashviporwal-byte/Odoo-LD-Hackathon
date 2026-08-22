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
  console.log('🚀 Seeding Comprehensive Trip Dataset for GlobeTrotter');
  console.log('==============================================');

  const client = await pool.connect();
  try {
    // 1. Ensure schema compatibility
    console.log('1. Checking database schema columns...');
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
    console.log('2. Resetting existing tables...');
    await client.query('TRUNCATE TABLE trip_activities, activities, stops, budgets, trips, cities, users RESTART IDENTITY CASCADE;');

    // 3. Seed Demo Users
    console.log('3. Seeding users...');
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
    const adminUser = userRes.rows.find(u => u.email === 'admin@odoo.com') || userRes.rows[1];
    const alexUser = userRes.rows.find(u => u.email === 'alex@globe.io') || userRes.rows[2];
    const priyaUser = userRes.rows.find(u => u.email === 'priya@globe.io') || userRes.rows[3];
    const marcoUser = userRes.rows.find(u => u.email === 'marco@globe.io') || userRes.rows[4];

    console.log(`✅ Seeded ${userRes.rows.length} users.`);

    // 4. Seed Cities
    console.log('4. Seeding global destinations...');
    const rawCitiesPath = path.join(__dirname, 'data', 'rawCities.json');
    const rawCities = JSON.parse(fs.readFileSync(rawCitiesPath, 'utf8'));

    const cityMap = {};
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
    const actMap = {};
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
    console.log(`✅ Seeded ${totalActivities} activities.`);

    // 6. Helper for Full Trip Creation
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
        // Match city key
        const cityKey = Object.keys(cityMap).find(k => k.includes(stop.cityName.toLowerCase()) || stop.cityName.toLowerCase().includes(k)) || 'paris';
        const cityId = cityMap[cityKey] || 1;

        const stopRes = await client.query(`
          INSERT INTO stops (trip_id, city_id, arrival_date, departure_date, start_date, end_date, stop_order, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id;
        `, [tripId, cityId, stop.arrivalDate, stop.departureDate, stop.arrivalDate, stop.departureDate, stopOrder, stopOrder]);
        stopOrder++;

        const stopId = stopRes.rows[0].id;

        for (const act of stop.activities || []) {
          // Find matching activity or fallback to city's first activity
          let activityId = null;
          const matchingKey = Object.keys(actMap).find(k => k.includes(act.name.toLowerCase()));
          if (matchingKey) {
            activityId = actMap[matchingKey];
          } else {
            const cityActKey = Object.keys(actMap).find(k => k.startsWith(cityKey + ':'));
            activityId = cityActKey ? actMap[cityActKey] : 1;
          }

          await client.query(`
            INSERT INTO trip_activities (stop_id, activity_id, day_number, time_slot, cost, custom_name, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [
            stopId,
            activityId || 1,
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

    console.log('6. Seeding comprehensive trip dataset (12 global itineraries)...');

    // ── TRIP 1: Euro Summer Tour 2026 (Demo Traveler) ─────────────────────────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Euro Summer Tour 2026',
      startDate: '2026-07-01',
      endDate: '2026-07-12',
      description: 'A 12-day grand summer tour across Paris, Amsterdam, and Rome featuring the Eiffel Tower, canal cruises, and the Colosseum.',
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
            { name: 'Eiffel Tower Summit Access', dayNumber: 1, timeSlot: 'morning', cost: 35, notes: 'Panoramic Paris view' },
            { name: 'Louvre Museum Masterpieces Tour', dayNumber: 2, timeSlot: 'afternoon', cost: 22, notes: 'Mona Lisa & sculptures' },
            { name: 'Seine River Evening Dinner Cruise', dayNumber: 3, timeSlot: 'evening', cost: 85, notes: 'Gourmet dinner cruise' },
          ],
        },
        {
          cityName: 'Amsterdam',
          arrivalDate: '2026-07-05',
          departureDate: '2026-07-08',
          activities: [
            { name: 'Canal Ring Sightseeing Cruise', dayNumber: 5, timeSlot: 'morning', cost: 25, notes: 'Historic merchant houses' },
            { name: 'Zaanse Schans Windmills Bike Tour', dayNumber: 6, timeSlot: 'afternoon', cost: 40, notes: 'Countryside cycling' },
          ],
        },
        {
          cityName: 'Rome',
          arrivalDate: '2026-07-09',
          departureDate: '2026-07-12',
          activities: [
            { name: 'Colosseum & Roman Forum VIP Tour', dayNumber: 9, timeSlot: 'morning', cost: 45, notes: 'Gladiators and ancient forum' },
            { name: 'Vatican Museums & Sistine Chapel', dayNumber: 10, timeSlot: 'afternoon', cost: 38, notes: 'Michelangelo frescoes' },
            { name: 'Trastevere Street Food & Wine Crawl', dayNumber: 11, timeSlot: 'evening', cost: 55, notes: 'Local pasta and wines' },
          ],
        },
      ],
    });

    // ── TRIP 2: Japan Highlights & Sakura Adventure (Demo Traveler) ───────────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Japan Highlights & Sakura Adventure',
      startDate: '2026-08-10',
      endDate: '2026-08-20',
      description: 'Explore futuristic Tokyo neon districts, ancient Kyoto shrines, Mount Fuji, and world-class ramen culinary hotspots.',
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
            { name: 'teamLab Planets Immersive Digital Art', dayNumber: 1, timeSlot: 'morning', cost: 28, notes: 'Interactive art walk' },
            { name: 'Tsukiji Outer Market Gourmet Food Tour', dayNumber: 2, timeSlot: 'afternoon', cost: 40, notes: 'Fresh seafood & wagyu' },
            { name: 'Mount Fuji & Hakone Day Trip', dayNumber: 3, timeSlot: 'morning', cost: 95, notes: 'Lake Ashi boat cruise' },
          ],
        },
        {
          cityName: 'Kyoto',
          arrivalDate: '2026-08-16',
          departureDate: '2026-08-20',
          activities: [
            { name: 'Fushimi Inari Shrine Morning Walk', dayNumber: 7, timeSlot: 'morning', cost: 25, notes: 'Torii gates trail' },
            { name: 'Gion Geisha District Evening Tour', dayNumber: 8, timeSlot: 'evening', cost: 40, notes: 'Traditional wooden tea houses' },
          ],
        },
      ],
    });

    // ── TRIP 3: Southeast Asia Beach & Food Safari (Demo Traveler) ───────────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Southeast Asia Beach & Food Safari',
      startDate: '2026-09-01',
      endDate: '2026-09-14',
      description: 'Tropical paradise beaches, volcanic rice terraces, Bangkok night markets, and Singapore futuristic skyline.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
      isPublic: false,
      shareSlug: 'sea-safari-2026',
      budgetData: { transport: 420, stay: 850, activities: 300, meals: 350, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Bali',
          arrivalDate: '2026-09-01',
          departureDate: '2026-09-06',
          activities: [
            { name: 'Ubud Rice Terraces & Waterfall Walk', dayNumber: 1, timeSlot: 'morning', cost: 30, notes: 'Tegalalang panoramic views' },
            { name: 'Tanah Lot Sunset Temple Tour', dayNumber: 2, timeSlot: 'evening', cost: 25, notes: 'Ocean sunset' },
          ],
        },
        {
          cityName: 'Bangkok',
          arrivalDate: '2026-09-07',
          departureDate: '2026-09-10',
          activities: [
            { name: 'Grand Palace & Emerald Buddha Visit', dayNumber: 7, timeSlot: 'morning', cost: 20, notes: 'Royal complex architecture' },
            { name: 'Chao Phraya Sunset Dinner Cruise', dayNumber: 8, timeSlot: 'evening', cost: 45, notes: 'Thai buffet cruise' },
          ],
        },
        {
          cityName: 'Singapore',
          arrivalDate: '2026-09-11',
          departureDate: '2026-09-14',
          activities: [
            { name: 'Gardens by the Bay Double Dome Pass', dayNumber: 11, timeSlot: 'morning', cost: 28, notes: 'Cloud forest & supertrees' },
            { name: 'Marina Bay Sands SkyPark Observation Deck', dayNumber: 12, timeSlot: 'evening', cost: 26, notes: '57th floor view' },
          ],
        },
      ],
    });

    // ── TRIP 4: Nordic Aurora & Geothermal Wonders (Demo Traveler) ─────────────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Nordic Aurora & Geothermal Wonders',
      startDate: '2026-11-15',
      endDate: '2026-11-24',
      description: 'Chase the magical Northern Lights in Iceland, soak in the Blue Lagoon, and experience London West End lights.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'nordic-aurora-2026',
      budgetData: { transport: 600, stay: 1500, activities: 400, meals: 600, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Reykjavik',
          arrivalDate: '2026-11-15',
          departureDate: '2026-11-19',
          activities: [
            { name: 'Blue Lagoon Geothermal Spa & Silica Mud', dayNumber: 1, timeSlot: 'morning', cost: 85, notes: 'Volcanic thermal pool' },
            { name: 'Golden Circle & Northern Lights Hunt', dayNumber: 2, timeSlot: 'afternoon', cost: 95, notes: 'Geysers and Aurora' },
          ],
        },
        {
          cityName: 'London',
          arrivalDate: '2026-11-20',
          departureDate: '2026-11-24',
          activities: [
            { name: 'London Eye Flight', dayNumber: 6, timeSlot: 'morning', cost: 32, notes: 'Thames skyline flight' },
            { name: 'Tower of London & Crown Jewels', dayNumber: 7, timeSlot: 'afternoon', cost: 38, notes: 'Royal jewels exhibit' },
          ],
        },
      ],
    });

    // ── TRIP 5: Mediterranean Sun & Cyclades Romance (Demo Traveler) ───────────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Mediterranean Sun & Cyclades Romance',
      startDate: '2026-06-10',
      endDate: '2026-06-21',
      description: 'Renaissance romance in Florence, gondola rides in Venice canals, and breathtaking cliffside sunsets in Santorini.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'mediterranean-romance-2026',
      budgetData: { transport: 550, stay: 1650, activities: 450, meals: 750, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Florence',
          arrivalDate: '2026-06-10',
          departureDate: '2026-06-13',
          activities: [
            { name: 'Duomo Dome Climb & Uffizi Masterpieces', dayNumber: 1, timeSlot: 'morning', cost: 42, notes: 'Brunelleschi dome' },
          ],
        },
        {
          cityName: 'Venice',
          arrivalDate: '2026-06-14',
          departureDate: '2026-06-17',
          activities: [
            { name: 'Grand Canal Private Gondola Ride', dayNumber: 5, timeSlot: 'afternoon', cost: 80, notes: 'Venetian serenade' },
          ],
        },
        {
          cityName: 'Santorini',
          arrivalDate: '2026-06-18',
          departureDate: '2026-06-21',
          activities: [
            { name: 'Santorini Sunset Caldera Catamaran Cruise', dayNumber: 9, timeSlot: 'afternoon', cost: 95, notes: 'Oia cliff sunset with Greek wine' },
          ],
        },
      ],
    });

    // ── TRIP 6: Grand American West to East (Demo Traveler) ────────────────────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Grand American West to East',
      startDate: '2026-10-01',
      endDate: '2026-10-10',
      description: 'From San Francisco Golden Gate and cable cars to Manhattan skyscrapers, Central Park, and Broadway musicals.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
      isPublic: false,
      shareSlug: 'usa-coast-to-coast-2026',
      budgetData: { transport: 700, stay: 1900, activities: 450, meals: 750, currency: 'USD' },
      stopsData: [
        {
          cityName: 'San Francisco',
          arrivalDate: '2026-10-01',
          departureDate: '2026-10-05',
          activities: [
            { name: 'Golden Gate Bridge Bike & Alcatraz Island', dayNumber: 1, timeSlot: 'morning', cost: 65, notes: 'Ferry tour & bike crossing' },
          ],
        },
        {
          cityName: 'New York',
          arrivalDate: '2026-10-06',
          departureDate: '2026-10-10',
          activities: [
            { name: 'Central Park Bike Rental', dayNumber: 6, timeSlot: 'morning', cost: 20, notes: 'Bethesda fountain & lakes' },
            { name: 'Empire State Building Observatory', dayNumber: 7, timeSlot: 'evening', cost: 42, notes: '86th floor night lights' },
          ],
        },
      ],
    });

    // ── TRIP 7: Swiss Alps Scenic Rail & Imperial Vienna (Demo Traveler) ───────
    await createFullTrip({
      userId: travelerUser.id,
      name: 'Swiss Alps Scenic Rail & Imperial Vienna',
      startDate: '2026-12-20',
      endDate: '2026-12-28',
      description: 'Winter wonderland alpine train journeys through Zurich, chocolate tastings, and classical Vienna imperial palaces.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'swiss-alps-winter-2026',
      budgetData: { transport: 450, stay: 1600, activities: 350, meals: 800, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Zurich',
          arrivalDate: '2026-12-20',
          departureDate: '2026-12-24',
          activities: [
            { name: 'Lake Zurich Steamboat Cruise & Old Town', dayNumber: 1, timeSlot: 'morning', cost: 35, notes: 'Alpine lake cruise' },
            { name: 'Lindt Home of Chocolate Tasting Experience', dayNumber: 2, timeSlot: 'afternoon', cost: 22, notes: 'Unlimited chocolate tasting' },
          ],
        },
        {
          cityName: 'Vienna',
          arrivalDate: '2026-12-25',
          departureDate: '2026-12-28',
          activities: [
            { name: 'Schönbrunn Palace Grand Tour & Classical Concert', dayNumber: 6, timeSlot: 'morning', cost: 50, notes: 'Habsburg royal apartments' },
          ],
        },
      ],
    });

    // ── TRIP 8: Arabian Nights & Pyramids Explorer (Alex Wanderer) ────────────
    await createFullTrip({
      userId: alexUser.id,
      name: 'Arabian Nights & Pyramids Explorer',
      startDate: '2026-10-05',
      endDate: '2026-10-15',
      description: 'Luxury Dubai skyscraper panoramas, thrilling dune bashing, and ancient Giza Pyramids camel rides along the Nile.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'arabian-nights-2026',
      budgetData: { transport: 500, stay: 1300, activities: 450, meals: 600, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Dubai',
          arrivalDate: '2026-10-05',
          departureDate: '2026-10-10',
          activities: [
            { name: 'Burj Khalifa At The Top (124th & 125th Floor)', dayNumber: 1, timeSlot: 'morning', cost: 48, notes: 'Top observation deck' },
            { name: 'Desert 4x4 Dune Bashing & BBQ Camp', dayNumber: 2, timeSlot: 'afternoon', cost: 65, notes: 'Bedouin show and dinner' },
          ],
        },
        {
          cityName: 'Cairo',
          arrivalDate: '2026-10-11',
          departureDate: '2026-10-15',
          activities: [
            { name: 'Giza Pyramids & Sphinx Camel Trek', dayNumber: 7, timeSlot: 'morning', cost: 30, notes: 'Ancient wonder of the world' },
            { name: 'Grand Egyptian Museum & King Tut Treasures', dayNumber: 8, timeSlot: 'afternoon', cost: 25, notes: 'Tutankhamun gold galleries' },
          ],
        },
      ],
    });

    // ── TRIP 9: Wild African Safari & Ocean Coasts (Alex Wanderer) ────────────
    await createFullTrip({
      userId: alexUser.id,
      name: 'Wild African Safari & Ocean Coasts',
      startDate: '2026-05-10',
      endDate: '2026-05-17',
      description: 'Dramatic Atlantic coastal drives, Table Mountain revolving cable cars, and African penguin colonies in Cape Town.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80',
      isPublic: false,
      shareSlug: 'cape-safari-2026',
      budgetData: { transport: 400, stay: 1000, activities: 350, meals: 350, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Cape Town',
          arrivalDate: '2026-05-10',
          departureDate: '2026-05-17',
          activities: [
            { name: 'Table Mountain Aerial Cableway', dayNumber: 1, timeSlot: 'morning', cost: 25, notes: 'Summit panoramic views' },
            { name: 'Boulders Beach African Penguin Colony', dayNumber: 2, timeSlot: 'afternoon', cost: 18, notes: 'Penguin boardwalk' },
          ],
        },
      ],
    });

    // ── TRIP 10: Iberian Sun & Catalan Architecture (Priya Sharma) ───────────
    await createFullTrip({
      userId: priyaUser.id,
      name: 'Iberian Sun & Catalan Architecture',
      startDate: '2026-07-15',
      endDate: '2026-07-23',
      description: 'Gaudí fantastical masterpieces in Barcelona, tapas trails, and historic London palaces.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'iberian-sun-2026',
      budgetData: { transport: 350, stay: 1100, activities: 350, meals: 600, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Barcelona',
          arrivalDate: '2026-07-15',
          departureDate: '2026-07-19',
          activities: [
            { name: 'La Sagrada Familia Guided Entry', dayNumber: 1, timeSlot: 'morning', cost: 26, notes: 'Gaudi basilica architecture' },
            { name: 'Tapas & Wine Historical Quarter Tour', dayNumber: 2, timeSlot: 'evening', cost: 48, notes: 'Gothic quarter tasting' },
          ],
        },
        {
          cityName: 'London',
          arrivalDate: '2026-07-20',
          departureDate: '2026-07-23',
          activities: [
            { name: 'London Eye Flight', dayNumber: 6, timeSlot: 'morning', cost: 32, notes: 'Westminster panoramic views' },
          ],
        },
      ],
    });

    // ── TRIP 11: Bosphorus Crossroads & Bohemian Prague (Priya Sharma) ─────────
    await createFullTrip({
      userId: priyaUser.id,
      name: 'Bosphorus Crossroads & Bohemian Prague',
      startDate: '2026-09-10',
      endDate: '2026-09-19',
      description: 'Sail between Europe and Asia on the Bosphorus, explore Istanbul Grand Bazaar, and stroll Charles Bridge in Prague.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'ottoman-crossroads-2026',
      budgetData: { transport: 350, stay: 950, activities: 250, meals: 500, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Istanbul',
          arrivalDate: '2026-09-10',
          departureDate: '2026-09-14',
          activities: [
            { name: 'Hagia Sophia & Blue Mosque Historical Tour', dayNumber: 1, timeSlot: 'morning', cost: 30, notes: 'Byzantine & Ottoman gems' },
            { name: 'Bosphorus Sunset Yacht Cruise', dayNumber: 2, timeSlot: 'evening', cost: 35, notes: 'Strait sunset cruise' },
          ],
        },
        {
          cityName: 'Prague',
          arrivalDate: '2026-09-15',
          departureDate: '2026-09-19',
          activities: [
            { name: 'Prague Castle & Charles Bridge Walking Tour', dayNumber: 6, timeSlot: 'morning', cost: 24, notes: 'Gothic cathedrals & Old Town' },
          ],
        },
      ],
    });

    // ── TRIP 12: South American Rhythms & Copacabana Sun (Marco Rossi) ─────────
    await createFullTrip({
      userId: marcoUser.id,
      name: 'South American Rhythms & Copacabana Sun',
      startDate: '2026-11-01',
      endDate: '2026-11-09',
      description: 'Samba energy, Christ the Redeemer mountain vistas, and golden sands along Ipanema and Copacabana in Rio de Janeiro.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareSlug: 'rio-carnival-vibes-2026',
      budgetData: { transport: 450, stay: 850, activities: 250, meals: 400, currency: 'USD' },
      stopsData: [
        {
          cityName: 'Rio de Janeiro',
          arrivalDate: '2026-11-01',
          departureDate: '2026-11-09',
          activities: [
            { name: 'Christ the Redeemer & Corcovado Train', dayNumber: 1, timeSlot: 'morning', cost: 28, notes: 'Mount Corcovado summit' },
            { name: 'Sugarloaf Mountain Sunset Cable Car', dayNumber: 2, timeSlot: 'afternoon', cost: 32, notes: 'Guanabara Bay cable car' },
          ],
        },
      ],
    });

    console.log('✅ Created 12 detailed trips with stops, activities, budgets, and public shares.');
    console.log('==============================================');
    console.log('🎉 Comprehensive Trip Dataset successfully seeded!');
    console.log('==============================================');
  } catch (err) {
    console.error('❌ Error seeding trip dataset:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
