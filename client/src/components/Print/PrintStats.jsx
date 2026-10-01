import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// ==========================================
// Sub-components for better modularity
// ==========================================

const PrintStyle = () => (
  <style>{`
    @page { size: A4 portrait; margin: 15mm; }
    body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    * { box-sizing: border-box; }
  `}</style>
);

const PrintHeader = ({ settings, year }) => (
  <div style={{ borderBottom: '3px solid #111827', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {settings?.logoBase64 && (
        <img src={settings.logoBase64} alt="Office Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
      )}
      <div>
        <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '26px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '-0.5px' }}>{settings?.websiteName || 'BPLO Queuing System'}</h1>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#4b5563', fontWeight: 'normal' }}>Official Analytics & Statistics Report ({year})</h2>
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <p style={{ margin: '0 0 0.25rem 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Generated on:</p>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{new Date().toLocaleString()}</p>
    </div>
  </div>
);

const PrintExecutiveSummary = ({ office, advanced, employees, startDate, endDate, year }) => {
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const periodLabel = (startDate && endDate) 
    ? `${formatFriendlyDate(startDate)} to ${formatFriendlyDate(endDate)}` 
    : `the year ${year}`;

  const yoy = advanced?.yoy || { pctChange: 0 };
  const yoyText = yoy.pctChange > 0 
    ? `an increase of ${yoy.pctChange}%` 
    : yoy.pctChange < 0 
      ? `a decrease of ${Math.abs(yoy.pctChange)}%` 
      : `no change`;

  const busiestHours = advanced?.busiestHours || [];
  const peak = busiestHours.length 
    ? busiestHours.reduce((max, entry) => (entry.count > max.count ? entry : max), busiestHours[0]) 
    : null;
  const peakText = peak && peak.count > 0 ? ` Peak foot traffic typically occurs around ${peak.label}.` : '';

  const topEmp = employees && employees.length > 0
    ? [...employees].sort((a, b) => b.servedTotalYear - a.servedTotalYear)[0]
    : null;
  const topEmpText = topEmp && topEmp.servedTotalYear > 0
    ? ` The top performing employee was ${topEmp.name}, processing ${topEmp.servedTotalYear.toLocaleString()} tickets.`
    : '';

  const waitText = advanced?.avgWaitTimeMins !== undefined
    ? ` Citizens waited an average of ${advanced.avgWaitTimeMins} minutes before being served.`
    : '';

  return (
    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderLeft: '4px solid #4f46e5', borderRadius: '4px' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Executive Summary</h3>
      <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
        This report summarizes queue operations for <strong>{periodLabel}</strong>. 
        A total of <strong>{office?.total?.toLocaleString() || 0}</strong> citizens were successfully served, representing <strong>{yoyText}</strong> compared to the previous year.{waitText}{peakText}{topEmpText} The detailed metrics below provide insights into service volumes, operational efficiency, and individual employee performance.
      </p>
    </div>
  );
};

const PrintKPIs = ({ office, advanced }) => {
  const yoy = advanced?.yoy || { pctChange: 0, current: 0, previous: 0 };
  
  const total = office?.total || 0;
  const noShowPct = total > 0 ? ((advanced?.noShow || 0) / total * 100).toFixed(1) : 0;
  const postponedPct = total > 0 ? ((advanced?.postponed || 0) / total * 100).toFixed(1) : 0;

  const primaryMetrics = [
    { label: 'Total Served', desc: 'Successfully processed', value: office?.total || 0, bg: '#f3f4f6', color: '#111827' },
    { label: 'New Apps', desc: 'Business registrations', value: office?.newApp || 0, bg: '#f9fafb', color: '#374151' },
    { label: 'Renewals', desc: 'Permit renewals', value: office?.renewal || 0, bg: '#f9fafb', color: '#374151' },
    { label: 'Retirements', desc: 'Business closures', value: office?.retirement || 0, bg: '#f9fafb', color: '#374151' }
  ];
  const advancedMetrics = [
    { label: 'Avg Wait Time', desc: 'Lobby wait duration', value: `${advanced?.avgWaitTimeMins || 0} min`, color: '#4f46e5' },
    { label: 'Avg Service Time', desc: 'Transaction duration', value: `${advanced?.avgServiceTimeMins || 0} min`, color: '#059669' },
    { label: 'No-Show Rate', desc: `${advanced?.noShow || 0} tickets bypassed`, value: `${noShowPct}%`, color: '#dc2626' },
    { label: `YoY Growth (${office?.year ? office.year - 1 : ''})`, desc: 'Compared to previous year', value: `${yoy.pctChange >= 0 ? '+' : ''}${yoy.pctChange}%`, color: yoy.pctChange >= 0 ? '#059669' : '#dc2626' }
  ];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.25rem', margin: '0 0 0.75rem 0', fontSize: '14px', textTransform: 'uppercase', color: '#374151' }}>A. Volume & SLA Metrics</h3>
      
      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {primaryMetrics.map((kpi, idx) => (
          <div key={idx} style={{ padding: '0.75rem', background: kpi.bg, border: '1px solid #d1d5db', textAlign: 'center', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#374151', marginBottom: '2px', fontWeight: 'bold' }}>{kpi.label}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '0.5rem' }}>{kpi.desc}</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: kpi.color }}>{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Advanced Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {advancedMetrics.map((kpi, idx) => (
          <div key={idx} style={{ padding: '0.75rem', background: '#ffffff', border: '1px dashed #d1d5db', textAlign: 'center', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#374151', marginBottom: '2px', fontWeight: 'bold' }}>{kpi.label}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: '0.5rem' }}>{kpi.desc}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrintCharts = ({ busiestHours = [], busiestDays = [], priorityBreakdown = [], counterUtilization = [] }) => {
  const maxPriorityCount = priorityBreakdown.length ? Math.max(...priorityBreakdown.map(i => i.count), 1) : 1;
  const totalPriorityCount = priorityBreakdown.reduce((a, i) => a + i.count, 0);
  
  const maxCounterCount = counterUtilization.length ? Math.max(...counterUtilization.map(i => i.count), 1) : 1;
  const totalCounterCount = counterUtilization.reduce((a, i) => a + i.count, 0);

  const peakHour = busiestHours.length 
    ? busiestHours.reduce((max, entry) => (entry.count > max.count ? entry : max), busiestHours[0]) 
    : null;

  const peakDay = busiestDays.length 
    ? busiestDays.reduce((max, entry) => (entry.count > max.count ? entry : max), busiestDays[0]) 
    : null;

  return (
    <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.25rem', margin: '0 0 0.75rem 0', fontSize: '14px', textTransform: 'uppercase', color: '#374151' }}>B. Traffic & Demographics</h3>
      
      {/* Row 1: Bar Charts */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', color: '#374151' }}>Busiest Hours</h3>
            {peakHour && peakHour.count > 0 && (
              <span style={{ fontSize: '10px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Peak: {peakHour.label}</span>
            )}
          </div>
          
          {busiestHours.length > 0 ? (
            <div style={{ width: '100%', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busiestHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} interval={1} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {busiestHours.map((entry, idx) => (
                      <Cell key={idx} fill={entry.count > 0 ? '#4f46e5' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No Data Available</div>
          )}
        </div>
        
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', color: '#374151' }}>Busiest Days</h3>
            {peakDay && peakDay.count > 0 && (
              <span style={{ fontSize: '10px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Peak: {peakDay.day}</span>
            )}
          </div>
          
          {busiestDays.length > 0 ? (
            <div style={{ width: '100%', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busiestDays} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} interval={0} tickFormatter={(val) => val.substring(0,3)} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {busiestDays.map((entry, idx) => (
                      <Cell key={idx} fill={entry.count > 0 ? '#059669' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No Data Available</div>
          )}
        </div>
      </div>

      {/* Row 2: CSS Breakdown Bars */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '12px', textTransform: 'uppercase', color: '#374151' }}>Priority Mix Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {priorityBreakdown.length > 0 ? priorityBreakdown.map(item => (
              <div key={item.type} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <strong>{item.label}</strong>
                  <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{item.count.toLocaleString()} ({Math.round((item.count / totalPriorityCount) * 100)}%)</span>
                </div>
                <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(item.count / maxPriorityCount) * 100}%`, background: '#6366f1', borderRadius: '4px' }}></div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>No Data Available</div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '12px', textTransform: 'uppercase', color: '#374151' }}>Counter Utilization</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {counterUtilization.length > 0 ? counterUtilization.map(item => (
              <div key={item.name} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <strong>{item.name}</strong>
                  <span style={{ color: '#059669', fontWeight: 'bold' }}>{item.count.toLocaleString()} ({Math.round((item.count / totalCounterCount) * 100)}%)</span>
                </div>
                <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(item.count / maxCounterCount) * 100}%`, background: '#059669', borderRadius: '4px' }}></div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>No Data Available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PrintTrendTable = ({ trend = [], startDate, endDate }) => {
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasDateRange = startDate && endDate;
  const dateRangeLabel = hasDateRange ? `(${formatFriendlyDate(startDate)} to ${formatFriendlyDate(endDate)})` : '';

  const totals = trend.reduce((acc, curr) => {
    acc.tickets += curr.tickets || 0;
    acc.newApp += curr.newApp || 0;
    acc.renewal += curr.renewal || 0;
    acc.retirement += curr.retirement || 0;
    return acc;
  }, { tickets: 0, newApp: 0, renewal: 0, retirement: 0 });

  return (
    <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.25rem', margin: '0 0 0.75rem 0', fontSize: '14px', textTransform: 'uppercase', color: '#374151' }}>
        C. Ticket Issuance Trend {dateRangeLabel}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['Date', 'Total Tickets', 'New Apps', 'Renewals', 'Retirements'].map(header => (
              <th key={header} style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: header === 'Date' ? 'left' : 'center', fontSize: '11px', textTransform: 'uppercase' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trend.map((t, idx) => (
            <tr key={idx}>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', fontSize: '11px' }}>{t.date}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>{t.tickets}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{t.newApp}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{t.renewal}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{t.retirement}</td>
            </tr>
          ))}
        </tbody>
        {trend.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', fontSize: '11px', textAlign: 'right' }}>TREND TOTAL</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px', color: '#4f46e5' }}>{totals.tickets.toLocaleString()}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{totals.newApp.toLocaleString()}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{totals.renewal.toLocaleString()}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{totals.retirement.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

const PrintEmployeeTable = ({ employees = [] }) => {
  const totals = employees.reduce((acc, curr) => {
    acc.total += curr.servedTotalYear || 0;
    acc.newApp += curr.servedNewYear || 0;
    acc.renewal += curr.servedRenewalYear || 0;
    acc.retirement += curr.servedRetirementYear || 0;
    return acc;
  }, { total: 0, newApp: 0, renewal: 0, retirement: 0 });

  return (
    <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
      <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.25rem', margin: '0 0 0.75rem 0', fontSize: '14px', textTransform: 'uppercase', color: '#374151' }}>D. Employee Performance Summary</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['Employee Name', 'Role', 'Total Served', 'New Apps', 'Renewals', 'Retirements'].map((header) => (
              <th key={header} style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: header === 'Employee Name' || header === 'Role' ? 'left' : 'center', fontSize: '11px', textTransform: 'uppercase' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', fontSize: '11px', fontWeight: 'bold' }}>{emp.name}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', fontSize: '11px' }}>{emp.role}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#4f46e5' }}>{emp.servedTotalYear}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{emp.servedNewYear}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{emp.servedRenewalYear}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{emp.servedRetirementYear}</td>
            </tr>
          ))}
        </tbody>
        {employees.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td colSpan="2" style={{ padding: '6px', border: '1px solid #d1d5db', fontSize: '11px', textAlign: 'right' }}>OFFICE TOTAL</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px', color: '#4f46e5' }}>{totals.total.toLocaleString()}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{totals.newApp.toLocaleString()}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{totals.renewal.toLocaleString()}</td>
              <td style={{ padding: '6px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '11px' }}>{totals.retirement.toLocaleString()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

const PrintSignatures = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', pageBreakInside: 'avoid' }}>
    <div style={{ width: '40%' }}>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '2.5rem' }}>Prepared By:</p>
      <div style={{ borderBottom: '1px solid #111827', width: '100%', marginBottom: '0.25rem' }}></div>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>System Administrator</p>
      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Date: ________________________</p>
    </div>
    <div style={{ width: '40%' }}>
      <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '2.5rem' }}>Approved By:</p>
      <div style={{ borderBottom: '1px solid #111827', width: '100%', marginBottom: '0.25rem' }}></div>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Head of Office</p>
      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Date: ________________________</p>
    </div>
  </div>
);

const PrintFooter = ({ websiteName }) => (
  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
    {websiteName || 'BPLO Queuing System'} &copy; {new Date().getFullYear()} • Official Statistics Report
  </div>
);

// ==========================================
// Main Component
// ==========================================

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
  }, [startDate, endDate, year]);

  useEffect(() => {
    if (stats && !printed.current) {
      // Delay printing slightly so charts can render safely
      const timer = setTimeout(() => {
        window.print();
        printed.current = true;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Generating Enhanced Report...</div>;

  return (
    <>
      <PrintStyle />
      
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', color: '#111827', padding: '10px' }}>
        
        <PrintHeader settings={settings} year={stats.office.year} />
        
        <PrintExecutiveSummary 
          office={stats.office} 
          advanced={stats.advanced || {}} 
          employees={stats.employees || []}
          startDate={startDate} 
          endDate={endDate} 
          year={stats.office.year} 
        />
        
        <PrintKPIs office={stats.office} advanced={stats.advanced || {}} />
        
        <PrintCharts 
          busiestHours={stats.advanced?.busiestHours} 
          busiestDays={stats.advanced?.busiestDays}
          priorityBreakdown={stats.advanced?.priorityBreakdown} 
          counterUtilization={stats.advanced?.counterUtilization}
        />
        
        <PrintTrendTable trend={stats.trend} startDate={startDate} endDate={endDate} />
        
        <PrintEmployeeTable employees={stats.employees} />
        
        <PrintSignatures />
        
        <PrintFooter websiteName={settings?.websiteName} />

        <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
          <button 
            onClick={() => window.print()} 
            style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            Print Report Again
          </button>
        </div>

      </div>
    </>
  );
}
