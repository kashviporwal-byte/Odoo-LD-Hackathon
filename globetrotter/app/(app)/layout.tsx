'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe, LayoutDashboard, Map, PlusCircle, Search, Compass,
  DollarSign, Users, Settings, LogOut, ChevronLeft, Menu
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Trips', href: '/trips', icon: Map },
  { label: 'New Trip', href: '/trips/new', icon: PlusCircle },
  { label: 'City Search', href: '/city-search', icon: Search },
  { label: 'Activity Search', href: '/activity-search', icon: Compass },
];

const bottomNavItems = [
  { label: 'Profile', href: '/profile', icon: Settings },
  { label: 'Admin', href: '/admin', icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 mb-6 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4 h-4 text-[#ffffff]" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-lg font-bold"
          >
            GlobeTrotter
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 space-y-1 mb-4">
        <div className="h-px bg-black/[0.04] my-3 mx-2" />
        {bottomNavItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* User */}
      {!collapsed && user && (
        <div className="p-3 mx-2 mb-2 glass-light rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-500/10 flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-amber-600 text-sm font-bold">
                {user.name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col glass border-r border-white/[0.06] flex-shrink-0 relative overflow-hidden rounded-none"
        style={{ borderRadius: 0 }}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-14 translate-x-1/2 w-6 h-6 rounded-full glass border border-black/10 flex items-center justify-center text-slate-500 hover:text-gt-text transition-colors z-10"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <motion.aside
        animate={{ x: mobileOpen ? 0 : -300 }}
        transition={{ duration: 0.25 }}
        className="fixed left-0 top-0 bottom-0 w-[240px] z-50 glass border-r border-white/[0.06] lg:hidden"
        style={{ borderRadius: 0 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-500 hover:text-gt-text"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {user && (
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-500/10">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-amber-600 text-xs font-bold">
                      {user.name[0]}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-500">{user.name}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
