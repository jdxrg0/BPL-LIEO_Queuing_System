import React from 'react';
import { UserX, RefreshCw, TrendingUp } from 'lucide-react';

export default function QualityMetrics({ advanced, year }) {
  const yoy = advanced.yoy;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <div className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-20 rounded-bl-full bg-rose-50 opacity-50 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">No-Show</span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100"><UserX size={18} /></div>
        </div>
        <span className="text-3xl font-black tracking-tighter text-rose-600 relative z-10">{advanced.noShow}</span>
      </div>

      <div className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-20 rounded-bl-full bg-amber-50 opacity-50 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Postponed</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100"><RefreshCw size={18} /></div>
        </div>
        <span className="text-3xl font-black tracking-tighter text-amber-500 relative z-10">{advanced.postponed}</span>
      </div>

      <div className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-20 rounded-bl-full bg-indigo-50 opacity-50 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Avg Skips</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><TrendingUp size={18} /></div>
        </div>
        <span className="text-3xl font-black tracking-tighter text-indigo-600 relative z-10">{advanced.avgSkipCount}</span>
      </div>

      <div className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute right-0 top-0 w-20 h-20 rounded-bl-full bg-emerald-50 opacity-50 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">YoY vs {year - 1}</span>
          <TrendingUp size={18} className={yoy.pctChange >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        </div>
        <div className="relative z-10 flex items-baseline gap-2">
          <span className={`text-3xl font-black tracking-tighter ${yoy.pctChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {yoy.pctChange >= 0 ? '+' : ''}{yoy.pctChange}%
          </span>
        </div>
        <p className="m-0 mt-1 text-[10px] font-semibold text-text-muted relative z-10">
          {yoy.current.toLocaleString()} vs {yoy.previous.toLocaleString()} same period {year - 1}
        </p>
      </div>
    </div>
  );
}