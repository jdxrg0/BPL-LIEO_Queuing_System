import React from 'react';
import QualityMetrics from './QualityMetrics';
import BusiestHoursCard from './BusiestHoursCard';
import PriorityMixCard from './PriorityMixCard';

export default function AnalyticsTab({ advanced, year }) {
  return (
    <div className="animate-slide-up">
      <QualityMetrics advanced={advanced} year={year} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BusiestHoursCard busiestHours={advanced.busiestHours} />
        <PriorityMixCard priorityBreakdown={advanced.priorityBreakdown} />
      </div>
    </div>
  );
}