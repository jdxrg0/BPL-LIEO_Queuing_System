import React from 'react';
import QualityMetrics from './QualityMetrics';
import BusiestHoursCard from './BusiestHoursCard';
import PriorityMixCard from './PriorityMixCard';
import ServiceTypeCard from './ServiceTypeCard';
import AvgTimesChartCard from './AvgTimesChartCard';
import BusiestDaysCard from './BusiestDaysCard';
import CounterUtilizationCard from './CounterUtilizationCard';
import AbandonmentCard from './AbandonmentCard';

export default function AnalyticsTab({ advanced, year, office, trend }) {
  return (
    <div className="animate-slide-up">
      <QualityMetrics advanced={advanced} year={year} />
      
      {/* Time & Flow Analytics */}
      <div className="mb-6">
        <AvgTimesChartCard trend={trend} />
      </div>

      {/* Distribution Analytics - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ServiceTypeCard office={office} />
        <PriorityMixCard priorityBreakdown={advanced.priorityBreakdown} />
        <CounterUtilizationCard counterUtilization={advanced.counterUtilization} />
      </div>
      
      {/* Distribution Analytics - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <BusiestHoursCard busiestHours={advanced.busiestHours} />
        <BusiestDaysCard busiestDays={advanced.busiestDays} />
        <AbandonmentCard trend={trend} />
      </div>
    </div>
  );
}
