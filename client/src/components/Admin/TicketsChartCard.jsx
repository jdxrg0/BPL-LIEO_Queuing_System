import React from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const LINE_SERIES = [
  { dataKey: 'newApp', name: 'New Apps', stroke: '#10b981' },
  { dataKey: 'renewal', name: 'Renewals', stroke: '#6366f1' },
  { dataKey: 'retirement', name: 'Retirements', stroke: '#f43f5e' }
];

export default function TicketsChartCard({ trend, trendStart, trendEnd, onStartChange, onEndChange }) {
  if (!trend) return null;

  const periodTotal = trend.reduce((sum, d) => sum + (d.tickets || 0), 0);
  const totalStroke = 'var(--color-text-main)';
  const isEmpty = trend.every(d => !d.tickets && !d.newApp && !d.renewal && !d.retirement);

  return (
    <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft border border-border flex flex-col transition-all hover:shadow-md animate-slide-up" style={{ animationDelay: '0.05s' }}>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Tickets Issued</h2>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
              {periodTotal.toLocaleString()} in period
            </span>
          </div>
          <p className="text-text-muted mt-0.5 text-xs font-medium mb-2">Daily volume of completed tickets</p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-main">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: totalStroke }}></span>
              Total
            </span>
            {LINE_SERIES.map(s => (
              <span key={s.dataKey} className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: s.stroke }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.stroke }}></span>
                {s.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 items-center bg-bg-color p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
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

      {isEmpty ? (
        <div className="h-64 w-full flex items-center justify-center text-text-muted font-semibold text-sm bg-bg-color/60 rounded-2xl border border-dashed border-border">
          No completed tickets for this period.
        </div>
      ) : (
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={totalStroke} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={totalStroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dx={-10} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', background: 'var(--color-surface)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(79, 70, 229, 0.2)', padding: '12px 16px' }}
                itemStyle={{ color: 'var(--color-text-main)', fontWeight: '900' }}
                labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
                cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
              />
              <Area type="monotone" dataKey="tickets" name="Total" stroke={totalStroke} strokeWidth={2.5} fill="url(#totalArea)" dot={false} animationDuration={1500} />
              {LINE_SERIES.map(s => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.stroke}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: s.stroke, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}