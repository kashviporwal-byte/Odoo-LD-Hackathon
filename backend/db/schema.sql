-- PostgreSQL Database Schema for GlobeTrotter

-- 1. Users Table (Person A + Role column for Person C Admin check)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    language_pref VARCHAR(50) DEFAULT 'en',
    role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin' (Person C validation)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trips Table (Person A + share_token for Person C Share feature)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    cover_photo_url VARCHAR(500),
    share_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cities Database Table (Person B Search / Seeding feature)
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    cost_index INTEGER DEFAULT 2, -- e.g., 1=Low, 2=Medium, 3=High
    popularity INTEGER DEFAULT 1, -- e.g., 1-5 scale rating
    image_url VARCHAR(500)
);

-- 4. Stops Table (Person B Itinerary Builder stops linking trips to cities)
CREATE TABLE IF NOT EXISTS stops (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    order_index INTEGER NOT NULL -- Supports reordering drag-and-drop
);

-- 5. Global Activities Base Table (Person B Activity Search dataset per city)
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., sightseeing, food, adventure, shopping
    cost DECIMAL(10, 2) DEFAULT 0.00,
    duration INTEGER, -- in minutes
    description TEXT,
    image_url VARCHAR(500)
);

-- 6. Stop-Specific Selected Activities Table (Person B Itinerary Builder linking stops to activities)
CREATE TABLE IF NOT EXISTS trip_activities (
    id SERIAL PRIMARY KEY,
    stop_id INTEGER REFERENCES stops(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL, -- relative day number (e.g. Day 1, Day 2)
    time_slot VARCHAR(50) NOT NULL, -- e.g., morning, afternoon, evening
    cost DECIMAL(10, 2) DEFAULT 0.00 -- Cost computed for budget sheets
);

-- 7. Budgets Summary Table (Person C Budget engine)
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    transport_cost DECIMAL(10, 2) DEFAULT 0.00,
    stay_cost DECIMAL(10, 2) DEFAULT 0.00,
    activity_cost DECIMAL(10, 2) DEFAULT 0.00,
    meal_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_cost DECIMAL(10, 2) DEFAULT 0.00
);

-- Indexes for lookup optimization
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_stops_trip ON stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city_id);
CREATE INDEX IF NOT EXISTS idx_trip_activities_stop ON trip_activities(stop_id);
CREATE INDEX IF NOT EXISTS idx_budgets_trip ON budgets(trip_id);
