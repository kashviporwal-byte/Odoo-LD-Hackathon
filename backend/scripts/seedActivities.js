const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function seedActivities() {
  console.log('🚀 Starting Activities Seeding...');

  const rawPath = path.join(__dirname, 'data', 'rawActivities.json');
  const cityActivitiesList = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  let insertedCount = 0;

  for (const cityGroup of cityActivitiesList) {
    const { cityName, activities } = cityGroup;

    // Find city ID
    const cityRes = await db.query(
      `SELECT id FROM cities WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [cityName]
    );

    if (!cityRes.rows || cityRes.rows.length === 0) {
      console.warn(`[Activities Seeder] City "${cityName}" not found in DB. Run seedCities first.`);
      continue;
    }

    const cityId = cityRes.rows[0].id;

    for (const act of activities) {
      // Check if activity exists
      const existingAct = await db.query(
        `SELECT id FROM activities WHERE city_id = $1 AND LOWER(name) = LOWER($2)`,
        [cityId, act.name]
      );

      if (existingAct.rows && existingAct.rows.length > 0) {
        await db.query(
          `UPDATE activities 
           SET type = $1, cost = $2, duration = $3, description = $4, image_url = $5
           WHERE id = $6`,
          [act.type, act.cost, act.duration, act.description, act.image_url, existingAct.rows[0].id]
        );
      } else {
        await db.query(
          `INSERT INTO activities (city_id, name, type, cost, duration, description, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cityId, act.name, act.type, act.cost, act.duration, act.description, act.image_url]
        );
        insertedCount++;
      }
    }
  }

  console.log(`✅ Activities seeding complete. ${insertedCount} new activities inserted.`);
  return { insertedCount };
}

if (require.main === module) {
  seedActivities()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Activities seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedActivities };
