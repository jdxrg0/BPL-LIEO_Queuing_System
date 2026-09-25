import React from 'react';
import { Users, TrendingUp, RefreshCw, Archive } from 'lucide-react';

const KPI_CARDS = [
  { key: 'total', label: 'Total Served', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Users size={18} /> },
  { key: 'newApp', label: 'New Apps', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <TrendingUp size={18} /> },
  { key: 'renewal', label: 'Renewals', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <RefreshCw size={18} /> },
  { key: 'retirement', label: 'Retirements', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: <Archive size={18} /> }
];

export default function SummaryCards({ office }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-slide-up">
      {KPI_CARDS.map((kpi) => (
        <div key={kpi.key} className="bg-surface rounded-3xl p-4 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className={`absolute right-0 top-0 w-20 h-20 rounded-bl-full ${kpi.bg} opacity-50 pointer-events-none`}></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{kpi.label}</span>
            <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center border ${kpi.border}`}>
              {kpi.icon}
            </div>
          </div>
          <span className={`text-3xl font-black tracking-tighter ${kpi.color} relative z-10`}>{office[kpi.key]}</span>
        </div>
      ))}
    </div>
  );
}