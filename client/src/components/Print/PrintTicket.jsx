import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../api';

export default function PrintTicket({ ticketNumber, serviceType = 'NW', settings: propSettings }) {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState(propSettings || null);
  const paramTicket = searchParams.get('ticket') || searchParams.get('number');
  const activeTicketNumber = ticketNumber || paramTicket || 'NW-000000-001';
  const activeServiceType = serviceType || searchParams.get('type') || 'NW';

  useEffect(() => {
    if (!settings) {
      api.getSettings().then(setSettings).catch(() => {
        setSettings({ websiteName: 'BPLO System', logoBase64: '' });
      });
    }
  }, [settings]);

  const getServiceLabel = (t) => {
    switch(t) {
      case 'NW': return 'New Business';
      case 'RNW': return 'Renewal';
      case 'R': return 'Retirement';
      default: return t || 'Queue Ticket';
    }
  };

  const trackerUrl = `${window.location.origin}/tracker?ticket=${activeTicketNumber}`;

  return (
    <div style={{ 
      border: '1px dashed #94a3b8', 
      padding: '0.5rem 0.25rem', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      minHeight: '2in',
      boxSizing: 'border-box',
      background: '#ffffff',
      pageBreakInside: 'avoid',
      breakInside: 'avoid'
    }}>
      {settings?.logoBase64 && (
        <img src={settings.logoBase64} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', marginBottom: '0.2rem' }} />
      )}
      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
        {settings?.websiteName || 'BPLO System'}
      </div>
      
      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1 }}>
        {activeTicketNumber}
      </div>
      
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem', marginBottom: '0.35rem' }}>
        {getServiceLabel(activeServiceType)}
      </div>

      <QRCodeSVG 
        value={trackerUrl} 
        size={80} 
      />

      <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 500 }}>
        Scan to track your ticket
      </div>
      
      <div style={{ fontSize: '0.5rem', color: '#64748b', marginTop: '0.35rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.2rem', width: '90%' }}>
        Please wait for your number.
      </div>
    </div>
  );
}
