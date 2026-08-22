require('dotenv').config();
const { Client } = require('pg');
const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/globetrotter$/, '/postgres') : 'postgresql://postgres:1234@localhost:5432/postgres';
const client = new Client(dbUrl);

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
