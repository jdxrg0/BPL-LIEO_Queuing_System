import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Monitor, Tablet, User, Settings, LogOut, LayoutDashboard, Shield, Landmark, Menu, Plus, FilePlus, RefreshCw, Archive, Check, ChevronDown } from 'lucide-react';
import HoldButton from '../Buttons/HoldButton';
import ThemeToggle from '../Theme/ThemeToggle';
import { api, socket } from '../../api';
import ModalWrapper from '../Modals/ModalWrapper';

export default function Layout({ user, onLogout }) {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
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
  const [settingsForm, setSettingsForm] = useState({ websiteName: '', logoBase64: '' });
  const logoInputRef = useRef(null);
  
  // Account Settings
  const [accountForm, setAccountForm] = useState({ name: user?.name || '', profilePictureBase64: user?.profilePictureBase64 || '' });
  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const profilePicInputRef = useRef(null);

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

  useEffect(() => {
    Promise.all([
      api.getServices().then(setServices),
      api.getSettings().then(s => {
        setSettings(s);
        setSettingsForm({ websiteName: s.websiteName || '', logoBase64: s.logoBase64 || '' });
      })
    ])
    .catch(console.error)
    .finally(() => setIsLoading(false));

    socket.on('settingsUpdated', (s) => {
      setSettings(s);
      setSettingsForm(prev => ({ ...prev, websiteName: s.websiteName || '', logoBase64: s.logoBase64 || '' }));
    });

    return () => socket.off('settingsUpdated');
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
      document.title = settings.websiteName;
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

  const handleGenerateTicket = async (serviceId) => {
    try {
      const ticket = await api.generateTicket(serviceId, user.id);
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

  const getServiceColor = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('renew')) return { bg: 'var(--color-primary)', main: '#ffffff' }; 
    if (lower.includes('new')) return { bg: 'var(--color-success)', main: '#ffffff' }; 
    if (lower.includes('retire')) return { bg: 'var(--color-danger)', main: '#ffffff' }; 
    return { bg: 'var(--color-text-muted)', main: '#ffffff' }; 
  };

  const allowedServices = services.filter(s => {
    const lower = s.name.toLowerCase();
    if (lower.includes('renew') && user?.caterRenewal) return true;
    if (lower.includes('new') && !lower.includes('renew') && user?.caterNew) return true;
    if (lower.includes('retire') && user?.caterRetirement) return true;
    return false;
  });

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
          <div className={`
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
            ${isSidebarCollapsed ? 'opacity-0 max-h-0 scale-90 -translate-y-2' : 'opacity-100 max-h-[100px] scale-100 translate-y-0'}
          `}>
            <h2 className="text-text-main m-0 text-lg font-extrabold tracking-tight leading-tight whitespace-normal break-words max-w-[220px]">
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
            text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 pl-4
            transition-all duration-300 overflow-hidden whitespace-nowrap
            ${isSidebarCollapsed ? 'opacity-0 max-h-0' : 'opacity-100 max-h-[20px]'}
          `}>
            Navigation
          </div>
          
          <nav className="flex flex-col gap-2">
            <Link 
              to="/staff" 
              title={isSidebarCollapsed ? "Staff Dashboard" : ""}
              className={`
                flex items-center gap-4 py-3 px-4 rounded-xl no-underline font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap
                ${location.pathname === '/staff' 
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                  : 'text-text-muted hover:bg-bg-color hover:text-text-main'}
              `}
            >
              <div className="w-6 flex justify-center shrink-0">
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
              <Link 
                to="/admin" 
                title={isSidebarCollapsed ? "Admin Dashboard" : ""}
                className={`
                  flex items-center gap-4 py-3 px-4 rounded-xl no-underline font-semibold transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${location.pathname === '/admin' 
                    ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                    : 'text-text-muted hover:bg-bg-color hover:text-text-main'}
                `}
              >
                <div className="w-6 flex justify-center shrink-0">
                  <Shield size={isSidebarCollapsed ? 24 : 20} className="transition-all duration-300" />
                </div>
                <span className={`
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${isSidebarCollapsed ? 'opacity-0 max-w-0 -translate-x-2' : 'opacity-100 max-w-[200px] translate-x-0'}
                `}>
                  Admin Dashboard
                </span>
              </Link>
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

            {location.pathname === '/staff' && allowedServices.length > 0 && (
              <div className="hidden md:flex items-center gap-3 border-l border-border pl-6">
                {allowedServices.map(s => (
                  <div key={s.id} className="hover:-translate-y-0.5 transition-transform">
                    <HoldButton 
                      onClick={() => handleGenerateTicket(s.id)}
                      icon={getServiceIcon(s.name)}
                      colorMap={getServiceColor(s.name)}
                      tooltip={`Hold to generate ${s.name} ticket`}
                      holdTime={500}
                    />
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
              <div className="flex items-center gap-2 pr-4 sm:pr-5 border-r border-border">
                <button 
                  onClick={handleDetectScreens}
                  title="Project TV Display"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all bg-transparent border-none cursor-pointer hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Monitor size={20} />
                </button>
                <Link 
                  to="/kiosk" 
                  target="_blank"
                  title="Open Kiosk"
                  className="flex items-center justify-center p-2.5 text-text-muted rounded-xl transition-all hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Tablet size={20} />
                </Link>
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
                  <span className="text-[0.7rem] font-medium text-text-muted mt-0.5">
                    {user?.counter?.name ? user.counter.name : 'No Window'}
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
                    onClick={() => { setIsProfileOpen(false); setShowSettingsModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-transparent border-none text-left cursor-pointer text-text-main rounded-xl text-sm font-semibold hover:bg-bg-color transition-colors"
                  >
                    <Settings size={18} className="text-text-muted" />
                    Settings
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
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

      {/* Global Settings Modal - Omitted styling rewrite for brevity if it's too long, but we'll apply basic classes */}
      <ModalWrapper isOpen={showSettingsModal} zIndex={1000}>
        <div className="bg-surface rounded-3xl w-[850px] h-[650px] flex overflow-hidden shadow-float border border-white/20">
            {/* Left Nav */}
            <div className="w-[260px] bg-bg-color border-r border-border p-6 flex flex-col">
              <h2 className="m-0 mb-8 text-2xl font-extrabold text-text-main tracking-tight">Settings</h2>
              <nav className="flex flex-col gap-2">
                <button 
                  onClick={() => setSettingsTab('account')}
                  className={`px-4 py-3 border-none rounded-xl text-left font-bold cursor-pointer transition-all ${settingsTab === 'account' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-transparent text-text-main hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Account Profile
                </button>
                {user?.role === 'ADMIN' && (
                  <>
                    <button 
                      onClick={() => setSettingsTab('general')}
                      className={`px-4 py-3 border-none rounded-xl text-left font-bold cursor-pointer transition-all ${settingsTab === 'general' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-transparent text-text-main hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      General & Appearance
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-10 flex flex-col overflow-y-auto">
              {settingsTab === 'general' && (
                <div className="animate-slide-up h-full flex flex-col">
                  <h3 className="m-0 mb-8 text-2xl font-extrabold text-text-main tracking-tight">General & Appearance</h3>
                  
                  <div className="mb-8">
                    <label className="block mb-2 font-bold text-sm text-text-main uppercase tracking-wider">Website Name</label>
                    <input 
                      type="text" 
                      value={settingsForm.websiteName}
                      onChange={e => setSettingsForm(prev => ({ ...prev, websiteName: e.target.value }))}
                      className="w-full p-4 rounded-xl border border-border bg-surface text-text-main text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                      placeholder="e.g. BPLO System"
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block mb-3 font-bold text-sm text-text-main uppercase tracking-wider">Custom Logo</label>
                    <div className="flex items-center gap-6">
                      <div className="w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden bg-indigo-50/50">
                        {settingsForm.logoBase64 ? (
                          <img src={settingsForm.logoBase64} alt="Preview" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-xs font-semibold text-indigo-300">No Logo</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={logoInputRef}
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setSettingsForm(prev => ({ ...prev, logoBase64: reader.result }));
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          onClick={() => logoInputRef.current?.click()}
                          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-text-main border-none rounded-xl cursor-pointer font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Upload Image
                        </button>
                        <button 
                          onClick={() => setSettingsForm(prev => ({ ...prev, logoBase64: '' }))}
                          className="px-5 py-2.5 bg-transparent text-danger border border-red-200 rounded-xl cursor-pointer font-bold hover:bg-red-50 transition-colors"
                        >
                          Remove Logo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setShowSettingsModal(false);
                        setSettingsForm({ websiteName: settings?.websiteName || '', logoBase64: settings?.logoBase64 || '' });
                      }}
                      className="px-6 py-3 bg-transparent text-text-muted border-none rounded-xl cursor-pointer font-bold hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await api.updateSettings(settingsForm);
                          setShowSettingsModal(false);
                        } catch (err) {
                          alert('Failed to save settings');
                        }
                      }}
                      className="px-6 py-3 bg-indigo-600 text-white border-none rounded-xl cursor-pointer font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'account' && (
                <div className="animate-slide-up h-full flex flex-col">
                  <h3 className="m-0 mb-8 text-2xl font-extrabold text-text-main tracking-tight">Account Profile</h3>
                  
                  <div className="mb-8 flex items-center gap-6">
                    <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-indigo-500/30">
                      {accountForm.profilePictureBase64 ? (
                        <img src={accountForm.profilePictureBase64} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={profilePicInputRef}
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setAccountForm(prev => ({ ...prev, profilePictureBase64: reader.result }));
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button 
                        onClick={() => profilePicInputRef.current?.click()}
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-text-main border-none rounded-xl cursor-pointer font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mb-2"
                      >
                        Upload Photo
                      </button>
                      <div className="text-xs text-text-muted font-medium">Recommended: Square image, max 2MB.</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block mb-2 font-bold text-sm text-text-main uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={accountForm.name}
                      onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-4 rounded-xl border border-border bg-surface text-text-main text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                    />
                  </div>

                  <div className="mb-8">
                    <button 
                      onClick={() => setShowChangePasswordModal(true)}
                      className="px-6 py-3 bg-surface text-text-main border border-border rounded-xl cursor-pointer font-bold hover:bg-bg-color transition-colors shadow-sm"
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button 
                      onClick={() => setShowSettingsModal(false)}
                      className="px-6 py-3 bg-transparent text-text-muted border-none rounded-xl cursor-pointer font-bold hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await api.updateUserProfile(user.id, accountForm);
                          setShowSettingsModal(false);
                        } catch (err) {
                          alert('Failed to save profile');
                        }
                      }}
                      className="px-6 py-3 bg-indigo-600 text-white border-none rounded-xl cursor-pointer font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </ModalWrapper>

      {/* Change Password Modal (Minimal refactor for aesthetics) */}
      <ModalWrapper isOpen={showChangePasswordModal} zIndex={1100}>
        <div className="bg-surface p-8 rounded-3xl w-[400px] shadow-float border border-white/20 animate-slide-up">
          <h3 className="m-0 mb-6 text-xl font-extrabold text-text-main">Change Password</h3>
          <div className="flex flex-col gap-5">
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
              <button onClick={() => setShowChangePasswordModal(false)} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  if (passwordChange.newPassword !== passwordChange.confirmPassword) return alert("Passwords don't match");
                  try {
                    await api.changePassword(user.id, { currentPassword: passwordChange.currentPassword, newPassword: passwordChange.newPassword });
                    setShowChangePasswordModal(false);
                    setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    alert("Password changed successfully");
                  } catch (err) {
                    alert(err.message || "Failed to change password");
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
    </div>
  );
}
