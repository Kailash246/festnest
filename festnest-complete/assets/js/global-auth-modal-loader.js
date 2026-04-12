/* ============================================================
   FESTNEST — GLOBAL AUTH MODAL LOADER
   Ensures a single auth modal is available on all pages
   
   This module:
   1. Checks if auth modal exists on current page
   2. If NOT, loads it from the global modal HTML
   3. Ensures auth.js works correctly regardless of page
   
   Load this FIRST, before auth.js on all pages
   ============================================================ */
'use strict';

(function initGlobalAuthModal() {
  
  // Early return if modal already exists on page
  if (document.getElementById('authModal')) {
    console.log('[Auth Modal] Modal already present on page');
    return;
  }

  // HTML for the global auth modal
  // This is injected if the page doesn't already have it
  const GLOBAL_AUTH_MODAL_HTML = `
<div class="modal-overlay" id="authModal" role="dialog" aria-modal="true" aria-label="Sign in or create account">
  <div class="modal-box modal-box--auth" id="authModalBox">
    <button class="modal-close" id="authModalClose" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    <div class="auth-logo">FestNest</div>
    <div class="auth-tabs" role="tablist">
      <button class="auth-tab" id="tab-login"  role="tab" aria-selected="false">Log In</button>
      <button class="auth-tab auth-tab--active" id="tab-signup" role="tab" aria-selected="true">Sign Up</button>
    </div>
    
    <!-- LOGIN FORM -->
    <form class="auth-form" id="login-form" style="display:none;" novalidate>
      <div class="form-group">
        <label class="form-label" for="loginEmail">Email</label>
        <input class="form-input" id="loginEmail" type="email" placeholder="your@email.com" autocomplete="email" />
        <span class="form-error-msg" id="loginEmailErr"></span>
      </div>
      <div class="form-group">
        <label class="form-label" for="loginPwd">Password</label>
        <div class="su-pwd-wrap">
          <input class="form-input" id="loginPwd" type="password" placeholder="••••••••" autocomplete="current-password" />
          <button type="button" class="su-eye-btn" aria-label="Show/hide password" data-target="loginPwd"><i class="fa-solid fa-eye"></i></button>
        </div>
        <span class="form-error-msg" id="loginPwdErr"></span>
      </div>
      <button type="submit" class="btn btn-primary w-full btn-lg">Log In</button>
      <div class="auth-divider"><span>or</span></div>
      <button type="button" class="btn btn-outline w-full"><i class="fa-solid fa-arrow-up-right-from-square"></i> Continue with Google</button>
      <p class="auth-footer-text">
        No account?
        <button type="button" class="auth-switch-btn" data-switch="signup">Sign up free</button>
      </p>
    </form>

    <!-- SIGNUP SHELL (MULTI-STEP) -->
    <div id="su-shell" role="tabpanel">
      <!-- Progress bar -->
      <div class="su-steps" id="suStepBar" aria-label="Signup progress">
        <div class="su-step su-step--active" data-step="0" aria-label="Step 1 of 3: Role">
          <div class="su-step-dot"><span>1</span></div>
          <div class="su-step-label">Role</div>
        </div>
        <div class="su-step-line"></div>
        <div class="su-step" data-step="1" aria-label="Step 2 of 3: Account">
          <div class="su-step-dot"><span>2</span></div>
          <div class="su-step-label">Account</div>
        </div>
        <div class="su-step-line"></div>
        <div class="su-step" data-step="2" aria-label="Step 3 of 3: Profile">
          <div class="su-step-dot"><span>3</span></div>
          <div class="su-step-label">Profile</div>
        </div>
      </div>

      <!-- Global error -->
      <div class="auth-error" id="suGlobalErr" style="display:none;"></div>

      <!-- Step 0: Role Selection -->
      <div class="su-panel" id="suStep0" aria-label="Select your role">
        <div class="su-step-header">
          <div class="su-step-title">Join FestNest</div>
          <div class="su-step-desc">What would you like to do?</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;">
          <button type="button" class="su-role-card" data-role="student" aria-pressed="false" tabindex="0">
            <span class="su-role-icon"><i class="fa-solid fa-graduation-cap"></i></span>
            <span class="su-role-title">Student</span>
            <span class="su-role-desc">Find &amp; attend events</span>
            <span class="su-role-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
          </button>
          <button type="button" class="su-role-card" data-role="organizer" aria-pressed="false" tabindex="0">
            <span class="su-role-icon"><i class="fa-solid fa-building-columns"></i></span>
            <span class="su-role-title">Organizer</span>
            <span class="su-role-desc">Post &amp; manage events</span>
            <span class="su-role-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
          </button>
        </div>
        <button type="button" class="btn btn-primary w-full btn-lg su-next-btn" id="suStep0Next" disabled>Continue →</button>
        <p class="auth-footer-text" style="margin-top:10px;">Have an account? <button type="button" class="auth-switch-btn" data-switch="login">Log in</button></p>
      </div>

      <!-- Step 1 & 2 will be dynamically filled by auth.js -->
      <div class="su-panel" id="suStep1" style="display:none;" aria-label="Account setup"></div>
      <div class="su-panel" id="suStep2" style="display:none;" aria-label="Profile details"></div>
    </div>
  </div>
</div>
  `;

  // Inject modal into body
  function injectModal() {
    // Create wrapper to contain the HTML string
    const wrapper = document.createElement('div');
    wrapper.innerHTML = GLOBAL_AUTH_MODAL_HTML;
    
    // Append to body
    document.body.appendChild(wrapper.firstElementChild);
    
    console.log('[Auth Modal] Global modal injected into page');
    
    // Dispatch custom event so other scripts know modal is ready
    window.dispatchEvent(new CustomEvent('fn:modal-injected', { detail: { source: 'global-modal-loader' } }));
  }

  // Inject modal when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModal);
  } else {
    injectModal();
  }

})();
