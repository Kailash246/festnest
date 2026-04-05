/* ============================================================
   FESTNEST FRONTEND — assets/js/api.js
   Complete API client — replaces all static FN_EVENTS data.
   Drop this file into your festnest/assets/js/ folder and
   load it BEFORE data.js in every HTML page.
   ============================================================ */

'use strict';

/* ── Base URL — change to your deployed backend URL in production ── */
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://your-festnest-backend.onrender.com/api';   /* ← Update after deploying */

/* ════════════════════════════════════════
   TOKEN MANAGEMENT
   ════════════════════════════════════════ */
const FN_AUTH = {
  getToken:  ()        => localStorage.getItem('fn_token'),
  setToken:  (token)   => localStorage.setItem('fn_token', token),
  removeToken: ()      => localStorage.removeItem('fn_token'),
  getUser:   ()        => { try { return JSON.parse(localStorage.getItem('fn_user')); } catch { return null; } },
  setUser:   (user)    => localStorage.setItem('fn_user', JSON.stringify(user)),
  removeUser: ()       => localStorage.removeItem('fn_user'),
  isLoggedIn: ()       => !!localStorage.getItem('fn_token'),
  logout: () => {
    localStorage.removeItem('fn_token');
    localStorage.removeItem('fn_user');
    window.dispatchEvent(new CustomEvent('fn:logout'));
  },
};

/* ════════════════════════════════════════
   CORE FETCH WRAPPER
   ════════════════════════════════════════ */
async function apiFetch(endpoint, options = {}) {
  const url     = `${API_BASE}${endpoint}`;
  const token   = FN_AUTH.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  /* Don't set Content-Type for FormData (let browser set multipart boundary) */
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data     = await response.json();

    if (!response.ok) {
      const message = data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new FNApiError(message, response.status, data.errors);
    }

    return data;
  } catch (err) {
    if (err instanceof FNApiError) throw err;
    throw new FNApiError(err.message || 'Network error. Please check your connection.', 0);
  }
}

/* ── Custom error class ── */
class FNApiError extends Error {
  constructor(message, statusCode = 0, errors = []) {
    super(message);
    this.name       = 'FNApiError';
    this.statusCode = statusCode;
    this.errors     = errors;
  }
}

/* ════════════════════════════════════════
   AUTH API
   ════════════════════════════════════════ */
const FN_AUTH_API = {

  /* Register */
  register: async (data) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body:   JSON.stringify(data),
    });
    FN_AUTH.setToken(res.token);
    FN_AUTH.setUser(res.user);
    window.dispatchEvent(new CustomEvent('fn:login', { detail: res.user }));
    return res;
  },

  /* Login */
  login: async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });
    FN_AUTH.setToken(res.token);
    FN_AUTH.setUser(res.user);
    window.dispatchEvent(new CustomEvent('fn:login', { detail: res.user }));
    return res;
  },

  /* Get current user */
  getMe: async () => {
    const res = await apiFetch('/auth/me');
    FN_AUTH.setUser(res.user);
    return res.user;
  },

  /* Update profile */
  updateProfile: async (data) => {
    const res = await apiFetch('/auth/update-profile', {
      method: 'PUT',
      body:   JSON.stringify(data),
    });
    FN_AUTH.setUser(res.user);
    return res.user;
  },

  /* Change password */
  changePassword: async (currentPassword, newPassword) => {
    return apiFetch('/auth/change-password', {
      method: 'PUT',
      body:   JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /* Logout */
  logout: () => { FN_AUTH.logout(); },
};

/* ════════════════════════════════════════
   EVENTS API
   ════════════════════════════════════════ */
const FN_EVENTS_API = {

  /* Get events with filters */
  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    const allowed = ['page', 'limit', 'category', 'mode', 'fee', 'search', 'sort', 'featured', 'badge'];
    allowed.forEach(k => {
      if (params[k] !== undefined && params[k] !== '' && params[k] !== 'All') {
        query.set(k, params[k]);
      }
    });
    return apiFetch(`/events?${query.toString()}`);
  },

  /* Get single event by ID */
  getEvent: async (id) => {
    const res = await apiFetch(`/events/${id}`);
    return res.event;
  },

  /* Full-text search */
  search: async (q, page = 1, limit = 12) => {
    const query = new URLSearchParams({ q, page, limit });
    return apiFetch(`/events/search?${query.toString()}`);
  },

  /* Create new event (organizer) */
  createEvent: async (formData) => {
    return apiFetch('/events', {
      method: 'POST',
      body:   formData,   /* FormData with files */
    });
  },

  /* Update event */
  updateEvent: async (id, formData) => {
    return apiFetch(`/events/${id}`, {
      method: 'PUT',
      body:   formData,
    });
  },

  /* Delete event */
  deleteEvent: async (id) => {
    return apiFetch(`/events/${id}`, { method: 'DELETE' });
  },

  /* Get organizer's events */
  getMyEvents: async () => {
    return apiFetch('/events/my/events');
  },

  /* Save / unsave event */
  toggleSave: async (id) => {
    return apiFetch(`/events/${id}/save`, { method: 'POST' });
  },

  /* Get saved events for current user */
  getSavedEvents: async () => {
    return apiFetch('/events/saved/list');
  },

  /* Admin: get pending events */
  getPending: async () => {
    return apiFetch('/events/admin/pending');
  },

  /* Admin: approve event */
  approveEvent: async (id, { badge = 'new', isFeatured = false } = {}) => {
    return apiFetch(`/events/${id}/approve`, {
      method: 'PATCH',
      body:   JSON.stringify({ badge, isFeatured }),
    });
  },

  /* Admin: reject event */
  rejectEvent: async (id, reason) => {
    return apiFetch(`/events/${id}/reject`, {
      method: 'PATCH',
      body:   JSON.stringify({ reason }),
    });
  },

  /* Admin: stats */
  getStats: async () => {
    return apiFetch('/events/admin/stats');
  },
};

/* ════════════════════════════════════════
   USERS API
   ════════════════════════════════════════ */
const FN_USERS_API = {
  getProfile:    () => apiFetch('/users/profile'),
  updateProfile: (data) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getSavedEvents:() => apiFetch('/users/saved-events'),
};

/* ════════════════════════════════════════
   EXPOSE GLOBALLY
   ════════════════════════════════════════ */
window.FN_AUTH      = FN_AUTH;
window.FN_AUTH_API  = FN_AUTH_API;
window.FN_EVENTS_API= FN_EVENTS_API;
window.FN_USERS_API = FN_USERS_API;
window.FNApiError   = FNApiError;
