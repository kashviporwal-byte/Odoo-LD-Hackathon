-- PostgreSQL Database Schema for GlobeTrotter
-- Owned by Person A (Shared Database Infrastructure)

-- 1. Users Table (Person A + Role column for Admin check)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    language VARCHAR(50) DEFAULT 'en',            -- Matches Person A settings
    role VARCHAR(50) DEFAULT 'user',              -- 'user' or 'admin'
    is_active BOOLEAN DEFAULT TRUE,               -- Support account lockout
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trips Table (Person A + Public/Share Slug features)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    cover_photo_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,              -- Public sharing setting
    share_slug VARCHAR(255) UNIQUE,               -- Unique slug for sharing URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cities Database Table (Person B Search / Seeding feature)
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    cost_index INTEGER DEFAULT 2,                 -- e.g., 1=Low, 2=Medium, 3=High
    popularity INTEGER DEFAULT 1,                 -- Popularity level/score
    region VARCHAR(255),
    image_url VARCHAR(500)
);

-- 4. Stops Table (Person B Itinerary Builder stops linking trips to cities)
CREATE TABLE IF NOT EXISTS stops (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    arrival_date DATE,
    departure_date DATE,
    stop_order INTEGER NOT NULL                   -- Supports drag-and-drop ordering
);

-- 5. Global Activities Base Table (Person B Activity Search dataset per city)
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,               -- Category of activity (food, adventure, sightseeing)
    description TEXT,
    image_url VARCHAR(500),
    est_cost DECIMAL(10, 2) DEFAULT 0.00,
    est_duration_mins INTEGER
);

-- 6. Stop-Specific Selected Activities Table (Person B Itinerary Builder)
CREATE TABLE IF NOT EXISTS trip_activities (
    id SERIAL PRIMARY KEY,
    stop_id INTEGER REFERENCES stops(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,                  -- Relative day (1, 2, N)
    time_slot VARCHAR(50) NOT NULL,               -- e.g., morning, afternoon, evening
    cost DECIMAL(10, 2) DEFAULT 0.00,             -- Base cost
    scheduled_date DATE,                          -- Person A specific addition
    scheduled_time TIME,                          -- Person A specific addition
    cost_override DECIMAL(10, 2),                 -- Person A specific addition
    notes TEXT                                    -- Person A specific addition
);

-- 7. Budgets Summary Table (Person C Budget engine)
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
    transport_cost DECIMAL(10, 2) DEFAULT 0.00,
    stay_cost DECIMAL(10, 2) DEFAULT 0.00,
    activities_cost DECIMAL(10, 2) DEFAULT 0.00,
    meals_cost DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(50) DEFAULT 'USD'
);

-- Indexes for lookup optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_share_slug ON trips(share_slug);
CREATE INDEX IF NOT EXISTS idx_stops_trip ON stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_stops_city ON stops(city_id);
CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city_id);
CREATE INDEX IF NOT EXISTS idx_trip_activities_stop ON trip_activities(stop_id);
CREATE INDEX IF NOT EXISTS idx_trip_activities_activity ON trip_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_budgets_trip ON budgets(trip_id);
