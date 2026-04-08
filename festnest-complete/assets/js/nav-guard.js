/* ============================================================
   FESTNEST NAVIGATION GUARD
   Version: 1.0 — Full-Screen Auth Gate for Protected Routes
   
   Intercepts navigation to protected pages and shows
   FULL-SCREEN blocking auth modal if user not logged in.
   
   Protected Routes:
   - /events
   - /post-event
   - /my-events
   
   Dependencies:
   - Auth (from auth-manager.js) — centralized auth control
   - FN_AUTH (from api.js) — token & user storage
   ============================================================ */

'use strict';

(function initNavGuard() {
  
  /* ────────────────────────────────────────────────────────
     PROTECTED ROUTES
     ──────────────────────────────────────────────────────── */
  
  const PROTECTED_ROUTES = [
    '/events',
    '/post',
    '/post-event',
    '/my-events',
  ];

  function isProtectedRoute(href) {
    if (!href) return false;
    
    // Handle both file:// and http:// protocols
    let pathname = href.toLowerCase();
    
    // If it's an absolute URL, extract pathname
    if (href.includes('://')) {
      try {
        pathname = new URL(href).pathname.toLowerCase();
      } catch {
        pathname = href.toLowerCase();
      }
    }
    
    // Remove query parameters for comparison
    pathname = pathname.split('?')[0];
    
    return PROTECTED_ROUTES.some(route => 
      pathname.includes(route) || 
      pathname.endsWith(route) ||
      pathname.endsWith(route + '.html')
    );
  }

  /* ────────────────────────────────────────────────────────
     INTERCEPT ALL LINK CLICKS
     ──────────────────────────────────────────────────────── */
  
  document.addEventListener('click', function(e) {
    // Find the closest anchor tag
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip if external link
    if (href.startsWith('http') && !href.includes(window.location.origin)) {
      return;
    }

    // Skip if fragment/anchor
    if (href.startsWith('#')) {
      return;
    }

    // Skip if already has target="_blank"
    if (link.getAttribute('target') === '_blank') {
      return;
    }

    // Check if this is a protected route
    if (!isProtectedRoute(href)) {
      return;
    }

    // User is logged in - allow navigation
    if (Auth && Auth.isLoggedIn && Auth.isLoggedIn()) {
      return;
    }

    // BLOCK navigation to protected page
    e.preventDefault();
    e.stopPropagation();

    // Show toast
    if (typeof showToast === 'function') {
      showToast('Please log in to access this page.', 'info');
    }

    // Store intended destination
    if (Auth && Auth.setRedirectPath) {
      Auth.setRedirectPath(href);
    }

    // Show FULL-SCREEN auth gate
    if (Auth && Auth.openModal) {
      Auth.openModal('role', true); /* true = full-screen, 'role' = start at role selection */
    }
  }, true); /* Use capture phase to intercept before default action */

  /* ────────────────────────────────────────────────────────
     INTERCEPT NAVIGATION API CALLS
     ──────────────────────────────────────────────────────── */
  
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function(state, title, url) {
    if (url && isProtectedRoute(url) && (!Auth || !Auth.isLoggedIn())) {
      if (Auth && Auth.setRedirectPath) Auth.setRedirectPath(url);
      if (Auth && Auth.openModal) Auth.openModal('role', true);
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  window.history.replaceState = function(state, title, url) {
    if (url && isProtectedRoute(url) && (!Auth || !Auth.isLoggedIn())) {
      if (Auth && Auth.setRedirectPath) Auth.setRedirectPath(url);
      if (Auth && Auth.openModal) Auth.openModal('role', true);
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };

  /* ────────────────────────────────────────────────────────
     INIT
     ──────────────────────────────────────────────────────── */
  
  console.log('[NavGuard] Initialized. Protected routes:', PROTECTED_ROUTES);

})();
