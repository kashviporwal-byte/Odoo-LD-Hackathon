'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Users, Map, Globe, TrendingUp, TrendingDown,
  Activity, Shield, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { mockAnalyticsStats, mockAdminUsers, mockTrips, mockCities } from '@/lib/mockData';
import type { AnalyticsStat } from '@/types';
import { Suspense } from 'react';

// Dynamically import charts for admin page too
const AdminCharts = dynamic(() => import('@/components/admin/AdminCharts'), {
  loading: () => <div className="skeleton h-64 rounded-2xl" />,
  ssr: false,
});

function StatCard({ stat, index }: { stat: AnalyticsStat; index: number }) {
  const TrendIcon = stat.trend === 'up' ? ArrowUp : stat.trend === 'down' ? ArrowDown : Minus;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass p-5 rounded-xl"
    >
      <p className="text-slate-500 text-xs mb-2">{stat.label}</p>
      <p className="font-bold text-2xl gradient-text">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
      <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
        <TrendIcon className="w-3.5 h-3.5" />
        {Math.abs(stat.change)}% vs last month
      </div>
    </motion.div>
  );
}

export default function AdminPage() {
  const topCities = mockCities
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 5);

  return (
    <div className="page-wrapper p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">Platform analytics & management</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="glass-light p-3 rounded-xl mb-6 text-xs text-slate-500 flex items-center gap-2 mt-4">
        <Activity className="w-4 h-4 text-amber-600 flex-shrink-0" />
        Demo data only — all metrics are illustrative for the hackathon prototype.
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {mockAnalyticsStats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Charts */}
      <Suspense fallback={<div className="skeleton h-64 rounded-2xl mb-8" />}>
        <AdminCharts trips={mockTrips} cities={mockCities} />
      </Suspense>

      {/* Top Cities */}
      <div className="glass rounded-2xl p-5 mb-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-600" /> Top Destinations
        </h2>
        <div className="space-y-3">
          {topCities.map((city, i) => (
            <div key={city.id} className="flex items-center gap-3">
              <span className="text-slate-500 text-sm w-5">{i + 1}</span>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                <img src={city.coverPhoto} alt={city.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{city.name}</p>
                <p className="text-xs text-slate-500">{city.country} · {city.region}</p>
              </div>
              <div className="text-right">
                <div className="w-28 h-1.5 bg-black/[0.04] rounded-full">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${city.popularityScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{city.popularityScore}/100</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" /> Recent Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-white/[0.06]">
                <th className="text-left pb-3 font-medium">User</th>
                <th className="text-left pb-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-center pb-3 font-medium">Trips</th>
                <th className="text-center pb-3 font-medium">Status</th>
                <th className="text-right pb-3 font-medium hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {mockAdminUsers.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/[0.04] last:border-0"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">
                        {u.name[0]}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                  <td className="py-3 text-center font-bold text-amber-600">{u.tripsCount}</td>
                  <td className="py-3 text-center">
                    <span className={`badge text-xs ${u.status === 'active' ? 'badge-green' : u.status === 'banned' ? 'badge-red' : 'badge-amber'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-500 text-xs hidden md:table-cell">
                    {u.joinedAt.split('T')[0]}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
