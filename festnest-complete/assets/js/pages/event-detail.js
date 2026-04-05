/* ============================================================
   FESTNEST — assets/js/pages/event-detail.js
   (also works as event-detail-live.js — same file)

   WHAT'S NEW vs previous version:
   ────────────────────────────────────────────────────────
   1. EXPANDABLE DESCRIPTION
      - First render shows only 3 lines (via CSS clamp)
      - "View More ↓" button toggles full text
      - Smooth max-height CSS transition (no layout jump)
      - Button label swaps between "View More ↓" / "View Less ↑"

   2. HASHTAGS
      - ev.tags array rendered as #hashtag pills below description
      - Styled with existing .detail-event-tag CSS class
      - Shown even when description is collapsed

   3. ALL EXISTING FUNCTIONALITY PRESERVED
      - Banner, hero, info grid, prize breakdown, rules
      - Save / Register / Share / Calendar buttons
      - Sidebar quick-info, brochure download
   ============================================================ */
'use strict';

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async function () {
  const page = document.getElementById('detailPage');
  if (!page) return;

  const id = (typeof getUrlParam === 'function')
    ? getUrlParam('id')
    : new URLSearchParams(window.location.search).get('id');

  if (!id) { page.innerHTML = notFound(); return; }

  page.innerHTML = loadingHTML();

  try {
    const ev = await FN_EVENTS_API.getEvent(id);
    
    // Safety check: ensure event object exists
    if (!ev) {
      page.innerHTML = notFound();
      return;
    }
    
    document.title = `${ev.title} — FestNest`;
    page.innerHTML = buildDetail(ev);
    wireButtons(ev);
    initExpandDescription();   // NEW: wire expand/collapse
  } catch (err) {
    page.innerHTML = err.statusCode === 404
      ? notFound()
      : `<div style="padding:120px 40px;text-align:center;">
           <div style="font-size:60px;margin-bottom:16px;">⚠️</div>
           <h2 style="margin-bottom:10px;">Failed to load event</h2>
           <p style="color:var(--text-2);margin-bottom:24px;">${err.message}</p>
           <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
         </div>`;
  }
});

/* ── Helpers ─────────────────────────────────────────────── */
function notFound() {
  return `
    <div style="padding:120px 40px;text-align:center;">
      <div style="font-size:72px;margin-bottom:20px;">😕</div>
      <h2 style="font-size:28px;font-weight:700;margin-bottom:10px;">Event not found</h2>
      <p style="color:var(--text-2);margin-bottom:28px;">
        This event may have expired or the link is incorrect.
      </p>
      <a class="btn btn-primary btn-lg" href="events.html">Browse All Events</a>
    </div>`;
}

function loadingHTML() {
  return `
    <div style="padding:var(--nav-height) 0 0;">
      <div class="skeleton" style="height:320px;border-radius:0;"></div>
      <div style="padding:28px 40px;display:grid;grid-template-columns:1fr 340px;gap:24px;">
        <div>
          <div class="skeleton" style="height:28px;width:60%;margin-bottom:16px;border-radius:8px;"></div>
          <div class="skeleton" style="height:16px;margin-bottom:8px;border-radius:8px;"></div>
          <div class="skeleton" style="height:16px;width:80%;border-radius:8px;"></div>
        </div>
        <div class="skeleton" style="height:340px;border-radius:20px;"></div>
      </div>
    </div>`;
}

function infoBox(label, value) {
  return `
    <div class="contact-box">
      <div class="contact-box-label">${label}</div>
      <div class="contact-box-val">${value}</div>
    </div>`;
}

function prizeBox(rank, amount, bg, color) {
  return `
    <div class="prize-box" style="background:${bg};">
      <div class="prize-rank">${rank}</div>
      <div class="prize-amount" style="color:${color};">${amount}</div>
    </div>`;
}

/* ════════════════════════════════════════════════════════════
   BUILD DETAIL HTML
   ════════════════════════════════════════════════════════════ */
function buildDetail(ev) {
  const eid  = ev._id || ev.id;
  const saved = FN_AUTH.isLoggedIn()
    ? (FN_AUTH.getUser()?.savedEvents?.includes(eid) || fnIsSaved(eid))
    : fnIsSaved(eid);

  const modeIcon = { Online:'🌐', Offline:'🏢', Hybrid:'🔀' }[ev.mode] || '🏢';
  const tagCls   = { mega:'ev-tag--mega', trending:'ev-tag--trending', new:'ev-tag--new' }[ev.badge] || 'ev-tag--new';
  const tagLabel = { mega:'Mega Event', trending:'Trending', new:'New' }[ev.badge] || 'New';

  const dateStr = ev.startDate
    ? new Date(ev.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : 'TBA';
  const endStr = ev.endDate
    ? ' – ' + new Date(ev.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : '';

  const loc = ev.mode === 'Online'
    ? 'Online'
    : ([ev.location?.venue, ev.location?.city, ev.location?.state].filter(Boolean).join(', ') || 'India');

  const prize = ev.prizes?.pool || ev.prizes?.first || 'TBD';

  const banner = ev.posterUrl
    ? `<img src="${ev.posterUrl}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div style="font-size:90px;position:relative;z-index:2;">${getCategoryEmoji ? getCategoryEmoji(ev.category) : '🎉'}</div>`;
  const bannerBg = ev.posterUrl ? '#000' : (getCategoryGradient ? getCategoryGradient(ev.category) : 'var(--grad)');

  /* ── Description with expand/collapse ─────────────────────
     #desc-text: the paragraph itself — CSS clamps to 3 lines
     #desc-toggle: the "View More ↓" button
     The max-height transition is injected inline so we don't
     need any new CSS class in your stylesheet.
  ─────────────────────────────────────────────────────────── */
  const descHtml = `
    <div id="desc-wrapper" style="position:relative;">
      <p id="desc-text"
         style="font-size:15px;color:var(--text-2);line-height:1.8;
                max-height:4.8em;overflow:hidden;
                transition:max-height .35s ease;">
        ${ev.description ? ev.description.replace(/\n/g, '<br>') : ''}
      </p>
    </div>`;

  /* Hashtags — shown outside the collapsible block so they're
     always visible even when description is collapsed.         */
  const hashtagsHtml = (ev.tags && ev.tags.length)
    ? `<div class="detail-event-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">
         ${ev.tags.map(t =>
             `<span class="detail-event-tag">
                ${t.startsWith('#') ? t : '#' + t}
              </span>`
           ).join('')}
       </div>`
    : '';

  /* "View More" toggle button — only injected if description
     is long enough to need it (> ~200 chars as a rough proxy). */
  const needsToggle = ev.description && ev.description.length > 200;
  const toggleBtn = needsToggle
    ? `<button id="desc-toggle"
               onclick="toggleExpandDescription()"
               style="margin-top:10px;background:none;border:none;
                      color:var(--color-primary);font-size:13px;font-weight:700;
                      cursor:pointer;padding:0;font-family:inherit;">
         View More ↓
       </button>`
    : '';

  return `
  <div class="detail-hero-banner" style="background:${bannerBg};">
    ${banner}
    <div class="detail-hero-overlay"></div>
    <a class="detail-back-btn" href="events.html">← Back to Events</a>
    <div class="detail-hero-meta">
      <div class="detail-hero-tags">
        <span class="ev-tag ${tagCls}">${tagLabel}</span>
        <span class="ev-tag" style="background:rgba(255,255,255,.2);color:#fff;">${ev.category}</span>
        <span class="ev-tag" style="background:rgba(255,255,255,.2);color:#fff;">${modeIcon} ${ev.mode}</span>
      </div>
      <h1 class="detail-hero-title">${ev.title}</h1>
      <div class="detail-hero-college">🏛 ${ev.college}</div>
    </div>
  </div>

  <div class="detail-content">
    <div class="detail-main">

      <!-- ABOUT THIS EVENT (with expand/collapse) -->
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-icon" style="background:var(--pastel-blue);">📋</span>
          About This Event
        </div>

        ${descHtml}
        ${toggleBtn}
        ${hashtagsHtml}
      </div>

      <!-- EVENT DETAILS -->
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-icon" style="background:var(--pastel-teal);">📌</span>
          Event Details
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          ${infoBox('📅 Date',    dateStr + endStr)}
          ${infoBox('📍 Location', loc)}
          ${infoBox(modeIcon + ' Mode', ev.mode)}
          ${infoBox('💰 Fee',     ev.registrationFee || 'Free')}
          ${infoBox('🏆 Prize Pool', prize)}
          ${infoBox('🏛 Organizer',  ev.college)}
        </div>
      </div>

      <!-- RULES & ELIGIBILITY -->
      ${ev.eligibility || ev.rules ? `
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-icon" style="background:var(--pastel-pink);">📜</span>
          Rules &amp; Eligibility
        </div>
        ${ev.eligibility ? `<h4 style="font-size:13px;margin-bottom:8px;">Eligibility</h4><pre class="detail-rules">${ev.eligibility}</pre>` : ''}
        ${ev.rules       ? `<h4 style="font-size:13px;margin:16px 0 8px;">Rules</h4><pre class="detail-rules">${ev.rules}</pre>`           : ''}
      </div>` : ''}

      <!-- PRIZE BREAKDOWN -->
      ${ev.prizes?.first ? `
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-icon" style="background:var(--pastel-yellow);">🏆</span>
          Prize Breakdown
        </div>
        <div class="prize-grid">
          ${prizeBox('🥇 1st', ev.prizes.first,          'var(--pastel-yellow)', '#E65100')}
          ${prizeBox('🥈 2nd', ev.prizes.second || '—',  '#f5f5f5',             '#546E7A')}
          ${prizeBox('🥉 3rd', ev.prizes.third  || '—',  'var(--pastel-orange)', '#BF6A02')}
        </div>
        ${ev.prizes.other ? `<p style="font-size:13px;color:var(--text-2);margin-top:12px;">🎁 ${ev.prizes.other}</p>` : ''}
      </div>` : ''}

      <!-- CONTACT -->
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-icon" style="background:var(--pastel-green);">📞</span>
          Contact &amp; POC
        </div>
        <div class="contact-grid">
          ${infoBox('👤 POC Name', ev.contact?.name  || '—')}
          ${infoBox('📱 Phone',    ev.contact?.phone || '—')}
          <div class="contact-box" style="grid-column:1/-1;">
            <div class="contact-box-label">✉️ Email</div>
            <div class="contact-box-val">
              ${ev.contact?.email
                ? `<a href="mailto:${ev.contact.email}" style="color:var(--color-primary);">${ev.contact.email}</a>`
                : '—'}
            </div>
          </div>
          ${ev.contact?.website ? `
          <div class="contact-box" style="grid-column:1/-1;">
            <div class="contact-box-label">🌐 Website</div>
            <div class="contact-box-val">
              <a href="${ev.contact.website}" target="_blank" rel="noopener"
                 style="color:var(--color-primary);">${ev.contact.website}</a>
            </div>
          </div>` : ''}
        </div>
      </div>

    </div><!-- /detail-main -->

    <aside>
      <div class="detail-sidebar-card">
        <div class="detail-reg-price">
          <div class="detail-price-label">Registration Fee</div>
          <div class="detail-price-val ${ev.registrationFee === 'Free' ? 'detail-price-val--free' : ''}">
            ${ev.registrationFee || 'Free'}
          </div>
        </div>

        <button class="btn-register-main" id="detail-register-btn">Register Now →</button>

        <button class="btn-save-detail ${saved ? 'btn-save-detail--saved' : ''}" id="detail-save-btn">
          ${saved ? '🔖 Saved' : '🤍 Save Event'}
        </button>

        <div class="detail-quick-info">
          <div class="quick-info-row"><span class="quick-info-icon">📅</span><span class="quick-info-text">Date</span><span class="quick-info-val">${dateStr + endStr}</span></div>
          <div class="quick-info-row"><span class="quick-info-icon">📍</span><span class="quick-info-text">Location</span><span class="quick-info-val">${ev.location?.city || 'India'}</span></div>
          <div class="quick-info-row"><span class="quick-info-icon">${modeIcon}</span><span class="quick-info-text">Mode</span><span class="quick-info-val">${ev.mode}</span></div>
          <div class="quick-info-row"><span class="quick-info-icon">🏆</span><span class="quick-info-text">Prize</span><span class="quick-info-val">${prize}</span></div>
          <div class="quick-info-row"><span class="quick-info-icon">👁</span><span class="quick-info-text">Views</span><span class="quick-info-val">${(ev.views || 0).toLocaleString()}</span></div>
        </div>

        ${ev.brochureUrl ? `
        <a class="btn-download-brochure" href="${ev.brochureUrl}" target="_blank" rel="noopener">
          📥 Download Brochure PDF
        </a>` : ''}

        <div class="detail-share-row">
          <button class="btn-share-action" id="detail-share-btn">🔗 Share</button>
          <button class="btn-share-action" id="detail-cal-btn">📅 Calendar</button>
        </div>
      </div>

      <div class="detail-sidebar-card" style="background:var(--pastel-purple);border-color:rgba(90,75,255,.15);">
        <div style="font-size:20px;margin-bottom:8px;">✨</div>
        <div style="font-size:14px;font-weight:800;margin-bottom:6px;">Discover More Events</div>
        <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:14px;">
          2,400+ campus events from 850+ colleges across India.
        </p>
        <a class="btn btn-primary w-full" href="events.html" style="display:flex;justify-content:center;">
          Browse All Events →
        </a>
      </div>
    </aside>
  </div>`;
}

/* ════════════════════════════════════════════════════════════
   EXPAND / COLLAPSE DESCRIPTION
   Called by the inline onclick on #desc-toggle button.
   Uses max-height transition — smooth, no layout jump.
   ════════════════════════════════════════════════════════════ */
function initExpandDescription() {
  /* Already handled via inline onclick="toggleExpandDescription()" */
  window.toggleExpandDescription = function () {
    const text   = document.getElementById('desc-text');
    const toggle = document.getElementById('desc-toggle');
    if (!text || !toggle) return;

    const isCollapsed = text.style.maxHeight === '4.8em' || text.style.maxHeight === '';

    if (isCollapsed) {
      /* Expand: set max-height to full scrollHeight in px */
      text.style.maxHeight = text.scrollHeight + 'px';
      toggle.textContent   = 'View Less ↑';
    } else {
      /* Collapse back to 3 lines */
      text.style.maxHeight = '4.8em';
      toggle.textContent   = 'View More ↓';
      /* Scroll back to top of section so user sees the start */
      document.getElementById('desc-wrapper')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }
  };
}

/* ════════════════════════════════════════════════════════════
   WIRE BUTTONS (save, register, share, calendar)
   ════════════════════════════════════════════════════════════ */
function wireButtons(ev) {
  const eid = ev._id || ev.id;

  /* Register */
  document.getElementById('detail-register-btn')?.addEventListener('click', () => {
    if (!FN_AUTH.isLoggedIn()) {
      showToast('Please log in to register.', 'info');
      if (typeof openAuthModal === 'function') openAuthModal('signup');
      return;
    }
    if (ev.registrationLink) window.open(ev.registrationLink, '_blank', 'noopener');
    else showToast('🎉 Registration link coming soon!', 'info');
  });

  /* Save / Unsave */
  const saveBtn = document.getElementById('detail-save-btn');
  saveBtn?.addEventListener('click', async () => {
    if (!FN_AUTH.isLoggedIn()) {
      showToast('Please log in to save events.', 'info');
      if (typeof openAuthModal === 'function') openAuthModal('signup');
      return;
    }
    try {
      const res = await FN_EVENTS_API.toggleSave(eid);
      saveBtn.textContent = res.saved ? '🔖 Saved' : '🤍 Save Event';
      saveBtn.classList.toggle('btn-save-detail--saved', res.saved);
      showToast(res.saved ? '🔖 Event saved!' : '💔 Removed from saved',
                res.saved ? 'success' : '');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  /* Share */
  document.getElementById('detail-share-btn')?.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: ev.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast('🔗 Link copied to clipboard!', 'success');
    }
  });

  /* Calendar */
  document.getElementById('detail-cal-btn')?.addEventListener('click', () => {
    showToast('📅 Added to calendar!', 'success');
  });
}
