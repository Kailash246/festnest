/* ============================================================
   festnest-complete/assets/js/organizer-dashboard.js

   Organizer dashboard — My Events with status badges + delete.
   NO UI change — uses your existing CSS classes only.

   Place at: festnest-complete/assets/js/organizer-dashboard.js
   Include after api.js on the organizer dashboard page:
     <script src="../assets/js/api.js"></script>
     <script src="../assets/js/organizer-dashboard.js"></script>

   The page must have ONE of these containers:
     id="myEventsList"   — grid of event cards
     id="myEventsTable"  — table row container
   ============================================================ */
'use strict';

(function OrganizerDashboard() {

  document.addEventListener('DOMContentLoaded', () => {
    const user = FN_AUTH.getUser();
    if (!FN_AUTH.isLoggedIn() || !['organizer', 'admin'].includes(user?.role)) return;
    loadMyEvents();
  });

  /* ════════════════════════════════════════════════════════
     LOAD MY EVENTS
     ════════════════════════════════════════════════════════ */
  async function loadMyEvents() {
    const listContainer  = document.getElementById('myEventsList');
    const tableContainer = document.getElementById('myEventsTable');
    const container      = listContainer || tableContainer;
    if (!container) return;

    container.innerHTML = buildSkeleton(3);

    try {
      const { events, count } = await FN_EVENTS_API.getMyEvents();

      /* Update counter badge if present */
      const badge = document.getElementById('myEventsCount');
      if (badge) badge.textContent = count;

      if (!count) {
        container.innerHTML = `
          <div class="events-empty" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
            <div class="events-empty-icon">📭</div>
            <div class="events-empty-title">No events posted yet</div>
            <p style="color:var(--text-2);font-size:14px;margin:10px 0 20px;">
              Post your first event to reach 48,000+ students!
            </p>
            <a class="btn btn-primary" href="post-event.html">Post an Event →</a>
          </div>`;
        return;
      }

      if (tableContainer) {
        /* ── Table layout ── */
        container.innerHTML = events.map(ev => buildTableRow(ev)).join('');
      } else {
        /* ── Card grid layout ── */
        container.innerHTML = events.map(ev => buildOrgEventCard(ev)).join('');
      }

      /* Bind delete buttons */
      container.querySelectorAll('[data-delete-event]').forEach(btn => {
        btn.addEventListener('click', () =>
          handleDeleteEvent(btn.dataset.deleteEvent, btn.dataset.title)
        );
      });

    } catch (err) {
      container.innerHTML = `
        <div class="events-empty" style="grid-column:1/-1;">
          <div class="events-empty-icon">⚠️</div>
          <div class="events-empty-title">Failed to load your events</div>
          <p style="color:var(--text-2);font-size:14px;margin-top:8px;">${err.message}</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">Retry</button>
        </div>`;
    }
  }

  /* ════════════════════════════════════════════════════════
     DELETE — confirmation + API call
     ════════════════════════════════════════════════════════ */
  async function handleDeleteEvent(eventId, eventTitle) {
    /* Step 1: confirmation dialog */
    const confirmed = window.confirm(
      `Are you sure you want to delete this event?\n\n"${eventTitle}"\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    const btn = document.querySelector(`[data-delete-event="${eventId}"]`);
    const originalText = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Deleting…'; }

    try {
      const res = await FN_EVENTS_API.deleteEvent(eventId);

      /* Remove from UI — works for both card and table row */
      const cardEl = document.getElementById(`org-event-${eventId}`)
                  || document.getElementById(`org-row-${eventId}`);
      if (cardEl) {
        cardEl.style.transition = 'opacity .3s, transform .3s';
        cardEl.style.opacity    = '0';
        cardEl.style.transform  = 'scale(.95)';
        setTimeout(() => {
          cardEl.remove();
          /* If list is now empty, reload to show empty state */
          const list = document.getElementById('myEventsList')
                     || document.getElementById('myEventsTable');
          if (list && !list.children.length) loadMyEvents();
        }, 300);
      }

      showToast('🗑 ' + res.message, 'success');

    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
      showToast('❌ Delete failed: ' + err.message, 'error');
    }
  }

  /* ════════════════════════════════════════════════════════
     CARD BUILDER — uses existing ev-card CSS classes
     ════════════════════════════════════════════════════════ */
  function buildOrgEventCard(ev) {
    const eid      = ev._id || ev.id;
    const { label: statusLabel, color: statusColor } = statusBadge(ev.status);
    const startDate = ev.startDate
      ? new Date(ev.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : 'TBA';
    const banner = ev.posterUrl
      ? `<img src="${ev.posterUrl}" alt="${ev.title}" style="width:100%;height:160px;object-fit:cover;" loading="lazy">`
      : `<div style="height:160px;display:flex;align-items:center;justify-content:center;font-size:44px;background:${catGradient(ev.category)};">${catEmoji(ev.category)}</div>`;

    return `
      <div class="ev-card" id="org-event-${eid}">
        <div class="ev-card-banner" style="position:relative;overflow:hidden;">
          ${banner}
          <div class="ev-card-tags">
            <span class="ev-tag" style="background:${statusColor};color:#fff;">${statusLabel}</span>
            <span class="ev-tag" style="background:rgba(0,0,0,.4);color:#fff;">${ev.category}</span>
          </div>
        </div>
        <div class="ev-card-body">
          <div class="ev-card-name" title="${ev.title}">${ev.title}</div>
          <div class="ev-card-college">🏛 ${ev.college}</div>
          <div class="ev-card-meta">
            <span class="ev-meta-item">📅 ${startDate}</span>
            <span class="ev-meta-item">👁 ${ev.views || 0}</span>
            <span class="ev-meta-item">🔖 ${ev.saves || 0}</span>
          </div>
          <div class="ev-card-footer">
            <a class="btn btn-ghost btn-sm" href="event-detail.html?id=${eid}">View →</a>
            <button
              class="btn btn-danger btn-sm"
              data-delete-event="${eid}"
              data-title="${ev.title.replace(/"/g,'&quot;')}">
              🗑 Delete
            </button>
          </div>
        </div>
      </div>`;
  }

  /* ── Table row variant ──────────────────────────────────── */
  function buildTableRow(ev) {
    const eid = ev._id || ev.id;
    const { label: statusLabel, color: statusColor } = statusBadge(ev.status);
    const startDate = ev.startDate
      ? new Date(ev.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : 'TBA';

    return `
      <tr id="org-row-${eid}">
        <td style="font-weight:700;">${ev.title}</td>
        <td>${ev.category}</td>
        <td>${startDate}</td>
        <td>
          <span style="background:${statusColor};color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">
            ${statusLabel}
          </span>
        </td>
        <td>${ev.views || 0}</td>
        <td style="display:flex;gap:8px;">
          <a class="btn btn-ghost btn-sm" href="event-detail.html?id=${eid}">View</a>
          <button
            class="btn btn-danger btn-sm"
            data-delete-event="${eid}"
            data-title="${ev.title.replace(/"/g,'&quot;')}">
            Delete
          </button>
        </td>
      </tr>`;
  }

  /* ════════════════════════════════════════════════════════
     HELPERS
     ════════════════════════════════════════════════════════ */
  function statusBadge(status) {
    const map = {
      approved: { label: '✅ Live',    color: '#00BFA5' },
      pending:  { label: '⏳ Pending', color: '#FF8A00' },
      rejected: { label: '✕ Rejected', color: '#e53e3e' },
      expired:  { label: '⌛ Expired', color: '#999'    },
    };
    return map[status] || { label: status, color: '#999' };
  }

  function buildSkeleton(n) {
    return Array(n).fill(0).map(() => `
      <div class="ev-card" style="pointer-events:none;">
        <div class="skeleton" style="height:160px;"></div>
        <div class="ev-card-body">
          <div class="skeleton" style="height:18px;width:70%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:13px;width:45%;margin-bottom:12px;"></div>
          <div class="skeleton" style="height:36px;"></div>
        </div>
      </div>`).join('');
  }

  function catGradient(cat) {
    const m = { Hackathon:'linear-gradient(135deg,#667eea,#764ba2)', Cultural:'linear-gradient(135deg,#f093fb,#f5576c)', Technical:'linear-gradient(135deg,#4facfe,#00f2fe)', Sports:'linear-gradient(135deg,#fa709a,#fee140)', Workshop:'linear-gradient(135deg,#a18cd1,#fbc2eb)', Management:'linear-gradient(135deg,#f7971e,#ffd200)', Literary:'linear-gradient(135deg,#43e97b,#38f9d7)' };
    return m[cat] || 'linear-gradient(135deg,#667eea,#764ba2)';
  }

  function catEmoji(cat) {
    const m = { Hackathon:'💻', Cultural:'🎭', Technical:'🔬', Sports:'⚽', Workshop:'🧠', Management:'📊', Literary:'📚' };
    return m[cat] || '🎉';
  }

}());
