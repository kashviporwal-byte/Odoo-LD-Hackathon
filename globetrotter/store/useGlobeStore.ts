import { create } from 'zustand';

interface GlobeState {
  isOpen: boolean;
  coordinates: { lat: number; lng: number } | null;
  destinationName: string;
  openGlobe: (lat: number, lng: number, destinationName?: string) => void;
  closeGlobe: () => void;
}

export const useGlobeStore = create<GlobeState>((set) => ({
  isOpen: false,
  coordinates: null,
  destinationName: '',

  openGlobe: (lat: number, lng: number, destinationName: string = 'Destination') =>
    set({
      isOpen: true,
      coordinates: { lat, lng },
      destinationName,
    }),

  closeGlobe: () =>
    set({
      isOpen: false,
      coordinates: null,
      destinationName: '',
    }),
}));
