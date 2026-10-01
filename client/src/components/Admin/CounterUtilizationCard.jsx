import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CounterUtilizationCard({ counterUtilization }) {
  const peak = counterUtilization && counterUtilization.length
    ? counterUtilization.reduce((max, entry) => (entry.count > max.count ? entry : max), counterUtilization[0])
    : null;

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Counter Utilization</h2>
        {peak && peak.count > 0 && (
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-500/20">
            Most Active: {peak.name}
          </span>
        )}
      </div>
      <p className="text-text-muted mt-0.5 text-xs font-medium">Tickets handled per counter</p>
      <div className="h-56 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={counterUtilization} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }} width={80} />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(245, 158, 11, 0.2)', padding: '12px 16px' }}
              itemStyle={{ color: '#f59e0b', fontWeight: '900' }}
              labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
              cursor={{ fill: '#f59e0b', opacity: 0.08 }}
            />
            <Bar dataKey="count" name="Tickets" radius={[0, 6, 6, 0]}>
              {counterUtilization?.map((entry, idx) => (
                <Cell key={idx} fill={entry.count > 0 ? '#f59e0b' : 'var(--color-border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
