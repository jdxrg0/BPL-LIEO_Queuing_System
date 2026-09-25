import React from 'react';
import { SERVICE_STYLES } from '../../constants/serviceStyles';

export default function LiveQueueOverview({ liveWaitTimes, waitingCounts, servingTickets }) {
  const totalWaiting = Object.values(waitingCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-surface rounded-3xl p-5 mb-6 shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.05s' }}>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="m-0 text-lg font-extrabold text-text-main tracking-tight">Live Queue</h2>
          <p className="text-text-muted mt-0.5 text-xs font-medium">Real-time wait times and currently serving.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Live</span>
          <span className="ml-2 text-xs font-bold text-text-muted bg-bg-color px-2 py-1 rounded-lg border border-border">
            {totalWaiting} waiting
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
            {servingTickets.length} serving
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {Object.entries(SERVICE_STYLES).map(([prefix, style]) => (
          <div key={prefix} className={`rounded-2xl p-4 border ${style.card} bg-surface flex flex-col gap-2 relative overflow-hidden shadow-sm`}>
            <div className={`absolute right-0 top-0 w-16 h-16 rounded-bl-full ${style.soft} opacity-40 pointer-events-none`}></div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">{style.name}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${style.badge}`}>{prefix}</span>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <span className={`text-3xl font-black tracking-tighter ${style.text}`}>{waitingCounts[prefix] || 0}</span>
              <span className="text-xs font-bold text-text-muted mb-1">
                {liveWaitTimes && liveWaitTimes[prefix] !== undefined ? `~${liveWaitTimes[prefix]} min wait` : 'calculating…'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-xs font-black text-text-muted uppercase tracking-wider">Now Serving</h3>
          <span className="text-xs font-bold text-indigo-600">{servingTickets.length} active</span>
        </div>
        {servingTickets.length === 0 ? (
          <div className="text-center py-6 text-text-muted font-semibold text-sm bg-bg-color/60 rounded-2xl border border-dashed border-border">No tickets currently being served.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {servingTickets.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-color border border-border shrink-0">
                <span className={`font-black text-base ${SERVICE_STYLES[t.service?.prefix]?.text || 'text-text-main'}`}>{t.number}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${SERVICE_STYLES[t.service?.prefix]?.badge || 'border-border text-text-muted'}`}>{t.service?.prefix}</span>
                {t.counter?.name && <span className="text-xs font-bold text-text-muted">{t.counter.name}</span>}
                {t.priorityType && t.priorityType !== 'REGULAR' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">{t.priorityType}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}