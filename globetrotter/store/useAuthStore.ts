import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { mockUser } from '@/lib/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => Promise<boolean>;
  signup: (name: string, email: string, _password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, _password: string) => {
        // Simulate API call delay
        await new Promise((res) => setTimeout(res, 800));
        // Accept any email/password for demo
        const user = { ...mockUser, email, name: email.split('@')[0] };
        set({ user, isAuthenticated: true });
        return true;
      },

      signup: async (name: string, email: string, _password: string) => {
        await new Promise((res) => setTimeout(res, 1000));
        const user: User = {
          ...mockUser,
          id: `user-${Date.now()}`,
          name,
          email,
          tripsCount: 0,
          savedDestinations: [],
          joinedAt: new Date().toISOString(),
        };
        set({ user, isAuthenticated: true });
        return true;
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      updateUser: (updates: Partial<User>) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },
    }),
    { name: 'globetrotter-auth' }
  )
);
