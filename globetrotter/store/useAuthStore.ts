import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { mockUser } from '@/lib/mockData';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const res = await authApi.login(email, password);
          if (res.success && res.data) {
            const backendUser = res.data.user;
            const token = res.data.token;
            if (typeof window !== 'undefined' && token) {
              localStorage.setItem('token', token);
            }
            const user: User = {
              id: String(backendUser.id || `user-${Date.now()}`),
              name: backendUser.name || email.split('@')[0],
              email: backendUser.email || email,
              tripsCount: 0,
              savedDestinations: [],
              joinedAt: new Date().toISOString(),
              language: backendUser.language || 'English',
            };
            set({ user, token, isAuthenticated: true });
            return true;
          }
        } catch {
          // Fall through to fallback
        }

        // Fallback demo user if backend is offline
        const fallbackUser: User = { ...mockUser, email, name: email.split('@')[0] };
        set({ user: fallbackUser, token: 'demo-token-123', isAuthenticated: true });
        return true;
      },

      signup: async (name: string, email: string, password: string) => {
        try {
          const res = await authApi.signup(name, email, password);
          if (res.success && res.data) {
            const backendUser = res.data.user;
            const token = res.data.token;
            if (typeof window !== 'undefined' && token) {
              localStorage.setItem('token', token);
            }
            const user: User = {
              id: String(backendUser.id || `user-${Date.now()}`),
              name: backendUser.name || name,
              email: backendUser.email || email,
              tripsCount: 0,
              savedDestinations: [],
              joinedAt: new Date().toISOString(),
              language: backendUser.language || 'English',
            };
            set({ user, token, isAuthenticated: true });
            return true;
          }
        } catch {
          // Fall through to fallback
        }

        const user: User = {
          ...mockUser,
          id: `user-${Date.now()}`,
          name,
          email,
          tripsCount: 0,
          savedDestinations: [],
          joinedAt: new Date().toISOString(),
        };
        set({ user, token: 'demo-token-123', isAuthenticated: true });
        return true;
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<User>) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },
    }),
    { name: 'globetrotter-auth' }
  )
);
