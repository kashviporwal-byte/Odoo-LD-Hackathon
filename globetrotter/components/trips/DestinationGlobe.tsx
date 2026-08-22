'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { motion } from 'framer-motion';

type DestinationGlobeProps = {
  destination: {
    lat: number;
    lng: number;
  };
};

interface GlobeMethods {
  pointOfView(pov: { lat: number; lng: number; altitude?: number }, transitionMs?: number): void;
  controls(): { autoRotate: boolean; enableZoom: boolean; enablePan: boolean; [key: string]: unknown };
}

export default function DestinationGlobe({ destination }: DestinationGlobeProps) {
  const globeEl = useRef<GlobeMethods | null>(null);
  const isReady = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // ── Responsive sizing ────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth * 0.9, 500);
      setDimensions({ width: size, height: size });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Camera: fires once the globe engine is ready ──────────────────────────────
  // This eliminates the race condition where pointOfView() was called before
  // the Three.js renderer had attached to globeEl.current.
  const handleGlobeReady = useCallback(() => {
    isReady.current = true;

    if (!globeEl.current) return;

    const controls = globeEl.current.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.enableZoom = false;
      controls.enablePan = false;
    }

    globeEl.current.pointOfView(
      { lat: destination.lat, lng: destination.lng, altitude: 1.8 },
      1500
    );
  }, [destination.lat, destination.lng]);

  // ── Camera: re-fires every time lat/lng props change ─────────────────────────
  // Only runs after the globe is ready (isReady guard) so it never fires into
  // a null ref. The short delay lets the overlay animation settle first.
  useEffect(() => {
    if (!isReady.current || !globeEl.current) return;

    const timer = setTimeout(() => {
      if (globeEl.current) {
        globeEl.current.pointOfView(
          { lat: destination.lat, lng: destination.lng, altitude: 1.8 },
          1200
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [destination.lat, destination.lng]);

  // ── Marker data ───────────────────────────────────────────────────────────────
  // Using pointsData (pure WebGL) instead of htmlElementsData to avoid the
  // '?' text artifact that appears when the HTML layer renders a fallback node.
  const markerData = [{ lat: destination.lat, lng: destination.lng }];

  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
        rotateZ: [0, 1.5, -1.5, 0],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="flex items-center justify-center overflow-hidden rounded-full shadow-[0_20px_60px_-15px_rgba(237,191,155,0.35)] bg-transparent"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <Globe
        ref={globeEl as any}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#cbd5e1"
        atmosphereAltitude={0.12}
        onGlobeReady={handleGlobeReady}
        // ── Accent propagating ring ───────────────────────────────────────────
        ringsData={markerData}
        ringColor={() => (t: number) => `rgba(237, 191, 155, ${1 - t})`}
        ringMaxRadius={10}
        ringPropagationSpeed={3}
        ringRepeatPeriod={900}
        // ── Solid accent dot (pure WebGL) ────────────────────────────────────
        pointsData={markerData}
        pointColor={() => '#EDBF9B'}
        pointRadius={0.6}
        pointAltitude={0.01}
        pointsMerge={false}
        // ── Explicitly clear the label layer ──────────────────────────────────
        labelsData={[]}
      />
    </motion.div>
  );
}
