require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function applySchema() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Loading database tables schema...');
    await pool.query(schemaSql);
    console.log('Database schema applied successfully!');
  } catch (err) {
    console.error('Failed to apply schema:', err.message);
  } finally {
    await pool.end();
  }
}

applySchema();
