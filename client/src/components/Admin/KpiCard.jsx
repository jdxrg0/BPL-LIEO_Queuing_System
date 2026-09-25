import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

function Sparkline({ data, color, id }) {
  if (!data || data.length < 2) return null;

  const chartData = data.map((count, i) => ({ i, count }));

  return (
    <div className="h-10 w-full pointer-events-none" title="Last 90 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function KpiCard({
  label,
  value,
  icon,
  color,
  soft,
  accent,
  hex,
  spark,
  delta,
  sparkId,
  animationDelay = 0
}) {
  return (
    <div
      className="bg-surface rounded-3xl shadow-soft border border-border relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col animate-slide-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className={`h-1 w-full shrink-0 ${accent}`}></div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-center gap-2 relative z-10">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</span>
          <div className={`w-8 h-8 rounded-xl ${soft} ${color} flex items-center justify-center`}>{icon}</div>
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
          <span className={`text-3xl font-black tracking-tighter ${color}`}>{value}</span>
          {delta && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              delta.value >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
            }`}>
              {delta.value >= 0 ? '+' : ''}{delta.value}%
            </span>
          )}
        </div>
        <div className="mt-auto">
          <Sparkline data={spark} color={hex} id={sparkId} />
        </div>
      </div>
    </div>
  );
}