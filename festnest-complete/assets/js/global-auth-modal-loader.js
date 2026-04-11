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

  // HTML for the global auth modal (COMPLETE OTP-ENABLED VERSION from index.html)
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
    <div id="su-shell" role="tabpanel">
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
      <div class="su-panel" id="suStep0" aria-label="Choose your role">
        <div class="su-step-header">
          <div class="su-step-title">I want to join as…</div>
          <div class="su-step-desc">Your role personalizes your FestNest experience.</div>
        </div>
        <div class="su-role-grid" role="radiogroup" aria-label="Select role">
          <button type="button" class="su-role-card" id="roleStudent" data-role="student" role="radio" aria-checked="false">
            <div class="su-role-icon" style="background:var(--pastel-blue);">🎓</div>
            <div class="su-role-body">
              <div class="su-role-title">Student</div>
              <div class="su-role-desc">Discover events, register, and build your campus story.</div>
            </div>
            <div class="su-role-check" aria-hidden="true">✓</div>
          </button>
          <button type="button" class="su-role-card" id="roleOrganizer" data-role="organizer" role="radio" aria-checked="false">
            <div class="su-role-icon" style="background:var(--pastel-purple);">🏢</div>
            <div class="su-role-body">
              <div class="su-role-title">Organizer / College</div>
              <div class="su-role-desc">Post events and reach 48,000+ students across India.</div>
            </div>
            <div class="su-role-check" aria-hidden="true">✓</div>
          </button>
        </div>
        <button type="button" class="btn btn-primary w-full btn-lg su-next-btn" id="suStep0Next" disabled>Continue →</button>
        <p class="auth-footer-text" style="margin-top:10px;">Have an account? <button type="button" class="auth-switch-btn" data-switch="login">Log in</button></p>
      </div>
      <div class="su-panel" id="suStep1" style="display:none;" aria-label="Account setup">
        <div class="su-step-header">
          <div class="su-step-title">Create your account</div>
          <div class="su-step-desc" id="suStep1Desc">Your login credentials. Keep your password safe.</div>
        </div>
        <div class="auth-form" style="gap:14px;">
          <div class="form-group">
            <label class="form-label" for="suEmail">Email Address *</label>
            <div style="display:flex;gap:8px;">
              <input class="form-input" id="suEmail" type="email" placeholder="you@college.edu" autocomplete="email" style="flex:1;" />
              <button type="button" class="btn btn-primary" id="suSendOtpBtn" style="display:none;white-space:nowrap;padding:10px 14px;font-size:13px;" aria-label="Send OTP to email"><i class="fa-solid fa-envelope"></i> Send OTP</button>
            </div>
            <span class="form-error-msg" id="suEmailErr"></span>
          </div>
          <div id="suOtpSection" style="display:none;border:1px solid var(--border);border-radius:var(--radius);padding:12px;background:var(--bg-2);">
            <div style="font-size:12px;color:var(--text-2);margin-bottom:8px;">Enter the 6-digit code sent to your email</div>
            <div style="display:flex;gap:8px;">
              <input class="form-input" id="suOtpCode" type="text" placeholder="000000" style="flex:1;font-family:'Courier New',monospace;font-size:18px;letter-spacing:12px;text-align:center;" maxlength="6" autocomplete="one-time-code" />
              <button type="button" class="btn btn-primary" id="suVerifyOtpBtn" style="white-space:nowrap;padding:10px 14px;font-size:13px;" aria-label="Verify OTP">Verify ✓</button>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;font-size:12px;">
              <span id="suOtpError" class="form-error-msg" style="flex:1;"></span>
              <button type="button" class="btn btn-ghost" id="suResendOtpBtn" style="padding:0;color:var(--color-primary);font-size:12px;white-space:nowrap;" aria-label="Resend OTP">Resend (<span id="suResendCountdown">60</span>s)</button>
            </div>
            <div id="suOtpSuccess" style="display:none;margin-top:12px;padding:12px 14px;background:rgba(76,175,80,.12);border:2px solid #4CAF50;border-radius:6px;color:#2E7D32;font-size:13px;font-weight:700;text-align:center;">✓ VERIFIED</div>
          </div>
          <div class="form-group" id="suPasswordSection">
            <label class="form-label" for="suPwd">Password *</label>
            <div class="su-pwd-wrap">
              <input class="form-input" id="suPwd" type="password" placeholder="Min. 8 characters" autocomplete="new-password" disabled />
              <button type="button" class="su-eye-btn" aria-label="Toggle password visibility" data-target="suPwd"><i class="fa-solid fa-eye"></i></button>
            </div>
            <div class="su-strength-wrap" id="suStrengthWrap" style="display:none;">
              <div class="su-strength-bar"><div class="su-strength-fill" id="suStrengthFill"></div></div>
              <span class="su-strength-label" id="suStrengthLabel"></span>
            </div>
            <span class="form-error-msg" id="suPwdErr"></span>
          </div>
          <div class="form-group" id="suConfirmSection">
            <label class="form-label" for="suConfirm">Confirm Password *</label>
            <div class="su-pwd-wrap">
              <input class="form-input" id="suConfirm" type="password" placeholder="Re-enter password" autocomplete="new-password" disabled />
              <button type="button" class="su-eye-btn" aria-label="Toggle confirm password visibility" data-target="suConfirm"><i class="fa-solid fa-eye"></i></button>
            </div>
            <span class="form-error-msg" id="suConfirmErr"></span>
          </div>
        </div>
        <div class="su-nav-row">
          <button type="button" class="btn btn-ghost su-back-btn" id="suStep1Back">← Back</button>
          <button type="button" class="btn btn-primary su-next-btn" id="suStep1Next" disabled>Continue →</button>
        </div>
      </div>
      <div class="su-panel" id="suStep2" style="display:none;" aria-label="Profile details">
        <div class="su-step-header">
          <div class="su-step-title" id="suStep2Title">Almost done!</div>
          <div class="su-step-desc" id="suStep2Desc">Tell us a bit about yourself.</div>
        </div>
        <div id="suStudentFields" class="auth-form" style="gap:14px;display:none;">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="suFirstName">First Name *</label>
              <input class="form-input" id="suFirstName" type="text" placeholder="Anita" autocomplete="given-name" />
              <span class="form-error-msg" id="suFirstNameErr"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="suLastName">Last Name *</label>
              <input class="form-input" id="suLastName" type="text" placeholder="Kumari" autocomplete="family-name" />
              <span class="form-error-msg" id="suLastNameErr"></span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="suCollege">College / University *</label>
            <input class="form-input" id="suCollege" type="text" placeholder="e.g. IIT Bombay" autocomplete="organization" />
            <span class="form-error-msg" id="suCollegeErr"></span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="suYear">Year of Study *</label>
              <select class="form-select" id="suYear">
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
              <span class="form-error-msg" id="suYearErr"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="suBranch">Branch / Course</label>
              <input class="form-input" id="suBranch" type="text" placeholder="e.g. B.Tech CSE" />
            </div>
          </div>
        </div>
        <div id="suOrgFields" class="auth-form" style="gap:14px;display:none;">
          <div class="form-group">
            <label class="form-label" for="suOrgName">Organization Name *</label>
            <input class="form-input" id="suOrgName" type="text" placeholder="e.g. IIT Bombay Tech Club" autocomplete="organization" />
            <span class="form-error-msg" id="suOrgNameErr"></span>
          </div>
          <div class="form-group">
            <label class="form-label" for="suDesignation">Designation <span style="font-weight:400;color:var(--text-3);font-size:11px;">(optional)</span></label>
            <input class="form-input" id="suDesignation" type="text" placeholder="e.g. Event Coordinator" />
          </div>
          <div class="form-group">
            <label class="form-label" for="suOrgCity">City</label>
            <input class="form-input" id="suOrgCity" type="text" placeholder="e.g. Mumbai" autocomplete="address-level2" />
          </div>
          <div class="form-group">
            <label class="form-label" for="suOrgPhone">Phone Number <span style="font-weight:400;color:var(--text-3);font-size:11px;">(optional - 10 digits)</span></label>
            <input class="form-input" id="suOrgPhone" type="tel" placeholder="e.g. 9876543210" maxlength="10" />
          </div>
        </div>
        <p class="auth-terms" style="margin-top:6px;">By creating an account you agree to our <a href="terms.html" target="_blank">Terms</a> &amp; <a href="privacy.html" target="_blank">Privacy Policy</a></p>
        <div class="su-nav-row" style="margin-top:14px;">
          <button type="button" class="btn btn-ghost su-back-btn" id="suStep2Back">← Back</button>
          <button type="button" class="btn btn-primary su-next-btn" id="suStep2Submit" disabled>Create Account 🚀</button>
        </div>
      </div>
    </div>
  </div>
</div>
  `;

  // Inject modal into body
  function injectModal() {
    // Check if modal already exists (e.g., on index.html)
    if (document.getElementById('authModal')) {
      console.log('[Auth Modal] Modal already exists in DOM, skipping injection');
      // Re-wire OTP handlers in case they weren't attached yet
      if (typeof window.wireUpOTPHandlers === 'function') {
        window.wireUpOTPHandlers();
        console.log('[Auth Modal] OTP handlers wired up');
      }
      window.dispatchEvent(new CustomEvent('fn:modal-injected', { detail: { source: 'global-modal-loader', existing: true } }));
      return;
    }

    // Create wrapper to contain the HTML string
    const wrapper = document.createElement('div');
    wrapper.innerHTML = GLOBAL_AUTH_MODAL_HTML;
    
    // Append to body
    document.body.appendChild(wrapper.firstElementChild);
    
    console.log('[Auth Modal] Global modal injected into page');
    
    // Re-wire OTP handlers now that modal elements exist
    if (typeof window.wireUpOTPHandlers === 'function') {
      window.wireUpOTPHandlers();
      console.log('[Auth Modal] OTP handlers wired up');
    }
    
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
