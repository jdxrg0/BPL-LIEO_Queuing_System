import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintTicket({ 
  ticketNumber = 'NW-000000-001', 
  serviceType = 'NW', 
  settings = { websiteName: 'BPLO System', logoBase64: '' }
}) {
  const getServiceLabel = (t) => {
    switch(t) {
      case 'NW': return 'New Business';
      case 'RNW': return 'Renewal';
      case 'R': return 'Retirement';
      default: return t || 'Queue Ticket';
    }
  };

  const trackerUrl = `${window.location.origin}/tracker?ticket=${ticketNumber}`;

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
        {ticketNumber}
      </div>
      
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem', marginBottom: '0.35rem' }}>
        {getServiceLabel(serviceType)}
      </div>

      <QRCodeSVG 
        value={trackerUrl} 
        size={80} 
      />

      <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 500 }}>
        {settings?.ticketHeaderText || "Scan to track your ticket"}
      </div>
      
      <div style={{ fontSize: '0.5rem', color: '#64748b', marginTop: '0.35rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.2rem', width: '90%' }}>
        {settings?.ticketFooterText || "Please wait for your number."}
      </div>
    </div>
  );
}
