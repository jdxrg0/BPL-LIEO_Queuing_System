import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, socket } from '../api';
import { Trash2, CheckCircle, SkipForward, Calendar, Check, Undo2, Monitor } from 'lucide-react';
import HoldActionBtn from '../components/Buttons/HoldActionBtn';
import HoldButton from '../components/Buttons/HoldButton';
import HoldTextButton from '../components/Buttons/HoldTextButton';
import ModalWrapper from '../components/Modals/ModalWrapper';

export default function StaffDashboard({ user }) {
  const [services, setServices] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentServingList, setCurrentServingList] = useState([]);
  const [postponedTickets, setPostponedTickets] = useState([]);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Translate vertical scrolling to horizontal scrolling
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

  const fetchInitialData = async () => {
    try {
      const [servicesData, queueData, servingData, postponedData] = await Promise.all([
        api.getServices(),
        api.getWaitingQueue(),
        api.getMyServing(user.id),
        api.getPostponedTickets()
      ]);
      setServices(servicesData);
      setQueue(queueData);
      setCurrentServingList(servingData);
      setPostponedTickets(postponedData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRef = useRef(fetchInitialData);
  useEffect(() => {
    fetchRef.current = fetchInitialData;
  }, [fetchInitialData]);

  useEffect(() => {
    fetchRef.current();
    
    let debounceTimer;
    const handleUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchRef.current();
      }, 500);
    };

    const handleCaterConfigUpdated = (maxPrefix) => {
      let serviceName = "All Services";
      if (maxPrefix === 'NW') serviceName = "New Applications";
      if (maxPrefix === 'RNW') serviceName = "Renewals";
      if (maxPrefix === 'R') serviceName = "Retirements";
      
      setPopupMessage({
        title: "System Alert",
        message: `High traffic detected. You are now prioritizing ${serviceName}.`,
        type: 'info'
      });
    };

    socket.on('queueUpdated', handleUpdate);
    socket.on('ticketCreated', handleUpdate);
    socket.on('ticketDeleted', handleUpdate);
    socket.on('caterConfigUpdated', handleCaterConfigUpdated);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('queueUpdated', handleUpdate);
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketDeleted', handleUpdate);
      socket.off('caterConfigUpdated', handleCaterConfigUpdated);
    };
  }, []);

  const handleDeleteTicket = async (id) => {
    try {
      await api.deleteTicket(id);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleCallNext = async (ticketId) => {
    if (!activeCounterId) return alert('You are not assigned to a window. Contact an Admin.');
    try {
      await api.callTicket(ticketId, activeCounterId, user.id);
      fetchInitialData(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecall = (ticketId) => {
    if (activeCounterId) {
      api.callTicket(ticketId, activeCounterId, user.id);
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      await api.updateStatus(ticketId, status);
      setCurrentServingList(prev => prev.filter(t => t.id !== ticketId));
      fetchInitialData(); 
    } catch (err) {
      console.error(err);
    }
  };

  const newAppQueue = useMemo(() => queue.filter(t => t.service.name === 'New Application'), [queue]);
  const renewalQueue = useMemo(() => queue.filter(t => t.service.name === 'Renewal'), [queue]);
  const retirementQueue = useMemo(() => queue.filter(t => t.service.name === 'Retirement'), [queue]);

  const renderQueueList = (title, filteredQueue, themeColors) => {
    
    let isCatered = false;
    if (user) {
      const lower = title.toLowerCase();
      if (lower.includes('renew') && user.caterRenewal) isCatered = true;
      if (lower.includes('new') && !lower.includes('renew') && user.caterNew) isCatered = true;
      if (lower.includes('retire') && user.caterRetirement) isCatered = true;
    }
    
    return (
      <div className={`flex-1 min-h-0 flex flex-col p-3 bg-surface border ${themeColors.border} rounded-2xl shadow-sm transition-all duration-300 ${isCatered ? 'opacity-100 hover:shadow-md' : 'opacity-50 grayscale'}`}>
        <div className="flex justify-between items-center mb-2">
          <h4 className={`${themeColors.text} m-0 text-base font-bold tracking-tight`}>{title}</h4>
          <span className={`bg-surface ${themeColors.text} px-2 py-0.5 rounded-md text-xs font-extrabold border ${themeColors.border} shadow-sm`}>
            {filteredQueue.length}
          </span>
        </div>

        {filteredQueue.length === 0 ? (
          <div className={`flex-1 flex items-center justify-center rounded-xl border border-dashed ${themeColors.border} bg-bg-color`}>
             <p className={`${themeColors.text} opacity-50 text-center text-xs font-semibold m-0`}>No tickets</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 relative">
            {filteredQueue.map((ticket, index) => (
              <div 
                key={ticket.id} 
                className={`flex justify-between items-center p-2 bg-surface rounded-xl border ${themeColors.border} shrink-0 gap-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-slide-up`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-black tracking-tight ${themeColors.text}`}>{ticket.number}</span>
                  {ticket.priorityType && ticket.priorityType !== 'REGULAR' && (
                    <span title={`Priority: ${ticket.priorityType}`} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] px-2.5 py-1 rounded-md font-black tracking-widest shadow-md border border-orange-400 uppercase">
                      {ticket.priorityType} Priority
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
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden max-w-[1600px] mx-auto">
      
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
        </div>
        
        <div ref={scrollContainerRef} className="flex overflow-x-auto pb-2 gap-3">
          {currentServingList.length === 0 ? (
             <div className="w-full bg-surface border border-border rounded-3xl p-8 flex items-center justify-center shadow-soft">
               <p className="text-text-muted m-0 text-lg font-medium text-center">No ticket currently serving. Call the next from the queue.</p>
             </div>
          ) : (
            currentServingList.map((ticket, i) => {
              const colors = (() => {
                switch(ticket.service.prefix) {
                  case 'NW': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', grad: 'from-emerald-500 to-emerald-600' };
                  case 'RNW': return { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400', grad: 'from-indigo-500 to-violet-600' };
                  case 'R': return { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-rose-700 dark:text-rose-400', grad: 'from-rose-500 to-red-600' };
                  default: return { bg: 'bg-bg-color dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20', text: 'text-slate-700 dark:text-slate-400', grad: 'from-slate-500 to-slate-600' };
                }
              })();
              
              return (
              <div key={ticket.id} className={`flex-1 min-w-[280px] max-w-[340px] bg-surface border ${colors.border} rounded-2xl p-3 shadow-sm flex flex-col gap-3 animate-slide-up hover:shadow-md transition-all relative overflow-hidden`} style={{ animationDelay: `${i*0.1}s` }}>
                
                {/* Decorative background blur */}
                <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${colors.grad} opacity-10 blur-xl rounded-full pointer-events-none`}></div>

                <div className="flex justify-between items-start relative z-10 gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Ticket Number</span>
                    <h2 className={`text-base sm:text-lg ${colors.text} m-0 font-black tracking-tighter whitespace-nowrap`}>{ticket.number}</h2>
                  </div>
                  <span className={`${colors.text} text-[9px] font-black bg-surface px-2 py-1 rounded-md border ${colors.border} shadow-sm whitespace-nowrap`}>{ticket.service.name}</span>
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
        
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 flex-1 min-h-0">
          {renderQueueList('New Application', newAppQueue, { text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20', bgFill: '#059669' })}
          {renderQueueList('Renewal', renewalQueue, { text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20', bgFill: '#4f46e5' })}
          {renderQueueList('Retirement', retirementQueue, { text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/20', bgFill: '#e11d48' })}
        </div>
      </div>

      {/* Returns Modal */}
      <ModalWrapper isOpen={showReturnsModal} zIndex={1000} bg="rgba(15,23,42,0.6)">
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
                        <span className="text-text-main text-sm font-bold">{ticket.service.name}</span>
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

      {/* Global Message Popup Window */}
      <ModalWrapper isOpen={!!popupMessage} zIndex={9999} bg="rgba(15,23,42,0.6)">
        {() => (
          <div className={`bg-surface rounded-3xl w-[360px] p-8 text-center border border-border shadow-float animate-slide-up relative overflow-hidden`}>
            
            <div className={`absolute top-0 left-0 w-full h-2 bg-indigo-500`}></div>
            
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-black bg-indigo-50 text-indigo-500 border border-indigo-100`}>
              i
            </div>
            
            <h3 className="m-0 mb-3 text-text-main font-extrabold text-xl tracking-tight">{popupMessage.title}</h3>
            <p className="m-0 mb-8 text-text-muted text-sm font-medium leading-relaxed">{popupMessage.message}</p>
            
            <button 
              onClick={() => setPopupMessage(null)} 
              className="w-full p-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer text-base shadow-md shadow-indigo-600/30"
            >
              Acknowledge
            </button>
          </div>
        )}
      </ModalWrapper>

    </div>
  );
}
