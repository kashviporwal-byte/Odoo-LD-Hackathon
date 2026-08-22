'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
import {
  Search, Filter, MapPin, Star, DollarSign, TrendingUp,
  Globe, X, Plus, Heart, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { mockCities } from '@/lib/mockData';
import { useItineraryStore } from '@/store/useItineraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobeStore } from '@/store/useGlobeStore';
import { generateItineraryForCity } from '@/lib/itineraryGenerator';
import type { CityMeta, Region, CostTier } from '@/types';

const regions: Region[] = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'];
const costTiers: CostTier[] = ['budget', 'mid-range', 'luxury'];

function CityCard({ city, onAdd, saved, onSave }: {
  city: CityMeta;
  onAdd: (city: CityMeta) => void;
  saved: boolean;
  onSave: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      className="glass rounded-2xl overflow-hidden group"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={city.coverPhoto}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="img-overlay" />
        <button
          onClick={() => onSave(city.id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${saved ? 'bg-red-500/80 text-slate-900' : 'bg-black/40 text-slate-900/80 hover:bg-black/60'}`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute bottom-3 left-3">
          <h3 className="font-display text-slate-900 font-bold text-lg">{city.name}</h3>
          <p className="text-slate-600 text-xs flex items-center gap-1">
            <Globe className="w-3 h-3" />{city.country} · {city.region}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`badge text-xs ${city.costTier === 'budget' ? 'badge-green' : city.costTier === 'luxury' ? 'badge-purple' : 'badge-amber'}`}>
            {city.costTier}
          </span>
          <span className="badge badge-blue flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-current" />{city.popularityScore}
          </span>
          <span className="badge badge-green flex items-center gap-0.5">
            <DollarSign className="w-3 h-3" />${city.avgDailyCostUSD}/day
          </span>
        </div>

        <p className="text-slate-500 text-xs line-clamp-2 mb-3">{city.description}</p>

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <span>Best: {city.bestTimeToVisit}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            Cost index: <span className="text-amber-600 font-semibold">{city.costIndex}/10</span>
          </span>
        </div>

        {/* Cost index bar */}
        <div className="h-1.5 bg-black/[0.04] rounded-full mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-500"
            style={{ width: `${city.costIndex * 10}%` }}
          />
        </div>

        {/* Top activities expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition-colors mb-2"
        >
          Top Activities <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex flex-wrap gap-1">
                {city.topActivities.map((a) => (
                  <span key={a} className="badge badge-amber text-xs">{a}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => onAdd(city)}
          className="btn-primary w-full justify-center text-sm py-2"
        >
          <Plus className="w-4 h-4" /> Add to Trip
        </button>
      </div>
    </motion.div>
  );
}

export default function CitySearchPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [selectedRegion, setSelectedRegion] = useState<Region | 'All'>('All');
  const [selectedTier, setSelectedTier] = useState<CostTier | 'All'>('All');
  const [savedCities, setSavedCities] = useState<string[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = mockCities.filter((c) => {
    const matchSearch =
      debouncedSearch === '' ||
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.country.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchRegion = selectedRegion === 'All' || c.region === selectedRegion;
    const matchTier = selectedTier === 'All' || c.costTier === selectedTier;
    return matchSearch && matchRegion && matchTier;
  });

  const router = useRouter();
  const openGlobe = useGlobeStore((s) => s.openGlobe);
  const { addTrip } = useItineraryStore();
  const { user } = useAuthStore();

  const handleAdd = (city: CityMeta) => {
    // Generate full itinerary for the destination
    const newTrip = generateItineraryForCity(city, { userId: user?.id });
    addTrip(newTrip);

    // Trigger globe animation and navigate to the trip itinerary
    openGlobe(city.lat ?? 35.6762, city.lng ?? 139.6503, city.name);
    setAddedToast(`Generated itinerary for ${city.name}!`);
    setTimeout(() => {
      router.push(`/trips/${newTrip.id}`);
    }, 1500);
  };

  const handleSave = (id: string) => {
    setSavedCities((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const hasFilters = selectedRegion !== 'All' || selectedTier !== 'All';

  return (
    <div className="page-wrapper p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Discover Cities</h1>
        <p className="text-slate-500">Explore {mockCities.length} destinations worldwide</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="gt-input pl-10"
            placeholder="Search cities or countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gt-text">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`btn-ghost px-4 flex-shrink-0 ${hasFilters ? 'border-amber-500/50 text-amber-600' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {hasFilters && <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" />}
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-light p-4 rounded-xl space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Region</p>
                <div className="flex gap-2 flex-wrap">
                  {(['All', ...regions] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRegion(r as Region | 'All')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedRegion === r ? 'bg-amber-500 text-[#ffffff]' : 'glass-light text-slate-500 hover:text-gt-text'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Budget Tier</p>
                <div className="flex gap-2">
                  {(['All', ...costTiers] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t as CostTier | 'All')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${selectedTier === t ? 'bg-amber-500 text-[#ffffff]' : 'glass-light text-slate-500 hover:text-gt-text'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {hasFilters && (
                <button onClick={() => { setSelectedRegion('All'); setSelectedTier('All'); }} className="text-xs text-amber-600 hover:text-amber-300">
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <p className="text-slate-500 text-sm mb-4">
        {filtered.length} {filtered.length === 1 ? 'city' : 'cities'} found
        {debouncedSearch && ` for "${debouncedSearch}"`}
      </p>

      {/* City Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((city) => (
              <CityCard
                key={city.id}
                city={city}
                onAdd={handleAdd}
                saved={savedCities.includes(city.id)}
                onSave={handleSave}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-slate-500 text-lg mb-2">No cities found</p>
            <button onClick={() => { setSearch(''); setSelectedRegion('All'); setSelectedTier('All'); }} className="btn-ghost text-sm">
              Clear all filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl glass border border-amber-500/30 text-amber-600 text-sm font-semibold shadow-xl"
          >
            ✓ {addedToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
