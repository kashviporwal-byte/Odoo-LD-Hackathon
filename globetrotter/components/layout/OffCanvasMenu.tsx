'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Map, PlusCircle, Search,
  Compass, Settings, Users, LogOut, X
} from 'lucide-react';
import { useMenuStore } from '@/store/useMenuStore';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { label: 'Dashboard',     href: '/dashboard',       icon: LayoutDashboard },
  { label: 'My Trips',      href: '/trips',            icon: Map },
  { label: 'New Trip',      href: '/trips/new',        icon: PlusCircle },
  { label: 'City Search',   href: '/city-search',      icon: Search },
  { label: 'Activities',    href: '/activity-search',  icon: Compass },
];

const secondaryItems = [
  { label: 'Profile',  href: '/profile', icon: Settings },
  { label: 'Admin',    href: '/admin',   icon: Users },
];

export default function OffCanvasMenu() {
  const { isOpen, closeMenu } = useMenuStore();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Close on route change
  useEffect(() => {
    closeMenu();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = () => {
    closeMenu();
    logout();
    router.push('/login');
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* ── Panel ────────────────────────────────────────────────── */}
          <motion.nav
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[300px] bg-white flex flex-col border-r border-black/[0.06] shadow-[8px_0_40px_-8px_rgba(0,0,0,0.12)]"
            aria-label="Navigation menu"
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-black/[0.05] flex-shrink-0">
              <span className="font-display text-lg font-bold text-slate-900 tracking-tight">
                Navigation
              </span>
              <button
                onClick={closeMenu}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Nav */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {navItems.map(({ label, href, icon: Icon }, i) => {
                const active = isActive(href);
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05, duration: 0.28 }}
                  >
                    <Link
                      href={href}
                      className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-amber-50 border border-amber-200/60'
                          : 'hover:bg-black/[0.03]'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          active ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span
                        className={`font-semibold text-[0.95rem] tracking-tight transition-colors ${
                          active
                            ? 'text-amber-700'
                            : 'text-slate-600 group-hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </span>
                      {active && (
                        <motion.span
                          layoutId="active-pip"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Divider */}
              <div className="my-4 h-px bg-black/[0.05] mx-2" />

              {/* Secondary Nav */}
              {secondaryItems
                .filter((item) => item.href !== '/admin' || user?.role === 'admin')
                .map(({ label, href, icon: Icon }, i) => {
                  const active = isActive(href);
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.32 + i * 0.05, duration: 0.28 }}
                    >
                      <Link
                        href={href}
                        className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                          active
                            ? 'bg-amber-50 border border-amber-200/60'
                            : 'hover:bg-black/[0.03]'
                        }`}
                      >
                        <Icon
                          className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                            active ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        <span
                          className={`font-medium text-sm tracking-tight transition-colors ${
                            active ? 'text-amber-700' : 'text-slate-500 group-hover:text-slate-800'
                          }`}
                        >
                          {label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
            </div>

            {/* Footer — user + logout */}
            <div className="px-4 pb-6 pt-2 border-t border-black/[0.05] flex-shrink-0 space-y-3">
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 bg-black/[0.025] rounded-xl">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-amber-200">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-500/10 flex items-center justify-center">
                        <span className="text-amber-600 font-bold text-sm">{user.name[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/[0.06] transition-all duration-200 group"
              >
                <LogOut className="w-4.5 h-4.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Log out</span>
              </button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
