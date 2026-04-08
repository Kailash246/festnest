/* ============================================================
   FESTNEST AUTHENTICATION MANAGER
   Version: 3.0 — Clean Auth System with Inline Lock Screens
   
   This module provides:
   — Single global Auth interface
   — Auth checks for actions & pages
   — Inline lock screen rendering for protected pages
   — Modal opens only on user action (Sign Up / Log In clicks)
   
   USAGE:
   - Auth.openModal('signup') — Opens signup modal
   - Auth.openModal('login') — Opens login form
   - Auth.isLoggedIn() — Checks if user is authenticated
   - Auth.renderLockScreen(options) — Show lock UI for protected page
   - Auth.requireForEvent('action') — Protect event actions
   
   Dependencies:
   - FN_AUTH (from api.js) — token & user storage
   - window.openAuthModal (from auth.js) — modal implementation
   ============================================================ */

'use strict';

window.Auth = (function() {
  
  /* ════════════════════════════════════════════════════════
     AUTH STATUS
  ════════════════════════════════════════════════════════ */
  
  function isLoggedIn() {
    return FN_AUTH && FN_AUTH.isLoggedIn();
  }

  function getUser() {
    return FN_AUTH ? FN_AUTH.getUser() : null;
  }

  /* ════════════════════════════════════════════════════════
     MODAL CONTROL (NO UI CHANGES)
  ════════════════════════════════════════════════════════ */
  
  function openModal(step = 'signup') {
    const tab = (step === 'role') ? 'signup' : step;
    if (typeof window.openAuthModal === 'function') {
      window.openAuthModal(tab);
    }
  }

  function closeModal() {
    if (typeof window.closeAuthModal === 'function') {
      window.closeAuthModal();
    }
  }

  /* ════════════════════════════════════════════════════════
     ACTION PROTECTION
  ════════════════════════════════════════════════════════ */
  
  /* Protect event actions (register, save, etc.) */
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

  /* Require specific role for action */
  function requireRole(...roles) {
    if (!isLoggedIn()) {
      openModal('login');
      return false;
    }
    const user = getUser();
    if (!user || !roles.includes(user.role)) {
      if (typeof showToast === 'function') {
        showToast(`Requires: ${roles.join(' or ')}.`, 'error');
      }
      return false;
    }
    return true;
  }

  /* ════════════════════════════════════════════════════════
     INLINE LOCK SCREEN FOR PROTECTED PAGES
  ════════════════════════════════════════════════════════ */
  
  function renderLockScreen(options = {}) {
    const {
      title = 'Log in to see your events',
      description = 'Create a free account and explore all events.',
      buttonText = 'Sign Up Free',
      containerId = 'authLockContainer'
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[Auth] Container #${containerId} not found`);
      return;
    }

    const lockHTML = `
      <div class="auth-lock">
        <div class="auth-lock-content">
          <h2 class="auth-lock-title">${title}</h2>
          <p class="auth-lock-description">${description}</p>
          <button class="btn btn-primary auth-lock-button" onclick="Auth.openModal('signup')">
            ${buttonText}
          </button>
          <p class="auth-lock-footer">
            Already have an account? 
            <button class="auth-lock-login-link" onclick="Auth.openModal('login')">Log in</button>
          </p>
        </div>
      </div>
    `;

    container.innerHTML = lockHTML;
    return container;
  }

  /* ════════════════════════════════════════════════════════
     PAGE RENDER HELPERS
  ════════════════════════════════════════════════════════ */
  
  /* Call on protected page load to check auth */
  function initProtectedPage(options = {}) {
    const {
      containerId = 'authLockContainer',
      lockTitle = 'Log in to see your events',
      lockDescription = 'Create a free account and explore all events.',
      onLock = null,  // callback if lock screen is shown
      onUnlock = null // callback if user is logged in
    } = options;

    if (!isLoggedIn()) {
      renderLockScreen({
        title: lockTitle,
        description: lockDescription,
        containerId: containerId
      });
      if (typeof onLock === 'function') {
        onLock();
      }
      return false;
    } else {
      if (typeof onUnlock === 'function') {
        onUnlock();
      }
      return true;
    }
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
      window.location.href = '/index.html';
    }, 800);
  }

  /* ════════════════════════════════════════════════════════
     INITIALIZATION
  ════════════════════════════════════════════════════════ */
  
  function init() {
    if (typeof FN_AUTH === 'undefined') {
      console.warn('[Auth] FN_AUTH not loaded. Ensure api.js loads before auth-manager.js');
    }
  }

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
    renderLockScreen,
    initProtectedPage,
    requireForEvent,
    requireRole,
    logout
  };

})();

/* Backward compatibility alias */
window.AuthManager = window.Auth;
