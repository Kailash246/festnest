/* ============================================================
   FESTNEST — assets/js/pages/profile.js

   UPDATES IN THIS VERSION:
   - adminPanelLink and organizerPanelLink are plain <a> tags
     in the HTML. JS only toggles display:flex / display:none.
   - No JS click handlers for navigation — zero double-click bugs.
   - getMe() called with error handling that doesn't crash page
     if backend is temporarily unavailable (uses cached user).
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async function () {

  /* ── Auth guard ─────────────────────────────────────────── */
  if (!requireAuth()) return;

  /* ── Render immediately from localStorage cache ── */
  const cachedUser = FN_AUTH.getUser();
  if (cachedUser) renderProfile(cachedUser);

  /* ── Fetch fresh data from server ── */
  try {
    const freshUser = await FN_AUTH_API.getMe();
    renderProfile(freshUser);
  } catch (err) {
    console.error('[Profile] getMe failed:', err.message);
    if (err.statusCode === 401) {
      showToast('Session expired. Logging out…', 'error');
      FN_AUTH.logout();
      setTimeout(() => { window.location.href = '/index.html'; }, 1000);
      return;
    }
    // Non-401 error: show cached data + warn
    showToast('Could not refresh profile data.', 'info');
  }

  /* ── Menu actions ── */
  document.getElementById('pmRegistrations')?.addEventListener('click',
    () => showToast('🚧 My Registrations coming soon!', 'info'));
  document.getElementById('pmNotifications')?.addEventListener('click',
    () => showToast('🚧 Notifications coming soon!', 'info'));
  document.getElementById('pmEdit')?.addEventListener('click',
    () => showToast('🚧 Edit Profile coming soon!', 'info'));
  document.getElementById('pmLogout')?.addEventListener('click', () => {
    FN_AUTH_API.logout();
    showToast('👋 Logged out!');
    setTimeout(() => { window.location.href = '/index.html'; }, 700);
  });

  /* ── Interest chips ── */
  document.querySelectorAll('[data-interest]').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('filter-chip--active');
      showToast('✅ Interests updated!', 'success');
    })
  );
});

/* ════════════════════════════════════════════════════════════
   RENDER PROFILE
   ════════════════════════════════════════════════════════════ */
function renderProfile(user) {
  if (!user) return;

  const fullName = user.fullName || `${user.firstName} ${user.lastName}`;

  /* Hero card */
  setText('profileName',        fullName);
  
  /* Role-specific college/organization display */
  if (user.role === 'organizer') {
    setText('profileCollegeName', user.organizationName || 'Organization not set');
  } else {
    setText('profileCollegeName', user.college || 'College not set');
  }
  
  /* Role-specific details display */
  let detailsText = 'Details not set';
  if (user.role === 'organizer' && user.city) {
    detailsText = user.city;
  } else if (user.role === 'student') {
    detailsText = [user.branch, user.year].filter(Boolean).join(' · ') || 'Details not set';
  }
  setText('profileYear', detailsText);

  /* Info rows */
  setText('profileEmail',    user.email    || '—');
  setText('profilePhone',    user.phone    || '—');
  setText('profileBranch',   user.branch   || '—');
  setText('profileLocation',
    [user.city, user.state].filter(Boolean).join(', ') || '—'
  );

  /* Role badge */
  const roleLabels = { admin: '⚙️ Admin', organizer: '🎪 Organizer', student: '🎓 Student' };
  setText('profileRole', roleLabels[user.role] || user.role || '—');

  /* Avatar */
  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl && user.avatar) {
    avatarEl.innerHTML = `<img src="${user.avatar}" alt="${fullName}"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }

  /* Role-specific menu items — plain <a> links, just toggling visibility */
  const adminLink = document.getElementById('adminPanelLink');
  const orgLink   = document.getElementById('organizerPanelLink');

  if (adminLink)
    adminLink.style.display = user.role === 'admin' ? 'flex' : 'none';
  if (orgLink)
    orgLink.style.display   = ['organizer', 'admin'].includes(user.role) ? 'flex' : 'none';

  /* Saved count */
  const savedCount = Array.isArray(user.savedEvents) ? user.savedEvents.length : 0;
  setText('profileSavedCount', savedCount || fnSavedCount());

  /* Page title */
  document.title = `${fullName} — FestNest`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
