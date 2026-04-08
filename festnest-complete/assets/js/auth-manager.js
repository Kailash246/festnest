/* ============================================================
   FESTNEST AUTHENTICATION MANAGER
   Version: 2.0 — Centralized Auth Control
   
   This module:
   — Provides a SINGLE global openAuthModal() interface
   — Enforces auth checks before protected actions
   — Prevents access to event pages without login
   — Replaces ALL old modal triggers with this unified API
   
   USAGE:
   - Auth.openModal('signup') — Opens signup modal to role selection
   - Auth.openModal('login') — Opens login form
   - Auth.isLoggedIn() — Checks if user is authenticated
   - Auth.requireAuth() — Enforces auth + redirects if needed
   
   Dependencies:
   - FN_AUTH (from api.js) — token & user storage
   - window.openAuthModal (from auth.js) — actual modal implementation
   ============================================================ */

'use strict';

window.Auth = (function() {
  
  /* ════════════════════════════════════════════════════════
     CORE API
  ════════════════════════════════════════════════════════ */
  
  /* Open auth modal at specific tab/step */
  function openModal(step = 'signup') {
    const step_map = {
      'signup':  'signup',
      'login':   'login',
      'role':    'signup',  /* Redirect role selection to signup */
    };
    const tab = step_map[step] || 'signup';
    
    // Try new 3-step modal first (auth.js)
    if (typeof window.openAuthModal === 'function') {
      window.openAuthModal(tab);
    }
    // Fallback to old modal trigger (auth-ui.js)
    else if (typeof window.openAuthModal === 'function') {
      window.openAuthModal(tab);
    }
  }

  /* Close auth modal */
  function closeModal() {
    if (typeof window.closeAuthModal === 'function') {
      window.closeAuthModal();
    }
  }

  /* Check if user is logged in */
  function isLoggedIn() {
    return FN_AUTH && FN_AUTH.isLoggedIn();
  }

  /* Get current user */
  function getUser() {
    return FN_AUTH ? FN_AUTH.getUser() : null;
  }

  /* ════════════════════════════════════════════════════════
     AUTH ENFORCEMENT
  ════════════════════════════════════════════════════════ */
  
  /* 
     Protect an action that requires auth.
     Usage:
       if (!Auth.require()) return;
       // proceed with action
  */
  function require() {
    if (!isLoggedIn()) {
      openModal('login');
      return false;
    }
    return true;
  }

  /* 
     Require specific role(s).
     Usage:
       if (!Auth.requireRole('organizer')) return;
       // proceed with organizer-only action
  */
  function requireRole(...roles) {
    if (!require()) return false;
    const user = getUser();
    if (!user || !roles.includes(user.role)) {
      if (typeof showToast === 'function') {
        showToast(`Access denied. Requires: ${roles.join(' or ')}.`, 'error');
      }
      return false;
    }
    return true;
  }

  /* 
     Enforce auth before page access.
     Redirects to home if not logged in.
     Usage:
       if (!Auth.requirePage('organizer')) {
         // Page will handle redirect automatically
         return;
       }
  */
  function requirePage(role = null) {
    if (!isLoggedIn()) {
      if (typeof showToast === 'function') {
        showToast('Please log in to access this page.', 'info');
      }
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 500);
      return false;
    }

    if (role) {
      const user = getUser();
      if (!user || user.role !== role) {
        if (typeof showToast === 'function') {
          showToast(`This page is for ${role}s only.`, 'error');
        }
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 800);
        return false;
      }
    }

    return true;
  }

  /* ════════════════════════════════════════════════════════
     EVENT PROTECTION
  ════════════════════════════════════════════════════════ */
  
  /* 
     Protect event registration.
     Usage:
       if (!Auth.requireForEvent('register')) return;
       // make API call to register
  */
  function requireForEvent(action = 'register') {
    if (!isLoggedIn()) {
      if (typeof showToast === 'function') {
        showToast(`Please log in to ${action} for events.`, 'info');
      }
      openModal('login');
      return false;
    }
    return true;
  }

  /* ════════════════════════════════════════════════════════
     LOGOUT
  ════════════════════════════════════════════════════════ */
  
  function logout() {
    if (FN_AUTH) {
      FN_AUTH.logout();
    }
    if (typeof showToast === 'function') {
      showToast('👋 Logged out successfully!', 'success');
    }
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  /* ════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════ */
  
  function init() {
    // Ensure auth checks work even if FN_AUTH not yet defined
    if (typeof FN_AUTH === 'undefined') {
      console.warn('[Auth] FN_AUTH not loaded. Make sure api.js loads before auth-manager.js');
    }
  }

  /* Call on script load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ════════════════════════════════════════════════════════
     EXPORTS
  ════════════════════════════════════════════════════════ */
  
  return {
    openModal,
    closeModal,
    isLoggedIn,
    getUser,
    require,
    requireRole,
    requirePage,
    requireForEvent,
    logout,
  };

})();

/* Alias for backward compatibility */
window.AuthManager = window.Auth;
