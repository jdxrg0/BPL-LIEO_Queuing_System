import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function PrintTickets() {
  const [searchParams] = useSearchParams();
  const typeCode = searchParams.get('type') || 'NW';
  const startNumber = parseInt(searchParams.get('start') || '1', 10);
  const qty = parseInt(searchParams.get('qty') || '50', 10);

  const [settings, setSettings] = useState(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    // Fetch settings to display logo and name
    api.getSettings().then(res => {
      setSettings(res);
      if (!hasPrinted.current) {
        hasPrinted.current = true;
        setTimeout(() => window.print(), 500);
      }
    }).catch(() => {
      setSettings({ websiteName: 'BPLO System', logoBase64: '' });
      if (!hasPrinted.current) {
        hasPrinted.current = true;
        setTimeout(() => window.print(), 500);
      }
    });
  }, []);

  if (!settings) return <div style={{ padding: '2rem', textAlign: 'center' }}>Preparing Tickets...</div>;

  // Format date like backend: MMDDYY
  const today = new Date();
  const dateStr = String(today.getMonth() + 1).padStart(2, '0') + 
                  String(today.getDate()).padStart(2, '0') + 
                  String(today.getFullYear()).slice(-2);

  // Generate the flat list of tickets
  const tickets = Array.from({ length: qty }).map((_, idx) => {
    const numStr = String(startNumber + idx).padStart(3, '0');
    return `${typeCode}-${dateStr}-${numStr}`;
  });

  // Group tickets into pages of 4 columns x 5 rows = 20 tickets per page
  // Layout logic: first column fills from bottom to top, then next column, etc.
  const COLS = 4;
  const ROWS = 5;
  const TICKETS_PER_PAGE = COLS * ROWS;

  const pages = [];
  for (let i = 0; i < tickets.length; i += TICKETS_PER_PAGE) {
    const chunk = tickets.slice(i, i + TICKETS_PER_PAGE);
    
    // Map to visual slots for this page (CSS Grid renders left-to-right, top-to-bottom)
    const pageSlots = Array(TICKETS_PER_PAGE).fill(null);
    for (let slot = 0; slot < TICKETS_PER_PAGE; slot++) {
      const visual_row = Math.floor(slot / COLS);
      const visual_col = slot % COLS;
      
      // Target index is calculated so that col 0 gets items 0..4 (from bottom row up to top row)
      const targetIndex = visual_col * ROWS + (ROWS - 1 - visual_row);
      pageSlots[slot] = chunk[targetIndex] || null;
    }
    pages.push(pageSlots);
  }

  const getServiceLabel = (t) => {
    switch(t) {
      case 'NW': return 'New Business';
      case 'RNW': return 'Renewal';
      case 'R': return 'Retirement';
      default: return 'Queue Ticket';
    }
  };

  return (
    <>
      <style>
        {`
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 0.5in;
            }
            .print-page {
              page-break-after: always;
            }
          }
        `}
      </style>
      
      <div className="no-print" style={{ padding: '1rem', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Print Preview</strong> - Press Ctrl+P (or Cmd+P) if the print dialog doesn't appear.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => window.print()}
            style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Print Now
          </button>
          <button 
            onClick={() => window.close()}
            style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Close Tab
          </button>
        </div>
      </div>

      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="print-page" style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${COLS}, 1fr)`, 
          gap: '0',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {page.map((ticketId, i) => {
            if (!ticketId) {
               return <div key={i} style={{ padding: '1.5rem', height: '2in', boxSizing: 'border-box' }}></div>;
            }
            return (
              <div key={i} style={{ 
                border: '1px dashed #94a3b8', 
                padding: '1rem 0.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                height: '2in',
                boxSizing: 'border-box',
                background: '#ffffff'
              }}>
                {settings.logoBase64 && (
                  <img src={settings.logoBase64} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', marginBottom: '0.25rem' }} />
                )}
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {settings.websiteName || 'BPLO System'}
                </div>
                
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1 }}>
                  {ticketId}
                </div>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginTop: '0.25rem' }}>
                  {getServiceLabel(typeCode)}
                </div>
                
                <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '0.25rem', width: '90%' }}>
                  Please wait for your number.
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
