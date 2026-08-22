'use client';

import { use, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';

// ─── Dynamically import Recharts components ───────────────────────────────────
const BudgetCharts = dynamic(() => import('@/components/budget/BudgetCharts'), {
  loading: () => (
    <div className="flex flex-col gap-4">
      <div className="skeleton h-64 rounded-2xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  ),
  ssr: false,
});

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { budgetBreakdown, budget } = trip;
  const activityCost = trip.stops.reduce((a, s) => a + s.activities.reduce((b, act) => b + act.cost, 0), 0);
  const totalSpent = Object.values(budgetBreakdown).reduce((a, b) => a + b, 0);
  const remaining = budget - totalSpent;
  const overBudget = remaining < 0;

  return (
    <div className="page-wrapper p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/trips/${id}`}>
          <button className="btn-ghost px-3 py-2"><ArrowLeft className="w-4 h-4" /></button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Budget & Cost Breakdown</h1>
          <p className="text-gt-muted text-sm">{trip.name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Budget', value: `$${budget.toLocaleString()}`, color: 'text-amber-400', sub: 'Your set limit' },
          { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, color: 'text-blue-400', sub: 'Planned expenses' },
          { label: 'Remaining', value: `$${Math.abs(remaining).toLocaleString()}`, color: overBudget ? 'text-red-400' : 'text-green-400', sub: overBudget ? 'Over budget!' : 'Left to spend' },
          { label: 'Activity Cost', value: `$${activityCost.toLocaleString()}`, color: 'text-purple-400', sub: 'From activities' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="glass p-4 rounded-xl">
            <p className="text-gt-muted text-xs mb-1">{label}</p>
            <p className={`font-bold text-xl ${color}`}>{value}</p>
            <p className="text-xs text-gt-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div className="glass p-5 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Budget used</p>
          <p className={`text-sm font-bold ${overBudget ? 'text-red-400' : 'text-amber-400'}`}>
            {Math.round((totalSpent / budget) * 100)}%
          </p>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${overBudget ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-amber-300'}`}
            style={{ width: `${Math.min(100, (totalSpent / budget) * 100)}%` }}
          />
        </div>
        {overBudget && (
          <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
            ⚠ Over budget by ${Math.abs(remaining).toLocaleString()} — consider reducing expenses
          </p>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="glass rounded-2xl p-5 mb-8">
        <h2 className="font-display text-lg font-bold mb-4">Expense Breakdown</h2>
        <div className="space-y-3">
          {[
            { key: 'transport', label: 'Transport', icon: '✈️' },
            { key: 'stay', label: 'Accommodation', icon: '🏨' },
            { key: 'activities', label: 'Activities', icon: '🎯' },
            { key: 'meals', label: 'Meals', icon: '🍽️' },
            { key: 'misc', label: 'Miscellaneous', icon: '💼' },
          ].map(({ key, label, icon }) => {
            const val = budgetBreakdown[key as keyof typeof budgetBreakdown] || 0;
            const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
            const daily = trip.stops.reduce((acc, s) => {
              const n = Math.ceil((new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 86400000);
              return acc + n;
            }, 0);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-lg w-6">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-bold">${val.toLocaleString()} <span className="text-gt-muted font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full">
                    <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recharts — dynamically imported */}
      <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
        <BudgetCharts trip={trip} />
      </Suspense>

      {/* Per-city table */}
      <div className="glass rounded-2xl p-5 mt-6">
        <h2 className="font-display text-lg font-bold mb-4">Cost per City</h2>
        <div className="space-y-3">
          {trip.stops.map((stop) => {
            const cost = stop.activities.reduce((a, act) => a + act.cost, 0);
            const nights = Math.ceil((new Date(stop.endDate).getTime() - new Date(stop.startDate).getTime()) / 86400000);
            return (
              <div key={stop.id} className="flex items-center gap-3 p-3 glass-light rounded-xl">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={stop.coverPhoto} alt={stop.city} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{stop.city}</p>
                  <p className="text-xs text-gt-muted">{nights} nights · {stop.activities.length} activities</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-amber-400">${cost.toLocaleString()}</p>
                  <p className="text-xs text-gt-muted">${nights > 0 ? Math.round(cost / nights) : 0}/night</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
