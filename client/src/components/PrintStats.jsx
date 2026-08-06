import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function PrintStats() {
  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const printed = useRef(false);

  useEffect(() => {
    // Inject print styles globally for this page
    const style = document.createElement('style');
    style.innerHTML = `
      @page { size: A4 portrait; margin: 20mm; }
      body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @media print {
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
      }
    `;
    document.head.appendChild(style);

    const loadData = async () => {
      try {
        const [statsData, settingsData] = await Promise.all([
          api.getStats(startDate, endDate, year),
          api.getSettings()
        ]);
        setStats(statsData);
        setSettings(settingsData);
      } catch (err) {
        console.error("Failed to load stats for printing:", err);
      }
    };
    loadData();

    return () => {
      document.head.removeChild(style);
    };
  }, [startDate, endDate, year]);

  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    if (stats && !printed.current) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        window.print();
        printed.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Generating Report...</div>;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', color: '#111827', padding: '20px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {settings?.logoBase64 && (
            <img src={settings.logoBase64} alt="Office Logo" style={{ height: '64px', width: 'auto', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '24px', textTransform: 'uppercase' }}>{settings?.websiteName || 'BPLO Queuing System'}</h1>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#4b5563', fontWeight: 'normal' }}>Official Statistics Report ({stats.office.year})</h2>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '12px', color: '#4b5563' }}>Generated on:</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* KPI Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0', fontSize: '16px', textTransform: 'uppercase' }}>A. Office Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Served', value: stats.office.total },
            { label: 'New Apps', value: stats.office.newApp },
            { label: 'Renewals', value: stats.office.renewal },
            { label: 'Retirements', value: stats.office.retirement }
          ].map((kpi, idx) => (
            <div key={idx} style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #d1d5db', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.5rem' }}>{kpi.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Table */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0', fontSize: '16px', textTransform: 'uppercase' }}>
          B. Ticket Issuance Trend {startDate && endDate ? `(${formatFriendlyDate(startDate)} to ${formatFriendlyDate(endDate)})` : ''}
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left', fontSize: '12px' }}>Date</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>Tickets Issued (Total)</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>New Apps</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>Renewals</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>Retirements</th>
            </tr>
          </thead>
          <tbody>
            {stats.trend.map((t, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontSize: '12px' }}>{t.date}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{t.tickets}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>{t.newApp}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>{t.renewal}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>{t.retirement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Performance */}
      <div>
        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '0 0 1rem 0', fontSize: '16px', textTransform: 'uppercase' }}>C. Employee Performance Summary</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left', fontSize: '12px' }}>Employee Name</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left', fontSize: '12px' }}>Role</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>Total Served</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>New Apps</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>Renewals</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>Retirements</th>
            </tr>
          </thead>
          <tbody>
            {stats.employees.map((emp) => (
              <tr key={emp.id}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontSize: '12px' }}>{emp.name}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', fontSize: '12px' }}>{emp.role}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{emp.servedTotalYear}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>{emp.servedNewYear}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>{emp.servedRenewalYear}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '12px' }}>{emp.servedRetirementYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        {settings?.websiteName || 'BPLO Queuing System'} &copy; {new Date().getFullYear()} • Confidential Statistics Report
      </div>

      <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          Print Again
        </button>
      </div>
    </div>
  );
}
