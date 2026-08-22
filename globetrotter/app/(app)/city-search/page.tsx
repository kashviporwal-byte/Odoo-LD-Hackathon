'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Filter, MapPin, Star, DollarSign,
  Globe, X, Plus, Heart, ChevronDown,
  SlidersHorizontal, TrendingUp, Lock, CheckCircle2,
  ArrowRight, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mockCities } from '@/lib/mockData';
import { useItineraryStore } from '@/store/useItineraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { CityMeta, CostTier, CityStop } from '@/types';

const costTiers: CostTier[] = ['budget', 'mid-range', 'luxury'];

const COST_SYMBOLS: Record<CostTier, string> = {
  budget: '$',
  'mid-range': '$$',
  luxury: '$$$',
};

const COST_LABELS: Record<CostTier, string> = {
  budget: 'Budget',
  'mid-range': 'Mid-range',
  luxury: 'Luxury',
};

// ── City Card ─────────────────────────────────────────────────────────────────
function CityCard({
  city,
  onAdd,
  isAdding,
  justAdded,
  locked,
  lockedCountry,
}: {
  city: CityMeta;
  onAdd: (city: CityMeta) => void;
  isAdding: boolean;
  justAdded: boolean;
  locked: boolean;
  lockedCountry: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const isCountryLocked = locked && lockedCountry && city.country !== lockedCountry;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={!isCountryLocked ? { y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`glass rounded-2xl overflow-hidden group border transition-all duration-200 ${
        isCountryLocked
          ? 'border-black/[0.04] opacity-40 grayscale pointer-events-none'
          : justAdded
          ? 'border-emerald-400/50 shadow-md shadow-emerald-500/10'
          : 'border-black/[0.04] hover:border-amber-400/30 hover:shadow-md hover:shadow-amber-500/10'
      }`}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={city.coverPhoto}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Country lock badge */}
        {isCountryLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold">
              <Lock className="w-3 h-3" />
              Different country
            </div>
          </div>
        )}

        {/* City name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-white font-bold text-lg leading-tight drop-shadow-sm">
            {city.name}
          </h3>
          <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
            <Globe className="w-3 h-3 flex-shrink-0" />
            {city.country} · {city.region}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`badge text-xs font-semibold ${
              city.costTier === 'budget'
                ? 'badge-green'
                : city.costTier === 'luxury'
                ? 'badge-purple'
                : 'badge-amber'
            }`}
          >
            {COST_SYMBOLS[city.costTier]} {COST_LABELS[city.costTier]}
          </span>
          <span className="badge badge-blue flex items-center gap-0.5 text-xs">
            <Star className="w-3 h-3 fill-current" />
            {city.popularityScore}
          </span>
          <span className="badge badge-green flex items-center gap-0.5 text-xs">
            <DollarSign className="w-3 h-3" />${city.avgDailyCostUSD}/day
          </span>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
          {city.description}
        </p>

        {/* Cost index bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Cost Index</span>
            <span className="text-xs font-bold text-amber-600">{city.costIndex}/10</span>
          </div>
          <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${city.costIndex * 10}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
            />
          </div>
        </div>

        {/* Best time */}
        <p className="text-xs text-slate-400">
          🗓 Best: <span className="text-slate-600 font-medium">{city.bestTimeToVisit}</span>
        </p>

        {/* Top activities expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition-colors w-full text-left"
        >
          <TrendingUp className="w-3 h-3" />
          Top Activities
          <ChevronDown
            className={`w-3 h-3 ml-auto transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1 pt-1">
                {city.topActivities.slice(0, 5).map((a) => (
                  <span key={a} className="badge badge-amber text-xs">
                    {a}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <motion.button
          onClick={() => onAdd(city)}
          disabled={isAdding || justAdded}
          whileTap={{ scale: 0.97 }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            justAdded
              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-300'
              : 'btn-primary'
          } disabled:opacity-70`}
        >
          {isAdding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding…
            </>
          ) : justAdded ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Added to Trip!
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Itinerary
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CitySearchPage() {
  const router = useRouter();
  const { trips, addStop } = useItineraryStore();
  const { user } = useAuthStore();

  // ── Active trip & country lock ─────────────────────────────────────────────
  const activeTrip = useMemo(() => trips[0] ?? null, [trips]);
  const lockedCountry = useMemo(() => {
    if (!activeTrip || !activeTrip.stops?.length) return null;
    return activeTrip.stops[0]?.country ?? null;
  }, [activeTrip]);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [selectedTier, setSelectedTier] = useState<CostTier | 'All'>('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'cost-asc' | 'cost-desc' | 'none'>('popularity');
  const [countryLockEnabled, setCountryLockEnabled] = useState(!!lockedCountry);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Adding state ──────────────────────────────────────────────────────────
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Filtered + sorted results ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = mockCities.filter((c) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q);
      const matchTier = selectedTier === 'All' || c.costTier === selectedTier;
      return matchSearch && matchTier;
    });

    if (sortBy === 'popularity') {
      list = [...list].sort((a, b) => b.popularityScore - a.popularityScore);
    } else if (sortBy === 'cost-asc') {
      list = [...list].sort((a, b) => a.avgDailyCostUSD - b.avgDailyCostUSD);
    } else if (sortBy === 'cost-desc') {
      list = [...list].sort((a, b) => b.avgDailyCostUSD - a.avgDailyCostUSD);
    }

    return list;
  }, [debouncedSearch, selectedTier, sortBy]);

  // Split: same-country cities first if country lock is on
  const sortedForDisplay = useMemo(() => {
    if (!countryLockEnabled || !lockedCountry) return filtered;
    const inCountry = filtered.filter((c) => c.country === lockedCountry);
    const outCountry = filtered.filter((c) => c.country !== lockedCountry);
    return [...inCountry, ...outCountry];
  }, [filtered, countryLockEnabled, lockedCountry]);

  // ── Add stop to active trip ───────────────────────────────────────────────
  const handleAdd = useCallback(
    async (city: CityMeta) => {
      if (!activeTrip) {
        showToast('No active trip found. Create a trip first!', 'error');
        return;
      }

      setAddingId(city.id);

      try {
        const existingStops = activeTrip.stops ?? [];
        const lastStop = existingStops[existingStops.length - 1];

        // Default: start 3 days after the last stop ends (or today)
        const baseDate = lastStop?.endDate
          ? new Date(lastStop.endDate)
          : new Date();
        const startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 3);

        const newStop: CityStop = {
          id: `stop-${Date.now()}`,
          cityId: city.id,
          city: city.name,
          country: city.country,
          countryCode: city.countryCode,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          activities: [],
          order: existingStops.length,
        };

        // Persist to Zustand + backend
        addStop(activeTrip.id, newStop);

        setAddedIds((prev) => new Set([...prev, city.id]));
        showToast(`✓ ${city.name} added to "${activeTrip.name}"!`);

        // Reset "just added" state after 4s
        setTimeout(() => {
          setAddedIds((prev) => {
            const next = new Set(prev);
            next.delete(city.id);
            return next;
          });
        }, 4000);
      } finally {
        setAddingId(null);
      }
    },
    [activeTrip, addStop, showToast]
  );

  const hasFilters = selectedTier !== 'All' || sortBy !== 'popularity' || debouncedSearch !== '';

  return (
    <div className="page-wrapper p-4 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Discover Cities
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {mockCities.length} destinations worldwide
            {countryLockEnabled && lockedCountry && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-700 font-semibold">
                <Lock className="w-3 h-3" />
                Filtered to {lockedCountry}
              </span>
            )}
          </p>
        </div>

        {/* Active trip chip */}
        {activeTrip && (
          <Link
            href={`/trips/${activeTrip.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors self-start sm:self-auto"
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate max-w-[180px]">{activeTrip.name}</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          </Link>
        )}
      </div>

      {/* ── Country lock banner ────────────────────────────────────────────── */}
      {lockedCountry && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3.5 rounded-2xl bg-white border border-amber-200/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-2.5 text-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                Smart Country Filter — <span className="text-amber-700">{lockedCountry}</span>
              </p>
              <p className="text-slate-500 text-xs">
                Your active trip starts in {lockedCountry}. Same-country cities are prioritised.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCountryLockEnabled((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
              countryLockEnabled
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lock className="w-3 h-3" />
            {countryLockEnabled ? 'Lock Active' : 'Lock Off'}
          </button>
        </motion.div>
      )}

      {/* ── Search + Filter row ────────────────────────────────────────────── */}
      <div className="flex gap-2.5 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            className="gt-input pl-10 pr-10 w-full"
            placeholder="Search by city, country or region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`btn-ghost px-4 flex-shrink-0 flex items-center gap-2 ${
            hasFilters ? 'border-amber-400/60 text-amber-700 bg-amber-50' : ''
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Filters</span>
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="glass-light rounded-2xl p-5 mb-4 space-y-4">
              {/* Budget tier filter */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Budget Tier
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(['All', ...costTiers] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t as CostTier | 'All')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedTier === t
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-white border border-black/[0.08] text-slate-600 hover:border-amber-300 hover:text-amber-700'
                      }`}
                    >
                      {t === 'All' ? 'All Budgets' : `${COST_SYMBOLS[t as CostTier]} ${COST_LABELS[t as CostTier]}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort by */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Sort By
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { value: 'popularity', label: '⭐ Popularity' },
                      { value: 'cost-asc', label: '💰 Cheapest First' },
                      { value: 'cost-desc', label: '💎 Priciest First' },
                      { value: 'none', label: '🔀 Default' },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        sortBy === value
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white border border-black/[0.08] text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    setSelectedTier('All');
                    setSortBy('popularity');
                    setSearch('');
                  }}
                  className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results meta ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-500 text-sm">
          <span className="font-semibold text-slate-700">{sortedForDisplay.length}</span>{' '}
          {sortedForDisplay.length === 1 ? 'city' : 'cities'} found
          {debouncedSearch && (
            <span className="text-slate-400">
              {' '}for &ldquo;<span className="text-slate-600">{debouncedSearch}</span>&rdquo;
            </span>
          )}
        </p>
        {addedIds.size > 0 && (
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {addedIds.size} added to trip
          </span>
        )}
      </div>

      {/* ── City Grid ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {sortedForDisplay.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {sortedForDisplay.map((city, i) => (
              <motion.div
                key={city.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <CityCard
                  city={city}
                  onAdd={handleAdd}
                  isAdding={addingId === city.id}
                  justAdded={addedIds.has(city.id)}
                  locked={countryLockEnabled && !!lockedCountry}
                  lockedCountry={lockedCountry}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold text-lg mb-1">No cities found</p>
            <p className="text-slate-400 text-sm mb-5">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedTier('All');
                setSortBy('popularity');
              }}
              className="btn-ghost text-sm"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border shadow-xl text-sm font-semibold flex items-center gap-2.5 max-w-sm text-center ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-emerald-300/60 text-emerald-800 shadow-emerald-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            {toast.msg}
            {toast.type === 'success' && activeTrip && (
              <Link
                href={`/trips/${activeTrip.id}`}
                className="ml-1 text-amber-700 underline underline-offset-2 font-bold hover:text-amber-900 transition-colors"
              >
                View
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
