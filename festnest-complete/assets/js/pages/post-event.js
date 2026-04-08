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

  /* Auth is now handled by inline lock screen in HTML */
  /* No need for requirePage() check — protected page shows lock if not logged in */

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

  /**
   * HIDDEN FILE INPUT FOR CROPPER
   * - User clicks upload zone → Modal opens
   * - Inside modal, user clicks "Select Image" → This input triggered
   * - User picks file → Image loads in cropper
   */
  const cropFileInput = document.createElement('input');
  cropFileInput.id = 'cropFileInput';
  cropFileInput.type = 'file';
  cropFileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
  cropFileInput.style.display = 'none';
  document.body.appendChild(cropFileInput);

  function setupUploadZone(zoneId, maxSize, maxSizeLabel) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;

    if (zoneId === 'posterUpload') {
      /**
       * POSTER UPLOAD: Opens cropper modal (crop-first approach)
       * User clicks → Modal opens → Select image inside modal
       */
      zone.addEventListener('click', () => {
        console.log('[FLOW] Poster upload zone clicked - opening cropper');
        openCropperModal();
      });

      zone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          console.log('[FLOW] Poster upload zone activated via keyboard');
          openCropperModal();
        }
      });
    } else if (zoneId === 'brochureUpload') {
      /**
       * BROCHURE UPLOAD: Direct file picker (not using cropper)
       * User clicks → File picker → File selected → Stored
       */
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.style.display = 'none';
      zone.appendChild(input);

      zone.addEventListener('click', () => input.click());
      zone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') input.click();
      });

      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        console.log('[FLOW] Brochure selected:', file.name);

        if (file.size > maxSize) {
          console.warn('[FLOW] Brochure size exceeds limit:', maxSize / 1024 / 1024, 'MB');
          alert(`Brochure must be less than ${maxSizeLabel}.`);
          input.value = '';
          return;
        }

        brochureFile = file;
        zone.querySelector('.upload-zone-title').textContent = '✅ ' + file.name;
        zone.querySelector('.upload-zone-sub').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        zone.style.borderColor = '#00BFA5';
        zone.classList.add('upload-zone--uploaded');
      });
    }
  }

  setupUploadZone('posterUpload',   MAX_POSTER_SIZE,   '2 MB');
  setupUploadZone('brochureUpload', MAX_BROCHURE_SIZE, '20 MB');

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
  let uploadedPosterUrl = null;  // CRITICAL: Store uploaded poster URL from /api/upload/poster
  let isCropping = false;      // CRITICAL: Controls modal visibility
  let isProcessing = false;    // Prevents double uploads
  
  let cropState = {
    offsetX: 0,
    offsetY: 0,
    imageWidth: 0,
    imageHeight: 0,
    originalWidth: 0,
    originalHeight: 0,
  };

  /**
   * OPEN CROPPER MODAL (CROP-FIRST APPROACH)
   * - Opens modal without file selected yet
   * - Shows "Select Image" button inside
   * - User clicks to pick file
   * - File loads into cropper
   */
  function openCropperModal() {
    console.log('[FLOW] OPENING CROPPER MODAL - User must select image');
    
    const modal = document.getElementById('cropModal');
    if (!modal) {
      console.error('[FLOW] Crop modal not found');
      return;
    }

    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Reset state (in case reopening)
    selectedFile = null;
    isCropping = false;
    cropState = {
      offsetX: 0,
      offsetY: 0,
      imageWidth: 0,
      imageHeight: 0,
      originalWidth: 0,
      originalHeight: 0,
    };

    // Reset image element
    const image = document.querySelector('.crop-image');
    if (image) {
      image.src = '';
      image.style.width = '';
      image.style.height = '';
      image.style.transform = '';
    }

    // Reset Done button
    const doneBtn = document.querySelector('.crop-actions .btn-done');
    if (doneBtn) {
      doneBtn.disabled = true;
      doneBtn.textContent = 'Done';
    }

    // Reset file input (in case user cancelled before picking file)
    cropFileInput.value = '';

    // Trigger file picker inside modal
    console.log('[FLOW] Triggering file picker for image selection');
    cropFileInput.click();
  }

  /**
   * HANDLE FILE SELECTION INSIDE CROPPER
   * - User picks file from modal
   * - Validates size
   * - Loads image into cropper
   * - Sets isCropping = true
   * - Enables Done button
   */
  function handleCropFileSelect(e) {
    const file = e.target.files[0];
    if (!file) {
      console.log('[FLOW] No file selected');
      return;
    }

    console.log('[FLOW] Image file selected for cropper:', file.name, '(' + (file.size / 1024 / 1024).toFixed(2) + ' MB)');

    // Validate file size
    if (file.size > MAX_POSTER_SIZE) {
      console.warn('[FLOW] File size exceeds limit:', MAX_POSTER_SIZE / 1024 / 1024, 'MB');
      alert('Poster must be less than 2 MB');
      cropFileInput.value = '';
      return;
    }

    selectedFile = file;
    isCropping = true;

    const modal = document.getElementById('cropModal');
    const image = document.querySelector('.crop-image');

    if (!image) {
      console.error('[FLOW] Crop image element not found');
      return;
    }

    // Read file and display
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('[FLOW] Image file read successfully, loading into cropper');
      image.src = event.target.result;

      // Enable Done button now that image is selected
      const doneBtn = document.querySelector('.crop-actions .btn-done');
      if (doneBtn) {
        doneBtn.disabled = false;
        console.log('[FLOW] Done button ENABLED - image loaded');
      }

      // Hide placeholder now that image is loaded
      const placeholder = document.getElementById('cropPlaceholder');
      if (placeholder) {
        placeholder.classList.add('hide');
        console.log('[FLOW] Placeholder hidden, image visible');
      }

      // Wait for image to load, then initialize cropper
      image.onload = () => {
        console.log('[FLOW] Image loaded in DOM, initializing cropper position');
        initializeCropper();
      };
    };

    reader.onerror = () => {
      console.error('[FLOW] Error reading file');
      isCropping = false;
      selectedFile = null;
      showToast('Failed to load image', 'error');
      cropFileInput.value = '';
    };

    reader.readAsDataURL(file);
  }

  // Attach file change listener to hidden input
  cropFileInput.addEventListener('change', handleCropFileSelect);

  /**
   * PLACEHOLDER CLICK: Allow user to click placeholder to select image
   * This makes the UX more intuitive - users can click "Select Image" area
   */
  const cropPlaceholder = document.getElementById('cropPlaceholder');
  if (cropPlaceholder) {
    cropPlaceholder.addEventListener('click', () => {
      console.log('[FLOW] Placeholder clicked - triggering file picker');
      cropFileInput.click();
    });
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
   * - CRITICAL: Sets isCropping = false to block upload
   */
  function closeCrop() {
    console.log('[FLOW] CANCEL - isCropping now = false, blocking upload');
    
    // CRITICAL: Must disable cropping first
    isCropping = false;
    
    const modal = document.getElementById('cropModal');
    const doneBtn = document.querySelector('.crop-actions .btn-done');
    const placeholder = document.getElementById('cropPlaceholder');
    
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
      doneBtn.disabled = true;
      doneBtn.textContent = 'Done';
    }

    // Clear image source and show placeholder again
    const image = document.querySelector('.crop-image');
    if (image) {
      image.src = '';
      image.style.width = '';
      image.style.height = '';
      image.style.transform = '';
    }

    // Show placeholder for next time
    if (placeholder) {
      placeholder.classList.remove('hide');
    }

    console.log('[FLOW] Crop modal closed completely, cannot upload');
  }

  /**
   * Export cropped canvas and upload
   * CRITICAL: Map visual frame to original image using correct formulas
   * CRITICAL: This ONLY runs if isCropping = true (Done button only)
   * 
   * Flow:
   * 1. Validate isCropping state
   * 2. Validate image loaded
   * 3. Set processing flag (prevent double-click)
   * 4. Generate canvas from visible frame
   * 5. Convert to Blob
   * 6. Upload to server
   * 7. Update UI
   * 8. Close modal on success
   * 9. Reset processing flag on error
   */
  function cropAndUpload() {
    // CRITICAL GUARD: Only allow if in active cropping state
    if (!isCropping) {
      console.error('[FLOW] GUARD REJECTED: cropAndUpload called but isCropping=false');
      console.error('[FLOW] This should NEVER happen - indicates serious control flow error');
      return;
    }

    console.log('[FLOW] ========== DONE CLICKED ==========');
    console.log('[FLOW] cropAndUpload() executing with isCropping=true');
    
    const frame = document.querySelector('.crop-frame');
    const image = document.querySelector('.crop-image');

    if (!frame || !image || !selectedFile) {
      console.warn('[FLOW] Image not loaded - returning early');
      showToast('Image not loaded', 'error');
      return;
    }

    // Prevent multiple uploads
    if (isProcessing) {
      console.warn('[FLOW] Already processing - blocking double-click');
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

      console.log('[FLOW] Crop state:', {
        translateX,
        translateY,
        imageDisplayWidth,
        imageDisplayHeight,
        originalWidth,
        originalHeight,
      });

      // Validate dimensions
      if (!imageDisplayWidth || !imageDisplayHeight || !originalWidth || !originalHeight) {
        console.error('[FLOW] Image dimensions invalid');
        showToast('Image dimensions invalid', 'error');
        isProcessing = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Done';
        }
        return;
      }

      console.log('[FLOW] Creating canvas 1280x720...');

      // Create canvas with 16:9 at high resolution
      const canvas = document.createElement('canvas');
      canvas.width = 1280;   // 16:9 ratio
      canvas.height = 720;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[FLOW] ❌ Failed to get 2D canvas context');
        throw new Error('Failed to get canvas context');
      }

      console.log('[FLOW] ✅ Canvas created (1280x720)');

      // Create image element to draw from
      const imgElement = new Image();
      imgElement.crossOrigin = 'anonymous';

      imgElement.onload = () => {
        console.log('[FLOW] ✅ Image element loaded for canvas drawing');
        
        try {
          // CRITICAL FORMULA: Map visible frame to source image region
          // The translate offset tells us how much of the display image is off-screen
          // We need to map this back to the original image coordinates

          const visibleX = (-translateX / imageDisplayWidth) * originalWidth;
          const visibleY = (-translateY / imageDisplayHeight) * originalHeight;

          const visibleWidth = (frameWidth / imageDisplayWidth) * originalWidth;
          const visibleHeight = (frameHeight / imageDisplayHeight) * originalHeight;

          console.log('[FLOW] Drawing canvas with visible region:', {
            visibleX: visibleX.toFixed(2),
            visibleY: visibleY.toFixed(2),
            visibleWidth: visibleWidth.toFixed(2),
            visibleHeight: visibleHeight.toFixed(2),
            frameWidth,
            frameHeight,
            imageDisplayWidth,
            imageDisplayHeight,
            originalImageSize: `${originalWidth}x${originalHeight}`,
            translateOffset: `(${translateX.toFixed(0)}, ${translateY.toFixed(0)})`,
          });

          // Verify calculations are valid
          if (visibleWidth <= 0 || visibleHeight <= 0) {
            console.error('[FLOW] ❌ Invalid visible dimensions:', { visibleWidth, visibleHeight });
            throw new Error('Invalid crop region');
          }

          console.log('[FLOW] Calling ctx.drawImage with params:');
          console.log('[FLOW]   source: (' + visibleX.toFixed(0) + ', ' + visibleY.toFixed(0) + ', ' + visibleWidth.toFixed(0) + ', ' + visibleHeight.toFixed(0) + ')');
          console.log('[FLOW]   destination: (0, 0, 1280, 720)');

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

          console.log('[FLOW] ✅ Canvas drawn successfully with visible crop region');

          // Convert canvas to blob and upload
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error('[FLOW] ❌ Failed to create blob - canvas.toBlob returned null');
              showToast('Failed to generate image', 'error');
              resetProcessing();
              return;
            }

            console.log('[FLOW] ✅ Blob created successfully');
            console.log('[FLOW] Blob size:', blob.size, 'bytes', '(' + (blob.size / 1024 / 1024).toFixed(2) + ' MB)');
            console.log('[FLOW] Blob type:', blob.type);
            
            // Verify blob is valid
            if (blob.size === 0) {
              console.error('[FLOW] ❌ Blob is empty (0 bytes)');
              showToast('Generated image is empty', 'error');
              resetProcessing();
              return;
            }

            if (blob.type !== 'image/jpeg') {
              console.warn('[FLOW] ⚠️  Blob type is', blob.type, 'expected image/jpeg');
            }

            uploadPosterBlob(blob);
          }, 'image/jpeg', 0.95);
        } catch (err) {
          console.error('[FLOW] Canvas drawing error:', err);
          showToast('Error: ' + err.message, 'error');
          resetProcessing();
        }
      };

      imgElement.onerror = () => {
        console.error('[FLOW] Image load error in canvas processing');
        showToast('Failed to load image for processing', 'error');
        resetProcessing();
      };

      imgElement.src = image.src;
    } catch (err) {
      console.error('[FLOW] Crop error:', err);
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
   * CRITICAL: Only runs if isCropping = true (called from cropAndUpload on Done click)
   * SAFETY LOCK: Verify modal is shown (defense in depth)
   */
  function uploadPosterBlob(blob) {
    // CRITICAL GUARD 1: Verify we're in active cropping context
    console.log('[FLOW] uploadPosterBlob guard check - isCropping=' + isCropping);
    if (!isCropping) {
      console.error('[FLOW] BLOCKED: Upload attempted outside cropping context');
      console.error('[FLOW] This indicates a serious control flow violation');
      showToast('Upload error: Invalid state', 'error');
      isProcessing = false;
      const btn = document.querySelector('.crop-actions .btn-done');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
      return;
    }

    // SAFETY LOCK: Verify modal is visible
    const modal = document.getElementById('cropModal');
    if (!modal || !modal.classList.contains('show')) {
      console.error('[FLOW] SAFETY LOCK TRIGGERED: Modal not visible, blocking upload');
      console.error('[FLOW] This should never happen - indicates button not properly connected');
      showToast('Upload error: Modal closed', 'error');
      isProcessing = false;
      const btn = document.querySelector('.crop-actions .btn-done');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
      return;
    }

    console.log('[FLOW] ========== UPLOAD TRIGGERED ==========');
    console.log('[FLOW] uploadPosterBlob() executing with blob:', blob.size, 'bytes');
    console.log('[FLOW] Blob type:', blob.type);
    
    const btn = document.querySelector('.crop-actions .btn-done');

    // Build FormData with blob
    const fd = new FormData();
    fd.append('poster', blob, 'poster.jpg');

    // Debug: Log FormData contents
    console.log('[FLOW] FormData constructed:');
    for (let [key, value] of fd.entries()) {
      console.log('[FLOW]   -', key, ':', value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value);
    }

    // Get auth token
    const authToken = FN_AUTH.getToken();
    console.log('[FLOW] Auth token present:', !!authToken, authToken ? '(length: ' + authToken.length + ')' : '(MISSING!)');

    console.log('[FLOW] Sending POST to', API_BASE + '/upload/poster', '...');
    console.log('[FLOW] Headers:', { Authorization: `Bearer ${authToken ? '[TOKEN]' : '[MISSING]'}` });

    fetch(API_BASE + '/upload/poster', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: fd,
    })
    .then(res => {
      console.log('[FLOW] ========== RESPONSE RECEIVED ==========');
      console.log('[FLOW] Status:', res.status, res.statusText);
      console.log('[FLOW] Content-Type:', res.headers.get('content-type'));
      
      if (!res.ok) {
        console.error('[FLOW] ❌ Upload failed - HTTP', res.status);
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      // Try to parse as JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json();
      } else {
        console.warn('[FLOW] ⚠️  Response is not JSON:', contentType);
        return res.text().then(text => {
          console.log('[FLOW] Response text:', text);
          try {
            return JSON.parse(text);
          } catch (e) {
            return { success: true, text: text };
          }
        });
      }
    })
    .then(data => {
      console.log('[FLOW] ========== UPLOAD SUCCESS ==========');
      console.log('[FLOW] Response data:', data);

      // CRITICAL: Capture the uploaded poster URL from the response
      uploadedPosterUrl = data.url || data.secure_url;
      console.log('[FLOW] Saved uploadedPosterUrl:', uploadedPosterUrl);

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

      // Close cropper after successful upload and reset isCropping state
      isProcessing = false;
      isCropping = false;  // CRITICAL: Reset after successful upload
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
      closeCrop();
      
      console.log('[FLOW] Upload complete, isCropping reset to false');
    })
    .catch(err => {
      console.error('[FLOW] ========== UPLOAD FAILED ==========');
      console.error('[FLOW] ❌ Upload error:', err);
      console.error('[FLOW] Error message:', err.message);
      console.error('[FLOW] Error name:', err.name);
      console.error('[FLOW] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      // Specific error handling
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        console.error('[FLOW] 🔐 Authorization failed - check auth token');
        showToast('Upload failed: Authentication error', 'error');
      } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
        console.error('[FLOW] 📋 Bad request - check FormData or payload');
        showToast('Upload failed: Invalid request format', 'error');
      } else if (err.message.includes('413') || err.message.includes('Payload')) {
        console.error('[FLOW] 📦 File too large');
        showToast('Upload failed: File too large', 'error');
      } else if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        console.error('[FLOW] 🌐 Network/CORS error'),
        showToast('Upload failed: Network error (check CORS)', 'error');
      } else {
        showToast('Upload failed: ' + err.message, 'error');
      }

      isProcessing = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }
    });
  }

  /**
   * EXPLICIT HANDLER: CANCEL / CLOSE
   * - Clears selected file
   * - Sets isCropping = false (blocks upload)
   * - Closes modal
   * - Resets all crop state
   * - NEVER calls upload
   */
  function handleCancel() {
    console.log('[FLOW] ========== CANCEL HANDLER INVOKED ==========');
    console.log('[FLOW] User clicked Cancel/Close button');
    console.log('[FLOW] Setting isCropping = false to BLOCK any uploads');
    
    closeCrop();
    
    console.log('[FLOW] Cancel complete - modal closed, upload blocked');
  }

  /**
   * EXPLICIT HANDLER: DONE
   * - Validates isCropping state
   * - Generates canvas from visible frame
   * - Converts to blob
   * - ONLY then calls uploadPosterBlob()
   * - Closes modal on success
   */
  function handleDone() {
    console.log('[FLOW] ========== DONE HANDLER INVOKED ==========');
    console.log('[FLOW] User clicked Done button');
    console.log('[FLOW] This triggers image generation and UPLOAD');
    
    cropAndUpload();
    
    console.log('[FLOW] Done handler initiated upload process');
  }

  /**
   * Attach crop modal event handlers
   * - Close/Cancel: Discard changes, reset state, set isCropping=false
   * - Done: Generate, crop, and upload poster (ONLY if isCropping=true)
   */
  (function attachCropHandlers() {
    console.log('[FLOW] Setting up crop modal event handlers...');
    
    const modal = document.getElementById('cropModal');
    const closeBtn = document.querySelector('.crop-header-close');
    const cancelBtn = document.querySelector('.crop-actions .btn-cancel');
    const doneBtn = document.querySelector('.crop-actions .btn-done');

    /**
     * CLOSE BUTTON (X)
     * Action: Cancel cropping, discard changes, set isCropping=false
     */
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[FLOW] CLOSE BUTTON (X) CLICKED');
        handleCancel();
      });
    }

    /**
     * CANCEL BUTTON
     * Action: Cancel cropping, discard changes, set isCropping=false
     */
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[FLOW] CANCEL BUTTON CLICKED');
        handleCancel();
      });
    }

    /**
     * DONE BUTTON
     * Action: Crop image and upload (ONLY if isCropping=true)
     */
    if (doneBtn) {
      doneBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[FLOW] DONE BUTTON CLICKED - uploading image');
        handleDone();
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
          console.log('[FLOW] OVERLAY CLICKED (outside frame) - closing');
          handleCancel();
        }
      });
    }
    
    console.log('[FLOW] Crop handlers attached successfully');
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

    /* Attach files if selected, OR send uploaded poster URL */
    if (posterFile)   fd.append('poster',   posterFile);
    if (brochureFile) fd.append('brochure', brochureFile);
    
    /* CRITICAL: If poster was uploaded via cropper, send the URL */
    if (uploadedPosterUrl) {
      console.log('[FLOW] Appending posterUrl:', uploadedPosterUrl);
      fd.append('posterUrl', uploadedPosterUrl);
    }

    /* ── Loading state ── */
    if (submitBtn) {
      submitBtn.disabled   = true;
      submitBtn.innerHTML  = '<span class="spinner"></span> Submitting...';
    }

    /* ── DEBUG: Log FormData contents before API call ── */
    console.log('[FORM_SUBMIT] ========== CREATING EVENT ==========');
    console.log('[FORM_SUBMIT] Title:', title);
    console.log('[FORM_SUBMIT] Uploaded Poster URL:', uploadedPosterUrl || '(none)');
    console.log('[FORM_SUBMIT] Poster File:', posterFile ? `File(${posterFile.name})` : '(none)');
    console.log('[FORM_SUBMIT] Brochure File:', brochureFile ? `File(${brochureFile.name})` : '(none)');

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
      uploadedPosterUrl = null;  // Reset uploaded URL
      
      /* Reset upload zone UI */
      const posterZone = document.getElementById('posterUpload');
      if (posterZone) {
        posterZone.style.borderColor = '';
        posterZone.classList.remove('upload-zone--uploaded');
        const titleEl = posterZone.querySelector('.upload-zone-title');
        const subEl = posterZone.querySelector('.upload-zone-sub');
        if (titleEl) titleEl.textContent = 'Upload Poster';
        if (subEl) subEl.textContent = 'PNG, JPG, WebP - Max 2MB';
      }
      
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
