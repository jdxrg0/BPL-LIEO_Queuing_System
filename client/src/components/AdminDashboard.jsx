import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { User, Printer, Settings, Users, ArrowUpRight, TrendingUp, RefreshCw, X, UserPlus, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ModalWrapper from './ModalWrapper';
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState({ type: 'NW', startNumber: 1, quantity: 50 });
  const [editingUser, setEditingUser] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Custom Popup Window instead of browser alerts
  const [popupMessage, setPopupMessage] = useState(null); 
  const showPopup = (title, message, type = 'error') => {
    setPopupMessage({ title, message, type });
  };

  const [newUser, setNewUser] = useState({
    name: '', username: '', password: '', role: 'STAFF', windowNumber: 1,
    caterNew: true, caterRenewal: true, caterRetirement: true
  });

  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ resetKey: '', newPassword: '', confirmPassword: '' });
  const [deleteForm, setDeleteForm] = useState({ username: '', password: '' });
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteTimerRef = useRef(null);

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
      const statsData = await api.getStats(trendStartRef.current, trendEndRef.current, filterYearRef.current);
      setStats(statsData);
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password || !newUser.windowNumber) return;
    try {
      await api.createUser(newUser);
      setNewUser({ name: '', username: '', password: '', role: 'STAFF', windowNumber: 1, caterNew: true, caterRenewal: true, caterRetirement: true });
      setIsModalOpen(false);
      fetchData();
      showPopup("Success", "Account created successfully!", "success");
    } catch (err) {
      showPopup("Error", "Failed to create user.", "error");
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.currentPassword) return showPopup("Required", "Current password is required to save changes.", "error");
    
    try {
      await api.updateUser(editingUser.id, editingUser);
      setEditingUser(null);
      fetchData();
      showPopup("Success", "Account details updated successfully!", "success");
    } catch (err) {
      showPopup("Error", err.message || 'Failed to update user.', "error");
    }
  };

  const handlePrint = () => {
    window.open(`/print-stats?startDate=${trendStart}&endDate=${trendEnd}&year=${filterYear}`, '_blank');
  };

  const openEditModal = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      currentPassword: '',
      windowNumber: user.counter ? parseInt(user.counter.name.replace('Window ', '')) : 1,
      caterNew: user.caterNew,
      caterRenewal: user.caterRenewal,
      caterRetirement: user.caterRetirement
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      return showPopup("Error", "New passwords do not match.", "error");
    }
    try {
      await api.changePassword(editingUser.id, { 
        currentPassword: passwordChange.currentPassword, 
        newPassword: passwordChange.newPassword 
      });
      setIsChangePasswordModalOpen(false);
      setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showPopup("Success", "Password changed successfully!", "success");
    } catch(err) {
      showPopup("Error", err.message || "Failed to change password.", "error");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      return showPopup("Error", "New passwords do not match.", "error");
    }
    try {
      await api.resetPassword(editingUser.id, { 
        resetKey: resetPasswordForm.resetKey, 
        newPassword: resetPasswordForm.newPassword 
      });
      setIsResetPasswordModalOpen(false);
      setResetPasswordForm({ resetKey: '', newPassword: '', confirmPassword: '' });
      showPopup("Success", "Password reset successfully!", "success");
    } catch(err) {
      showPopup("Error", err.message || "Failed to reset password.", "error");
    }
  };

  const handleMouseDownDelete = () => {
    if (!deleteForm.username || !deleteForm.password) return showPopup("Required", "Enter credentials to delete.", "error");
    setDeleteProgress(0);
    let progress = 0;
    deleteTimerRef.current = setInterval(() => {
      progress += (100 / 30); // 3 seconds total (30 ticks of 100ms)
      setDeleteProgress(progress);
      if (progress >= 100) {
        clearInterval(deleteTimerRef.current);
        executeDelete();
      }
    }, 100);
  };

  const handleMouseUpOrLeaveDelete = () => {
    clearInterval(deleteTimerRef.current);
    if (deleteProgress < 100) {
      setDeleteProgress(0);
    }
  };

  const executeDelete = async () => {
    try {
      await api.deleteUser(editingUser.id, deleteForm);
      setIsDeleteModalOpen(false);
      setEditingUser(null);
      setDeleteProgress(0);
      setDeleteForm({ username: '', password: '' });
      fetchData();
      showPopup("Success", "Account deleted successfully.", "success");
    } catch(err) {
      showPopup("Error", err.message || "Failed to delete user.", "error");
      setDeleteProgress(0);
    }
  };

  // Determine if there are changes to the editing user
  const originalUser = stats?.employees.find(u => u?.id === editingUser?.id);
  const originalWindowNum = originalUser?.counter ? parseInt(originalUser.counter.name.replace('Window ', '')) : 1;
  const hasChanges = editingUser && originalUser && (
    editingUser.name !== originalUser.name ||
    editingUser.username !== originalUser.username ||
    editingUser.role !== originalUser.role ||
    editingUser.windowNumber !== originalWindowNum ||
    editingUser.caterNew !== originalUser.caterNew ||
    editingUser.caterRenewal !== originalUser.caterRenewal ||
    editingUser.caterRetirement !== originalUser.caterRetirement
  );

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading statistics...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h1>Office Overview</h1>
            <p style={{ color: 'var(--text-muted)' }}>Real-time statistics for completed transactions.</p>
          </div>
          <select 
            value={filterYear}
            onChange={handleYearChange}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-main)', fontWeight: '500' }}
          >
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsPrintModalOpen(true)}>
            <Printer size={16} /> Print Tickets
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Employee
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="card" style={{ display: 'flex', marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', padding: 0, overflow: 'hidden' }}>
        {[
          { label: 'Total Served', value: stats.office.total, color: 'var(--primary)' },
          { label: 'New Apps', value: stats.office.newApp, color: '#10b981' },
          { label: 'Renewals', value: stats.office.renewal, color: '#f59e0b' },
          { label: 'Retirements', value: stats.office.retirement, color: '#6366f1' }
        ].map((kpi, idx) => (
          <div key={idx} style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1rem 1.5rem',
            borderRight: idx < 3 ? '1px solid var(--border)' : 'none',
            borderBottom: `3px solid ${kpi.color}`
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: kpi.color, lineHeight: 1 }}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Tickets Issued</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Daily volume of new tickets entering the queue</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>From:</label>
              <input type="date" value={trendStart} onChange={(e) => setTrendStart(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', background: 'var(--surface)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>To:</label>
              <input type="date" value={trendEnd} onChange={(e) => setTrendEnd(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none', background: 'var(--surface)', color: 'var(--text-main)' }} />
            </div>
          </div>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="tickets" name="Tickets Created" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--surface)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Statistics Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--surface)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-color)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Employee Performance & Management</h2>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Employee Details</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'center' }}>Total Served</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'center' }}>New Apps</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'center' }}>Renewals</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'center' }}>Retirements</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.employees.map(emp => {
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {emp.profilePictureBase64 ? (
                          <img src={emp.profilePictureBase64} alt={emp.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          emp.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {emp.role}
                            {emp.counter && <span style={{ fontSize: '11px', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>Window {emp.counter.name ? emp.counter.name.replace('Window ', '') : ''}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                          <span style={{ padding: '0.1rem 0.4rem', background: emp.role === 'ADMIN' ? 'var(--warning)' : 'var(--border)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', color: emp.role === 'ADMIN' ? '#ffffff' : 'var(--text-main)' }}>
                            {emp.role}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Caters:</span>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {emp.caterNew && <span style={{ padding: '0.1rem 0.4rem', background: 'var(--success)', color: '#ffffff', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>NW</span>}
                            {emp.caterRenewal && <span style={{ padding: '0.1rem 0.4rem', background: 'var(--primary)', color: '#ffffff', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>RNW</span>}
                            {emp.caterRetirement && <span style={{ padding: '0.1rem 0.4rem', background: 'var(--danger)', color: '#ffffff', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>R</span>}
                            {!emp.caterNew && !emp.caterRenewal && !emp.caterRetirement && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>{emp.servedTotalYear}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{emp.servedNewYear}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{emp.servedRenewalYear}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>{emp.servedRetirementYear}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button onClick={() => openEditModal(emp)} style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
            {stats.employees.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal Overlay */}
      <ModalWrapper isOpen={isModalOpen} zIndex={100}>
        <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
          <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <h3 style={{ marginBottom: '1.5rem' }}>Create New Account</h3>
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name</label>
                  <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Username</label>
                  <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setNewUser({...newUser, role: 'STAFF'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: newUser.role === 'STAFF' ? 'var(--primary)' : 'var(--surface)', fontWeight: 600, color: newUser.role === 'STAFF' ? '#ffffff' : 'var(--text-main)', cursor: 'pointer' }}>Staff</button>
                    <button type="button" onClick={() => setNewUser({...newUser, role: 'ADMIN'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: newUser.role === 'ADMIN' ? 'var(--warning)' : 'var(--surface)', fontWeight: 600, color: newUser.role === 'ADMIN' ? '#ffffff' : 'var(--text-main)', cursor: 'pointer' }}>Admin</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Assign to Window Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', height: '38px' }}>
                    <button type="button" onClick={() => setNewUser({...newUser, windowNumber: Math.max(1, newUser.windowNumber - 1)})} style={{ padding: '0 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}>−</button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{newUser.windowNumber}</div>
                    <button type="button" onClick={() => setNewUser({...newUser, windowNumber: newUser.windowNumber + 1})} style={{ padding: '0 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}>+</button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transactions Catered</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setNewUser({...newUser, caterNew: !newUser.caterNew})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: newUser.caterNew ? '1px solid var(--success)' : '1px solid var(--border)', background: newUser.caterNew ? 'var(--success)' : 'var(--surface)', fontWeight: 600, color: newUser.caterNew ? '#ffffff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>New</button>
                    <button type="button" onClick={() => setNewUser({...newUser, caterRenewal: !newUser.caterRenewal})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: newUser.caterRenewal ? '1px solid var(--primary)' : '1px solid var(--border)', background: newUser.caterRenewal ? 'var(--primary)' : 'var(--surface)', fontWeight: 600, color: newUser.caterRenewal ? '#ffffff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>Renewal</button>
                    <button type="button" onClick={() => setNewUser({...newUser, caterRetirement: !newUser.caterRetirement})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: newUser.caterRetirement ? '1px solid var(--danger)' : '1px solid var(--border)', background: newUser.caterRetirement ? 'var(--danger)' : 'var(--surface)', fontWeight: 600, color: newUser.caterRetirement ? '#ffffff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>Retirement</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Password</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '1rem', fontSize: '1.1rem' }}>Create Account</button>
            </form>
          </div>
      </ModalWrapper>

      {/* Edit Employee Modal Overlay */}
      <ModalWrapper isOpen={!!editingUser} zIndex={100}>
        {() => (
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setEditingUser(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <h3 style={{ marginBottom: '1.5rem' }}>Edit Account</h3>
            
            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name</label>
                  <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Username</label>
                  <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setEditingUser({...editingUser, role: 'STAFF'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: editingUser.role === 'STAFF' ? 'var(--primary)' : 'var(--surface)', fontWeight: 600, color: editingUser.role === 'STAFF' ? '#ffffff' : 'var(--text-main)', cursor: 'pointer' }}>Staff</button>
                    <button type="button" onClick={() => setEditingUser({...editingUser, role: 'ADMIN'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: editingUser.role === 'ADMIN' ? 'var(--warning)' : 'var(--surface)', fontWeight: 600, color: editingUser.role === 'ADMIN' ? '#ffffff' : 'var(--text-main)', cursor: 'pointer' }}>Admin</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Assign to Window Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', height: '38px' }}>
                    <button type="button" onClick={() => setEditingUser({...editingUser, windowNumber: Math.max(1, editingUser.windowNumber - 1)})} style={{ padding: '0 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}>−</button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{editingUser.windowNumber}</div>
                    <button type="button" onClick={() => setEditingUser({...editingUser, windowNumber: editingUser.windowNumber + 1})} style={{ padding: '0 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}>+</button>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transactions Catered</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setEditingUser({...editingUser, caterNew: !editingUser.caterNew})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: editingUser.caterNew ? '1px solid var(--success)' : '1px solid var(--border)', background: editingUser.caterNew ? 'var(--success)' : 'var(--surface)', fontWeight: 600, color: editingUser.caterNew ? '#ffffff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>New</button>
                    <button type="button" onClick={() => setEditingUser({...editingUser, caterRenewal: !editingUser.caterRenewal})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: editingUser.caterRenewal ? '1px solid var(--primary)' : '1px solid var(--border)', background: editingUser.caterRenewal ? 'var(--primary)' : 'var(--surface)', fontWeight: 600, color: editingUser.caterRenewal ? '#ffffff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>Renewal</button>
                    <button type="button" onClick={() => setEditingUser({...editingUser, caterRetirement: !editingUser.caterRetirement})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: editingUser.caterRetirement ? '1px solid var(--danger)' : '1px solid var(--border)', background: editingUser.caterRetirement ? 'var(--danger)' : 'var(--surface)', fontWeight: 600, color: editingUser.caterRetirement ? '#ffffff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>Retirement</button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Confirm Current Password to Save</label>
                <input type="password" placeholder="••••••••" value={editingUser.currentPassword} onChange={e => setEditingUser({...editingUser, currentPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', marginBottom: '0.5rem' }} required />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsChangePasswordModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                    Change Password
                  </button>
                  <button type="button" onClick={() => setIsResetPasswordModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                    Forgot Password
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="btn" style={{ padding: '1rem', flex: 1, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>Delete Account</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!hasChanges}
                  style={{ 
                    padding: '1rem', 
                    flex: 2,
                    opacity: hasChanges ? 1 : 0.5,
                    cursor: hasChanges ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalWrapper>

      {/* Change Password Modal */}
      <ModalWrapper isOpen={isChangePasswordModalOpen} zIndex={110}>
        <div className="card" style={{ width: '400px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
          <button onClick={() => setIsChangePasswordModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Current Password</label>
                <input type="password" value={passwordChange.currentPassword} onChange={e => setPasswordChange({...passwordChange, currentPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>New Password</label>
                <input type="password" value={passwordChange.newPassword} onChange={e => setPasswordChange({...passwordChange, newPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Confirm New Password</label>
                <input type="password" value={passwordChange.confirmPassword} onChange={e => setPasswordChange({...passwordChange, confirmPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '1rem', marginTop: '1rem' }}>Update Password</button>
            </form>
          </div>
      </ModalWrapper>

      {/* Forgot Password Modal */}
      <ModalWrapper isOpen={isResetPasswordModalOpen} zIndex={110}>
        <div className="card" style={{ width: '400px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
          <button onClick={() => setIsResetPasswordModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <h3 style={{ marginBottom: '1.5rem' }}>Forgot Password</h3>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Reset Key</label>
                <input type="text" value={resetPasswordForm.resetKey} onChange={e => setResetPasswordForm({...resetPasswordForm, resetKey: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>New Password</label>
                <input type="password" value={resetPasswordForm.newPassword} onChange={e => setResetPasswordForm({...resetPasswordForm, newPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Confirm New Password</label>
                <input type="password" value={resetPasswordForm.confirmPassword} onChange={e => setResetPasswordForm({...resetPasswordForm, confirmPassword: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} required />
              </div>
              <button type="submit" className="btn btn-warning" style={{ padding: '1rem', marginTop: '1rem', background: 'var(--warning)', color: 'white', border: 'none' }}>Reset Password</button>
            </form>
          </div>
      </ModalWrapper>

      {/* Delete Account Modal */}
      <ModalWrapper isOpen={isDeleteModalOpen} zIndex={110}>
        {() => (
          <div className="card" style={{ width: '400px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setIsDeleteModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <h3 style={{ marginBottom: '1.5rem', color: '#dc2626' }}>Danger Zone: Delete Account</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Confirm the credentials of <strong>{editingUser?.name}</strong> to delete this account permanently.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Username</label>
                <input type="text" value={deleteForm.username} onChange={e => setDeleteForm({...deleteForm, username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Password</label>
                <input type="password" value={deleteForm.password} onChange={e => setDeleteForm({...deleteForm, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
              
              <button 
                onMouseDown={handleMouseDownDelete}
                onMouseUp={handleMouseUpOrLeaveDelete}
                onMouseLeave={handleMouseUpOrLeaveDelete}
                className="btn" 
                style={{ 
                  padding: '1rem', 
                  marginTop: '1rem', 
                  background: deleteProgress > 0 ? '#ef4444' : '#fee2e2', 
                  color: deleteProgress > 0 ? 'white' : '#dc2626',
                  border: '1px solid #fecaca',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: (deleteForm.username && deleteForm.password) ? 'pointer' : 'not-allowed',
                  transition: 'background 0.3s ease'
                }}>
                
                {/* Progress bar overlay */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${deleteProgress}%`,
                  background: '#b91c1c',
                  zIndex: 1,
                  transition: deleteProgress === 0 ? 'none' : 'width 0.1s linear'
                }} />
                
                <span style={{ position: 'relative', zIndex: 2 }}>
                  {deleteProgress > 0 ? 'KEEP HOLDING...' : 'HOLD TO DELETE'}
                </span>
              </button>
            </div>
          </div>
        )}
      </ModalWrapper>

      {/* Print Configuration Modal */}
      <ModalWrapper isOpen={isPrintModalOpen} zIndex={1000}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
          <button onClick={() => setIsPrintModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Print Tickets</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Service Type</label>
            <select 
              value={printConfig.type} 
              onChange={e => setPrintConfig({...printConfig, type: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '1rem' }}
            >
              <option value="NW">New Business (NW)</option>
              <option value="RNW">Renewal (RNW)</option>
              <option value="R">Retirement (R)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Start Number</label>
              <input type="number" min="1" value={printConfig.startNumber} onChange={e => setPrintConfig({...printConfig, startNumber: Math.max(1, parseInt(e.target.value)||1)})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '1rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Quantity</label>
              <input type="number" min="1" max="200" value={printConfig.quantity} onChange={e => setPrintConfig({...printConfig, quantity: Math.max(1, parseInt(e.target.value)||1)})} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '1rem' }} />
            </div>
          </div>

          <button 
            onClick={() => {
              setIsPrintModalOpen(false);
              window.open(`/print-tickets?type=${printConfig.type}&start=${printConfig.startNumber}&qty=${printConfig.quantity}`, '_blank');
            }}
            style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            Generate Printable Page
          </button>
        </div>
      </ModalWrapper>

      {/* Global Message Popup Window */}
      <ModalWrapper isOpen={!!popupMessage} zIndex={9999} bg="rgba(0,0,0,0.4)">
        {() => (
          <div className="card" style={{ 
              width: '320px', 
              padding: '2rem', 
              textAlign: 'center',
              borderTop: `4px solid ${popupMessage.type === 'error' ? '#ef4444' : '#10b981'}` 
            }}>
            
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 1rem auto',
              background: popupMessage.type === 'error' ? '#fee2e2' : '#d1fae5',
              color: popupMessage.type === 'error' ? '#dc2626' : '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 'bold'
            }}>
              {popupMessage.type === 'error' ? '!' : '✓'}
            </div>
            
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{popupMessage.title}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{popupMessage.message}</p>
            
            <button 
              onClick={() => setPopupMessage(null)} 
              className="btn"
              style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)', border: 'none', color: 'var(--text-main)', fontWeight: 'bold' }}
            >
              Okay
            </button>
          </div>
        )}
      </ModalWrapper>

    </div>
  );
}
