import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, socket } from '../api';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardData } from '../hooks/useDashboardData';
import { Trash2, CheckCircle, SkipForward, Calendar, Check, Undo2, Monitor } from 'lucide-react';
import HoldActionBtn from '../components/Buttons/HoldActionBtn';
import HoldButton from '../components/Buttons/HoldButton';
import HoldTextButton from '../components/Buttons/HoldTextButton';
import ModalWrapper from '../components/Modals/ModalWrapper';
import { getServiceSlots, DEFAULT_SLOT_STYLE } from '../utils/serviceSlots';
import { User, Ticket, TicketStatus, Service } from '../types';

export default function StaffDashboard({ user }: { user: User }) {
  // 1. Data Fetching & Real-time Updates are now handled entirely by React Query!
  const { services, queue, currentServingList, postponedTickets, priorityGroups, isLoading } = useDashboardData(user?.id);
  const queryClient = useQueryClient();

  const [showReturnsModal, setShowReturnsModal] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  
  interface ToastMsg { title: string; message: string; type: 'success' | 'info' | 'error' }
  const [toastMessage, setToastMessage] = useState<ToastMsg | null>(null);
  const [isAutoCalling, setIsAutoCalling] = useState(false);
  
  const lastCaterPrefixRef = useRef<string | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getSettings().then(s => {
      if (s?.websiteName) document.title = `${s.websiteName} | Staff Dashboard`;
    }).catch(() => {
      document.title = 'BPLO Queuing System | Staff Dashboard';
    });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: any) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const activeCounterId = user?.counterId;
  const activeCounterName = user?.counter?.name || 'Unknown Window';

  // Listen for Cater Config updates specifically for toast messages
  useEffect(() => {
    const handleCaterConfigUpdated = (maxPrefix: string | null) => {
      if (lastCaterPrefixRef.current === maxPrefix) return;
      lastCaterPrefixRef.current = maxPrefix || undefined;

      if (!maxPrefix) {
        setToastMessage({
          title: "Traffic Normalized",
          message: "You are now serving all services again.",
          type: 'success'
        });
        return;
      }
      
      let serviceName = "All Services";
      // Access the cached services data directly from React Query!
      const cachedServices = queryClient.getQueryData<Service[]>(['services']) || [];
      const targetService = cachedServices.find(s => s.prefix === maxPrefix);
      if (targetService) serviceName = targetService.name;
      
      setToastMessage({
        title: "High Traffic Alert",
        message: `Prioritizing ${serviceName}.`,
        type: 'info'
      });
    };

    socket.on('caterConfigUpdated', handleCaterConfigUpdated);
    return () => { socket.off('caterConfigUpdated', handleCaterConfigUpdated); };
  }, [queryClient]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleDeleteTicket = async (id: number) => {
    try {
      await api.deleteTicket(id);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleCallNext = async (ticketId: number) => {
    if (!activeCounterId) return setToastMessage({ title: 'Error', message: 'You are not assigned to a window. Contact an Admin.', type: 'error' });
    try {
      await api.callTicket(ticketId, activeCounterId, user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecall = async (ticketId: number) => {
    if (activeCounterId) {
      try {
        await api.callTicket(ticketId, activeCounterId, user.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStatusUpdate = async (ticketId: number, status: TicketStatus) => {
    try {
      await api.updateStatus(ticketId, status);
      queryClient.invalidateQueries({ queryKey: ['serving'] });
    } catch (err) {
      console.error(err);
    }
  };

  const serviceSlots = useMemo(() => getServiceSlots(services), [services]);
  const styleByPrefix = useMemo(() => {
    const map: Record<string, any> = {};
    getServiceSlots(services).forEach((slot: any) => { map[slot.service.prefix] = slot.style; });
    return map;
  }, [services]);
  const queuesBySlot = useMemo(() => serviceSlots.map((slot: any) => ({
    ...slot,
    tickets: queue.filter(t => t.service?.id === slot.service.id)
  })), [serviceSlots, queue]);

  const renderQueueList = (slot: any, filteredQueue: Ticket[], columnIndex: number) => {
    
    const themeColors = {
      text: slot.style.text,
      border: slot.style.border,
      bgFill: slot.style.bgFill
    };
    const isCatered = user ? (user.role === 'ADMIN' || !!user[slot.flag as keyof User]) : false;
    
    return (
      <div className={`md:flex-1 md:min-h-0 flex flex-col p-3 bg-surface border ${themeColors.border} rounded-2xl shadow-sm transition-all duration-300 animate-tab-enter ${isCatered ? 'opacity-100 hover:shadow-md' : 'opacity-50 grayscale'}`} style={{ animationDelay: `${columnIndex * 0.08}s`, animationFillMode: 'both' }}>
        <div className="flex justify-between items-center mb-2">
          <h4 className={`${themeColors.text} m-0 text-base font-bold tracking-tight`}>{slot.service.name}</h4>
          <span className={`bg-surface ${themeColors.text} px-2 py-0.5 rounded-md text-xs font-extrabold border ${themeColors.border} shadow-sm`}>
            {filteredQueue.length}
          </span>
        </div>

        {filteredQueue.length === 0 ? (
          <div className={`md:flex-1 flex items-center justify-center rounded-xl border border-dashed ${themeColors.border} bg-bg-color p-4`}>
             <p className={`${themeColors.text} opacity-50 text-center text-xs font-semibold m-0`}>No tickets</p>
          </div>
        ) : (
          <div className="md:flex-1 md:overflow-y-auto pr-1 flex flex-col gap-1.5 relative">
            {filteredQueue.map((ticket, index) => (
              <div 
                key={ticket.id} 
                className={`flex justify-between items-center p-2 bg-surface rounded-xl border ${themeColors.border} shrink-0 gap-2 shadow-sm animate-tab-enter`}
                style={{ animationDelay: `${(columnIndex * 0.08) + (index * 0.05) + 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <span className={`text-sm font-black tracking-tight ${themeColors.text} whitespace-nowrap`}>{ticket.number}</span>
                  {ticket.priorityType && ticket.priorityType !== 'REGULAR' && (
                    <span title={`Priority: ${ticket.priorityType}`} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] px-2 py-0.5 rounded-md font-extrabold tracking-wide shadow-sm border border-orange-400 uppercase whitespace-nowrap shrink-0">
                      {priorityGroups.find(g => g.name === ticket.priorityType)?.shortLabel || ticket.priorityType}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 items-center">
                  {(ticket.createdByUserId === user.id || user?.role === 'ADMIN') && (
                    <HoldButton
                      onClick={() => handleDeleteTicket(ticket.id)}
                      icon={<Trash2 size={12} />}
                      colorMap={{ bg: 'transparent', main: '#ef4444' }}
                      tooltip="Hold to delete"
                      holdTime={800}
                    />
                  )}
                  <HoldTextButton 
                    onClick={() => handleCallNext(ticket.id)} 
                    text="Call"
                    disabled={!activeCounterId || !isCatered}
                    colorMap={{ bg: themeColors.bgFill, main: 'white' }}
                    tooltip="Hold to call ticket"
                    holdTime={600}
                    style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:overflow-hidden overflow-y-auto max-w-[1600px] mx-auto">
      
      {/* Top Section: Currently Serving */}
      <div className="flex flex-col shrink-0">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-xl font-extrabold text-text-main m-0 tracking-tight flex items-center gap-2">
              Currently Serving
              {currentServingList.length > 0 && (
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                  {currentServingList.length} Active
                </span>
              )}
            </h1>
            <p className="text-xs font-semibold text-text-muted mt-0.5 m-0 uppercase tracking-widest">{activeCounterName}</p>
          </div>
          <button 
            onClick={() => setShowReturnsModal(true)} 
            className="group relative px-4 py-1.5 bg-surface border border-warning text-warning rounded-lg font-bold text-sm cursor-pointer hover:bg-warning hover:text-white transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-warning w-0 group-hover:w-full transition-all duration-300 ease-out z-0"></div>
            <Undo2 size={14} className="relative z-10" />
            <span className="relative z-10">Returns {postponedTickets.length > 0 && `(${postponedTickets.length})`}</span>
          </button>
          
          <button 
            onClick={async () => {
              if (!activeCounterId) {
                setToastMessage({ title: 'Error', message: 'You are not assigned to a window. Contact an Admin.', type: 'error' });
                return;
              }
              setIsAutoCalling(true);
              try {
                await api.autoAssignNext(activeCounterId, user.id);
                // Success, queue will update via websocket
              } catch (err: any) {
                setToastMessage({ title: 'Notice', message: err.message || 'No suitable tickets found for your services.', type: 'info' });
              } finally {
                setIsAutoCalling(false);
              }
            }}
            disabled={!activeCounterId || isAutoCalling}
            className="ml-3 group relative px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoCalling ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Auto-Calling...</>
            ) : (
              <>⚡ Auto-Call Next</>
            )}
          </button>
        </div>
        
        <div ref={scrollContainerRef} className="flex overflow-x-auto pb-2 gap-3">
          {currentServingList.length === 0 ? (
             <div className="w-full bg-surface border border-border rounded-3xl p-8 flex items-center justify-center shadow-soft">
               <p className="text-text-muted m-0 text-lg font-medium text-center">No ticket currently serving. Call the next from the queue.</p>
             </div>
          ) : (
            currentServingList.map((ticket, i) => {
              const colors = (() => {
                const style = styleByPrefix[ticket.service?.prefix || ''] || DEFAULT_SLOT_STYLE;
                return { bg: style.bg, border: style.border, text: style.text, grad: style.grad };
              })();
              
              return (
              <div key={ticket.id} className={`w-[300px] shrink-0 bg-surface border ${colors.border} rounded-2xl p-3 shadow-sm flex flex-col gap-3 animate-slide-up hover:shadow-md transition-all relative overflow-hidden`} style={{ animationDelay: `${i*0.1}s` }}>
                
                {/* Decorative background blur */}
                <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${colors.grad} opacity-10 blur-xl rounded-full pointer-events-none`}></div>

                <div className="flex justify-between items-start relative z-10 gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Ticket Number</span>
                    <h2 className={`text-base sm:text-lg ${colors.text} m-0 font-black tracking-tighter whitespace-nowrap`}>{ticket.number}</h2>
                  </div>
                  <span className={`${colors.text} text-[9px] font-black bg-surface px-2 py-1 rounded-md border ${colors.border} shadow-sm whitespace-nowrap`}>{ticket.service?.name || 'Unknown'}</span>
                </div>
                
                <div className="grid grid-cols-4 gap-1.5 relative z-10">
                  <HoldActionBtn 
                    onAction={() => handleRecall(ticket.id)} 
                    className={`bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex flex-col items-center justify-center py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/40 transition-colors gap-0.5 shadow-sm font-bold text-[10px]`}
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Monitor size={10}/></div>
                    Recall
                  </HoldActionBtn>

                  <HoldActionBtn 
                    onAction={() => handleStatusUpdate(ticket.id, 'COMPLETED')} 
                    className={`bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex flex-col items-center justify-center py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/40 transition-colors gap-0.5 shadow-sm font-bold text-[10px]`}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><CheckCircle size={10}/></div>
                    Done
                  </HoldActionBtn>

                  <HoldActionBtn 
                    onAction={() => handleStatusUpdate(ticket.id, 'NO_SHOW')} 
                    className={`bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl flex flex-col items-center justify-center py-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/40 transition-colors gap-0.5 shadow-sm font-bold text-[10px]`}
                  >
                    <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400"><SkipForward size={10}/></div>
                    Skip
                  </HoldActionBtn>

                  <HoldActionBtn 
                    onAction={() => handleStatusUpdate(ticket.id, 'POSTPONED')} 
                    className={`bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl flex flex-col items-center justify-center py-1.5 hover:bg-amber-100 dark:hover:bg-amber-500/40 transition-colors gap-0.5 shadow-sm font-bold text-[10px]`}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><Calendar size={10}/></div>
                    Hold
                  </HoldActionBtn>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* Bottom Section: Waiting Queues Grid */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <h3 className="mb-2 shrink-0 text-xl font-extrabold text-text-main tracking-tight m-0">Waiting Queue</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 flex-1 min-h-0 md:overflow-hidden overflow-y-auto pb-4">
          {queuesBySlot.map((slot, index) => renderQueueList(slot, slot.tickets, index))}
        </div>
      </div>

      {/* Returns Modal */}
      <ModalWrapper isOpen={showReturnsModal} zIndex={1000} bg="rgba(15,23,42,0.6)" onBackgroundClick={() => setShowReturnsModal(false)}>
        <div className="bg-surface rounded-3xl w-full max-w-[600px] max-h-[80vh] flex flex-col overflow-hidden shadow-float animate-slide-up border border-border">
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-bg-color">
            <h3 className="m-0 text-text-main text-2xl font-extrabold tracking-tight">Postponed Tickets</h3>
            <button onClick={() => setShowReturnsModal(false)} className="bg-surface border border-border w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-text-muted hover:text-text-main hover:shadow-sm transition-all">&times;</button>
          </div>
          <div className="p-8 overflow-y-auto flex-1">
            {postponedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <Calendar size={48} className="mb-4 text-slate-400" />
                <p className="text-center text-lg font-bold text-slate-500 m-0">No tickets are currently postponed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {postponedTickets.map(ticket => (
                  <div key={ticket.id} className="flex justify-between items-center p-4 bg-surface border border-warning/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-warning tracking-tight">{ticket.number}</span>
                      <div className="flex flex-col">
                        <span className="text-text-main text-sm font-bold">{ticket.service?.name || 'Unknown'}</span>
                        <span className="text-text-muted text-xs font-semibold">From {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        handleStatusUpdate(ticket.id, 'WAITING');
                        setShowReturnsModal(false);
                      }} 
                      className="bg-emerald-500 text-white border-none px-5 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/30 flex items-center gap-2"
                    >
                      <Check size={16} /> Arrived
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ModalWrapper>

      {/* Auto-Balance Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-6 right-6 z-[9999] animate-slide-up"
        >
          <div 
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-200 dark:border-amber-800'
            }`}
            onClick={() => setToastMessage(null)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' 
                : 'bg-amber-100 dark:bg-amber-900 text-amber-600'
            }`}>
              {toastMessage.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              )}
            </div>
            <div>
              <p className={`m-0 text-xs font-extrabold uppercase tracking-wider ${
                toastMessage.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
              }`}>{toastMessage.title}</p>
              <p className="m-0 text-sm font-medium text-text-main">{toastMessage.message}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


