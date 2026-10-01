import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StaffDashboard from './pages/StaffDashboard';
import TVDisplay from './pages/TVDisplay';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PrintTickets from './components/Print/PrintTickets';
import PrintStats from './components/Print/PrintStats';
import MobileTracker from './pages/MobileTracker';
import Login from './pages/Login';
import Kiosk from './pages/Kiosk';
import Layout from './components/Layout/Layout';
import { api, socket } from './api';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Load session from localStorage and fetch latest data
  useEffect(() => {
    if (user) {
      socket.emit('identify', user.id);
    }
  }, [user]);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      const savedUserStr = localStorage.getItem('bplo_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.id) {
            socket.emit('identify', savedUser.id);
          }
        } catch(e) {}
      }
    };
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('bplo_user');
    const loginDate = localStorage.getItem('bplo_login_date');
    const today = new Date().toDateString();

    if (savedUser) {
      if (loginDate !== today) {
        // Session expired (it is a new day)
        localStorage.removeItem('bplo_user');
        localStorage.removeItem('bplo_login_date');
        setUser(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Failed to parse user session', err);
        localStorage.removeItem('bplo_user');
        localStorage.removeItem('bplo_login_date');
        setUser(null);
      }
    }
  }, []);

  // Global favicon & site name: runs once on mount for ALL pages (Login, Tracker, etc.)
  useEffect(() => {
    api.getSettings().then(settings => {
      if (settings?.logoBase64) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.logoBase64;
      }
      if (settings?.websiteName) {
        (window as any).__SITE_NAME__ = settings.websiteName;
      }
    }).catch(() => {}); // Silently fail if API is unreachable (e.g. Vercel tracker)
  }, []);

  // Global Theme Hydration
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  // Listen for real-time user updates (e.g. Admin changes permissions)
  useEffect(() => {
    const handleUserUpdated = (updatedUser: any) => {
      setUser((prev: any) => {
        if (prev && prev.id === updatedUser.id) {
          localStorage.setItem('bplo_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
        return prev;
      });
    };

    const handleUserDeleted = (deletedUserId: any) => {
      setUser((prev: any) => {
        if (prev && prev.id === deletedUserId) {
          localStorage.removeItem('bplo_user');
          localStorage.removeItem('bplo_login_date');
          return null; // This will trigger the Navigate to login
        }
        return prev;
      });
    };

    socket.on('userUpdated', handleUserUpdated);
    socket.on('userDeleted', handleUserDeleted);
    
    return () => {
      socket.off('userUpdated', handleUserUpdated);
      socket.off('userDeleted', handleUserDeleted);
    };
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem('bplo_user', JSON.stringify(loggedInUser));
    localStorage.setItem('bplo_login_date', new Date().toDateString());
  };

    const handleLogout = async () => {
    try {
      if (user) {
        await api.logout();
      }
    } catch(e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    localStorage.removeItem('bplo_user');
    localStorage.removeItem('bplo_login_date');
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/print-tickets" element={<PrintTickets />} />
      <Route path="/print-stats" element={<PrintStats />} />
      <Route path="/display" element={<TVDisplay />} />
      <Route path="/tracker" element={<MobileTracker />} />
      <Route path="/kiosk" element={<Kiosk />} />

      {/* Protected Routes Wrapper */}
      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        {/* Route for Staff */}
        <Route path="/staff" element={
          <StaffDashboard user={user} />
        } />

        {/* Route for Receptionist (ADMIN or RECEPTIONIST role) */}
        <Route path="/receptionist" element={
          user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'
            ? <ReceptionistDashboard user={user} />
            : <Navigate to="/staff" replace />
        } />
        
        {/* Route for Admin with RBAC check */}
        <Route path="/admin" element={
          user?.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/staff" replace />
        } />
      </Route>

      {/* Login & Redirects */}
      <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'RECEPTIONIST' ? '/receptionist' : '/staff'} replace />} />
      <Route path="/" element={<Navigate to="/staff" replace />} />

    </Routes>
  );
}

export default App;
