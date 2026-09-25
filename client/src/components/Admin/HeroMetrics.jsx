import React from 'react';
import { Users, FilePlus, RefreshCw, Archive } from 'lucide-react';
import KpiCard from './KpiCard';

const KPI_CONFIG = [
  {
    key: 'total',
    label: 'Total Served',
    color: 'text-indigo-600',
    soft: 'bg-indigo-50 dark:bg-indigo-500/10',
    accent: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    icon: <Users size={18} />,
    hex: '#6366f1'
  },
  {
    key: 'newApp',
    label: 'New Apps',
    color: 'text-emerald-600',
    soft: 'bg-emerald-50 dark:bg-emerald-500/10',
    accent: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    icon: <FilePlus size={18} />,
    hex: '#10b981'
  },
  {
    key: 'renewal',
    label: 'Renewals',
    color: 'text-indigo-600',
    soft: 'bg-indigo-50 dark:bg-indigo-500/10',
    accent: 'bg-gradient-to-r from-indigo-500 to-sky-400',
    icon: <RefreshCw size={18} />,
    hex: '#6366f1'
  },
  {
    key: 'retirement',
    label: 'Retirements',
    color: 'text-rose-600',
    soft: 'bg-rose-50 dark:bg-rose-500/10',
    accent: 'bg-gradient-to-r from-rose-500 to-orange-400',
    icon: <Archive size={18} />,
    hex: '#f43f5e'
  }
];

export default function HeroMetrics({ office, spark, yoy }) {
  const delta = yoy ? { value: yoy.pctChange } : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {KPI_CONFIG.map((kpi, idx) => (
        <KpiCard
          key={kpi.key}
          {...kpi}
          value={(office[kpi.key] || 0).toLocaleString()}
          spark={spark?.[kpi.key]}
          delta={kpi.key === 'total' ? delta : null}
          sparkId={kpi.key}
          animationDelay={idx * 0.05}
        />
      ))}
    </div>
  );
}