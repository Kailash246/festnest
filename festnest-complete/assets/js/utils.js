/* ============================================================
   FESTNEST — UTILS  |  assets/js/utils.js

   FIX: getDetailHref now uses root-relative /pages/ path
   so links work whether called from index.html or pages/*.html
   ============================================================ */
'use strict';

function debounce(fn, delay = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}

function getUrlParam(k) { return new URLSearchParams(window.location.search).get(k); }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function trapFocus(el) {
  const f = Array.from(el.querySelectorAll(
    'button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])'
  )).filter(e => !e.disabled);
  const first = f[0], last = f[f.length - 1];
  el.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last && last.focus(); } }
    else            { if (document.activeElement === last)  { e.preventDefault(); first && first.focus(); } }
  });
  first && first.focus();
}

/* ── Category helpers ── */
function getCategoryGradient(cat) {
  const m = {
    Hackathon:  '#6B5B95',
    Cultural:   '#D1566C',
    Technical:  '#2B9FD9',
    Sports:     '#E85A5F',
    Workshop:   '#9B7BA6',
    Management: '#F97316',
    Literary:   '#1EC98F',
    Other:      '#6B5B95',
  };
  return m[cat] || '#6B5B95';
}

function getCategoryEmoji(cat) {
  const m = { Hackathon:'💻', Cultural:'🎭', Technical:'🔬', Sports:'⚽', Workshop:'🧠', Management:'📊', Literary:'📚', Other:'🎉' };
  return m[cat] || '🎉';
}

/**
 * Always return root-relative href so it works from any page depth.
 * FIX: was using relative paths that broke on pages/events.html
 */
function getDetailHref(id) {
  return '/pages/event-detail.html?id=' + id;
}

/* ── Build event card from API response ── */
function buildAPIEventCard(ev) {
  const eid    = ev._id || ev.id;
  const saved  = fnIsSaved(eid);
  const modeIcon = { Online: '🌐', Offline: '🏢', Hybrid: '🔀' }[ev.mode] || '🏢';
  const tagCls   = { mega: 'ev-tag--mega', trending: 'ev-tag--trending', new: 'ev-tag--new' }[ev.badge] || 'ev-tag--new';
  const tagLabel = { mega: 'Mega Event', trending: 'Trending', new: 'New' }[ev.badge] || 'New';
  const loc      = ev.mode === 'Online'
    ? 'Online'
    : ([ev.location?.city, ev.location?.state].filter(Boolean).join(', ') || 'India');
  const prize    = ev.prizes?.pool || ev.prizes?.first || 'Prizes Available';
  const dateStr  = ev.startDate
    ? new Date(ev.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBA';
  const banner   = ev.posterUrl
    ? `<img src="${ev.posterUrl}" alt="${ev.title}" style="width:100%;height:180px;object-fit:cover;" loading="lazy">`
    : `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:56px;background:${getCategoryGradient(ev.category)};">${getCategoryEmoji(ev.category)}</div>`;

  return `
    <article class="ev-card"
             onclick="window.location.href='${getDetailHref(eid)}'"
             role="button" tabindex="0"
             aria-label="View ${ev.title}">
      <div class="ev-card-banner" style="position:relative;overflow:hidden;">
        ${banner}
        <div class="ev-card-tags">
          <span class="ev-tag ${tagCls}">${tagLabel}</span>
          ${ev.mode === 'Online' ? '<span class="ev-tag ev-tag--online">Online</span>' : ''}
        </div>
        <button class="ev-card-save ${saved ? 'ev-card-save--saved' : ''}"
                id="save-btn-${eid}"
                onclick="handleCardSave(event,'${eid}')"
                aria-label="${saved ? 'Remove from saved' : 'Save event'}">
          ${saved ? '🔖' : '🤍'}
        </button>
      </div>
      <div class="ev-card-body">
        <div class="ev-card-name" title="${ev.title}">${ev.title}</div>
        <div class="ev-card-college">🏛 ${ev.college}</div>
        <div class="ev-card-meta">
          <span class="ev-meta-item">📅 ${dateStr}</span>
          <span class="ev-meta-item">📍 ${loc}</span>
          <span class="ev-meta-item">${modeIcon} ${ev.mode}</span>
        </div>
        <div class="ev-card-footer">
          <span class="ev-prize-badge">🏆 ${prize}</span>
          <button class="ev-register-btn"
                  onclick="handleCardRegister(event,'${eid}','${ev.title.replace(/'/g, "\\'")}')">
            Register →
          </button>
        </div>
      </div>
    </article>`;
}

/* ── Save click ── */
async function handleCardSave(e, eid) {
  e.stopPropagation();
  if (!FN_AUTH.isLoggedIn()) {
    showToast('Please log in to save events.', 'info');
    if (typeof openAuthModal === 'function') openAuthModal('signup');
    return;
  }
  try {
    const r   = await FN_EVENTS_API.toggleSave(eid);
    const btn = document.getElementById('save-btn-' + eid);
    if (btn) {
      btn.textContent = r.saved ? '🔖' : '🤍';
      btn.classList.toggle('ev-card-save--saved', r.saved);
      btn.setAttribute('aria-label', r.saved ? 'Remove from saved' : 'Save event');
    }
    showToast(r.saved ? '🔖 Event saved!' : '💔 Removed from saved', r.saved ? 'success' : '');
  } catch (err) {
    showToast(err.message || 'Failed to update saved.', 'error');
  }
}

/* ── Register click ── */
function handleCardRegister(e, eid, title) {
  e.stopPropagation();
  if (!FN_AUTH.isLoggedIn()) {
    showToast('Please log in to register.', 'info');
    if (typeof openAuthModal === 'function') openAuthModal('signup');
    return;
  }
  showToast('🎉 Opening registration for ' + title + '!', 'success');
}

/* ── Render events into a CSS grid ── */
function renderEventsGrid(selector, events) {
  const container = typeof selector === 'string'
    ? (document.querySelector(selector) || document.getElementById(selector.replace('#', '')))
    : selector;
  if (!container) return;

  if (!events || !events.length) {
    container.innerHTML = `
      <div class="events-empty">
        <div class="events-empty-icon">🔍</div>
        <div class="events-empty-title">No events found</div>
        <p style="color:var(--text-2);font-size:14px;margin-top:8px;">
          Try adjusting your filters or search query.
        </p>
      </div>`;
    return;
  }
  container.innerHTML = events.map(e => buildAPIEventCard(e)).join('');
}

/* ── Expose ── */
window.debounce             = debounce;
window.getUrlParam          = getUrlParam;
window.scrollTop            = scrollTop;
window.trapFocus            = trapFocus;
window.getCategoryGradient  = getCategoryGradient;
window.getCategoryEmoji     = getCategoryEmoji;
window.getDetailHref        = getDetailHref;
window.buildAPIEventCard    = buildAPIEventCard;
window.handleCardSave       = handleCardSave;
window.handleCardRegister   = handleCardRegister;
window.renderEventsGrid     = renderEventsGrid;
