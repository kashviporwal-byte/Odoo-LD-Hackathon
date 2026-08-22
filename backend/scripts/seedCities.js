const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchNominatimCoords(cityName, countryName) {
  try {
    const query = encodeURIComponent(`${cityName}, ${countryName}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GlobeTrotter-App/1.0 (travel-planner-hackathon@odoo.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }
  } catch (err) {
    console.warn(`[Nominatim] Failed geocoding for ${cityName}: ${err.message}. Using high-precision fallback.`);
  }
  return null;
}

async function seedCities() {
  console.log('🚀 Starting OpenStreetMap Nominatim City Seeding...');

  const rawPath = path.join(__dirname, 'data', 'rawCities.json');
  const rawCities = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  console.log(`Loaded ${rawCities.length} curated destinations.`);

  let inserted = 0;
  let updated = 0;

  for (const city of rawCities) {
    console.log(`Processing ${city.name}, ${city.country}...`);

    // Polite delay for OSM Nominatim API
    const coords = await fetchNominatimCoords(city.name, city.country);
    await delay(500);

    const lat = coords ? coords.lat : city.lat;
    const lng = coords ? coords.lng : city.lng;

    // Check if city exists
    const checkSql = `SELECT id FROM cities WHERE LOWER(name) = LOWER($1) AND LOWER(country) = LOWER($2)`;
    const existing = await db.query(checkSql, [city.name, city.country]);

    if (existing.rows && existing.rows.length > 0) {
      const updateSql = `
        UPDATE cities 
        SET region = $1, lat = $2, lng = $3, cost_index = $4, popularity = $5, image_url = $6, description = $7
        WHERE id = $8
      `;
      await db.query(updateSql, [
        city.region,
        lat,
        lng,
        city.cost_index,
        city.popularity,
        city.image_url,
        city.description,
        existing.rows[0].id,
      ]);
      updated++;
    } else {
      const insertSql = `
        INSERT INTO cities (name, country, region, lat, lng, cost_index, popularity, image_url, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      await db.query(insertSql, [
        city.name,
        city.country,
        city.region,
        lat,
        lng,
        city.cost_index,
        city.popularity,
        city.image_url,
        city.description,
      ]);
      inserted++;
    }
  }

  console.log(`✅ City seeding finished: ${inserted} added, ${updated} updated.`);
  return { inserted, updated, total: rawCities.length };
}

if (require.main === module) {
  seedCities()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ City seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedCities };
