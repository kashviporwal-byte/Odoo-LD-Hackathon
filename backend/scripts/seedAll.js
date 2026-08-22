const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { seedCities } = require('./seedCities');
const { seedActivities } = require('./seedActivities');

async function seedAll() {
  console.log('========================================');
  console.log('GlobeTrotter: Full Database Initialization');
  console.log('========================================');

  try {
    // 1. Run Schema Migrations / Tables creation
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Applying db/schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(schemaSql);
      console.log('✅ Schema tables verified/created successfully.');
    }

    // 2. Seed Cities
    await seedCities();

    // 3. Seed Activities
    await seedActivities();

    console.log('========================================');
    console.log('🎉 Database setup and seeding completed!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during database initialization:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };
