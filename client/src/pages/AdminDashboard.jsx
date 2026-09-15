import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api';
import { User, Printer, Settings, Users, ArrowUpRight, TrendingUp, RefreshCw, X, UserPlus, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ModalWrapper from '../components/Modals/ModalWrapper';
import AddEmployeeModal from '../components/Modals/AddEmployeeModal';
import EditUserModal from '../components/Modals/EditUserModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({ type: 'NW', startNumber: 1, quantity: 50 });
  const [globalSettings, setGlobalSettings] = useState(null);
  
  // Selected user for EditUserModal
  const [editingUser, setEditingUser] = useState(null);

  // Custom Popup Window instead of browser alerts
  const [popupMessage, setPopupMessage] = useState(null); 
  const showPopup = (title, message, type = 'error') => {
    setPopupMessage({ title, message, type });
  };

  const formatDate = (d) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const [trendStart, setTrendStart] = useState(formatDate(startOfMonth));
  const [trendEnd, setTrendEnd] = useState(formatDate(endOfMonth));
  const trendStartRef = useRef(trendStart);
  const trendEndRef = useRef(trendEnd);

  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const filterYearRef = useRef(new Date().getFullYear());

  const handleYearChange = (e) => {
    const selectedYear = parseInt(e.target.value);
    setFilterYear(selectedYear);
    
    const now = new Date();
    if (selectedYear === now.getFullYear()) {
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setTrendStart(formatDate(currentMonthStart));
      setTrendEnd(formatDate(currentMonthEnd));
    } else {
      setTrendStart(`${selectedYear}-01-01`);
      setTrendEnd(`${selectedYear}-12-31`);
    }
  };

  const fetchData = async () => {
    try {
      const [statsData, settingsData] = await Promise.all([
        api.getStats(trendStartRef.current, trendEndRef.current, filterYearRef.current),
        api.getSettings()
      ]);
      setStats(statsData);
      setGlobalSettings(settingsData);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  useEffect(() => {
    trendStartRef.current = trendStart;
    trendEndRef.current = trendEnd;
    filterYearRef.current = filterYear;
    fetchData();
  }, [trendStart, trendEnd, filterYear]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.open(`/print-stats?startDate=${trendStart}&endDate=${trendEnd}&year=${filterYear}`, '_blank');
  };

  const originalUser = useMemo(() => {
    return stats?.employees.find(u => u?.id === editingUser?.id);
  }, [stats, editingUser?.id]);


  // Memoize the chart to prevent re-rendering when typing in inputs or changing unrelated state
  const renderChart = useMemo(() => {
    if (!stats?.trend) return null;
    return (
      <div className="bg-surface rounded-3xl p-8 mb-8 shadow-soft border border-border flex flex-col transition-all hover:shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="m-0 text-2xl font-extrabold text-text-main tracking-tight">Tickets Issued</h2>
            <p className="text-text-muted mt-1 text-sm font-medium">Daily volume of new tickets entering the queue</p>
          </div>
          <div className="flex gap-4 items-center bg-bg-color p-2 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 pl-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">From:</label>
              <input type="date" value={trendStart} onChange={(e) => setTrendStart(e.target.value)} className="p-2 rounded-xl border border-border outline-none bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-sm shadow-sm" />
            </div>
            <div className="flex items-center gap-2 pr-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">To:</label>
              <input type="date" value={trendEnd} onChange={(e) => setTrendEnd(e.target.value)} className="p-2 rounded-xl border border-border outline-none bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-sm shadow-sm" />
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px -10px rgba(79, 70, 229, 0.2)', padding: '12px 16px' }}
                itemStyle={{ color: 'var(--color-primary)', fontWeight: '900' }}
                labelStyle={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}
                cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
              />
              <Line 
                type="monotone" 
                dataKey="tickets" 
                name="Tickets Created" 
                stroke="var(--color-primary)" 
                strokeWidth={4} 
                dot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 3, stroke: 'white' }} 
                activeDot={{ r: 8, strokeWidth: 0, shadow: '0 0 10px rgba(79,70,229,0.5)' }} 
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }, [stats?.trend, trendStart, trendEnd]);

  // Memoize the employee table to avoid re-rendering on unrelated state changes
  const renderEmployeeTable = useMemo(() => {
    if (!stats?.employees) return null;
    return (
      <div className="bg-surface rounded-3xl overflow-hidden shadow-soft border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-8 border-b border-border bg-bg-color/50 flex justify-between items-center">
          <h2 className="m-0 text-2xl font-extrabold text-text-main tracking-tight">Employee Performance</h2>
          <span className="text-sm font-semibold text-text-muted bg-surface px-3 py-1 rounded-xl shadow-sm border border-border">{stats.employees.length} Users</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface text-text-muted text-xs uppercase tracking-wider font-extrabold">
                <th className="p-5 px-8">Employee Details</th>
                <th className="p-5 px-6 text-center">Total Served</th>
                <th className="p-5 px-6 text-center">New Apps</th>
                <th className="p-5 px-6 text-center">Renewals</th>
                <th className="p-5 px-6 text-center">Retirements</th>
                <th className="p-5 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.employees.map((emp, i) => {
                return (
                  <tr key={emp.id} className="border-t border-border hover:bg-bg-color/80 transition-colors group">
                    <td className="p-4 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm border border-indigo-50">
                          {emp.profilePictureBase64 ? (
                            <img src={emp.profilePictureBase64} alt={emp.name} className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            emp.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-text-main text-base group-hover:text-indigo-600 transition-colors">
                            {emp.name}
                          </div>
                          <div className="text-xs font-semibold text-text-muted mt-1 flex gap-2 items-center">
                              {emp.counter && <span className="text-[10px] bg-slate-100 text-text-muted px-2 py-0.5 rounded border border-slate-200">Window {emp.counter.name ? emp.counter.name.replace('Window ', '') : ''}</span>}
                          </div>
                          <div className="flex gap-2 items-center mt-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              emp.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 
                              emp.role === 'RECEPTIONIST' ? 'bg-emerald-100 text-emerald-700' : 
                              'bg-slate-100 text-text-muted'
                            }`}>
                              {emp.role}
                            </span>
                            <span className="text-xs text-text-muted font-semibold mx-1">•</span>
                            <div className="flex gap-1.5">
                              {emp.caterNew && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-extrabold shadow-sm">NW</span>}
                              {emp.caterRenewal && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-extrabold shadow-sm">RNW</span>}
                              {emp.caterRetirement && <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-extrabold shadow-sm">R</span>}
                              {!emp.caterNew && !emp.caterRenewal && !emp.caterRetirement && <span className="text-text-muted text-[10px] font-bold">None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 px-6 text-center font-black text-indigo-600 text-lg">{emp.servedTotalYear}</td>
                    <td className="p-4 px-6 text-center font-bold text-emerald-600 bg-emerald-50/30">{emp.servedNewYear}</td>
                    <td className="p-4 px-6 text-center font-bold text-indigo-600 bg-indigo-50/30">{emp.servedRenewalYear}</td>
                    <td className="p-4 px-6 text-center font-bold text-rose-600 bg-rose-50/30">{emp.servedRetirementYear}</td>
                    <td className="p-4 px-8 text-right">
                      <button 
                        onClick={() => setEditingUser(emp)} 
                        className="px-5 py-2 bg-surface border border-border rounded-xl font-bold text-sm text-text-main hover:bg-bg-color hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
              {stats.employees.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-text-muted font-semibold text-lg bg-bg-color">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [stats?.employees]);


  if (!stats) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-text-muted">Loading Dashboard...</h2>
      </div>
    </div>
  );

  return (
    <div className="container py-8 max-w-[1400px] mx-auto px-6 lg:px-12">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-slide-up">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-text-main mb-2">Office Overview</h1>
            <p className="text-text-muted m-0 font-medium text-lg">Real-time statistics for completed transactions.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filterYear}
            onChange={handleYearChange}
            className="py-2.5 px-4 rounded-xl border border-border text-sm cursor-pointer bg-surface text-text-main font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          
          <div className="h-8 w-px bg-border mx-2 hidden md:block"></div>
          
          <button 
            className="flex items-center gap-2 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer" 
            onClick={async () => {
              try {
                const res = await api.autoBalanceCounters();
                showPopup("Success", res.message, "success");
                fetchData();
              } catch (err) {
                showPopup("Error", "Failed to auto-balance counters.", "error");
              }
            }}
          >
            <RefreshCw size={16} className="text-indigo-600" /> Auto-Balance
          </button>
          <button 
            className="flex items-center gap-2 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer" 
            onClick={handlePrint}
          >
            <FileText size={16} className="text-indigo-600" /> Print Report
          </button>
          <button 
            className="flex items-center gap-2 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer" 
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Settings size={16} className="text-indigo-600" /> Settings
          </button>
          <button  
            className="flex items-center gap-2 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer" 
            onClick={() => setIsPrintModalOpen(true)}
          >
            <Printer size={16} className="text-indigo-600" /> Print Tickets
          </button>
          <button 
            className="flex items-center gap-2 bg-indigo-600 text-white border-none hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ml-2" 
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-slide-up">
        {[
          { label: 'Total Served', value: stats.office.total, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Users size={24}/> },
          { label: 'New Apps', value: stats.office.newApp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <TrendingUp size={24}/> },
          { label: 'Renewals', value: stats.office.renewal, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: <RefreshCw size={24}/> },
          { label: 'Retirements', value: stats.office.retirement, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: <X size={24}/> }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface rounded-3xl p-6 shadow-soft border border-border flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${kpi.bg} opacity-50 pointer-events-none`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-xs font-black text-text-muted uppercase tracking-widest">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center border ${kpi.border}`}>
                {kpi.icon}
              </div>
            </div>
            <span className={`text-5xl font-black tracking-tighter ${kpi.color} relative z-10`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Trend Chart (Memoized) */}
      {renderChart}

      {/* Employee Statistics Table (Memoized) */}
      {renderEmployeeTable}

      {/* Extracted Modals */}
      <AddEmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
        showPopup={showPopup} 
      />

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        originalUser={originalUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => { setEditingUser(null); fetchData(); }}
        showPopup={showPopup}
      />

      {/* Print Configuration Modal */}
      <ModalWrapper isOpen={isPrintModalOpen} zIndex={1000} bg="rgba(15,23,42,0.6)">
        <div className="bg-surface p-8 rounded-3xl w-[450px] shadow-float border border-border animate-slide-up relative">
          <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-6 right-6 bg-slate-100 border-none w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-text-muted hover:text-text-main hover:bg-slate-200 transition-colors">×</button>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Printer size={24} />
            </div>
            <h2 className="m-0 text-2xl font-extrabold text-text-main tracking-tight">Print Tickets</h2>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-bold text-xs text-text-muted uppercase tracking-wider">Service Type</label>
            <select 
              value={printConfig.type} 
              onChange={e => setPrintConfig({...printConfig, type: e.target.value})}
              className="w-full p-4 rounded-xl border border-border text-base bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold shadow-sm"
            >
              <option value="NW">New Business (NW)</option>
              <option value="RNW">Renewal (RNW)</option>
              <option value="R">Retirement (R)</option>
            </select>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <label className="block mb-2 font-bold text-xs text-text-muted uppercase tracking-wider">Start Number</label>
              <input type="number" min="1" value={printConfig.startNumber} onChange={e => setPrintConfig({...printConfig, startNumber: Math.max(1, parseInt(e.target.value)||1)})} className="w-full p-4 rounded-xl border border-border text-base bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold shadow-sm" />
            </div>
            <div className="flex-1">
              <label className="block mb-2 font-bold text-xs text-text-muted uppercase tracking-wider">Quantity</label>
              <input type="number" min="1" max="200" value={printConfig.quantity} onChange={e => setPrintConfig({...printConfig, quantity: Math.max(1, parseInt(e.target.value)||1)})} className="w-full p-4 rounded-xl border border-border text-base bg-surface text-text-main focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold shadow-sm" />
            </div>
          </div>

          <button 
            onClick={() => {
              setIsPrintModalOpen(false);
              window.open(`/print-tickets?type=${printConfig.type}&start=${printConfig.startNumber}&qty=${printConfig.quantity}`, '_blank');
            }}
            className="w-full p-4 bg-indigo-600 text-white border-none rounded-xl cursor-pointer font-bold text-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Printer size={20} /> Generate Page
          </button>
        </div>
      </ModalWrapper>

      {/* Settings Modal */}
      <ModalWrapper isOpen={isSettingsModalOpen} zIndex={1000} bg="rgba(15,23,42,0.6)">
        <div className="bg-surface p-8 rounded-3xl w-[450px] shadow-float border border-border animate-slide-up relative">
          <button onClick={() => setIsSettingsModalOpen(false)} className="absolute top-6 right-6 bg-slate-100 border-none w-10 h-10 rounded-full flex items-center justify-center cursor-pointer text-text-muted hover:text-text-main hover:bg-slate-200 transition-colors">×</button>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Settings size={24} />
            </div>
            <h2 className="m-0 text-2xl font-extrabold text-text-main tracking-tight">System Settings</h2>
          </div>
          
          <div className="mb-8">
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-border bg-bg-color hover:border-indigo-300 transition-all">
              <input 
                type="checkbox" 
                checked={globalSettings?.autoAdaptive || false} 
                onChange={async (e) => {
                  const val = e.target.checked;
                  setGlobalSettings({...globalSettings, autoAdaptive: val});
                  try {
                    await api.updateSettings({ ...globalSettings, autoAdaptive: val });
                    showPopup("Success", `Auto-Adaptive Allocation is now ${val ? 'enabled' : 'disabled'}.`, "success");
                  } catch (err) {
                    showPopup("Error", "Failed to update setting.", "error");
                  }
                }}
                className="w-5 h-5 accent-indigo-600 cursor-pointer" 
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-text-main text-base">Auto-Adaptive Allocation</span>
                <span className="text-text-muted text-xs font-semibold mt-1">Automatically rebalance counter queues on the fly.</span>
              </div>
            </label>
          </div>
        </div>
      </ModalWrapper>

      {/* Global Message Popup Window */}
      <ModalWrapper isOpen={!!popupMessage} zIndex={9999} bg="rgba(15,23,42,0.6)">
        {() => (
          <div className={`bg-surface rounded-3xl w-[360px] p-8 text-center border border-border shadow-float animate-slide-up relative overflow-hidden`}>
            
            <div className={`absolute top-0 left-0 w-full h-2 ${popupMessage.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-black ${popupMessage.type === 'error' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
              {popupMessage.type === 'error' ? '!' : '✓'}
            </div>
            
            <h3 className="m-0 mb-3 text-text-main font-extrabold text-xl tracking-tight">{popupMessage.title}</h3>
            <p className="m-0 mb-8 text-text-muted text-sm font-medium leading-relaxed">{popupMessage.message}</p>
            
            <button 
              onClick={() => setPopupMessage(null)} 
              className="w-full p-4 bg-slate-100 border-none text-text-main font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-base"
            >
              Okay
            </button>
          </div>
        )}
      </ModalWrapper>

    </div>
  );
}
