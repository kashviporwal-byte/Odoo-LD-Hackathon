import type { Trip, CityStop, Activity, CityMeta, BudgetCategory } from '@/types';
import { mockCities, mockActivities } from './mockData';

/**
 * Format Date to YYYY-MM-DD string
 */
function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateStr(d);
}

/**
 * Find activities matching a city ID or city name
 */
export function getActivitiesForCity(cityId: string, cityName?: string): Activity[] {
  const directMatches = mockActivities.filter((a) => a.cityId === cityId);
  if (directMatches.length > 0) return directMatches;

  if (cityName) {
    const city = mockCities.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (city) {
      const byCity = mockActivities.filter((a) => a.cityId === city.id);
      if (byCity.length > 0) return byCity;
    }
  }

  // Fallback generic activities
  return [
    {
      id: `gen-act-1-${Date.now()}`,
      name: `${cityName || 'City'} Center Walking Tour`,
      description: `Explore the iconic historic architecture and local streets.`,
      category: 'sightseeing',
      time: '09:30',
      startTime: '09:30',
      endTime: '12:00',
      durationHours: 2.5,
      cost: 15,
      currency: 'USD',
      rating: 4.8,
      cityId,
    },
    {
      id: `gen-act-2-${Date.now() + 1}`,
      name: `Local Food & Market Tasting`,
      description: `Sample authentic culinary specialties and regional delicacies.`,
      category: 'food',
      time: '13:00',
      startTime: '13:00',
      endTime: '15:00',
      durationHours: 2,
      cost: 35,
      currency: 'USD',
      rating: 4.9,
      cityId,
    },
    {
      id: `gen-act-3-${Date.now() + 2}`,
      name: `Panoramic Viewpoint & Sunset`,
      description: `Scenic views of the skyline during the golden hour.`,
      category: 'sightseeing',
      time: '18:00',
      startTime: '18:00',
      endTime: '19:30',
      durationHours: 1.5,
      cost: 0,
      currency: 'USD',
      rating: 4.7,
      cityId,
    },
  ];
}

/**
 * Generate a complete multi-stop / single-city Itinerary for any Destination Card click
 */
export function generateItineraryForCity(
  city: CityMeta,
  options?: {
    startDate?: string;
    durationDays?: number;
    budget?: number;
    userId?: string;
  }
): Trip {
  const now = new Date();
  now.setDate(now.getDate() + 14); // 2 weeks in future by default
  const startDate = options?.startDate || formatDateStr(now);
  const duration = options?.durationDays || 5;
  const endDate = addDays(startDate, duration - 1);
  const userId = options?.userId || 'user-1';

  const activities = getActivitiesForCity(city.id, city.name);
  const estDaily = city.avgDailyCostUSD || 120;
  const totalBudget = options?.budget || estDaily * duration + 400;

  const transport = Math.round(totalBudget * 0.25);
  const stay = Math.round(totalBudget * 0.4);
  const actCost = Math.round(totalBudget * 0.15);
  const meals = Math.round(totalBudget * 0.15);
  const misc = totalBudget - (transport + stay + actCost + meals);

  const stop: CityStop = {
    id: `stop-${Date.now()}-1`,
    cityId: city.id,
    city: city.name,
    country: city.country,
    countryCode: city.countryCode,
    startDate,
    endDate,
    coverPhoto: city.coverPhoto,
    order: 0,
    activities,
  };

  const tripId = `trip-${Date.now()}`;

  return {
    id: tripId,
    name: `Explore ${city.name}`,
    description: city.description || `A curated ${duration}-day journey through ${city.name}, ${city.country}.`,
    coverPhoto: city.coverPhoto,
    status: 'upcoming',
    isPublic: true,
    shareSlug: `${city.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    budget: totalBudget,
    budgetBreakdown: {
      transport,
      stay,
      activities: actCost,
      meals,
      misc: Math.max(0, misc),
    },
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [city.region.toLowerCase(), 'curated', 'adventure'],
    stops: [stop],
  };
}

/**
 * Automatically generate a structured itinerary when creating a new custom trip from the form
 */
export function generateItineraryForNewTrip(tripData: {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  coverPhoto: string;
  userId?: string;
  isPublic?: boolean;
}): Trip {
  const search = (tripData.name + ' ' + (tripData.description || '')).toLowerCase();

  // Detect matching cities
  let matchedCities = mockCities.filter((c) =>
    search.includes(c.name.toLowerCase()) || search.includes(c.country.toLowerCase())
  );

  // If no direct city match, pick top 2 popular cities as default itinerary
  if (matchedCities.length === 0) {
    matchedCities = [mockCities[0], mockCities[1]]; // Tokyo & Paris
  }

  // Calculate total days
  const start = new Date(tripData.startDate || new Date());
  const end = new Date(tripData.endDate || addDays(tripData.startDate, 7));
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const daysPerStop = Math.max(1, Math.floor(totalDays / matchedCities.length));

  // Build stops with realistic day intervals & curated activities
  let currDate = formatDateStr(start);
  const stops: CityStop[] = matchedCities.map((city, idx) => {
    const isLast = idx === matchedCities.length - 1;
    const stopDays = isLast ? Math.max(1, totalDays - idx * daysPerStop) : daysPerStop;
    const stopStart = currDate;
    const stopEnd = addDays(stopStart, stopDays - 1);
    currDate = addDays(stopEnd, 1);

    const cityActivities = getActivitiesForCity(city.id, city.name);

    return {
      id: `stop-${Date.now()}-${idx + 1}`,
      cityId: city.id,
      city: city.name,
      country: city.country,
      countryCode: city.countryCode,
      startDate: stopStart,
      endDate: stopEnd,
      coverPhoto: city.coverPhoto,
      order: idx,
      activities: cityActivities,
    };
  });

  const budget = tripData.budget || 2000;
  const budgetBreakdown: BudgetCategory = {
    transport: Math.round(budget * 0.25),
    stay: Math.round(budget * 0.38),
    activities: Math.round(budget * 0.18),
    meals: Math.round(budget * 0.14),
    misc: Math.round(budget * 0.05),
  };

  const tripId = `trip-${Date.now()}`;

  return {
    id: tripId,
    name: tripData.name,
    description: tripData.description || `Exciting customized travel journey across ${matchedCities.map((c) => c.name).join(', ')}.`,
    coverPhoto: tripData.coverPhoto,
    status: 'upcoming',
    isPublic: tripData.isPublic ?? true,
    shareSlug: `${tripData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    budget,
    budgetBreakdown,
    userId: tripData.userId || 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: matchedCities.map((c) => c.name.toLowerCase()),
    stops,
  };
}
