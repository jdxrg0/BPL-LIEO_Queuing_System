import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api, socket } from '../api';

import AddEmployeeModal from '../components/Modals/AddEmployeeModal';
import EditUserModal from '../components/Modals/EditUserModal';
import OverviewTab from '../components/Admin/OverviewTab';
import LiveQueueTab from '../components/Admin/LiveQueueTab';
import AnalyticsTab from '../components/Admin/AnalyticsTab';
import StaffTab from '../components/Admin/StaffTab';
import PrintTicketsModal from '../components/Admin/PrintTicketsModal';
import GlobalPopup from '../components/Admin/GlobalPopup';

export default function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const [isModalOpen, setIsModalOpen] = useState(false);
    
  // Live queue operational data
  const [liveWaitTimes, setLiveWaitTimes] = useState<any>(null);
  const [waitingCounts, setWaitingCounts] = useState({ NW: 0, RNW: 0, R: 0 });
  const [waitingTickets, setWaitingTickets] = useState<any[]>([]);
  const [servingTickets, setServingTickets] = useState<any[]>([]);
  const [liveFlow, setLiveFlow] = useState<any>(null);

  // Selected user for EditUserModal
  const [editingUser, setEditingUser] = useState<any>(null);

  // Custom Popup Window instead of browser alerts
  const [popupMessage, setPopupMessage] = useState<any>(null);
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

  const filterYear = new Date().getFullYear();

  useEffect(() => {
    api.getSettings().then(s => {
      if (s?.websiteName) document.title = `${s.websiteName} | Admin Dashboard`;
    }).catch(() => {
      document.title = 'BPLO Queuing System | Admin Dashboard';
    });
  }, []);



  const fetchData = async () => {
    try {
      setFetchError(null);
      const statsData = await api.getStats(trendStart, trendEnd, filterYear);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch admin data', err);
      setFetchError('Failed to load dashboard data. Please try again.');
    }
  };

  const fetchLiveData = async () => {
    const [waitTimesRes, waitingRes, servingRes, flowRes] = await Promise.allSettled([
      api.getLiveWaitTimes(),
      api.getWaitingQueue(),
      api.getRecentCalled(),
      api.getLiveFlow()
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
      setWaitingTickets(waitingRes.value || []);
    }

    if (servingRes.status === 'fulfilled') {
      setServingTickets(servingRes.value || []);
    }

    if (flowRes && flowRes.status === 'fulfilled') {
      setLiveFlow(flowRes.value);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this waiting ticket?')) {
      try {
        await api.deleteTicket(ticketId);
        showPopup('Success', 'Ticket deleted successfully', 'success');
        fetchLiveData();
      } catch (err: any) {
        showPopup('Error', 'Failed to delete ticket', 'error');
      }
    }
  };

  const handleMarkNoShow = async (ticketId) => {
    if (window.confirm('Mark this currently serving ticket as No Show?')) {
      try {
        await api.updateStatus(ticketId, 'NO_SHOW');
        showPopup('Success', 'Ticket marked as No Show', 'success');
        fetchLiveData();
      } catch (err: any) {
        showPopup('Error', 'Failed to update ticket status', 'error');
      }
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
    socket.on('userOnlineStatus', (data) => {
      setStats(prev => {
        if (!prev || !prev.employees) return prev;
        return {
          ...prev,
          employees: prev.employees.map(emp => emp.id === data.userId ? { ...emp, isOnline: data.isOnline } : emp)
        };
      });
    });
    socket.on('userUpdated', (updatedUser) => {
      setStats(prev => {
        if (!prev || !prev.employees) return prev;
        return {
          ...prev,
          employees: prev.employees.map(emp => emp.id === updatedUser.id ? { ...emp, ...updatedUser } : emp)
        };
      });
    });

                                
    const onPrintReport = () => window.open(`/print-stats?startDate=${trendStart}&endDate=${trendEnd}&year=${filterYear}`, '_blank');
    (window as any).doPrintReport = onPrintReport;

    return () => {
      clearInterval(interval);
      socket.off('queueUpdated', handleUpdate);
      socket.off('ticketCreated', handleUpdate);
      socket.off('ticketCalled', handleUpdate);
      socket.off('userOnlineStatus');
      socket.off('userUpdated');
      delete (window as any).doPrintReport;
    };
  }, [trendStart, trendEnd, filterYear]);



  const originalUser = useMemo(() => {
    return stats?.employees.find(u => u?.id === editingUser?.id);
  }, [stats, editingUser?.id]);

  if (fetchError) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-danger/10 text-danger p-6 rounded-xl border border-danger/20 max-w-md w-full">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="mb-6">{fetchError}</p>
        <button onClick={() => fetchData()} className="btn btn-primary px-6 py-2 rounded-lg font-bold">
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-text-muted">Loading Dashboard...</h2>
      </div>
    </div>
  );

  
  const headerControlsElement = document.getElementById('global-header-controls');
  const datePickerPortal = headerControlsElement ? createPortal(
    <div className="flex items-center bg-bg-color p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto animate-fade-in mr-4">
      <div className="flex items-center bg-surface px-2 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex-1 sm:flex-none">
        <Calendar size={14} className="text-text-muted mr-2" />
        <input 
          type="date" 
          value={trendStart} 
          onChange={(e) => setTrendStart(e.target.value)} 
          className="bg-transparent text-xs font-bold text-text-main outline-none border-none cursor-pointer w-full"
        />
      </div>
      <span className="text-text-muted font-bold text-xs px-2">&rarr;</span>
      <div className="flex items-center bg-surface px-2 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex-1 sm:flex-none">
        <Calendar size={14} className="text-text-muted mr-2" />
        <input 
          type="date" 
          value={trendEnd} 
          onChange={(e) => setTrendEnd(e.target.value)} 
          className="bg-transparent text-xs font-bold text-text-main outline-none border-none cursor-pointer w-full"
        />
      </div>
    </div>,
    headerControlsElement
  ) : null;

  return (
    <>
      {datePickerPortal}
    <div className="container py-4 max-w-[1400px] mx-auto px-6 lg:px-12">

      {/* Tab Content */}
      <div key={activeTab} className="animate-tab-enter">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            trendStart={trendStart}
            trendEnd={trendEnd}
            onStartChange={setTrendStart}
            onEndChange={setTrendEnd}
          />
        )}

        {activeTab === 'live' && (
          <LiveQueueTab
            liveWaitTimes={liveWaitTimes}
            waitingCounts={waitingCounts}
            servingTickets={servingTickets}
            waitingTickets={waitingTickets}
            employees={stats?.employees || []}
            liveFlow={liveFlow}
            onCancelTicket={handleCancelTicket}
            onMarkNoShow={handleMarkNoShow}
          />
        )}

        {activeTab === 'analytics' && stats.advanced && (
          <AnalyticsTab
            advanced={stats.advanced}
            year={stats.office.year} office={stats.office} trend={stats.trend}
            
            
          />
        )}

        {activeTab === 'staff' && (
          <StaffTab
            employees={stats.employees}
            year={stats.office.year}
            
            
            onEdit={setEditingUser}
            onAdd={() => setIsModalOpen(true)}
          />
        )}
      </div>

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

      

      <GlobalPopup popupMessage={popupMessage} onClose={() => setPopupMessage(null)} />

    </div>
    </>
  );
}