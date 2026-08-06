import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Monitor, Tablet, User, Settings, LogOut, LayoutDashboard, Shield, Landmark, Menu, Plus, FilePlus, RefreshCw, Archive, Check } from 'lucide-react';
import HoldButton from './HoldButton';
import ThemeToggle from './ThemeToggle';
import { api, socket } from '../api';
import ModalWrapper from './ModalWrapper';

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
    
    // Auto-increment the monitor index, but wrap back to 1 if we reach the max
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
    if (lower.includes('renew')) return { bg: '#dbeafe', main: '#2563eb' }; // Blue
    if (lower.includes('new')) return { bg: '#dcfce7', main: '#16a34a' }; // Green
    if (lower.includes('retire')) return { bg: '#fee2e2', main: '#dc2626' }; // Red
    return { bg: 'var(--bg-color)', main: '#475569' }; // Slate
  };

  // Filter services based on what the user is allowed to cater
  const allowedServices = services.filter(s => {
    const lower = s.name.toLowerCase();
    if (lower.includes('renew') && user?.caterRenewal) return true;
    if (lower.includes('new') && !lower.includes('renew') && user?.caterNew) return true;
    if (lower.includes('retire') && user?.caterRetirement) return true;
    return false;
  });

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Close dropdown on navigation
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  const navLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 500,
    color: location.pathname === path ? 'var(--primary)' : 'var(--text-muted)',
    background: location.pathname === path ? '#eff6ff' : 'transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: '0.5rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  });

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-muted)' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-color)', overflow: 'hidden' }}>
      
      {/* Left Sidebar */}
      <aside style={{ 
        width: isSidebarCollapsed ? '88px' : '260px', 
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--surface)', 
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        zIndex: 40,
        overflow: 'hidden'
      }}>
        
        {/* Logo and Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: isSidebarCollapsed ? '48px' : '56px', 
            height: isSidebarCollapsed ? '48px' : '56px', 
            borderRadius: isSidebarCollapsed ? '12px' : '14px', 
            background: settings?.logoBase64 ? 'transparent' : 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, 
            boxShadow: settings?.logoBase64 ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)', 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}>
            {settings?.logoBase64 ? (
              <img src={settings.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Landmark size={isSidebarCollapsed ? 24 : 32} strokeWidth={2.5} style={{ transition: 'all 0.3s ease' }} />
            )}
          </div>
          <div style={{
            opacity: isSidebarCollapsed ? 0 : 1,
            maxHeight: isSidebarCollapsed ? 0 : '100px',
            transform: isSidebarCollapsed ? 'scale(0.9) translateY(-10px)' : 'scale(1) translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
            <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: '200px' }}>
              {(() => {
                const name = settings?.websiteName || 'BPLO System';
                const parts = name.split(' ');
                if (parts.length === 1) return name;
                return (
                  <>
                    {parts[0]} <span style={{ color: 'var(--primary)' }}>{parts.slice(1).join(' ')}</span>
                  </>
                );
              })()}
            </h2>
          </div>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', 
            marginBottom: '1rem', paddingLeft: '1rem',
            opacity: isSidebarCollapsed ? 0 : 1,
            maxHeight: isSidebarCollapsed ? 0 : '20px',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            Navigation
          </div>
          
          <nav>
            <Link to="/staff" style={navLinkStyle('/staff')} title={isSidebarCollapsed ? "Staff Dashboard" : ""}>
              <div style={{ width: '24px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <LayoutDashboard size={isSidebarCollapsed ? 24 : 18} style={{ transition: 'all 0.3s ease' }} />
              </div>
              <span style={{ 
                opacity: isSidebarCollapsed ? 0 : 1, 
                maxWidth: isSidebarCollapsed ? 0 : '200px',
                transform: isSidebarCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                Staff Dashboard
              </span>
            </Link>
            
            {user?.role === 'ADMIN' && (
              <Link to="/admin" style={navLinkStyle('/admin')} title={isSidebarCollapsed ? "Admin Dashboard" : ""}>
                <div style={{ width: '24px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={isSidebarCollapsed ? 24 : 18} style={{ transition: 'all 0.3s ease' }} />
                </div>
                <span style={{ 
                  opacity: isSidebarCollapsed ? 0 : 1, 
                  maxWidth: isSidebarCollapsed ? 0 : '200px',
                  transform: isSidebarCollapsed ? 'translateX(-10px)' : 'translateX(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  Admin Dashboard
                </span>
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navigation Bar */}
        <header style={{ 
          height: '72px',
          flexShrink: 0,
          background: 'var(--surface)', 
          borderBottom: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr', // Perfectly center the middle item
          alignItems: 'center',
          padding: '0 2rem',
          zIndex: 50
        }}>
          {/* Left Actions (Toggle Sidebar & Contextual Actions) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem', display: 'flex', alignItems: 'center', borderRadius: '8px' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-color)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              title="Toggle Sidebar"
            >
              <Menu size={24} />
            </button>

            {/* Contextual Walk-In Generation Buttons (Only on Staff Dashboard) */}
            {location.pathname === '/staff' && allowedServices.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                {allowedServices.map(s => (
                  <HoldButton 
                    key={s.id}
                    onClick={() => handleGenerateTicket(s.id)}
                    icon={getServiceIcon(s.name)}
                    colorMap={getServiceColor(s.name)}
                    tooltip={`Hold to generate ${s.name} ticket`}
                    holdTime={500}
                  />
                ))}
                
                {latestTicket && (() => {
                  const latestColor = getServiceColor(latestTicket.service.name);
                  return (
                    <div style={{
                      marginLeft: '0.5rem',
                      padding: '0.4rem 0.75rem',
                      background: latestColor.bg,
                      color: latestColor.main,
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      animation: 'fade-in 0.3s ease-out'
                    }}>
                      <Check size={16} strokeWidth={3} />
                      Added: {latestTicket.number}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Center (Clock and Date) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.05em', lineHeight: 1.2 }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.5rem' }}>
            
            {/* Quick Links (Icons only) - Admin Only */}
            {user?.role === 'ADMIN' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '1.5rem', borderRight: '1px solid var(--border)' }}>
                <button 
                  onClick={handleDetectScreens}
                  title="Project TV Display"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: 'var(--text-muted)', borderRadius: '8px', transition: 'all 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Monitor size={20} />
                </button>
                
                <Link 
                  to="/kiosk" 
                  target="_blank"
                  title="Open Kiosk"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: 'var(--text-muted)', borderRadius: '8px', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Tablet size={20} />
                </Link>
              </div>
            )}
            
            <ThemeToggle />

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  background: isProfileOpen ? 'var(--bg-color)' : 'transparent',
                  border: 'none', padding: '0.5rem 0.75rem', borderRadius: '8px', 
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-color)'}
                onMouseOut={e => e.currentTarget.style.background = isProfileOpen ? 'var(--bg-color)' : 'transparent'}
              >
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{user?.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {user?.counter?.name ? user.counter.name : 'No Window'}
                    {(user?.caterNew || user?.caterRenewal || user?.caterRetirement) ? (
                      <span style={{ margin: '0 0.25rem' }}>•</span>
                    ) : ''}
                    {[user?.caterNew && 'New', user?.caterRenewal && 'Renewal', user?.caterRetirement && 'Retirement'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {user?.profilePictureBase64 ? (
                    <img src={user.profilePictureBase64} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} />
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div style={{ 
                  position: 'absolute', top: '120%', right: 0, width: '220px', 
                  background: 'var(--surface)', border: '1px solid var(--border)', 
                  borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  minWidth: '220px', padding: '0.5rem', zIndex: 100
                }}>
                  <div style={{ padding: '0.5rem 1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>@{user?.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '0.25rem' }}>{user?.role}</div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowSettingsModal(true);
                    }}
                    style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', background: 'transparent', border: 'none', 
                      textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)', 
                      borderRadius: '6px', fontSize: '0.875rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', background: 'transparent', border: 'none', 
                      textAlign: 'left', cursor: 'pointer', color: 'var(--danger)', 
                      borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Screen Selection Modal */}
      <ModalWrapper isOpen={showScreenModal} zIndex={9999}>
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            {!selectedScreenForConfig ? (
              <>
                <h3 style={{ margin: '0 0 1rem 0' }}>Select Display to Project</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {screens.map((screen, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedScreenForConfig(screen)}
                      style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', background: screen.isInternal ? 'var(--bg-color)' : 'var(--bg-color)', cursor: 'pointer' }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ display: 'block', color: 'var(--text-main)' }}>{screen.label || `Display ${idx + 1}`}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {Math.round(screen.width * screen.devicePixelRatio)}x{Math.round(screen.height * screen.devicePixelRatio)} {screen.isInternal ? '(Primary/Internal)' : '(External TV)'}
                        </span>
                      </div>
                      <Monitor size={24} color={screen.isInternal ? '#94a3b8' : '#3b82f6'} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowScreenModal(false)} style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 1rem 0' }}>Configure Monitor Assignment</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  You are setting up <strong>{selectedScreenForConfig.label || 'this display'}</strong>.
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Monitors</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={totalMonitors} 
                      onChange={e => setTotalMonitors(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>This is Monitor #</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={monitorIndex} 
                      onChange={e => setMonitorIndex(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setSelectedScreenForConfig(null)} style={{ flex: 1, padding: '0.75rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Back</button>
                  <button onClick={projectToScreen} style={{ flex: 2, padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Start Projecting</button>
                </div>
              </>
            )}
        </div>
      </ModalWrapper>

      {/* Waiting for TV Fullscreen Overlay */}
      <ModalWrapper isOpen={isWaitingForFullscreen} zIndex={99999} bg="rgba(0,0,0,0.85)">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'white', fontSize: '3rem', marginBottom: '1rem' }}>Waiting for TV Display...</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.5rem', textAlign: 'center' }}>
            Please click or press the Spacebar on the newly opened TV window to activate Fullscreen and Audio.
          </p>
          <button 
            onClick={() => setIsWaitingForFullscreen(false)} 
            style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cancel Waiting
          </button>
        </div>
      </ModalWrapper>

      {/* Global Settings Modal */}
      <ModalWrapper isOpen={showSettingsModal} zIndex={1000}>
        <div style={{ background: 'var(--surface)', borderRadius: '12px', width: '800px', height: '600px', display: 'flex', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Left Nav */}
            <div style={{ width: '250px', background: 'var(--bg-color)', borderRight: '1px solid var(--border)', padding: '1.5rem' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-main)' }}>Settings</h2>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSettingsTab('account')}
                  style={{ 
                    padding: '0.75rem 1rem', background: settingsTab === 'account' ? 'var(--primary)' : 'transparent', 
                    color: settingsTab === 'account' ? '#ffffff' : 'var(--text-main)', 
                    border: 'none', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' 
                  }}
                >
                  Account Profile
                </button>
                {user?.role === 'ADMIN' && (
                  <>
                    <button 
                      onClick={() => setSettingsTab('general')}
                      style={{ 
                        padding: '0.75rem 1rem', background: settingsTab === 'general' ? 'var(--primary)' : 'transparent', 
                        color: settingsTab === 'general' ? '#ffffff' : 'var(--text-main)', 
                        border: 'none', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' 
                      }}
                    >
                      General & Appearance
                    </button>
                    <button 
                      onClick={() => setSettingsTab('advanced')}
                      style={{ 
                        padding: '0.75rem 1rem', background: settingsTab === 'advanced' ? 'var(--primary)' : 'transparent', 
                        color: settingsTab === 'advanced' ? '#ffffff' : 'var(--text-muted)', 
                        border: 'none', borderRadius: '8px', textAlign: 'left', fontWeight: 'bold', cursor: 'not-allowed' 
                      }}
                      disabled
                    >
                      Advanced <span style={{ fontSize: '0.65rem', background: 'var(--border)', padding: '2px 6px', borderRadius: '10px', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>Soon</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {settingsTab === 'general' && (
                <>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>General & Appearance</h3>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Website Name</label>
                    <input 
                      type="text" 
                      value={settingsForm.websiteName}
                      onChange={e => setSettingsForm(prev => ({ ...prev, websiteName: e.target.value }))}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', background: 'var(--surface)', color: 'var(--text-main)' }}
                      placeholder="e.g. BPLO System"
                    />
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Custom Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-color)' }}>
                        {settingsForm.logoBase64 ? (
                          <img src={settingsForm.logoBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No Logo</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={logoInputRef}
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSettingsForm(prev => ({ ...prev, logoBase64: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          onClick={() => logoInputRef.current?.click()}
                          style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Upload Image
                        </button>
                        <button 
                          onClick={() => setSettingsForm(prev => ({ ...prev, logoBase64: '' }))}
                          style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--danger)', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Remove Logo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button 
                      onClick={() => {
                        setShowSettingsModal(false);
                        setSettingsForm({ websiteName: settings?.websiteName || '', logoBase64: settings?.logoBase64 || '' });
                      }}
                      style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
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
                      style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}

              {settingsTab === 'account' && (
                <>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>Account Profile</h3>
                  
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {accountForm.profilePictureBase64 ? (
                        <img src={accountForm.profilePictureBase64} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={profilePicInputRef}
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAccountForm(prev => ({ ...prev, profilePictureBase64: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button 
                        onClick={() => profilePicInputRef.current?.click()}
                        style={{ padding: '0.5rem 1rem', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem' }}
                      >
                        Upload Photo
                      </button>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended: Square image, max 2MB.</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={accountForm.name}
                      onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', background: 'var(--surface)', color: 'var(--text-main)' }}
                    />
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <button 
                      onClick={() => setShowChangePasswordModal(true)}
                      style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Change Password
                    </button>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button 
                      onClick={() => {
                        setShowSettingsModal(false);
                        setAccountForm({ name: user?.name || '', profilePictureBase64: user?.profilePictureBase64 || '' });
                        setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await api.updateUserProfile(user.id, accountForm);
                          setShowSettingsModal(false);
                        } catch (err) {
                          alert('Failed to update profile: ' + err.message);
                        }
                      }}
                      style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
      </ModalWrapper>

      {/* Change Password Modal */}
      <ModalWrapper isOpen={showChangePasswordModal} zIndex={1100}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setShowChangePasswordModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>Change Password</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Current Password</label>
              <input type="password" value={passwordChange.currentPassword} onChange={e => setPasswordChange({...passwordChange, currentPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>New Password</label>
              <input type="password" value={passwordChange.newPassword} onChange={e => setPasswordChange({...passwordChange, newPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Confirm New Password</label>
              <input type="password" value={passwordChange.confirmPassword} onChange={e => setPasswordChange({...passwordChange, confirmPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
            </div>
            <button 
              onClick={async () => {
                if (!passwordChange.currentPassword || !passwordChange.newPassword) return alert("Please fill all password fields");
                if (passwordChange.newPassword !== passwordChange.confirmPassword) return alert("New passwords do not match.");
                try {
                  await api.changePassword(user.id, { currentPassword: passwordChange.currentPassword, newPassword: passwordChange.newPassword });
                  setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowChangePasswordModal(false);
                  alert("Password changed successfully!");
                } catch(err) {
                  alert(err.message || "Failed to change password.");
                }
              }}
              style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Update Password
            </button>
          </div>
      </ModalWrapper>
    </div>
  );
}
