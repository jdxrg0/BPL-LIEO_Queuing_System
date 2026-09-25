import React from 'react';
import { UserX, RefreshCw, TrendingUp } from 'lucide-react';

export default function QualityMetrics({ advanced, year }) {
  const yoy = advanced.yoy;
  const metrics = [
    {
      label: 'No-Show',
      caption: 'Tickets that never got served',
      value: advanced.noShow,
      color: 'text-rose-600 dark:text-rose-400',
      soft: 'bg-rose-50 dark:bg-rose-500/10',
      deco: 'bg-rose-50 dark:bg-rose-500/10',
      icon: <UserX size={18} />
    },
    {
      label: 'Postponed',
      caption: 'Deferred to a later time',
      value: advanced.postponed,
      color: 'text-amber-500 dark:text-amber-400',
      soft: 'bg-amber-50 dark:bg-amber-500/10',
      deco: 'bg-amber-50 dark:bg-amber-500/10',
      icon: <RefreshCw size={18} />
    },
    {
      label: 'Avg Skips',
      caption: 'Times skipped while waiting',
      value: advanced.avgSkipCount,
      color: 'text-indigo-600 dark:text-indigo-400',
      soft: 'bg-indigo-50 dark:bg-indigo-500/10',
      deco: 'bg-indigo-50 dark:bg-indigo-500/10',
      icon: <TrendingUp size={18} />
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((m, idx) => (
        <div
          key={m.label}
          className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden animate-slide-up"
          style={{ animationDelay: `${idx * 0.05}s` }}
        >
          <div className={`absolute right-0 top-0 w-20 h-20 rounded-bl-full ${m.deco} opacity-50 pointer-events-none`}></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{m.label}</span>
              <p className="m-0 mt-1 text-[10px] font-semibold text-text-muted/80 max-w-[120px] leading-tight">{m.caption}</p>
            </div>
            <div className={`w-8 h-8 rounded-xl ${m.soft} ${m.color} flex items-center justify-center`}>{m.icon}</div>
          </div>
          <span className={`text-3xl font-black tracking-tighter ${m.color} relative z-10`}>{m.value}</span>
        </div>
      ))}

      <div className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="absolute right-0 top-0 w-20 h-20 rounded-bl-full bg-emerald-50 dark:bg-emerald-500/10 opacity-50 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">YoY vs {year - 1}</span>
            <p className="m-0 mt-1 text-[10px] font-semibold text-text-muted/80 max-w-[120px] leading-tight">Same period last year</p>
          </div>
          <TrendingUp
            size={18}
            className={yoy.pctChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
          />
        </div>
        <div className="relative z-10 flex items-baseline gap-2">
          <span className={`text-3xl font-black tracking-tighter ${yoy.pctChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {yoy.pctChange >= 0 ? '+' : ''}{yoy.pctChange}%
          </span>
        </div>
        <p className="m-0 mt-1 text-[10px] font-semibold text-text-muted relative z-10">
          {yoy.current.toLocaleString()} vs {yoy.previous.toLocaleString()}
        </p>
      </div>
    </div>
  );
}