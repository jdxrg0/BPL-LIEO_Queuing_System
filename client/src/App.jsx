import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StaffDashboard from './pages/StaffDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import TVDisplay from './pages/TVDisplay';
import AdminDashboard from './pages/AdminDashboard';
import PrintTickets from './components/Print/PrintTickets';
import PrintStats from './components/Print/PrintStats';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import { api, socket } from './api';

function App() {
  const [user, setUser] = useState(null);

  // Load session from localStorage and fetch latest data
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

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Fetch fresh data silently in the background
      api.getUser(parsedUser.id).then(freshUser => {
        setUser(freshUser);
        localStorage.setItem('bplo_user', JSON.stringify(freshUser));
      }).catch(err => console.error('Failed to refresh user data', err));
    }
  }, []);

  // Listen for real-time user updates (e.g. Admin changes permissions)
  useEffect(() => {
    const handleUserUpdated = (updatedUser) => {
      setUser(prev => {
        if (prev && prev.id === updatedUser.id) {
          localStorage.setItem('bplo_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
        return prev;
      });
    };

    socket.on('userUpdated', handleUserUpdated);
    return () => {
      socket.off('userUpdated', handleUserUpdated);
    };
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('bplo_user', JSON.stringify(loggedInUser));
    localStorage.setItem('bplo_login_date', new Date().toDateString());
  };

  const handleLogout = () => {
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

      {/* Protected Routes Wrapper */}
      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
        {/* Route for Staff/Receptionist */}
        <Route path="/staff" element={
          user?.role === 'RECEPTIONIST' ? <ReceptionistDashboard user={user} /> : <StaffDashboard user={user} />
        } />
        
        {/* Route for Admin with RBAC check */}
        <Route path="/admin" element={
          user?.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/staff" replace />
        } />
      </Route>

      {/* Login & Redirects */}
      <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/staff" replace />} />
      <Route path="/" element={<Navigate to="/staff" replace />} />
    </Routes>
  );
}

export default App;
