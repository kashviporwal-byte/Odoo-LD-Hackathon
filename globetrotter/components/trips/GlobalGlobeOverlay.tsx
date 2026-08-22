'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useGlobeStore } from '@/store/useGlobeStore';

const DestinationGlobe = dynamic(() => import('@/components/trips/DestinationGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-[380px] h-[380px] md:w-[500px] md:h-[500px] rounded-full skeleton flex items-center justify-center border-2 border-amber-500/20 shadow-2xl">
      <div className="text-center p-6">
        <MapPin className="w-10 h-10 text-amber-600 animate-bounce mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Initializing 3D Projection...</p>
      </div>
    </div>
  ),
});

export default function GlobalGlobeOverlay() {
  const { isOpen, coordinates, destinationName, closeGlobe } = useGlobeStore();

  // Auto-dismiss after 5 seconds if not closed manually
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeGlobe();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, closeGlobe]);

  return (
    <AnimatePresence>
      {isOpen && coordinates && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-md p-4"
        >
          {/* Close button */}
          <button
            onClick={closeGlobe}
            className="absolute top-6 right-6 p-3.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 transition-colors z-10"
            aria-label="Close Globe Overlay"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-6 max-w-md"
          >
            <span className="badge badge-amber mb-2">Destination Lock</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
              Targeting <span className="text-amber-600 font-bold">{destinationName}</span>
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Coordinates: {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </p>
          </motion.div>

          {/* Globe Canvas Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <DestinationGlobe destination={coordinates} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
