import React, { useState, useEffect, useMemo } from 'react';
import { api, socket } from '../api';
import { Printer, Settings, RefreshCw, UserPlus, FileText } from 'lucide-react';

import AddEmployeeModal from '../components/Modals/AddEmployeeModal';
import EditUserModal from '../components/Modals/EditUserModal';
import SummaryCards from '../components/Admin/SummaryCards';
import LiveQueueOverview from '../components/Admin/LiveQueueOverview';
import TicketsChartCard from '../components/Admin/TicketsChartCard';
import AdvancedAnalyticsSection from '../components/Admin/AdvancedAnalyticsSection';
import EmployeeTable from '../components/Admin/EmployeeTable';
import PrintTicketsModal from '../components/Admin/PrintTicketsModal';
import GlobalPopup from '../components/Admin/GlobalPopup';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({ type: 'NW', startNumber: 1, quantity: 50 });

  // Live queue operational data
  const [liveWaitTimes, setLiveWaitTimes] = useState(null);
  const [waitingCounts, setWaitingCounts] = useState({ NW: 0, RNW: 0, R: 0 });
  const [servingTickets, setServingTickets] = useState([]);

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

  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    api.getSettings().then(s => {
      if (s?.websiteName) document.title = `${s.websiteName} | Admin Dashboard`;
    }).catch(() => {
      document.title = 'BPLO Queuing System | Admin Dashboard';
    });
  }, []);

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
      const statsData = await api.getStats(trendStart, trendEnd, filterYear);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  const fetchLiveData = async () => {
    const [waitTimesRes, waitingRes, servingRes] = await Promise.allSettled([
      api.getLiveWaitTimes(),
      api.getWaitingQueue(),
      api.getRecentCalled()
    ]);

    if (waitTimesRes.status === 'fulfilled') {
      setLiveWaitTimes(waitTimesRes.value);
    }

    if (waitingRes.status === 'fulfilled') {
      const counts = { NW: 0, RNW: 0, R: 0 };
      (waitingRes.value || []).forEach(t => {
        const prefix = t.service?.prefix;
        if (prefix && counts[prefix] !== undefined) counts[prefix]++;
      });
      setWaitingCounts(counts);
    }

    if (servingRes.status === 'fulfilled') {
      setServingTickets(servingRes.value || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trendStart, trendEnd, filterYear]);

  useEffect(() => {
    fetchLiveData();

    const interval = setInterval(() => {
      fetchData();
      fetchLiveData();
    }, 30000);

    const handleUpdate = () => {
      fetchData();
      fetchLiveData();
    };
    socket.on('queueUpdated', handleUpdate);
    socket.on('ticketCreated', handleUpdate);
    socket.on('ticketCalled', handleUpdate);

    return () => {
      clearInterval(interval);
      socket.off('queueUpdated', handleUpdate);
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketCalled', handleUpdate);
    };
  }, []);

  const handlePrint = () => {
    window.open(`/print-stats?startDate=${trendStart}&endDate=${trendEnd}&year=${filterYear}`, '_blank');
  };

  const originalUser = useMemo(() => {
    return stats?.employees.find(u => u?.id === editingUser?.id);
  }, [stats, editingUser?.id]);

  if (!stats) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-text-muted">Loading Dashboard...</h2>
      </div>
    </div>
  );

  return (
    <div className="container py-4 max-w-[1400px] mx-auto px-6 lg:px-12">

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-main mb-1">Office Overview</h1>
            <p className="text-text-muted m-0 font-medium text-sm">Real-time statistics for completed transactions.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterYear}
            onChange={handleYearChange}
            className="py-1.5 px-3 rounded-lg border border-border text-xs cursor-pointer bg-surface text-text-main font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>

          <div className="h-6 w-px bg-border mx-1 hidden md:block"></div>

          <button
            className="flex items-center gap-1.5 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0"
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
            <RefreshCw size={14} className="text-indigo-600" /> Auto-Balance
          </button>
          <button
            className="flex items-center gap-1.5 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0"
            onClick={handlePrint}
          >
            <FileText size={14} className="text-indigo-600" /> Print Report
          </button>
          <button
            className="flex items-center gap-1.5 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0"
            onClick={() => window.dispatchEvent(new Event('openGlobalSettings'))}
          >
            <Settings size={14} className="text-indigo-600" /> Settings
          </button>
          <button
            className="flex items-center gap-1.5 bg-surface text-text-main border border-border hover:bg-bg-color hover:shadow-sm px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0"
            onClick={() => setIsPrintModalOpen(true)}
          >
            <Printer size={14} className="text-indigo-600" /> Print Tickets
          </button>
          <button
            className="flex items-center gap-1.5 bg-indigo-600 text-white border-none hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ml-1 shrink-0"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <SummaryCards office={stats.office} />

      {/* Live Queue Overview */}
      <LiveQueueOverview
        liveWaitTimes={liveWaitTimes}
        waitingCounts={waitingCounts}
        servingTickets={servingTickets}
      />

      {/* Trend Chart */}
      <TicketsChartCard
        trend={stats.trend}
        trendStart={trendStart}
        trendEnd={trendEnd}
        onStartChange={setTrendStart}
        onEndChange={setTrendEnd}
      />

      {/* Advanced Analytics (collapsed by default) */}
      {stats.advanced && (
        <AdvancedAnalyticsSection
          advanced={stats.advanced}
          year={stats.office.year}
        />
      )}

      {/* Employee Statistics Table */}
      <EmployeeTable
        employees={stats.employees}
        year={stats.office.year}
        onEdit={setEditingUser}
      />

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

      <PrintTicketsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        config={printConfig}
        onConfigChange={setPrintConfig}
        onGenerate={() => {
          setIsPrintModalOpen(false);
          window.open(`/print-tickets?type=${printConfig.type}&start=${printConfig.startNumber}&qty=${printConfig.quantity}`, '_blank');
        }}
      />

      <GlobalPopup popupMessage={popupMessage} onClose={() => setPopupMessage(null)} />

    </div>
  );
}