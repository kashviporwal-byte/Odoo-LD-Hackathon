'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, MapPin, Calendar, DollarSign,
  Edit3, Trash2, Eye, Globe, MoreVertical
} from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { useGlobeStore } from '@/store/useGlobeStore';
import { mockCities } from '@/lib/mockData';
import type { Trip, TripStatus } from '@/types';

type FilterTab = 'all' | TripStatus;

const statusColors: Record<string, string> = {
  upcoming: 'status-upcoming',
  ongoing: 'status-ongoing',
  completed: 'status-completed',
  draft: 'status-draft',
};

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const openGlobe = useGlobeStore((s) => s.openGlobe);
  const nights = trip.stops.reduce((acc, s) => {
    const diff = new Date(s.endDate).getTime() - new Date(s.startDate).getTime();
    return acc + Math.ceil(diff / 86400000);
  }, 0);

  const handleGlobeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cityMeta = mockCities.find((c) => c.id === trip.stops[0]?.cityId);
    openGlobe(cityMeta?.lat ?? 48.8566, cityMeta?.lng ?? 2.3522, trip.stops[0]?.city ?? trip.name);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      className="glass rounded-2xl overflow-hidden group"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={trip.coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80'}
          alt={trip.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="img-overlay" />
        <div className="absolute top-3 left-3">
          <span className={`badge ${statusColors[trip.status]}`}>{trip.status}</span>
        </div>
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-black/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-900" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute right-0 top-9 w-40 glass rounded-xl p-1 z-10 border border-black/10"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button onClick={() => router.push(`/trips/${trip.id}`)} className="sidebar-link w-full text-xs py-2">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => router.push(`/trips/${trip.id}/builder`)} className="sidebar-link w-full text-xs py-2">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => { onDelete(trip.id); setMenuOpen(false); }} className="sidebar-link w-full text-xs py-2 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display font-bold text-base mb-1">{trip.name}</h3>
        {trip.description && <p className="text-slate-500 text-xs line-clamp-2 mb-3">{trip.description}</p>}

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            {trip.stops.length} {trip.stops.length === 1 ? 'city' : 'cities'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            {nights}n
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-green-400" />
            ${trip.budget.toLocaleString()}
          </span>
          {trip.isPublic && <Globe className="w-3.5 h-3.5 text-purple-400" />}
        </div>

        {/* City tags */}
        <div className="flex gap-1.5 flex-wrap">
          {trip.stops.slice(0, 3).map((s) => (
            <span key={s.id} className="badge badge-amber">{s.city}</span>
          ))}
          {trip.stops.length > 3 && (
            <span className="badge badge-blue">+{trip.stops.length - 3} more</span>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Link href={`/trips/${trip.id}`} className="flex-1">
            <button className="btn-ghost w-full py-2 text-xs">
              <Eye className="w-3.5 h-3.5" /> View
            </button>
          </Link>
          {trip.stops.length > 0 && (
            <button
              onClick={handleGlobeClick}
              className="btn-ghost py-2 px-3 text-amber-600 hover:text-amber-500 hover:border-amber-500/40 transition-colors"
              title="View on 3D Globe"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          )}
          <Link href={`/trips/${trip.id}/builder`} className="flex-1">
            <button className="btn-primary w-full py-2 text-xs">
              <Edit3 className="w-3.5 h-3.5" /> Build
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function TripsPage() {
  const { trips, deleteTrip, fetchTrips } = useItineraryStore();

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = trips.filter((t) => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.stops.some((s) => s.city.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
    { id: 'draft', label: 'Drafts' },
  ];

  return (
    <div className="page-wrapper p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">My Trips</h1>
          <p className="text-slate-500 mt-1">{trips.length} trips planned</p>
        </div>
        <Link href="/trips/new">
          <button className="btn-primary"><Plus className="w-4 h-4" /> New Trip</button>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="gt-input pl-10"
            placeholder="Search trips or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              filter === t.id ? 'bg-amber-500 text-[#ffffff] font-bold' : 'glass-light text-slate-500 hover:text-gt-text'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">
              {t.id === 'all' ? trips.length : trips.filter((tr) => tr.status === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Trip Grid */}
      {filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4">
            <MapIcon className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">No trips found</h3>
          <p className="text-slate-500 mb-6">
            {search ? `No trips match "${search}"` : 'Start planning your first adventure'}
          </p>
          <Link href="/trips/new">
            <button className="btn-primary"><Plus className="w-4 h-4" /> Create your first trip</button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
