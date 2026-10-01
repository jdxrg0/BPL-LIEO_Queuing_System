import React from 'react';
import { SERVICE_STYLES } from '../../constants/serviceStyles';
import { Trash2, UserX } from 'lucide-react';

export default function LiveQueueOverview({ liveWaitTimes, waitingCounts, servingTickets, waitingTickets = [], employees = [], liveFlow, onCancelTicket, onMarkNoShow }) {
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
          {liveFlow && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20" title="Tickets Served / Issued in the last hour">
              {liveFlow.servedLastHour}/{liveFlow.issuedLastHour} ⚡ (1h)
            </span>
          )}
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
                {liveWaitTimes && liveWaitTimes[prefix] != null ? `~${liveWaitTimes[prefix]} min wait` : 'no staff'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-xs font-black text-text-muted uppercase tracking-wider">Active Counters</h3>
          <div className="flex items-center gap-2">
            {liveFlow && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20" title="Average service time in the last hour">
                Avg {liveFlow.avgServiceMinsLastHour}m / ticket
              </span>
            )}
            <span className="text-xs font-bold text-text-muted">{employees.filter(e => e.counter).length} staffed</span>
          </div>
        </div>
        {employees.filter(e => e.counter).length === 0 ? (
          <div className="text-center py-4 text-text-muted font-semibold text-xs bg-bg-color/60 rounded-xl border border-dashed border-border">No counters currently staffed.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...employees.filter(e => e.counter)].sort((a, b) => (b.isOnline === a.isOnline ? 0 : b.isOnline ? 1 : -1)).map(emp => {
              const isServing = servingTickets.some(t => t.counter?.name === emp.counter?.name);
              const isOnline = emp.isOnline;
              
              const cardStyle = !isOnline 
                ? 'border-border bg-bg-color opacity-60' 
                : (isServing 
                    ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' 
                    : 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm');
                    
              const textColor = !isOnline ? 'text-text-muted' : 'text-text-main';
              const subTextColor = !isOnline 
                ? 'text-gray-400' 
                : (isServing ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400');

              return (
                <div key={emp.id} className={`flex flex-col p-3 rounded-xl border transition-all ${cardStyle}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-black uppercase ${!isOnline ? 'text-gray-400' : 'text-text-muted'}`}>{emp.counter?.name}</span>
                    <span className="relative flex h-2.5 w-2.5">
                      {isOnline ? (
                         isServing ? (
                            <>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </>
                         ) : (
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                         )
                      ) : (
                         <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400"></span>
                      )}
                    </span>
                  </div>
                  <span className={`text-sm font-bold truncate ${textColor}`} title={emp.name}>{emp.name}</span>
                  <span className={`text-[10px] font-black tracking-wide uppercase mt-0.5 ${subTextColor}`}>
                    {!isOnline ? 'Offline' : (isServing ? 'Serving' : 'Idle')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
              <div key={t.id} className="flex flex-col gap-1 px-4 py-2.5 rounded-xl bg-bg-color border border-border shrink-0 min-w-[140px]">
                <div className="flex items-center gap-2 justify-between">
                  <span className={`font-black text-base ${SERVICE_STYLES[t.service?.prefix]?.text || 'text-text-main'}`}>{t.number}</span>
                  {onMarkNoShow && (
                    <button onClick={() => onMarkNoShow(t.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Mark as No Show">
                      <UserX size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 justify-between mt-1">
                  <div className="flex gap-1.5 items-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${SERVICE_STYLES[t.service?.prefix]?.badge || 'border-border text-text-muted'}`}>{t.service?.prefix}</span>
                    {t.priorityType && t.priorityType !== 'REGULAR' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">{t.priorityType}</span>
                    )}
                  </div>
                  {t.counter?.name && <span className="text-[10px] font-bold text-text-muted">{t.counter.name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-xs font-black text-text-muted uppercase tracking-wider">Next in Line</h3>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{waitingTickets.length > 0 ? `${Math.min(5, waitingTickets.length)} upcoming` : 'None'}</span>
        </div>
        
        {waitingTickets.length === 0 ? (
          <div className="text-center py-6 text-text-muted font-semibold text-sm bg-bg-color/60 rounded-2xl border border-dashed border-border">No tickets waiting in queue.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {([...waitingTickets].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(0, 5)).map(t => {
              const waitTime = Math.floor((new Date() - new Date(t.createdAt)) / (1000 * 60));
              const isAlert = waitTime > 30; // 30 minutes SLA alert
              return (
                <div key={t.id} className={`flex flex-col gap-1 px-4 py-2.5 rounded-xl border shrink-0 min-w-[120px] ${isAlert ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-bg-color border-border'}`}>
                  <div className="flex items-center gap-2 justify-between">
                    <span className={`font-black text-base ${SERVICE_STYLES[t.service?.prefix]?.text || 'text-text-main'}`}>{t.number}</span>
                    <div className="flex gap-1 items-center">
                      {t.priorityType && t.priorityType !== 'REGULAR' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">{t.priorityType}</span>
                      )}
                      {onCancelTicket && (
                        <button onClick={() => onCancelTicket(t.id)} className={`p-1 rounded-lg transition-colors ${isAlert ? 'text-red-400 hover:bg-red-200/50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`} title="Cancel Ticket">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${SERVICE_STYLES[t.service?.prefix]?.badge || 'border-border text-text-muted'}`}>{t.service?.prefix}</span>
                    <span className={`text-[10px] font-bold ${isAlert ? 'text-red-600 dark:text-red-400' : 'text-text-muted'}`}>{waitTime} min wait</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}