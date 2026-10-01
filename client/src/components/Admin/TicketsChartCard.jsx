import React from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calendar } from 'lucide-react';

const LINE_SERIES = [
  { dataKey: 'newApp', name: 'New Apps', stroke: 'var(--color-success)' },
  { dataKey: 'renewal', name: 'Renewals', stroke: 'var(--color-primary)' },
  { dataKey: 'retirement', name: 'Retirements', stroke: 'var(--color-danger)' }
];

export default function TicketsChartCard({ trend, trendStart, trendEnd, onStartChange, onEndChange }) {
  if (!trend) return null;

  const periodTotal = trend.reduce((sum, d) => sum + (d.tickets || 0), 0);
  const totalStroke = 'var(--color-text-main)';
  const isEmpty = trend.every(d => !d.tickets && !d.newApp && !d.renewal && !d.retirement);

  return (
    <div className="bg-surface rounded-2xl p-6 mb-6 shadow-sm border border-border flex flex-col transition-all hover:shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="m-0 text-xl font-black text-text-main tracking-tight">Ticketing Volume</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-500/20 dark:text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
              {periodTotal.toLocaleString()} tickets
            </span>
          </div>
          <p className="text-text-muted m-0 text-sm font-medium">Daily completed tickets broken down by application type</p>
        </div>
        
        
      </div>

      <div className="flex flex-wrap gap-5 mb-6 px-1">
        <span className="flex items-center gap-2 text-xs font-bold text-text-main bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ background: totalStroke }}></span>
          Total Volume
        </span>
        {LINE_SERIES.map(s => (
          <span key={s.dataKey} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800" style={{ color: s.stroke, backgroundColor: `${s.stroke}10` }}>
            <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ background: s.stroke }}></span>
            {s.name}
          </span>
        ))}
      </div>

      {isEmpty ? (
        <div className="h-[300px] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Calendar size={20} className="text-slate-400" />
          </div>
          <p className="text-text-muted font-semibold text-sm">No ticket data available for this period</p>
        </div>
      ) : (
        <div className="h-[350px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={totalStroke} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={totalStroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.6} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dx={-15} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px' }}
                itemStyle={{ color: 'var(--color-text-main)', fontWeight: '800', padding: '2px 0' }}
                labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}
                cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }}
              />
              <Area type="monotone" dataKey="tickets" name="Total" stroke={totalStroke} strokeWidth={3} fill="url(#totalArea)" dot={false} animationDuration={1000} />
              {LINE_SERIES.map(s => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.stroke}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-surface)', strokeWidth: 2, stroke: s.stroke }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: s.stroke }}
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

