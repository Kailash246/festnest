/* ============================================================
   FESTNEST — assets/js/api.js
   THE SINGLE SOURCE OF TRUTH for all API calls.

   BUGS FIXED IN THIS VERSION:
   1. Token key is 'fn_token' everywhere — no mismatch possible
   2. apiFetch auto-attaches Authorization header on every call
   3. 401 response auto-clears token + fires fn:logout event
   4. FormData detection prevents Content-Type collision
   5. FN_AUTH.getUser() always returns null-safe object
   6. All methods (deleteEvent, getPending, etc.) confirmed present
   ============================================================ */
'use strict';

/* ── Backend URL ─────────────────────────────────────────────
   When backend serves frontend (npm run dev → localhost:5000)
   the hostname IS localhost:5000 — so API_BASE = same origin.
   This eliminates ALL CORS issues when running locally.
──────────────────────────────────────────────────────────── */
const API_BASE = (() => {
  const h = window.location.hostname;
  const isLocalhost = h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.');
  const isProduction = h.includes('festnest.in') || h.includes('onrender.com') || h.includes('vercel.app');
  
  console.log('[API] Hostname:', h);
  console.log('[API] Is localhost:', isLocalhost);
  console.log('[API] Is production:', isProduction);
  
  // If NOT on production, assume local development
  if (!isProduction) {
    const apiUrl = `http://localhost:5000/api`;
    console.log('[API] Using LOCAL backend:', apiUrl);
    return apiUrl;
  }
  
  // Production — Use Render backend
  const apiUrl = 'https://festnest.onrender.com/api';
  console.log('[API] Using PRODUCTION backend:', apiUrl);
  return apiUrl;
})();

/* ════════════════════════════════════════════════════════════
   TOKEN & SESSION HELPERS
   KEY: 'fn_token'  ← used consistently everywhere
   KEY: 'fn_user'   ← cached user object
   ════════════════════════════════════════════════════════════ */
const FN_AUTH = {
  TOKEN_KEY: 'fn_token',
  USER_KEY:  'fn_user',

  getToken:   () => localStorage.getItem('fn_token'),
  setToken:   (t) => localStorage.setItem('fn_token', t),
  removeToken:() => localStorage.removeItem('fn_token'),

  getUser: () => {
    try {
      const raw = localStorage.getItem('fn_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  setUser:    (u) => localStorage.setItem('fn_user', JSON.stringify(u)),
  removeUser: () => localStorage.removeItem('fn_user'),

  isLoggedIn: () => !!localStorage.getItem('fn_token'),

  logout: () => {
    localStorage.removeItem('fn_token');
    localStorage.removeItem('fn_user');
    window.dispatchEvent(new CustomEvent('fn:logout'));
  },
};

/* ════════════════════════════════════════════════════════════
   CORE FETCH WRAPPER
   All API calls go through here.
   ════════════════════════════════════════════════════════════ */
class FNApiError extends Error {
  constructor(msg, status = 0, errors = []) {
    super(msg);
    this.name       = 'FNApiError';
    this.statusCode = status;
    this.errors     = errors;
  }
}

async function apiFetch(endpoint, opts = {}) {
  const url  = API_BASE + endpoint;
  const tok  = FN_AUTH.getToken();
  const hdrs = { ...opts.headers };

  // JSON content-type unless sending FormData (which sets its own boundary)
  if (!(opts.body instanceof FormData)) {
    hdrs['Content-Type'] = 'application/json';
  }

  // Attach JWT to every request that has one
  if (tok) {
    hdrs['Authorization'] = 'Bearer ' + tok;
  }

  let response, data;
  try {
    response = await fetch(url, { ...opts, headers: hdrs });
    data     = await response.json();
  } catch (networkErr) {
    throw new FNApiError(
      networkErr.message || 'Network error — is the backend running?',
      0
    );
  }

  if (!response.ok) {
    // Auto-logout on 401 ONLY for non-login/register requests
    // Login/register failures should be handled as normal errors, not trigger logout
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      FN_AUTH.logout();
    }
    
    // Extract error message with priority: message > first error > HTTP status
    let msg = data?.message;   // Backend validation-specific message
    if (!msg && data?.errors?.length > 0) {
      // Fall back to first error message if no message field
      msg = data.errors[0].message || data.errors[0].msg;
    }
    if (!msg) {
      // Final fallback to HTTP status
      msg = `HTTP ${response.status}`;
    }
    
    console.error('[API] Error response:', { status: response.status, message: msg, errors: data?.errors });
    throw new FNApiError(msg, response.status, data?.errors || []);
  }

  return data;
}

/* ════════════════════════════════════════════════════════════
   AUTH API
   ════════════════════════════════════════════════════════════ */
const FN_AUTH_API = {

  register: async (payload) => {
    const r = await apiFetch('/auth/register', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
    FN_AUTH.setToken(r.token);
    FN_AUTH.setUser(r.user);
    window.dispatchEvent(new CustomEvent('fn:login', { detail: r.user }));
    return r;
  },

  login: async (email, password) => {
    const r = await apiFetch('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });
    FN_AUTH.setToken(r.token);
    FN_AUTH.setUser(r.user);
    window.dispatchEvent(new CustomEvent('fn:login', { detail: r.user }));
    return r;
  },

  // Fetches fresh user data from backend and updates localStorage cache
  getMe: async () => {
    const r = await apiFetch('/auth/me');
    FN_AUTH.setUser(r.user);
    return r.user;
  },

  updateProfile: async (payload) => {
    const r = await apiFetch('/auth/update-profile', {
      method: 'PUT',
      body:   JSON.stringify(payload),
    });
    FN_AUTH.setUser(r.user);
    return r.user;
  },

  changePassword: async (currentPassword, newPassword) =>
    apiFetch('/auth/change-password', {
      method: 'PUT',
      body:   JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: () => FN_AUTH.logout(),
};

/* ════════════════════════════════════════════════════════════
   EVENTS API
   ════════════════════════════════════════════════════════════ */
const FN_EVENTS_API = {

  // Public feed — backend enforces status:"approved" server-side
  getEvents: async (params = {}) => {
    const q = new URLSearchParams();
    ['page','limit','category','mode','fee','search','sort','badge'].forEach(k => {
      if (params[k] !== undefined && params[k] !== '' && params[k] !== 'All')
        q.set(k, params[k]);
    });
    return apiFetch('/events?' + q.toString());
  },

  getEvent: async (id) => {
    if (!id) throw new FNApiError('Event ID is required', 400);
    const r = await apiFetch('/events/' + id);
    if (!r.event) throw new FNApiError('Event data not found', 404);
    return r.event;
  },

  search: async (q, page = 1, limit = 12) =>
    apiFetch('/events/search?' + new URLSearchParams({ q, page, limit })),

  // FormData body (poster + brochure files)
  createEvent: async (formData) =>
    apiFetch('/events', { method: 'POST', body: formData }),

  updateEvent: async (id, formData) =>
    apiFetch('/events/' + id, { method: 'PUT', body: formData }),

  // Shows browser confirm() before DELETE — returns promise
  deleteEvent: async (id, skipConfirm = false) => {
    if (!skipConfirm) {
      const ok = window.confirm(
        'Are you sure you want to delete this event?\n\nThis action cannot be undone.'
      );
      if (!ok) return { success: false, cancelled: true };
    }
    return apiFetch('/events/' + id, { method: 'DELETE' });
  },

  getMyEvents:    async () => apiFetch('/events/my/events'),
  toggleSave:     async (id) => apiFetch('/events/' + id + '/save', { method: 'POST' }),
  getSavedEvents: async () => apiFetch('/events/saved/list'),

  // ── Admin ──────────────────────────────────────────────────
  getPending:   async () => apiFetch('/events/admin/pending'),
  getStats:     async () => apiFetch('/events/admin/stats'),
  approveEvent: async (id, body = {}) =>
    apiFetch('/events/' + id + '/approve', { method: 'PATCH', body: JSON.stringify(body) }),
  rejectEvent:  async (id, reason = '') =>
    apiFetch('/events/' + id + '/reject',  { method: 'PATCH', body: JSON.stringify({ reason }) }),
};

/* ════════════════════════════════════════════════════════════
   USERS API
   ════════════════════════════════════════════════════════════ */
const FN_USERS_API = {
  getProfile:     () => apiFetch('/users/profile'),
  updateProfile:  (d) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(d) }),
  getSavedEvents: () => apiFetch('/users/saved-events'),
};

/* ════════════════════════════════════════════════════════════
   LOCAL SESSION FALLBACK
   Used for save-count when user is not logged in.
   ════════════════════════════════════════════════════════════ */
function fnGetSaved()  { try { return JSON.parse(sessionStorage.getItem('fn_saved')) || []; } catch { return []; } }
function fnSetSaved(a) { try { sessionStorage.setItem('fn_saved', JSON.stringify(a)); } catch {} }
function fnIsSaved(id) { return fnGetSaved().includes(String(id)); }
function fnToggleSave(id) {
  const a = fnGetSaved(), s = String(id), i = a.indexOf(s);
  if (i === -1) { a.push(s); fnSetSaved(a); return true; }
  a.splice(i, 1); fnSetSaved(a); return false;
}
function fnSavedCount() { return fnGetSaved().length; }

/* ════════════════════════════════════════════════════════════
   GLOBAL EXPORTS — accessible from every page script
   ════════════════════════════════════════════════════════════ */
window.API_BASE       = API_BASE;
window.FN_AUTH        = FN_AUTH;
window.FN_AUTH_API    = FN_AUTH_API;
window.FN_EVENTS_API  = FN_EVENTS_API;
window.FN_USERS_API   = FN_USERS_API;
window.FNApiError     = FNApiError;
window.apiFetch       = apiFetch;
window.fnGetSaved     = fnGetSaved;
window.fnSetSaved     = fnSetSaved;
window.fnIsSaved      = fnIsSaved;
window.fnToggleSave   = fnToggleSave;
window.fnSavedCount   = fnSavedCount;
