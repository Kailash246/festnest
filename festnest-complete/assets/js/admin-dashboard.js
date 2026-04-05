/* ============================================================
   festnest-complete/assets/js/admin-dashboard.js

   WHAT'S NEW IN THIS VERSION vs the previous one:
   ─────────────────────────────────────────────────────────
   1. DELETE button added to each pending event card
      - Shows confirmation before calling DELETE /api/events/:id
      - Works for admin on ANY event status
      - Card fades out after success, stats refresh

   2. ENHANCED EVENT CARD — full details visible at a glance:
      - Description preview (truncated to 3 lines via CSS)
      - Category badge (was already there as a tag)
      - Mode badge (Online / Offline / Hybrid)
      - Registration fee
      - Organizer name + submitted date (already existed)
      - Hashtags row (from ev.tags)

   3. "View Details →" button
      - Navigates to /pages/event-detail.html?id=<id>
      - Plain href anchor — no JS navigation handler

   4. All existing features preserved:
      - Approve (with badge prompt)
      - Reject (with reason prompt)
      - Skeleton loading, empty/error states
      - Stats panel
   ─────────────────────────────────────────────────────────
   ZERO new CSS classes — uses only existing:
     .btn, .btn-primary, .btn-danger, .btn-ghost
     .ev-card, .ev-card-body, .ev-card-name, .ev-card-meta
     .ev-meta-item, .ev-tag, .ev-card-tags, .ev-card-college
     .skeleton, .events-empty
   ============================================================ */
'use strict';

(function AdminDashboard() {

  const PENDING_LIST_ID  = 'pendingEventsList';
  const PENDING_COUNT_ID = 'pendingCount';
  const STAT_TOTAL_ID    = 'statTotal';
  const STAT_PENDING_ID  = 'statPending';
  const STAT_APPROVED_ID = 'statApproved';
  const STAT_USERS_ID    = 'statUsers';

  /* ════════════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    const user = FN_AUTH.getUser();
    if (!FN_AUTH.isLoggedIn() || user?.role !== 'admin') {
      showToast('Access denied. Admin only.', 'error');
      setTimeout(() => { window.location.href = '/index.html'; }, 800);
      return;
    }
    loadStats();
    loadPendingEvents();
  });

  /* ════════════════════════════════════════════════════════
     STATS
     ════════════════════════════════════════════════════════ */
  async function loadStats() {
    try {
      const { stats } = await FN_EVENTS_API.getStats();
      setText(STAT_TOTAL_ID,    stats.events.total);
      setText(STAT_PENDING_ID,  stats.events.pending);
      setText(STAT_APPROVED_ID, stats.events.approved);
      setText(STAT_USERS_ID,    stats.users.total);
    } catch (err) {
      console.warn('[Admin] Stats load failed:', err.message);
    }
  }

  /* ════════════════════════════════════════════════════════
     PENDING EVENTS LIST
     ════════════════════════════════════════════════════════ */
  async function loadPendingEvents() {
    const container = document.getElementById(PENDING_LIST_ID);
    if (!container) return;

    container.innerHTML = buildSkeleton(3);

    try {
      const { events, count } = await FN_EVENTS_API.getPending();
      setText(PENDING_COUNT_ID, count);

      if (!count) {
        container.innerHTML = emptyState('✅', 'No pending events', 'All caught up! No events are waiting for review.');
        return;
      }

      container.innerHTML = events.map(ev => buildPendingCard(ev)).join('');
      bindCardButtons(container);

    } catch (err) {
      container.innerHTML = errorState('Failed to load pending events: ' + err.message);
      console.error('[Admin] Pending load error:', err);
    }
  }

  /* ── Bind ALL interactive buttons after render ── */
  function bindCardButtons(container) {
    container.querySelectorAll('[data-approve]').forEach(btn =>
      btn.addEventListener('click', () => handleApprove(btn.dataset.approve, btn.dataset.title))
    );
    container.querySelectorAll('[data-reject]').forEach(btn =>
      btn.addEventListener('click', () => handleReject(btn.dataset.reject, btn.dataset.title))
    );
    /* NEW: admin delete */
    container.querySelectorAll('[data-admin-delete]').forEach(btn =>
      btn.addEventListener('click', () => handleAdminDelete(btn.dataset.adminDelete, btn.dataset.title))
    );
  }

  /* ════════════════════════════════════════════════════════
     APPROVE
     ════════════════════════════════════════════════════════ */
  async function handleApprove(eventId, eventTitle) {
    const badge = promptBadge();
    const btn   = document.querySelector(`[data-approve="${eventId}"]`);
    if (btn) setButtonLoading(btn, true, 'Approving…');

    try {
      const res = await FN_EVENTS_API.approveEvent(eventId, { badge, isFeatured: false });
      animateRemoveCard(eventId);
      updatePendingCount(-1);
      loadStats();
      showToast('✅ ' + res.message, 'success');
    } catch (err) {
      if (btn) setButtonLoading(btn, false, '✅ Approve');
      showToast('❌ Approve failed: ' + err.message, 'error');
    }
  }

  /* ════════════════════════════════════════════════════════
     REJECT
     ════════════════════════════════════════════════════════ */
  async function handleReject(eventId, eventTitle) {
    const reason = window.prompt(
      `Reject "${eventTitle}"?\n\nEnter a reason (shown to organizer):`,
      'Does not meet FestNest posting guidelines.'
    );
    if (reason === null) return; /* cancelled */

    const btn = document.querySelector(`[data-reject="${eventId}"]`);
    if (btn) setButtonLoading(btn, true, 'Rejecting…');

    try {
      const res = await FN_EVENTS_API.rejectEvent(eventId, reason.trim() || undefined);
      animateRemoveCard(eventId);
      updatePendingCount(-1);
      loadStats();
      showToast('🚫 ' + res.message, 'success');
    } catch (err) {
      if (btn) setButtonLoading(btn, false, '✕ Reject');
      showToast('❌ Reject failed: ' + err.message, 'error');
    }
  }

  /* ════════════════════════════════════════════════════════
     ADMIN DELETE — works on any event, any status
     ════════════════════════════════════════════════════════ */
  async function handleAdminDelete(eventId, eventTitle) {
    /* Step 1: explicit confirmation */
    const confirmed = window.confirm(
      `Are you sure you want to delete this event?\n\n"${eventTitle}"\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    const btn = document.querySelector(`[data-admin-delete="${eventId}"]`);
    if (btn) setButtonLoading(btn, true, 'Deleting…');

    try {
      /* skipConfirm=true — we already confirmed above */
      const res = await FN_EVENTS_API.deleteEvent(eventId, true);
      animateRemoveCard(eventId);
      updatePendingCount(-1);
      loadStats();
      showToast('🗑 ' + (res.message || 'Event deleted successfully.'), 'success');
    } catch (err) {
      if (btn) setButtonLoading(btn, false, '🗑 Delete');
      showToast('❌ Delete failed: ' + err.message, 'error');
    }
  }

  /* ════════════════════════════════════════════════════════
     CARD BUILDER
     Preserves existing layout — enhancements added inside
     the ev-card-body, no new CSS classes required.
     ════════════════════════════════════════════════════════ */
  function buildPendingCard(ev) {
    // Safe null check — prevent crash if event is null
    if (!ev || !ev._id) {
      console.warn('[Admin] Skipping null/invalid event in buildPendingCard');
      return '';
    }
    
    const eid = ev._id;
    const safeTitle = ev.title.replace(/"/g, '&quot;');

    const startDate = ev.startDate
      ? new Date(ev.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : 'TBA';
    const submittedAt = ev.createdAt
      ? new Date(ev.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : '';

    const organizerName = ev.organizer
      ? `${ev.organizer.firstName} ${ev.organizer.lastName}`
      : ev.organizerName || '—';

    const banner = ev.posterUrl
      ? `<img src="${ev.posterUrl}" alt="${ev.title}"
             style="width:100%;height:140px;object-fit:cover;" loading="lazy">`
      : `<div style="height:140px;display:flex;align-items:center;justify-content:center;
                     font-size:44px;background:${catGradient(ev.category)};">
           ${catEmoji(ev.category)}
         </div>`;

    /* Description preview — CSS clamps to 3 lines */
    const descPreview = ev.description
      ? `<p style="font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:10px;
                   display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;
                   overflow:hidden;">
           ${ev.description}
         </p>`
      : '';

    /* Hashtags row */
    const tagsRow = ev.tags && ev.tags.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
           ${ev.tags.map(t =>
               `<span style="background:var(--pastel-purple);color:var(--color-primary);
                             padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">
                  ${t.startsWith('#') ? t : '#' + t}
                </span>`
             ).join('')}
         </div>`
      : '';

    /* Mode badge */
    const modeIcon = { Online:'🌐', Offline:'🏢', Hybrid:'🔀' }[ev.mode] || '🏢';

    return `
      <div class="ev-card" id="admin-card-${eid}" style="border:2px solid var(--pastel-yellow);">

        <div class="ev-card-banner" style="position:relative;overflow:hidden;">
          ${banner}
          <div class="ev-card-tags">
            <span class="ev-tag" style="background:var(--grad-warm);color:#fff;">⏳ Pending</span>
            <span class="ev-tag" style="background:rgba(0,0,0,.45);color:#fff;">${ev.category}</span>
          </div>
        </div>

        <div class="ev-card-body">
          <div class="ev-card-name" title="${ev.title}">${ev.title}</div>
          <div class="ev-card-college">🏛 ${ev.college}</div>

          <!-- Enhanced meta: date + mode + fee -->
          <div class="ev-card-meta" style="margin-bottom:10px;">
            <span class="ev-meta-item">📅 ${startDate}</span>
            <span class="ev-meta-item">${modeIcon} ${ev.mode}</span>
            <span class="ev-meta-item">💰 ${ev.registrationFee || 'Free'}</span>
          </div>

          <!-- Description preview (NEW) -->
          ${descPreview}

          <!-- Hashtags (NEW) -->
          ${tagsRow}

          <!-- Submitter info -->
          <div style="font-size:12px;color:var(--text-3);margin-bottom:12px;">
            Submitted by <strong>${organizerName}</strong>
            ${submittedAt ? ` · ${submittedAt}` : ''}
          </div>

          <!-- Action buttons: Approve · Reject · Delete · View Details -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;">

            <button class="btn btn-primary"
                    style="flex:1;font-size:12px;padding:8px 6px;min-width:80px;"
                    data-approve="${eid}"
                    data-title="${safeTitle}">
              ✅ Approve
            </button>

            <button class="btn btn-danger"
                    style="flex:1;font-size:12px;padding:8px 6px;min-width:80px;"
                    data-reject="${eid}"
                    data-title="${safeTitle}">
              ✕ Reject
            </button>

            <!-- NEW: Admin delete button -->
            <button class="btn btn-danger"
                    style="flex:0 0 auto;font-size:12px;padding:8px 10px;
                           background:transparent;color:#e53e3e;border:1.5px solid #e53e3e;"
                    data-admin-delete="${eid}"
                    data-title="${safeTitle}"
                    title="Delete this event permanently">
              🗑
            </button>

            <!-- NEW: View full details (plain anchor) -->
            <a class="btn btn-ghost"
               style="flex:0 0 auto;font-size:12px;padding:8px 10px;"
               href="/pages/event-detail.html?id=${eid}"
               target="_blank"
               title="Open full event detail in new tab">
              View →
            </a>

          </div>
        </div>
      </div>`;
  }

  /* ════════════════════════════════════════════════════════
     HELPERS
     ════════════════════════════════════════════════════════ */

  function animateRemoveCard(eventId) {
    const card = document.getElementById(`admin-card-${eventId}`);
    if (!card) return;
    card.style.transition = 'opacity .25s, transform .25s';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(.96)';
    setTimeout(() => {
      card.remove();
      const container = document.getElementById(PENDING_LIST_ID);
      if (container && !container.children.length) {
        container.innerHTML = emptyState('✅', 'All reviewed!', 'No more pending events.');
      }
    }, 260);
  }

  function updatePendingCount(delta) {
    const el = document.getElementById(PENDING_COUNT_ID);
    if (!el) return;
    el.textContent = Math.max(0, (parseInt(el.textContent, 10) || 0) + delta);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '—';
  }

  function setButtonLoading(btn, loading, text) {
    btn.disabled    = loading;
    btn.textContent = text;
  }

  function promptBadge() {
    const choice = window.prompt(
      'Choose badge for this event:\n\n  1 → new (default)\n  2 → trending\n  3 → mega\n\nPress Enter to use default.',
      '1'
    );
    return { '2': 'trending', '3': 'mega' }[choice] || 'new';
  }

  function buildSkeleton(n) {
    return Array(n).fill(0).map(() => `
      <div class="ev-card">
        <div class="skeleton" style="height:140px;"></div>
        <div class="ev-card-body">
          <div class="skeleton" style="height:18px;width:70%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:13px;width:45%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:13px;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:13px;width:80%;margin-bottom:12px;"></div>
          <div class="skeleton" style="height:36px;"></div>
        </div>
      </div>`).join('');
  }

  function emptyState(icon, title, desc) {
    return `
      <div class="events-empty" style="grid-column:1/-1;">
        <div class="events-empty-icon">${icon}</div>
        <div class="events-empty-title">${title}</div>
        <p style="color:var(--text-2);font-size:14px;margin-top:8px;">${desc}</p>
      </div>`;
  }

  function errorState(msg) {
    return `
      <div class="events-empty" style="grid-column:1/-1;">
        <div class="events-empty-icon">⚠️</div>
        <div class="events-empty-title">Load Failed</div>
        <p style="color:var(--text-2);font-size:14px;margin-top:8px;">${msg}</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">Retry</button>
      </div>`;
  }

  function catGradient(cat) {
    const m = {
      Hackathon:  'linear-gradient(135deg,#667eea,#764ba2)',
      Cultural:   'linear-gradient(135deg,#f093fb,#f5576c)',
      Technical:  'linear-gradient(135deg,#4facfe,#00f2fe)',
      Sports:     'linear-gradient(135deg,#fa709a,#fee140)',
      Workshop:   'linear-gradient(135deg,#a18cd1,#fbc2eb)',
      Management: 'linear-gradient(135deg,#f7971e,#ffd200)',
      Literary:   'linear-gradient(135deg,#43e97b,#38f9d7)',
    };
    return m[cat] || 'linear-gradient(135deg,#667eea,#764ba2)';
  }

  function catEmoji(cat) {
    const m = { Hackathon:'💻', Cultural:'🎭', Technical:'🔬', Sports:'⚽', Workshop:'🧠', Management:'📊', Literary:'📚' };
    return m[cat] || '🎉';
  }

}());
