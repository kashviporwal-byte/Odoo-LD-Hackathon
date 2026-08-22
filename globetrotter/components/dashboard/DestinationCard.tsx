'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe, Star, Plus, Loader2 } from 'lucide-react';
import { useTripsStore } from '@/store/useTripsStore';
import { useGlobeStore } from '@/store/useGlobeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getActivitiesForCity } from '@/lib/itineraryGenerator';
import type { CityMeta, Trip, CityStop } from '@/types';

interface DestinationCardProps {
  city: CityMeta;
  index: number;
}

/**
 * Creates starter 3-day template itinerary data for the selected city
 */
export function createStarterTripTemplate(city: CityMeta, userId?: string): Trip {
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Default dates: starting 2 weeks in future, 3 days duration
  const start = new Date();
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 2); // 3 days inclusive

  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end.toISOString().split('T')[0];

  // Retrieve curated starter activities for this destination
  const activities = getActivitiesForCity(city.id, city.name);

  const initialStop: CityStop = {
    id: `stop-${Date.now()}-1`,
    cityId: city.id,
    city: city.name,
    country: city.country,
    countryCode: city.countryCode,
    startDate: startDateStr,
    endDate: endDateStr,
    coverPhoto: city.coverPhoto,
    order: 0,
    activities: activities.slice(0, 3), // 3 starter placeholder activities
  };

  const dailyCost = city.avgDailyCostUSD || 120;
  const totalBudget = dailyCost * 3 + 300;

  return {
    id: uniqueId,
    name: `Trip to ${city.name}`,
    description: city.description || `A 3-day starter adventure discovering ${city.name}, ${city.country}.`,
    coverPhoto: city.coverPhoto,
    status: 'draft',
    isPublic: false,
    shareSlug: `${city.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    budget: totalBudget,
    budgetBreakdown: {
      transport: Math.round(totalBudget * 0.25),
      stay: Math.round(totalBudget * 0.40),
      activities: Math.round(totalBudget * 0.15),
      meals: Math.round(totalBudget * 0.15),
      misc: Math.round(totalBudget * 0.05),
    },
    userId: userId || 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [city.region.toLowerCase(), 'starter-itinerary', city.name.toLowerCase()],
    stops: [initialStop],
  };
}

export default function DestinationCard({ city, index }: DestinationCardProps) {
  const router = useRouter();
  const { addTrip } = useTripsStore();
  const { openGlobe, closeGlobe } = useGlobeStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGlobeOnly = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openGlobe(city.lat ?? 48.8566, city.lng ?? 2.3522, city.name);
  };

  const handleCardClick = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // 1. Create Trip: Generate template starter trip with unique ID & add to Zustand store
    const newTrip = createStarterTripTemplate(city, user?.id);
    addTrip(newTrip);

    // 2. Trigger Animation: Immediately open global 3D globe pointing to city coordinates
    const lat = city.lat ?? 48.8566;
    const lng = city.lng ?? 2.3522;
    openGlobe(lat, lng, city.name);

    // 3. Route to Builder after 2.5s delay so user can enjoy the globe animation
    setTimeout(() => {
      // 4. Cleanup: Close globe as navigation transitions to the editor
      closeGlobe();
      router.push(`/trips/${newTrip.id}/builder`);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div
        className="relative h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-300 border border-transparent hover:border-[#EDBF9B]/40"
        onClick={handleCardClick}
      >
        <img
          src={city.coverPhoto}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="img-overlay" />

        {/* Top Right: Standalone 3D Globe Button */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={handleGlobeOnly}
            className="p-2 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md transition-transform hover:scale-110"
            title={`View ${city.name} on 3D Globe`}
          >
            <Globe className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Hover / Processing Badge */}
        <div className="absolute top-3 left-3 z-10 transition-opacity">
          {isProcessing ? (
            <span className="badge bg-slate-900 text-white shadow-md text-xs font-bold py-1 px-2.5 flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-[#EDBF9B]" /> Generating Itinerary...
            </span>
          ) : (
            <span className="badge bg-white/95 text-slate-900 shadow-sm text-xs font-bold py-1 px-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Plus className="w-3 h-3 text-[#C98E63]" /> Start 3-Day Trip
            </span>
          )}
        </div>

        {/* Bottom Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
          <h3 className="text-slate-900 font-bold text-base leading-tight drop-shadow-sm">{city.name}</h3>
          <p className="text-slate-600 text-xs">{city.country}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="badge badge-amber text-xs">${city.avgDailyCostUSD}/day</span>
            <span className="flex items-center gap-0.5 text-amber-600 text-xs font-semibold">
              <Star className="w-3 h-3 fill-amber-400" />{city.popularityScore}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
