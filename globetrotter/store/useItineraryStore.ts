import { create } from 'zustand';
import type { ViewMode, Trip, CityStop, Activity } from '@/types';
import { mockTrips } from '@/lib/mockData';
import { tripsApi } from '@/lib/api';

interface ItineraryState {
  // View mode toggle
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Active stop
  activeStopId: string | null;
  setActiveStop: (id: string | null) => void;

  // Add Stop modal
  isAddStopModalOpen: boolean;
  openAddStopModal: () => void;
  closeAddStopModal: () => void;

  // Trips CRUD
  trips: Trip[];
  fetchTrips: () => Promise<void>;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;

  // Stop CRUD
  addStop: (tripId: string, stop: CityStop) => void;
  updateStop: (tripId: string, stopId: string, updates: Partial<CityStop>) => void;
  deleteStop: (tripId: string, stopId: string) => void;
  reorderStops: (tripId: string, orderedStopIds: string[]) => void;

  // Activity CRUD
  addActivity: (tripId: string, stopId: string, activity: Activity) => void;
  removeActivity: (tripId: string, stopId: string, activityId: string) => void;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((s) => ({ viewMode: s.viewMode === 'list' ? 'calendar' : 'list' })),

  activeStopId: null,
  setActiveStop: (id) => set({ activeStopId: id }),

  isAddStopModalOpen: false,
  openAddStopModal: () => set({ isAddStopModalOpen: true }),
  closeAddStopModal: () => set({ isAddStopModalOpen: false }),

  trips: mockTrips,

  fetchTrips: async () => {
    try {
      const res = await tripsApi.getTrips();
      // Backend returns { success: true, data: [...] } — data is the array directly
      const tripsArray = Array.isArray(res.data) ? res.data : (res.data as any)?.trips;
      if (res.success && tripsArray && tripsArray.length > 0) {
        const backendTrips: Trip[] = tripsArray.map((bt: any) => ({
          id: String(bt.id),
          name: bt.name,
          description: bt.description || '',
          coverPhoto: bt.cover_photo_url || bt.coverPhoto,
          status: 'upcoming',
          isPublic: bt.is_public ?? false,
          budget: bt.budget || 2000,
          budgetBreakdown: { transport: 0, stay: 0, activities: 0, meals: 0, misc: 0 },
          userId: String(bt.user_id || 'user-1'),
          createdAt: bt.created_at || new Date().toISOString(),
          updatedAt: bt.created_at || new Date().toISOString(),
          stops: bt.stops || [],
        }));
        set({ trips: backendTrips });
      }
    } catch {
      // Keep local mockTrips as resilient fallback
    }
  },

  addTrip: (trip) => {
    set((s) => ({ trips: [...s.trips, trip] }));
    // Asynchronously synchronize with backend and update the trip ID
    tripsApi.createTrip({
      name: trip.name,
      start_date: trip.stops[0]?.startDate || '2026-06-01',
      end_date: trip.stops[trip.stops.length - 1]?.endDate || '2026-06-15',
      description: trip.description,
      cover_photo_url: trip.coverPhoto,
    }).then((res) => {
      if (res.success && res.data) {
        const backendTrip = (res.data as any).trip || res.data;
        if (backendTrip?.id) {
          // Update the local trip with the real backend ID
          set((s) => ({
            trips: s.trips.map((t) =>
              t.id === trip.id ? { ...t, id: String(backendTrip.id) } : t
            ),
          }));
        }
      }
    }).catch(() => {});
  },

  updateTrip: (id, updates) => {
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    tripsApi.updateTrip(id, updates).catch(() => {});
  },

  deleteTrip: (id) => {
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
    tripsApi.deleteTrip(id).catch(() => {});
  },

  getTripById: (id) => get().trips.find((t) => t.id === id),

  addStop: (tripId, stop) => {
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId ? { ...t, stops: [...t.stops, stop] } : t
      ),
    }));
    // Synchronize stop with backend
    const numTripId = parseInt(tripId.replace(/\D/g, ''), 10) || 101;
    const numCityId = parseInt(stop.cityId.replace(/\D/g, ''), 10) || 1;
    tripsApi.addStop(numTripId, {
      city_id: numCityId,
      start_date: stop.startDate,
      end_date: stop.endDate,
      stop_order: stop.order,
    }).catch(() => {});
  },

  updateStop: (tripId, stopId, updates) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              stops: t.stops.map((st) =>
                st.id === stopId ? { ...st, ...updates } : st
              ),
            }
          : t
      ),
    })),

  deleteStop: (tripId, stopId) => {
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId
          ? { ...t, stops: t.stops.filter((st) => st.id !== stopId) }
          : t
      ),
    }));
    const numTripId = parseInt(tripId.replace(/\D/g, ''), 10) || 101;
    const numStopId = parseInt(stopId.replace(/\D/g, ''), 10) || 501;
    tripsApi.deleteStop(numTripId, numStopId).catch(() => {});
  },

  reorderStops: (tripId, orderedStopIds) => {
    set((s) => ({
      trips: s.trips.map((t) => {
        if (t.id !== tripId) return t;
        const reordered = orderedStopIds
          .map((sid, i) => {
            const stop = t.stops.find((st) => st.id === sid);
            return stop ? { ...stop, order: i } : null;
          })
          .filter(Boolean) as CityStop[];
        return { ...t, stops: reordered };
      }),
    }));
    const numTripId = parseInt(tripId.replace(/\D/g, ''), 10) || 101;
    tripsApi.reorderStops(numTripId, orderedStopIds).catch(() => {});
  },

  addActivity: (tripId, stopId, activity) => {
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              stops: t.stops.map((st) =>
                st.id === stopId
                  ? { ...st, activities: [...st.activities, activity] }
                  : st
              ),
            }
          : t
      ),
    }));
    const numTripId = parseInt(tripId.replace(/\D/g, ''), 10) || 101;
    const numStopId = parseInt(stopId.replace(/\D/g, ''), 10) || 501;
    const numActId = parseInt(activity.id.replace(/\D/g, ''), 10) || 1;
    tripsApi.addActivity(numTripId, numStopId, {
      activity_id: numActId,
      day_number: 1,
      time_slot: activity.time || 'morning',
      cost_override: activity.cost,
    }).catch(() => {});
  },

  removeActivity: (tripId, stopId, activityId) => {
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              stops: t.stops.map((st) =>
                st.id === stopId
                  ? {
                      ...st,
                      activities: st.activities.filter((a) => a.id !== activityId),
                    }
                  : st
              ),
            }
          : t
      ),
    }));
    const numTripId = parseInt(tripId.replace(/\D/g, ''), 10) || 101;
    const numStopId = parseInt(stopId.replace(/\D/g, ''), 10) || 501;
    const numActId = parseInt(activityId.replace(/\D/g, ''), 10) || 1;
    tripsApi.removeActivity(numTripId, numStopId, numActId).catch(() => {});
  },
}));
