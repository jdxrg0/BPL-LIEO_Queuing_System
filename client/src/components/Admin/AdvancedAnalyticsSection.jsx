import React, { useState } from 'react';
import { ChevronDown, BarChart3 } from 'lucide-react';
import QualityMetrics from './QualityMetrics';
import BusiestHoursCard from './BusiestHoursCard';
import PriorityMixCard from './PriorityMixCard';

export default function AdvancedAnalyticsSection({ advanced, year }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-surface rounded-3xl shadow-soft border border-border cursor-pointer transition-all hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <BarChart3 size={20} />
          </div>
          <div className="text-left">
            <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Advanced Analytics</h2>
            <p className="text-text-muted mt-0.5 text-xs font-medium">No-shows, skips, busy hours and priority mix for the selected period.</p>
          </div>
        </div>
        <ChevronDown size={20} className={`text-text-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-4">
          <QualityMetrics advanced={advanced} year={year} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BusiestHoursCard busiestHours={advanced.busiestHours} />
            <PriorityMixCard priorityBreakdown={advanced.priorityBreakdown} />
          </div>
        </div>
      )}
    </div>
  );
}