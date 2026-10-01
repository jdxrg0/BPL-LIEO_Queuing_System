import React from 'react';
import HeroMetrics from './HeroMetrics';
import TicketsChartCard from './TicketsChartCard';

export default function OverviewTab({ stats, trendStart, trendEnd, onStartChange, onEndChange }) {
  return (
    <div className="flex flex-col gap-6">      
      <HeroMetrics office={stats.office} spark={stats.spark} yoy={stats.advanced?.yoy} />
      
      <TicketsChartCard
        trend={stats.trend}
        trendStart={trendStart}
        trendEnd={trendEnd}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
      />
    </div>
  );
}
