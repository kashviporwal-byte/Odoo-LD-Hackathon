import type { Activity, CityMeta, CityStop, Trip, User, AdminUser, AnalyticsStat } from '@/types';

// ─── Cities ───────────────────────────────────────────────────────────────────

export const mockCities: CityMeta[] = [
  {
    id: 'city-1', name: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'Asia',
    lat: 35.6762, lng: 139.6503,
    costIndex: 7, costTier: 'mid-range', popularityScore: 98, timezone: 'Asia/Tokyo',
    coverPhoto: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    description: 'A dazzling megacity blending ultra-modern technology with ancient temples and world-class cuisine.',
    bestTimeToVisit: 'March–May, Sep–Nov', avgDailyCostUSD: 120,
    topActivities: ['Shibuya Crossing', 'Senso-ji Temple', 'Tsukiji Market', 'Akihabara'],
  },
  {
    id: 'city-2', name: 'Paris', country: 'France', countryCode: 'FR', region: 'Europe',
    lat: 48.8566, lng: 2.3522,
    costIndex: 8, costTier: 'luxury', popularityScore: 97, timezone: 'Europe/Paris',
    coverPhoto: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    description: 'The City of Light — timeless romance, haute cuisine, and iconic art at every turn.',
    bestTimeToVisit: 'Apr–Jun, Sep–Oct', avgDailyCostUSD: 160,
    topActivities: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise'],
  },
  {
    id: 'city-3', name: 'Bali', country: 'Indonesia', countryCode: 'ID', region: 'Asia',
    lat: -8.4095, lng: 115.1889,
    costIndex: 3, costTier: 'budget', popularityScore: 92, timezone: 'Asia/Makassar',
    coverPhoto: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    description: 'Tropical paradise of rice terraces, spiritual temples, surf beaches, and vibrant nightlife.',
    bestTimeToVisit: 'Apr–Oct', avgDailyCostUSD: 50,
    topActivities: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Kuta Beach', 'Monkey Forest'],
  },
  {
    id: 'city-4', name: 'New York', country: 'USA', countryCode: 'US', region: 'Americas',
    lat: 40.7128, lng: -74.0060,
    costIndex: 9, costTier: 'luxury', popularityScore: 96, timezone: 'America/New_York',
    coverPhoto: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    description: 'The city that never sleeps — skyscrapers, Broadway, world-class museums, and infinite food.',
    bestTimeToVisit: 'Sep–Nov, Mar–May', avgDailyCostUSD: 200,
    topActivities: ['Central Park', 'Times Square', 'Brooklyn Bridge', 'MoMA'],
  },
  {
    id: 'city-5', name: 'Barcelona', country: 'Spain', countryCode: 'ES', region: 'Europe',
    lat: 41.3851, lng: 2.1734,
    costIndex: 6, costTier: 'mid-range', popularityScore: 93, timezone: 'Europe/Madrid',
    coverPhoto: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    description: 'Gaudí\'s dreamscapes, tapas culture, golden beaches, and electric nightlife in one city.',
    bestTimeToVisit: 'May–Jun, Sep', avgDailyCostUSD: 110,
    topActivities: ['Sagrada Família', 'Park Güell', 'La Rambla', 'Gothic Quarter'],
  },
  {
    id: 'city-6', name: 'Dubai', country: 'UAE', countryCode: 'AE', region: 'Middle East',
    lat: 25.2048, lng: 55.2708,
    costIndex: 8, costTier: 'luxury', popularityScore: 90, timezone: 'Asia/Dubai',
    coverPhoto: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    description: 'Futuristic skyline rising from the desert — luxury shopping, record-breaking towers, and desert safaris.',
    bestTimeToVisit: 'Nov–Mar', avgDailyCostUSD: 180,
    topActivities: ['Burj Khalifa', 'Dubai Mall', 'Desert Safari', 'Palm Jumeirah'],
  },
  {
    id: 'city-7', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', region: 'Europe',
    lat: 52.3676, lng: 4.9041,
    costIndex: 7, costTier: 'mid-range', popularityScore: 88, timezone: 'Europe/Amsterdam',
    coverPhoto: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
    description: 'Canal-laced city of bicycles, world-class art, and a famously liberal culture.',
    bestTimeToVisit: 'Apr–May, Sep', avgDailyCostUSD: 130,
    topActivities: ['Rijksmuseum', 'Anne Frank House', 'Canal Cruise', 'Vondelpark'],
  },
  {
    id: 'city-8', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', region: 'Asia',
    lat: 13.7563, lng: 100.5018,
    costIndex: 3, costTier: 'budget', popularityScore: 91, timezone: 'Asia/Bangkok',
    coverPhoto: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    description: 'Chaotic, vibrant, and endlessly fascinating — street food heaven with ornate temples.',
    bestTimeToVisit: 'Nov–Feb', avgDailyCostUSD: 45,
    topActivities: ['Grand Palace', 'Wat Pho', 'Chatuchak Market', 'Chao Phraya River'],
  },
  {
    id: 'city-9', name: 'Rome', country: 'Italy', countryCode: 'IT', region: 'Europe',
    lat: 41.9028, lng: 12.4964,
    costIndex: 6, costTier: 'mid-range', popularityScore: 95, timezone: 'Europe/Rome',
    coverPhoto: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    description: 'The Eternal City — layers of millennia-old history beside gelaterias and piazzas.',
    bestTimeToVisit: 'Apr–Jun, Sep–Oct', avgDailyCostUSD: 115,
    topActivities: ['Colosseum', 'Vatican', 'Trevi Fountain', 'Roman Forum'],
  },
  {
    id: 'city-10', name: 'Sydney', country: 'Australia', countryCode: 'AU', region: 'Oceania',
    lat: -33.8688, lng: 151.2093,
    costIndex: 8, costTier: 'luxury', popularityScore: 89, timezone: 'Australia/Sydney',
    coverPhoto: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
    description: 'Iconic harbour city with world-famous Opera House, golden beaches, and laid-back culture.',
    bestTimeToVisit: 'Sep–Nov, Mar–May', avgDailyCostUSD: 175,
    topActivities: ['Opera House', 'Bondi Beach', 'Harbour Bridge', 'Blue Mountains'],
  },
  {
    id: 'city-11', name: 'Kyoto', country: 'Japan', countryCode: 'JP', region: 'Asia',
    lat: 35.0116, lng: 135.7681,
    costIndex: 6, costTier: 'mid-range', popularityScore: 87, timezone: 'Asia/Tokyo',
    coverPhoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    description: 'Japan\'s ancient capital — thousands of shrines, geishas, and bamboo groves.',
    bestTimeToVisit: 'Mar–May, Oct–Nov', avgDailyCostUSD: 100,
    topActivities: ['Fushimi Inari', 'Arashiyama Bamboo', 'Kinkaku-ji', 'Gion District'],
  },
  {
    id: 'city-12', name: 'Marrakech', country: 'Morocco', countryCode: 'MA', region: 'Africa',
    lat: 31.6295, lng: -7.9811,
    costIndex: 3, costTier: 'budget', popularityScore: 84, timezone: 'Africa/Casablanca',
    coverPhoto: 'https://images.unsplash.com/photo-1539020140153-e479b8f22986?w=800&q=80',
    description: 'Sensory overload of souks, riads, spice markets, and Saharan sunsets.',
    bestTimeToVisit: 'Mar–May, Sep–Nov', avgDailyCostUSD: 40,
    topActivities: ['Djemaa el-Fna', 'Bahia Palace', 'Majorelle Garden', 'Atlas Mountains'],
  },
  {
    id: 'city-13', name: 'Santorini', country: 'Greece', countryCode: 'GR', region: 'Europe',
    lat: 36.3932, lng: 25.4615,
    costIndex: 7, costTier: 'mid-range', popularityScore: 90, timezone: 'Europe/Athens',
    coverPhoto: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
    description: 'Iconic white-washed villages perched on volcanic cliffs above the electric blue Aegean.',
    bestTimeToVisit: 'Apr–Jun, Sep–Oct', avgDailyCostUSD: 140,
    topActivities: ['Oia Sunset', 'Akrotiri Ruins', 'Black Beach', 'Wine Tasting'],
  },
  {
    id: 'city-14', name: 'Cape Town', country: 'South Africa', countryCode: 'ZA', region: 'Africa',
    lat: -33.9249, lng: 18.4241,
    costIndex: 4, costTier: 'budget', popularityScore: 82, timezone: 'Africa/Johannesburg',
    coverPhoto: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    description: 'Dramatic Table Mountain backdrop, world-class wine, and vibrant multicultural energy.',
    bestTimeToVisit: 'Nov–Mar', avgDailyCostUSD: 65,
    topActivities: ['Table Mountain', 'Cape of Good Hope', 'V&A Waterfront', 'Robben Island'],
  },
  {
    id: 'city-15', name: 'Prague', country: 'Czech Republic', countryCode: 'CZ', region: 'Europe',
    lat: 50.0755, lng: 14.4378,
    costIndex: 4, costTier: 'budget', popularityScore: 86, timezone: 'Europe/Prague',
    coverPhoto: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80',
    description: 'Fairy-tale Gothic architecture, cobblestone squares, and legendary Czech beer culture.',
    bestTimeToVisit: 'Apr–Jun, Sep–Oct', avgDailyCostUSD: 70,
    topActivities: ['Charles Bridge', 'Old Town Square', 'Prague Castle', 'Kafka Museum'],
  },
  {
    id: 'city-16', name: 'Singapore', country: 'Singapore', countryCode: 'SG', region: 'Asia',
    lat: 1.3521, lng: 103.8198,
    costIndex: 8, costTier: 'luxury', popularityScore: 88, timezone: 'Asia/Singapore',
    coverPhoto: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    description: 'Futuristic garden city of superlative architecture, hawker centres, and multicultural harmony.',
    bestTimeToVisit: 'Feb–Apr', avgDailyCostUSD: 155,
    topActivities: ['Gardens by the Bay', 'Marina Bay Sands', 'Hawker Centres', 'Sentosa Island'],
  },
  {
    id: 'city-17', name: 'Istanbul', country: 'Turkey', countryCode: 'TR', region: 'Middle East',
    lat: 41.0082, lng: 28.9784,
    costIndex: 4, costTier: 'budget', popularityScore: 85, timezone: 'Europe/Istanbul',
    coverPhoto: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
    description: 'Where East meets West — minarets, bazaars, Bosphorus cruises, and exceptional food.',
    bestTimeToVisit: 'Apr–May, Sep–Oct', avgDailyCostUSD: 60,
    topActivities: ['Hagia Sophia', 'Grand Bazaar', 'Bosphorus Cruise', 'Topkapi Palace'],
  },
  {
    id: 'city-18', name: 'Lisbon', country: 'Portugal', countryCode: 'PT', region: 'Europe',
    lat: 38.7223, lng: -9.1393,
    costIndex: 5, costTier: 'mid-range', popularityScore: 83, timezone: 'Europe/Lisbon',
    coverPhoto: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
    description: 'Hilly, sun-drenched city of fado music, pastel de nata, and extraordinary Atlantic views.',
    bestTimeToVisit: 'Mar–May, Sep–Oct', avgDailyCostUSD: 85,
    topActivities: ['Belém Tower', 'Alfama District', 'Sintra', 'Tram 28'],
  },
  {
    id: 'city-19', name: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR', region: 'Americas',
    lat: -22.9068, lng: -43.1729,
    costIndex: 4, costTier: 'budget', popularityScore: 81, timezone: 'America/Sao_Paulo',
    coverPhoto: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
    description: 'Carnival, Christ the Redeemer, Copacabana, and samba — Brazil\'s soul in one city.',
    bestTimeToVisit: 'Dec–Mar, Jun–Aug', avgDailyCostUSD: 70,
    topActivities: ['Christ the Redeemer', 'Copacabana Beach', 'Sugarloaf Mountain', 'Lapa Arches'],
  },
  {
    id: 'city-20', name: 'Maldives', country: 'Maldives', countryCode: 'MV', region: 'Asia',
    lat: 3.2028, lng: 73.2207,
    costIndex: 9, costTier: 'luxury', popularityScore: 85, timezone: 'Indian/Maldives',
    coverPhoto: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    description: 'Crystalline waters, overwater bungalows, and the world\'s finest coral reefs.',
    bestTimeToVisit: 'Nov–Apr', avgDailyCostUSD: 300,
    topActivities: ['Snorkeling', 'Overwater Bungalow Stay', 'Dolphin Watching', 'Whale Shark Dive'],
  },
];

// ─── Activities ───────────────────────────────────────────────────────────────

export { mockActivities } from './mockActivities';

// ─── Mock Trips ───────────────────────────────────────────────────────────────

export { mockTrips } from './mockTrips';

// ─── Mock User ────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Wanderer',
  email: 'alex@globetrotter.io',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
  language: 'English',
  savedDestinations: ['city-1', 'city-3', 'city-13', 'city-20'],
  tripsCount: 5,
  joinedAt: '2024-01-15T10:00:00Z',
};

// ─── Admin Mock Data ──────────────────────────────────────────────────────────

export const mockAnalyticsStats: AnalyticsStat[] = [
  { label: 'Total Users', value: 12840, change: 14.2, trend: 'up' },
  { label: 'Trips Created', value: 38920, change: 22.5, trend: 'up' },
  { label: 'Cities Explored', value: 184, change: 8.1, trend: 'up' },
  { label: 'Avg. Trip Duration', value: '11.4 days', change: -2.3, trend: 'down' },
  { label: 'Public Shares', value: 6210, change: 31.7, trend: 'up' },
  { label: 'Daily Active Users', value: 4290, change: 5.8, trend: 'up' },
];

export const mockAdminUsers: AdminUser[] = [
  { id: 'user-1', name: 'Alex Wanderer', email: 'alex@globe.io', tripsCount: 5, joinedAt: '2024-01-15T10:00:00Z', status: 'active' },
  { id: 'user-2', name: 'Priya Sharma', email: 'priya@globe.io', tripsCount: 12, joinedAt: '2024-02-20T08:00:00Z', status: 'active' },
  { id: 'user-3', name: 'Marco Rossi', email: 'marco@globe.io', tripsCount: 3, joinedAt: '2024-03-10T09:00:00Z', status: 'active' },
  { id: 'user-4', name: 'Yuna Kim', email: 'yuna@globe.io', tripsCount: 8, joinedAt: '2024-04-05T07:00:00Z', status: 'inactive' },
  { id: 'user-5', name: 'Carlos Rivera', email: 'carlos@globe.io', tripsCount: 1, joinedAt: '2024-05-12T11:00:00Z', status: 'active' },
];
