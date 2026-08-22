'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin, Calendar, DollarSign, Globe, Copy, Check,
  Share2, MessageSquare, Mail, ArrowRight, Star
} from 'lucide-react';
import { useState } from 'react';
import { mockTrips } from '@/lib/mockData';
import type { Trip } from '@/types';

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);

  // Find trip by ID or shareSlug
  const trip = mockTrips.find((t) => t.id === id || t.shareSlug === id);

  if (!trip || !trip.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass p-10 rounded-2xl max-w-sm mx-4">
          <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Trip Not Found</h2>
          <p className="text-slate-500 mb-6">This trip doesn&apos;t exist or is set to private.</p>
          <Link href="/login"><button className="btn-primary">Explore GlobeTrotter</button></Link>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${trip.id}`
    : `https://globetrotter.app/share/${trip.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalNights = trip.stops.reduce((acc, s) => {
    return acc + Math.ceil((new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 86400000);
  }, 0);

  const totalActivities = trip.stops.reduce((a, s) => a + s.activities.length, 0);
  const totalCost = trip.stops.reduce((a, s) => a + s.activities.reduce((b, act) => b + act.cost, 0), 0);

  return (
    <div className="min-h-screen bg-gt-bg">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={trip.coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80'}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ffffff]/40 to-[#ffffff]" />
        <div className="absolute top-4 left-4">
          <Link href="/dashboard" className="btn-ghost text-sm backdrop-blur py-2 px-3">
            ← GlobeTrotter
          </Link>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center w-full px-4">
          <motion.h1
            className="font-display text-4xl font-bold text-slate-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {trip.name}
          </motion.h1>
          {trip.description && (
            <p className="text-slate-600 mt-2 max-w-lg mx-auto">{trip.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Cities', value: trip.stops.length, icon: MapPin },
            { label: 'Nights', value: totalNights, icon: Calendar },
            { label: 'Activities', value: totalActivities, icon: Star },
            { label: 'Est. Cost', value: `$${totalCost.toLocaleString()}`, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass text-center p-4 rounded-xl">
              <Icon className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="font-bold gradient-text text-lg">{value}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Share Box */}
        <div className="glass rounded-2xl p-5 mb-8">
          <h2 className="font-display text-lg font-bold mb-1">Share This Trip</h2>
          <p className="text-slate-500 text-sm mb-4">Copy the link or share on social media</p>
          <div className="flex gap-2 mb-4">
            <input readOnly value={shareUrl} className="gt-input flex-1 text-sm text-slate-500 cursor-pointer" onClick={handleCopy} />
            <button onClick={handleCopy} className={`btn-primary flex-shrink-0 ${copied ? 'bg-green-600' : ''}`}>
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=Check out my trip: ${trip.name}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm flex-1 justify-center"
            >
              <Share2 className="w-4 h-4 text-sky-500" /> Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm flex-1 justify-center"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" /> Share
            </a>
            <a
              href={`mailto:?subject=Check out my trip: ${trip.name}&body=${shareUrl}`}
              className="btn-ghost text-sm flex-1 justify-center"
            >
              <Mail className="w-4 h-4 text-amber-600" /> Email
            </a>
          </div>
        </div>

        {/* Itinerary */}
        <div className="space-y-4 mb-8">
          <h2 className="font-display text-xl font-bold">The Itinerary</h2>
          {trip.stops.sort((a, b) => a.order - b.order).map((stop, i) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg">{stop.city}</h3>
                  <p className="text-slate-500 text-sm">{stop.country} · {stop.startDate} → {stop.endDate}</p>
                </div>
                <span className="badge badge-amber">{stop.activities.length} activities</span>
              </div>
              {stop.activities.length > 0 && (
                <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stop.activities.map((act) => (
                    <div key={act.id} className="flex items-center gap-2 p-2.5 glass-light rounded-xl text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="flex-1 font-medium truncate">{act.name}</span>
                      <span className="text-green-400 flex-shrink-0">{act.cost === 0 ? 'Free' : `$${act.cost}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass rounded-2xl p-6 text-center">
          <Globe className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="font-display text-xl font-bold mb-2">Inspired? Plan Your Own!</h3>
          <p className="text-slate-500 text-sm mb-4">Copy this trip or start from scratch with GlobeTrotter</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login">
              <button className="btn-primary">
                Start Planning <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
