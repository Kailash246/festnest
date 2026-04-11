/* ============================================================
   FESTNEST — GLOBAL CTA SIGNUP BUTTON VISIBILITY MANAGER
   Hides "Sign Up Free" button for logged-in users
   
   The CTA banner container stays visible so users can still
   see the "Browse Events" link, but the signup button is hidden
   for a professional authenticated experience.
   ============================================================ */
'use strict';

(function initCTAVisibility() {
  
  function updateCTAButtons() {
    // Check if user is logged in
    const isLoggedIn = FN_AUTH && FN_AUTH.isLoggedIn();
    
    // Find ALL signup buttons in CTA banners (handle variations)
    const signupButtons = document.querySelectorAll(
      '#ctaSignupBtn, #ctaSignupBtn, [id*="signup"], [class*="cta"][class*="signup"]'
    );
    
    signupButtons.forEach(btn => {
      // Only hide buttons that are signup/get-started related
      if (btn.id === 'ctaSignupBtn' || 
          btn.textContent.includes('Sign Up') || 
          btn.textContent.includes('Get Started')) {
        btn.style.display = isLoggedIn ? 'none' : 'block';
        if (isLoggedIn) {
          btn.setAttribute('data-hidden-for-user', 'true');
        } else {
          btn.removeAttribute('data-hidden-for-user');
        }
      }
    });
  }

  // Update on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCTAButtons);
  } else {
    updateCTAButtons();
  }

  // Update on auth changes
  window.addEventListener('fn:login', updateCTAButtons);
  window.addEventListener('fn:logout', updateCTAButtons);
  window.addEventListener('auth-state-changed', updateCTAButtons);

})();
