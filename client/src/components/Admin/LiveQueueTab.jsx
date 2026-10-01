import React from 'react';
import LiveQueueOverview from './LiveQueueOverview';

export default function LiveQueueTab({ liveWaitTimes, waitingCounts, servingTickets, waitingTickets, employees, liveFlow, onCancelTicket, onMarkNoShow }) {
  return (
    <div className="animate-slide-up">
      <LiveQueueOverview
        liveWaitTimes={liveWaitTimes}
        waitingCounts={waitingCounts}
        servingTickets={servingTickets}
        waitingTickets={waitingTickets}
        employees={employees}
        liveFlow={liveFlow}
        onCancelTicket={onCancelTicket}
        onMarkNoShow={onMarkNoShow}
      />
    </div>
  );
}