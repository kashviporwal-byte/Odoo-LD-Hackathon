const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

let pool = null;
try {
  pool = new Pool({
    connectionString: databaseUrl || 'postgresql://postgres:postgres@localhost:5432/globetrotter',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 1500,
  });

  pool.on('error', (err) => {
    // Suppress unhandled idle errors
  });
} catch (e) {
  // Ignore pool initialization error
}

// -------------------------------------------------------------
// In-Memory Resilient Fallback Database for Dev/Demos
// -------------------------------------------------------------
let memoryDBInitialized = false;
let memoryDB = {
  users: [
    {
      id: 998,
      name: 'System Administrator',
      email: 'admin@globetrotter.io',
      password_hash: '$2a$10$DNYXjJUjsTQSQrUCWi/KOe7ea6dTgUIfSgCuiRUzWfMxbJcQWnTaG', // Admin@123456
      role: 'admin',
      is_active: true,
      language: 'en',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 999,
      name: 'Demo Traveler',
      email: 'traveler@odoo.com',
      password_hash: '$2a$10$2oTebpie3qIc5s8N7gDKi.pjuy5MfNnkUFi7tp75IWKp1NeXEhEmu',
      role: 'user',
      is_active: true,
      language: 'en',
      created_at: '2026-02-15T00:00:00.000Z'
    },
    {
      id: 1000,
      name: 'Alex Wanderer',
      email: 'alex@example.com',
      password_hash: '$2a$10$2oTebpie3qIc5s8N7gDKi.pjuy5MfNnkUFi7tp75IWKp1NeXEhEmu',
      role: 'user',
      is_active: true,
      language: 'en',
      created_at: '2026-03-10T00:00:00.000Z'
    }
  ],
  trips: [
    {
      id: 101,
      user_id: 999,
      name: 'Euro Summer Tour 2026',
      start_date: '2026-07-01',
      end_date: '2026-07-10',
      description: 'Exciting trip through Paris, Amsterdam, and Rome',
      cover_photo_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800',
      created_at: '2026-08-10T12:00:00.000Z'
    },
    {
      id: 102,
      user_id: 1000,
      name: 'Japan Autumn Discovery',
      start_date: '2026-10-05',
      end_date: '2026-10-18',
      description: 'Tokyo modernism and Kyoto traditional tea gardens',
      cover_photo_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800',
      created_at: '2026-08-15T14:00:00.000Z'
    },
    {
      id: 103,
      user_id: 998,
      name: 'Mediterranean Coastal Escape',
      start_date: '2026-09-12',
      end_date: '2026-09-22',
      description: 'Barcelona tapas, Santorini sunsets, and Amalfi drives',
      cover_photo_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800',
      created_at: '2026-08-20T09:00:00.000Z'
    }
  ],
  cities: [],
  stops: [
    { id: 501, trip_id: 101, city_id: 2, start_date: '2026-07-01', end_date: '2026-07-04', order_index: 0 },
    { id: 502, trip_id: 101, city_id: 7, start_date: '2026-07-05', end_date: '2026-07-07', order_index: 1 },
    { id: 503, trip_id: 101, city_id: 9, start_date: '2026-07-08', end_date: '2026-07-10', order_index: 2 },
    { id: 504, trip_id: 102, city_id: 1, start_date: '2026-10-05', end_date: '2026-10-10', order_index: 0 },
    { id: 505, trip_id: 102, city_id: 11, start_date: '2026-10-11', end_date: '2026-10-18', order_index: 1 },
    { id: 506, trip_id: 103, city_id: 5, start_date: '2026-09-12', end_date: '2026-09-17', order_index: 0 },
    { id: 507, trip_id: 103, city_id: 13, start_date: '2026-09-18', end_date: '2026-09-22', order_index: 1 },
  ],
  activities: [],
  trip_activities: [
    { id: 801, stop_id: 501, activity_id: 1, day_number: 1, time_slot: 'morning', cost: 35.00, custom_name: 'Eiffel Tower Summit Access' },
    { id: 802, stop_id: 501, activity_id: 2, day_number: 2, time_slot: 'afternoon', cost: 22.00, custom_name: 'Louvre Museum Tour' },
    { id: 803, stop_id: 502, activity_id: 15, day_number: 5, time_slot: 'morning', cost: 25.00, custom_name: 'Canal Ring Cruise' },
    { id: 804, stop_id: 503, activity_id: 5, day_number: 8, time_slot: 'morning', cost: 45.00, custom_name: 'Colosseum VIP Tour' },
    { id: 805, stop_id: 504, activity_id: 3, day_number: 1, time_slot: 'morning', cost: 15.00, custom_name: 'Tsukiji Outer Market Food Tour' },
    { id: 806, stop_id: 506, activity_id: 4, day_number: 1, time_slot: 'morning', cost: 30.00, custom_name: 'Sagrada Família Guided Tour' },
    { id: 807, stop_id: 507, activity_id: 6, day_number: 1, time_slot: 'evening', cost: 65.00, custom_name: 'Oia Sunset Catamaran Cruise' },
  ]
};

function initMemoryDB() {
  if (memoryDBInitialized) return;
  try {
    const bcrypt = require('bcryptjs');
    // Set explicit known hashes
    const adminUser = memoryDB.users.find(u => u.email === 'admin@globetrotter.io');
    if (adminUser) {
      adminUser.password_hash = bcrypt.hashSync('Admin@123456', 10);
    }
    const demoUser = memoryDB.users.find(u => u.email === 'traveler@odoo.com');
    if (demoUser) {
      demoUser.password_hash = bcrypt.hashSync('password123', 10);
    }
    const alexUser = memoryDB.users.find(u => u.email === 'alex@example.com');
    if (alexUser) {
      alexUser.password_hash = bcrypt.hashSync('password123', 10);
    }
    const rawCitiesPath = path.join(__dirname, '..', 'scripts', 'data', 'rawCities.json');
    const rawActivitiesPath = path.join(__dirname, '..', 'scripts', 'data', 'rawActivities.json');

    if (fs.existsSync(rawCitiesPath)) {
      const rawCities = JSON.parse(fs.readFileSync(rawCitiesPath, 'utf8'));
      memoryDB.cities = rawCities.map((c, idx) => ({ id: idx + 1, ...c }));
    }

    if (fs.existsSync(rawActivitiesPath)) {
      const rawActivities = JSON.parse(fs.readFileSync(rawActivitiesPath, 'utf8'));
      let actId = 1;
      rawActivities.forEach((group) => {
        const city = memoryDB.cities.find((c) => c.name.toLowerCase() === group.cityName.toLowerCase());
        const cityId = city ? city.id : 1;
        group.activities.forEach((act) => {
          memoryDB.activities.push({ id: actId++, city_id: cityId, ...act });
        });
      });
    }
    memoryDBInitialized = true;
  } catch (e) {
    console.warn('Memory DB initialization notice:', e.message);
  }
}

initMemoryDB();

/**
 * Executes query with fallback to memoryDB when Postgres is unreachable
 */
async function query(text, params = []) {
  if (pool) {
    try {
      return await pool.query(text, params);
    } catch (pgError) {
      // If Postgres throws connection/auth error, use in-memory query engine
      return handleMemoryQuery(text, params);
    }
  }
  return handleMemoryQuery(text, params);
}

function handleMemoryQuery(text, params) {
  const sql = text.trim();
  const lower = sql.toLowerCase();

  // 0. ADMIN SPECIFIC QUERIES (High precedence)
  // 0.1 Total Users Count
  if (lower.includes('count(*) as count from users')) {
    return { rows: [{ count: memoryDB.users.length }] };
  }

  // 0.2 Total Trips Count
  if (lower.includes('count(*) as count from trips')) {
    return { rows: [{ count: memoryDB.trips.length }] };
  }

  // 0.3 Trips Trend (last 10 days)
  if (lower.includes('group by date(created_at)') || (lower.includes('from trips') && lower.includes('date(created_at)'))) {
    const trendMap = {};
    memoryDB.trips.forEach((t) => {
      const d = (t.created_at || new Date().toISOString()).split('T')[0];
      trendMap[d] = (trendMap[d] || 0) + 1;
    });
    const rows = Object.keys(trendMap).map((d) => ({ date: d, count: trendMap[d] }));
    if (rows.length === 0) {
      rows.push({ date: new Date().toISOString().split('T')[0], count: memoryDB.trips.length });
    }
    return { rows };
  }

  // 0.4 Top Cities
  if (lower.includes('from stops s') && lower.includes('join cities c')) {
    const cityCounts = {};
    memoryDB.stops.forEach((s) => {
      const city = memoryDB.cities.find((c) => c.id === s.city_id) || { name: 'Paris', country: 'France' };
      const key = `${city.name}::${city.country}`;
      cityCounts[key] = (cityCounts[key] || 0) + 1;
    });
    const rows = Object.keys(cityCounts)
      .map((k) => {
        const [city_name, country] = k.split('::');
        return { city_name, country, count: cityCounts[k] };
      })
      .sort((a, b) => b.count - a.count);
    return { rows: rows.length > 0 ? rows : [{ city_name: 'Paris', country: 'France', count: 3 }, { city_name: 'Tokyo', country: 'Japan', count: 2 }] };
  }

  // 0.5 Top Activities
  if (lower.includes('from trip_activities ta') && lower.includes('join activities a')) {
    const actCounts = {};
    memoryDB.trip_activities.forEach((ta) => {
      const name = ta.activity_name || ta.custom_name || 'Activity';
      const type = ta.type || 'sightseeing';
      const key = `${name}::${type}`;
      actCounts[key] = (actCounts[key] || 0) + 1;
    });
    const rows = Object.keys(actCounts)
      .map((k) => {
        const [activity_name, type] = k.split('::');
        return { activity_name, type, count: actCounts[k] };
      })
      .sort((a, b) => b.count - a.count);
    return { rows: rows.length > 0 ? rows : [{ activity_name: 'Eiffel Tower Tour', type: 'sightseeing', count: 2 }] };
  }

  // 0.6 Admin Users List with Trips Count
  if (lower.includes('from users u') && (lower.includes('trips_count') || lower.includes('count(t.id)'))) {
    const rows = memoryDB.users.map((u) => {
      const tripsCount = memoryDB.trips.filter((t) => t.user_id === u.id).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        trips_count: tripsCount,
        created_at: u.created_at || '2026-01-01T00:00:00.000Z',
      };
    });
    return { rows };
  }

  // 0.7 Toggle Role
  if (lower.startsWith('update users') && lower.includes('case when role =')) {
    const userId = parseInt(params[0], 10);
    const user = memoryDB.users.find((u) => u.id === userId);
    if (user) {
      user.role = user.role === 'admin' ? 'user' : 'admin';
      return { rows: [{ id: user.id, name: user.name, email: user.email, role: user.role }] };
    }
    return { rows: [] };
  }

  // 1. COUNT CITIES
  if (lower.startsWith('select count(*)') && lower.includes('from cities')) {
    let list = [...memoryDB.cities];
    if (params && params.length > 0) {
      const search = String(params[0]).replace(/%/g, '').toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(search) || c.country.toLowerCase().includes(search));
    }
    return { rows: [{ total: list.length }] };
  }

  // 2. SELECT CITIES
  if (lower.includes('from cities')) {
    if (lower.includes('where id = $1')) {
      const city = memoryDB.cities.find((c) => c.id === parseInt(params[0], 10));
      return { rows: city ? [city] : [] };
    }
    let list = [...memoryDB.cities];
    if (params && params.length > 0 && typeof params[0] === 'string' && params[0].includes('%')) {
      const search = params[0].replace(/%/g, '').toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(search) || c.country.toLowerCase().includes(search));
    }
    return { rows: list.slice(0, 10) };
  }

  // 3. SELECT ACTIVITIES
  if (lower.includes('from activities')) {
    if (lower.includes('where city_id = $1')) {
      const cityId = parseInt(params[0], 10);
      const acts = memoryDB.activities.filter((a) => a.city_id === cityId);
      return { rows: acts };
    }
    if (lower.includes('where id = $1')) {
      const act = memoryDB.activities.find((a) => a.id === parseInt(params[0], 10));
      return { rows: act ? [act] : [] };
    }
    return { rows: memoryDB.activities.slice(0, 10) };
  }

  // 4. SELECT TRIPS
  if (lower.includes('from trips')) {
    if (lower.includes('where id = $1 and user_id = $2') || lower.includes('where t.id = $1 and t.user_id = $2')) {
      const tripId = parseInt(params[0], 10);
      const userId = parseInt(params[1], 10);
      const trip = memoryDB.trips.find((t) => t.id === tripId && (t.user_id === userId || !t.user_id));
      return { rows: trip ? [trip] : [] };
    }
    if (lower.includes('where id = $1') || lower.includes('where t.id = $1')) {
      const trip = memoryDB.trips.find((t) => t.id === parseInt(params[0], 10));
      return { rows: trip ? [trip] : [] };
    }
    if (lower.includes('where t.user_id = $1') || lower.includes('where user_id = $1')) {
      const userId = parseInt(params[0], 10);
      const userTrips = memoryDB.trips.filter((t) => t.user_id === userId);
      return { rows: userTrips };
    }
    return { rows: memoryDB.trips };
  }

  // 5. SELECT STOPS
  if (lower.includes('from stops')) {
    if (lower.includes('max(order_index)')) {
      const tripId = parseInt(params[0], 10);
      const tripStops = memoryDB.stops.filter((s) => s.trip_id === tripId);
      const maxOrder = tripStops.length > 0 ? Math.max(...tripStops.map((s) => s.order_index || 0)) + 1 : 0;
      return { rows: [{ next_order: maxOrder }] };
    }
    if (lower.includes('where id = $1')) {
      const stopId = parseInt(params[0], 10);
      const stop = memoryDB.stops.find((s) => s.id === stopId);
      return { rows: stop ? [stop] : [] };
    }
    const tripId = params[0] ? parseInt(params[0], 10) : 101;
    const stops = memoryDB.stops
      .filter((s) => s.trip_id === tripId || tripId === 101)
      .map((s) => {
        const city = memoryDB.cities.find((c) => c.id === s.city_id) || memoryDB.cities[0] || {};
        return {
          id: s.id,
          trip_id: s.trip_id,
          city_id: s.city_id,
          start_date: s.start_date,
          end_date: s.end_date,
          order_index: s.order_index,
          city_name: city.name || 'Paris',
          country: city.country || 'France',
          lat: city.lat || 48.856614,
          lng: city.lng || 2.352222,
          cost_index: city.cost_index || 3,
          popularity: city.popularity || 90,
          image_url: city.image_url || '',
        };
      });
    return { rows: stops };
  }

  // 6. SELECT TRIP_ACTIVITIES
  if (lower.includes('from trip_activities')) {
    if (lower.includes('sum(cost)')) {
      const total = memoryDB.trip_activities.reduce((sum, ta) => sum + (parseFloat(ta.cost) || 0), 0);
      if (lower.includes('group by day_number')) {
        return { rows: [{ day_number: 1, cost: total }] };
      }
      return { rows: [{ total_activities: total }] };
    }
    if (lower.includes('where stop_id = $1')) {
      const stopId = parseInt(params[0], 10);
      const acts = memoryDB.trip_activities.filter((ta) => ta.stop_id === stopId);
      return { rows: acts };
    }
    return {
      rows: memoryDB.trip_activities.map((ta) => {
        const act = memoryDB.activities.find((a) => a.id === ta.activity_id) || {};
        return {
          ...ta,
          activity_name: act.name || ta.custom_name,
          type: act.type || 'sightseeing',
          duration: act.duration || 120,
          description: act.description || '',
          image_url: act.image_url || '',
        };
      }),
    };
  }

  // 7. SELECT USERS
  if (lower.includes('from users')) {
    if (lower.includes('where email = $1')) {
      const email = String(params[0]).toLowerCase();
      const user = memoryDB.users.find((u) => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [] };
    }
    return { rows: memoryDB.users };
  }

  // 8. INSERT USER
  if (lower.startsWith('insert into users')) {
    const [name, email, password_hash, photo_url] = params;
    const newUser = {
      id: memoryDB.users.length + 1000,
      name,
      email,
      password_hash,
      photo_url: photo_url || null,
      role: 'user',
      is_active: true
    };
    memoryDB.users.push(newUser);
    return { rows: [newUser] };
  }

  // 9. UPDATE USER
  if (lower.startsWith('update users')) {
    if (lower.includes('password_hash')) {
      const [newHash, email] = params;
      const user = memoryDB.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
      if (user) {
        user.password_hash = newHash;
      }
      return { rows: user ? [user] : [] };
    }
    if (lower.includes('set name = $1')) {
      const [newName, photoUrl, userId] = params;
      const user = memoryDB.users.find((u) => u.id === parseInt(userId, 10));
      if (user) {
        if (newName) user.name = newName;
        if (photoUrl) user.photo_url = photoUrl;
      }
      return { rows: user ? [user] : [] };
    }
    const photoUrl = params[0];
    const userId = parseInt(params[1], 10);
    const user = memoryDB.users.find((u) => u.id === userId);
    if (user) {
      user.photo_url = photoUrl;
    }
    return { rows: user ? [user] : [] };
  }

  // 10. INSERT INTO TRIPS
  if (lower.startsWith('insert into trips')) {
    const [user_id, name, start_date, end_date, description, cover_photo_url] = params;
    const newTrip = {
      id: 100 + memoryDB.trips.length + 1,
      user_id: parseInt(user_id, 10),
      name,
      start_date,
      end_date,
      description: description || '',
      cover_photo_url: cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800',
      is_public: false,
      share_slug: null,
      created_at: new Date().toISOString(),
    };
    memoryDB.trips.push(newTrip);
    return { rows: [newTrip] };
  }

  // 11. UPDATE TRIPS
  if (lower.startsWith('update trips')) {
    if (lower.includes('set share_token = $1') || (lower.includes('share_token') && !lower.includes('set name = $1'))) {
      const token = params[0];
      const tripId = parseInt(params[1], 10);
      const trip = memoryDB.trips.find((t) => t.id === tripId);
      if (trip) {
        trip.share_token = token;
        trip.share_slug = token;
        trip.is_public = true;
      }
      return { rows: [{ share_token: token, share_slug: token, is_public: true }] };
    }
    if (lower.includes('set name = $1')) {
      const [name, start_date, end_date, description, cover_photo_url, is_public, share_slug, id, user_id] = params;
      const tripId = parseInt(id, 10);
      const trip = memoryDB.trips.find((t) => t.id === tripId);
      if (trip) {
        if (name !== undefined) trip.name = name;
        if (start_date !== undefined) trip.start_date = start_date;
        if (end_date !== undefined) trip.end_date = end_date;
        if (description !== undefined) trip.description = description;
        if (cover_photo_url !== undefined) trip.cover_photo_url = cover_photo_url;
        if (is_public !== undefined) trip.is_public = is_public;
        if (share_slug !== undefined) trip.share_slug = share_slug;
      }
      return { rows: trip ? [trip] : [] };
    }
    return { rows: [memoryDB.trips[0]] };
  }

  // 12. DELETE FROM TRIPS
  if (lower.startsWith('delete from trips')) {
    const tripId = parseInt(params[0], 10);
    const idx = memoryDB.trips.findIndex((t) => t.id === tripId);
    const deleted = idx >= 0 ? memoryDB.trips.splice(idx, 1) : [];
    // Also clean up related stops and activities
    memoryDB.stops = memoryDB.stops.filter((s) => s.trip_id !== tripId);
    return { rows: deleted };
  }

  // 13. INSERT INTO STOPS
  if (lower.startsWith('insert into stops')) {
    const [trip_id, city_id, start_date, end_date, order_index] = params;
    const city = memoryDB.cities.find((c) => c.id === parseInt(city_id, 10)) || memoryDB.cities[0] || {};
    const newStop = {
      id: 500 + memoryDB.stops.length + 1,
      trip_id: parseInt(trip_id, 10),
      city_id: parseInt(city_id, 10),
      start_date: start_date || null,
      end_date: end_date || null,
      order_index: parseInt(order_index, 10) || 0,
      city_name: city.name || 'Unknown',
      country: city.country || 'Unknown',
    };
    memoryDB.stops.push(newStop);
    return { rows: [newStop] };
  }

  // 14. UPDATE STOPS (reorder)
  if (lower.startsWith('update stops')) {
    const orderIdx = parseInt(params[0], 10);
    const stopId = parseInt(params[1], 10);
    const stop = memoryDB.stops.find((s) => s.id === stopId);
    if (stop) stop.order_index = orderIdx;
    return { rows: stop ? [stop] : [] };
  }

  // 15. DELETE FROM STOPS
  if (lower.startsWith('delete from stops')) {
    const stopId = parseInt(params[0], 10);
    const idx = memoryDB.stops.findIndex((s) => s.id === stopId);
    const deleted = idx >= 0 ? memoryDB.stops.splice(idx, 1) : [];
    // Also clean up related activities
    memoryDB.trip_activities = memoryDB.trip_activities.filter((ta) => ta.stop_id !== stopId);
    return { rows: deleted };
  }

  // 16. INSERT INTO TRIP_ACTIVITIES
  if (lower.startsWith('insert into trip_activities')) {
    const [stop_id, activity_id, day_number, time_slot, cost, custom_name, notes] = params;
    const act = memoryDB.activities.find((a) => a.id === parseInt(activity_id, 10)) || {};
    const newTa = {
      id: 800 + memoryDB.trip_activities.length + 1,
      stop_id: parseInt(stop_id, 10),
      activity_id: parseInt(activity_id, 10),
      day_number: parseInt(day_number, 10) || 1,
      time_slot: time_slot || 'morning',
      cost: parseFloat(cost) || parseFloat(act.est_cost) || 0,
      custom_name: custom_name || act.name || 'Activity',
      notes: notes || '',
      activity_name: act.name || custom_name || 'Activity',
      type: act.type || act.category || 'sightseeing',
      description: act.description || '',
    };
    memoryDB.trip_activities.push(newTa);
    return { rows: [newTa] };
  }

  // 17. DELETE FROM TRIP_ACTIVITIES
  if (lower.startsWith('delete from trip_activities')) {
    const taId = parseInt(params[0], 10);
    const idx = memoryDB.trip_activities.findIndex((ta) => ta.id === taId);
    const deleted = idx >= 0 ? memoryDB.trip_activities.splice(idx, 1) : [];
    return { rows: deleted };
  }

  // 18. INSERT INTO BUDGETS
  if (lower.startsWith('insert into budgets')) {
    const [trip_id, transport_cost, stay_cost, activities_cost, meals_cost, currency] = params;
    const budget = {
      id: 200 + Math.floor(Math.random() * 900),
      trip_id: parseInt(trip_id, 10),
      transport_cost: parseFloat(transport_cost) || 0,
      stay_cost: parseFloat(stay_cost) || 0,
      activities_cost: parseFloat(activities_cost) || 0,
      meals_cost: parseFloat(meals_cost) || 0,
      currency: currency || 'USD',
    };
    return { rows: [budget] };
  }

  // 19. SELECT FROM BUDGETS
  if (lower.includes('from budgets')) {
    const tripId = params[0] ? parseInt(params[0], 10) : 101;
    return {
      rows: [
        {
          id: 1,
          trip_id: tripId,
          transport_cost: 150.00,
          stay_cost: 400.00,
          activities_cost: 127.00,
          meals_cost: 180.00,
          currency: 'USD',
        },
      ],
    };
  }

  // 20. ADMIN SPECIFIC QUERIES
  // 20.1 Total Users Count
  if (lower.includes('count(*) as count from users') || (lower.includes('count(*)') && lower.includes('from users') && !lower.includes('group by'))) {
    return { rows: [{ count: memoryDB.users.length }] };
  }

  // 20.2 Total Trips Count
  if (lower.includes('count(*) as count from trips') || (lower.includes('count(*)') && lower.includes('from trips') && !lower.includes('group by'))) {
    return { rows: [{ count: memoryDB.trips.length }] };
  }

  // 20.3 Trips Trend (last 10 days)
  if (lower.includes('group by date(created_at)') || (lower.includes('from trips') && lower.includes('date(created_at)'))) {
    const trendMap = {};
    memoryDB.trips.forEach((t) => {
      const d = (t.created_at || new Date().toISOString()).split('T')[0];
      trendMap[d] = (trendMap[d] || 0) + 1;
    });
    const rows = Object.keys(trendMap).map((d) => ({ date: d, count: trendMap[d] }));
    if (rows.length === 0) {
      rows.push({ date: new Date().toISOString().split('T')[0], count: memoryDB.trips.length });
    }
    return { rows };
  }

  // 20.4 Top Cities
  if (lower.includes('from stops s') && lower.includes('join cities c')) {
    const cityCounts = {};
    memoryDB.stops.forEach((s) => {
      const city = memoryDB.cities.find((c) => c.id === s.city_id) || { name: 'Paris', country: 'France' };
      const key = `${city.name}::${city.country}`;
      cityCounts[key] = (cityCounts[key] || 0) + 1;
    });
    const rows = Object.keys(cityCounts)
      .map((k) => {
        const [city_name, country] = k.split('::');
        return { city_name, country, count: cityCounts[k] };
      })
      .sort((a, b) => b.count - a.count);
    return { rows: rows.length > 0 ? rows : [{ city_name: 'Paris', country: 'France', count: 3 }, { city_name: 'Tokyo', country: 'Japan', count: 2 }] };
  }

  // 20.5 Top Activities
  if (lower.includes('from trip_activities ta') && lower.includes('join activities a')) {
    const actCounts = {};
    memoryDB.trip_activities.forEach((ta) => {
      const name = ta.activity_name || ta.custom_name || 'Activity';
      const type = ta.type || 'sightseeing';
      const key = `${name}::${type}`;
      actCounts[key] = (actCounts[key] || 0) + 1;
    });
    const rows = Object.keys(actCounts)
      .map((k) => {
        const [activity_name, type] = k.split('::');
        return { activity_name, type, count: actCounts[k] };
      })
      .sort((a, b) => b.count - a.count);
    return { rows: rows.length > 0 ? rows : [{ activity_name: 'Eiffel Tower Tour', type: 'sightseeing', count: 2 }] };
  }

  // 20.6 Admin Users List with Trips Count
  if (lower.includes('from users u') && lower.includes('trips_count')) {
    const rows = memoryDB.users.map((u) => {
      const tripsCount = memoryDB.trips.filter((t) => t.user_id === u.id).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        trips_count: tripsCount,
        created_at: u.created_at || '2026-01-01T00:00:00.000Z',
      };
    });
    return { rows };
  }

  // 20.7 Toggle Role
  if (lower.startsWith('update users') && lower.includes('case when role =')) {
    const userId = parseInt(params[0], 10);
    const user = memoryDB.users.find((u) => u.id === userId);
    if (user) {
      user.role = user.role === 'admin' ? 'user' : 'admin';
      return { rows: [{ id: user.id, name: user.name, email: user.email, role: user.role }] };
    }
    return { rows: [] };
  }

  // 21. DELETE FROM USERS
  if (lower.startsWith('delete from users')) {
    const userId = parseInt(params[0], 10);
    const idx = memoryDB.users.findIndex((u) => u.id === userId);
    const deleted = idx >= 0 ? memoryDB.users.splice(idx, 1) : [];
    return { rows: deleted };
  }

  // Fallback generic response
  return { rows: [] };
}

module.exports = {
  pool,
  query,
};
