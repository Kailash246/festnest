/* ============================================================
   FESTNEST FRONTEND — assets/js/firebase-auth-bridge.js
   
   Bridges Firebase Authentication to Existing Auth Modal
   - Replaces form submission with Firebase methods
   - Maintains existing UI/UX
   - Handles new user onboarding detection
   ============================================================ */
'use strict';

const FN_FIREBASE_BRIDGE = {
  /**
   * Integrate Firebase into existing auth modal
   * Call after auth modal is initialized
   */
  init() {
    if (!window.FN_FIREBASE) {
      console.error('Firebase not initialized. Include firebase-config.js first.');
      return;
    }

    this.setupEmailAuth();
    this.setupGoogleAuth();
  },

  /**
   * Setup email/password sign up and login
   * NOTE: Firebase signup redirected to onboarding.html which is now deleted.
   * Use email/password signup via auth modal instead.
   * Only Firebase login is supported for existing users.
   */
  setupEmailAuth() {
    /* Get form references from existing HTML */
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
      loginForm.addEventListener('submit', e => this.handleEmailLogin(e));
    }

    if (signupForm) {
      /* Firebase signup is disabled - use email/password signup in auth modal instead */
      signupForm.addEventListener('submit', e => {
        e.preventDefault();
        console.warn('Firebase signup is disabled. Use email/password signup via the auth modal.');
        return;
      });
    }
  },

  /**
   * Setup Google login
   */
  setupGoogleAuth() {
    /* Find Google login buttons */
    const googleBtns = document.querySelectorAll('[data-auth="google"]');
    
    googleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleGoogleLogin();
      });
    });

    /* Also find buttons by text content */
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.includes('Google') && btn.closest('.auth-form')) {
        btn.removeEventListener('click', null); /* Remove old handler if any */
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleGoogleLogin();
        });
      }
    });
  },

  /**
   * Handle email signup
   */
  async handleEmailSignup(e) {
    e.preventDefault();

    const formInputs = e.target.querySelectorAll('input');
    const firstName = formInputs[0]?.value?.trim() || '';
    const lastName = formInputs[1]?.value?.trim() || '';
    const email = formInputs[2]?.value?.trim() || '';
    const college = formInputs[3]?.value?.trim() || '';
    const yearBranch = formInputs[4]?.value?.trim() || '';
    const password = formInputs[5]?.value || '';

    /* Show loading */
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      /* Create Firebase user */
      const result = await FN_FIREBASE.signupEmail(email, password);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      /* Store onboarding data in session */
      sessionStorage.setItem('fn_onboarding_email', email);
      sessionStorage.setItem('fn_onboarding_firstName', firstName);
      sessionStorage.setItem('fn_onboarding_lastName', lastName);
      sessionStorage.setItem('fn_onboarding_idToken', result.idToken);

      /* Redirect to onboarding */
      showToast('✅ Account created! Let\'s set up your profile.', 'success');
      setTimeout(() => {
        window.location.href = `/pages/onboarding.html?email=${encodeURIComponent(email)}&idToken=${result.idToken}`;
      }, 1000);

    } catch (err) {
      showToast(err.message || 'Signup failed. Try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  /**
   * Handle email login
   */
  async handleEmailLogin(e) {
    e.preventDefault();

    const formInputs = e.target.querySelectorAll('input');
    const email = formInputs[0]?.value?.trim() || '';
    const password = formInputs[1]?.value || '';

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      /* Authenticate with Firebase */
      const result = await FN_FIREBASE.loginEmail(email, password);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      /* Send to backend for user lookup */
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: result.idToken,
          email: result.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.isNewUser) {
        /* New Firebase users should use email/password signup via auth modal */
        showToast('Please complete signup via the form.', 'info');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1500);
      } else {
        /* Existing user: store JWT and redirect */
        this.finalizeLogin(data);
      }

    } catch (err) {
      showToast(err.message || 'Login failed. Try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  /**
   * Handle Google login/signup
   */
  async handleGoogleLogin() {
    try {
      const result = await FN_FIREBASE.loginGoogle();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      /* Show loading toast */
      showToast('Authenticating with Google...', 'info');

      /* Send to backend */
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: result.idToken,
          email: result.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      if (data.isNewUser) {
        /* New Firebase users should use email/password signup via auth modal */
        showToast('Please use email/password signup in the form below.', 'info');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1500);
      } else {
        this.finalizeLogin(data);
      }

    } catch (err) {
      showToast(err.message || 'Google login failed', 'error');
    }
  },

  /**
   * Complete login for existing user
   */
  finalizeLogin(data) {
    /* Store backend JWT and user data */
    localStorage.setItem('fn_token', data.token);
    sessionStorage.setItem('fn_user', JSON.stringify(data.user));

    /* Initialize FN_AUTH global */
    if (typeof FN_AUTH !== 'undefined' && typeof FN_AUTH._setUser === 'function') {
      FN_AUTH._setUser(data.user);
    }

    /* Close modal */
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('modal--open');

    showToast(`Welcome back, ${data.user.firstName}!`, 'success');

    /* Redirect after short delay */
    setTimeout(() => {
      window.location.href = '/pages/events.html';
    }, 800);
  },
};

/* ── Initialize when DOM ready ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FN_FIREBASE_BRIDGE.init());
} else {
  FN_FIREBASE_BRIDGE.init();
}

window.FN_FIREBASE_BRIDGE = FN_FIREBASE_BRIDGE;
