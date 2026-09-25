import React from 'react';
import LiveQueueOverview from './LiveQueueOverview';

export default function LiveQueueTab({ liveWaitTimes, waitingCounts, servingTickets }) {
  return (
    <div className="animate-slide-up">
      <LiveQueueOverview
        liveWaitTimes={liveWaitTimes}
        waitingCounts={waitingCounts}
        servingTickets={servingTickets}
      />
    </div>
  );
}