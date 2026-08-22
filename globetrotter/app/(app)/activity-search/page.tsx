'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import {
  Search, Filter, Star, DollarSign, Clock,
  Plus, Minus, X, ChevronDown, Image as ImageIcon
} from 'lucide-react';
import { mockActivities, mockCities } from '@/lib/mockData';
import type { Activity, ActivityCategory } from '@/types';

const categories: ActivityCategory[] = [
  'sightseeing', 'food', 'adventure', 'shopping', 'culture', 'nightlife', 'wellness', 'transport'
];

const catColors: Record<ActivityCategory, string> = {
  sightseeing: 'badge-blue',
  food: 'badge-amber',
  adventure: 'badge-green',
  shopping: 'badge-pink',
  culture: 'badge-purple',
  nightlife: 'badge-amber',
  wellness: 'badge-blue',
  transport: '',
};

const catIcons: Record<ActivityCategory, string> = {
  sightseeing: '🏛️',
  food: '🍜',
  adventure: '🧗',
  shopping: '🛍️',
  culture: '🎭',
  nightlife: '🌃',
  wellness: '🧘',
  transport: '✈️',
};

type CostFilter = 'all' | 'free' | 'budget' | 'mid' | 'premium';

function ActivityCard({
  activity,
  cityName,
  added,
  onAdd,
  onRemove,
}: {
  activity: Activity;
  cityName: string;
  added: boolean;
  onAdd: (act: Activity) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="glass rounded-2xl overflow-hidden group"
    >
      {activity.imageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="img-overlay" />
          <div className="absolute top-3 left-3">
            <span className={`badge ${catColors[activity.category]}`}>
              {catIcons[activity.category]} {activity.category}
            </span>
          </div>
          {activity.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-white text-xs font-bold">{activity.rating}</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm leading-tight">{activity.name}</h3>
          <span className={`font-bold text-sm flex-shrink-0 ${activity.cost === 0 ? 'text-green-400' : 'text-amber-400'}`}>
            {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
          </span>
        </div>

        <p className="text-xs text-gt-muted mb-2">{cityName}</p>

        {!activity.imageUrl && (
          <span className={`badge ${catColors[activity.category]} mb-2`}>
            {catIcons[activity.category]} {activity.category}
          </span>
        )}

        <div className="flex items-center gap-3 text-xs text-gt-muted mb-3">
          {activity.time && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.time}</span>
          )}
          {activity.durationHours && (
            <span className="flex items-center gap-1">⏱ {activity.durationHours}h</span>
          )}
        </div>

        {/* Description expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gt-muted hover:text-amber-400 transition-colors mb-2"
        >
          Details <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-gt-muted mb-3 overflow-hidden"
            >
              {activity.description}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={() => (added ? onRemove(activity.id) : onAdd(activity))}
          className={added ? 'btn-danger w-full justify-center text-sm py-2' : 'btn-primary w-full justify-center text-sm py-2'}
        >
          {added ? (
            <><Minus className="w-3.5 h-3.5" /> Remove</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Add to Trip</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function ActivitySearchPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [selectedCat, setSelectedCat] = useState<ActivityCategory | 'all'>('all');
  const [costFilter, setCostFilter] = useState<CostFilter>('all');
  const [maxDuration, setMaxDuration] = useState<number | 'any'>('any');
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = mockActivities.filter((a) => {
    const matchSearch =
      debouncedSearch === '' ||
      a.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCat = selectedCat === 'all' || a.category === selectedCat;
    const matchCost =
      costFilter === 'all' ||
      (costFilter === 'free' && a.cost === 0) ||
      (costFilter === 'budget' && a.cost > 0 && a.cost <= 20) ||
      (costFilter === 'mid' && a.cost > 20 && a.cost <= 60) ||
      (costFilter === 'premium' && a.cost > 60);
    const matchDuration =
      maxDuration === 'any' || !a.durationHours || a.durationHours <= maxDuration;
    return matchSearch && matchCat && matchCost && matchDuration;
  });

  const getCityName = (cityId: string) =>
    mockCities.find((c) => c.id === cityId)?.name ?? 'Various';

  const handleAdd = (act: Activity) => {
    setAddedIds((p) => [...p, act.id]);
    setToast(`"${act.name}" added!`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRemove = (id: string) => setAddedIds((p) => p.filter((x) => x !== id));

  return (
    <div className="page-wrapper p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Activity Search</h1>
        <p className="text-gt-muted">Browse {mockActivities.length} experiences across the globe</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gt-muted" />
        <input
          className="gt-input pl-10"
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gt-muted hover:text-gt-text">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${selectedCat === 'all' ? 'bg-amber-500 text-[#080d1a]' : 'glass-light text-gt-muted hover:text-gt-text'}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-all capitalize ${selectedCat === cat ? 'bg-amber-500 text-[#080d1a]' : 'glass-light text-gt-muted hover:text-gt-text'}`}
          >
            {catIcons[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Cost + Duration Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <p className="text-xs text-gt-muted mb-1.5">Cost</p>
          <div className="flex gap-1.5">
            {([['all', 'Any'], ['free', 'Free'], ['budget', '$0-20'], ['mid', '$21-60'], ['premium', '$60+']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setCostFilter(v as CostFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${costFilter === v ? 'bg-amber-500 text-[#080d1a]' : 'glass-light text-gt-muted hover:text-gt-text'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gt-muted mb-1.5">Duration</p>
          <div className="flex gap-1.5">
            {([['any', 'Any'], [2, '≤2h'], [4, '≤4h'], [6, '≤6h']] as const).map(([v, l]) => (
              <button
                key={String(v)}
                onClick={() => setMaxDuration(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${maxDuration === v ? 'bg-amber-500 text-[#080d1a]' : 'glass-light text-gt-muted hover:text-gt-text'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-gt-muted text-sm mb-4">{filtered.length} activities · {addedIds.length} added</p>

      {/* Activity Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              cityName={getCityName(act.cityId)}
              added={addedIds.includes(act.id)}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gt-muted text-lg mb-2">No activities found</p>
          <button onClick={() => { setSearch(''); setSelectedCat('all'); setCostFilter('all'); setMaxDuration('any'); }} className="btn-ghost text-sm">
            Clear filters
          </button>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl glass border border-amber-500/30 text-amber-400 text-sm font-semibold shadow-xl"
          >
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
