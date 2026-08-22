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
    { id: 999, name: 'Demo Traveler', email: 'traveler@odoo.com', password_hash: '', role: 'user' },
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
    },
  ],
  cities: [],
  stops: [
    { id: 501, trip_id: 101, city_id: 1, start_date: '2026-07-01', end_date: '2026-07-04', order_index: 0 },
    { id: 502, trip_id: 101, city_id: 7, start_date: '2026-07-05', end_date: '2026-07-07', order_index: 1 },
    { id: 503, trip_id: 101, city_id: 2, start_date: '2026-07-08', end_date: '2026-07-10', order_index: 2 },
  ],
  activities: [],
  trip_activities: [
    { id: 801, stop_id: 501, activity_id: 1, day_number: 1, time_slot: 'morning', cost: 35.00, custom_name: 'Eiffel Tower Summit Access' },
    { id: 802, stop_id: 501, activity_id: 2, day_number: 2, time_slot: 'afternoon', cost: 22.00, custom_name: 'Louvre Museum Tour' },
    { id: 803, stop_id: 502, activity_id: 15, day_number: 5, time_slot: 'morning', cost: 25.00, custom_name: 'Canal Ring Cruise' },
    { id: 804, stop_id: 503, activity_id: 5, day_number: 8, time_slot: 'morning', cost: 45.00, custom_name: 'Colosseum VIP Tour' },
  ],
};

function initMemoryDB() {
  if (memoryDBInitialized) return;
  try {
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
    if (lower.includes('where id = $1')) {
      const trip = memoryDB.trips.find((t) => t.id === parseInt(params[0], 10)) || memoryDB.trips[0];
      return { rows: trip ? [trip] : [] };
    }
    return { rows: memoryDB.trips };
  }

  // 5. SELECT STOPS WITH JOINED CITIES
  if (lower.includes('from stops') && lower.includes('join cities')) {
    const tripId = parseInt(params[0], 10);
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
    const photoUrl = params[0];
    const userId = parseInt(params[1], 10);
    const user = memoryDB.users.find((u) => u.id === userId);
    if (user) {
      user.photo_url = photoUrl;
    }
    return { rows: user ? [user] : [] };
  }

  // Fallback generic empty response
  return { rows: [] };
}

module.exports = {
  pool,
  query,
};
