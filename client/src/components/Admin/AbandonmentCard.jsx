import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AbandonmentCard({ trend }) {
  return (
    <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Queue Abandonment</h2>
        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-500/20">
          Drop-offs vs Served
        </span>
      </div>
      <p className="text-text-muted mt-0.5 text-xs font-medium">No-Shows & Postponed compared to Total Served</p>
      <div className="h-56 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDrop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }} minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }} dx={-10} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px 16px' }}
              itemStyle={{ fontWeight: '900' }}
              labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="tickets" name="Total Served" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorServed)" />
            <Area type="monotone" dataKey="dropOffs" name="Drop-offs" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorDrop)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
