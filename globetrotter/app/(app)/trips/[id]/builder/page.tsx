'use client';

import { use, useState, useEffect } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Search, X,
  MapPin, Clock, DollarSign, Star,
} from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { useGlobeStore } from '@/store/useGlobeStore';
import { mockCities, mockActivities } from '@/lib/mockData';
import type { CityStop, Activity, CityMeta } from '@/types';
import { useDebounce } from 'use-debounce';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return every calendar date between two ISO date strings (inclusive). */
function enumerateDays(startDate: string, endDate: string): Date[] {
  const days: Date[] = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Format a Date as "Weekday, Mon DD" — e.g. "Fri, Oct 12" */
function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** HH:mm comparator for sorting */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Group activities into days for a stop.
 * Activities are distributed round-robin across days (since they have no explicit
 * date field), then sorted chronologically by startTime within each day.
 */
function groupActivitiesByDay(stop: CityStop): { day: Date; dayIndex: number; acts: Activity[] }[] {
  const days = enumerateDays(stop.startDate, stop.endDate);
  if (days.length === 0) return [];

  // Assign each activity to a day bucket by index (round-robin)
  const buckets: Activity[][] = days.map(() => []);
  stop.activities.forEach((act, i) => {
    buckets[i % days.length].push(act);
  });

  // Sort each bucket by startTime
  buckets.forEach((bucket) =>
    bucket.sort((a, b) => timeToMinutes(a.startTime || '00:00') - timeToMinutes(b.startTime || '00:00'))
  );

  return days.map((day, i) => ({ day, dayIndex: i + 1, acts: buckets[i] }));
}

/** Category colour map */
const CATEGORY_COLORS: Record<string, string> = {
  sightseeing: 'bg-sky-400',
  food:        'bg-amber-400',
  adventure:   'bg-emerald-400',
  culture:     'bg-purple-400',
  shopping:    'bg-pink-400',
  nightlife:   'bg-indigo-400',
  wellness:    'bg-teal-400',
  transport:   'bg-slate-400',
};

const CATEGORY_TEXT: Record<string, string> = {
  sightseeing: 'text-sky-600',
  food:        'text-amber-600',
  adventure:   'text-emerald-600',
  culture:     'text-purple-600',
  shopping:    'text-pink-600',
  nightlife:   'text-indigo-600',
  wellness:    'text-teal-600',
  transport:   'text-slate-600',
};

// ─── Add Stop Modal ────────────────────────────────────────────────────────────

function AddStopModal({ onClose, onAdd }: { onClose: () => void; onAdd: (stop: CityStop) => void }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [selected, setSelected] = useState<CityMeta | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const openGlobe = useGlobeStore((s) => s.openGlobe);

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
    openGlobe(selected.lat ?? 48.8566, selected.lng ?? 2.3522, selected.name);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Add a Stop</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-gt-text transition-colors">
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
                <motion.button
                  key={city.id}
                  whileHover={{ x: 4 }}
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
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 p-3 glass-light rounded-xl">
              <img src={selected.coverPhoto} alt={selected.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-bold">{selected.name}</p>
                <p className="text-slate-500 text-xs">{selected.country}</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-slate-500 hover:text-gt-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Arrival <span className="text-amber-500">*</span></label>
                <input
                  type="date"
                  className="gt-input text-sm"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && endDate < e.target.value) setEndDate('');
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Departure <span className="text-amber-500">*</span></label>
                <input
                  type="date"
                  className="gt-input text-sm"
                  value={endDate}
                  min={startDate || todayStr}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Past dates are not selectable
            </p>
            <button
              onClick={handleAdd}
              disabled={!startDate || !endDate}
              className="btn-primary w-full justify-center"
            >
              <Plus className="w-4 h-4" /> Add Stop
            </button>
          </motion.div>
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
  onAdd,
  onClose,
}: {
  cityId: string;
  stopId: string;
  tripId: string;
  existingIds: string[];
  onAdd: (act: Activity) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [pending, setPending] = useState<Activity | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const cityActivities = mockActivities.filter((a) => a.cityId === cityId || !cityId);
  const filtered = debouncedSearch
    ? cityActivities.filter((a) => a.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : cityActivities;

  const canConfirm = startTime && endTime && endTime > startTime;

  const handleConfirm = () => {
    if (!pending || !canConfirm) return;
    onAdd({ ...pending, startTime, endTime, time: startTime });
    setPending(null);
    setStartTime('');
    setEndTime('');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            {pending ? 'Set Time Slot' : 'Add Activity'}
          </h2>
          <button onClick={pending ? () => setPending(null) : onClose} className="text-slate-500 hover:text-gt-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {pending ? (
            /* ── Time slot step ── */
            <motion.div
              key="time-step"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-3 glass-light rounded-xl">
                {pending.imageUrl && (
                  <img src={pending.imageUrl} alt={pending.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{pending.name}</p>
                  <p className="text-xs text-slate-500">{pending.category} · {pending.cost === 0 ? 'Free' : `$${pending.cost}`}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Time <span className="text-amber-500">*</span></label>
                  <input
                    type="time"
                    className="gt-input text-sm"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (endTime && endTime <= e.target.value) setEndTime('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End Time <span className="text-amber-500">*</span></label>
                  <input
                    type="time"
                    className="gt-input text-sm"
                    value={endTime}
                    min={startTime || undefined}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {startTime && endTime && endTime <= startTime && (
                <p className="text-xs text-red-400">End time must be after start time</p>
              )}

              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="btn-primary w-full justify-center disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Confirm & Add to Itinerary
              </button>
            </motion.div>
          ) : (
            /* ── Activity list step ── */
            <motion.div key="list-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                      {act.imageUrl && (
                        <img src={act.imageUrl} alt={act.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{act.name}</p>
                        <p className="text-xs text-slate-500">
                          {act.category} · {act.cost === 0 ? 'Free' : `$${act.cost}`}
                          {act.rating && <span className="ml-1.5 text-amber-500">★ {act.rating}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => !added && setPending(act)}
                        className={added ? 'btn-ghost text-xs py-1.5 px-3 opacity-50' : 'btn-primary text-xs py-1.5 px-3'}
                        disabled={added}
                      >
                        {added ? 'Added' : <><Plus className="w-3 h-3" /> Add</>}
                      </button>
                    </div>
                  );
                })}
                {filtered.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No activities found</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Day Timeline Row ─────────────────────────────────────────────────────────

function ActivityTimelineCard({
  act,
  isLast,
  onRemove,
}: {
  act: Activity;
  isLast: boolean;
  onRemove: () => void;
}) {
  const dotColor = CATEGORY_COLORS[act.category] ?? 'bg-slate-400';
  const textColor = CATEGORY_TEXT[act.category] ?? 'text-slate-600';

  return (
    <div className="flex gap-4 group">
      {/* Timeline gutter */}
      <div className="flex flex-col items-center w-14 flex-shrink-0">
        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-white shadow ${dotColor}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex-1 bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm mb-3 hover:shadow-md transition-shadow ${isLast ? 'mb-0' : ''}`}
      >
        <div className="flex items-start gap-3">
          {act.imageUrl && (
            <img
              src={act.imageUrl}
              alt={act.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-800 text-sm leading-tight">{act.name}</p>
              <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all flex-shrink-0"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time window */}
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-mono text-slate-500">
                {act.startTime} – {act.endTime}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-medium capitalize ${textColor}`}>{act.category}</span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-0.5 text-xs text-slate-500">
                <DollarSign className="w-3 h-3" />
                {act.cost === 0 ? 'Free' : act.cost}
              </span>
              {act.rating && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400" />{act.rating}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stop Block ───────────────────────────────────────────────────────────────

function StopBlock({
  stop,
  tripId,
  onDelete,
}: {
  stop: CityStop;
  tripId: string;
  onDelete: (stopId: string) => void;
}) {
  const { addActivity, removeActivity } = useItineraryStore();
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);
  const [activeDayPicker, setActiveDayPicker] = useState<number | null>(null);

  const dayGroups = groupActivitiesByDay(stop);
  const nights = Math.max(0, dayGroups.length - 1);

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Stop header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <GripVertical className="w-5 h-5 text-slate-300 cursor-grab flex-shrink-0" />
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <img
              src={stop.coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80'}
              alt={stop.city}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm">{stop.city}, {stop.country}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {new Date(stop.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' → '}
              {new Date(stop.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <span className="ml-1 text-slate-300">·</span>
              <span className="ml-1">{nights} night{nights !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <button
            onClick={() => onDelete(stop.id)}
            className="text-slate-300 hover:text-red-400 transition-colors ml-2 p-1.5 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Day-wise timeline */}
        <div className="p-4 space-y-6">
          {dayGroups.map(({ day, dayIndex, acts }) => (
            <div key={day.toISOString()}>
              {/* Day label */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <span className="text-amber-700 text-[10px] font-bold leading-none">{dayIndex}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Day {dayIndex}</p>
                    <p className="text-[11px] text-slate-400">{formatDayLabel(day)}</p>
                  </div>
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <button
                  onClick={() => { setActiveDayPicker(dayIndex); setActivityPickerOpen(true); }}
                  className="text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Activities */}
              {acts.length === 0 ? (
                <div className="flex gap-4">
                  <div className="w-14 flex-shrink-0 flex justify-center">
                    <div className="w-px h-full bg-slate-100" />
                  </div>
                  <button
                    onClick={() => { setActiveDayPicker(dayIndex); setActivityPickerOpen(true); }}
                    className="flex-1 mb-3 p-3 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:border-amber-400/50 hover:text-amber-500 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add an activity for Day {dayIndex}
                  </button>
                </div>
              ) : (
                acts.map((act, i) => (
                  <ActivityTimelineCard
                    key={act.id}
                    act={act}
                    isLast={i === acts.length - 1}
                    onRemove={() => removeActivity(tripId, stop.id, act.id)}
                  />
                ))
              )}
            </div>
          ))}
        </div>

        {/* Footer add button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => { setActiveDayPicker(null); setActivityPickerOpen(true); }}
            className="w-full p-2.5 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:border-amber-400/50 hover:text-amber-500 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Activity to this Stop
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
            onAdd={(act) => addActivity(tripId, stop.id, act)}
            onClose={() => { setActivityPickerOpen(false); setActiveDayPicker(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Builder Page ─────────────────────────────────────────────────────────

export default function ItineraryBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTripById, fetchTripById, addStop, deleteStop, reorderStops, isAddStopModalOpen, openAddStopModal, closeAddStopModal } = useItineraryStore();
  const trip = getTripById(id);
  const [stops, setStops] = useState(trip?.stops ?? []);

  useEffect(() => {
    fetchTripById(id);
  }, [id, fetchTripById]);

  useEffect(() => {
    if (trip?.stops) {
      setStops(trip.stops);
    }
  }, [trip?.stops]);

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Trip not found</h2>
          <Link href="/trips"><button className="btn-primary mt-4">Back to trips</button></Link>
        </div>
      </div>
    );
  }

  const handleReorder = (newOrder: CityStop[]) => {
    setStops(newOrder);
    reorderStops(id, newOrder.map((s) => s.id));
  };

  const handleAddStop = (stop: CityStop) => {
    const withOrder = { ...stop, order: trip.stops.length };
    addStop(id, withOrder);
    setStops([...stops, withOrder]);
  };

  const handleDeleteStop = (stopId: string) => {
    deleteStop(id, stopId);
    setStops(stops.filter((s) => s.id !== stopId));
  };

  const totalActivities = stops.reduce((n, s) => n + s.activities.length, 0);

  return (
    <>
      <div className="page-wrapper p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${id}`}>
              <button className="btn-ghost px-3 py-2"><ArrowLeft className="w-4 h-4" /></button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-800">{trip.name}</h1>
              <p className="text-slate-400 text-sm">
                Itinerary Builder · {stops.length} stop{stops.length !== 1 ? 's' : ''} · {totalActivities} activities
              </p>
            </div>
          </div>
          <button onClick={openAddStopModal} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Stop
          </button>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-6 text-xs text-amber-700 flex items-center gap-2">
          <GripVertical className="w-4 h-4 flex-shrink-0" />
          Drag stops to reorder · Activities are auto-sorted by start time within each day
        </div>

        {/* Stops */}
        {stops.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2 text-slate-800">No stops yet</h3>
            <p className="text-slate-400 mb-6 text-sm">Add cities to start building your itinerary</p>
            <button onClick={openAddStopModal} className="btn-primary">
              <Plus className="w-4 h-4" /> Add First Stop
            </button>
          </motion.div>
        ) : (
          <Reorder.Group axis="y" values={stops} onReorder={handleReorder} className="space-y-4">
            {stops.map((stop) => (
              <Reorder.Item key={stop.id} value={stop}>
                <StopBlock stop={stop} tripId={id} onDelete={handleDeleteStop} />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {/* Footer */}
        {stops.length > 0 && (
          <div className="flex gap-3 mt-6">
            <button onClick={openAddStopModal} className="btn-ghost flex-1">
              <Plus className="w-4 h-4" /> Add Another Stop
            </button>
            <Link href={`/trips/${id}`} className="flex-1">
              <button className="btn-primary w-full">View Itinerary →</button>
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
