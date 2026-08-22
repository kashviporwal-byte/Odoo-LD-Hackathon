import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/lib/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GlobeTrotter — Plan Your Perfect Journey',
  description:
    'Plan multi-city itineraries, discover top destinations, track your budget, and share your adventures with GlobeTrotter.',
  keywords: 'travel planner, itinerary builder, trip planning, budget tracker, travel app',
  openGraph: {
    title: 'GlobeTrotter — Plan Your Perfect Journey',
    description: 'Plan multi-city itineraries, discover top destinations, and share your adventures.',
    type: 'website',
  },
};

import GlobalGlobeOverlay from '@/components/trips/GlobalGlobeOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-gt-bg text-gt-text antialiased">
        <QueryProvider>
          {children}
          <GlobalGlobeOverlay />
        </QueryProvider>
      </body>
    </html>
  );
}
