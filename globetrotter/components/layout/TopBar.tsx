'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useMenuStore } from '@/store/useMenuStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function TopBar() {
  const toggleMenu = useMenuStore((s) => s.toggleMenu);
  const isOpen = useMenuStore((s) => s.isOpen);
  const { user } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-black/[0.06] flex items-center justify-between px-5 md:px-8">

      {/* ── Left: Hamburger ─────────────────────────────────────────── */}
      <button
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl hover:bg-black/[0.04] transition-colors group"
      >
        <motion.span
          animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="block w-5 h-[1.5px] bg-slate-800 rounded-full origin-center"
        />
        <motion.span
          animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.15 }}
          className="block w-5 h-[1.5px] bg-slate-800 rounded-full"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="block w-5 h-[1.5px] bg-slate-800 rounded-full origin-center"
        />
      </button>

      {/* ── Centre: Logo ────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 select-none group"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_2px_8px_rgba(237,191,155,0.5)] group-hover:shadow-[0_4px_14px_rgba(237,191,155,0.7)] transition-shadow">
          <Globe className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
        </div>
        <span className="font-display text-[1.05rem] font-bold text-slate-900 tracking-tight">
          GlobeTrotter
        </span>
      </Link>

      {/* ── Right: Avatar ───────────────────────────────────────────── */}
      <Link
        href="/profile"
        className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-amber-400 transition-all flex-shrink-0"
        aria-label="View profile"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-amber-500/10 flex items-center justify-center">
            <span className="text-amber-600 text-sm font-bold">
              {user?.name?.[0] ?? 'G'}
            </span>
          </div>
        )}
      </Link>
    </header>
  );
}
