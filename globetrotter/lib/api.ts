/**
 * Centralized API Client connecting Next.js Frontend to Express/Postgres Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Helper to fetch token from localStorage
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('globetrotter-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.token) return parsed.state.token;
    }
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

/**
 * Base fetch wrapper with auth header injection and standardized error handling
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.error || json.message || `Request failed with status ${res.status}`,
      };
    }

    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network connection error. Please ensure backend is running.',
    };
  }
}

// ==========================================
// 1. Auth API
// ==========================================
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name: string, email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  googleLogin: (credential: string) =>
    request<{ token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ==========================================
// 2. Users API
// ==========================================
export const usersApi = {
  getProfile: () => request<{ user: any }>('/users/me'),

  updateProfile: (data: { name?: string; email?: string; photo_url?: string; language?: string }) =>
    request<{ user: any }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updatePreferences: (language: string) =>
    request<{ user: any }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    }),
};

// ==========================================
// 3. Trips API
// ==========================================
export const tripsApi = {
  getTrips: () => request<{ trips: any[] }>('/trips'),

  getTripById: (id: string | number) => request<{ trip: any }>(`/trips/${id}`),

  createTrip: (tripData: { name: string; start_date: string; end_date: string; description?: string; cover_photo_url?: string }) =>
    request<{ trip: any }>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    }),

  updateTrip: (id: string | number, updates: any) =>
    request<{ trip: any }>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTrip: (id: string | number) =>
    request(`/trips/${id}`, {
      method: 'DELETE',
    }),

  getItinerary: (id: string | number) =>
    request<{ itinerary: any }>(`/trips/${id}/itinerary`),

  getCalendarEvents: (id: string | number) =>
    request<{ events: any[] }>(`/trips/${id}/calendar`),

  getStops: (tripId: string | number) =>
    request<{ stops: any[] }>(`/trips/${tripId}/stops`),

  addStop: (tripId: string | number, stopData: { city_id: number; start_date?: string; end_date?: string; stop_order?: number }) =>
    request<{ stop: any }>(`/trips/${tripId}/stops`, {
      method: 'POST',
      body: JSON.stringify(stopData),
    }),

  deleteStop: (tripId: string | number, stopId: string | number) =>
    request(`/trips/${tripId}/stops/${stopId}`, {
      method: 'DELETE',
    }),

  reorderStops: (tripId: string | number, stopIds: (string | number)[]) =>
    request(`/trips/${tripId}/stops/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ stop_ids: stopIds }),
    }),

  addActivity: (
    tripId: string | number,
    stopId: string | number,
    activityData: { activity_id: number; day_number?: number; time_slot?: string; cost_override?: number; notes?: string }
  ) =>
    request<{ activity: any }>(`/activities/stops/${stopId}`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    }),

  removeActivity: (tripId: string | number, stopId: string | number, activityId: string | number) =>
    request(`/activities/stops/${stopId}/activities/${activityId}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// 4. Cities API
// ==========================================
export const citiesApi = {
  getCities: (params?: { search?: string; country?: string; region?: string; cost_index?: number; sort?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.country) query.append('country', params.country);
    if (params?.region) query.append('region', params.region);
    if (params?.cost_index !== undefined) query.append('cost_index', String(params.cost_index));
    if (params?.sort) query.append('sort', params.sort);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    return request<{ cities: any[]; total: number; page: number; limit: number }>(`/cities${qs ? `?${qs}` : ''}`);
  },

  getCityById: (id: string | number) => request<{ city: any }>(`/cities/${id}`),
};

// ==========================================
// 5. Activities API
// ==========================================
export const activitiesApi = {
  getActivities: (params?: { city_id?: number; category?: string; search?: string; max_cost?: number }) => {
    const query = new URLSearchParams();
    if (params?.city_id) query.append('city_id', String(params.city_id));
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.max_cost !== undefined) query.append('max_cost', String(params.max_cost));

    const qs = query.toString();
    return request<{ activities: any[] }>(`/activities${qs ? `?${qs}` : ''}`);
  },

  getActivityById: (id: string | number) => request<{ activity: any }>(`/activities/${id}`),
};

// ==========================================
// 6. Budget API
// ==========================================
export const budgetApi = {
  getTripBudget: (tripId: string | number) => request<{ budget: any; breakdown: any; comparison: any }>(`/budget/trip/${tripId}`),

  updateTripBudget: (tripId: string | number, data: { transport_cost?: number; stay_cost?: number; activities_cost?: number; meals_cost?: number; currency?: string }) =>
    request<{ budget: any }>(`/budget/trip/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==========================================
// 7. Sharing API
// ==========================================
export const sharingApi = {
  getPublicTrip: (slug: string) => request<{ trip: any }>(`/sharing/public/${slug}`),

  toggleShare: (tripId: string | number) =>
    request<{ is_public: boolean; share_slug: string; share_url: string }>(`/sharing/trips/${tripId}/toggle`, {
      method: 'POST',
    }),

  forkTrip: (tripId: string | number) =>
    request<{ trip: any }>(`/sharing/trips/${tripId}/fork`, {
      method: 'POST',
    }),

  getExportPdfUrl: (tripId: string | number) => `${API_BASE}/sharing/trips/${tripId}/export/pdf`,

  getExportCalendarUrl: (tripId: string | number) => `${API_BASE}/sharing/trips/${tripId}/export/calendar`,
};

// ==========================================
// 8. Admin API
// ==========================================
export const adminApi = {
  getStats: () => request<{ totalTrips: number; totalUsers: number; tripsTrend: { date: string; count: number }[] }>('/admin/stats'),

  getTopCities: () => request<{ city: string; country: string; count: number }[]>('/admin/top-cities'),

  getTopActivities: () => request<{ name: string; type: string; count: number }[]>('/admin/top-activities'),

  getUsers: () => request<{ id: number; name: string; email: string; role: string; tripsCount: number }[]>('/admin/users'),

  toggleUserRole: (userId: string | number) =>
    request<{ id: number; name: string; email: string; role: string }>(`/admin/users/${userId}`, {
      method: 'PATCH',
    }),

  toggleUserLock: (userId: string | number, is_active: boolean) =>
    request(`/admin/users/${userId}/lock`, {
      method: 'PUT',
      body: JSON.stringify({ is_active }),
    }),
};
