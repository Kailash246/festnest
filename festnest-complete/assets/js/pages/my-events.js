/* ============================================================
   FESTNEST — assets/js/pages/my-events.js

   Organizer "My Events" page — all issues fixed:

   1. TOKEN: Uses FN_EVENTS_API which calls apiFetch which
      automatically attaches: Authorization: Bearer <fn_token>
      No manual fetch() calls, no token key mismatch possible.

   2. AUTH GUARD: requireAuth() at the top — redirects to home
      if not logged in. requireRole() ensures only organizer
      or admin can see this page.

   3. DELETE: Confirmation → DELETE /api/events/:id →
      card fades out → live counter updates → no page reload.

   4. NAVIGATION: This script only handles data + interaction.
      The "My Events" link in the navbar is a plain <a href=>.
      No JS click handler = no double-click bug.

   5. STATUS FILTER: Client-side tab filter on already-fetched
      data — instant, no extra API calls.

   6. STATS PANEL: Calculated from the fetched array directly.
   ============================================================ */
'use strict';

/* ── State ─────────────────────────────────────────────────── */
let allEvents = [];   // full dataset from API
let activeFilter = 'all';

/* ════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Guard: only organizer and admin can access this page
  if (!requireAuth('/index.html')) return;

  const user = FN_AUTH.getUser();
  if (user && !['organizer', 'admin'].includes(user.role)) {
    showToast('This page is for event organizers only.', 'error');
    setTimeout(() => { window.location.href = '/index.html'; }, 800);
    return;
  }

  setupFilterTabs();
  loadMyEvents();
});

/* ════════════════════════════════════════════════════════════
   LOAD EVENTS FROM API
   ════════════════════════════════════════════════════════════ */
async function loadMyEvents() {
  const container = document.getElementById('myEventsList');
  if (!container) return;

  container.innerHTML = buildSkeleton(3);

  try {
    // apiFetch() in api.js automatically adds the Bearer token
    const { events, count } = await FN_EVENTS_API.getMyEvents();
    allEvents = events || [];

    // Update header badge
    const badge = document.getElementById('myEventsCount');
    if (badge) badge.textContent = allEvents.length;

    // Update stats row
    updateStats();

    // Render with active filter
    renderFiltered();

  } catch (err) {
    console.error('[MyEvents] load error:', err);

    if (err.statusCode === 401) {
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => { window.location.href = '/index.html'; }, 1000);
      return;
    }

    container.innerHTML = buildError(err.message);
  }
}

/* ════════════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════════════ */
function renderFiltered() {
  const container = document.getElementById('myEventsList');
  if (!container) return;

  const filtered = activeFilter === 'all'
    ? allEvents
    : allEvents.filter(ev => ev.status === activeFilter);

  if (!filtered.length) {
    const msg = activeFilter === 'all'
      ? 'You haven\'t posted any events yet.'
      : `No ${activeFilter} events.`;
    container.innerHTML = `
      <div class="events-empty" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <div class="events-empty-icon">📭</div>
        <div class="events-empty-title">${msg}</div>
        ${activeFilter === 'all' ? `
        <p style="color:var(--text-2);font-size:14px;margin:10px 0 20px;">
          Post your first event to reach 48,000+ students!
        </p>
        <a class="btn btn-primary" href="/pages/post-event.html">Post an Event →</a>` : ''}
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(ev => buildEventCard(ev)).join('');

  // Bind delete buttons after render
  container.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () =>
      handleDelete(btn.dataset.deleteId, btn.dataset.title)
    );
  });
}

/* ════════════════════════════════════════════════════════════
   EVENT CARD
   Uses your existing ev-card CSS — zero new styles.
   ════════════════════════════════════════════════════════════ */
function buildEventCard(ev) {
  // Safe null check — prevent crash if event is null/undefined
  if (!ev || !ev._id && !ev.id) {
    console.warn('[MyEvents] Skipping null/invalid event in buildEventCard');
    return '';
  }
  
  const eid = ev._id || ev.id;
  const { label: statusLabel, color: statusColor, bg: statusBg } = statusBadge(ev.status);
  const startDate = ev.startDate
    ? new Date(ev.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : 'TBA';

  const banner = ev.posterUrl
    ? `<img src="${ev.posterUrl}" alt="${ev.title}"
           style="width:100%;height:160px;object-fit:cover;" loading="lazy">`
    : `<div style="height:160px;display:flex;align-items:center;justify-content:center;
                   font-size:44px;background:${catGradient(ev.category)};">
         ${catEmoji(ev.category)}
       </div>`;

  const isRejected = ev.status === 'rejected';

  return `
    <div class="ev-card" id="my-event-card-${eid}"
         style="${isRejected ? 'opacity:.75;border-color:#fca5a5;' : ''}">

      <div class="ev-card-banner" style="position:relative;overflow:hidden;">
        ${banner}
        <div class="ev-card-tags">
          <span class="ev-tag"
                style="background:${statusColor};color:#fff;">
            ${statusLabel}
          </span>
          <span class="ev-tag"
                style="background:rgba(0,0,0,.45);color:#fff;">
            ${ev.category}
          </span>
        </div>
      </div>

      <div class="ev-card-body">
        <div class="ev-card-name" title="${ev.title}">${ev.title}</div>
        <div class="ev-card-college">🏛 ${ev.college}</div>

        <div class="ev-card-meta">
          <span class="ev-meta-item">📅 ${startDate}</span>
          <span class="ev-meta-item">👁 ${(ev.views || 0).toLocaleString()} views</span>
          <span class="ev-meta-item">🔖 ${ev.saves || 0} saves</span>
        </div>

        ${isRejected && ev.rejectionReason ? `
        <div style="background:#fee2e2;border-radius:var(--radius-sm);padding:8px 12px;
                    font-size:12px;color:#b91c1c;margin-bottom:10px;">
          ✕ Rejection reason: ${ev.rejectionReason}
        </div>` : ''}

        <div class="ev-card-footer">
          <a class="btn btn-ghost btn-sm"
             href="/pages/event-detail.html?id=${eid}"
             onclick="event.stopPropagation()">
            View →
          </a>
          <div style="display:flex;gap:8px;">
            ${ev.status === 'rejected' ? `
            <a class="btn btn-outline btn-sm"
               href="/pages/post-event.html"
               onclick="event.stopPropagation()">
              Resubmit
            </a>` : ''}
            <button
              class="btn btn-danger btn-sm"
              data-delete-id="${eid}"
              data-title="${ev.title.replace(/"/g, '&quot;')}"
              onclick="event.stopPropagation()">
              🗑 Delete
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   DELETE
   ════════════════════════════════════════════════════════════ */
async function handleDelete(eventId, eventTitle) {
  // Step 1: Confirmation dialog
  const confirmed = window.confirm(
    `Are you sure you want to delete this event?\n\n"${eventTitle}"\n\nThis action cannot be undone.`
  );
  if (!confirmed) return;

  const btn = document.querySelector(`[data-delete-id="${eventId}"]`);
  if (btn) {
    btn.disabled    = true;
    btn.textContent = '⏳ Deleting…';
  }

  try {
    // deleteEvent() in api.js already adds Authorization header
    // We pass skipConfirm=true because we already confirmed above
    const res = await FN_EVENTS_API.deleteEvent(eventId, /* skipConfirm */ true);

    // Animate card out
    const card = document.getElementById(`my-event-card-${eventId}`);
    if (card) {
      card.style.transition = 'opacity .25s, transform .25s';
      card.style.opacity    = '0';
      card.style.transform  = 'scale(.95)';
      setTimeout(() => {
        card.remove();
        // Remove from local state
        allEvents = allEvents.filter(ev => (ev._id || ev.id) !== eventId);
        // Update stats + badge without re-fetching
        updateStats();
        document.getElementById('myEventsCount').textContent = allEvents.length;
        // If grid is now empty, show empty state
        if (!allEvents.filter(ev => activeFilter === 'all' || ev.status === activeFilter).length) {
          renderFiltered();
        }
      }, 260);
    }

    showToast('🗑 Event deleted successfully.', 'success');

  } catch (err) {
    if (btn) {
      btn.disabled    = false;
      btn.textContent = '🗑 Delete';
    }
    showToast('❌ Delete failed: ' + err.message, 'error');
    console.error('[MyEvents] delete error:', err);
  }
}

/* ════════════════════════════════════════════════════════════
   FILTER TABS
   ════════════════════════════════════════════════════════════ */
function setupFilterTabs() {
  document.getElementById('myEventsFilterTabs')?.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.status;
      // Update active chip
      document.querySelectorAll('#myEventsFilterTabs [data-status]').forEach(b =>
        b.classList.toggle('filter-chip--active', b.dataset.status === activeFilter)
      );
      renderFiltered();
    });
  });
}

/* ════════════════════════════════════════════════════════════
   STATS
   ════════════════════════════════════════════════════════════ */
function updateStats() {
  const total    = allEvents.length;
  const approved = allEvents.filter(e => e.status === 'approved').length;
  const pending  = allEvents.filter(e => e.status === 'pending').length;
  const rejected = allEvents.filter(e => e.status === 'rejected').length;

  setText('statMyTotal',    total);
  setText('statMyApproved', approved);
  setText('statMyPending',  pending);
  setText('statMyRejected', rejected);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */
function statusBadge(status) {
  const map = {
    approved: { label: '✅ Live',     color: '#00BFA5', bg: 'var(--pastel-green)' },
    pending:  { label: '⏳ Pending',  color: '#FF8A00', bg: 'var(--pastel-yellow)' },
    rejected: { label: '✕ Rejected',  color: '#e53e3e', bg: 'var(--pastel-pink)' },
    expired:  { label: '⌛ Expired',  color: '#999',    bg: 'var(--bg)' },
  };
  return map[status] || { label: status, color: '#999', bg: 'var(--bg)' };
}

function catGradient(cat) {
  return {
    Hackathon:  'linear-gradient(135deg,#667eea,#764ba2)',
    Cultural:   'linear-gradient(135deg,#f093fb,#f5576c)',
    Technical:  'linear-gradient(135deg,#4facfe,#00f2fe)',
    Sports:     'linear-gradient(135deg,#fa709a,#fee140)',
    Workshop:   'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    Management: 'linear-gradient(135deg,#f7971e,#ffd200)',
    Literary:   'linear-gradient(135deg,#43e97b,#38f9d7)',
  }[cat] || 'linear-gradient(135deg,#667eea,#764ba2)';
}

function catEmoji(cat) {
  return { Hackathon:'💻', Cultural:'🎭', Technical:'🔬', Sports:'⚽',
           Workshop:'🧠', Management:'📊', Literary:'📚' }[cat] || '🎉';
}

function buildSkeleton(n) {
  return Array(n).fill(0).map(() => `
    <div class="ev-card" style="pointer-events:none;">
      <div class="skeleton" style="height:160px;border-radius:0;"></div>
      <div class="ev-card-body">
        <div class="skeleton" style="height:18px;width:72%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:13px;width:48%;margin-bottom:12px;"></div>
        <div class="skeleton" style="height:12px;margin-bottom:6px;"></div>
        <div class="skeleton" style="height:36px;"></div>
      </div>
    </div>`).join('');
}

function buildError(msg) {
  return `
    <div class="events-empty" style="grid-column:1/-1;">
      <div class="events-empty-icon">⚠️</div>
      <div class="events-empty-title">Failed to load your events</div>
      <p style="color:var(--text-2);font-size:14px;margin-top:8px;">${msg}</p>
      <button class="btn btn-primary" style="margin-top:16px;"
              onclick="location.reload()">Retry</button>
    </div>`;
}
