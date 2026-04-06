/* ============================================================
   FESTNEST — POST EVENT PAGE  |  assets/js/pages/post-event.js

   FIXES APPLIED:
   1. Form id is now "postEventForm" — matches HTML
   2. All required fields validated before sending
   3. FormData built correctly for multipart/form-data upload
   4. Nested JSON objects (location, prizes, contact) stringified
   5. File inputs created & attached to upload zones
   6. Inline error messages shown on validation fail
   7. Loading state on submit button
   8. Success modal shown on 201 response
   9. Auth guard — redirect to login if not logged in
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* ── Auth guard ── */
  if (!FN_AUTH.isLoggedIn()) {
    showToast('Please log in as an organizer to post events.', 'info');
    setTimeout(() => {
      if (typeof openAuthModal === 'function') openAuthModal('signup');
    }, 400);
  }

  /* ── Live preview ── */
  const titleInput  = document.getElementById('pf-title');
  const colInput    = document.getElementById('pf-college');
  const pvName      = document.getElementById('pvName');
  const pvCollege   = document.getElementById('pvCollege');
  const pvBanner    = document.getElementById('pvBanner');
  const catSelect   = document.getElementById('pf-category');

  const GRADIENTS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  ];
  let gradIdx = 0;

  function updatePreview() {
    if (pvName)    pvName.textContent    = titleInput?.value   || 'Event Title';
    if (pvCollege) pvCollege.textContent = '🏛 ' + (colInput?.value || 'College Name');
  }
  titleInput?.addEventListener('input', updatePreview);
  colInput  ?.addEventListener('input', updatePreview);
  catSelect ?.addEventListener('change', () => {
    gradIdx = (gradIdx + 1) % GRADIENTS.length;
    if (pvBanner) pvBanner.style.background = GRADIENTS[gradIdx];
  });

  /* ── File upload zones ── */
  let posterFile   = null;
  let brochureFile = null;

  const MAX_POSTER_SIZE   = 2 * 1024 * 1024;   // 2 MB
  const MAX_BROCHURE_SIZE = 20 * 1024 * 1024;  // 20 MB

  function setupUploadZone(zoneId, accept, maxSize, maxSizeLabel, onFile) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = accept;
    input.style.display = 'none';
    zone.appendChild(input);

    const onClick = () => input.click();
    zone.addEventListener('click', onClick);
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;

      /* ── File size validation ── */
      if (file.size > maxSize) {
        alert(`${zoneId === 'posterUpload' ? 'Poster' : 'Brochure'} must be less than ${maxSizeLabel}.`);
        input.value = '';
        return;
      }

      onFile(file);
      zone.querySelector('.upload-zone-title').textContent = '✅ ' + file.name;
      zone.querySelector('.upload-zone-sub').textContent   = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      zone.style.borderColor = '#00BFA5';
      zone.classList.add('upload-zone--uploaded');
    });
  }

  setupUploadZone('posterUpload',   'image/jpeg,image/jpg,image/png,image/webp', MAX_POSTER_SIZE,   '2 MB', f => { posterFile   = f; });
  setupUploadZone('brochureUpload', 'application/pdf',                           MAX_BROCHURE_SIZE, '20 MB', f => { brochureFile = f; });

  /* ── Feature button ── */
  document.getElementById('featureEventBtn')?.addEventListener('click', () => {
    showToast('⭐ Feature placement launching soon!', 'info');
  });

  /* ── Inline error helper ── */
  function showFieldError(inputId, msg) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.style.borderColor = '#e53e3e';
    /* Remove previous error */
    el.parentElement.querySelector('.form-error-msg')?.remove();
    const err = document.createElement('span');
    err.className   = 'form-error-msg';
    err.textContent = msg;
    el.parentElement.appendChild(err);
    el.focus();
  }
  function clearFieldErrors() {
    document.querySelectorAll('.form-error-msg').forEach(e => e.remove());
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
      el.style.borderColor = '';
    });
  }

  /* ── Helper: get trimmed value ── */
  const gv = id => document.getElementById(id)?.value?.trim() || '';

  /* ════════════════════════════════════════
     FORM SUBMIT
     ════════════════════════════════════════ */
  const form      = document.getElementById('postEventForm');
  const submitBtn = form?.querySelector('.post-submit-btn');

  if (!form) {
    console.error('[FestNest] postEventForm not found — check HTML id attribute');
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearFieldErrors();

    /* ── Gather values ── */
    const title    = gv('pf-title');
    const desc     = gv('pf-desc');
    const cat      = document.getElementById('pf-category')?.value || '';
    const mode     = document.getElementById('pf-mode')?.value     || 'Offline';
    const sDate    = gv('pf-start-date');
    const college  = gv('pf-college');
    const pocName  = gv('pf-poc-name');
    const pocPhone = gv('pf-poc-phone');
    const pocEmail = gv('pf-poc-email');

    /* ── Client-side validation ── */
    let valid = true;
    if (!title)    { showFieldError('pf-title',      'Event title is required.');          valid = false; }
    if (!desc)     { showFieldError('pf-desc',       'Description is required.');          valid = false; }
    if (!cat)      { showFieldError('pf-category',   'Please select a category.');          valid = false; }
    if (!college)  { showFieldError('pf-college',    'College / Organization is required.'); valid = false; }
    if (!sDate)    { showFieldError('pf-start-date', 'Start date is required.');            valid = false; }
    if (!pocName)  { showFieldError('pf-poc-name',   'POC name is required.');              valid = false; }
    if (!pocPhone) { showFieldError('pf-poc-phone',  'POC phone is required.');             valid = false; }
    if (!pocEmail) { showFieldError('pf-poc-email',  'POC email is required.');             valid = false; }
    if (!valid) return;

    /* ── File size validation (additional check before submission) ── */
    if (posterFile && posterFile.size > MAX_POSTER_SIZE) {
      alert('Poster must be less than 2 MB. Current size: ' + (posterFile.size / 1024 / 1024).toFixed(2) + ' MB');
      return;
    }
    if (brochureFile && brochureFile.size > MAX_BROCHURE_SIZE) {
      alert('Brochure must be less than 20 MB. Current size: ' + (brochureFile.size / 1024 / 1024).toFixed(2) + ' MB');
      return;
    }

    /* ── Auth check ── */
    if (!FN_AUTH.isLoggedIn()) {
      showToast('Please log in to post events.', 'error');
      if (typeof openAuthModal === 'function') openAuthModal('login');
      return;
    }

    /* ── Build FormData ── */
    const fd = new FormData();
    fd.append('title',       title);
    fd.append('description', desc);
    fd.append('category',    cat);
    fd.append('mode',        mode);
    fd.append('college',     college);
    fd.append('startDate',   sDate);

    const eDate      = gv('pf-end-date');
    const city       = gv('pf-city');
    const venue      = gv('pf-venue-detail');
    const prize1     = gv('pf-prize-1');
    const prize2     = gv('pf-prize-2');
    const prize3     = gv('pf-prize-3');
    const prizePool  = gv('pf-prize-pool');
    const regFee     = gv('pf-reg-fee');
    const regLink    = gv('pf-reg-link');
    const website    = gv('pf-website');
    const elig       = gv('pf-eligibility');
    const rules      = gv('pf-rules');
    const otherPrize = gv('pf-other-prizes');

    if (eDate) fd.append('endDate', eDate);

    /* Nested objects must be JSON strings for FormData */
    fd.append('location', JSON.stringify({
      city:      city,
      state:     '',
      venue:     venue,
      country:   'India',
      onlineLink: mode === 'Online' ? regLink : '',
    }));
    fd.append('prizes', JSON.stringify({
      first:  prize1,
      second: prize2,
      third:  prize3,
      pool:   prizePool,
      other:  otherPrize,
    }));
    fd.append('contact', JSON.stringify({
      name:    pocName,
      phone:   pocPhone,
      email:   pocEmail,
      website: website,
    }));

    if (regFee)  fd.append('registrationFee',  regFee);
    if (regLink) fd.append('registrationLink', regLink);
    if (elig)    fd.append('eligibility', elig);
    if (rules)   fd.append('rules',       rules);

    /* Attach files if selected */
    if (posterFile)   fd.append('poster',   posterFile);
    if (brochureFile) fd.append('brochure', brochureFile);

    /* ── Loading state ── */
    if (submitBtn) {
      submitBtn.disabled   = true;
      submitBtn.innerHTML  = '<span class="spinner"></span> Submitting...';
    }

    /* ── API call ── */
    try {
      const res = await FN_EVENTS_API.createEvent(fd);
      showToast('🎉 ' + (res.message || 'Event submitted for review!'), 'success');

      /* Show success modal */
      const modal = document.getElementById('successModal');
      if (modal) { modal.classList.add('modal--open'); document.body.style.overflow = 'hidden'; }

      /* Reset form */
      form.reset();
      posterFile   = null;
      brochureFile = null;
      updatePreview();

    } catch (err) {
      console.error('[FestNest] createEvent error:', err);

      /* Show inline field errors if backend returned them */
      if (err.errors && err.errors.length) {
        err.errors.forEach(fe => {
          /* Try to map backend field name to our input id */
          const idMap = {
            title: 'pf-title', description: 'pf-desc', category: 'pf-category',
            mode: 'pf-mode', college: 'pf-college', startDate: 'pf-start-date',
            'contact.email': 'pf-poc-email', 'contact.phone': 'pf-poc-phone',
            'contact.name': 'pf-poc-name',
          };
          const inputId = idMap[fe.field];
          if (inputId) showFieldError(inputId, fe.message);
        });
        showToast('Please fix the highlighted fields.', 'error');
      } else {
        showToast('❌ ' + (err.message || 'Submission failed. Try again.'), 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled  = false;
        submitBtn.textContent = '🚀 Submit Event for Review';
      }
    }
  });

  /* ── Success modal close ── */
  function closeSuccessModal() {
    const m = document.getElementById('successModal');
    if (m) m.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  document.getElementById('successClose')?.addEventListener('click', closeSuccessModal);
  document.getElementById('successModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('successModal')) closeSuccessModal();
  });
});
