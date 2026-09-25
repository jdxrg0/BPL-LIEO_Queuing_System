import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LINE_SERIES = [
  { dataKey: 'newApp', name: 'New Apps', stroke: '#10b981' },
  { dataKey: 'renewal', name: 'Renewals', stroke: '#6366f1' },
  { dataKey: 'retirement', name: 'Retirements', stroke: '#f43f5e' }
];

export default function TicketsChartCard({ trend, trendStart, trendEnd, onStartChange, onEndChange }) {
  if (!trend) return null;

  return (
    <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft border border-border flex flex-col transition-all hover:shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Tickets Issued</h2>
          <p className="text-text-muted mt-0.5 text-xs font-medium mb-2">Daily volume of new tickets</p>
          <div className="flex gap-4">
            {LINE_SERIES.map(s => (
              <span key={s.dataKey} className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: s.stroke }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.stroke }}></span>
                {s.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 items-center bg-bg-color p-1.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 pl-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">From:</label>
            <input type="date" value={trendStart} onChange={(e) => onStartChange(e.target.value)} className="p-1 px-2 rounded-lg border border-border outline-none bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-xs shadow-sm" />
          </div>
          <div className="flex items-center gap-1.5 pr-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">To:</label>
            <input type="date" value={trendEnd} onChange={(e) => onEndChange(e.target.value)} className="p-1 px-2 rounded-lg border border-border outline-none bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-xs shadow-sm" />
          </div>
        </div>
      </div>
      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dx={-10} />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(79, 70, 229, 0.2)', padding: '12px 16px' }}
              itemStyle={{ color: 'var(--color-primary)', fontWeight: '900' }}
              labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
              cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
            />
            {LINE_SERIES.map(s => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.stroke}
                strokeWidth={3}
                dot={{ r: 4, fill: s.stroke, strokeWidth: 3, stroke: 'white' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}