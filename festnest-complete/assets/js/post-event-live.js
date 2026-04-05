/* ============================================================
   FESTNEST FRONTEND — assets/js/post-event-live.js
   Replace old post-event.js with this.
   Submits event form to real backend with file uploads.
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* ── Auth guard ── */
  if (!FN_AUTH.isLoggedIn()) {
    showToast('Please log in as an organizer to post events.', 'info');
    setTimeout(() => {
      if (typeof openAuthModal === 'function') openAuthModal('signup');
    }, 500);
  }

  /* ── Preview updater ── */
  const titleInput   = document.getElementById('pf-title');
  const collegeInput = document.getElementById('pf-college');
  const pvName       = document.getElementById('pvName');
  const pvCollege    = document.getElementById('pvCollege');
  const pvBanner     = document.getElementById('pvBanner');

  function updatePreview() {
    if (pvName)    pvName.textContent    = titleInput?.value    || 'Event Title';
    if (pvCollege) pvCollege.textContent = '🏛 ' + (collegeInput?.value || 'College Name');
  }

  titleInput?.addEventListener('input',   updatePreview);
  collegeInput?.addEventListener('input', updatePreview);

  /* Cycle banner on category change */
  const GRADIENTS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  ];
  let bannerIdx = 0;
  document.getElementById('pf-category')?.addEventListener('change', () => {
    bannerIdx = (bannerIdx + 1) % GRADIENTS.length;
    if (pvBanner) pvBanner.style.background = GRADIENTS[bannerIdx];
  });

  /* ── Upload zones — show file name on select ── */
  setupFileInput('posterUpload', 'pf-poster-file', '🖼️', 'Poster');
  setupFileInput('brochureUpload', 'pf-brochure-file', '📄', 'Brochure');

  function setupFileInput(zoneId, inputId, icon, label) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    /* Create hidden file input */
    const input = document.createElement('input');
    input.type   = 'file';
    input.id     = inputId;
    input.name   = label.toLowerCase() === 'poster' ? 'poster' : 'brochure';
    input.accept = label === 'Poster' ? 'image/jpeg,image/jpg,image/png,image/webp' : 'application/pdf';
    input.style.display = 'none';
    zone.appendChild(input);

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      zone.querySelector('.upload-zone-title').textContent = `✅ ${file.name}`;
      zone.querySelector('.upload-zone-sub').textContent   = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      zone.style.borderColor = 'var(--color-primary)';
    });
  }

  /* ── Feature button ── */
  document.getElementById('featureEventBtn')?.addEventListener('click', () => {
    showToast('⭐ Feature placement launching soon!', 'info');
  });

  /* ════════════════════════════════════════
     FORM SUBMIT — sends to real API
     ════════════════════════════════════════ */
  const form      = document.getElementById('postEventForm');
  const submitBtn = form?.querySelector('.post-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* ── Validation ── */
    const title   = document.getElementById('pf-title')?.value.trim();
    const college = document.getElementById('pf-college')?.value.trim();
    const pocEmail= document.getElementById('pf-poc-email')?.value.trim();
    const pocPhone= document.getElementById('pf-poc-phone')?.value.trim();
    const pocName = document.getElementById('pf-poc-name')?.value.trim();
    const desc    = document.getElementById('pf-desc')?.value.trim();
    const cat     = document.getElementById('pf-category')?.value;
    const mode    = document.getElementById('pf-mode')?.value;
    const sDate   = document.getElementById('pf-start-date')?.value;

    if (!title)    return showToast('⚠️ Event title is required.', 'error');
    if (!desc)     return showToast('⚠️ Event description is required.', 'error');
    if (!cat)      return showToast('⚠️ Please select a category.', 'error');
    if (!college)  return showToast('⚠️ College / Organization name is required.', 'error');
    if (!sDate)    return showToast('⚠️ Start date is required.', 'error');
    if (!pocName)  return showToast('⚠️ POC name is required.', 'error');
    if (!pocPhone) return showToast('⚠️ POC phone is required.', 'error');
    if (!pocEmail) return showToast('⚠️ POC email is required.', 'error');
    if (!FN_AUTH.isLoggedIn()) {
      showToast('Please log in to post events.', 'error');
      openAuthModal('login');
      return;
    }

    /* ── Build FormData (supports file uploads) ── */
    const formData = new FormData();

    formData.append('title',        title);
    formData.append('description',  desc);
    formData.append('category',     cat);
    formData.append('mode',         mode);
    formData.append('college',      college);
    formData.append('startDate',    sDate);

    const eDate    = document.getElementById('pf-end-date')?.value;
    const regDL    = document.getElementById('pf-reg-deadline')?.value;
    const city     = document.getElementById('pf-city')?.value.trim();
    const venue    = document.getElementById('pf-venue-detail')?.value.trim();
    const prize1   = document.getElementById('pf-prize-1')?.value.trim();
    const prize2   = document.getElementById('pf-prize-2')?.value.trim();
    const prize3   = document.getElementById('pf-prize-3')?.value.trim();
    const prizePool= document.getElementById('pf-prize-pool')?.value.trim();
    const regFee   = document.getElementById('pf-reg-fee')?.value.trim();
    const regLink  = document.getElementById('pf-reg-link')?.value.trim();
    const website  = document.getElementById('pf-website')?.value.trim();
    const elig     = document.getElementById('pf-eligibility')?.value.trim();
    const rules    = document.getElementById('pf-rules')?.value.trim();
    const otherPrize= document.getElementById('pf-other-prizes')?.value.trim();

    if (eDate)     formData.append('endDate',    eDate);
    if (regDL)     formData.append('registrationDeadline', regDL);

    /* Nested fields as JSON strings */
    formData.append('location', JSON.stringify({
      city: city || '', state: '', venue: venue || '', country: 'India',
      onlineLink: mode === 'Online' ? regLink : '',
    }));
    formData.append('prizes', JSON.stringify({
      first: prize1 || '', second: prize2 || '', third: prize3 || '',
      pool: prizePool || '', other: otherPrize || '',
    }));
    formData.append('contact', JSON.stringify({
      name: pocName, phone: pocPhone, email: pocEmail, website: website || '',
    }));

    if (regFee)  formData.append('registrationFee', regFee);
    if (regLink) formData.append('registrationLink', regLink);
    if (elig)    formData.append('eligibility', elig);
    if (rules)   formData.append('rules', rules);

    /* ── Attach files ── */
    const posterFile   = document.getElementById('pf-poster-file');
    const brochureFile = document.getElementById('pf-brochure-file');
    if (posterFile?.files[0])   formData.append('poster',   posterFile.files[0]);
    if (brochureFile?.files[0]) formData.append('brochure', brochureFile.files[0]);

    /* ── Submit ── */
    if (submitBtn) {
      submitBtn.disabled    = true;
      submitBtn.textContent = '⏳ Submitting...';
    }

    try {
      const res = await FN_EVENTS_API.createEvent(formData);

      /* Show success modal */
      const modal = document.getElementById('successModal');
      if (modal) modal.classList.add('modal--open');
      document.body.style.overflow = 'hidden';

      showToast('🎉 ' + (res.message || 'Event submitted for review!'), 'success');
      form.reset();
      updatePreview();

    } catch (err) {
      showToast('❌ ' + (err.message || 'Submission failed. Try again.'), 'error');
      console.error('Submit error:', err);
    } finally {
      if (submitBtn) {
        submitBtn.disabled    = false;
        submitBtn.textContent = '🚀 Submit Event for Review';
      }
    }
  });

  /* ── Success modal close ── */
  document.getElementById('successClose')?.addEventListener('click', () => {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  });

  document.getElementById('successModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('successModal')) {
      document.getElementById('successModal').classList.remove('modal--open');
      document.body.style.overflow = '';
    }
  });
});
