'use client';

import { use, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Plus, Clock, DollarSign } from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import type { CityStop, Activity } from '@/types';

function DayRow({ date, activities }: { date: string; activities: Activity[] }) {
  const [expanded, setExpanded] = useState(true);
  const d = new Date(date);
  const totalCost = activities.reduce((a, act) => a + act.cost, 0);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-black/[0.02] transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-amber-600 font-bold text-sm">{d.getDate()}</span>
          <span className="text-amber-600/70 text-xs">{d.toLocaleDateString('en', { month: 'short' })}</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">
            {d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500">{activities.length} activities · ${totalCost} est. cost</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {expanded && activities.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {activities.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 glass-light rounded-xl"
                >
                  {act.imageUrl && (
                    <img src={act.imageUrl} alt={act.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{act.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {act.time && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{act.time}</span>}
                      {act.durationHours && <span>{act.durationHours}h</span>}
                    </div>
                  </div>
                  <span className="text-green-400 text-xs font-semibold flex-shrink-0">
                    {act.cost === 0 ? 'Free' : `$${act.cost}`}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TripCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTripById } = useItineraryStore();
  const trip = getTripById(id);

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="font-display text-2xl font-bold">Trip not found</h2>
      </div>
    );
  }

  // Generate day-by-day view
  const dayMap: Record<string, { stopCity: string; activities: Activity[] }> = {};

  for (const stop of trip.stops.sort((a, b) => a.order - b.order)) {
    const start = new Date(stop.startDate);
    const end = new Date(stop.endDate);
    let current = new Date(start);
    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      dayMap[dateKey] = { stopCity: stop.city, activities: stop.activities };
      current = new Date(current.getTime() + 86400000);
    }
  }

  const days = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page-wrapper p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/trips/${id}`}>
          <button className="btn-ghost px-3 py-2"><ArrowLeft className="w-4 h-4" /></button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Trip Calendar</h1>
          <p className="text-slate-500 text-sm">{trip.name} · Day-by-day view</p>
        </div>
      </div>

      {/* City Journey Bar */}
      <div className="glass rounded-2xl p-5 mb-6">
        <h2 className="font-display text-base font-bold mb-3">Journey Overview</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {trip.stops.sort((a, b) => a.order - b.order).map((stop, i) => (
            <div key={stop.id} className="flex items-center gap-2 flex-shrink-0">
              <div className="glass-light px-3 py-2 rounded-xl text-center min-w-[80px]">
                <p className="font-bold text-sm">{stop.city}</p>
                <p className="text-xs text-slate-500">{stop.startDate.slice(5)} – {stop.endDate.slice(5)}</p>
              </div>
              {i < trip.stops.length - 1 && (
                <div className="text-amber-600 text-lg">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day-by-day */}
      {days.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">Add dates to your stops to see the calendar view</p>
          <Link href={`/trips/${id}/builder`}>
            <button className="btn-primary">Go to Builder</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {days.map(([date, { stopCity, activities }]) => (
            <div key={date}>
              <div className="text-xs text-amber-600 font-semibold mb-1.5 pl-1">{stopCity}</div>
              <DayRow date={date} activities={activities} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
