const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Clear existing data to ensure idempotent seeding
  await prisma.budget.deleteMany();
  await prisma.tripActivity.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.city.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared database tables.');

  // 2. Load cities data
  const rawCitiesPath = path.join(__dirname, '..', 'scripts', 'data', 'rawCities.json');
  const rawCities = JSON.parse(fs.readFileSync(rawCitiesPath, 'utf8'));

  const createdCities = [];
  for (const cityData of rawCities) {
    const city = await prisma.city.create({
      data: {
        name: cityData.name,
        country: cityData.country,
        lat: cityData.lat,
        lng: cityData.lng,
        costIndex: cityData.cost_index,
        popularityScore: cityData.popularity,
        region: cityData.region,
        imageUrl: cityData.image_url,
      },
    });
    createdCities.push(city);
  }
  console.log(`Seeded ${createdCities.length} cities.`);

  // 3. Load activities data
  const rawActivitiesPath = path.join(__dirname, '..', 'scripts', 'data', 'rawActivities.json');
  const rawActivitiesData = JSON.parse(fs.readFileSync(rawActivitiesPath, 'utf8'));

  let activityCount = 0;
  for (const group of rawActivitiesData) {
    // Find the corresponding seeded city
    const city = createdCities.find(
      (c) => c.name.toLowerCase() === group.cityName.toLowerCase()
    );
    if (!city) continue;

    for (const act of group.activities) {
      await prisma.activity.create({
        data: {
          cityId: city.id,
          name: act.name,
          category: act.type,
          description: act.description,
          imageUrl: act.image_url,
          estCost: act.cost,
          estDurationMins: act.duration,
        },
      });
      activityCount++;
    }
  }

  console.log(`Seeded ${activityCount} activities.`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
