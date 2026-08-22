'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';
import { logoutAction } from '@/lib/auth-actions';

interface UserSettings {
  tripReminders: boolean;
  newFeatures: boolean;
  budgetAlerts: boolean;
  profilePublic: boolean;
  shareAnalytics: boolean;
}

const defaultSettings: UserSettings = {
  tripReminders: true,
  newFeatures: true,
  budgetAlerts: false,
  profilePublic: true,
  shareAnalytics: false,
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  settings: UserSettings;
  setAuth: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      settings: defaultSettings,

      setAuth: (user: User, token?: string) => {
        if (typeof window !== 'undefined') {
          if (token) localStorage.setItem('token', token);
          localStorage.removeItem('globetrotter-auth');
        }
        set({ user, token: token ?? null, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await logoutAction();
        } catch {}
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('globetrotter-auth');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        }));
      },

      updateSettings: (updates: Partial<UserSettings>) => {
        set({ settings: { ...get().settings, ...updates } });
      },
    }),
    {
      name: 'globetrotter-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
      version: 2,
    }
  )
);
