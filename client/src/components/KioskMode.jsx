import React, { useState, useEffect } from 'react';
import { api, socket } from '../api';

export default function KioskMode() {
  const [services, setServices] = useState([]);
  const [latestTicket, setLatestTicket] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      api.getServices().then(setServices),
      api.getSettings().then(setSettings)
    ])
    .catch(console.error)
    .finally(() => setIsLoading(false));

    socket.on('settingsUpdated', setSettings);
    return () => socket.off('settingsUpdated');
  }, []);

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

  const handleSelectService = async (serviceId) => {
    try {
      // createdByUserId is null because this is self-service
      const ticket = await api.generateTicket(serviceId, null);
      setLatestTicket(ticket);
      
      // Auto-hide the ticket after 10 seconds
      setTimeout(() => {
        setLatestTicket(null);
      }, 10000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-muted)' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
      {/* Header */}
      <header className="kiosk-header">
        {settings?.logoBase64 && (
          <>
            <img src={settings.logoBase64} alt="Logo" className="kiosk-header__logo" />
            <span className="kiosk-header__divider" />
          </>
        )}
        <div>
          <h1 className="kiosk-header__title">{settings?.websiteName || 'BPLO System'}</h1>
          <p className="kiosk-header__subtitle">Welcome! Please select your transaction type.</p>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        
        {latestTicket ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px', width: '100%', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>Your Ticket Number is</h2>
            <h1 style={{ fontSize: '6rem', color: 'var(--primary)', margin: '2rem 0' }}>{latestTicket.number}</h1>
            <p style={{ fontSize: '1.5rem' }}>Service: <strong>{latestTicket.service.name}</strong></p>
            <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>Please take a seat and wait for your number to be called on the screen.</p>
            <button 
              onClick={() => setLatestTicket(null)}
              className="btn btn-primary" 
              style={{ marginTop: '2rem', fontSize: '1.25rem', padding: '1rem 2rem' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1040px', width: '100%', alignItems: 'stretch' }}>
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectService(s.id)}
                className="kiosk-service-btn"
              >
                <span className="kiosk-service-btn__badge">{s.prefix}</span>
                <h2 className="kiosk-service-btn__name">{s.name}</h2>
                <p className="kiosk-service-btn__desc">{s.description}</p>
                <span className="kiosk-service-btn__cta">
                  Get ticket
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
