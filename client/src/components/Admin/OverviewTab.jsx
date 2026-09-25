import React from 'react';
import HeroMetrics from './HeroMetrics';
import TicketsChartCard from './TicketsChartCard';

export default function OverviewTab({ stats, trendStart, trendEnd, onStartChange, onEndChange }) {
  return (
    <div className="animate-slide-up">
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