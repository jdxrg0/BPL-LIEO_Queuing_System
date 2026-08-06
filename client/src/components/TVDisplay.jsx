import React, { useState, useEffect, useRef } from 'react';
import { api, socket } from '../api';

export default function TVDisplay() {
  const [displayTickets, setDisplayTickets] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const tickets = await api.getRecentCalled();
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
      api.getSettings().then(setSettings)
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

    return () => {
      socket.off('ticketCalled');
      socket.off('queueUpdated');
      socket.off('settingsUpdated');
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
      document.title = settings.websiteName;
    }
  }, [settings?.logoBase64, settings?.websiteName]);

  if (!isStarted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', textAlign: 'center', padding: '2rem' }}>
        <div style={{ background: '#1e293b', border: '2px solid #3b82f6', padding: '3rem 4rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)' }}>
          <h1 style={{ color: 'white', fontSize: '2.5rem', margin: '0 0 1rem 0' }}>TV Display Ready {totalMonitors > 1 ? `(Monitor ${monitorIdx} of ${totalMonitors})` : ''}</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '2rem' }}>The browser requires permission to go Fullscreen and play Audio.</p>
          <div style={{ display: 'inline-block', background: '#3b82f6', color: 'white', padding: '1rem 3rem', fontSize: '1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
            Press the SPACEBAR on your keyboard
          </div>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '1.5rem' }}>(or click anywhere on this screen)</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
         <h2>Loading Display...</h2>
      </div>
    );
  }

  const rowCount = Math.max(1, Math.ceil(displayTickets.length / 2));

  return (
    <div style={{ background: '#dc2626', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sticky Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        padding: '1vh 2vw', 
        background: '#7f1d1d', // Dark Red
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
           {settings?.logoBase64 && (
             <img src={settings.logoBase64} alt="Logo" style={{ height: '4vh', objectFit: 'contain' }} />
           )}
           <h1 style={{ color: '#fef08a', margin: 0, fontSize: '4vh', letterSpacing: '0.15em', fontWeight: 900, textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
             NOW SERVING {settings?.websiteName ? `- ${settings.websiteName.toUpperCase()}` : ''}
           </h1>
         </div>
         {totalMonitors > 1 && (
           <span style={{ color: '#fca5a5', fontSize: '2vh', fontWeight: 'bold' }}>Monitor {monitorIdx} of {totalMonitors}</span>
         )}
      </div>

      {/* Dynamic 2-Column Grid */}
      <div style={{ 
        flex: 1, 
        padding: '0.5vh', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        alignContent: 'start', // Prevents rows from stretching to fill the screen vertically
        gap: '0.5vh', 
        overflow: 'hidden'
      }}>
        {displayTickets.length > 0 ? (
            displayTickets.map(t => {
              // Mathematical guarantee:
              // Header = ~6vh, Grid padding = 1vh (Total static = 7vh)
              // Per row: Gap = 0.5vh, Borders = 0.8vh, Padding = 1vh (Total dynamic = ~2.3vh/row)
              // We reserve ~93vh for the content, subtract the per-row fixed vh, and divide by rows!
              const maxFontVh = Math.max(1, (93 - (2.5 * rowCount)) / rowCount);
              
              return (
                <div key={t.id} style={{ 
                  background: '#facc15', // Vibrant Yellow
                  borderRadius: '1vh', 
                  border: '0.4vh solid #7f1d1d', // Dark Red Border
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between', // Keeps them on opposite ends
                  padding: '0.5vh 1.5cqw', // Vertical padding strictly in vh
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), inset 0 4px 6px -1px rgba(255,255,255,0.5)',
                  // Magic Container Queries to scale text!
                  containerType: 'inline-size', // We only care about horizontal scaling now
                  width: '100%'
                }}>
                  <div style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    fontSize: `min(8.5cqw, ${maxFontVh}vh)`, 
                    color: '#b91c1c', 
                    fontWeight: 900, 
                    textShadow: '2px 2px 0px rgba(255,255,255,0.4)', 
                    lineHeight: 1 
                  }}>
                    {t.number}
                  </div>
                  <div style={{ 
                    whiteSpace: 'nowrap',
                    paddingLeft: '1vw',
                    fontSize: `min(8.5cqw, ${maxFontVh}vh)`, // EXACT SAME dynamic formula
                    color: '#7f1d1d', 
                    fontWeight: 800, 
                    textAlign: 'right', 
                    lineHeight: 1 
                  }}>
                    {t.counter.name.replace('Window ', 'W')}
                  </div>
                </div>
              );
            })
        ) : (
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '4rem', color: '#fca5a5', textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>Waiting for tickets...</h1>
          </div>
        )}
      </div>
    </div>
  );
}
