/* ============================================================
   FESTNEST FRONTEND — assets/js/event-detail-live.js
   Replace old event-detail.js — fetches real event from API
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  const detailPage = document.getElementById('detailPage');
  if (!detailPage) return;

  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    showNotFound(detailPage);
    return;
  }

  /* Loading state */
  detailPage.innerHTML = `
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

  try {
    const event = await FN_EVENTS_API.getEvent(id);
    console.log('[Event Detail] Event loaded:', { id: event._id, title: event.title, organizer: event.organizer });
    document.title = `${event.title} — FestNest`;
    detailPage.innerHTML = buildDetailHTML(event);
    wireDetailButtons(event);
  } catch (err) {
    console.error('[Event Detail] Error loading event:', err);
    if (err.statusCode === 404) {
      showNotFound(detailPage);
    } else {
      detailPage.innerHTML = `
        <div style="padding:120px 40px;text-align:center;">
          <div style="font-size:60px;margin-bottom:16px;">⚠️</div>
          <h2 style="margin-bottom:10px;">Failed to load event</h2>
          <p style="color:var(--text-2);margin-bottom:24px;">${err.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
        </div>`;
    }
  }
});

function showNotFound(container) {
  container.innerHTML = `
    <div style="padding:120px 40px;text-align:center;">
      <div style="font-size:72px;margin-bottom:20px;">😕</div>
      <h2 style="font-size:28px;font-weight:700;margin-bottom:10px;">Event not found</h2>
      <p style="color:var(--text-2);margin-bottom:28px;">This event may have expired or the link is incorrect.</p>
      <a class="btn btn-primary btn-lg" href="events.html">Browse All Events</a>
    </div>`;
}

/* ════════════════════════════════════════
   BUILD HTML FROM API DATA
   ════════════════════════════════════════ */
function buildDetailHTML(ev) {
  const saved    = FN_AUTH.isLoggedIn()
    ? (FN_AUTH.getUser()?.savedEvents?.includes(ev._id) || fnIsSaved(ev._id))
    : fnIsSaved(ev._id);

  const modeIcon  = { Online: '🌐', Offline: '🏢', Hybrid: '🔀' }[ev.mode] || '🏢';
  const tagClass  = { mega: 'ev-tag--mega', trending: 'ev-tag--trending', new: 'ev-tag--new' }[ev.badge] || 'ev-tag--new';
  const tagLabel  = { mega: 'Mega Event', trending: 'Trending', new: 'New' }[ev.badge] || 'New';

  const startDate = ev.startDate
    ? new Date(ev.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : 'TBA';
  const endDate   = ev.endDate
    ? new Date(ev.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : null;
  const dateStr   = endDate ? `${startDate} – ${endDate}` : startDate;

  const locationStr = ev.mode === 'Online'
    ? 'Online'
    : [ev.location?.venue, ev.location?.city, ev.location?.state].filter(Boolean).join(', ') || 'India';

  const tagsHTML  = (ev.tags || []).map(t =>
    `<span class="detail-event-tag">${t}</span>`).join('');

  const bannerBg = ev.posterUrl
    ? `<img src="${ev.posterUrl}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover;">`
    : `<div style="font-size:90px;position:relative;z-index:2;">${getCatEmoji(ev.category)}</div>`;

  const prizeRows = [
    { rank: '🥇 1st Place', amount: ev.prizes?.first  || '—', bg: 'var(--pastel-yellow)', color: '#E65100' },
    { rank: '🥈 2nd Place', amount: ev.prizes?.second || '—', bg: '#f5f5f5',              color: '#546E7A' },
    { rank: '🥉 3rd Place', amount: ev.prizes?.third  || '—', bg: 'var(--pastel-orange)', color: '#BF6A02' },
  ].map(p => `
    <div class="prize-box" style="background:${p.bg};">
      <div class="prize-rank">${p.rank}</div>
      <div class="prize-amount" style="color:${p.color};">${p.amount}</div>
    </div>`).join('');

  return `
    <div class="detail-hero-banner" style="background:${ev.posterUrl ? '#000' : getGrad(ev.category)};">
      ${bannerBg}
      <div class="detail-hero-overlay"></div>
      <a class="detail-back-btn" href="events.html">← Back to Events</a>
      <div class="detail-hero-meta">
        <div class="detail-hero-tags">
          <span class="ev-tag ${tagClass}">${tagLabel}</span>
          <span class="ev-tag" style="background:rgba(255,255,255,0.2);color:#fff;">${ev.category}</span>
          <span class="ev-tag" style="background:rgba(255,255,255,0.2);color:#fff;">${modeIcon} ${ev.mode}</span>
        </div>
        <h1 class="detail-hero-title">${ev.title}</h1>
        <div class="detail-hero-college">🏛 ${ev.college}</div>
      </div>
    </div>

    <div class="detail-content">
      <div class="detail-main">

        <div class="detail-section">
          <div class="detail-section-head">
            <span class="detail-section-icon" style="background:var(--pastel-blue);">📋</span>
            About This Event
          </div>
          <p class="detail-desc-text">${ev.description.replace(/\n/g, '<br>')}</p>
          ${tagsHTML ? `<div class="detail-event-tags" style="margin-top:16px;">${tagsHTML}</div>` : ''}
        </div>

        <div class="detail-section">
          <div class="detail-section-head">
            <span class="detail-section-icon" style="background:var(--pastel-teal);">📌</span>
            Event Details
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${buildInfoBox('📅 Date', dateStr)}
            ${buildInfoBox('📍 Location', locationStr)}
            ${buildInfoBox(`${modeIcon} Mode`, ev.mode)}
            ${buildInfoBox('💰 Fee', ev.registrationFee || 'Free')}
            ${buildInfoBox('🏆 Prize Pool', ev.prizes?.pool || ev.prizes?.first || 'TBD')}
            ${buildInfoBox('🏛 Organizer', ev.college)}
          </div>
        </div>

        ${ev.eligibility || ev.rules ? `
        <div class="detail-section">
          <div class="detail-section-head">
            <span class="detail-section-icon" style="background:var(--pastel-pink);">📜</span>
            Rules &amp; Eligibility
          </div>
          ${ev.eligibility ? `<h4 style="font-size:13px;color:var(--text-1);margin-bottom:8px;">Eligibility</h4><pre class="detail-rules">${ev.eligibility}</pre>` : ''}
          ${ev.rules ? `<h4 style="font-size:13px;color:var(--text-1);margin:16px 0 8px;">Rules</h4><pre class="detail-rules">${ev.rules}</pre>` : ''}
        </div>` : ''}

        ${ev.prizes?.first ? `
        <div class="detail-section">
          <div class="detail-section-head">
            <span class="detail-section-icon" style="background:var(--pastel-yellow);">🏆</span>
            Prize Breakdown
          </div>
          <div class="prize-grid">${prizeRows}</div>
          ${ev.prizes?.other ? `<p style="font-size:13px;color:var(--text-2);margin-top:12px;">🎁 ${ev.prizes.other}</p>` : ''}
        </div>` : ''}

        <div class="detail-section">
          <div class="detail-section-head">
            <span class="detail-section-icon" style="background:var(--pastel-green);">📞</span>
            Contact &amp; POC
          </div>
          <div class="contact-grid">
            ${buildInfoBox('👤 POC Name', ev.contact?.name || '—')}
            ${buildInfoBox('📱 Phone', ev.contact?.phone || '—')}
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
                <a href="${ev.contact.website}" target="_blank" rel="noopener" style="color:var(--color-primary);">${ev.contact.website}</a>
              </div>
            </div>` : ''}
          </div>
        </div>

      </div>

      <aside>
        <div class="detail-sidebar-card">
          <div class="detail-reg-price">
            <div class="detail-price-label">Registration Fee</div>
            <div class="detail-price-val ${ev.registrationFee === 'Free' ? 'detail-price-val--free' : ''}">${ev.registrationFee || 'Free'}</div>
          </div>

          <button class="btn-register-main" id="detail-register-btn">Register Now →</button>

          <button class="btn-save-detail ${saved ? 'btn-save-detail--saved' : ''}" id="detail-save-btn">
            ${saved ? '🔖 Saved' : '🤍 Save Event'}
          </button>

          <div class="detail-quick-info">
            <div class="quick-info-row"><span class="quick-info-icon">📅</span><span class="quick-info-text">Date</span><span class="quick-info-val">${dateStr}</span></div>
            <div class="quick-info-row"><span class="quick-info-icon">📍</span><span class="quick-info-text">Location</span><span class="quick-info-val">${ev.location?.city || 'India'}</span></div>
            <div class="quick-info-row"><span class="quick-info-icon">${modeIcon}</span><span class="quick-info-text">Mode</span><span class="quick-info-val">${ev.mode}</span></div>
            <div class="quick-info-row"><span class="quick-info-icon">🏆</span><span class="quick-info-text">Prize Pool</span><span class="quick-info-val">${ev.prizes?.pool || '—'}</span></div>
            <div class="quick-info-row"><span class="quick-info-icon">👁</span><span class="quick-info-text">Views</span><span class="quick-info-val">${(ev.views || 0).toLocaleString()}</span></div>
          </div>

          ${ev.brochureUrl ? `<a class="btn-download-brochure" href="${ev.brochureUrl}" target="_blank" rel="noopener">📥 Download Brochure PDF</a>` : ''}

          <div class="detail-share-row">
            <button class="btn-share-action" id="detail-share-btn">🔗 Share</button>
            <button class="btn-share-action" id="detail-calendar-btn">📅 Calendar</button>
          </div>
        </div>

        <div class="detail-sidebar-card" style="background:var(--pastel-purple);border-color:rgba(90,75,255,0.15);">
          <div style="font-size:20px;margin-bottom:8px;">✨</div>
          <div style="font-size:14px;font-weight:800;margin-bottom:6px;">Discover More Events</div>
          <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:14px;">2,400+ campus events from 850+ colleges across India.</p>
          <a class="btn btn-primary w-full" href="events.html" style="display:flex;justify-content:center;">Browse All Events →</a>
        </div>
      </aside>
    </div>`;
}

function buildInfoBox(label, value) {
  return `<div class="contact-box"><div class="contact-box-label">${label}</div><div class="contact-box-val">${value}</div></div>`;
}

function getGrad(cat) {
  const m = { Hackathon:'linear-gradient(135deg,#667eea,#764ba2)', Cultural:'linear-gradient(135deg,#f093fb,#f5576c)', Technical:'linear-gradient(135deg,#4facfe,#00f2fe)', Sports:'linear-gradient(135deg,#fa709a,#fee140)', Workshop:'linear-gradient(135deg,#a18cd1,#fbc2eb)', Management:'linear-gradient(135deg,#f7971e,#ffd200)', Literary:'linear-gradient(135deg,#43e97b,#38f9d7)' };
  return m[cat] || 'linear-gradient(135deg,#667eea,#764ba2)';
}

function getCatEmoji(cat) {
  const m = { Hackathon:'💻', Cultural:'🎭', Technical:'🔬', Sports:'⚽', Workshop:'🧠', Management:'📊', Literary:'📚' };
  return m[cat] || '🎉';
}

function wireDetailButtons(ev) {
  const registerBtn = document.getElementById('detail-register-btn');
  const saveBtn     = document.getElementById('detail-save-btn');
  const shareBtn    = document.getElementById('detail-share-btn');
  const calBtn      = document.getElementById('detail-calendar-btn');
  const eid         = ev._id || ev.id;

  registerBtn?.addEventListener('click', () => {
    if (!FN_AUTH.isLoggedIn()) {
      showToast('Please log in to register.', 'info');
      openAuthModal?.('signup');
      return;
    }
    if (ev.registrationLink) {
      window.open(ev.registrationLink, '_blank', 'noopener');
    } else {
      showToast('🎉 Registration link coming soon!', 'info');
    }
  });

  saveBtn?.addEventListener('click', async () => {
    if (!FN_AUTH.isLoggedIn()) {
      showToast('Please log in to save events.', 'info');
      openAuthModal?.('signup');
      return;
    }
    try {
      const res = await FN_EVENTS_API.toggleSave(eid);
      saveBtn.textContent = res.saved ? '🔖 Saved' : '🤍 Save Event';
      saveBtn.classList.toggle('btn-save-detail--saved', res.saved);
      showToast(res.saved ? '🔖 Event saved!' : '💔 Removed from saved', res.saved ? 'success' : '');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  shareBtn?.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: ev.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast('🔗 Link copied to clipboard!', 'success');
    }
  });

  calBtn?.addEventListener('click', () => {
    showToast('📅 Added to your calendar!', 'success');
  });
}
