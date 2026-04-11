/* ============================================================
   FESTNEST — assets/js/navbar.js

   DOUBLE-CLICK BUG FIXED:
   The bug happened because nav items had BOTH an <a href> AND
   a JS click listener. The link fired once, then JS fired again.

   Fix: Navigation is 100% plain <a href> links in HTML.
   This file handles ONLY:
     - Scroll shadow on navbar
     - Hamburger drawer open/close
     - Auth state (Login vs User name)
     - Active link highlight

   No JS navigation handlers. No window.location assignments
   for nav items. Zero duplicate navigation.
   ============================================================ */
'use strict';

(function initNavbar() {
  const navbar  = document.getElementById('navbar');
  const burger  = document.getElementById('hamburger');
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (!navbar) return;

  /* ── Scroll shadow ── */
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ── Drawer ── */
  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    burger?.classList.add('open');
    burger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    burger?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger?.addEventListener('click', () =>
    drawer?.classList.contains('open') ? closeDrawer() : openDrawer()
  );
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });
  // Close drawer when any link inside it is clicked
  drawer?.querySelectorAll('a.drawer-link').forEach(l =>
    l.addEventListener('click', closeDrawer)
  );

  /* ── Active link ─────────────────────────────────────────────
     Compares the last path segment of each nav link href
     to the current page filename.
  ─────────────────────────────────────────────────────────── */
  const curFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .drawer-link').forEach(link => {
    const hrefFile = (link.getAttribute('href') || '').split('/').pop() || 'index.html';
    if (hrefFile === curFile) link.classList.add('active');
    else link.classList.remove('active');
  });

  /* ── Auth-aware nav ──────────────────────────────────────────
     Shows user name + logout instead of Login/Signup buttons.
     Adds role-specific links (Admin, My Events).
     All new links are plain <a> tags — no JS click handlers.
     Updates BOTH nav-actions (desktop) AND drawer-auth (mobile).
  ─────────────────────────────────────────────────────────── */
  function syncNavAuth() {
    const user    = FN_AUTH?.getUser();
    const actions = document.querySelector('.nav-actions');
    const drawer  = document.querySelector('.drawer-auth');

    if (user && FN_AUTH.isLoggedIn()) {
      // DESKTOP: Update nav-actions
      if (actions) {
        // Role-specific extra link — use nav-role-btn for consistent styling in nav-actions
        let extraLink = '';
        if (user.role === 'admin') {
          extraLink = `<a href="/pages/admin.html" class="nav-role-btn"
                          style="color:var(--color-accent);font-weight:800;">⚙️ Admin</a>`;
        } else if (user.role === 'organizer') {
          // Plain href — aligned styling with admin link
          extraLink = `<a href="/pages/my-events.html" class="nav-role-btn">📋 My Events</a>`;
        }

        const avatarHtml = user.avatar
          ? `<img src="${user.avatar}" alt="${user.firstName}"
                 style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
          : '👤';

        actions.innerHTML = `
          ${extraLink}
          <a href="/pages/profile.html" class="nav-user-btn">
            ${avatarHtml} <span class="nav-user-name">${user.firstName}</span>
          </a>`;
      }

      // MOBILE: Update drawer-auth
      if (drawer) {
        // Role-specific link for drawer
        let extraLink = '';
        if (user.role === 'admin') {
          extraLink = `<a href="/pages/admin.html" class="drawer-link" style="color:var(--color-accent);font-weight:800;">Admin</a>`;
        } else if (user.role === 'organizer') {
          extraLink = `<a href="/pages/my-events.html" class="drawer-link">My Events</a>`;
        }

        drawer.innerHTML = `
          ${extraLink}
          <a href="/pages/profile.html" class="drawer-link">${user.firstName}'s Profile</a>`;
      }

    } else {
      // Not logged in
      if (actions && !document.getElementById('navLoginBtn')) {
        actions.innerHTML = `
          <button class="btn btn-outline" id="navLoginBtn">Log In</button>
          <button class="btn btn-primary"  id="navSignupBtn">Sign Up Free</button>`;

        document.getElementById('navLoginBtn')?.addEventListener('click', () =>
          typeof openAuthModal === 'function' && openAuthModal('login')
        );
        document.getElementById('navSignupBtn')?.addEventListener('click', () =>
          typeof openAuthModal === 'function' && openAuthModal('signup')
        );
      }

      if (drawer && !document.getElementById('drawerLoginBtn')) {
        drawer.innerHTML = `
          <button class="btn btn-outline w-full" id="drawerLoginBtn">Log In</button>
          <button class="btn btn-primary w-full" id="drawerSignupBtn">Sign Up Free</button>`;

        document.getElementById('drawerLoginBtn')?.addEventListener('click', () =>
          typeof openAuthModal === 'function' && openAuthModal('login')
        );
        document.getElementById('drawerSignupBtn')?.addEventListener('click', () =>
          typeof openAuthModal === 'function' && openAuthModal('signup')
        );
      }
    }
  }

  window.addEventListener('fn:login',  () => syncNavAuth());
  window.addEventListener('fn:logout', () => window.location.reload());
  syncNavAuth();

  /* ── EXPORT FOR GLOBAL ACCESS ── */
  window.syncNavAuth = syncNavAuth;

}());
