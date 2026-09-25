import { io } from 'socket.io-client';

const BACKEND_URL = `http://${window.location.hostname}:3001`;
const API_URL = `${BACKEND_URL}/api`;
export const socket = io(BACKEND_URL);

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
  // Auth
  login: async (username, password) => {
    const data = await request(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (data.token) {
      localStorage.setItem('token', data.token); // Store token
    }
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
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
    return request(`${API_URL}/users`, { headers: { ...getAuthHeaders() } });
  },
  getUser: async (id) => {
    return request(`${API_URL}/users/${id}`, { headers: { ...getAuthHeaders() } });
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
  getStats: async (startDate = null, endDate = null, year = null) => {
    let url = `${API_URL}/stats?`;
    if (startDate && endDate) {
      url += `startDate=${startDate}&endDate=${endDate}`;
    } else {
      url += `days=7`; // fallback
    }
    if (year) url += `&year=${year}`;
    return request(url, { headers: { ...getAuthHeaders() } });
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
  getMyServing: async (userId) => {
    return request(`${API_URL}/tickets/my-serving/${userId}`, { headers: { ...getAuthHeaders() } });
  },
  
  // Actions
  deleteTicket: async (ticketId) => {
    return request(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
  },
  generateTicket: async (serviceId, createdByUserId, priorityType) => {
    return request(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ serviceId, createdByUserId, priorityType })
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
  updateStatus: async (ticketId, status) => {
    return request(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    });
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
      headers: { ...getAuthHeaders() }
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
      headers: { ...getAuthHeaders() }
    });
  }
};