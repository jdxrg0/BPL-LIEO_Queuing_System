import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BusiestDaysCard({ busiestDays }) {
  const peak = busiestDays && busiestDays.length
    ? busiestDays.reduce((max, entry) => (entry.count > max.count ? entry : max), busiestDays[0])
    : null;

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Busiest Days</h2>
        {peak && peak.count > 0 && (
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
            Peak: {peak.day}
          </span>
        )}
      </div>
      <p className="text-text-muted mt-0.5 text-xs font-medium">Completed tickets by day of week</p>
      <div className="h-56 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={busiestDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }} tickFormatter={(val) => val.substring(0, 3)} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }} dx={-10} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.2)', padding: '12px 16px' }}
              itemStyle={{ color: '#10b981', fontWeight: '900' }}
              labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
              cursor={{ fill: '#10b981', opacity: 0.08 }}
            />
            <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
              {busiestDays.map((entry, idx) => (
                <Cell key={idx} fill={entry.count > 0 ? '#10b981' : 'var(--color-border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
