/* ============================================================
   FESTNEST — assets/js/auth.js

   WHAT CHANGED IN THIS VERSION:
   ─────────────────────────────────────────────────────────
   Signup form is now role-first:
     Step 1 → choose Student or Organizer (role cards)
     Step 2 → see role-specific fields + email + password
     Submit → POST /api/auth/register with role in body

   EVERYTHING ELSE IS IDENTICAL:
   - requireAuth()    — unchanged
   - requireRole()    — unchanged
   - Login form logic — unchanged
   - openAuthModal()  — unchanged
   - closeAuthModal() — unchanged
   - All tab switching — unchanged

   HOW THE SIGNUP FLOW WORKS:
   1. Signup tab shows two role cards (Student / Organizer)
   2. Clicking a card highlights it + slides the form fields in
   3. Student fields: firstName, lastName, college, year/branch
   4. Organizer fields: orgName, branch(opt), city, phone
   5. Email + Password always visible after role is picked
   6. Submit: validates → FN_AUTH_API.register() → close + toast

   BACKEND USED: POST /api/auth/register
   Already accepts: firstName, lastName, email, password,
                    role, college, branch, year, phone
   No backend changes required.
   ============================================================ */
'use strict';

/* ════════════════════════════════════════════════════════════
   ROUTE GUARDS  (unchanged)
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

  const modal    = document.getElementById('authModal');
  const closeBtn = document.getElementById('authModalClose');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup= document.getElementById('tab-signup');
  const formLogin= document.getElementById('login-form');
  const formSignup=document.getElementById('signup-form');

  if (!modal) return;

  /* ── Role state (signup only) ── */
  let selectedRole = null;   /* 'student' | 'organizer' */

  /* ════════════════════════════════════════
     OPEN / CLOSE / TAB
     ════════════════════════════════════════ */
  function openAuth(tab = 'signup') {
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
    if (typeof trapFocus === 'function') trapFocus(modal);
  }

  function closeAuth() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    clearErrors();
    /* Reset signup back to role-selection step */
    resetSignupFlow();
  }

  function switchTab(tab) {
    const isLogin = tab === 'login';
    formLogin  && (formLogin.style.display  = isLogin ? 'flex' : 'none');
    formSignup && (formSignup.style.display = isLogin ? 'none' : 'flex');
    tabLogin ?.classList.toggle('auth-tab--active',  isLogin);
    tabSignup?.classList.toggle('auth-tab--active', !isLogin);
    clearErrors();
  }

  /* ── Error helpers ── */
  function clearErrors() {
    modal.querySelectorAll('.auth-error').forEach(el => el.remove());
  }
  function showError(form, msg) {
    clearErrors();
    const div = Object.assign(document.createElement('div'), {
      className:   'auth-error',
      textContent: msg,
    });
    form.insertBefore(div, form.firstChild);
  }
  function setLoading(btn, loading) {
    btn.disabled    = loading;
    btn.innerHTML   = loading
      ? '<span class="spinner"></span> Please wait…'
      : (btn.dataset.origText || btn.textContent);
  }

  /* ── Close / tab wiring ── */
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

  /* ════════════════════════════════════════
     LOGIN FORM  (unchanged logic)
     ════════════════════════════════════════ */
  if (formLogin) {
    const submitBtn = formLogin.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.dataset.origText = submitBtn.textContent;

    formLogin.addEventListener('submit', async e => {
      e.preventDefault();
      clearErrors();

      const email = formLogin.querySelector('[type="email"]')?.value.trim();
      const pwd   = formLogin.querySelector('[type="password"]')?.value;
      if (!email || !pwd) return showError(formLogin, 'Enter your email and password.');

      setLoading(submitBtn, true);
      try {
        const r = await FN_AUTH_API.login(email, pwd);
        closeAuth();
        showToast('👋 Welcome back, ' + r.user.firstName + '!', 'success');
      } catch (err) {
        console.error('[Login] Error:', err.message);
        
        /* Extract meaningful error message */
        let errorMsg = err.message || 'Login failed. Check your credentials.';
        if (err.errors && err.errors.length > 0) {
          errorMsg = err.errors[0].message || errorMsg;
        }
        showError(formLogin, errorMsg);
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  /* ════════════════════════════════════════
     SIGNUP FORM — role-first flow
     ════════════════════════════════════════ */
  if (!formSignup) return;

  /* ── Refs inside the signup form ── */
  const roleSection   = formSignup.querySelector('#su-role-section');
  const fieldsSection = formSignup.querySelector('#su-fields-section');
  const studentFields = formSignup.querySelector('#su-student-fields');
  const orgFields     = formSignup.querySelector('#su-org-fields');
  const roleCards     = formSignup.querySelectorAll('.su-role-card');
  const backBtn       = formSignup.querySelector('#su-back-btn');
  const submitBtn     = formSignup.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.dataset.origText = submitBtn.textContent;

  /* ── Reset to step 1 ── */
  function resetSignupFlow() {
    selectedRole = null;
    /* Show role section, hide fields */
    if (roleSection)   roleSection.style.display   = '';
    if (fieldsSection) fieldsSection.style.display = 'none';
    /* Deselect all cards */
    roleCards.forEach(c => c.classList.remove('su-role-card--active'));
    roleCards.forEach(c => c.setAttribute('aria-pressed', 'false'));
    /* Clear form inputs */
    formSignup.querySelectorAll('input, select').forEach(el => { el.value = ''; });
  }

  /* ── Advance to step 2 with the chosen role ── */
  function goToFields(role) {
    selectedRole = role;
    /* Swap sections with a quick fade */
    if (roleSection) {
      roleSection.style.opacity    = '0';
      roleSection.style.transition = 'opacity .18s ease';
      setTimeout(() => {
        roleSection.style.display = 'none';
        roleSection.style.opacity = '';

        /* Show role-specific field group */
        if (studentFields) studentFields.style.display = role === 'student' ? '' : 'none';
        if (orgFields)     orgFields.style.display     = role === 'organizer' ? '' : 'none';

        if (fieldsSection) {
          fieldsSection.style.opacity    = '0';
          fieldsSection.style.display    = 'flex';
          fieldsSection.style.transition = 'opacity .18s ease';
          requestAnimationFrame(() => {
            fieldsSection.style.opacity = '1';
          });
        }

        /* Focus first input in the revealed form */
        fieldsSection?.querySelector('input')?.focus();
      }, 180);
    }
  }

  /* ── Role card click ── */
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => {
        c.classList.remove('su-role-card--active');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('su-role-card--active');
      card.setAttribute('aria-pressed', 'true');
      goToFields(card.dataset.role);
    });

    /* Keyboard: Enter / Space activates the card */
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* ── Back button: return to step 1 ── */
  backBtn?.addEventListener('click', () => {
    clearErrors();
    resetSignupFlow();
  });

  /* ── Submit ── */
  formSignup.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    console.log('[Signup] Form submitted, selectedRole:', selectedRole);

    /* Guard: role must be selected */
    if (!selectedRole) {
      console.warn('[Signup] No role selected');
      showError(formSignup, 'Please choose Student or Organizer first.');
      resetSignupFlow();
      return;
    }

    /* Shared fields (always visible in step 2) */
    const email    = formSignup.querySelector('#su-email')?.value?.trim()    || '';
    const password = formSignup.querySelector('#su-password')?.value         || '';

    console.log('[Signup] Email:', email, 'Password length:', password.length);

    /* ── Validation ── */
    if (!email) {
      showError(formSignup, 'Email is required.');
      return;
    }
    if (!password) {
      showError(formSignup, 'Password is required.');
      return;
    }
    if (password.length < 8) {
      showError(formSignup, 'Password must be at least 8 characters.');
      return;
    }

    /* ── Build payload based on role ── */
    let payload = {
      email,
      password,
      role: selectedRole,
    };

    if (selectedRole === 'student') {
      console.log('[Signup] Building student payload');

      /* Student fields */
      const firstName = formSignup.querySelector('#su-s-firstname')?.value?.trim() || '';
      const lastName  = formSignup.querySelector('#su-s-lastname')?.value?.trim()  || '';
      const college   = formSignup.querySelector('#su-s-college')?.value?.trim()   || '';
      const year      = formSignup.querySelector('#su-s-year')?.value             || '';
      const branch    = formSignup.querySelector('#su-s-branch')?.value?.trim()    || '';

      console.log('[Signup] Extracted values - First:', firstName, 'Last:', lastName, 'College:', college, 'Year:', year);

      if (!firstName) {
        showError(formSignup, 'First name is required.');
        return;
      }
      if (!lastName) {
        showError(formSignup, 'Last name is required.');
        return;
      }
      if (!college) {
        showError(formSignup, 'College is required.');
        return;
      }
      if (!year) {
        showError(formSignup, 'Year of study is required.');
        return;
      }

      payload = {
        ...payload,
        firstName,
        lastName,
        college,
        year,
        branch: branch || '',
      };

      console.log('[Signup] Student payload created:', JSON.stringify(payload));

    } else if (selectedRole === 'organizer') {
      console.log('[Signup] Building organizer payload');

      /* Organizer fields */
      const organizationName = formSignup.querySelector('#su-o-orgname')?.value?.trim() || '';
      const city = formSignup.querySelector('#su-o-city')?.value?.trim() || '';
      const phone = formSignup.querySelector('#su-o-phone')?.value?.trim() || '';
      const branch = formSignup.querySelector('#su-o-branch')?.value?.trim() || '';

      console.log('[Signup] Extracted values - OrgName:', organizationName, 'City:', city, 'Phone:', phone);

      if (!organizationName) {
        showError(formSignup, 'Organization/College name is required.');
        return;
      }
      if (!city) {
        showError(formSignup, 'City is required.');
        return;
      }
      if (!phone) {
        showError(formSignup, 'Phone number is required.');
        return;
      }

      payload = {
        ...payload,
        organizationName,
        city,
        phone,
        branch: branch || '',
      };

      console.log('[Signup] Organizer payload created:', JSON.stringify(payload));
    }

    /* ── Call register endpoint ── */
    setLoading(submitBtn, true);
    console.log('[Signup] Sending payload:', payload);

    try {
      const r = await FN_AUTH_API.register(payload);

      console.log('[Signup] Registration successful:', r);
      closeAuth();
      showToast('🎉 Welcome to FestNest, ' + (selectedRole === 'student' ? payload.firstName : payload.organizationName) + '!', 'success');

      /* Redirect organizers to My Events */
      if (selectedRole === 'organizer') {
        setTimeout(() => { window.location.href = '/pages/my-events.html'; }, 900);
      }
    } catch (err) {
      console.error('[Signup] API Error Status:', err.statusCode || err.status);
      console.error('[Signup] API Error Message:', err.message);
      console.error('[Signup] Full Error Details:', err);
      
      /* Extract meaningful error message for user */
      let errorMsg = err.message || 'Registration failed. Please try again.';
      
      // If we have specific validation errors, show the first one
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors[0].message || errorMsg;
      }
      
      console.warn('[Signup] Displaying error to user:', errorMsg);
      showError(formSignup, errorMsg);
    } finally {
      setLoading(submitBtn, false);
    }
  });

  /* ── Trigger buttons on page ── */
  ['navLoginBtn','navSignupBtn','drawerLoginBtn','drawerSignupBtn','ctaSignupBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const tab = id.toLowerCase().includes('login') ? 'login' : 'signup';
    btn.addEventListener('click', () => openAuth(tab));
  });

  window.openAuthModal  = openAuth;
  window.closeAuthModal = closeAuth;

}());
