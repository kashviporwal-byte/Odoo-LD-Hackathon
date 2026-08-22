/**
 * Map Data & GeoJSON Helper Services for Leaflet / OpenStreetMap Integration
 * Person B Deliverable
 */

/**
 * Builds a clean, Leaflet-ready array of coordinates and stop metadata
 * @param {Array} stops - Array of stop records with joined city information
 * @returns {Array} List of route points ordered by order_index
 */
function buildRouteArray(stops = []) {
  return stops
    .filter((stop) => stop.lat !== null && stop.lng !== null)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((stop, index) => ({
      order: index,
      stopId: stop.id || stop.stop_id,
      cityId: stop.city_id,
      cityName: stop.city_name || stop.name,
      country: stop.country,
      lat: parseFloat(stop.lat),
      lng: parseFloat(stop.lng),
      startDate: stop.start_date,
      endDate: stop.end_date,
      activitiesCount: parseInt(stop.activities_count || 0, 10),
    }));
}

/**
 * Builds a standard GeoJSON FeatureCollection containing:
 * 1. A LineString feature representing the travel polyline connecting stops in sequence
 * 2. Point features for each city stop pin with popup metadata
 * 
 * Note: GeoJSON uses [longitude, latitude] coordinate ordering standard
 * 
 * @param {Array} stops - Array of stop records with joined city details
 * @returns {Object} GeoJSON FeatureCollection
 */
function buildRouteGeoJSON(stops = []) {
  const sortedStops = stops
    .filter((s) => s.lat !== null && s.lng !== null)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  if (sortedStops.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  // 1. Point features for each stop pin
  const pointFeatures = sortedStops.map((stop, index) => {
    const lat = parseFloat(stop.lat);
    const lng = parseFloat(stop.lng);

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON standard: [lng, lat]
      },
      properties: {
        order: index,
        stopId: stop.id || stop.stop_id,
        cityId: stop.city_id,
        cityName: stop.city_name || stop.name,
        country: stop.country,
        startDate: stop.start_date,
        endDate: stop.end_date,
        image_url: stop.image_url,
        cost_index: stop.cost_index,
        popularity: stop.popularity,
      },
    };
  });

  // 2. LineString feature connecting all stops
  const lineCoordinates = sortedStops.map((stop) => [
    parseFloat(stop.lng),
    parseFloat(stop.lat),
  ]);

  const lineFeature = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: lineCoordinates,
    },
    properties: {
      type: 'travel_route',
      totalStops: sortedStops.length,
      cities: sortedStops.map((s) => s.city_name || s.name),
    },
  };

  return {
    type: 'FeatureCollection',
    features: [lineFeature, ...pointFeatures],
  };
}

module.exports = {
  buildRouteArray,
  buildRouteGeoJSON,
};
