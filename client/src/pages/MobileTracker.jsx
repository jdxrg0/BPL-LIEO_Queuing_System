import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { api } from '../api';

const socket = io('http://localhost:3001'); // Ensure this matches your backend URL

export default function MobileTracker() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1);

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch(e) { console.error('Audio failed', e); }
  };

  // Helper to convert base64 VAPID to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerPushSubscription = async (ticketNumber) => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
        });
        
        await api.subscribeToPush(ticketNumber, subscription);
        console.log('Subscribed to Push successfully!');
      } catch (err) {
        console.error('Failed to subscribe to push:', err);
      }
    }
  };

  const requestNotificationPermission = async (ticketNum) => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        registerPushSubscription(ticketNum);
      }
    }
  };

  const fetchTicketData = async (number) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.trackTicket(number);
      setTicketData(res.data);
      setIsTracking(true);

      // Check if we need to send an active chime (if they are staring at the screen)
      // The backend Web Push handles background/locked notifications!
      if (res.data.status === 'WAITING' && res.data.trueRank <= 2) {
        playChime();
      } else if (res.data.status === 'SERVING' || res.data.status === 'COMPLETED') {
        playChime();
      }
    } catch (err) {
      setError(err.message || 'Ticket not found or error occurred.');
      setIsTracking(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTracking = (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;
    const num = ticketNumber.trim().toUpperCase();
    fetchTicketData(num);
    requestNotificationPermission(num);
  };

  useEffect(() => {
    // If we are actively tracking a ticket, listen for queue updates
    if (isTracking && ticketData?.ticket?.status === 'WAITING') {
      const handleQueueUpdate = () => {
        // Re-fetch the live data behind the scenes
        fetchTicketData(ticketData.ticket.number);
      };

      socket.on('queueUpdated', handleQueueUpdate);
      socket.on('ticketCalled', handleQueueUpdate);

      return () => {
        socket.off('queueUpdated', handleQueueUpdate);
        socket.off('ticketCalled', handleQueueUpdate);
      };
    }
  }, [isTracking, ticketData]);

  if (!isTracking) {
    return (
      <div className="min-h-screen bg-bg-color flex items-center justify-center p-4">
        <div className="card w-full max-w-md p-8 shadow-xl bg-surface rounded-2xl border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary mb-2">Live Tracker</h1>
            <p className="text-text-muted">Enter your ticket number to track your wait time live.</p>
          </div>
          
          <form onSubmit={handleStartTracking} className="flex flex-col gap-6">
            <div>
              <input 
                type="text" 
                placeholder="e.g. NW-0916-001" 
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                className="input-field text-center text-2xl font-bold uppercase tracking-widest py-4"
                required
              />
            </div>
            
            {error && <div className="text-danger text-center font-medium bg-danger/10 p-3 rounded-lg">{error}</div>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg"
            >
              {loading ? 'Searching...' : 'Track Ticket'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Live Tracking View
  const { ticket, trueRank, estimatedWaitMins } = ticketData;
  const isCalled = ticket.status === 'SERVING' || ticket.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-bg-color p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-xl font-bold text-text-main">Live Status</h2>
          <button 
            onClick={() => setIsTracking(false)} 
            className="text-sm text-primary font-semibold hover:underline"
          >
            Track Another
          </button>
        </div>

        <div className={`card overflow-hidden shadow-2xl rounded-3xl border-2 transition-colors duration-500 ${isCalled ? 'border-success bg-success/5' : 'border-primary/30 bg-surface'}`}>
          
          <div className={`text-center py-8 text-white ${isCalled ? 'bg-success' : 'bg-primary'}`}>
            <p className="text-sm font-semibold opacity-80 uppercase tracking-widest mb-1">Ticket Number</p>
            <h1 className="text-5xl font-black tracking-tight">{ticket.number}</h1>
            <p className="mt-2 text-lg font-medium opacity-90">{ticket.service.name}</p>
          </div>

          <div className="p-8 flex flex-col gap-8">
            
            {isCalled ? (
              <div className="text-center animate-bounce">
                <h2 className="text-3xl font-extrabold text-success mb-2">PLEASE PROCEED!</h2>
                <p className="text-text-muted text-lg">Your ticket has been called to</p>
                <div className="mt-4 inline-block bg-success/20 text-success font-black text-2xl px-6 py-3 rounded-xl border border-success/30">
                  {ticket.counter?.name || 'A Window'}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-color p-4 rounded-2xl text-center border border-border">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Position in Line</p>
                    <div className="text-4xl font-black text-text-main">{trueRank}</div>
                  </div>
                  <div className="bg-bg-color p-4 rounded-2xl text-center border border-border">
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Est. Wait</p>
                    <div className="text-4xl font-black text-warning">
                      {estimatedWaitMins > 0 ? `${estimatedWaitMins}m` : '<1m'}
                    </div>
                  </div>
                </div>

                {trueRank <= 3 && (
                  <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
                    <p className="text-warning-dark font-bold m-0 flex items-center gap-2">
                      <span className="text-xl">⚠️</span> Be ready! Your turn is very near.
                    </p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            Updates automatically. Do not close this tab if you want to receive push notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
