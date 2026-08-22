import { create } from 'zustand';
import type { ViewMode, Trip, CityStop, Activity } from '@/types';
import { mockTrips } from '@/lib/mockData';

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

  // Trips CRUD (local state, no backend)
  trips: Trip[];
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

  addTrip: (trip) => set((s) => ({ trips: [...s.trips, trip] })),

  updateTrip: (id, updates) =>
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTrip: (id) =>
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),

  getTripById: (id) => get().trips.find((t) => t.id === id),

  addStop: (tripId, stop) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId ? { ...t, stops: [...t.stops, stop] } : t
      ),
    })),

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

  deleteStop: (tripId, stopId) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId
          ? { ...t, stops: t.stops.filter((st) => st.id !== stopId) }
          : t
      ),
    })),

  reorderStops: (tripId, orderedStopIds) =>
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
    })),

  addActivity: (tripId, stopId, activity) =>
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
    })),

  removeActivity: (tripId, stopId, activityId) =>
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
    })),
}));
