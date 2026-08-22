'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import TopBar from '@/components/layout/TopBar';
import OffCanvasMenu from '@/components/layout/OffCanvasMenu';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Sticky Top Bar ──────────────────────────────────────────── */}
      <TopBar />

      {/* ── Off-Canvas Nav Menu (portal-style, above everything) ───── */}
      <OffCanvasMenu />

      {/* ── Full-Width Page Content (offset by TopBar height) ─────── */}
      <main className="flex-1 pt-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
