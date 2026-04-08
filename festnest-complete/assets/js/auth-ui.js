/* ============================================================
   FESTNEST FRONTEND — assets/js/auth-ui.js
   Replace your old auth.js with this file.
   Connects login/signup forms to the real backend API.
   ============================================================ */

'use strict';

(function initAuthUI() {

  /* ── Viewport Height Fix for Mobile ── */
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);

  /* ── Grab modal elements ── */
  const authModal  = document.getElementById('authModal');
  const closeBtn   = document.getElementById('authModalClose');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');
  const loginForm  = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (!authModal) return;

  /* ── Open / Close ── */
  function openAuth(tab = 'signup') {
    authModal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
    if (typeof trapFocus === 'function') trapFocus(authModal);
  }

  function closeAuth() {
    authModal.classList.remove('modal--open');
    document.body.style.overflow = '';
    clearErrors();
  }

  function switchTab(tab) {
    const isLogin = tab === 'login';
    if (loginForm)  loginForm.style.display  = isLogin ? 'flex' : 'none';
    if (signupForm) signupForm.style.display = isLogin ? 'none' : 'flex';
    tabLogin  && tabLogin.classList.toggle('auth-tab--active',  isLogin);
    tabSignup && tabSignup.classList.toggle('auth-tab--active', !isLogin);
    clearErrors();
  }

  function clearErrors() {
    authModal.querySelectorAll('.auth-error').forEach(e => e.remove());
  }

  function showError(form, message) {
    clearErrors();
    const div = document.createElement('div');
    div.className = 'auth-error';
    div.style.cssText = 'background:#fee2e2;color:#b91c1c;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;';
    div.textContent = message;
    form.insertBefore(div, form.firstChild);
  }

  function setLoading(btn, loading) {
    btn.disabled     = loading;
    btn.textContent  = loading ? 'Please wait...' : btn.dataset.originalText;
    btn.style.opacity= loading ? '0.7' : '1';
  }

  /* ── Keyboard Safety: Smooth Scroll Input Into View ── */
  function setupKeyboardSafety(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        // Small delay to allow keyboard to fully open
        setTimeout(() => {
          const inputRect = this.getBoundingClientRect();
          const modalBox = authModal.querySelector('.modal-box');
          
          // Check if input is below the fold (likely to be hidden by keyboard)
          if (inputRect.bottom > window.innerHeight * 0.6) {
            // Scroll input into view with smooth behavior
            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      });

      // Prevent zoom on input focus
      input.addEventListener('touchstart', function() {
        input.style.fontSize = '16px'; // Prevents iOS auto-zoom
      });
    });
  }

  /* ── Setup forms ── */
  if (loginForm) setupKeyboardSafety(loginForm);
  if (signupForm) setupKeyboardSafety(signupForm);

  /* ── Bindings ── */
  closeBtn  && closeBtn.addEventListener('click', closeAuth);
  tabLogin  && tabLogin.addEventListener('click', () => switchTab('login'));
  tabSignup && tabSignup.addEventListener('click', () => switchTab('signup'));

  authModal.addEventListener('click', e => { if (e.target === authModal) closeAuth(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && authModal.classList.contains('modal--open')) closeAuth();
  });

  authModal.querySelectorAll('.auth-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.switch));
  });

  /* ── LOGIN FORM SUBMIT ── */
  if (loginForm) {
    const submitBtn = loginForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.dataset.originalText = submitBtn.textContent;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const email    = loginForm.querySelector('[type="email"]').value.trim();
      const password = loginForm.querySelector('[type="password"]').value;

      if (!email || !password) {
        return showError(loginForm, 'Please enter your email and password.');
      }

      setLoading(submitBtn, true);
      try {
        const res = await FN_AUTH_API.login(email, password);
        closeAuth();
        showToast(`👋 Welcome back, ${res.user.firstName}!`, 'success');
        updateNavForLoggedInUser(res.user);
      } catch (err) {
        showError(loginForm, err.message || 'Login failed. Please try again.');
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  /* ── SIGNUP FORM: Multi-Step Signup with Real-Time Validation ── */
  if (signupForm) {
    const submitBtn = signupForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.dataset.originalText = submitBtn.textContent;

    // State management
    const signupState = {
      step: 1,
      email: '',
      password: '',
      passwordConfirm: '',
      firstName: '',
      lastName: '',
      college: '',
      year: '',
      branch: '',
      role: 'student',
      orgName: '',
      city: '',
      orgBranch: '',
      phone: '',
      errors: {
        email: '',
        password: '',
        passwordConfirm: '',
      },
    };

    const step1El = document.getElementById('signup-step-1');
    const step2El = document.getElementById('signup-step-2');
    const step1ContinueBtn = document.getElementById('step1-continue-btn');
    const step2BackBtn = document.getElementById('step2-back-btn');

    // Input references
    const emailInput = document.getElementById('su-email-step1');
    const pwdInput = document.getElementById('su-password-step1');
    const pwdConfirmInput = document.getElementById('su-password-confirm');

    // Error message containers
    const emailErrorDiv = document.getElementById('su-email-step1-error');
    const pwdErrorDiv = document.getElementById('su-password-step1-error');
    const pwdConfirmErrorDiv = document.getElementById('su-password-confirm-error');

    /* ─────────────────────────────────────────────
       PASSWORD TOGGLE (FIXED)
       ───────────────────────────────────────────── */
    document.querySelectorAll('.pwd-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        
        if (input) {
          const isCurrentlyPassword = input.type === 'password';
          input.type = isCurrentlyPassword ? 'text' : 'password';
          btn.textContent = isCurrentlyPassword ? '🙈' : '👁️';
          input.focus();
        }
      });
    });

    /* ─────────────────────────────────────────────
       REAL-TIME VALIDATION FUNCTIONS
       ───────────────────────────────────────────── */
    
    function validateEmail(value) {
      if (!value || !value.trim()) {
        return 'Email is required.';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return 'Enter a valid email address.';
      }
      return '';
    }

    function validatePassword(value) {
      if (!value) {
        return 'Password is required.';
      }
      if (value.length < 8) {
        return 'Password must be at least 8 characters.';
      }
      return '';
    }

    function validatePasswordConfirm(pwd, confirm) {
      if (!confirm) {
        return 'Please confirm your password.';
      }
      if (pwd !== confirm) {
        return 'Passwords do not match.';
      }
      return '';
    }

    /* ─────────────────────────────────────────────
       DISPLAY ERROR MESSAGE
       ───────────────────────────────────────────── */
    function setError(field, errorDiv, errorMessage) {
      signupState.errors[field] = errorMessage;
      errorDiv.textContent = errorMessage;
      
      const input = field === 'email' ? emailInput : 
                    field === 'password' ? pwdInput : 
                    field === 'passwordConfirm' ? pwdConfirmInput : null;
      
      if (input) {
        if (errorMessage) {
          input.classList.add('form-input--invalid');
        } else {
          input.classList.remove('form-input--invalid');
        }
      }
    }

    /* ─────────────────────────────────────────────
       EMAIL VALIDATION (REAL-TIME)
       ───────────────────────────────────────────── */
    emailInput?.addEventListener('input', (e) => {
      const value = e.target.value;
      signupState.email = value;
      const error = validateEmail(value);
      setError('email', emailErrorDiv, error);
      updateContinueButton();
    });

    emailInput?.addEventListener('blur', () => {
      const error = validateEmail(emailInput.value);
      setError('email', emailErrorDiv, error);
      updateContinueButton();
    });

    /* ─────────────────────────────────────────────
       PASSWORD VALIDATION (REAL-TIME)
       ───────────────────────────────────────────── */
    pwdInput?.addEventListener('input', (e) => {
      const value = e.target.value;
      signupState.password = value;
      const error = validatePassword(value);
      setError('password', pwdErrorDiv, error);

      // Also re-validate confirm password if user has entered it
      if (pwdConfirmInput.value) {
        const confirmError = validatePasswordConfirm(value, pwdConfirmInput.value);
        setError('passwordConfirm', pwdConfirmErrorDiv, confirmError);
      }

      updateContinueButton();
    });

    pwdInput?.addEventListener('blur', () => {
      const error = validatePassword(pwdInput.value);
      setError('password', pwdErrorDiv, error);
      updateContinueButton();
    });

    /* ─────────────────────────────────────────────
       CONFIRM PASSWORD VALIDATION (REAL-TIME)
       ───────────────────────────────────────────── */
    pwdConfirmInput?.addEventListener('input', (e) => {
      const value = e.target.value;
      signupState.passwordConfirm = value;
      const error = validatePasswordConfirm(pwdInput.value, value);
      setError('passwordConfirm', pwdConfirmErrorDiv, error);
      updateContinueButton();
    });

    pwdConfirmInput?.addEventListener('blur', () => {
      const error = validatePasswordConfirm(pwdInput.value, pwdConfirmInput.value);
      setError('passwordConfirm', pwdConfirmErrorDiv, error);
      updateContinueButton();
    });

    /* ─────────────────────────────────────────────
       UPDATE CONTINUE BUTTON STATE
       ───────────────────────────────────────────── */
    function updateContinueButton() {
      const hasNoErrors = !signupState.errors.email && 
                          !signupState.errors.password && 
                          !signupState.errors.passwordConfirm;
      
      const allFieldsFilled = emailInput.value.trim() && 
                              pwdInput.value && 
                              pwdConfirmInput.value;

      step1ContinueBtn.disabled = !(hasNoErrors && allFieldsFilled);
    }

    /* ─────────────────────────────────────────────
       CONTINUE TO STEP 2
       ───────────────────────────────────────────── */
    step1ContinueBtn?.addEventListener('click', (e) => {
      e.preventDefault();

      // Final validation before moving to step 2
      const emailErr = validateEmail(emailInput.value);
      const pwdErr = validatePassword(pwdInput.value);
      const confirmErr = validatePasswordConfirm(pwdInput.value, pwdConfirmInput.value);

      setError('email', emailErrorDiv, emailErr);
      setError('password', pwdErrorDiv, pwdErr);
      setError('passwordConfirm', pwdConfirmErrorDiv, confirmErr);

      if (emailErr || pwdErr || confirmErr) return;

      // Store data and transition
      signupState.email = emailInput.value.trim();
      signupState.password = pwdInput.value;

      // Animate transition
      step1El.classList.add('signup-step--slide-out');
      setTimeout(() => {
        step1El.classList.remove('signup-step--active', 'signup-step--slide-out');
        step2El.classList.add('signup-step--active', 'signup-step--slide-in');
        signupState.step = 2;
        setTimeout(() => {
          step2El.classList.remove('signup-step--slide-in');
          document.getElementById('su-role-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }, 300);
    });

    /* ─────────────────────────────────────────────
       BACK TO STEP 1
       ───────────────────────────────────────────── */
    step2BackBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      step2El.classList.add('signup-step--slide-out');
      setTimeout(() => {
        step2El.classList.remove('signup-step--active', 'signup-step--slide-out');
        step1El.classList.add('signup-step--active', 'signup-step--slide-in');
        signupState.step = 1;
        setTimeout(() => {
          step1El.classList.remove('signup-step--slide-in');
        }, 300);
      }, 300);
    });

    /* ─────────────────────────────────────────────
       STEP 2: ROLE SELECTION & FIELDS
       ───────────────────────────────────────────── */
    const roleCards = signupForm.querySelectorAll('.su-role-card');
    roleCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        roleCards.forEach(c => {
          c.classList.remove('su-role-card--active');
          c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('su-role-card--active');
        card.setAttribute('aria-pressed', 'true');
        signupState.role = card.dataset.role;

        const fieldsSection = document.getElementById('su-fields-section');
        const studentFields = document.getElementById('su-student-fields');
        const orgFields = document.getElementById('su-org-fields');

        fieldsSection.style.display = 'flex';
        studentFields.style.display = card.dataset.role === 'student' ? 'block' : 'none';
        orgFields.style.display = card.dataset.role === 'organizer' ? 'block' : 'none';
      });
    });

    /* ─────────────────────────────────────────────
       STEP 2: FORM SUBMISSION
       ───────────────────────────────────────────── */
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      // Gather Step 2 data
      if (signupState.role === 'student') {
        signupState.firstName = document.getElementById('su-s-firstname')?.value.trim() || '';
        signupState.lastName = document.getElementById('su-s-lastname')?.value.trim() || '';
        signupState.college = document.getElementById('su-s-college')?.value.trim() || '';
        signupState.year = document.getElementById('su-s-year')?.value || '';
        signupState.branch = document.getElementById('su-s-branch')?.value.trim() || '';
      } else {
        signupState.orgName = document.getElementById('su-o-orgname')?.value.trim() || '';
        signupState.city = document.getElementById('su-o-city')?.value.trim() || '';
        signupState.orgBranch = document.getElementById('su-o-branch')?.value.trim() || '';
        signupState.phone = document.getElementById('su-o-phone')?.value.trim() || '';
      }

      // Validate Step 2
      const errors = [];
      if (signupState.role === 'student') {
        if (!signupState.firstName) errors.push('First name is required.');
        if (!signupState.lastName) errors.push('Last name is required.');
        if (!signupState.college) errors.push('College/University is required.');
      } else {
        if (!signupState.orgName) errors.push('Organization name is required.');
      }

      if (errors.length > 0) {
        step2ErrorsDiv.innerHTML = errors.map(e => `<div class="auth-error">${e}</div>`).join('');
        step2ErrorsDiv.style.display = 'block';
        return;
      }

      // Submit to API
      setLoading(submitBtn, true);
      try {
        const payload = {
          email: signupState.email,
          password: signupState.password,
          role: signupState.role,
        };

        if (signupState.role === 'student') {
          payload.firstName = signupState.firstName;
          payload.lastName = signupState.lastName;
          payload.college = signupState.college;
          payload.year = signupState.year;
        } else {
          payload.firstName = signupState.orgName;
          payload.lastName = signupState.orgName;
          payload.college = signupState.city;
          payload.phone = signupState.phone;
        }

        const res = await FN_AUTH_API.register(payload);
        closeAuth();
        showToast(`🎉 Welcome to FestNest, ${signupState.firstName}!`, 'success');
        updateNavForLoggedInUser(res.user);
      } catch (err) {
        step2ErrorsDiv.innerHTML = `<div class="auth-error">${err.message || 'Registration failed. Please try again.'}</div>`;
        step2ErrorsDiv.style.display = 'block';
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  /* ── Update navbar when logged in ── */
  function updateNavForLoggedInUser(user) {
    const actionsEl = document.querySelector('.nav-actions');
    if (!actionsEl) return;

    actionsEl.innerHTML = `
      <a href="pages/profile.html" class="btn btn-ghost" style="gap:8px;">
        <span>👤</span> ${user.firstName}
      </a>
      <button class="btn btn-outline" id="logoutBtn">Log Out</button>`;

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      FN_AUTH_API.logout();
      showToast('👋 Logged out successfully!');
      setTimeout(() => window.location.reload(), 800);
    });
  }

  /* ── Check auth state on page load ── */
  function checkAuthState() {
    const user = FN_AUTH.getUser();
    if (user && FN_AUTH.isLoggedIn()) {
      updateNavForLoggedInUser(user);
    }
  }

  /* ── Trigger buttons ── */
  ['navLoginBtn', 'navSignupBtn', 'drawerLoginBtn', 'drawerSignupBtn', 'ctaSignupBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      const tab = id.toLowerCase().includes('login') ? 'login' : 'signup';
      btn.addEventListener('click', () => openAuth(tab));
    }
  });

  /* ── Expose globally ── */
  window.openAuthModal  = openAuth;
  window.closeAuthModal = closeAuth;

  checkAuthState();
})();
