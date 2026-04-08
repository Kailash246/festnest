/* ============================================================
   FESTNEST — assets/js/auth.js
   VERSION: 3-Step Signup Flow

   WHAT'S IN THIS FILE:
   1. requireAuth()  — unchanged route guard
   2. requireRole()  — unchanged route guard
   3. Login form     — unchanged (just added eye toggle)
   4. Signup flow    — UPGRADED to 3-step:
        Step 0 → Role selection (Student / Organizer)
        Step 1 → Account setup (email, password, confirm)
        Step 2 → Profile details (dynamic per role)
   5. State machine  — single `su` object holds all data
   6. Submission     — calls FN_AUTH_API.register() (unchanged)

   WHAT WAS NOT CHANGED:
   — FN_AUTH, FN_AUTH_API, apiFetch (api.js) untouched
   — Backend payload shape identical to previous version
   — openAuthModal() / closeAuthModal() signatures unchanged
   — requireAuth() / requireRole() identical
   — All existing event IDs and class names preserved
   ============================================================ */
'use strict';

/* ════════════════════════════════════════════════════════════
   ROUTE GUARDS (unchanged)
   ════════════════════════════════════════════════════════════ */
function requireAuth(redirectTo = '/index.html') {
  if (!FN_AUTH.isLoggedIn()) {
    if (typeof showToast === 'function') showToast('Please log in first.', 'info');
    setTimeout(() => { window.location.href = redirectTo; }, 300);
    return false;
  }
  return true;
}

function requireRole(...roles) {
  if (!requireAuth()) return false;
  const user = FN_AUTH.getUser();
  if (!user || !roles.includes(user.role)) {
    if (typeof showToast === 'function')
      showToast(`Access denied. Requires: ${roles.join(' or ')}.`, 'error');
    setTimeout(() => { window.location.href = '/index.html'; }, 800);
    return false;
  }
  return true;
}

window.requireAuth = requireAuth;
window.requireRole = requireRole;

/* ════════════════════════════════════════════════════════════
   AUTH MODAL
   ════════════════════════════════════════════════════════════ */
(function initAuthModal() {

  /* ── Element refs ── */
  const modal     = document.getElementById('authModal');
  const closeBtn  = document.getElementById('authModalClose');
  const tabLogin  = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const formLogin = document.getElementById('login-form');
  const suShell   = document.getElementById('su-shell');    /* signup wrapper */

  if (!modal) return; /* page has no auth modal — bail */

  /* ════════════════════════════════════════════════════════
     SIGNUP STATE
     Single object. Mutated by each step. Passed to register()
     on final submit. Never reset between step changes —
     going Back preserves all previously entered values.
  ════════════════════════════════════════════════════════ */
  const su = {
    step:             0,
    role:             '',       /* 'student' | 'organizer' */
    /* Step 1 */
    email:            '',
    password:         '',
    confirmPassword:  '',
    /* Step 2 student */
    firstName:        '',
    lastName:         '',
    college:          '',
    year:             '',
    branch:           '',
    /* Step 2 organizer */
    organizationName: '',
    orgCollege:       '',
    designation:      '',
    city:             '',
    /* Errors per field — keyed by input id */
    errors:           {},
  };

  /* ════════════════════════════════════════════════════════
     OPEN / CLOSE / TABS
  ════════════════════════════════════════════════════════ */
  function openAuth(tab = 'signup') {
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
    if (typeof trapFocus === 'function') trapFocus(modal);
  }

  function closeAuth() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    clearGlobalErr();
    /* Reset signup to step 0 for next open */
    resetSignup();
  }

  function switchTab(tab) {
    const isLogin = tab === 'login';
    formLogin && (formLogin.style.display = isLogin ? 'flex' : 'none');
    suShell   && (suShell.style.display   = isLogin ? 'none'  : 'block');
    tabLogin ?.classList.toggle('auth-tab--active',  isLogin);
    tabSignup?.classList.toggle('auth-tab--active', !isLogin);
    clearGlobalErr();
  }

  /* ── Wiring: close, tabs, backdrop, Escape ── */
  closeBtn?.addEventListener('click', closeAuth);
  tabLogin ?.addEventListener('click', () => switchTab('login'));
  tabSignup?.addEventListener('click', () => switchTab('signup'));
  modal.addEventListener('click', e => { if (e.target === modal) closeAuth(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeAuth();
  });
  modal.querySelectorAll('.auth-switch-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.switch))
  );

  /* ── Trigger buttons anywhere on the page ── */
  ['navLoginBtn','navSignupBtn','drawerLoginBtn','drawerSignupBtn','ctaSignupBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const tab = id.toLowerCase().includes('login') ? 'login' : 'signup';
    btn.addEventListener('click', () => openAuth(tab));
  });

  window.openAuthModal  = openAuth;
  window.closeAuthModal = closeAuth;

  /* ════════════════════════════════════════════════════════
     GLOBAL ERROR BANNER (shared across all steps)
  ════════════════════════════════════════════════════════ */
  const globalErrEl = document.getElementById('suGlobalErr');

  function showGlobalErr(msg) {
    if (!globalErrEl) return;
    globalErrEl.textContent = msg;
    globalErrEl.style.display = 'block';
    globalErrEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function clearGlobalErr() {
    if (!globalErrEl) return;
    globalErrEl.textContent = '';
    globalErrEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════
     INLINE ERROR HELPERS
  ════════════════════════════════════════════════════════ */
  function setErr(elId, msg) {
    const el = document.getElementById(elId + 'Err') || document.getElementById(elId);
    if (el && el.classList.contains('form-error-msg')) el.textContent = msg;
    const input = document.getElementById(elId);
    if (input) input.classList.toggle('form-input--err', !!msg);
    su.errors[elId] = msg;
  }

  function clearErr(elId) {
    setErr(elId, '');
    const input = document.getElementById(elId);
    if (input) { input.classList.remove('form-input--err'); input.classList.remove('form-input--ok'); }
  }

  function markOk(elId) {
    clearErr(elId);
    const input = document.getElementById(elId);
    if (input) input.classList.add('form-input--ok');
  }

  /* ════════════════════════════════════════════════════════
     STEP NAVIGATION ENGINE
  ════════════════════════════════════════════════════════ */
  const PANELS = ['suStep0', 'suStep1', 'suStep2'];

  function goToStep(newStep, direction = 'forward') {
    const current = PANELS[su.step];
    const next    = PANELS[newStep];
    if (!current || !next) return;

    /* Animate current out (instant hide), next in */
    document.getElementById(current).style.display = 'none';

    const nextEl = document.getElementById(next);
    nextEl.style.display = 'block';
    nextEl.classList.remove('su-panel--back');
    if (direction === 'back') nextEl.classList.add('su-panel--back');

    /* Force reflow for animation */
    void nextEl.offsetWidth;

    su.step = newStep;
    updateStepBar();
    clearGlobalErr();

    /* Scroll modal to top so user sees the new step heading */
    document.getElementById('authModalBox')?.scrollTo({ top: 0, behavior: 'smooth' });

    /* Auto-focus first focusable element in new panel */
    requestAnimationFrame(() => {
      const focusable = nextEl.querySelector('button:not([disabled]), input, select');
      focusable?.focus();
    });
  }

  /* ── Step progress bar ── */
  function updateStepBar() {
    document.querySelectorAll('#suStepBar .su-step').forEach((dot, i) => {
      dot.classList.remove('su-step--active', 'su-step--done');
      if (i < su.step)       dot.classList.add('su-step--done');
      else if (i === su.step) dot.classList.add('su-step--active');
    });
    /* Color connector lines */
    document.querySelectorAll('#suStepBar .su-step-line').forEach((line, i) => {
      line.classList.toggle('su-step-line--done', i < su.step);
    });
  }

  /* ── Reset entire signup to step 0 ── */
  function resetSignup() {
    su.step = 0;
    su.role = '';
    su.email = su.password = su.confirmPassword = '';
    su.firstName = su.lastName = su.college = su.year = su.branch = '';
    su.organizationName = su.orgCollege = su.designation = su.city = '';
    su.errors = {};

    /* Deselect all role cards */
    document.querySelectorAll('.su-role-card').forEach(c => {
      c.setAttribute('aria-checked', 'false');
    });

    /* Clear all inputs */
    ['suEmail','suPwd','suConfirm','suFirstName','suLastName','suCollege',
     'suBranch','suOrgName','suOrgCollege','suDesignation','suOrgCity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('form-input--err','form-input--ok'); }
    });
    const yearEl = document.getElementById('suYear');
    if (yearEl) yearEl.selectedIndex = 0;

    /* Clear error messages */
    modal.querySelectorAll('.form-error-msg').forEach(e => e.textContent = '');

    /* Hide strength bar */
    const sw = document.getElementById('suStrengthWrap');
    if (sw) sw.style.display = 'none';

    /* Disable continue buttons */
    setStep0NextState(false);
    setStep1NextState(false);
    setStep2SubmitState(false);

    /* Show step 0, hide others */
    PANELS.forEach((id, i) => {
      document.getElementById(id).style.display = i === 0 ? 'block' : 'none';
    });

    updateStepBar();
  }

  /* ════════════════════════════════════════════════════════
     STEP 0 — ROLE SELECTION
  ════════════════════════════════════════════════════════ */
  const step0NextBtn = document.getElementById('suStep0Next');

  function setStep0NextState(enabled) {
    if (step0NextBtn) step0NextBtn.disabled = !enabled;
  }

  /* Role card clicks */
  document.querySelectorAll('.su-role-card').forEach(card => {
    card.addEventListener('click', () => {
      /* Deselect all */
      document.querySelectorAll('.su-role-card').forEach(c => {
        c.setAttribute('aria-checked', 'false');
        c.classList.remove('su-role-card--active');
      });
      /* Select clicked */
      card.setAttribute('aria-checked', 'true');
      su.role = card.dataset.role;
      setStep0NextState(true);
    });

    /* Keyboard: Enter / Space activates */
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  step0NextBtn?.addEventListener('click', () => {
    if (!su.role) return;
    goToStep(1);
  });

  /* ════════════════════════════════════════════════════════
     STEP 1 — ACCOUNT SETUP
  ════════════════════════════════════════════════════════ */
  const step1NextBtn = document.getElementById('suStep1Next');
  const step1BackBtn = document.getElementById('suStep1Back');

  step1BackBtn?.addEventListener('click', () => goToStep(0, 'back'));

  /* ── Validation helpers ── */
  function isEmailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPwdValid(v)   { return v.length >= 8; }
  function isPwdMatch(a,b) { return a === b && a.length > 0; }

  function validateStep1() {
    let ok = true;
    const email   = document.getElementById('suEmail')?.value.trim()  || '';
    const pwd     = document.getElementById('suPwd')?.value            || '';
    const confirm = document.getElementById('suConfirm')?.value        || '';

    if (email && !isEmailValid(email)) { setErr('suEmail', 'Enter a valid email address.'); ok = false; }
    else if (email) markOk('suEmail');

    if (pwd && !isPwdValid(pwd)) { setErr('suPwd', 'Password must be at least 8 characters.'); ok = false; }
    else if (pwd) markOk('suPwd');

    if (confirm && pwd) {
      if (!isPwdMatch(pwd, confirm)) { setErr('suConfirm', 'Passwords do not match.'); ok = false; }
      else markOk('suConfirm');
    }

    const allFilled = email && pwd && confirm;
    const allValid  = isEmailValid(email) && isPwdValid(pwd) && isPwdMatch(pwd, confirm);
    setStep1NextState(allFilled && allValid);
    return allFilled && allValid;
  }

  function setStep1NextState(enabled) {
    if (step1NextBtn) step1NextBtn.disabled = !enabled;
  }

  /* Real-time validation on each input */
  ['suEmail','suPwd','suConfirm'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      clearErr(id);
      validateStep1();
      if (id === 'suPwd') updateStrength(document.getElementById(id)?.value || '');
    });
    document.getElementById(id)?.addEventListener('blur', () => validateStep1());
  });

  step1NextBtn?.addEventListener('click', () => {
    if (!validateStep1()) return;
    /* Persist to state */
    su.email    = document.getElementById('suEmail')?.value.trim()  || '';
    su.password = document.getElementById('suPwd')?.value            || '';
    su.confirmPassword = document.getElementById('suConfirm')?.value || '';

    /* Configure step 2 for the chosen role */
    configureStep2();
    goToStep(2);
  });

  /* ── Password strength meter ── */
  function updateStrength(pwd) {
    const wrap  = document.getElementById('suStrengthWrap');
    const fill  = document.getElementById('suStrengthFill');
    const label = document.getElementById('suStrengthLabel');
    if (!wrap || !fill || !label) return;

    if (!pwd) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';

    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { w: '20%',  bg: '#e53e3e', lbl: 'Weak',      col: '#e53e3e' },
      { w: '40%',  bg: '#e53e3e', lbl: 'Weak',      col: '#e53e3e' },
      { w: '60%',  bg: '#FF8A00', lbl: 'Fair',       col: '#FF8A00' },
      { w: '80%',  bg: '#00BFA5', lbl: 'Good',       col: '#00BFA5' },
      { w: '100%', bg: '#00BFA5', lbl: 'Strong 💪',  col: '#00BFA5' },
    ];
    const lvl = levels[Math.min(score, 4)];
    fill.style.width      = lvl.w;
    fill.style.background = lvl.bg;
    label.textContent     = lvl.lbl;
    label.style.color     = lvl.col;
  }

  /* ── Eye toggle (login + signup fields) ── */
  document.querySelectorAll('.su-eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type    = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });

  /* ════════════════════════════════════════════════════════
     STEP 2 — PROFILE DETAILS
  ════════════════════════════════════════════════════════ */
  const step2SubmitBtn = document.getElementById('suStep2Submit');
  const step2BackBtn   = document.getElementById('suStep2Back');

  step2BackBtn?.addEventListener('click', () => goToStep(1, 'back'));

  function configureStep2() {
    const isStudent = su.role === 'student';
    const studentEl = document.getElementById('suStudentFields');
    const orgEl     = document.getElementById('suOrgFields');
    const title     = document.getElementById('suStep2Title');
    const desc      = document.getElementById('suStep2Desc');

    if (studentEl) studentEl.style.display = isStudent ? 'flex' : 'none';
    if (orgEl)     orgEl.style.display     = isStudent ? 'none'  : 'flex';

    if (title) title.textContent = isStudent ? 'Tell us about yourself 🎓' : 'About your organization 🏢';
    if (desc)  desc.textContent  = isStudent
      ? 'Helps us find events relevant to your college and year.'
      : 'Helps students find your events quickly.';

    /* Attach live-validation to the visible fields */
    (isStudent
      ? ['suFirstName','suLastName','suCollege','suYear']
      : ['suOrgName','suOrgCollege']
    ).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.removeEventListener('input', validateStep2);
      el.removeEventListener('blur',  validateStep2);
      el.addEventListener('input', validateStep2);
      el.addEventListener('blur',  validateStep2);
    });

    validateStep2();
  }

  function validateStep2() {
    const isStudent = su.role === 'student';
    let ok = true;

    if (isStudent) {
      const fn = document.getElementById('suFirstName')?.value.trim() || '';
      const ln = document.getElementById('suLastName')?.value.trim()  || '';
      const co = document.getElementById('suCollege')?.value.trim()   || '';
      const yr = document.getElementById('suYear')?.value             || '';

      if (!fn) ok = false; else markOk('suFirstName');
      if (!ln) ok = false; else markOk('suLastName');
      if (!co) ok = false; else markOk('suCollege');
      if (!yr) ok = false; else {
        const yrEl = document.getElementById('suYear');
        if (yrEl) yrEl.classList.remove('form-select--err');
      }
      setStep2SubmitState(fn && ln && co && yr);
    } else {
      const on = document.getElementById('suOrgName')?.value.trim()    || '';
      const oc = document.getElementById('suOrgCollege')?.value.trim() || '';
      if (!on) ok = false; else markOk('suOrgName');
      if (!oc) ok = false; else markOk('suOrgCollege');
      setStep2SubmitState(on && oc);
    }
    return ok;
  }

  function setStep2SubmitState(enabled) {
    if (step2SubmitBtn) step2SubmitBtn.disabled = !enabled;
  }

  /* ── Submit ── */
  step2SubmitBtn?.addEventListener('click', async () => {
    if (!validateStep2()) return;
    clearGlobalErr();

    /* Collect step 2 data into state */
    if (su.role === 'student') {
      su.firstName  = document.getElementById('suFirstName')?.value.trim()  || '';
      su.lastName   = document.getElementById('suLastName')?.value.trim()   || '';
      su.college    = document.getElementById('suCollege')?.value.trim()    || '';
      su.year       = document.getElementById('suYear')?.value               || '';
      su.branch     = document.getElementById('suBranch')?.value.trim()     || '';
    } else {
      su.organizationName = document.getElementById('suOrgName')?.value.trim()    || '';
      su.orgCollege       = document.getElementById('suOrgCollege')?.value.trim() || '';
      su.designation      = document.getElementById('suDesignation')?.value.trim()|| '';
      su.city             = document.getElementById('suOrgCity')?.value.trim()    || '';
      /* Map org name to firstName for backend compatibility */
      su.firstName  = su.organizationName;
      su.lastName   = '—';
      su.college    = su.orgCollege;
    }

    /* Build the payload the backend already understands */
    const payload = {
      firstName:  su.firstName,
      lastName:   su.lastName,
      email:      su.email,
      password:   su.password,
      role:       su.role,
      college:    su.college,
      year:       su.year,
      branch:     su.branch,
      city:       su.city,
      phone:      '',
    };

    /* Loading state */
    step2SubmitBtn.disabled   = true;
    step2SubmitBtn.innerHTML  = '<span class="spinner"></span> Creating account…';

    try {
      /* Uses existing FN_AUTH_API.register() from api.js — no changes */
      const r = await FN_AUTH_API.register(payload);

      closeAuth();
      showToast('🎉 Welcome to FestNest, ' + r.user.firstName + '!', 'success');

      /* Redirect based on role */
      if (su.role === 'organizer') {
        setTimeout(() => { window.location.href = '/pages/my-events.html'; }, 900);
      } else {
        setTimeout(() => { window.location.href = '/index.html'; }, 900);
      }
    } catch (err) {
      showGlobalErr(err.message || 'Registration failed. Please try again.');
      step2SubmitBtn.disabled  = false;
      step2SubmitBtn.textContent = 'Create Account 🚀';
    }
  });

  /* ════════════════════════════════════════════════════════
     LOGIN FORM (unchanged logic, minor UX addition)
  ════════════════════════════════════════════════════════ */
  if (formLogin) {
    const submitBtn = formLogin.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.dataset.origText = submitBtn.textContent;

    formLogin.addEventListener('submit', async e => {
      e.preventDefault();
      clearGlobalErr();

      const email = document.getElementById('loginEmail')?.value.trim() || '';
      const pwd   = document.getElementById('loginPwd')?.value           || '';

      if (!email || !pwd) {
        showGlobalErr('Please enter your email and password.');
        return;
      }

      submitBtn.disabled   = true;
      submitBtn.innerHTML  = '<span class="spinner"></span> Logging in…';

      try {
        const r = await FN_AUTH_API.login(email, pwd);
        closeAuth();
        showToast('👋 Welcome back, ' + r.user.firstName + '!', 'success');
        
        /* Redirect to home */
        setTimeout(() => { window.location.href = '/index.html'; }, 900);
      } catch (err) {
        showGlobalErr(err.message || 'Login failed. Check your credentials.');
        submitBtn.disabled   = false;
        submitBtn.textContent = submitBtn.dataset.origText;
      }
    });
  }

}());
