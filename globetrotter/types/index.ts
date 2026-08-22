// ─── Core Domain Types ────────────────────────────────────────────────────────

export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'adventure'
  | 'shopping'
  | 'culture'
  | 'nightlife'
  | 'wellness'
  | 'transport';

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  /** @deprecated Use startTime instead */
  time?: string;
  /** Required: 24-h HH:mm, e.g. "09:00" */
  startTime: string;
  /** Required: 24-h HH:mm, e.g. "11:30" */
  endTime: string;
  durationHours?: number;
  cost: number;
  currency: string;
  imageUrl?: string;
  rating?: number;
  cityId: string;
}

export interface CityStop {
  id: string;
  cityId: string;
  city: string;
  country: string;
  countryCode: string;
  startDate: string; // ISO date string
  endDate: string;
  activities: Activity[];
  notes?: string;
  coverPhoto?: string;
  order: number;
}

export interface BudgetCategory {
  transport: number;
  stay: number;
  activities: number;
  meals: number;
  misc: number;
}

export type TripStatus = 'draft' | 'upcoming' | 'ongoing' | 'completed';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  coverPhoto?: string;
  stops: CityStop[];
  budget: number;
  budgetBreakdown: BudgetCategory;
  isPublic: boolean;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  shareSlug?: string;
  tags?: string[];
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user' | string;
  avatarUrl?: string;
  language: string;
  savedDestinations: string[]; // cityIds
  tripsCount: number;
  joinedAt: string;
}

// ─── City / Destination Types ─────────────────────────────────────────────────

export type CostTier = 'budget' | 'mid-range' | 'luxury';
export type Region = 'Asia' | 'Europe' | 'Americas' | 'Africa' | 'Oceania' | 'Middle East';

export interface CityMeta {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region;
  lat?: number;
  lng?: number;
  costIndex: number; // 1-10 (10 = most expensive)
  costTier: CostTier;
  popularityScore: number; // 1-100
  coverPhoto: string;
  description: string;
  bestTimeToVisit: string;
  avgDailyCostUSD: number;
  topActivities: string[];
  timezone: string;
}

// ─── Admin / Analytics Types ──────────────────────────────────────────────────

export interface AnalyticsStat {
  label: string;
  value: number | string;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  tripsCount: number;
  joinedAt: string;
  status: 'active' | 'inactive' | 'banned';
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface CreateTripForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  coverPhoto?: string;
  isPublic: boolean;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type ViewMode = 'calendar' | 'list';
export type ThemeMode = 'dark' | 'light';
