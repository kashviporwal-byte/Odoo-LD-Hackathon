'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionAction } from '@/lib/auth-actions';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * SyncAuth mounts in the root layout and silently re-validates the gt_session
 * cookie against the backend on every page load. If the JWT carries fresh user
 * data (name, email, role) it overwrites the stale localStorage snapshot so
 * the TopBar always shows the correct, up-to-date profile.
 */
export default function SyncAuth() {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    async function syncSession() {
      try {
        const session = await getSessionAction();
        if (!session.isAuthenticated || !session.token) {
          // No valid cookie — clear any leftover stale local state
          useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
          return;
        }

        // Decode the JWT payload (no signature verification needed client-side)
        const parts = session.token.split('.');
        if (parts.length < 2) return;

        const jwtPayload: {
          id?: number | string;
          email?: string;
          role?: string;
          name?: string;
          iat?: number;
          exp?: number;
        } = JSON.parse(atob(parts[1]));

        // If the token is expired, log out
        if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
          await logout();
          return;
        }

        // Fetch fresh user profile from the backend using the token
        const res = await fetch(`${BACKEND_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${session.token}` },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          const freshUser = data.data?.user || data.user;
          if (freshUser) {
            setAuth(
              {
                id: String(freshUser.id),
                name: freshUser.name || freshUser.email?.split('@')[0] || 'Traveler',
                email: freshUser.email,
                role: freshUser.role || 'user',
                avatarUrl: freshUser.photo_url || freshUser.avatarUrl,
                language: freshUser.language || 'English',
                savedDestinations: freshUser.savedDestinations || [],
                tripsCount: freshUser.tripsCount || 0,
                joinedAt: freshUser.created_at || freshUser.joinedAt || new Date().toISOString(),
              },
              session.token
            );
            return;
          }
        }

        // Fallback: hydrate from JWT claims if backend unreachable
        const currentUser = useAuthStore.getState().user;
        if (jwtPayload.id && (!currentUser || currentUser.email !== jwtPayload.email)) {
          setAuth(
            {
              id: String(jwtPayload.id),
              name: jwtPayload.name || jwtPayload.email?.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Traveler',
              email: jwtPayload.email || '',
              role: jwtPayload.role || 'user',
              language: 'English',
              savedDestinations: [],
              tripsCount: 0,
              joinedAt: new Date().toISOString(),
            },
            session.token
          );
        }
      } catch {
        // Silent fail — don't break the app if backend is down
      }
    }

    syncSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
