/* ============================================================
   FESTNEST — EVENTS PAGE  |  assets/js/pages/events.js

   FIXES APPLIED:
   1. Category filter NOW works — passes category to backend API
   2. Mode and fee filters pass correctly to backend
   3. Sort passes correct backend sort key (newest/popular/etc.)
   4. URL param ?cat= reads on load and pre-selects filter
   5. Pagination renders correctly
   6. Skeleton loading on every fetch
   7. Error state with retry button
   ============================================================ */
'use strict';

/* ── State ── */
const evSt = {
  cat:    'All',
  mode:   'All',
  fee:    'All',
  search: '',
  sort:   'newest',
  page:   1,
  limit:  12,
};

let evLoading = false;

/* ── DOM refs ── */
const eventsGrid        = document.getElementById('eventsGrid');
const eventsResultCount = document.getElementById('eventsResultCount');
const eventsSearchInput = document.getElementById('eventsSearchInput');
const eventsSortSelect  = document.getElementById('eventsSortSelect');
const clearFiltersBtn   = document.getElementById('clearFiltersBtn');
const paginationEl      = document.querySelector('.pagination');

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
  if (evLoading) return;
  evLoading = true;
  showEvSkeleton();

  try {
    /* Build API params — backend accepts all of these as query strings */
    const params = {
      page:   evSt.page,
      limit:  evSt.limit,
      sort:   evSt.sort,
    };
    /* Only add filter if not "All" */
    if (evSt.cat    !== 'All') params.category = evSt.cat;
    if (evSt.mode   !== 'All') params.mode     = evSt.mode;
    if (evSt.fee    === 'Free') params.fee = 'Free';
    if (evSt.fee    === 'Paid') params.fee = 'Paid';
    if (evSt.search.trim())    params.search   = evSt.search.trim();

    const data = await FN_EVENTS_API.getEvents(params);

    /* Update count label */
    if (eventsResultCount) {
      eventsResultCount.textContent =
        'Showing ' + data.count + ' of ' + data.total + ' event' + (data.total !== 1 ? 's' : '');
    }

    /* Render cards */
    renderEventsGrid('#eventsGrid', data.events);

    /* Pagination */
    renderEvPagination(data.page, data.pages, data.total);

  } catch (err) {
    if (eventsGrid) {
      eventsGrid.innerHTML = `
        <div class="events-empty" style="grid-column:1/-1;">
          <div class="events-empty-icon">⚠️</div>
          <div class="events-empty-title">Failed to load events</div>
          <p style="color:var(--text-2);font-size:14px;margin-top:8px;">${err.message}</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="renderEvents()">
            Try Again
          </button>
        </div>`;
    }
    if (eventsResultCount) eventsResultCount.textContent = '';
    console.error('[FestNest] Events load error:', err);
  } finally {
    evLoading = false;
  }
}

function showEvSkeleton() {
  if (!eventsGrid) return;
  eventsGrid.innerHTML = Array(evSt.limit < 6 ? evSt.limit : 6).fill(0).map(() => `
    <div class="ev-card" style="pointer-events:none;">
      <div class="skeleton" style="height:180px;border-radius:0;"></div>
      <div class="ev-card-body">
        <div class="skeleton" style="height:18px;width:75%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:13px;width:50%;margin-bottom:12px;"></div>
        <div class="skeleton" style="height:12px;margin-bottom:6px;"></div>
        <div class="skeleton" style="height:12px;width:60%;"></div>
      </div>
    </div>`).join('');
}

/* ════════════════════════════════════════
   PAGINATION
   ════════════════════════════════════════ */
function renderEvPagination(cur, total, totalItems) {
  if (!paginationEl) return;
  if (!total || total <= 1) { paginationEl.style.display = 'none'; return; }

  paginationEl.style.display = 'flex';
  const btns = [];
  if (cur > 1) btns.push(`<button class="page-btn" onclick="goToPage(${cur - 1})">←</button>`);
  const start = Math.max(1, cur - 2), end = Math.min(total, cur + 2);
  for (let i = start; i <= end; i++) {
    btns.push(`<button class="page-btn ${i === cur ? 'page-btn--active' : ''}" onclick="goToPage(${i})">${i}</button>`);
  }
  if (cur < total) btns.push(`<button class="page-btn" onclick="goToPage(${cur + 1})">→</button>`);
  paginationEl.innerHTML = btns.join('');
}

function goToPage(pg) {
  evSt.page = pg;
  renderEvents();
  scrollTop();
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
    c.classList.toggle('filter-chip--active', c.dataset.value === evSt.cat));
  document.querySelectorAll('#modal-mode-filter-group .filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === evSt.mode));
  document.querySelectorAll('#modal-fee-filter-group .filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === evSt.fee));
}

/* Modal button events */
openFiltersBtn?.addEventListener('click', openFilterModal);
closeFiltersBtn?.addEventListener('click', closeFilterModal);
filterModalOverlay?.addEventListener('click', closeFilterModal);

applyFiltersBtn?.addEventListener('click', () => {
  closeFilterModal();
  evSt.page = 1;
  renderEvents();
});

/* ════════════════════════════════════════
   FILTER CHIPS  (sidebar)
   ════════════════════════════════════════ */
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.filter;   /* cat | mode | fee */
    const val  = btn.dataset.value;
    evSt[type] = val;
    evSt.page  = 1;

    /* Highlight active chip in sidebar */
    const groupId = type + '-filter-group';
    document.querySelectorAll('#' + groupId + ' .filter-chip').forEach(c => {
      c.classList.toggle('filter-chip--active', c.dataset.value === val);
    });

    /* Sync modal filters */
    document.querySelectorAll('#modal-' + type + '-filter-group .filter-chip').forEach(c => {
      c.classList.toggle('filter-chip--active', c.dataset.value === val);
    });

    /* Sync category pill tabs when sidebar changes */
    if (type === 'cat') syncCatPills(val);

    renderEvents();
  });
});

/* ════════════════════════════════════════
   CAT PILL TABS
   ════════════════════════════════════════ */
document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const cat  = pill.dataset.cat;
    evSt.cat   = cat;
    evSt.page  = 1;

    /* Highlight pill */
    document.querySelectorAll('.cat-pill').forEach(p =>
      p.classList.toggle('cat-pill--active', p.dataset.cat === cat)
    );
    /* Sync sidebar chip */
    document.querySelectorAll('#cat-filter-group .filter-chip').forEach(c =>
      c.classList.toggle('filter-chip--active', c.dataset.value === cat)
    );

    renderEvents();
  });
});

function syncCatPills(cat) {
  document.querySelectorAll('.cat-pill').forEach(p =>
    p.classList.toggle('cat-pill--active', p.dataset.cat === cat)
  );
}

/* ════════════════════════════════════════
   SEARCH
   ════════════════════════════════════════ */
const debouncedSearch = debounce(val => {
  evSt.search = val;
  evSt.page   = 1;
  renderEvents();
}, 380);

eventsSearchInput?.addEventListener('input', e => debouncedSearch(e.target.value));

/* ════════════════════════════════════════
   SORT
   ════════════════════════════════════════ */
eventsSortSelect?.addEventListener('change', e => {
  evSt.sort  = e.target.value;
  evSt.page  = 1;
  renderEvents();
});

/* ════════════════════════════════════════
   TRENDING TAG CHIPS
   ════════════════════════════════════════ */
document.querySelectorAll('.trending-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const val = '#' + tag.dataset.tag;
    if (eventsSearchInput) eventsSearchInput.value = val;
    evSt.search = val;
    evSt.page   = 1;
    
    /* Close modal if open */
    if (filterModal?.classList.contains('open')) {
      closeFilterModal();
    }
    
    renderEvents();
    showToast('Showing results for ' + val, 'info');
  });
});

/* ════════════════════════════════════════
   CLEAR FILTERS
   ════════════════════════════════════════ */
function doClearAllFilters() {
  evSt.cat    = 'All';
  evSt.mode   = 'All';
  evSt.fee    = 'All';
  evSt.search = '';
  evSt.sort   = 'newest';
  evSt.page   = 1;

  if (eventsSearchInput) eventsSearchInput.value = '';
  if (eventsSortSelect)  eventsSortSelect.value  = 'newest';

  /* Reset sidebar chips */
  document.querySelectorAll('.filter-chip').forEach(c =>
    c.classList.toggle('filter-chip--active', c.dataset.value === 'All')
  );
  /* Reset pills */
  document.querySelectorAll('.cat-pill').forEach(p =>
    p.classList.toggle('cat-pill--active', p.dataset.cat === 'All')
  );
  
  /* Sync modal */
  syncModalFilters();

  renderEvents();
  showToast('🔄 All filters cleared');
}

clearFiltersBtn?.addEventListener('click', doClearAllFilters);
clearFiltersModalBtn?.addEventListener('click', doClearAllFilters);

/* ════════════════════════════════════════
   URL PARAM  ?cat=Hackathon
   (from landing page category links)
   ════════════════════════════════════════ */
(function applyUrlParam() {
  const catParam = getUrlParam('cat');
  if (catParam && catParam !== 'All') {
    evSt.cat = catParam;
    document.querySelectorAll('#cat-filter-group .filter-chip').forEach(c =>
      c.classList.toggle('filter-chip--active', c.dataset.value === catParam)
    );
    syncCatPills(catParam);
  }
}());

/* ── Init ── */
document.addEventListener('DOMContentLoaded', renderEvents);
