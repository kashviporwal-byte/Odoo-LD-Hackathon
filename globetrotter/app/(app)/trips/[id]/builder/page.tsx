'use client';

import { use, useMemo, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Search, X,
  MapPin, Check,
} from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { mockCities, mockActivities } from '@/lib/mockData';
import type { CityStop, Activity, CityMeta } from '@/types';
import { useDebounce } from 'use-debounce';

// ─── Add Stop Modal ────────────────────────────────────────────────────────────

function AddStopModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (stop: CityStop) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 200);
  const [selected, setSelected] = useState<CityMeta | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const results = debouncedSearch.length > 0
    ? mockCities.filter(
        (c) =>
          c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          c.country.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : mockCities.slice(0, 6);

  const handleAdd = () => {
    if (!selected || !startDate || !endDate) return;
    const stop: CityStop = {
      id: `stop-${Date.now()}`,
      cityId: selected.id,
      city: selected.name,
      country: selected.country,
      countryCode: selected.countryCode,
      startDate,
      endDate,
      activities: [],
      coverPhoto: selected.coverPhoto,
      order: 0,
    };
    onAdd(stop);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Add a Stop</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-gt-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="gt-input pl-10"
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              {results.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => setSelected(city)}
                  className="w-full flex items-center gap-3 p-3 glass-light rounded-xl text-left hover:border-amber-500/30 border border-transparent transition-colors"
                >
                  <img src={city.coverPhoto} alt={city.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{city.name}</p>
                    <p className="text-slate-500 text-xs">{city.country} · ${city.avgDailyCostUSD}/day</p>
                  </div>
                  <span className={`badge text-xs ${city.costTier === 'budget' ? 'badge-green' : city.costTier === 'luxury' ? 'badge-purple' : 'badge-amber'}`}>
                    {city.costTier}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 glass-light rounded-xl">
              <img src={selected.coverPhoto} alt={selected.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-bold">{selected.name}</p>
                <p className="text-slate-500 text-xs">{selected.country}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="ml-auto text-slate-500 hover:text-gt-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Arrival</label>
                <input type="date" className="gt-input text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Departure</label>
                <input type="date" className="gt-input text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!startDate || !endDate}
              className="btn-primary w-full justify-center"
            >
              <Plus className="w-4 h-4" /> Add Stop
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Activity Picker ──────────────────────────────────────────────────────────

function ActivityPicker({
  cityId,
  stopId,
  tripId,
  existingIds,
  onClose,
}: {
  cityId: string;
  stopId: string;
  tripId: string;
  existingIds: string[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const addActivity = useItineraryStore((s) => s.addActivity);

  const cityActivities = mockActivities.filter((a) => a.cityId === cityId);
  const activities = cityActivities.length > 0 ? cityActivities : mockActivities;
  const query = search.trim().toLowerCase();
  const filtered = query
    ? activities.filter((a) => a.name.toLowerCase().includes(query))
    : activities;

  const handleAdd = (act: Activity) => {
    if (existingIds.includes(act.id)) return;
    addActivity(tripId, stopId, act);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Add Activity</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-gt-text"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="gt-input pl-10 text-sm"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          {filtered.map((act) => {
            const added = existingIds.includes(act.id);
            return (
              <div key={act.id} className="flex items-center gap-3 p-3 glass-light rounded-xl">
                {act.imageUrl && <img src={act.imageUrl} alt={act.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{act.name}</p>
                  <p className="text-xs text-slate-500">{act.category} · {act.cost === 0 ? 'Free' : `$${act.cost}`}</p>
                </div>
                <button
                  type="button"
                  onClick={() => !added && handleAdd(act)}
                  disabled={added}
                  className={added ? 'btn-ghost text-xs py-1.5 px-3 opacity-60 cursor-default' : 'btn-primary text-xs py-1.5 px-3'}
                >
                  {added ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No activities found</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stop Block ───────────────────────────────────────────────────────────────

function StopBlock({
  stopId,
  tripId,
  onDelete,
}: {
  stopId: string;
  tripId: string;
  onDelete: (stopId: string) => void;
}) {
  const stop = useItineraryStore(
    (s) => s.trips.find((t) => t.id === tripId)?.stops.find((st) => st.id === stopId)
  );
  const removeActivity = useItineraryStore((s) => s.removeActivity);
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);

  if (!stop) return null;

  return (
    <>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
          <GripVertical className="w-5 h-5 text-slate-500 cursor-grab flex-shrink-0" />
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <img src={stop.coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80'} alt={stop.city} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">{stop.city}, {stop.country}</h3>
            <p className="text-xs text-slate-500">{stop.startDate} → {stop.endDate}</p>
          </div>
          <button type="button" onClick={() => onDelete(stop.id)} className="text-slate-500 hover:text-red-400 transition-colors ml-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {stop.activities.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">No activities yet</p>
          )}
          {stop.activities.map((act) => (
            <div key={act.id} className="flex items-center gap-2 p-2.5 glass-light rounded-lg group">
              <div className="flex-1 text-xs min-w-0">
                <span className="font-medium">{act.name}</span>
                <span className="text-slate-500 ml-2">{act.category}</span>
              </div>
              <span className="text-xs text-green-600 flex-shrink-0">{act.cost === 0 ? 'Free' : `$${act.cost}`}</span>
              <button
                type="button"
                onClick={() => removeActivity(tripId, stop.id, act.id)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                aria-label={`Remove ${act.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setActivityPickerOpen(true)}
            className="w-full p-2 dashed-border rounded-lg text-xs text-slate-500 hover:text-amber-600 transition-colors flex items-center justify-center gap-1.5 border border-dashed border-black/10 hover:border-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5" /> Add Activity
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activityPickerOpen && (
          <ActivityPicker
            cityId={stop.cityId}
            stopId={stop.id}
            tripId={tripId}
            existingIds={stop.activities.map((a) => a.id)}
            onClose={() => setActivityPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Builder Page ─────────────────────────────────────────────────────────

export default function ItineraryBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trip = useItineraryStore((s) => s.trips.find((t) => t.id === id));
  const { addStop, deleteStop, reorderStops, isAddStopModalOpen, openAddStopModal, closeAddStopModal } = useItineraryStore();

  const stops = useMemo(
    () => [...(trip?.stops ?? [])].sort((a, b) => a.order - b.order),
    [trip?.stops]
  );

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Trip not found</h2>
          <Link href="/trips"><button type="button" className="btn-primary mt-4">Back to trips</button></Link>
        </div>
      </div>
    );
  }

  const handleReorder = (newOrder: CityStop[]) => {
    reorderStops(id, newOrder.map((s) => s.id));
  };

  const handleAddStop = (stop: CityStop) => {
    addStop(id, { ...stop, order: trip.stops.length });
  };

  const handleDeleteStop = (stopId: string) => {
    deleteStop(id, stopId);
  };

  return (
    <>
      <div className="page-wrapper p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${id}`}>
              <button type="button" className="btn-ghost px-3 py-2"><ArrowLeft className="w-4 h-4" /></button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">{trip.name}</h1>
              <p className="text-slate-500 text-sm">Itinerary Builder</p>
            </div>
          </div>
          <button type="button" onClick={openAddStopModal} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Stop
          </button>
        </div>

        <div className="glass-light p-3 rounded-xl mb-6 text-xs text-slate-500 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-amber-600 flex-shrink-0" />
          Drag stops to reorder your journey. Click &quot;+ Add Activity&quot; to enrich each city.
        </div>

        {stops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No stops yet</h3>
            <p className="text-slate-500 mb-6 text-sm">Add cities to start building your itinerary</p>
            <button type="button" onClick={openAddStopModal} className="btn-primary">
              <Plus className="w-4 h-4" /> Add First Stop
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={stops}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {stops.map((stop) => (
              <Reorder.Item key={stop.id} value={stop}>
                <StopBlock stopId={stop.id} tripId={id} onDelete={handleDeleteStop} />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {stops.length > 0 && (
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={openAddStopModal} className="btn-ghost flex-1">
              <Plus className="w-4 h-4" /> Add Another Stop
            </button>
            <Link href={`/trips/${id}`} className="flex-1">
              <button type="button" className="btn-primary w-full">
                View Itinerary →
              </button>
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddStopModalOpen && (
          <AddStopModal onClose={closeAddStopModal} onAdd={handleAddStop} />
        )}
      </AnimatePresence>
    </>
  );
}
