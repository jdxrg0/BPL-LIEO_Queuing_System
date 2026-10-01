import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, socket } from '../api';
import { getServiceSlots } from '../utils/serviceSlots';

const TV_BADGES = [
  'text-emerald-400 bg-emerald-400/20 border-emerald-400/30',
  'text-indigo-400 bg-indigo-400/20 border-indigo-400/30',
  'text-rose-400 bg-rose-400/20 border-rose-400/30'
];

export default function TVDisplay() {
  const [displayTickets, setDisplayTickets] = useState<any[]>([]);
  const [waitingTickets, setWaitingTickets] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveWaitTimes, setLiveWaitTimes] = useState({});
  const [priorityGroups, setPriorityGroups] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const serviceSlots = useMemo(() => getServiceSlots(services), [services]);

  // Parse Multi-Monitor URL Parameters
  const searchParams = new URLSearchParams(window.location.search);
  const monitorIdx = parseInt(searchParams.get('m') || '1', 10);
  const totalMonitors = parseInt(searchParams.get('t') || '1', 10);

  useEffect(() => {
    const handleStart = async () => {
      if (isStarted) return;
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err: any) {
        console.warn("Fullscreen request failed", err);
      }
      setIsStarted(true);
      // Initialize speech synthesis so it doesn't get blocked later
      const silence = new SpeechSynthesisUtterance('');
      speechSynthesis.speak(silence);

      // Notify the opener that fullscreen started
      const bc = new BroadcastChannel('tv_display');
      bc.postMessage('fullscreen_started');
      bc.close();
    };

    if (!isStarted) {
      window.addEventListener('keydown', handleStart);
      window.addEventListener('click', handleStart);
    }

    return () => {
      window.removeEventListener('keydown', handleStart);
      window.removeEventListener('click', handleStart);
    };
  }, [isStarted]);

  const fetchRecent = async () => {
    try {
      const [tickets, waitTimes] = await Promise.all([
        api.getDisplayTickets(),
        api.getLiveWaitTimes()
      ]);
      setLiveWaitTimes(waitTimes && typeof waitTimes === 'object' ? waitTimes : {});
      
      if (Array.isArray(tickets) && tickets.length > 0) {
        const serving = tickets.filter(t => t.status === 'SERVING');
        const myTickets = serving.filter(t => (t.id % totalMonitors) === (monitorIdx - 1));
        setDisplayTickets(myTickets);

        // Get waiting tickets, sorted by the backend's Smart Queue Engine
        const waiting = tickets.filter(t => t.status === 'WAITING');
        
        // Also split waiting tickets across monitors if there are multiple monitors
        // Or we could show all on all monitors, but showing them all on monitor 1 is safest. 
        // For now, let's just show the global waiting list, as "next in line" doesn't strictly belong to a specific monitor.
        setWaitingTickets(waiting);
      } else {
        setDisplayTickets([]);
        setWaitingTickets([]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchRecent(),
      api.getSettings().then(setSettings),
      api.getPriorityGroups().then(setPriorityGroups),
      api.getServices().then(setServices)
    ])
    .catch(console.error)
    .finally(() => setIsLoading(false));

    socket.on('ticketCalled', (ticket) => {
      // Play Audio (ONLY if this is Monitor 1 to prevent overlapping echos)
      if (isStarted && monitorIdx === 1) {
        const utterance = new SpeechSynthesisUtterance(`Now serving ticket number ${ticket.number} at ${ticket.counter.name}`);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }

      // Update UI
      fetchRecent();
    });

    socket.on('queueUpdated', () => {
      fetchRecent();
    });

    socket.on('settingsUpdated', setSettings);
    socket.on('priorityGroupsUpdated', () => {
      api.getPriorityGroups().then(setPriorityGroups).catch(console.error);
    });

    return () => {
      socket.off('ticketCalled');
      socket.off('queueUpdated');
      socket.off('settingsUpdated');
      socket.off('priorityGroupsUpdated');
    };
  }, [monitorIdx, isStarted, totalMonitors]);

  useEffect(() => {
    if (settings?.logoBase64) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.logoBase64;
    }
    if (settings?.websiteName) {
      document.title = `${settings.websiteName} | Display`;
    }
  }, [settings?.logoBase64, settings?.websiteName]);

  if (!isStarted) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-center p-8">
        <div className="bg-slate-800 border-2 border-blue-500 py-12 px-16 rounded-2xl shadow-[0_10px_25px_rgba(59,130,246,0.2)]">
          <h1 className="text-white text-4xl m-0 mb-4 font-bold">TV Display Ready {totalMonitors > 1 ? `(Monitor ${monitorIdx} of ${totalMonitors})` : ''}</h1>
          <p className="text-slate-400 text-xl mb-8">The browser requires permission to go Fullscreen and play Audio.</p>
          <div className="inline-block bg-blue-500 text-white py-4 px-12 text-2xl rounded-lg font-bold animate-pulse cursor-pointer">
            Press the SPACEBAR on your keyboard
          </div>
          <p className="text-slate-500 text-base mt-6">(or click anywhere on this screen)</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-400">
         <h2 className="text-2xl font-bold">Loading Display...</h2>
      </div>
    );
  }

  const rowCount = Math.max(1, Math.ceil(displayTickets.length / 2));

  return (
    <div className="bg-bg-color h-screen flex flex-col overflow-hidden text-text-main">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 px-[2vw] py-[1vh] bg-surface border-b-4 border-primary shadow-md flex justify-between items-center shrink-0">
         <div className="flex items-center gap-[2vw]">
           {settings?.logoBase64 && (
             <img src={settings.logoBase64} alt="Logo" className="h-[4vh] object-contain" />
           )}
           <h1 className="text-text-main m-0 text-[4vh] tracking-[0.15em] font-black drop-shadow-sm uppercase">
             NOW SERVING {settings?.websiteName ? `- ${settings.websiteName}` : ''}
           </h1>
         </div>
         {totalMonitors > 1 && (
           <span className="text-text-muted text-[2vh] font-bold">Monitor {monitorIdx} of {totalMonitors}</span>
         )}
      </div>

      {/* Main Content Split: Serving vs Next in Line */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic 2-Column Grid for SERVING */}
        <div className="w-2/3 p-[0.5vh] grid grid-cols-2 content-start gap-[0.5vh] overflow-hidden bg-bg-color border-r-4 border-border">
          {displayTickets.length > 0 ? (
              displayTickets.map(t => {
                const maxFontVh = Math.max(1, (93 - (2.5 * rowCount)) / rowCount);
                
                return (
                  <div key={t.id} className="bg-surface rounded-[1vh] border-[0.4vh] border-solid border-border flex items-center justify-between px-[1.5cqw] py-[0.5vh] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] w-full relative overflow-hidden"
                       style={{ containerType: 'inline-size' }}>
                    
                    {/* Priority Badge */}
                    {t.priorityType && t.priorityType !== 'REGULAR' && (
                      <div className="absolute top-0 right-0 bg-primary text-white font-black px-[1cqw] py-[0.2vh] rounded-bl-[1vh] drop-shadow-sm z-10 uppercase"
                           style={{ fontSize: `min(2.5cqw, ${maxFontVh * 0.3}vh)` }}>
                        {priorityGroups.find(g => g.name === t.priorityType)?.label || t.priorityType} Priority
                      </div>
                    )}

                    <div className="whitespace-nowrap overflow-hidden text-primary font-black drop-shadow-sm leading-none relative z-0"
                         style={{ fontSize: `min(8.5cqw, ${maxFontVh}vh)` }}>
                      {t.number}
                    </div>
                    <div className="flex flex-col items-end relative z-0 mt-[1vh]">
                      <div className="whitespace-nowrap pl-[1vw] text-text-muted font-extrabold text-right leading-none"
                           style={{ fontSize: `min(7cqw, ${maxFontVh * 0.7}vh)` }}>
                        {t.counter?.name ? t.counter.name.replace('Window ', 'W') : '---'}
                      </div>
                      {t.estimatedWaitMins !== undefined && (
                        <div className="whitespace-nowrap text-indigo-400 font-bold tracking-wider mt-[1vh]"
                             style={{ fontSize: `min(3cqw, ${maxFontVh * 0.25}vh)` }}>
                          EST. WAIT: ~{t.estimatedWaitMins}m
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="col-span-full flex items-center justify-center min-h-[50vh]">
              <h1 className="text-6xl text-text-muted drop-shadow-sm font-bold opacity-50">No Active Queue</h1>
            </div>
          )}
        </div>

        {/* Next in Line Panel (WAITING) */}
        <div className="w-1/3 bg-surface flex flex-col overflow-hidden">
          <div className="bg-slate-200 dark:bg-slate-800 text-center py-[1vh] font-black text-[3vh] text-text-main border-b-2 border-border shadow-sm tracking-wider uppercase shrink-0">
             Next In Line
          </div>
          <div className="flex-1 p-[1vh] overflow-y-auto flex flex-col gap-[1vh] min-h-0">
             {waitingTickets.slice(0, 10).map((t, idx) => (
                <div key={t.id} className="bg-bg-color rounded-lg border-2 border-border p-[1vh] flex items-center justify-between shadow-sm flex-shrink-0">
                   <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-[3vh] leading-none text-text-main truncate">{t.number}</span>
                      <span className="text-[1.5vh] font-bold text-text-muted mt-1 uppercase truncate">{t.service?.name || t.serviceType}</span>
                   </div>
                   <div className="flex flex-col items-end whitespace-nowrap pl-2">
                      <span className="text-[2.5vh] font-black text-primary">
                        {t.estimatedWaitMins !== null && t.estimatedWaitMins !== undefined ? `~${t.estimatedWaitMins}m` : 'TBD'}
                      </span>
                      <span className="text-[1.2vh] text-text-muted font-bold uppercase tracking-wider">Est. Wait</span>
                   </div>
                </div>
             ))}
             {waitingTickets.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-text-muted font-bold text-[2.5vh] text-center p-4">
                   No tickets in queue
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Live Status Footer */}
      <div className="bg-surface text-text-main flex items-center overflow-hidden h-[6vh] shrink-0 border-t-2 border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="bg-primary text-white font-black text-[2.5vh] px-[2vw] h-full flex items-center whitespace-nowrap z-10 shadow-md uppercase tracking-wider">
          LIVE QUEUE STATUS
        </div>
        <div className="flex-1 whitespace-nowrap flex items-center px-[2vw] text-[2.5vh] font-bold text-text-muted gap-[4vw] marquee-animation">
          {serviceSlots.map((slot, index) => (
            <span key={slot.service.id} className="flex items-center gap-[1vw]">
              <span className={`px-2 py-0.5 rounded border ${TV_BADGES[index]}`}>{slot.service.name}</span>
              {liveWaitTimes[slot.service.prefix] != null
                ? `~${liveWaitTimes[slot.service.prefix]} mins`
                : 'No staff on duty'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
