import { io } from 'socket.io-client';

const BACKEND_URL = `http://${window.location.hostname}:3001`;
const API_URL = `${BACKEND_URL}/api`;
export const socket = io(BACKEND_URL);

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  // Metadata
  getServices: async () => {
    const res = await fetch(`${API_URL}/services`);
    return res.json();
  },
  getCounters: async () => {
    const res = await fetch(`${API_URL}/counters`);
    return res.json();
  },
  createCounter: async (name) => {
    const res = await fetch(`${API_URL}/counters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  // Users (Admin)
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },
  getUser: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
  },
  createUser: async (userData) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },
  updateUser: async (id, userData) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  updateUserProfile: async (id, data) => {
    const res = await fetch(`${API_URL}/users/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  changePassword: async (id, passwords) => {
    const res = await fetch(`${API_URL}/users/${id}/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwords)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  resetPassword: async (id, data) => {
    const res = await fetch(`${API_URL}/users/${id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  deleteUser: async (id, credentials) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  getStats: async (startDate = null, endDate = null, year = null) => {
    let url = `${API_URL}/stats?`;
    if (startDate && endDate) {
      url += `startDate=${startDate}&endDate=${endDate}`;
    } else {
      url += `days=7`; // fallback
    }
    if (year) url += `&year=${year}`;
    const res = await fetch(url);
    return res.json();
  },

  // Queue
  getWaitingQueue: async () => {
    const res = await fetch(`${API_URL}/tickets/waiting`);
    return res.json();
  },
  getPostponedTickets: async () => {
    const res = await fetch(`${API_URL}/tickets/postponed`);
    return res.json();
  },
  getRecentCalled: async () => {
    const res = await fetch(`${API_URL}/tickets/recent-called`);
    return res.json();
  },
  getMyServing: async (userId) => {
    const res = await fetch(`${API_URL}/tickets/my-serving/${userId}`);
    return res.json();
  },
  
  // Actions
  deleteTicket: async (ticketId) => {
    const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete ticket');
    return res.json();
  },
  generateTicket: async (serviceId, createdByUserId) => {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, createdByUserId })
    });
    return res.json();
  },
  callTicket: async (ticketId, counterId, servedByUserId) => {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/call`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counterId, servedByUserId })
    });
    return res.json();
  },
  updateStatus: async (ticketId, status) => {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_URL}/settings`);
    return res.json();
  },
  updateSettings: async (settingsData) => {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
