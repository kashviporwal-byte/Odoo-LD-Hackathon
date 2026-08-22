const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set in environment variables!");
}

const pool = new Pool({
  connectionString: databaseUrl,
  // Adjust based on hackathon environment requirements
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database pool event listeners for debugging/monitoring
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Database pool: Client connected successfully');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = {
  pool,
  /**
   * Helper function to execute queries safely
   * @param {string} text - SQL Query statement
   * @param {Array} params - Param values for parameterized query
   */
  query: (text, params) => {
    return pool.query(text, params);
  }
};
