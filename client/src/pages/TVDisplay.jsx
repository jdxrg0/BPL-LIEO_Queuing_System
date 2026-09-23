import React, { useState, useEffect, useRef } from 'react';
import { api, socket } from '../api';

export default function TVDisplay() {
  const [displayTickets, setDisplayTickets] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveWaitTimes, setLiveWaitTimes] = useState({});
  const [priorityGroups, setPriorityGroups] = useState([]);

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
      } catch (err) {
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
        api.getRecentCalled(),
        api.getLiveWaitTimes()
      ]);
      setLiveWaitTimes(waitTimes);
      
      if (tickets.length > 0) {
        const myTickets = tickets.filter(t => (t.id % totalMonitors) === (monitorIdx - 1));
        setDisplayTickets(myTickets);
      } else {
        setDisplayTickets([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchRecent(),
      api.getSettings().then(setSettings),
      api.getPriorityGroups().then(setPriorityGroups)
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
      let link = document.querySelector("link[rel~='icon']");
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
    <div className="bg-red-600 h-screen flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 px-[2vw] py-[1vh] bg-red-900 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-[2vw]">
           {settings?.logoBase64 && (
             <img src={settings.logoBase64} alt="Logo" className="h-[4vh] object-contain" />
           )}
           <h1 className="text-yellow-200 m-0 text-[4vh] tracking-[0.15em] font-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
             NOW SERVING {settings?.websiteName ? `- ${settings.websiteName.toUpperCase()}` : ''}
           </h1>
         </div>
         {totalMonitors > 1 && (
           <span className="text-red-300 text-[2vh] font-bold">Monitor {monitorIdx} of {totalMonitors}</span>
         )}
      </div>

      {/* Dynamic 2-Column Grid */}
      <div className="flex-1 p-[0.5vh] grid grid-cols-2 content-start gap-[0.5vh] overflow-hidden">
        {displayTickets.length > 0 ? (
            displayTickets.map(t => {
              // Mathematical guarantee:
              // Header = ~6vh, Grid padding = 1vh (Total static = 7vh)
              // Per row: Gap = 0.5vh, Borders = 0.8vh, Padding = 1vh (Total dynamic = ~2.3vh/row)
              // We reserve ~93vh for the content, subtract the per-row fixed vh, and divide by rows!
              const maxFontVh = Math.max(1, (93 - (2.5 * rowCount)) / rowCount);
              
              return (
                <div key={t.id} className="bg-yellow-400 rounded-[1vh] border-[0.4vh] border-solid border-red-900 flex items-center justify-between px-[1.5cqw] py-[0.5vh] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),inset_0_4px_6px_-1px_rgba(255,255,255,0.5)] w-full relative overflow-hidden"
                     style={{ containerType: 'inline-size' }}>
                  
                  {/* Priority Badge */}
                  {t.priorityType && t.priorityType !== 'REGULAR' && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white font-black px-[1cqw] py-[0.2vh] rounded-bl-[1vh] drop-shadow-md z-10 uppercase"
                         style={{ fontSize: `min(2.5cqw, ${maxFontVh * 0.3}vh)` }}>
                      {priorityGroups.find(g => g.name === t.priorityType)?.label || t.priorityType} Priority
                    </div>
                  )}

                  <div className="whitespace-nowrap overflow-hidden text-red-700 font-black drop-shadow-[2px_2px_0px_rgba(255,255,255,0.4)] leading-none relative z-0"
                       style={{ fontSize: `min(8.5cqw, ${maxFontVh}vh)` }}>
                    {t.number}
                  </div>
                  <div className="whitespace-nowrap pl-[1vw] text-red-900 font-extrabold text-right leading-none mt-[1vh] relative z-0"
                       style={{ fontSize: `min(7cqw, ${maxFontVh * 0.8}vh)` }}>
                    {t.counter.name.replace('Window ', 'W')}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="col-span-full flex items-center justify-center min-h-[50vh]">
            <h1 className="text-6xl text-red-300 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)] font-bold">Waiting for tickets...</h1>
          </div>
        )}
      </div>

      {/* Live Status Footer */}
      <div className="bg-slate-900 text-white flex items-center overflow-hidden h-[6vh] shrink-0 border-t-4 border-yellow-400">
        <div className="bg-yellow-400 text-red-900 font-black text-[2.5vh] px-[2vw] h-full flex items-center whitespace-nowrap z-10 shadow-[4px_0_10px_rgba(0,0,0,0.5)] uppercase tracking-wider">
          LIVE QUEUE STATUS
        </div>
        <div className="flex-1 whitespace-nowrap flex items-center px-[2vw] text-[2.5vh] font-bold text-slate-300 gap-[4vw] marquee-animation">
          <span className="flex items-center gap-[1vw]">
            <span className="text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded border border-emerald-400/30">New App</span>
            ~{liveWaitTimes['NW'] || 0} mins
          </span>
          <span className="flex items-center gap-[1vw]">
            <span className="text-indigo-400 bg-indigo-400/20 px-2 py-0.5 rounded border border-indigo-400/30">Renewal</span>
            ~{liveWaitTimes['RNW'] || 0} mins
          </span>
          <span className="flex items-center gap-[1vw]">
            <span className="text-rose-400 bg-rose-400/20 px-2 py-0.5 rounded border border-rose-400/30">Retirement</span>
            ~{liveWaitTimes['R'] || 0} mins
          </span>
        </div>
      </div>
    </div>
  );
}
