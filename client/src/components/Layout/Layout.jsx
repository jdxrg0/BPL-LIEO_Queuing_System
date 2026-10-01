import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Monitor, FileText, Printer, PieChart, Activity, TrendingUp, Users, Tablet, User, Settings, LogOut, LayoutDashboard, Shield, Landmark, Menu, Plus, FilePlus, RefreshCw, Archive, Check, ChevronDown, X, AlertTriangle } from 'lucide-react';
import HoldButton from '../Buttons/HoldButton';
import ThemeToggle from '../Theme/ThemeToggle';
import { api, socket } from '../../api';
import ModalWrapper from '../Modals/ModalWrapper';
import SettingsModal from '../Modals/SettingsModal';
import PrintTicketsModal from '../Admin/PrintTicketsModal';
import GlobalPopup from '../Admin/GlobalPopup';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: <PieChart size={18} /> },
  { id: 'live', label: 'Live Queue', icon: <Activity size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} /> },
  { id: 'staff', label: 'Staff & Roles', icon: <Users size={18} /> }
];

export default function Layout({ user, onLogout }) {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({ type: 'N', startNumber: '1', quantity: 1, format: 'A4' });
  const [popupMessage, setPopupMessage] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === null) return true; // Default to collapsed
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [services, setServices] = useState([]);
  const [latestTicket, setLatestTicket] = useState(null);
  const profileRef = useRef(null);
  const [screens, setScreens] = useState([]);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [selectedScreenForConfig, setSelectedScreenForConfig] = useState(null);
  const [totalMonitors, setTotalMonitors] = useState(1);
  const [monitorIndex, setMonitorIndex] = useState(1);
  const [isWaitingForFullscreen, setIsWaitingForFullscreen] = useState(false);

  // Global Settings
  const [settings, setSettings] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState(() => {
    return localStorage.getItem('lastSettingsTab') || (user?.role === 'ADMIN' ? 'general' : 'account');
  });

  useEffect(() => {
    localStorage.setItem('lastSettingsTab', settingsTab);
  }, [settingsTab]);
  const [settingsForm, setSettingsForm] = useState({ websiteName: '', logoBase64: '', autoBalanceThreshold: 15, slaThreshold: 15, autoAdaptive: false });
  const logoInputRef = useRef(null);
  
  // Account Settings
  const [accountForm, setAccountForm] = useState({ name: user?.name || '', profilePictureBase64: user?.profilePictureBase64 || '' });
  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetFeedbackModal, setResetFeedbackModal] = useState({ show: false, title: '', message: '', type: 'success' });
  const profilePicInputRef = useRef(null);

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState(null);
  const [priorityGroups, setPriorityGroups] = useState([]);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', label: '', shortLabel: '', weight: 1, slaThreshold: '' });
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupForm, setEditGroupForm] = useState({ label: '', shortLabel: '', weight: 1, slaThreshold: '', isActive: true });

  useEffect(() => {
    if (user) {
      setAccountForm(prev => ({
        ...prev,
        name: user.name || '',
        profilePictureBase64: user.profilePictureBase64 || ''
      }));
    }
  }, [user]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bc = new BroadcastChannel('tv_display');
    bc.onmessage = (event) => {
      if (event.data === 'fullscreen_started') {
        setIsWaitingForFullscreen(false);
      }
    };
    return () => bc.close();
  }, []);

  const fetchLayoutData = async (retryCount = 0) => {
    try {
      await Promise.all([
        api.getServices().then(setServices),
        api.getSettings().then(s => {
          setSettings(s);
          setSettingsForm({ 
            websiteName: s.websiteName || '', 
            logoBase64: s.logoBase64 || '', 
            autoBalanceThreshold: s.autoBalanceThreshold || 15,
            slaThreshold: s.slaThreshold || 15,
            zipperRatio: s.zipperRatio || 3,
            agingRate: s.agingRate || 0.1,
            skipLimit: s.skipLimit || 5,
            autoAdaptive: s.autoAdaptive || false
          });
        }),
        api.getPriorityGroups().then(setPriorityGroups)
      ]);
      setIsLoading(false);
    } catch (err) {
      console.error('Layout fetch failed, retrying...', err);
      if (retryCount < 3) {
        setTimeout(() => fetchLayoutData(retryCount + 1), 1500);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLayoutData();

    socket.on('settingsUpdated', (s) => {
      setSettings(s);
      setSettingsForm(prev => ({ 
        ...prev, 
        websiteName: s.websiteName || '', 
        logoBase64: s.logoBase64 || '', 
        autoBalanceThreshold: s.autoBalanceThreshold || 15,
        slaThreshold: s.slaThreshold || 15,
        zipperRatio: s.zipperRatio || 3,
        agingRate: s.agingRate || 0.1,
        skipLimit: s.skipLimit || 5,
        autoAdaptive: s.autoAdaptive || false
      }));
    });

    socket.on('priorityGroupsUpdated', () => {
      api.getPriorityGroups().then(setPriorityGroups).catch(console.error);
    });

    return () => {
      socket.off('settingsUpdated');
      socket.off('priorityGroupsUpdated');
    };
  }, []);

  useEffect(() => {
    const openGlobalSettings = () => setShowSettingsModal(true);
    window.addEventListener('openGlobalSettings', openGlobalSettings);
    return () => window.removeEventListener('openGlobalSettings', openGlobalSettings);
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
      window.__SITE_NAME__ = settings.websiteName;
    }
  }, [settings?.logoBase64, settings?.websiteName]);

  const handleDetectScreens = async (e) => {
    e.preventDefault();
    try {
      if ('getScreenDetails' in window) {
        const details = await window.getScreenDetails();
        setScreens([...details.screens]);
        setShowScreenModal(true);
      } else {
        window.open('/display', '_blank');
      }
    } catch (err) {
      console.warn("Could not get screen details:", err);
      window.open('/display', '_blank');
    }
  };

  const projectToScreen = () => {
    if (!selectedScreenForConfig) return;
    
    window.open(
      `/display?m=${monitorIndex}&t=${totalMonitors}`,
      '_blank',
      `left=${selectedScreenForConfig.left},top=${selectedScreenForConfig.top},width=${selectedScreenForConfig.width},height=${selectedScreenForConfig.height},fullscreen=yes`
    );
    
    setMonitorIndex(prev => prev >= totalMonitors ? 1 : prev + 1);
    setShowScreenModal(false);
    setSelectedScreenForConfig(null);
    setIsWaitingForFullscreen(true);
  };

  const handleGenerateTicketClick = (serviceId) => {
    setPendingServiceId(serviceId);
    setShowPriorityModal(true);
  };

  const executeGenerateTicket = async (priorityType = 'REGULAR') => {
    try {
      setShowPriorityModal(false);
      const ticket = await api.generateTicket(pendingServiceId, user.id, priorityType);
      setLatestTicket(ticket);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const getServiceIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('renew')) return <RefreshCw size={18} />;
    if (lower.includes('new')) return <FilePlus size={18} />;
    if (lower.includes('retire')) return <Archive size={18} />;
    return <Plus size={18} />;
  };

  const renderCateredTags = () => {
    if (!user) return null;
    const tags = [];

    if (user.caterNew) {
      tags.push(<span key="nw" className="text-emerald-600 dark:text-emerald-400">NW</span>);
    }
    if (user.caterRenewal) {
      tags.push(<span key="rnw" className="text-sky-600 dark:text-sky-400">RNW</span>);
    }
    if (user.caterRetirement) {
      tags.push(<span key="r" className="text-rose-600 dark:text-rose-400">R</span>);
    }

    if (tags.length === 0) return <span className="text-slate-400">None</span>;

    return (
      <div className="flex gap-1">
        {tags.map((tag, i) => (
          <React.Fragment key={i}>
            {tag}
            {i < tags.length - 1 && <span className="text-slate-300 dark:text-slate-600">,</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const getServiceColor = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('renew')) return { bg: 'var(--color-primary)', main: '#ffffff' }; 
    if (lower.includes('new')) return { bg: 'var(--color-success)', main: '#ffffff' }; 
    if (lower.includes('retire')) return { bg: 'var(--color-danger)', main: '#ffffff' }; 
    return { bg: 'var(--color-text-muted)', main: '#ffffff' }; 
  };

  const allowedServices = services;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-color text-text-muted animate-pulse">
        <h2 className="text-xl font-semibold">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-bg-color overflow-hidden">
      
      {/* Sidebar with Gradient & Glassmorphism */}
      <aside className={`
        ${isSidebarCollapsed ? 'w-[88px]' : 'w-[280px]'}
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        bg-surface border-r border-border
        flex flex-col py-6 px-4 z-40 overflow-hidden relative shadow-soft
      `}>
        
        {/* Subtle decorative blob */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50 dark:from-indigo-500/10 to-transparent opacity-50 pointer-events-none"></div>

        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center gap-3 mb-8 relative z-10">
          <div className={`
            ${isSidebarCollapsed ? 'w-10 h-10 rounded-xl' : 'w-14 h-14 rounded-2xl'}
            flex items-center justify-center text-white shrink-0
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${settings?.logoBase64 ? 'bg-transparent shadow-none' : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30'}
          `}>
            {settings?.logoBase64 ? (
              <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            ) : (
              <Landmark size={isSidebarCollapsed ? 20 : 28} strokeWidth={2.5} className="transition-all duration-300" />
            )}
          </div>
          <div className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex flex-col items-center">
            <h2 className={`text-text-main m-0 font-extrabold tracking-tight leading-tight whitespace-normal break-words text-center transition-all duration-300 ${isSidebarCollapsed ? 'text-[11px] max-w-[70px] mt-1' : 'text-lg max-w-[220px]'}`}>
              {(() => {
                const name = settings?.websiteName || 'BPLO System';
                const parts = name.split(' ');
                if (parts.length === 1) return name;
                return (
                  <>
                    {parts[0]} <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">{parts.slice(1).join(' ')}</span>
                  </>
                );
              })()}
            </h2>
          </div>
        </div>

        <div className="mb-8 relative z-10">
          <div className={`
            font-bold text-text-muted uppercase mb-3
            transition-all duration-300 overflow-hidden whitespace-nowrap
            ${isSidebarCollapsed ? 'text-center text-[7px] tracking-wider' : 'pl-4 text-[10px] tracking-widest'}
          `}>
            Navigation
          </div>
          
          <nav className="flex flex-col gap-2">
            <Link 
              to="/staff" 
              title={isSidebarCollapsed ? "Staff Dashboard" : ""}
              className={`
                flex items-center gap-4 py-3 px-4 rounded-xl no-underline font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap group
                ${location.pathname === '/staff' 
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                  : 'text-text-muted hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'}
              `}
            >
              <div className="w-6 flex justify-center shrink-0 text-emerald-500 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={isSidebarCollapsed ? 24 : 20} className="transition-all duration-300" />
              </div>
              <span className={`
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isSidebarCollapsed ? 'opacity-0 max-w-0 -translate-x-2' : 'opacity-100 max-w-[200px] translate-x-0'}
              `}>
                Staff Dashboard
              </span>
            </Link>
            
            {user?.role === 'ADMIN' && (
              <>
              <Link 
                to="/admin" 
                title={isSidebarCollapsed ? "Admin Dashboard" : ""}
                className={`
                  flex items-center gap-4 py-3 px-4 rounded-xl no-underline font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap group
                  ${location.pathname === '/admin' 
                    ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm' 
                    : 'text-text-muted hover:bg-amber-50/50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'}
                `}
              >
                <div className="w-6 flex justify-center shrink-0 text-amber-500 group-hover:scale-110 transition-transform">
                  <Shield size={isSidebarCollapsed ? 24 : 20} className="transition-all duration-300" />
                </div>
                <span className={`
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${isSidebarCollapsed ? 'opacity-0 max-w-0 -translate-x-2' : 'opacity-100 max-w-[200px] translate-x-0'}
                `}>
                  Admin Dashboard
                </span>
              </Link>
              
              {/* Admin Sub-navigation (Playful Accordion) */}
              <div 
                className={`grid transition-all duration-300 ease-out ${location.pathname === '/admin' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className={`flex flex-col gap-2 mt-2 mb-3 transition-all ${isSidebarCollapsed ? 'items-center' : 'ml-10 border-l-2 border-amber-200 dark:border-amber-900/50 pl-3'}`}>
                    {ADMIN_TABS.map((tab, index) => {
                      const searchParams = new URLSearchParams(location.search);
                      const currentTab = searchParams.get('tab') || 'overview';
                      const isActive = currentTab === tab.id;
                      const isOpened = location.pathname === '/admin';
                      return (
                        <Link
                          key={tab.id}
                          to={`/admin?tab=${tab.id}`}
                          title={isSidebarCollapsed ? tab.label : ""}
                          style={{ transitionDelay: isOpened ? `${index * 60}ms` : '0ms' }}
                          className={`flex items-center gap-3 rounded-xl text-xs font-bold no-underline transition-all duration-300 ease-out
                            ${isActive ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/20 shadow-sm' : 'text-text-muted hover:text-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-500/10'} 
                            ${isSidebarCollapsed ? 'justify-center w-10 h-10 p-0' : 'py-2.5 px-3'}
                            ${isOpened ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-8 opacity-0 scale-75'}
                          `}
                        >
                          <div className={`shrink-0 flex items-center justify-center transition-transform duration-300 ease-out ${isActive ? 'scale-110' : 'scale-100'}`}>
                            {tab.icon}
                          </div>
                          <span className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'opacity-0 max-w-0 hidden' : 'opacity-100 max-w-[200px]'}`}>
                            {tab.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Navigation Bar - Now properly responsive using Flexbox with wrapping prevention */}
        <header className="h-[64px] shrink-0 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-30 shadow-sm">
          
          {/* Left Actions */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-[200px]">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="bg-transparent border-none cursor-pointer text-text-muted p-2 flex items-center rounded-xl hover:bg-slate-100 dark:bg-slate-800 hover:text-text-main transition-colors"
              title="Toggle Sidebar"
            >
              <Menu size={24} />
            </button>

            {location.pathname === '/staff' && user?.role !== 'STAFF' && allowedServices.length > 0 && (
              <div className="hidden md:flex items-center gap-3 border-l border-border pl-6">
                {allowedServices.map(s => (
                  <div key={s.id} className="hover:-translate-y-0.5 transition-transform">
                    <button 
                      onClick={() => handleGenerateTicketClick(s.id)}
                      title={`Generate ${s.name} ticket`}
                      className="flex items-center justify-center rounded-full cursor-pointer border-none transition-transform hover:scale-110 active:scale-95"
                      style={{ 
                        width: 28, height: 28, 
                        background: getServiceColor(s.name).bg, 
                        color: getServiceColor(s.name).main 
                      }}
                    >
                      {getServiceIcon(s.name)}
                    </button>
                  </div>
                ))}
                
                {latestTicket && (() => {
                  const latestColor = getServiceColor(latestTicket.service.name);
                  return (
                    <div 
                      className="ml-2 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 animate-slide-up shadow-sm"
                      style={{ background: latestColor.bg, color: latestColor.main }}
                    >
                      <Check size={16} strokeWidth={3} />
                      {latestTicket.number}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Center (Clock and Date) - Hide on very small screens to prevent overlap */}
          <div className="hidden lg:flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[1.35rem] font-extrabold text-text-main tracking-tight leading-tight">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[0.75rem] font-bold text-text-muted uppercase tracking-widest mt-0.5">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 min-w-[200px]">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-1 sm:gap-2 pr-4 sm:pr-5 border-r border-border">
                <button 
                  onClick={() => {
                  if (window.doPrintReport) {
                    window.doPrintReport();
                  } else {
                    const today = new Date();
                    const start = new Date(today.getFullYear(), today.getMonth(), 1);
                    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    const pad = n => n.toString().padStart(2, '0');
                    const sStr = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`;
                    const eStr = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`;
                    window.open(`/print-stats?startDate=${sStr}&endDate=${eStr}&year=${today.getFullYear()}`, '_blank');
                  }
                }}
                  title="Print Report"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all bg-transparent border-none cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  <FileText size={20} />
                </button>
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  title="Print Tickets"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all bg-transparent border-none cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  <Printer size={20} />
                </button>
                <button 
                  onClick={handleDetectScreens}
                  title="Project TV Display"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all bg-transparent border-none cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  <Monitor size={20} />
                </button>
                <button 
                  onClick={() => {
                  api.autoBalanceCounters().then(res => {
                    if (res.changes && res.changes.length > 0) {
                      const details = res.changes.map(c => '- ' + c).join('\n');
                      setPopupMessage({ title: 'Auto-Balance Report', message: res.message + '\n\n' + details, type: 'success' });
                    } else {
                      setPopupMessage({ title: 'Success', message: res.message, type: 'success' });
                    }
                  }).catch(() => setPopupMessage({ title: 'Error', message: 'Failed to auto-balance counters.', type: 'error' }));
                }}
                  title="Auto-Balance Counters"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all bg-transparent border-none cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  <RefreshCw size={20} />
                </button>
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  title="Settings"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all bg-transparent border-none cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                  <Settings size={20} />
                </button>
              </div>
            )}
            
            <ThemeToggle />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`
                  flex items-center gap-3 border-none py-1.5 pl-3 pr-1.5 rounded-2xl cursor-pointer transition-all
                  ${isProfileOpen ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-indigo-500/20' : 'bg-transparent hover:bg-bg-color'}
                `}
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="font-bold text-sm text-text-main leading-tight">{user?.name}</span>
                  <span className="text-[0.7rem] font-medium text-text-muted mt-0.5 flex justify-end items-center gap-1.5">
                    {user?.counter?.name ? user.counter.name : 'No Window'}
                    {user?.counter?.name && <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>}
                    <span className="font-bold tracking-tight">{renderCateredTags()}</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center overflow-hidden shadow-sm">
                  {user?.profilePictureBase64 ? (
                    <img src={user.profilePictureBase64} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute top-[calc(100%+0.5rem)] right-0 w-[240px] bg-surface border border-border rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-2 z-[100] animate-slide-up origin-top-right">
                  <div className="px-4 py-3 mb-2 border-b border-slate-100">
                    <div className="text-xs text-text-muted font-semibold mb-1">Signed in as</div>
                    <div className="font-bold text-sm truncate text-text-main">@{user?.username}</div>
                    <div className="text-xs text-indigo-600 font-extrabold mt-1 tracking-wider">{user?.role}</div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsProfileOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-transparent border-none text-left cursor-pointer text-danger rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Outlet Area */}
        <main className="flex-1 overflow-y-auto bg-bg-color/50">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Screen Selection Modal */}
      <ModalWrapper isOpen={showScreenModal} zIndex={9999}>
        <div className="bg-surface p-8 rounded-3xl w-[450px] shadow-float border border-white/20">
            {!selectedScreenForConfig ? (
              <>
                <h3 className="m-0 mb-6 text-xl font-extrabold text-text-main">Select Display to Project</h3>
                <div className="flex flex-col gap-3">
                  {screens.map((screen, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedScreenForConfig(screen)}
                      className={`
                        p-4 flex justify-between items-center border rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md
                        ${screen.isInternal ? 'border-border bg-bg-color' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300'}
                      `}
                    >
                      <div className="text-left">
                        <strong className="block text-text-main font-bold mb-1">{screen.label || `Display ${idx + 1}`}</strong>
                        <span className="text-xs text-text-muted font-medium">
                          {Math.round(screen.width * screen.devicePixelRatio)}x{Math.round(screen.height * screen.devicePixelRatio)} {screen.isInternal ? '(Primary/Internal)' : '(External TV)'}
                        </span>
                      </div>
                      <Monitor size={24} className={screen.isInternal ? 'text-slate-400' : 'text-indigo-600'} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowScreenModal(false)} className="w-full p-4 mt-6 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              </>
            ) : (
              <>
                <h3 className="m-0 mb-2 text-xl font-extrabold text-text-main">Configure Assignment</h3>
                <p className="text-sm text-text-muted mb-6">
                  You are setting up <strong className="text-indigo-600">{selectedScreenForConfig.label || 'this display'}</strong>.
                </p>

                <div className="flex gap-4 mb-6 p-4 bg-bg-color rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Total Monitors</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={totalMonitors} 
                      onChange={e => setTotalMonitors(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-3 rounded-xl border border-border bg-surface text-text-main font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Monitor #</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={monitorIndex} 
                      onChange={e => setMonitorIndex(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-3 rounded-xl border border-border bg-surface text-text-main font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelectedScreenForConfig(null)} className="flex-[1] p-4 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Back</button>
                  <button onClick={projectToScreen} className="flex-[2] p-4 bg-indigo-600 text-white font-bold border-none rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">Start Projecting</button>
                </div>
              </>
            )}
        </div>
      </ModalWrapper>

      {/* Waiting for TV Fullscreen Overlay */}
      <ModalWrapper isOpen={isWaitingForFullscreen} zIndex={99999} bg="rgba(15,23,42,0.9)">
        <div className="flex flex-col items-center justify-center text-center animate-slide-up">
          <Monitor size={64} className="text-indigo-400 mb-6 animate-float" />
          <h1 className="text-white text-4xl font-extrabold mb-4 tracking-tight">Waiting for TV Display...</h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto font-medium leading-relaxed">
            Please click or press the Spacebar on the newly opened TV window to activate Fullscreen and Audio.
          </p>
          <button 
            onClick={() => setIsWaitingForFullscreen(false)} 
            className="mt-10 px-8 py-4 bg-surface/10 hover:bg-surface/20 text-white border-none rounded-xl cursor-pointer font-bold transition-all backdrop-blur-sm"
          >
            Cancel Waiting
          </button>
        </div>
      </ModalWrapper>

            {user?.role === 'ADMIN' && <PrintTicketsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        config={printConfig}
        onConfigChange={setPrintConfig}
        onGenerate={async () => {
          setIsPrintModalOpen(false);
          window.open(`/print-tickets?type=${printConfig.type}&start=${printConfig.startNumber}&qty=${printConfig.quantity}&format=${printConfig.format || 'A4'}`, '_blank');
          
          try {
            const servicesRes = await api.getServices();
            const services = servicesRes || [];
            const service = services.find(s => s.prefix === printConfig.type);
            
            if (service) {
              const tickets = [];
              const d = new Date();
              const dateStr = String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + String(d.getFullYear()).slice(-2);
              
              for (let i = 0; i < printConfig.quantity; i++) {
                const num = String(Number(printConfig.startNumber) + i).padStart(3, '0');
                tickets.push({
                  number: `${printConfig.type}${dateStr}${num}`,
                  type: 'REGULAR',
                  status: 'WAITING',
                  serviceId: service.id
                });
              }
              await api.bulkGenerateTickets(tickets);
            }
          } catch (err) {
            console.error('Failed to sync bulk tickets to DB', err);
          }
        }}
      />}
      <GlobalPopup popupMessage={popupMessage} onClose={() => setPopupMessage(null)} />
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        settings={settings}
        priorityGroups={priorityGroups}
        onChangePassword={() => { setShowSettingsModal(false); setShowChangePasswordModal(true); }}
        onResetDataRequest={() => { setResetConfirmText(''); setShowResetConfirmModal(true); }}
      />

      {/* Change Password Modal (Minimal refactor for aesthetics) */}
      <ModalWrapper isOpen={showChangePasswordModal} zIndex={1100}>
        <div className="bg-surface p-8 rounded-3xl w-[400px] shadow-float border border-white/20 animate-slide-up">
          <h3 className="m-0 mb-6 text-xl font-extrabold text-text-main">Change Password</h3>
          <div className="flex flex-col gap-5">
            {passwordFeedback.message && (
              <div className={`p-3 rounded-xl border flex items-center gap-3 text-sm font-bold animate-slide-up ${
                passwordFeedback.type === 'error' 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              }`}>
                {passwordFeedback.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
                {passwordFeedback.message}
              </div>
            )}
            <div>
              <label className="block mb-1 font-bold text-sm text-text-main uppercase tracking-wider">Current Password</label>
              <input type="password" value={passwordChange.currentPassword} onChange={e => setPasswordChange({...passwordChange, currentPassword: e.target.value})} className="w-full p-3 rounded-xl border border-border bg-surface text-text-main outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div>
              <label className="block mb-1 font-bold text-sm text-text-main uppercase tracking-wider">New Password</label>
              <input type="password" value={passwordChange.newPassword} onChange={e => setPasswordChange({...passwordChange, newPassword: e.target.value})} className="w-full p-3 rounded-xl border border-border bg-surface text-text-main outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div>
              <label className="block mb-1 font-bold text-sm text-text-main uppercase tracking-wider">Confirm New Password</label>
              <input type="password" value={passwordChange.confirmPassword} onChange={e => setPasswordChange({...passwordChange, confirmPassword: e.target.value})} className="w-full p-3 rounded-xl border border-border bg-surface text-text-main outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowChangePasswordModal(false); setShowSettingsModal(true); setPasswordFeedback({type: '', message: ''}); }} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  setPasswordFeedback({ type: '', message: '' });
                  if (passwordChange.newPassword !== passwordChange.confirmPassword) {
                    return setPasswordFeedback({ type: 'error', message: "Passwords don't match" });
                  }
                  try {
                    await api.changePassword(user.id, { currentPassword: passwordChange.currentPassword, newPassword: passwordChange.newPassword });
                    setPasswordFeedback({ type: 'success', message: "Password changed successfully" });
                    setTimeout(() => {
                      setShowChangePasswordModal(false);
                      setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setShowSettingsModal(true);
                      setPasswordFeedback({ type: '', message: '' });
                    }, 1500);
                  } catch (err) {
                    setPasswordFeedback({ type: 'error', message: err.message || "Failed to change password" });
                  }
                }}
                className="flex-1 p-3 bg-indigo-600 text-white font-bold border-none rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
          <div className="modal-card bg-surface rounded-xl w-full max-w-[500px] flex flex-col overflow-hidden shadow-2xl p-8 text-center animate-slide-up">
            <h2 className="mb-6 text-text-main font-bold text-2xl">Select Priority Group</h2>
            
            <div className="flex flex-col gap-4">
              {priorityGroups.filter(g => g.isActive).map(group => (
                <button 
                  key={group.id} 
                  onClick={() => executeGenerateTicket(group.name)} 
                  className="btn bg-primary text-white p-4 text-lg rounded-lg font-semibold hover:bg-primary-hover shadow-sm"
                >
                  {group.label}
                </button>
              ))}
              
              <div className="my-2 border-t border-border"></div>
              
              <button onClick={() => executeGenerateTicket('REGULAR')} className="btn bg-surface border-2 border-border text-text-main p-4 text-lg rounded-lg font-semibold hover:bg-bg-color shadow-sm">None / Regular</button>
            </div>
            
            <button onClick={() => setShowPriorityModal(false)} className="btn mt-6 bg-transparent text-text-muted border-none cursor-pointer hover:text-text-main text-base font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-[1100] p-4">
          <div className="modal-card bg-surface rounded-3xl w-full max-w-[450px] shadow-float border border-border p-8 flex flex-col animate-slide-up">
            <h3 className="m-0 mb-3 text-2xl font-extrabold text-danger tracking-tight">Confirm Data Reset</h3>
            <p className="text-text-muted text-sm font-medium mb-6 mt-0 leading-relaxed">
              This action is irreversible and will permanently delete all tickets. To confirm, please type <strong>CONFIRM</strong> below.
            </p>
            <input 
              type="text" 
              placeholder="CONFIRM"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-surface text-text-main text-base outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all font-bold tracking-widest text-center uppercase mb-6"
            />
            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => { setShowResetConfirmModal(false); setShowSettingsModal(true); }}
                className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (resetConfirmText !== 'CONFIRM') {
                    setResetFeedbackModal({ show: true, title: 'Error', message: 'You must type CONFIRM to proceed.', type: 'error' });
                    return;
                  }
                  try {
                    await api.resetData();
                    setShowResetConfirmModal(false);
                    setShowSettingsModal(false);
                    setResetFeedbackModal({ show: true, title: 'Success', message: 'All data has been successfully reset.', type: 'success' });
                  } catch (err) {
                    setResetFeedbackModal({ show: true, title: 'Error', message: 'Failed to reset data.', type: 'error' });
                  }
                }}
                disabled={resetConfirmText !== 'CONFIRM'}
                className={`flex-1 p-3 font-bold border-none rounded-xl cursor-pointer transition-all ${resetConfirmText === 'CONFIRM' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 hover:-translate-y-0.5' : 'bg-rose-100 text-rose-400 cursor-not-allowed'}`}
              >
                Permanently Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Feedback Modal */}
      {resetFeedbackModal.show && (
        <div className="modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-[1200] p-4">
          <div className="modal-card bg-surface rounded-3xl w-full max-w-[400px] shadow-float p-8 flex flex-col items-center text-center animate-slide-up border border-border">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${resetFeedbackModal.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {resetFeedbackModal.type === 'success' ? <Check size={32} strokeWidth={3} /> : <X size={32} strokeWidth={3} />}
            </div>
            <h3 className="m-0 mb-3 text-2xl font-extrabold text-text-main tracking-tight">{resetFeedbackModal.title}</h3>
            <p className="text-text-muted text-sm font-medium mb-8 mt-0 leading-relaxed max-w-[280px]">
              {resetFeedbackModal.message}
            </p>
            <button 
              onClick={() => setResetFeedbackModal({ show: false, title: '', message: '', type: 'success' })}
              className={`w-full p-4 font-bold border-none rounded-xl cursor-pointer transition-all ${resetFeedbackModal.type === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700' : 'bg-slate-100 text-text-main hover:bg-slate-200'}`}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


















