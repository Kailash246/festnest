/* ============================================================
   FESTNEST FRONTEND — assets/js/saved-live.js
   Replace old saved.js — fetches saved events from real API
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  const container = document.getElementById('savedContainer');
  if (!container) return;

  /* Not logged in — show prompt */
  if (!FN_AUTH.isLoggedIn()) {
    container.innerHTML = `
      <div class="saved-empty">
        <div class="saved-empty-icon">🔒</div>
        <div class="saved-empty-title">Log in to see your saved events</div>
        <p class="saved-empty-desc">Create a free account and start bookmarking events you're interested in.</p>
        <button class="btn btn-primary btn-lg" onclick="openAuthModal('signup')">Sign Up Free</button>
      </div>`;
    return;
  }

  /* Loading state */
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">
      ${Array(3).fill('<div class="ev-card"><div class="skeleton" style="height:180px;"></div><div class="ev-card-body"><div class="skeleton" style="height:18px;margin-bottom:8px;"></div><div class="skeleton" style="height:14px;width:60%;"></div></div></div>').join('')}
    </div>`;

  try {
    console.log('[Saved Events] Fetching saved events...');
    const data = await FN_EVENTS_API.getSavedEvents();
    console.log('[Saved Events] Loaded:', { count: data.count, events: data.events });
    renderSaved(data.events);
  } catch (err) {
    console.error('[Saved Events] Error loading saved events:', err);
    container.innerHTML = `
      <div class="saved-empty">
        <div class="saved-empty-icon">⚠️</div>
        <div class="saved-empty-title">Failed to load saved events</div>
        <p class="saved-empty-desc">${err.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>`;
  }
});

function renderSaved(events) {
  const container = document.getElementById('savedContainer');
  if (!container) return;

  if (!events || !events.length) {
    container.innerHTML = `
      <div class="saved-empty">
        <div class="saved-empty-icon">🔖</div>
        <div class="saved-empty-title">Nothing saved yet</div>
        <p class="saved-empty-desc">Browse events and tap the bookmark icon to save them here.</p>
        <a class="btn btn-primary btn-lg" href="events.html">Browse Events</a>
      </div>`;
    return;
  }

  const sorted = [...events].reverse();
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="font-size:14px;font-weight:700;color:var(--text-2);">${sorted.length} saved event${sorted.length !== 1 ? 's' : ''}</div>
      <button class="btn btn-ghost btn-sm" id="clearSavedBtn">Clear All</button>
    </div>
    <div class="saved-grid">
      ${sorted.map(e => buildSavedCard(e)).join('')}
    </div>`;

  document.getElementById('clearSavedBtn')?.addEventListener('click', async () => {
    if (!confirm('Remove all saved events?')) return;

    /* Unsave each event */
    try {
      const savedEvts = await FN_EVENTS_API.getSavedEvents();
      await Promise.all(savedEvts.events.map(e => FN_EVENTS_API.toggleSave(e._id)));
      fnSetSaved([]);
      renderSaved([]);
      showToast('🗑 All saved events cleared');
    } catch (err) {
      showToast('Failed to clear: ' + err.message, 'error');
    }
  });
}

function buildSavedCard(event) {
  const startDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : 'TBA';

  const locationStr = event.mode === 'Online'
    ? 'Online'
    : [event.location?.city, event.location?.state].filter(Boolean).join(', ') || 'India';

  const eid = event._id || event.id;

  const banner = event.posterUrl
    ? `<img src="${event.posterUrl}" alt="${event.title}" style="width:64px;height:64px;object-fit:cover;border-radius:var(--radius-sm);">`
    : `<div style="width:64px;height:64px;border-radius:var(--radius-sm);background:${getBannerGrad(event.category)};display:flex;align-items:center;justify-content:center;font-size:28px;">${getCatEmoji(event.category)}</div>`;

  return `
    <div class="ev-card" onclick="window.location.href='event-detail.html?id=${eid}'" style="flex-direction:row;gap:14px;padding:14px;cursor:pointer;">
      ${banner}
      <div style="flex:1;min-width:0;">
        <div class="ev-card-name">${event.title}</div>
        <div class="ev-card-college">🏛 ${event.college}</div>
        <div style="font-size:11px;color:var(--text-2);margin-top:4px;">📅 ${startDate} · 📍 ${locationStr}</div>
      </div>
      <button class="ev-card-save ev-card-save--saved" style="position:static;flex-shrink:0;"
              onclick="unsaveEvent(event, '${eid}', this)">🔖</button>
    </div>`;
}

async function unsaveEvent(e, eventId, btn) {
  e.stopPropagation();
  try {
    await FN_EVENTS_API.toggleSave(eventId);
    btn.closest('.ev-card').remove();
    showToast('💔 Removed from saved');

    /* Update session storage */
    const arr = fnGetSaved();
    fnSetSaved(arr.filter(id => id !== eventId && id !== String(eventId)));

    /* If grid is now empty, re-render empty state */
    const grid = document.querySelector('.saved-grid');
    if (grid && !grid.children.length) renderSaved([]);
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
}

function getBannerGrad(category) {
  const map = { Hackathon:'linear-gradient(135deg,#667eea,#764ba2)', Cultural:'linear-gradient(135deg,#f093fb,#f5576c)', Technical:'linear-gradient(135deg,#4facfe,#00f2fe)', Sports:'linear-gradient(135deg,#fa709a,#fee140)', Workshop:'linear-gradient(135deg,#a18cd1,#fbc2eb)' };
  return map[category] || 'linear-gradient(135deg,#667eea,#764ba2)';
}

function getCatEmoji(category) {
  const map = { Hackathon:'💻', Cultural:'🎭', Technical:'🔬', Sports:'⚽', Workshop:'🧠', Management:'📊', Literary:'📚' };
  return map[category] || '🎉';
}
