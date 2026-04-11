/* FESTNEST — LANDING  |  assets/js/landing.js */
'use strict';

// Hide CTA banner for logged-in users
function updateCTAVisibility() {
  const ctaBanner = document.getElementById('ctaBanner');
  if (!ctaBanner) return;
  
  if (FN_AUTH && FN_AUTH.isLoggedIn()) {
    ctaBanner.style.display = 'none';
  } else {
    ctaBanner.style.display = 'block';
  }
}

// Check on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCTAVisibility();
  
  // Listen for auth changes
  window.addEventListener('fn:login', updateCTAVisibility);
  window.addEventListener('fn:logout', updateCTAVisibility);
  window.addEventListener('auth-state-changed', updateCTAVisibility);
  
  // Intersection observer for animations
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.animationDelay = (i * .07) + 's';
        e.target.classList.add('animate-fadeInUp');
        obs.unobserve(e.target);
      }
    });
  }, {threshold: .1});
  
  document.querySelectorAll('.feature-card,.how-card,.testi-card,.category-card').forEach(el => obs.observe(el));
});
