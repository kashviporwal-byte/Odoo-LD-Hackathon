const { Client } = require('pg');
// Default credentials connecting to postgres default db
const client = new Client('postgresql://postgres:postgres@localhost:5432/postgres');

async function init() {
  try {
    await client.connect();
    console.log('Successfully connected to local PostgreSQL instance.');
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='globetrotter'");
    if (res.rows.length === 0) {
      console.log("Creating database 'globetrotter'...");
      await client.query("CREATE DATABASE globetrotter");
      console.log("Database 'globetrotter' created successfully.");
    } else {
      console.log("Database 'globetrotter' already exists.");
    }
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
  } finally {
    await client.end();
  }
}

init();
