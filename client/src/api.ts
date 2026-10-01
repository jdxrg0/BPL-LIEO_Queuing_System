import { io } from 'socket.io-client';

// In development, Vite proxies /api and /socket.io to the backend (see vite.config.js).
// In production, set VITE_BACKEND_URL to the server's full URL (e.g. http://192.168.1.10:5000).
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';
const API_URL = `${BACKEND_URL}/api`;
export const socket = io(BACKEND_URL || window.location.origin);

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Shared request helper: throws on non-2xx so error payloads
// (e.g. rate-limit 429 or 500) never flow into UI state as data.
const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      if (errData && typeof errData.error === 'string') message = errData.error;
    } catch {
      // Response was not JSON; keep default message
    }
    throw new Error(message);
  }
  return res.json();
};

export const api = {
  baseURL: API_URL,
  // Auth
  login: async (username, password) => {
    const data = await request(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: async (userId) => {
    try {
      await request(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId }),
      });
    } finally {
      // Always clear local token, even if the server call fails
      localStorage.removeItem('token');
    }
  },


  // Metadata
  getServices: async () => {
    return request(`${API_URL}/services`);
  },
  getCounters: async () => {
    return request(`${API_URL}/counters`);
  },
  createCounter: async (name) => {
    return request(`${API_URL}/counters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ name })
    });
  },

  // Users (Admin)
  getUsers: async () => {
    return request(`${API_URL}/users`, { headers: getAuthHeaders() as any });
  },
  getUser: async (id) => {
    return request(`${API_URL}/users/${id}`, { headers: getAuthHeaders() as any });
  },
  createUser: async (userData) => {
    return request(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(userData)
    });
  },
  updateUser: async (id, userData) => {
    return request(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(userData)
    });
  },
  updateUserProfile: async (id, data) => {
    return request(`${API_URL}/users/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
  },
  changePassword: async (id, passwords) => {
    return request(`${API_URL}/users/${id}/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(passwords)
    });
  },
  resetPassword: async (id, data) => {
    return request(`${API_URL}/users/${id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
  },
  deleteUser: async (id, credentials) => {
    return request(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(credentials)
    });
  },
  getLiveFlow: async () => {
    return request(`${API_URL}/stats/live-flow`, { headers: getAuthHeaders() as any });
  },

  getStats: async (startDate: any = null, endDate: any = null, year: any = null) => {
    let url = `${API_URL}/stats?`;
    if (startDate && endDate) {
      url += `startDate=${startDate}&endDate=${endDate}`;
    } else {
      url += `days=7`; // fallback
    }
    if (year) url += `&year=${year}`;
    return request(url, { headers: getAuthHeaders() as any });
  },

  // Queue
  getLiveWaitTimes: async () => {
    return request(`${API_URL}/stats/live-wait-times`);
  },
  getWaitingQueue: async () => {
    return request(`${API_URL}/tickets/waiting`);
  },
  getPostponedTickets: async () => {
    return request(`${API_URL}/tickets/postponed`);
  },
  getRecentCalled: async () => {
    return request(`${API_URL}/tickets/recent-called`);
  },
  getDisplayTickets: async () => {
    return request(`${API_URL}/tickets/display`);
  },
  getMyServing: async (userId) => {
    return request(`${API_URL}/tickets/my-serving/${userId}`, { headers: getAuthHeaders() as any });
  },
  
  // Actions
  deleteTicket: async (ticketId) => {
    return request(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: getAuthHeaders() as any
    });
  },
  generateTicket: async (serviceId, createdByUserId, priorityType) => {
    return request(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ serviceId, createdByUserId, priorityType })
    });
  },
  bulkGenerateTickets: async (tickets) => {
    return request(`${API_URL}/tickets/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ tickets })
    });
  },
  checkInTicket: async (number: string) => {
    return request(`${API_URL}/tickets/checkin/${number}`, {
      method: 'POST',
      headers: getAuthHeaders() as any
    });
  },
  autoBalanceCounters: async () => {
    return request(`${API_URL}/admin/auto-balance-counters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
  },
  callTicket: async (ticketId, counterId, servedByUserId) => {
    return request(`${API_URL}/tickets/${ticketId}/call`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ counterId, servedByUserId })
    });
  },
  autoAssignNext: async (counterId: number, servedByUserId: number) => {
    return request(`${API_URL}/tickets/auto-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ counterId, servedByUserId })
    });
  },
  updateStatus: async (ticketId, status) => {
    return request(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    });
  },
  exportData: async () => {
    const res = await fetch(`${API_URL}/tickets/export`, {
      method: 'GET',
      headers: getAuthHeaders() as any
    });
    if (!res.ok) throw new Error('Failed to export data');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Queue_Data_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  trackTicket: async (number) => {
    const data = await request(`${API_URL}/tickets/track/${number}`);
    return { data };
  },
  subscribeToPush: async (number, subscription) => {
    return request(`${API_URL}/tickets/track/${number}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription })
    });
  },

  // Settings
  getSettings: async () => {
    return request(`${API_URL}/settings`);
  },
  updateSettings: async (settingsData) => {
    return request(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(settingsData)
    });
  },
  resetData: async () => {
    return request(`${API_URL}/admin/reset-data`, {
      method: 'POST',
      headers: getAuthHeaders() as any
    });
  },

  // Priority Groups
  getPriorityGroups: async () => {
    return request(`${API_URL}/priority-groups`);
  },
  createPriorityGroup: async (data) => {
    return request(`${API_URL}/priority-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
  },
  updatePriorityGroup: async (id, data) => {
    return request(`${API_URL}/priority-groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
  },
  deletePriorityGroup: async (id) => {
    return request(`${API_URL}/priority-groups/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders() as any
    });
  }
};
