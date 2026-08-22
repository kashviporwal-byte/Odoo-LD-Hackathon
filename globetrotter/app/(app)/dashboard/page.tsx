'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, TrendingUp, MapPin, Globe, ArrowRight,
  Star, DollarSign, Calendar, Compass
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useItineraryStore } from '@/store/useItineraryStore';
import { useGlobeStore } from '@/store/useGlobeStore';
import { mockCities } from '@/lib/mockData';
import { generateItineraryForCity } from '@/lib/itineraryGenerator';
import type { Trip } from '@/types';

const statusColors: Record<string, string> = {
  upcoming: 'status-upcoming',
  ongoing: 'status-ongoing',
  completed: 'status-completed',
  draft: 'status-draft',
};

function TripCard({ trip }: { trip: Trip }) {
  const openGlobe = useGlobeStore((s) => s.openGlobe);
  const nights = trip.stops.reduce((acc, s) => {
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    return acc + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);

  const handleGlobeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Look up exact coords from mockCities using the first stop's cityId
    const firstStopCityId = trip.stops[0]?.cityId;
    const cityMeta = mockCities.find((c) => c.id === firstStopCityId);
    const lat = cityMeta?.lat ?? 48.8566;
    const lng = cityMeta?.lng ?? 2.3522;
    openGlobe(lat, lng, trip.stops[0]?.city ?? trip.name);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/trips/${trip.id}`}>
        <div className="glass rounded-2xl overflow-hidden group cursor-pointer">
          <div className="relative h-40 overflow-hidden">
            <img
              src={trip.coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80'}
              alt={trip.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="img-overlay" />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleGlobeClick}
                className="p-1.5 rounded-full bg-white/80 hover:bg-white text-amber-600 shadow-md transition-transform hover:scale-110"
                title="View on 3D Globe"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
              <span className={`badge ${statusColors[trip.status]} text-xs`}>{trip.status}</span>
            </div>
            <div className="absolute bottom-3 left-3">
              <h3 className="font-display text-slate-900 font-bold text-lg leading-tight">{trip.name}</h3>
              <p className="text-slate-600 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{trip.stops.length} {trip.stops.length === 1 ? 'city' : 'cities'}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{nights}n</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${trip.budget.toLocaleString()}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CityCard({ city, index }: { city: typeof mockCities[0]; index: number }) {
  const router = useRouter();
  const openGlobe = useGlobeStore((s) => s.openGlobe);
  const { addTrip } = useItineraryStore();
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGlobeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openGlobe(city.lat ?? 35.6762, city.lng ?? 139.6503, city.name);
  };

  const handleCardClick = () => {
    if (isGenerating) return;
    setIsGenerating(true);

    // Automatically generate a full trip with curated stops and activities
    const generatedTrip = generateItineraryForCity(city, {
      userId: user?.id,
    });

    // Add to user trips in store and database
    addTrip(generatedTrip);

    // Navigate to the newly generated trip's itinerary and builder
    router.push(`/trips/${generatedTrip.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
    >
      <div
        className="relative h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        <img
          src={city.coverPhoto}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="img-overlay" />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={handleGlobeClick}
            className="p-2 rounded-full bg-white/85 hover:bg-white text-amber-600 shadow-md transition-transform hover:scale-110"
            title="View on 3D Globe"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="badge bg-white/90 text-slate-900 shadow-sm text-xs font-bold py-1 px-2 flex items-center gap-1">
            <Plus className="w-3 h-3 text-amber-600" /> Plan Trip
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
          <h3 className="text-slate-900 font-bold text-base">{city.name}</h3>
          <p className="text-slate-500 text-xs">{city.country}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`badge badge-amber text-xs`}>${city.avgDailyCostUSD}/day</span>
            <span className="flex items-center gap-0.5 text-amber-600 text-xs">
              <Star className="w-3 h-3 fill-amber-400" />{city.popularityScore}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { trips, fetchTrips } = useItineraryStore();

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const firstName = user?.name?.split(' ')[0] ?? 'Traveler';
  const upcoming = trips.filter((t) => t.status === 'upcoming' || t.status === 'draft');
  const recent = trips.slice(0, 4);
  const featuredCities = mockCities.slice(0, 8);

  const stats = [
    { label: 'Trips Planned', value: trips.length, icon: MapIcon, color: 'text-blue-400' },
    { label: 'Cities Visited', value: trips.reduce((a, t) => a + t.stops.length, 0), icon: MapPin, color: 'text-amber-600' },
    { label: 'Total Budget', value: `$${trips.reduce((a, t) => a + t.budget, 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Upcoming Trips', value: upcoming.length, icon: TrendingUp, color: 'text-purple-400' },
  ];

  return (
    <div className="page-wrapper p-4 lg:p-8 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            className="font-display text-3xl lg:text-4xl font-bold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Where to next,{' '}
            <span className="text-[#EDBF9B]">{firstName}?</span>
          </motion.h1>
          <p className="text-slate-500 mt-1.5">Plan, discover, and share your perfect journey.</p>
        </div>
        <Link href="/trips/new">
          <button className="btn-primary">
            <Plus className="w-4 h-4" /> Plan New Trip
          </button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            className="glass p-4 rounded-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
          >
            <div className={`${color} mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-bold text-xl">{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Trips */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">My Trips</h2>
            <Link href="/trips" className="text-amber-600 text-sm hover:text-amber-300 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Discover Destinations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Discover Destinations</h2>
          <Link href="/city-search" className="text-amber-600 text-sm hover:text-amber-300 flex items-center gap-1">
            Explore all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredCities.map((city, i) => (
            <CityCard key={city.id} city={city} index={i} />
          ))}
        </div>
      </section>

      {/* Budget Highlights */}
      {trips.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Budget Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.slice(0, 3).map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}/budget`}>
                <motion.div className="glass p-5 rounded-xl hover:border-amber-500/20 transition-colors cursor-pointer" whileHover={{ y: -2 }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{trip.name}</h3>
                    <DollarSign className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="font-bold text-2xl gradient-text">${trip.budget.toLocaleString()}</p>
                  <p className="text-slate-500 text-xs mt-1">Total budget</p>
                  <div className="mt-3 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                      style={{ width: `${Math.min(85, Math.random() * 60 + 30)}%` }}
                    />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Map icon for stats
function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
