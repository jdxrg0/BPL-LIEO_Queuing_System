import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { Search, MonitorPlay, Users, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { socket } from '../api';

const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MobileTracker = () => {
  const [servingTickets, setServingTickets] = useState([]);
  const [searchTicket, setSearchTicket] = useState('');
  const [myTicketResult, setMyTicketResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [websiteName, setWebsiteName] = useState('BPLO');
  const [services, setServices] = useState([]);
  const [selectedServicePrefix, setSelectedServicePrefix] = useState('');
  const [ticketDate, setTicketDate] = useState(getLocalDateString(new Date()));
  const [dateMode, setDateMode] = useState('today');
  const [ticketNumberInput, setTicketNumberInput] = useState('');
  const [error, setError] = useState(null);
  const [flashingTicketId, setFlashingTicketId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const unsubscribeSearchRef = useRef(null);
  const unsubscribeWaitQRef = useRef(null);
  const isInitialLoad = useRef(true);
  const flashTimeoutRef = useRef(null);
  const myTicketResultRef = useRef(null);
  
  useEffect(() => {
    myTicketResultRef.current = myTicketResult;
  }, [myTicketResult]);

  const audioCtxRef = useRef(null);

  // Unlock AudioContext on first interaction (required by mobile browsers)
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setSoundEnabled(true);
      soundEnabledRef.current = true;
      // Remove listeners after first interaction
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Gentle beep for notifications
  const playBeep = () => {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) return;
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume(); // Try to resume if it was suspended again
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) { console.error('Audio play failed:', e); }
  };

  const triggerFlash = (id) => {
    setFlashingTicketId(id);
    playBeep();
    if (soundEnabledRef.current && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    
    flashTimeoutRef.current = setTimeout(() => {
      setFlashingTicketId(null);
      flashTimeoutRef.current = null;
    }, 4000);
  };

  // Fetch branding: try local API first (LAN), fall back to Firebase (Vercel)
  useEffect(() => {
    const setFavicon = (logoBase64) => {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = logoBase64;
    };

    const fetchBranding = async () => {
      // Try local API first (works on LAN)
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.logoBase64) setFavicon(data.logoBase64);
          if (data.websiteName) {
            document.title = `${data.websiteName} | Ticket Tracker`;
            setWebsiteName(data.websiteName);
          }
          if (data.services && data.services.length > 0) {
            setServices(data.services);
            if (!selectedServicePrefix) setSelectedServicePrefix(data.services[0].prefix);
          }
          return; // Success — no need to hit Firebase
        }
      } catch (_) { /* Local API unreachable (Vercel) — fall through to Firebase */ }

      // Fall back to Firebase (works on Vercel)
      try {
        const settingsDoc = await getDoc(doc(db, 'live_tickets', 'app_settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.logoBase64) setFavicon(data.logoBase64);
          if (data.websiteName) {
            document.title = `${data.websiteName} | Ticket Tracker`;
            setWebsiteName(data.websiteName);
          }
          if (data.services && data.services.length > 0) {
            setServices(data.services);
            if (!selectedServicePrefix) setSelectedServicePrefix(data.services[0].prefix);
          }
        }
      } catch (err) {
        console.warn('Could not fetch branding:', err.message);
      }
    };
    fetchBranding();
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = query(collection(db, 'live_tickets'), where('status', '==', 'SERVING'));
      
      // Primary: Real-time listener (instant when WebSocket is alive)
      unsubscribe = onSnapshot(q, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tickets.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setServingTickets(tickets);
        setLoading(false);

        if (!isInitialLoad.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const currentSearched = myTicketResultRef.current;
              if (currentSearched && currentSearched.id === change.doc.id) {
                triggerFlash(change.doc.id);
              }
            }
          });
        }
        isInitialLoad.current = false;
      }, (err) => {
        console.error("Firebase error:", err);
        // Don't show error — polling fallback will handle it
        setLoading(false);
      });

    } catch (err) {
      console.warn("Firebase not fully configured yet.");
      setLoading(false);
    }

    // --- POLLING FALLBACK (for Vercel / public internet) ---
    // Firebase onSnapshot can silently lose its WebSocket connection.
    // This guarantees the tracker updates every 5 seconds no matter what.
    const pollInterval = setInterval(async () => {
      try {
        const q = query(collection(db, 'live_tickets'), where('status', '==', 'SERVING'));
        const snapshot = await getDocs(q);
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tickets.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setServingTickets(tickets);
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 5000);

    // --- INSTANT LAN FAST-PATH ---
    // If the phone is on the same Wi-Fi as the server, Socket.io
    // delivers the update instantly, bypassing any internet delay.
    const handleTicketCalled = (ticket) => {
      setServingTickets(prev => {
        const filtered = prev.filter(t => t.id !== ticket.id);
        return [ticket, ...filtered];
      });
      
      const currentSearched = myTicketResultRef.current;
      if (currentSearched && currentSearched.number === ticket.number) {
        setMyTicketResult(prev => {
          if (prev && prev.number === ticket.number) {
            return { ...prev, status: 'SERVING', counterId: ticket.counterId };
          }
          return prev;
        });
        triggerFlash(ticket.id.toString());
      }
    };

    socket.on('ticketCalled', handleTicketCalled);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      socket.off('ticketCalled', handleTicketCalled);
      if (unsubscribeSearchRef.current) unsubscribeSearchRef.current();
      if (unsubscribeWaitQRef.current) unsubscribeWaitQRef.current();
    };
  }, []);

  // Keep search result in sync with serving tickets
  // This ensures that if Firebase or Polling detects the ticket is now serving,
  // the search result card updates automatically (not just the LAN fast-path).
  useEffect(() => {
    if (myTicketResult && myTicketResult.status !== 'SERVING') {
      const isNowServing = servingTickets.find(t => t.number === myTicketResult.number);
      if (isNowServing) {
        setMyTicketResult(prev => ({ 
          ...prev, 
          status: 'SERVING', 
          counterId: isNowServing.counterId 
        }));
        triggerFlash(isNowServing.id.toString());
      }
    }
  }, [servingTickets, myTicketResult]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketNumberInput.trim() || !selectedServicePrefix || !ticketDate) return;
    
    const parts = ticketDate.split('-');
    if (parts.length !== 3) return;
    const dateStr = parts[1] + parts[2] + parts[0].slice(-2);
    const fullTicketNumber = `${selectedServicePrefix}-${dateStr}-${ticketNumberInput.padStart(3, '0')}`;
    
    setIsSearching(true);
    setMyTicketResult(null);

    if (unsubscribeSearchRef.current) unsubscribeSearchRef.current();
    if (unsubscribeWaitQRef.current) unsubscribeWaitQRef.current();

    try {
      const q = query(collection(db, 'live_tickets'), where('number', '==', fullTicketNumber));
      
      unsubscribeSearchRef.current = onSnapshot(q, (querySnapshot) => {
        setIsSearching(false);
        
        if (querySnapshot.empty) {
          // If the ticket was previously found but is now missing from live_tickets,
          // it means the transaction was completed, deleted, or postponed.
          setMyTicketResult(prev => {
            if (prev && (prev.status === 'SERVING' || prev.status === 'WAITING')) {
              return { ...prev, status: 'COMPLETED', peopleAhead: 0 };
            }
            return { error: 'Ticket not found in live queue.' };
          });
          
          if (unsubscribeWaitQRef.current) {
            unsubscribeWaitQRef.current();
            unsubscribeWaitQRef.current = null;
          }
        } else {
          const docSnap = querySnapshot.docs[0];
          const t = { id: docSnap.id, ...docSnap.data() };
          
          if (t.status === 'WAITING') {
            // Subscribe to the WAITING queue to dynamically calculate people ahead
            if (!unsubscribeWaitQRef.current) {
              const waitQ = query(collection(db, 'live_tickets'), where('status', '==', 'WAITING'), where('serviceId', '==', t.serviceId));
              unsubscribeWaitQRef.current = onSnapshot(waitQ, (waitSnap) => {
                const waitingList = waitSnap.docs.map(d => d.data());
                waitingList.sort((a, b) => (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0));
                const myIndex = waitingList.findIndex(item => item.number === t.number);
                
                setMyTicketResult(prev => {
                  if (prev && prev.number === t.number && prev.status === 'WAITING') {
                    return { ...prev, peopleAhead: myIndex > 0 ? myIndex : 0 };
                  }
                  return prev;
                });
              });
            }
            // Temporarily set peopleAhead to 0 until the waitQ snapshot fires
            setMyTicketResult(prev => ({ ...t, peopleAhead: prev?.peopleAhead || 0 }));
          } else {
            // Ticket is SERVING or other status
            if (unsubscribeWaitQRef.current) {
              unsubscribeWaitQRef.current();
              unsubscribeWaitQRef.current = null;
            }
            setMyTicketResult(prev => {
              // Trigger the animation if the ticket transitioned from WAITING to SERVING
              if (prev && prev.status === 'WAITING' && t.status === 'SERVING') {
                triggerFlash(t.id.toString());
              }
              // Trigger the animation if the ticket was ALREADY SERVING but got recalled (updatedAt changed)
              else if (prev && prev.status === 'SERVING' && t.status === 'SERVING') {
                const prevSeconds = prev.updatedAt?.seconds || 0;
                const prevNanos = prev.updatedAt?.nanoseconds || 0;
                const newSeconds = t.updatedAt?.seconds || 0;
                const newNanos = t.updatedAt?.nanoseconds || 0;
                
                // If the timestamp is strictly newer (using seconds and nanoseconds), it was recalled by the admin
                if (prevSeconds > 0 && (newSeconds > prevSeconds || (newSeconds === prevSeconds && newNanos > prevNanos))) {
                  triggerFlash(t.id.toString());
                }
              }
              return t;
            });
          }
        }
      }, (err) => {
        console.error(err);
        setMyTicketResult({ error: 'Search failed.' });
        setIsSearching(false);
      });
      
    } catch (err) {
      console.error(err);
      setMyTicketResult({ error: 'Search failed.' });
      setIsSearching(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'PWD') return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400';
    if (priority === 'SENIOR') return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400';
    return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted bg-bg-color">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-rose-500 font-bold bg-bg-color">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-bg-color text-text-main p-4 md:p-6 font-sans w-full overflow-x-hidden box-border">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 pt-4 pb-10">
        
        {/* Simple Header */}
        <div className="text-center px-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight m-0 text-text-main">
            {websiteName} Ticket Tracker
          </h1>
          <p className="text-sm text-text-muted mt-1 m-0">
            Check your queue status
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col gap-6 w-full px-1 box-border">
          <div className="flex flex-col gap-2 mb-2">
            <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-1 mb-1">
              Step 1: Select Transaction
            </label>
            <div className="flex flex-col gap-2">
              {services.length === 0 ? (
                <div className="text-sm text-text-muted px-2 py-3">Loading transactions...</div>
              ) : (
                services.map(s => (
                  <button
                    key={s.prefix}
                    type="button"
                    onClick={() => setSelectedServicePrefix(s.prefix)}
                    className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all shadow-sm text-left ${selectedServicePrefix === s.prefix ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50' : 'bg-surface text-text-muted border-border hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {s.name} <span className="font-normal opacity-70 ml-1">({s.prefix})</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-1">
              Step 2: Date on Ticket
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                onClick={() => {
                  const y = new Date(); y.setDate(y.getDate() - 1);
                  setTicketDate(getLocalDateString(y));
                  setDateMode('yesterday');
                }}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm ${dateMode === 'yesterday' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50' : 'bg-surface text-text-muted border-border hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                Yesterday
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setTicketDate(getLocalDateString(new Date()));
                  setDateMode('today');
                }}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm ${dateMode === 'today' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50' : 'bg-surface text-text-muted border-border hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                Today
              </button>
              <button 
                type="button" 
                onClick={() => setDateMode('custom')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border text-sm font-bold whitespace-nowrap transition-all shadow-sm ${dateMode === 'custom' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50' : 'bg-surface text-text-muted border-border hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                Custom
              </button>
              
              <AnimatePresence initial={false}>
                {dateMode === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ opacity: { duration: 0.2 }, height: { duration: 0.3, ease: 'easeInOut' } }}
                    className="w-full sm:w-auto overflow-hidden"
                  >
                    <div className="pt-2 sm:pt-0 sm:pl-2">
                      <input
                        type="date"
                        value={ticketDate}
                        onChange={(e) => setTicketDate(e.target.value)}
                        className="w-full sm:w-auto bg-surface border border-border rounded-xl px-4 py-2 text-text-main text-sm font-bold outline-none focus:border-indigo-500 transition-colors shadow-sm"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-1">
              Step 3: Enter 3-Digit Ticket Number
            </label>
            <div className="flex gap-2 w-full">
              <div className="flex-1 flex items-center bg-surface border border-border rounded-xl px-4 text-text-main font-bold shadow-sm focus-within:border-indigo-500 transition-colors">
                <span className="text-slate-400 select-none mr-2 text-sm font-black">N.O.</span>
                <input 
                  type="number" 
                  className="w-full bg-transparent outline-none py-3 font-black text-lg"
                  placeholder="e.g. 001" 
                  min="1"
                  max="999"
                  value={ticketNumberInput}
                  onChange={(e) => setTicketNumberInput(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-bold disabled:opacity-50 transition-colors flex items-center justify-center shadow-sm shrink-0"
                disabled={isSearching || !ticketNumberInput.trim() || !selectedServicePrefix}
              >
                {isSearching ? <span className="animate-spin text-lg">↻</span> : <Search size={22}/>}
              </button>
            </div>
          </div>
        </form>

        {/* Search Result */}
        {myTicketResult && (
          <div className="animate-slide-up w-full px-1 box-border">
            {myTicketResult.error ? (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 p-4 rounded-xl text-center font-bold text-sm border border-rose-200 dark:border-rose-500/20">
                {myTicketResult.error}
              </div>
            ) : (
              <motion.div 
                layout="position"
                initial={{ opacity: 0, y: 15 }}
                animate={
                  flashingTicketId === myTicketResult.id?.toString()
                    ? { opacity: 1, y: -10, scale: 1.02, zIndex: 50 }
                    : { opacity: 1, y: 0, scale: 1, zIndex: 1 }
                }
                transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
                className={`p-4 rounded-xl border flex flex-col items-center text-center w-full transition-colors duration-300 relative ${
                  flashingTicketId === myTicketResult.id?.toString() ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 ring-4 ring-emerald-400/50 shadow-lg' :
                  myTicketResult.status === 'SERVING' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-sm' 
                    : 'bg-surface border-border shadow-sm'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mb-2 ${getPriorityColor(myTicketResult.priorityType)}`}>
                  {myTicketResult.priorityType || 'REGULAR'}
                </span>
                
                <h2 className="text-2xl font-black tracking-tighter m-0 mb-1 text-text-main">
                  {myTicketResult.number}
                </h2>
                
                <p className={`text-sm font-extrabold uppercase tracking-widest m-0 mb-4 ${
                  myTicketResult.status === 'SERVING' ? 'text-emerald-600 dark:text-emerald-400' : 
                  myTicketResult.status === 'COMPLETED' ? 'text-slate-500' : 
                  myTicketResult.status === 'NO_SHOW' ? 'text-rose-600 dark:text-rose-400' :
                  myTicketResult.status === 'POSTPONED' ? 'text-orange-500' :
                  'text-amber-500'
                }`}>
                  {myTicketResult.status === 'COMPLETED' ? 'TRANSACTION FINISHED' : 
                   myTicketResult.status === 'NO_SHOW' ? 'NO SHOW' :
                   myTicketResult.status === 'POSTPONED' ? 'ON HOLD' :
                   myTicketResult.status}
                </p>
                
                {myTicketResult.status === 'WAITING' && (
                  <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                    <Users size={16} /> {myTicketResult.peopleAhead} people ahead
                  </div>
                )}
                
                {myTicketResult.status === 'SERVING' && (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-emerald-950/50 px-4 py-2 rounded-lg shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                    <MonitorPlay size={18} /> Go to Counter {myTicketResult.counterId}
                  </div>
                )}

                {myTicketResult.status === 'COMPLETED' && (
                  <div className="text-sm text-text-muted mt-2">
                    This transaction has been successfully completed.
                  </div>
                )}

                {myTicketResult.status === 'NO_SHOW' && (
                  <div className="text-sm text-text-muted mt-2 px-4 text-center">
                    You missed your turn. Please proceed to the receptionist for assistance or generate a new ticket.
                  </div>
                )}

                {myTicketResult.status === 'POSTPONED' && (
                  <div className="text-sm text-text-muted mt-2 px-4 text-center">
                    Your transaction was put on hold. Please wait for further instructions from the staff.
                  </div>
                )}
                </motion.div>
              )}
          </div>
        )}

        {/* Currently Serving Simple List */}
        <div className="mt-4 w-full px-1 box-border">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
            <MonitorPlay size={16} /> Now Serving
          </h3>
          
          {servingTickets.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-border rounded-xl text-text-muted text-sm bg-surface/50">
              No tickets currently serving.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {servingTickets.map((ticket) => (
                  <motion.div 
                    layout="position"
                    initial={{ opacity: 0, y: 15 }}
                    animate={
                      flashingTicketId === ticket.id?.toString()
                        ? { opacity: 1, y: -10, scale: 1.02, zIndex: 50 }
                        : { opacity: 1, y: 0, scale: 1, zIndex: 1 }
                    }
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
                    key={ticket.id} 
                    className={`border rounded-lg p-2 px-3 flex justify-between items-center w-full transition-colors duration-300 relative ${
                      flashingTicketId === ticket.id?.toString() ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 ring-2 ring-emerald-400/50 shadow-lg' : 'bg-surface border-border shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black m-0 text-text-main">
                          {ticket.number}
                        </h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priorityType)}`}>
                          {ticket.priorityType || 'REG'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest m-0 mb-0.5">Window</p>
                      <div className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 w-6 h-6 rounded-md flex items-center justify-center font-black text-sm shadow-sm">
                        {ticket.counterId || '?'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

      {/* Floating Sound Toggle Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtxRef.current = new AudioContext();
          }
          
          const ctx = audioCtxRef.current;
          if (ctx) {
            if (ctx.state === 'suspended') {
              ctx.resume();
            }
            // Play a silent sound to permanently unlock audio on strict mobile browsers (Vercel deployment)
            try {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              gain.gain.value = 0; // completely silent
              osc.start();
              osc.stop(ctx.currentTime + 0.1);
            } catch (err) {
              console.warn("Could not unlock audio:", err);
            }
          }
          
          const newState = !soundEnabled;
          setSoundEnabled(newState);
          soundEnabledRef.current = newState;
        }}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          soundEnabled 
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
            : 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
        }`}
        aria-label="Toggle Sound"
      >
        {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </div>
  );
}

export default MobileTracker;
