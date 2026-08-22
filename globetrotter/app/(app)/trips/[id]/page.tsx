'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, List, Share2, Edit3, MapPin,
  Clock, DollarSign, ChevronDown, ChevronUp, Globe, Copy, Check
} from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import type { Activity, CityStop } from '@/types';

const categoryColors: Record<string, string> = {
  sightseeing: 'badge-blue',
  food: 'badge-amber',
  adventure: 'badge-green',
  shopping: 'badge-pink',
  culture: 'badge-purple',
  nightlife: 'badge-amber',
  wellness: 'badge-blue',
  transport: '',
};

function ActivityBlock({ activity }: { activity: Activity }) {
  return (
    <motion.div
      layout
      className="flex gap-3 p-3 glass-light rounded-xl group"
      whileHover={{ x: 2 }}
    >
      <div className="w-1 rounded-full bg-amber-500/60 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-tight">{activity.name}</h4>
          <span className={`badge ${categoryColors[activity.category] || 'badge-blue'} flex-shrink-0`}>
            {activity.category}
          </span>
        </div>
        {activity.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          {activity.time && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.time}</span>
          )}
          {activity.durationHours && (
            <span>{activity.durationHours}h</span>
          )}
          <span className="flex items-center gap-1 text-green-400">
            <DollarSign className="w-3 h-3" />
            {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function StopCard({ stop, index }: { stop: CityStop; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const totalCost = stop.activities.reduce((a, act) => a + act.cost, 0);
  const nights = Math.ceil(
    (new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / 86400000
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Stop Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-600 font-bold text-sm">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-lg">{stop.city}</h3>
            <span className="text-slate-500 text-sm">{stop.country}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{stop.startDate} → {stop.endDate}</span>
            <span>{nights} nights</span>
            <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" />${totalCost}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-amber text-xs">{stop.activities.length} activities</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {/* Activities */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {stop.activities.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No activities added yet</p>
              ) : (
                stop.activities.map((act) => <ActivityBlock key={act.id} activity={act} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CalendarView({ stops }: { stops: CityStop[] }) {
  return (
    <div className="space-y-3">
      {stops.map((stop, i) => {
        const start = new Date(stop.startDate);
        const end = new Date(stop.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);

        return (
          <motion.div
            key={stop.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-4"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0 mt-1" />
              {i < stops.length - 1 && <div className="w-0.5 flex-1 bg-amber-500/10 my-1" />}
            </div>
            <div className="flex-1 glass p-4 rounded-xl mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold">{stop.city}, {stop.country}</h3>
                  <p className="text-xs text-slate-500">{stop.startDate} – {stop.endDate} ({days} nights)</p>
                </div>
                <span className="badge badge-amber">{stop.activities.length} activities</span>
              </div>
              {stop.activities.slice(0, 2).map((act) => (
                <div key={act.id} className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  {act.name}
                  {act.time && <span className="text-slate-500">({act.time})</span>}
                </div>
              ))}
              {stop.activities.length > 2 && (
                <p className="text-xs text-slate-500 mt-1">+{stop.activities.length - 2} more activities</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function TripViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTripById, fetchTripById } = useItineraryStore();
  const { viewMode, toggleViewMode } = useItineraryStore();
  const [copied, setCopied] = useState(false);
  const trip = getTripById(id);

  useEffect(() => {
    fetchTripById(id);
  }, [id, fetchTripById]);

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

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${trip.shareSlug ?? trip.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCost = trip.stops.reduce(
    (acc, s) => acc + s.activities.reduce((a, act) => a + act.cost, 0),
    0
  );
  const totalNights = trip.stops.reduce((acc, s) => {
    return acc + Math.ceil((new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 86400000);
  }, 0);

  return (
    <div className="page-wrapper p-4 lg:p-8">
      {/* Header */}
      <div className="relative h-56 rounded-2xl overflow-hidden mb-6">
        <img
          src={trip.coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80'}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="img-overlay" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Link href="/trips">
            <button className="btn-ghost py-2 px-3 text-sm backdrop-blur"><ArrowLeft className="w-4 h-4" /></button>
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleShare} className="btn-ghost py-2 px-3 text-sm backdrop-blur">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <Link href={`/trips/${id}/builder`}>
            <button className="btn-primary py-2 text-sm"><Edit3 className="w-4 h-4" /> Edit</button>
          </Link>
        </div>
        <div className="absolute bottom-4 left-4">
          <h1 className="font-display text-3xl font-bold text-slate-900">{trip.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-slate-600 text-sm">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.stops.length} cities</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{totalNights} nights</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${trip.budget.toLocaleString()} budget</span>
            {trip.isPublic && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-purple-400" /> Public</span>}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cities', value: trip.stops.length },
          { label: 'Nights', value: totalNights },
          { label: 'Activities', value: trip.stops.reduce((a, s) => a + s.activities.length, 0) },
          { label: 'Est. Cost', value: `$${totalCost.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="glass-light p-3 rounded-xl text-center">
            <p className="font-bold text-lg gradient-text">{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 glass-light rounded-xl">
          <button
            onClick={() => useItineraryStore.getState().setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-amber-500 text-[#ffffff]' : 'text-slate-500 hover:text-gt-text'}`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => useItineraryStore.getState().setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-amber-500 text-[#ffffff]' : 'text-slate-500 hover:text-gt-text'}`}
          >
            <Calendar className="w-4 h-4" /> Timeline
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <Link href={`/trips/${id}/budget`}>
            <button className="btn-ghost text-sm py-2"><DollarSign className="w-4 h-4" /> Budget</button>
          </Link>
          <Link href={`/trips/${id}/calendar`}>
            <button className="btn-ghost text-sm py-2"><Calendar className="w-4 h-4" /> Calendar</button>
          </Link>
        </div>
      </div>

      {/* Itinerary */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {trip.stops.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 mb-4">No stops yet. Start building your itinerary!</p>
                <Link href={`/trips/${id}/builder`}>
                  <button className="btn-primary">Open Itinerary Builder</button>
                </Link>
              </div>
            ) : (
              trip.stops.sort((a, b) => a.order - b.order).map((stop, i) => (
                <StopCard key={stop.id} stop={stop} index={i} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CalendarView stops={trip.stops.sort((a, b) => a.order - b.order)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
