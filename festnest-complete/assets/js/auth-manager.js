/* ============================================================
   FESTNEST AUTHENTICATION MANAGER
   Version: 2.1 — Full-Screen Auth Gate + Centralized Auth Control
   
   This module:
   — Provides a SINGLE global openAuthModal() interface
   — Enforces auth checks before protected actions
   — Prevents access to event pages without login
   — FULL-SCREEN blocking modal for protected navigation
   — Redirect after auth to intended page
   — Replaces ALL old modal triggers with this unified API
   
   USAGE:
   - Auth.openModal('signup') — Opens signup modal to role selection (FULL-SCREEN)
   - Auth.openModal('login') — Opens login form (FULL-SCREEN)
   - Auth.isLoggedIn() — Checks if user is authenticated
   - Auth.requireAuth() — Enforces auth + redirects if needed
   - Auth.setRedirectPath(path) — Set where to go after auth
   - Auth.getRedirectPath() — Get pending redirect
   
   Dependencies:
   - FN_AUTH (from api.js) — token & user storage
   - window.openAuthModal (from auth.js) — actual modal implementation
   ============================================================ */

'use strict';

window.Auth = (function() {
  
  /* ════════════════════════════════════════════════════════
     PROTECTED PAGES & REDIRECT LOGIC
  ════════════════════════════════════════════════════════ */
  
  let redirectAfterAuth = null;
  
  /* Store where to redirect after successful auth */
  function setRedirectPath(path) {
    redirectAfterAuth = path;
  }
  
  /* Get pending redirect (and clear it) */
  function getRedirectPath() {
    const path = redirectAfterAuth;
    redirectAfterAuth = null;
    return path;
  }
  
  /* Check if URL is a protected route */
  function isProtectedRoute(url) {
    const protectedRoutes = [
      '/events',
      '/pages/events.html',
      '/post',
      '/post-event',
      '/pages/post-event.html',
      '/my-events',
      '/pages/my-events.html',
    ];
    
    const pathname = new URL(url, window.location.origin).pathname.toLowerCase();
    return protectedRoutes.some(route => pathname.includes(route));
  }
  
  /* ════════════════════════════════════════════════════════
     CORE API
  ════════════════════════════════════════════════════════ */
  
  /* Open auth modal at specific tab/step — FULL-SCREEN */
  function openModal(step = 'signup', isFullScreen = false) {
    const step_map = {
      'signup':  'signup',
      'login':   'login',
      'role':    'signup',  /* Redirect role selection to signup */
    };
    const tab = step_map[step] || 'signup';
    
    // Try new 3-step modal first (auth.js)
    if (typeof window.openAuthModal === 'function') {
      window.openAuthModal(tab);
      
      // Make modal full-screen if needed
      if (isFullScreen) {
        const modal = document.getElementById('authModal');
        if (modal) {
          modal.classList.add('modal--fullscreen');
          modal.setAttribute('data-fullscreen', 'true');
        }
      }
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
    
    // Remove full-screen class
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('modal--fullscreen');
      modal.removeAttribute('data-fullscreen');
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
     Protect navigation to restricted pages.
     Shows FULL-SCREEN auth modal if not logged in.
     Usage in link/button click handlers:
       if (!Auth.guardRoute('/events')) return;
       // allow navigation
  */
  function guardRoute(targetPath) {
    if (isLoggedIn()) {
      return true; /* Allow navigation */
    }
    
    /* User not logged in — block and show auth gate */
    if (typeof showToast === 'function') {
      showToast('Please log in to access this page.', 'info');
    }
    
    /* Store intended destination */
    setRedirectPath(targetPath);
    
    /* Show FULL-SCREEN auth modal */
    openModal('role', true); /* true = full-screen */
    
    return false; /* Block navigation */
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
    guardRoute,
    setRedirectPath,
    getRedirectPath,
    isProtectedRoute,
  };

})();

/* Alias for backward compatibility */
window.AuthManager = window.Auth;
