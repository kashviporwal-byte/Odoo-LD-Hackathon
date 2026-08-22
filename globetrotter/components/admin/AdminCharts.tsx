'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import type { Trip, CityMeta } from '@/types';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const tripsData = months.map((m, i) => ({
  month: m,
  Trips: Math.floor(Math.random() * 800 + 200 + i * 100),
  Users: Math.floor(Math.random() * 300 + 100 + i * 40),
}));

export default function AdminCharts({ trips, cities }: { trips: Trip[]; cities: CityMeta[] }) {
  const costData = cities.slice(0, 8).map((c) => ({
    city: c.name,
    'Daily Cost': c.avgDailyCostUSD,
    'Cost Index': c.costIndex * 20,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass px-3 py-2 rounded-xl text-xs border border-white/10">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Monthly Growth */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-base font-bold mb-4">Monthly Growth</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tripsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            <Line type="monotone" dataKey="Trips" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Users" stroke="#60a5fa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* City Cost Index */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-base font-bold mb-4">City Cost Comparison</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={costData} margin={{ left: -10 }}>
            <XAxis dataKey="city" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            <Bar dataKey="Daily Cost" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
