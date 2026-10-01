import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

function Sparkline({ data, color, id }) {
  if (!data || data.length < 2) return null;

  const chartData = data.map((count, i) => ({ i, count }));

  return (
    <div className="h-full w-full pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2.5}
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
  hex,
  spark,
  delta,
  sparkId,
  animationDelay = 0
}) {
  return (
    <div
      className="bg-surface rounded-2xl p-5 shadow-sm border border-border relative overflow-hidden group hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slide-up flex flex-col"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 ${soft}`}></div>
      
      <div className="flex justify-between items-start relative z-10 mb-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-muted mb-1">{label}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-3xl font-black text-text-main tracking-tight leading-none">{value}</h3>
            {delta && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                delta.value >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-500/20'
              }`}>
                {delta.value >= 0 ? '+' : ''}{delta.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-white/20 dark:border-white/5 ${soft} ${color}`}>
          {icon}
        </div>
      </div>
      
      <div className="h-14 w-full mt-auto relative z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
        <Sparkline data={spark} color={hex} id={sparkId} />
      </div>
    </div>
  );
}
