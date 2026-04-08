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

  /* ── SIGNUP FORM SUBMIT ── */
  if (signupForm) {
    const submitBtn = signupForm.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.dataset.originalText = submitBtn.textContent;

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const inputs   = signupForm.querySelectorAll('input, select');
      const getValue = (i) => inputs[i] ? inputs[i].value.trim() : '';

      const firstName = getValue(0);
      const lastName  = getValue(1);
      const email     = getValue(2);
      const college   = getValue(3);
      const year      = getValue(4);
      const password  = getValue(5);
      const roleEl    = signupForm.querySelector('[name="role"]');
      const role      = roleEl ? roleEl.value : 'student';

      if (!firstName || !lastName || !email || !password) {
        return showError(signupForm, 'Please fill in all required fields.');
      }
      if (password.length < 8) {
        return showError(signupForm, 'Password must be at least 8 characters.');
      }

      setLoading(submitBtn, true);
      try {
        const res = await FN_AUTH_API.register({
          firstName, lastName, email, password,
          college, year, role,
        });
        closeAuth();
        showToast(`🎉 Welcome to FestNest, ${res.user.firstName}!`, 'success');
        updateNavForLoggedInUser(res.user);
      } catch (err) {
        showError(signupForm, err.message || 'Registration failed. Please try again.');
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
