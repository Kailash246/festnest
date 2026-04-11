/* ============================================================
   FESTNEST — GLOBAL CTA BANNER VISIBILITY MANAGER
   Hides "Sign Up" CTA sections for logged-in users
   
   This ensures a professional experience for authenticated users
   by removing promotional CTAs when they're not needed.
   ============================================================ */
'use strict';

(function initCTAVisibility() {
  
  function updateCTABanners() {
    // Check if user is logged in
    const isLoggedIn = FN_AUTH && FN_AUTH.isLoggedIn();
    
    // Find all CTA banners on the page
    const banners = document.querySelectorAll('.cta-banner[id^="ctaBanner"]');
    
    banners.forEach(banner => {
      if (isLoggedIn) {
        // Hide for logged-in users
        banner.style.display = 'none';
        banner.setAttribute('data-hidden-for-user', 'true');
      } else {
        // Show for guests
        banner.style.display = 'block';
        banner.removeAttribute('data-hidden-for-user');
      }
    });
  }

  // Update on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCTABanners);
  } else {
    updateCTABanners();
  }

  // Update on auth changes
  window.addEventListener('fn:login', updateCTABanners);
  window.addEventListener('fn:logout', updateCTABanners);
  window.addEventListener('auth-state-changed', updateCTABanners);

})();
