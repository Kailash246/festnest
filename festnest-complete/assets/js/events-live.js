/* ============================================================
   FESTNEST FRONTEND — assets/js/events-live.js
   Replace your old pages/events.js with this file on events.html
   Fetches real events from MongoDB via the backend API.
   ============================================================ */

'use strict';

/* ════════════════════════════════════════
   STATE
   ════════════════════════════════════════ */
const evState = {
  cat:    'All',
  mode:   'All',
  fee:    'All',
  search: '',
  sort:   'newest',
  page:   1,
  limit:  12,
};

let isLoading = false;

/* ── DOM refs ── */
const eventsGrid            = document.getElementById('eventsGrid');
const eventsResultCount     = document.getElementById('eventsResultCount');
const eventsSearchInput     = document.getElementById('eventsSearchInput');
const eventsSortSelect      = document.getElementById('eventsSortSelect');
const clearFiltersBtn       = document.getElementById('clearFiltersBtn');
const paginationEl          = document.querySelector('.pagination');

/* ── Mobile filter modal refs ── */
const filterModalOverlay    = document.getElementById('filterModalOverlay');
const filterModal           = document.getElementById('filterModal');
const openFiltersBtn        = document.getElementById('openFiltersBtn');
const closeFiltersBtn       = document.getElementById('closeFiltersBtn');
const applyFiltersBtn       = document.getElementById('applyFiltersBtn');
const clearFiltersModalBtn  = document.getElementById('clearFiltersModalBtn');

/* ════════════════════════════════════════
   RENDER
   ════════════════════════════════════════ */
async function renderEvents() {
  if (isLoading) return;
  isLoading = true;

  /* Show skeleton */
  showLoadingSkeleton();

  try {
    const data = await FN_EVENTS_API.getEvents({
      page:     evState.page,
      limit:    evState.limit,
      category: evState.cat,
      mode:     evState.mode,
      fee:      evState.fee,
      search:   evState.search,
      sort:     evState.sort,
    });

    eventsResultCount.textContent =
      `Showing ${data.count} of ${data.total} event${data.total !== 1 ? 's' : ''}`;

    renderEventsFromAPI(data.events);
    renderPagination(data.page, data.pages);

  } catch (err) {
    eventsGrid.innerHTML = `
      <div class="events-empty" style="grid-column:1/-1;">
        <div class="events-empty-icon">⚠️</div>
        <div class="events-empty-title">Failed to load events</div>
        <p style="color:var(--text-2);font-size:14px;margin-top:8px;">${err.message}</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="renderEvents()">Try Again</button>
      </div>`;
    eventsResultCount.textContent = '';
  } finally {
    isLoading = false;
  }
}

/* ── Render events returned from API ── */
function renderEventsFromAPI(events) {
  if (!events || !events.length) {
    eventsGrid.innerHTML = `
      <div class="events-empty" style="grid-column:1/-1;">
        <div class="events-empty-icon">🔍</div>
        <div class="events-empty-title">No events found</div>
        <p style="color:var(--text-2);font-size:14px;">Try adjusting your filters or search.</p>
      </div>`;
    return;
  }

  eventsGrid.innerHTML = events.map(e => buildAPIEventCard(e)).join('');
}

/* ── Build event card from API data ── */
function buildAPIEventCard(event) {
  const saved     = fnIsSaved(event._id || event.id);
  const modeIcon  = { Online: '🌐', Offline: '🏢', Hybrid: '🔀' }[event.mode] || '🏢';
  const tagClass  = { mega: 'ev-tag--mega', trending: 'ev-tag--trending', new: 'ev-tag--new' }[event.badge] || 'ev-tag--new';
  const tagLabel  = { mega: 'Mega Event', trending: 'Trending', new: 'New' }[event.badge] || 'New';

  const locationStr = event.mode === 'Online'
    ? 'Online'
    : [event.location?.city, event.location?.state].filter(Boolean).join(', ') || 'India';

  const prizeDisplay = event.prizes?.pool || (event.prizes?.first ? event.prizes.first : 'Prizes TBD');

  /* Use poster if available, else gradient fallback */
  const bannerContent = event.posterUrl
    ? `<img src="${event.posterUrl}" alt="${event.title}" style="width:100%;height:180px;object-fit:cover;">`
    : `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:56px;background:${getGradient(event.category)};">
        ${getCategoryEmoji(event.category)}
      </div>`;

  const startDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBA';

  const eventId = event._id || event.id;

  return `
    <article class="ev-card"
             onclick="window.location.href='event-detail.html?id=${eventId}'"
             role="button" tabindex="0"
             aria-label="View ${event.title}">

      <div class="ev-card-banner" style="position:relative;overflow:hidden;">
        ${bannerContent}
        <div class="ev-card-tags" style="position:absolute;top:12px;left:12px;">
          <span class="ev-tag ${tagClass}">${tagLabel}</span>
          ${event.mode === 'Online' ? '<span class="ev-tag ev-tag--online">Online</span>' : ''}
        </div>
        <button class="ev-card-save ${saved ? 'ev-card-save--saved' : ''}"
                id="save-btn-${eventId}"
                onclick="handleSaveClickAPI(event, '${eventId}')"
                aria-label="${saved ? 'Remove from saved' : 'Save event'}">
          ${saved ? '🔖' : '🤍'}
        </button>
      </div>

      <div class="ev-card-body">
        <div class="ev-card-name" title="${event.title}">${event.title}</div>
        <div class="ev-card-college">🏛 ${event.college}</div>
        <div class="ev-card-meta">
          <span class="ev-meta-item">📅 ${startDate}</span>
          <span class="ev-meta-item">📍 ${locationStr}</span>
          <span class="ev-meta-item">${modeIcon} ${event.mode}</span>
        </div>
        <div class="ev-card-footer">
          <span class="ev-prize-badge">🏆 ${prizeDisplay}</span>
          <button class="ev-register-btn"
                  onclick="event.stopPropagation(); handleRegisterClickAPI('${eventId}', '${event.title.replace(/'/g, "\\'")}')">
            Register →
          </button>
        </div>
      </div>
    </article>`;
}

/* ── Category helpers ── */
function getGradient(category) {
  const map = {
    Hackathon: 'linear-gradient(135deg,#667eea,#764ba2)',
    Cultural:  'linear-gradient(135deg,#f093fb,#f5576c)',
    Technical: 'linear-gradient(135deg,#4facfe,#00f2fe)',
    Sports:    'linear-gradient(135deg,#fa709a,#fee140)',
    Workshop:  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    Management:'linear-gradient(135deg,#f7971e,#ffd200)',
    Literary:  'linear-gradient(135deg,#43e97b,#38f9d7)',
  };
  return map[category] || 'linear-gradient(135deg,#667eea,#764ba2)';
}

function getCategoryEmoji(category) {
  const map = {
    Hackathon: '💻', Cultural: '🎭', Technical: '🔬',
    Sports: '⚽', Workshop: '🧠', Management: '📊', Literary: '📚',
  };
  return map[category] || '🎉';
}

/* ── Save / unsave (calls real API if logged in, fallback to session) ── */
async function handleSaveClickAPI(e, eventId) {
  e.stopPropagation();

  if (!FN_AUTH.isLoggedIn()) {
    showToast('Please log in to save events.', 'info');
    if (typeof openAuthModal === 'function') openAuthModal('signup');
    return;
  }

  try {
    const res = await FN_EVENTS_API.toggleSave(eventId);
    const btn = document.getElementById(`save-btn-${eventId}`);
    if (btn) {
      btn.textContent = res.saved ? '🔖' : '🤍';
      btn.classList.toggle('ev-card-save--saved', res.saved);
    }
    showToast(res.saved ? '🔖 Event saved!' : '💔 Removed from saved', res.saved ? 'success' : '');

    /* Also update local session storage for instant UI */
    const savedArr = fnGetSaved();
    if (res.saved && !savedArr.includes(eventId)) savedArr.push(eventId);
    else if (!res.saved) savedArr.splice(savedArr.indexOf(eventId), 1);
    fnSetSaved(savedArr);

  } catch (err) {
    showToast(err.message || 'Failed to update saved events.', 'error');
  }
}

/* ── Register click ── */
function handleRegisterClickAPI(eventId, eventTitle) {
  if (!FN_AUTH.isLoggedIn()) {
    showToast('Please log in to register for events.', 'info');
    if (typeof openAuthModal === 'function') openAuthModal('signup');
    return;
  }
  showToast(`🎉 Opening registration for ${eventTitle}!`, 'success');
}

/* ── Loading skeleton ── */
function showLoadingSkeleton() {
  eventsGrid.innerHTML = Array(6).fill(0).map(() => `
    <div class="ev-card">
      <div class="skeleton" style="height:180px;"></div>
      <div class="ev-card-body">
        <div class="skeleton" style="height:18px;width:80%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:14px;width:50%;margin-bottom:12px;"></div>
        <div class="skeleton" style="height:12px;width:100%;margin-bottom:6px;"></div>
        <div class="skeleton" style="height:12px;width:70%;"></div>
      </div>
    </div>`).join('');
}

/* ── Render pagination ── */
function renderPagination(currentPage, totalPages) {
  if (!paginationEl || totalPages <= 1) {
    if (paginationEl) paginationEl.style.display = 'none';
    return;
  }

  paginationEl.style.display = 'flex';
  const buttons = [];

  /* Prev */
  if (currentPage > 1) {
    buttons.push(`<button class="page-btn" onclick="goToPage(${currentPage - 1})">←</button>`);
  }

  /* Page numbers */
  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    buttons.push(`<button class="page-btn ${i === currentPage ? 'page-btn--active' : ''}" onclick="goToPage(${i})">${i}</button>`);
  }

  /* Next */
  if (currentPage < totalPages) {
    buttons.push(`<button class="page-btn" onclick="goToPage(${currentPage + 1})">→</button>`);
  }

  paginationEl.innerHTML = buttons.join('');
}

function goToPage(page) {
  evState.page = page;
  renderEvents();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ════════════════════════════════════════
   MOBILE FILTER MODAL MANAGEMENT
   ════════════════════════════════════════ */
function openFilterModal() {
  filterModalOverlay?.classList.add('open');
  filterModal?.classList.add('open');
  document.body.style.overflow = 'hidden';
  syncModalFilters();
}

function closeFilterModal() {
  filterModalOverlay?.classList.remove('open');
  filterModal?.classList.remove('open');
  document.body.style.overflow = '';
}

function syncModalFilters() {
  /* Sync modal filter chips with current state */
  document.querySelectorAll('#modal-cat-filter-group .filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === evState.cat));
  document.querySelectorAll('#modal-mode-filter-group .filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === evState.mode));
  document.querySelectorAll('#modal-fee-filter-group .filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === evState.fee));
}

/* Modal button events */
openFiltersBtn?.addEventListener('click', openFilterModal);
closeFiltersBtn?.addEventListener('click', closeFilterModal);
filterModalOverlay?.addEventListener('click', closeFilterModal);

applyFiltersBtn?.addEventListener('click', () => {
  closeFilterModal();
  evState.page = 1;
  renderEvents();
});

clearFiltersModalBtn?.addEventListener('click', doClearAllFilters);

/* ════════════════════════════════════════
   FILTER HANDLERS
   ════════════════════════════════════════ */
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    const val  = btn.dataset.value;
    evState[type] = val;
    evState.page  = 1;
    
    /* Sync desktop sidebar filters */
    document.querySelectorAll(`#${type}-filter-group .filter-chip`).forEach(c => {
      c.classList.toggle('filter-chip--active', c.dataset.value === val);
    });
    
    /* Sync modal filters */
    document.querySelectorAll(`#modal-${type}-filter-group .filter-chip`).forEach(c => {
      c.classList.toggle('filter-chip--active', c.dataset.value === val);
    });
    
    if (type === 'cat') syncCatPills(val);
    renderEvents();
  });
});

document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const cat = pill.dataset.cat;
    evState.cat  = cat;
    evState.page = 1;
    document.querySelectorAll('.cat-pill').forEach(p =>
      p.classList.toggle('cat-pill--active', p.dataset.cat === cat));
    document.querySelectorAll('#cat-filter-group .filter-chip').forEach(c =>
      c.classList.toggle('filter-chip--active', c.dataset.value === cat));
    renderEvents();
  });
});

function syncCatPills(cat) {
  document.querySelectorAll('.cat-pill').forEach(p =>
    p.classList.toggle('cat-pill--active', p.dataset.cat === cat));
}

/* ── Search ── */
const debouncedSearch = typeof debounce === 'function'
  ? debounce((val) => { evState.search = val; evState.page = 1; renderEvents(); }, 400)
  : (val) => { evState.search = val; evState.page = 1; renderEvents(); };

eventsSearchInput?.addEventListener('input', e => debouncedSearch(e.target.value));

/* ── Sort ── */
eventsSortSelect?.addEventListener('change', e => {
  evState.sort = e.target.value;
  evState.page = 1;
  renderEvents();
});

/* ── Trending tag click ── */
document.querySelectorAll('.trending-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const val = '#' + tag.dataset.tag;
    if (eventsSearchInput) eventsSearchInput.value = val;
    evState.search = val;
    evState.page   = 1;
    
    /* Close modal if open */
    if (filterModal?.classList.contains('open')) {
      closeFilterModal();
    }
    
    renderEvents();
  });
});

/* ── Clear filters ── */
function doClearAllFilters() {
  evState.cat    = 'All';
  evState.mode   = 'All';
  evState.fee    = 'All';
  evState.search = '';
  evState.sort   = 'newest';
  evState.page   = 1;

  if (eventsSearchInput) eventsSearchInput.value = '';
  if (eventsSortSelect)  eventsSortSelect.value  = 'newest';

  /* Sync desktop sidebar */
  document.querySelectorAll('.filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === 'All'));
  document.querySelectorAll('.cat-pill').forEach(p =>
    p.classList.toggle('cat-pill--active', p.dataset.cat === 'All'));

  /* Sync modal */
  syncModalFilters();

  renderEvents();
  showToast('🔄 All filters cleared');
}

clearFiltersBtn?.addEventListener('click', doClearAllFilters);

/* ── URL param (from landing page category links) ── */
(function applyUrlParam() {
  const catParam = new URLSearchParams(window.location.search).get('cat');
  if (catParam && catParam !== 'All') {
    evState.cat = catParam;
    document.querySelectorAll('#cat-filter-group .filter-chip').forEach(c =>
      c.classList.toggle('filter-chip--active', c.dataset.value === catParam));
    syncCatPills(catParam);
  }
})();

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', renderEvents);
