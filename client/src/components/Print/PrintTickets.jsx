import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import PrintTicket from './PrintTicket';

export default function PrintTickets() {
  const [searchParams] = useSearchParams();
  const typeCode = searchParams.get('type') || 'NW';
  const startNumber = parseInt(searchParams.get('start') || '1', 10);
  const qty = parseInt(searchParams.get('qty') || '50', 10);
  const format = searchParams.get('format') || 'A4'; // 'A4' or 'thermal'

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

  const isThermal = format === 'thermal';
  const COLS = 4;
  const ROWS = 5;
  const TICKETS_PER_PAGE = COLS * ROWS;

  const pages = [];
  if (isThermal) {
    // Thermal format: Just one long list, no pages needed
    pages.push(tickets);
  } else {
    // A4 Format: Group tickets into pages of 4 columns x 5 rows = 20 tickets per page
    for (let i = 0; i < tickets.length; i += TICKETS_PER_PAGE) {
      const chunk = tickets.slice(i, i + TICKETS_PER_PAGE);
      
      const pageSlots = Array(TICKETS_PER_PAGE).fill(null);
      for (let slot = 0; slot < TICKETS_PER_PAGE; slot++) {
        const visual_row = Math.floor(slot / COLS);
        const visual_col = slot % COLS;
        
        const targetIndex = visual_col * ROWS + (ROWS - 1 - visual_row);
        pageSlots[slot] = chunk[targetIndex] || null;
      }
      pages.push(pageSlots);
    }
  }

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
            ${isThermal ? `
              @page {
                margin: 0;
                size: 80mm auto; /* Typical 80mm thermal receipt */
              }
              .print-page {
                page-break-after: auto;
              }
            ` : `
              @page {
                margin: 0.5in;
              }
              .print-page {
                page-break-after: always;
              }
            `}
          }
        `}
      </style>
      
      <div className="no-print" style={{ padding: '1rem', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Print Preview ({isThermal ? 'Thermal 80mm' : 'A4 Grid'})</strong> - Press Ctrl+P (or Cmd+P) if the print dialog doesn't appear.
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

      <div style={{
        maxWidth: isThermal ? '300px' : '100%',
        margin: isThermal ? '0 auto' : '0'
      }}>
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className="print-page" style={{ 
            display: isThermal ? 'flex' : 'grid', 
            flexDirection: 'column',
            gridTemplateColumns: isThermal ? 'none' : `repeat(${COLS}, 1fr)`, 
            gap: isThermal ? '0.5rem' : '0',
            width: '100%',
            boxSizing: 'border-box',
            padding: isThermal ? '0.2in' : '0'
          }}>
            {page.map((ticketId, i) => {
              if (!ticketId) {
                 return <div key={i} style={{ padding: '1.5rem', height: '2in', boxSizing: 'border-box' }}></div>;
              }
              return (
                <PrintTicket 
                  key={i} 
                  ticketNumber={ticketId} 
                  serviceType={typeCode} 
                  settings={settings} 
                />
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
