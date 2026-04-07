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

      console.log('[DEBUG] File selected:', file.name, '(' + (file.size / 1024 / 1024).toFixed(2) + ' MB)');

      /* ── File size validation ── */
      if (file.size > maxSize) {
        console.warn('[DEBUG] File size exceeds limit:', maxSize / 1024 / 1024, 'MB');
        alert(`${zoneId === 'posterUpload' ? 'Poster' : 'Brochure'} must be less than ${maxSizeLabel}.`);
        input.value = '';
        return;
      }

      console.log('[DEBUG] File validation passed, opening cropper (NO UPLOAD YET)...');
      onFile(file);
      zone.querySelector('.upload-zone-title').textContent = '✅ ' + file.name;
      zone.querySelector('.upload-zone-sub').textContent   = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      zone.style.borderColor = '#00BFA5';
      zone.classList.add('upload-zone--uploaded');
    });
  }

  setupUploadZone('posterUpload',   'image/jpeg,image/jpg,image/png,image/webp', MAX_POSTER_SIZE,   '2 MB', f => { openCropModal(f); });
  setupUploadZone('brochureUpload', 'application/pdf',                           MAX_BROCHURE_SIZE, '20 MB', f => { brochureFile = f; });

  /* ── CUSTOM IMAGE CROPPER (16:9 FIXED FRAME) ────────────────────────────────
     
     CORE LOGIC:
     - Track image translate(x, y) and display dimensions
     - On export: Calculate exact visible region of original image
     - Use canvas.drawImage() with source region to crop accurately
     
     VISUAL-TO-OUTPUT MAPPING:
     visibleX = (-translateX / imageDisplayWidth) * originalImageWidth
     visibleY = (-translateY / imageDisplayHeight) * originalImageHeight
     visibleWidth = (frameWidth / imageDisplayWidth) * originalImageWidth
     visibleHeight = (frameHeight / imageDisplayHeight) * originalImageHeight
     
     ────────────────────────────────────────────────────────────────────────── */

  let selectedFile = null;
  let isProcessing = false;  // Prevent multiple uploads
  let cropState = {
    offsetX: 0,           // Current translate X
    offsetY: 0,           // Current translate Y
    imageWidth: 0,        // Display width of image in frame
    imageHeight: 0,       // Display height of image in frame
    originalWidth: 0,     // Original image dimensions
    originalHeight: 0,
  };

  /**
   * Open crop modal for uploaded image
   */
  function openCropModal(file) {
    console.log('[DEBUG] openCropModal() called with file:', file.name);
    
    if (!file) return;
    selectedFile = file;

    const modal = document.getElementById('cropModal');
    const image = document.querySelector('.crop-image');

    // Read file and display
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('[DEBUG] Image file read, opening cropper...');
      image.src = e.target.result;

      // Show modal
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';

      // Wait for image to load to get dimensions
      image.onload = () => {
        console.log('[DEBUG] Image loaded in DOM, initializing cropper...');
        initializeCropper();
      };
    };
    reader.readAsDataURL(file);
  }

  /**
   * Initialize cropper after image loads
   */
  function initializeCropper() {
    const frame = document.querySelector('.crop-frame');
    const image = document.querySelector('.crop-image');

    if (!frame || !image) return;

    // Store original image dimensions
    cropState.originalWidth = image.naturalWidth;
    cropState.originalHeight = image.naturalHeight;

    // Get frame dimensions
    const frameRect = frame.getBoundingClientRect();
    const frameWidth = frameRect.width;
    const frameHeight = frameRect.height;

    // Calculate image display size (cover behavior)
    // Image must cover frame while maintaining aspect ratio
    const imageAspect = cropState.originalWidth / cropState.originalHeight;
    const frameAspect = frameWidth / frameHeight;

    if (imageAspect > frameAspect) {
      // Image is wider: fit by height
      cropState.imageHeight = frameHeight;
      cropState.imageWidth = frameHeight * imageAspect;
    } else {
      // Image is taller: fit by width
      cropState.imageWidth = frameWidth;
      cropState.imageHeight = frameWidth / imageAspect;
    }

    // Apply calculated dimensions to image element
    image.style.width = cropState.imageWidth + 'px';
    image.style.height = cropState.imageHeight + 'px';

    // Reset position and center image
    cropState.offsetX = (frameWidth - cropState.imageWidth) / 2;
    cropState.offsetY = (frameHeight - cropState.imageHeight) / 2;

    updateImageTransform();
    initializeDragHandlers();
  }

  /**
   * Initialize drag handlers for image movement
   */
  function initializeDragHandlers() {
    const frame = document.querySelector('.crop-frame');
    if (!frame) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startOffsetX = 0;
    let startOffsetY = 0;

    // Remove old listeners (if re-initializing)
    frame.removeEventListener('mousedown', onDragStart);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    frame.removeEventListener('touchstart', onDragStart);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    // Add new listeners
    frame.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    frame.addEventListener('touchstart', onDragStart);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragEnd);

    function onDragStart(e) {
      isDragging = true;
      frame.classList.add('dragging');

      const pos = getTouchOrMousePos(e);
      startX = pos.x;
      startY = pos.y;
      startOffsetX = cropState.offsetX;
      startOffsetY = cropState.offsetY;
    }

    function onDragMove(e) {
      if (!isDragging) return;
      e.preventDefault();

      const pos = getTouchOrMousePos(e);
      const deltaX = pos.x - startX;
      const deltaY = pos.y - startY;

      cropState.offsetX = startOffsetX + deltaX;
      cropState.offsetY = startOffsetY + deltaY;

      updateImageTransform();
    }

    function onDragEnd() {
      isDragging = false;
      frame.classList.remove('dragging');
    }

    function getTouchOrMousePos(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }
  }

  /**
   * Update image position with transform translate
   */
  function updateImageTransform() {
    const image = document.querySelector('.crop-image');
    if (!image) return;
    image.style.transform = `translate(${cropState.offsetX}px, ${cropState.offsetY}px)`;
  }

  /**
   * Close crop modal without saving (CANCEL action)
   * - Discards cropped image
   * - Resets all crop state
   * - Clears selected file
   */
  function closeCrop() {
    console.log('[DEBUG] CANCEL CLICKED - closeCrop() called');
    console.log('[DEBUG] Upload will NOT be triggered');
    
    const modal = document.getElementById('cropModal');
    const doneBtn = document.querySelector('.crop-actions .btn-done');
    
    // Close modal
    modal.classList.remove('show');
    document.body.style.overflow = '';

    // Reset all state
    selectedFile = null;
    isProcessing = false;
    cropState = {
      offsetX: 0,
      offsetY: 0,
      imageWidth: 0,
      imageHeight: 0,
      originalWidth: 0,
      originalHeight: 0,
    };

    // Reset Done button state
    if (doneBtn) {
      doneBtn.disabled = false;
      doneBtn.textContent = 'Done';
    }

    // Clear image source
    const image = document.querySelector('.crop-image');
    if (image) {
      image.src = '';
      image.style.width = '';
      image.style.height = '';
      image.style.transform = '';
    }

    console.log('[DEBUG] Crop modal closed, all state reset');
  }

  /**
   * Export cropped canvas and upload
   * CRITICAL: Map visual frame to original image using correct formulas
   * 
   * Flow:
   * 1. Validate state
   * 2. Set processing flag (prevent double-click)
   * 3. Generate canvas from visible frame
   * 4. Convert to Blob
   * 5. Upload to server
   * 6. Update UI
   * 7. Close modal on success
   * 8. Reset processing flag on error
   */
  function cropAndUpload() {
    console.log('[DEBUG] ========== DONE CLICKED ==========');
    console.log('[DEBUG] cropAndUpload() called');
    
    const frame = document.querySelector('.crop-frame');
    const image = document.querySelector('.crop-image');

    if (!frame || !image || !selectedFile) {
      console.warn('[DEBUG] Image not loaded - returning early');
      showToast('Image not loaded', 'error');
      return;
    }

    // Prevent multiple uploads
    if (isProcessing) {
      console.warn('[DEBUG] Already processing - blocking double-click');
      showToast('Processing... please wait', 'info');
      return;
    }

    isProcessing = true;

    const btn = document.querySelector('.crop-actions .btn-done');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Processing...';
    }

    try {
      const frameRect = frame.getBoundingClientRect();
      const frameWidth = frameRect.width;
      const frameHeight = frameRect.height;

      // Get current state
      const translateX = cropState.offsetX;
      const translateY = cropState.offsetY;
      const imageDisplayWidth = cropState.imageWidth;
      const imageDisplayHeight = cropState.imageHeight;
      const originalWidth = cropState.originalWidth;
      const originalHeight = cropState.originalHeight;

      console.log('[DEBUG] Crop state:', {
        translateX,
        translateY,
        imageDisplayWidth,
        imageDisplayHeight,
        originalWidth,
        originalHeight,
      });

      // Validate dimensions
      if (!imageDisplayWidth || !imageDisplayHeight || !originalWidth || !originalHeight) {
        console.error('[DEBUG] Image dimensions invalid');
        showToast('Image dimensions invalid', 'error');
        isProcessing = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Done';
        }
        return;
      }

      console.log('[DEBUG] Creating canvas 1280x720...');

      // Create canvas with 16:9 at high resolution
      const canvas = document.createElement('canvas');
      canvas.width = 1280;   // 16:9 ratio
      canvas.height = 720;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Create image element to draw from
      const imgElement = new Image();
      imgElement.crossOrigin = 'anonymous';

      imgElement.onload = () => {
        console.log('[DEBUG] Image loaded for canvas drawing...');
        
        try {
          // CRITICAL FORMULA: Map visible frame to source image region
          // The translate offset tells us how much of the display image is off-screen
          // We need to map this back to the original image coordinates

          const visibleX = (-translateX / imageDisplayWidth) * originalWidth;
          const visibleY = (-translateY / imageDisplayHeight) * originalHeight;

          const visibleWidth = (frameWidth / imageDisplayWidth) * originalWidth;
          const visibleHeight = (frameHeight / imageDisplayHeight) * originalHeight;

          console.log('[DEBUG] Drawing canvas with visible region:', {
            visibleX: visibleX.toFixed(2),
            visibleY: visibleY.toFixed(2),
            visibleWidth: visibleWidth.toFixed(2),
            visibleHeight: visibleHeight.toFixed(2),
          });

          // Draw the exact visible portion of the original image onto canvas
          ctx.drawImage(
            imgElement,
            visibleX,           // source X
            visibleY,           // source Y
            visibleWidth,       // source width
            visibleHeight,      // source height
            0,                  // destination X
            0,                  // destination Y
            canvas.width,       // destination width
            canvas.height       // destination height
          );

          console.log('[DEBUG] Canvas drawn successfully, converting to blob...');

          // Convert canvas to blob and upload
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error('[DEBUG] Failed to create blob');
              showToast('Failed to generate image', 'error');
              resetProcessing();
              return;
            }

            console.log('[DEBUG] Blob created:', blob.size, 'bytes');
            uploadPosterBlob(blob);
          }, 'image/jpeg', 0.95);
        } catch (err) {
          console.error('[DEBUG] Canvas drawing error:', err);
          showToast('Error: ' + err.message, 'error');
          resetProcessing();
        }
      };

      imgElement.onerror = () => {
        console.error('[DEBUG] Image load error in canvas processing');
        showToast('Failed to load image for processing', 'error');
        resetProcessing();
      };

      imgElement.src = image.src;
    } catch (err) {
      console.error('[DEBUG] Crop error:', err);
      showToast('Error: ' + err.message, 'error');
      resetProcessing();
    }

    function resetProcessing() {
      isProcessing = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
    }
  }

  /**
   * Upload cropped poster blob to server
   * CRITICAL: This function is ONLY called from stripAndUpload() on Done click
   */
  function uploadPosterBlob(blob) {
    console.log('[DEBUG] ========== UPLOAD TRIGGERED ==========');
    console.log('[DEBUG] uploadPosterBlob() called with blob:', blob.size, 'bytes');
    
    const btn = document.querySelector('.crop-actions .btn-done');

    const fd = new FormData();
    fd.append('poster', blob, 'poster.jpg');

    console.log('[DEBUG] Sending POST to /api/upload/poster...');

    fetch('/api/upload/poster', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FN_AUTH.getToken()}`,
      },
      body: fd,
    })
    .then(res => {
      console.log('[DEBUG] Upload response status:', res.status);
      if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
      return res.json();
    })
    .then(data => {
      console.log('[DEBUG] Upload success:', data);

      // Store the cropped file
      selectedFile = new File([blob], 'poster.jpg', { type: 'image/jpeg' });

      // Update upload zone UI
      const zone = document.getElementById('posterUpload');
      if (zone) {
        const titleEl = zone.querySelector('.upload-zone-title');
        const subEl = zone.querySelector('.upload-zone-sub');
        if (titleEl) titleEl.textContent = '✅ poster.jpg';
        if (subEl) subEl.textContent = (blob.size / 1024 / 1024).toFixed(2) + ' MB';
        zone.style.borderColor = '#00BFA5';
        zone.classList.add('upload-zone--uploaded');
      }

      showToast('🖼️ Poster ready!', 'success');

      // Close cropper after successful upload
      isProcessing = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
      closeCrop();
      
      console.log('[DEBUG] Upload complete, cropper closed');
    })
    .catch(err => {
      console.error('[DEBUG] Poster upload error:', err);
      showToast('Upload failed: ' + err.message, 'error');
      isProcessing = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
    });
  }

  /**
   * Attach crop modal event handlers
   * - Close/Cancel: Discard changes, reset state
   * - Done: Generate, crop, and upload poster
   */
  (function attachCropHandlers() {
    console.log('[DEBUG] Setting up crop modal event handlers...');
    
    const modal = document.getElementById('cropModal');
    const closeBtn = document.querySelector('.crop-header-close');
    const cancelBtn = document.querySelector('.crop-actions .btn-cancel');
    const doneBtn = document.querySelector('.crop-actions .btn-done');

    /**
     * CLOSE BUTTON (X)
     * Action: Cancel cropping, discard changes
     */
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[DEBUG] CLOSE BUTTON CLICKED (X)');
        closeCrop();
      });
    }

    /**
     * CANCEL BUTTON
     * Action: Cancel cropping, discard changes
     */
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[DEBUG] CANCEL BUTTON CLICKED');
        closeCrop();
      });
    }

    /**
     * DONE BUTTON
     * Action: Generate cropped image, upload, and close
     */
    if (doneBtn) {
      doneBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[DEBUG] DONE BUTTON CLICKED');
        cropAndUpload();
      });
    }

    /**
     * MODAL OVERLAY CLICK
     * Action: Cancel cropping (click outside frame)
     */
    if (modal) {
      modal.addEventListener('click', (e) => {
        // Close only if clicking on modal background, not the container
        if (e.target === modal) {
          console.log('[DEBUG] OVERLAY CLICKED (outside frame)');
          closeCrop();
        }
      });
    }
    
    console.log('[DEBUG] Crop handlers attached successfully');
  })();

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
