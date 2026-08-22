const assert = require('assert');
const { buildRouteArray, buildRouteGeoJSON } = require('../services/mapService');
const { getDaysList, assembleItinerary, assembleCalendarEvents } = require('../services/itineraryService');

async function runPersonBTests() {
  console.log('🧪 Running Person B Unit & Integration Tests...\n');

  // =========================================================================
  // Test 1: mapService - buildRouteArray and buildRouteGeoJSON
  // =========================================================================
  console.log('▶ Test 1: mapService (Leaflet route array & GeoJSON generator)');
  const sampleStops = [
    {
      id: 10,
      city_id: 1,
      city_name: 'Paris',
      country: 'France',
      lat: '48.856614',
      lng: '2.352222',
      order_index: 0,
      start_date: '2026-07-01',
      end_date: '2026-07-04',
      activities_count: 2,
    },
    {
      id: 11,
      city_id: 2,
      city_name: 'Rome',
      country: 'Italy',
      lat: '41.902783',
      lng: '12.496366',
      order_index: 1,
      start_date: '2026-07-05',
      end_date: '2026-07-08',
      activities_count: 1,
    },
  ];

  const route = buildRouteArray(sampleStops);
  assert.strictEqual(route.length, 2, 'Route should have 2 points');
  assert.strictEqual(typeof route[0].lat, 'number', 'lat should be numeric');
  assert.strictEqual(typeof route[0].lng, 'number', 'lng should be numeric');
  assert.strictEqual(route[0].cityName, 'Paris');
  assert.strictEqual(route[1].cityName, 'Rome');

  const geoJson = buildRouteGeoJSON(sampleStops);
  assert.strictEqual(geoJson.type, 'FeatureCollection', 'GeoJSON must be FeatureCollection');
  // 1 LineString + 2 Points = 3 features
  assert.strictEqual(geoJson.features.length, 3, 'Should have 1 LineString + 2 Points');
  
  const lineStringFeature = geoJson.features.find((f) => f.geometry.type === 'LineString');
  assert.ok(lineStringFeature, 'LineString feature must exist for Leaflet route');
  assert.deepStrictEqual(
    lineStringFeature.geometry.coordinates,
    [[2.352222, 48.856614], [12.496366, 41.902783]],
    'GeoJSON coordinates must be [lng, lat]'
  );
  console.log('  ✅ mapService tests passed successfully.');

  // =========================================================================
  // Test 2: itineraryService - getDaysList and assembleItinerary
  // =========================================================================
  console.log('▶ Test 2: itineraryService (Day calculation & Chronological Itinerary)');
  const daysList = getDaysList('2026-07-01', '2026-07-05');
  assert.strictEqual(daysList.length, 5, 'Days count between 2026-07-01 and 2026-07-05 should be 5');
  assert.strictEqual(daysList[0], '2026-07-01');
  assert.strictEqual(daysList[4], '2026-07-05');

  const sampleTrip = {
    id: 100,
    name: 'Europe Holiday',
    start_date: '2026-07-01',
    end_date: '2026-07-04',
    description: '4 day trip to Paris',
    cover_photo_url: 'https://example.com/photo.jpg',
  };

  const sampleActivities = [
    {
      id: 501,
      stop_id: 10,
      activity_id: 201,
      day_number: 1,
      time_slot: 'morning',
      cost: 35.00,
      name: 'Eiffel Tower',
      type: 'sightseeing',
      duration: 120,
    },
    {
      id: 502,
      stop_id: 10,
      activity_id: 202,
      day_number: 2,
      time_slot: 'afternoon',
      cost: 25.00,
      name: 'Louvre Museum',
      type: 'culture',
      duration: 180,
    },
  ];

  const itinerary = assembleItinerary(sampleTrip, [sampleStops[0]], sampleActivities);
  assert.strictEqual(itinerary.totalDays, 4, 'Trip should span 4 days');
  assert.strictEqual(itinerary.totalActivities, 2, 'Total activities count should be 2');
  assert.strictEqual(itinerary.totalActivityCost, 60.00, 'Total activity cost should be 60');
  assert.strictEqual(itinerary.days[0].activities.length, 1, 'Day 1 should have 1 activity');
  assert.strictEqual(itinerary.days[0].activities[0].name, 'Eiffel Tower');
  assert.strictEqual(itinerary.days[1].activities[0].name, 'Louvre Museum');
  assert.strictEqual(itinerary.days[2].activities.length, 0, 'Day 3 should have 0 activities');
  console.log('  ✅ itineraryService day calculation & assembly tests passed.');

  // =========================================================================
  // Test 3: itineraryService - assembleCalendarEvents (Screen 10)
  // =========================================================================
  console.log('▶ Test 3: Calendar & Timeline Event Mapping (Screen 10)');
  const events = assembleCalendarEvents(sampleTrip, [sampleStops[0]], sampleActivities);
  assert.strictEqual(events.length, 2, 'Should generate 2 calendar events');
  assert.strictEqual(events[0].title, 'Eiffel Tower');
  assert.strictEqual(events[0].start, '2026-07-01T09:00:00', 'Morning slot starts at 9:00 AM');
  assert.strictEqual(events[1].title, 'Louvre Museum');
  assert.strictEqual(events[1].start, '2026-07-02T13:00:00', 'Afternoon slot starts at 1:00 PM');
  console.log('  ✅ Calendar event mapping tests passed.');

  // =========================================================================
  // Test 4: City Search Raw Dataset Integrity
  // =========================================================================
  console.log('▶ Test 4: Raw Datasets Verification');
  const fs = require('fs');
  const path = require('path');
  const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'data', 'rawCities.json'), 'utf8'));
  const activities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'data', 'rawActivities.json'), 'utf8'));

  assert.ok(cities.length >= 20, 'Curated cities dataset must contain at least 20 destinations');
  assert.ok(activities.length >= 5, 'Activities dataset must cover multiple cities');
  
  cities.forEach((c) => {
    assert.ok(c.name && c.country && c.region, `City ${c.name} missing essential metadata`);
    assert.ok(typeof c.lat === 'number' && typeof c.lng === 'number', `City ${c.name} has invalid coordinates`);
    assert.ok(c.cost_index >= 1 && c.cost_index <= 5, `City ${c.name} has invalid cost_index`);
    assert.ok(c.popularity >= 1 && c.popularity <= 100, `City ${c.name} has invalid popularity`);
  });
  console.log(`  ✅ ${cities.length} curated cities & ${activities.length} activity groups validated.`);

  console.log('\n========================================');
  console.log('🎉 ALL PERSON B TESTS PASSED (100% OK)');
  console.log('========================================\n');
}

if (require.main === module) {
  runPersonBTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failure:', err);
      process.exit(1);
    });
}

module.exports = { runPersonBTests };
