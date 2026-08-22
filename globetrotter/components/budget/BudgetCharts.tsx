'use client';

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { Trip } from '@/types';

const COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f472b6', '#a78bfa'];

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl text-xs border border-black/10">
        <p className="font-semibold mb-1">{label || payload[0].name}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: ${p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BudgetCharts({ trip }: { trip: Trip }) {
  const { budgetBreakdown } = trip;

  const pieData = [
    { name: 'Transport', value: budgetBreakdown.transport },
    { name: 'Stay', value: budgetBreakdown.stay },
    { name: 'Activities', value: budgetBreakdown.activities },
    { name: 'Meals', value: budgetBreakdown.meals },
    { name: 'Misc', value: budgetBreakdown.misc },
  ].filter((d) => d.value > 0);

  const barData = trip.stops.map((stop) => ({
    city: stop.city,
    Activities: stop.activities.reduce((a, act) => a + act.cost, 0),
    Budget: Math.round(trip.budget / (trip.stops.length || 1)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-4">Spending Distribution</h2>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  dataKey="value"
                  labelLine={false}
                  label={renderLabel}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            No budget data yet
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold mb-4">Cost per City</h2>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <XAxis
                dataKey="city"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>} />
              <Bar dataKey="Activities" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Budget" fill="#60a5fa" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
            Add stops to see cost breakdown
          </div>
        )}
      </div>
    </div>
  );
}
