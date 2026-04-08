/* ============================================================
   FESTNEST AUTH LOCKSCREEN LOADER
   Version: 1.0 — Dynamic Loading of Animated Lock Screen
   
   This module:
   — Checks user authentication status
   — Loads lockscreen HTML into designated container
   — Handles smooth transitions between locked/unlocked states
   — Manages button interactions
   
   USAGE:
   AuthLockscreenLoader.init({
     containerSelector: '#authLockContainer',
     layoutSelector: '#eventsLayoutContent',
     lockscreenUrl: '/pages/events-auth-lockscreen.html'
   });
   
   Dependencies:
   - FN_AUTH (from api.js) — token & user storage
   - Auth (from auth-manager.js) — unified auth API
   ============================================================ */

'use strict';

window.AuthLockscreenLoader = (function() {
  
  /* ════════════════════════════════════════════════════════
     CONFIGURATION
  ════════════════════════════════════════════════════════ */
  
  let config = {
    containerSelector: '#authLockContainer',
    layoutSelector: '#eventsLayoutContent',
    lockscreenUrl: '../pages/events-auth-lockscreen.html',  // Relative path for better compatibility
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
  };
  
  let lockscreenContent = null;
  let cacheTime = null;
  let isInitialized = false;
  
  /* ════════════════════════════════════════════════════════
     HELPER FUNCTIONS
  ════════════════════════════════════════════════════════ */
  
  function isUserLoggedIn() {
    return FN_AUTH && FN_AUTH.isLoggedIn();
  }
  
  function getContainer() {
    return document.querySelector(config.containerSelector);
  }
  
  function getLayout() {
    return document.querySelector(config.layoutSelector);
  }
  
  /* ════════════════════════════════════════════════════════
     LOCKSCREEN LOADER
  ════════════════════════════════════════════════════════ */
  
  async function loadLockscreenHTML() {
    // Return cached content if still valid
    if (lockscreenContent && cacheTime && (Date.now() - cacheTime < config.cacheTimeout)) {
      return lockscreenContent;
    }
    
    try {
      console.log('[AuthLockscreen] Fetching lockscreen HTML...');
      const response = await fetch(config.lockscreenUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load lockscreen: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extract just the auth-lock-section content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const lockSection = doc.querySelector('.auth-lock-section');
      
      if (!lockSection) {
        console.warn('[AuthLockscreen] Could not find .auth-lock-section in lockscreen HTML');
        return null;
      }
      
      // Extract CSS from lockscreen
      const styles = doc.querySelectorAll('style');
      const styleContent = Array.from(styles).map(s => s.textContent).join('\n');
      
      // Cache everything
      lockscreenContent = {
        html: lockSection,
        styles: styleContent
      };
      cacheTime = Date.now();
      
      console.log('[AuthLockscreen] Lockscreen loaded and cached');
      return lockscreenContent;
    } catch (error) {
      console.error('[AuthLockscreen] Error loading lockscreen:', error);
      return null;
    }
  }
  
  /* ════════════════════════════════════════════════════════
     RENDER LOCKSCREEN
  ════════════════════════════════════════════════════════ */
  
  async function showLockscreen() {
    const container = getContainer();
    const layout = getLayout();
    
    if (!container) {
      console.warn('[AuthLockscreen] Container not found:', config.containerSelector);
      return;
    }
    
    // Load lockscreen content
    const content = await loadLockscreenHTML();
    if (!content) {
      console.error('[AuthLockscreen] Failed to load lockscreen content');
      return;
    }
    
    // Inject styles into document (once)
    if (document.getElementById('auth-lockscreen-styles') === null) {
      const styleEl = document.createElement('style');
      styleEl.id = 'auth-lockscreen-styles';
      styleEl.textContent = content.styles;
      document.head.appendChild(styleEl);
    }
    
    // Clear container and inject lockscreen HTML
    container.innerHTML = '';
    const lockHTML = content.html.outerHTML || content.html;
    container.innerHTML = lockHTML;
    
    // Wire up button handlers
    wireUpLockscreenButtons();
    
    // Initialize animations
    initLockscreenAnimations();
    
    // Show lockscreen
    if (layout) {
      layout.style.display = 'none';
    }
    container.style.display = 'block';
    
    console.log('[AuthLockscreen] Lockscreen rendered');
  }
  
  /* ════════════════════════════════════════════════════════
     SHOW CONTENT
  ════════════════════════════════════════════════════════ */
  
  function showContent() {
    const container = getContainer();
    const layout = getLayout();
    
    // Clear lockscreen
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
    
    // Show events layout
    if (layout) {
      layout.style.display = '';
    }
    
    console.log('[AuthLockscreen] Content layout shown');
  }
  
  /* ════════════════════════════════════════════════════════
     BUTTON HANDLERS
  ════════════════════════════════════════════════════════ */
  
  function wireUpLockscreenButtons() {
    const container = getContainer();
    if (!container) return;
    
    // Find signup button
    const signupBtn = container.querySelector('#lockSignupBtn');
    if (signupBtn) {
      // Remove old onclick attribute
      signupBtn.removeAttribute('onclick');
      signupBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof Auth !== 'undefined' && Auth.openModal) {
          Auth.openModal('signup');
        } else if (typeof openAuthModal === 'function') {
          openAuthModal('signup');
        }
      });
    }
    
    // Find login button
    const loginBtn = container.querySelector('#lockLoginBtn');
    if (loginBtn) {
      // Remove old onclick attribute
      loginBtn.removeAttribute('onclick');
      loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof Auth !== 'undefined' && Auth.openModal) {
          Auth.openModal('login');
        } else if (typeof openAuthModal === 'function') {
          openAuthModal('login');
        }
      });
    }
    
    console.log('[AuthLockscreen] Button handlers wired up');
  }
  
  /* ════════════════════════════════════════════════════════
     ANIMATION INITIALIZATION
  ════════════════════════════════════════════════════════ */
  
  function initLockscreenAnimations() {
    // Animations are CSS-driven, but you can add JS interactions here if needed
    
    // Example: Add hover effect to lock icon
    const lockIcon = document.getElementById('lockIcon');
    if (lockIcon) {
      lockIcon.addEventListener('mouseenter', function() {
        // Could add JS animation here if needed
      });
    }
    
    console.log('[AuthLockscreen] Animations initialized');
  }
  
  /* ════════════════════════════════════════════════════════
     MAIN INIT FUNCTION
  ════════════════════════════════════════════════════════ */
  
  function init(options = {}) {
    // Merge custom config
    config = { ...config, ...options };
    
    if (isInitialized) {
      console.warn('[AuthLockscreen] Already initialized');
      return;
    }
    
    console.log('[AuthLockscreen] Initializing...');
    
    // Check authentication and render accordingly
    if (!isUserLoggedIn()) {
      showLockscreen();
    } else {
      showContent();
    }
    
    isInitialized = true;
  }
  
  /* ════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════ */
  
  return {
    init,
    isUserLoggedIn,
    showLockscreen,
    showContent,
    reload: function() {
      isInitialized = false;
      lockscreenContent = null;
      init();
    }
  };
  
})();

/* Auto-init on DOM ready (optional, can be called manually) */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // Only auto-init if element exists
    if (document.querySelector('#authLockContainer')) {
      AuthLockscreenLoader.init();
    }
  });
} else {
  if (document.querySelector('#authLockContainer')) {
    AuthLockscreenLoader.init();
  }
}
