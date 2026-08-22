require('dotenv').config();
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding database with test data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear existing data
    await client.query('TRUNCATE trip_activities, budgets, stops, activities, cities, trips, users CASCADE');
    
    // Create hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // 1. Insert Users (including admin for Screen 12 check)
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ('John Doe', 'john@example.com', $1, 'user'),
              ('Admin User', 'admin@example.com', $1, 'admin') 
       RETURNING id, role`,
      [hashedPassword]
    );
    const regularUserId = userRes.rows.find(u => u.role === 'user').id;
    const adminUserId = userRes.rows.find(u => u.role === 'admin').id;
    
    // 2. Insert Cities
    const cityRes = await client.query(
      `INSERT INTO cities (name, country, region, lat, lng, cost_index, popularity, image_url)
       VALUES 
       ('Paris', 'France', 'Europe', 48.8566, 2.3522, 3, 5, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400'),
       ('Rome', 'Italy', 'Europe', 41.9028, 12.4964, 2, 4, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400'),
       ('Tokyo', 'Japan', 'Asia', 35.6762, 139.6503, 3, 5, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400')
       RETURNING id, name`
    );
    const parisId = cityRes.rows.find(c => c.name === 'Paris').id;
    const romeId = cityRes.rows.find(c => c.name === 'Rome').id;
    const tokyoId = cityRes.rows.find(c => c.name === 'Tokyo').id;

    // 3. Insert base Activities
    const actRes = await client.query(
      `INSERT INTO activities (city_id, name, category, est_cost, est_duration_mins, description, image_url)
       VALUES 
       ($1, 'Eiffel Tower Summit', 'sightseeing', 25.00, 120, 'Skip-the-line elevator trip to Eiffel Tower peak.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400'),
       ($1, 'Louvre Museum Tour', 'sightseeing', 15.00, 180, 'Guided corridors tour focusing on main masterworks.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400'),
       ($2, 'Colosseum Guided Tour', 'sightseeing', 30.00, 150, 'Full walk around the Colosseum arena floor.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400'),
       ($3, 'Sushi Masterclass', 'food', 60.00, 120, 'Learn to slice and assemble sushi from a local master.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400')
       RETURNING id, name`,
      [parisId, romeId, tokyoId]
    );
    const eiffelId = actRes.rows.find(a => a.name === 'Eiffel Tower Summit').id;
    const louvreId = actRes.rows.find(a => a.name === 'Louvre Museum Tour').id;
    const colosseumId = actRes.rows.find(a => a.name === 'Colosseum Guided Tour').id;
    const sushiId = actRes.rows.find(a => a.name === 'Sushi Masterclass').id;

    // 4. Insert Trip
    const tripRes = await client.query(
      `INSERT INTO trips (user_id, name, start_date, end_date, description, cover_photo_url, share_slug)
       VALUES ($1, 'Europe & Asia Exploration', '2026-07-01', '2026-07-15', 'My summer multi-city trip plan!', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800', 'explorers_token_xyz')
       RETURNING id`,
      [regularUserId]
    );
    const tripId = tripRes.rows[0].id;

    // 5. Insert Trip Stops
    const stopRes = await client.query(
      `INSERT INTO stops (trip_id, city_id, arrival_date, departure_date, stop_order)
       VALUES 
       ($1, $2, '2026-07-01', '2026-07-05', 1),
       ($1, $3, '2026-07-06', '2026-07-10', 2),
       ($1, $4, '2026-07-11', '2026-07-15', 3)
       RETURNING id, city_id`,
      [tripId, parisId, romeId, tokyoId]
    );
    const parisStopId = stopRes.rows.find(s => s.city_id === parisId).id;
    const romeStopId = stopRes.rows.find(s => s.city_id === romeId).id;
    const tokyoStopId = stopRes.rows.find(s => s.city_id === tokyoId).id;

    // 6. Link Activities to stops (trip_activities)
    await client.query(
      `INSERT INTO trip_activities (stop_id, activity_id, day_number, time_slot, cost)
       VALUES 
       ($1, $2, 1, 'morning', 25.00),
       ($1, $3, 2, 'afternoon', 15.00),
       ($4, $5, 6, 'morning', 30.00),
       ($6, $7, 11, 'evening', 60.00)`,
      [parisStopId, eiffelId, louvreId, romeStopId, colosseumId, tokyoStopId, sushiId]
    );

    // 7. Insert Budget configuration
    await client.query(
      `INSERT INTO budgets (trip_id, transport_cost, stay_cost, activities_cost, meals_cost, currency)
       VALUES ($1, 200.00, 500.00, 130.00, 300.00, 'USD')`,
      [tripId]
    );

    await client.query('COMMIT');
    console.log('====================================================');
    console.log('Seeding completed successfully!');
    console.log('--- TEST ACCOUNTS ---');
    console.log('Regular User: john@example.com (password: password123)');
    console.log('Admin User:   admin@example.com (password: password123)');
    console.log('Trip Token:   explorers_token_xyz');
    console.log('====================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database test logs:', err.message);
  } finally {
    client.release();
  }
}

// Execute the seed function
seed().then(() => pool.end());
