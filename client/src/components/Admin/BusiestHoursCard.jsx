import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BusiestHoursCard({ busiestHours }) {
  return (
    <div className="bg-surface rounded-3xl p-5 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Busiest Hours</h2>
      <p className="text-text-muted mt-0.5 text-xs font-medium">Completed tickets by hour of day</p>
      <div className="h-56 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={busiestHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 9, fontWeight: 600 }} interval={2} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }} dx={-10} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(79, 70, 229, 0.2)', padding: '12px 16px' }}
              itemStyle={{ color: 'var(--color-primary)', fontWeight: '900' }}
              labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
              cursor={{ fill: 'var(--color-primary)', opacity: 0.08 }}
            />
            <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
              {busiestHours.map((entry, idx) => (
                <Cell key={idx} fill={entry.count > 0 ? 'var(--color-primary)' : 'var(--color-border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}