import React from 'react';
import { LayoutDashboard, Activity, BarChart3, Users } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { key: 'live', label: 'Live Queue', icon: <Activity size={16} />, live: true },
  { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { key: 'staff', label: 'Staff', icon: <Users size={16} /> }
];

export default function AdminTabBar({ active, onChange }) {
  return (
    <div className="sticky top-0 z-30 mb-6">
      <div className="flex gap-1.5 bg-surface/80 backdrop-blur-md border border-border rounded-2xl p-1.5 shadow-soft w-fit max-w-full overflow-x-auto">
        {TABS.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-text-muted hover:bg-bg-color hover:text-text-main'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.live && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-white' : 'bg-emerald-500'}`}></span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}