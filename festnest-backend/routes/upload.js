/* ============================================================
   festnest-backend/routes/upload.js
   Standalone upload endpoints  →  /api/upload
   ============================================================ */
'use strict';

const express  = require('express');
const router   = express.Router();
const { protect, authorize }          = require('../middleware/auth');
const { uploadPoster, uploadBrochure } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/* ── POST /api/upload/poster ──────────────────────────────── */
router.post('/poster',
  protect,
  authorize('organizer', 'admin'),
  uploadPoster,
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No poster file received.' });

      const result = await uploadToCloudinary(req.file.buffer, 'festnest/posters', 'image');
      res.json({
        success:  true,
        url:      result.secure_url,
        publicId: result.public_id,
        format:   result.format,
        bytes:    result.bytes,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ── POST /api/upload/brochure ────────────────────────────── */
router.post('/brochure',
  protect,
  authorize('organizer', 'admin'),
  uploadBrochure,
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No brochure file received.' });

      const result = await uploadToCloudinary(req.file.buffer, 'festnest/brochures', 'raw');
      
      /* Create clean filename from event title */
      const fileName = (req.body.title || 'festnest_brochure')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();

      /* CORRECT METHOD for RAW files: use query parameter */
      const rawUrl = result.secure_url;
      const downloadUrl = `${rawUrl}?fl_attachment=${fileName}.pdf`;

      res.json({
        success: true,
        url: rawUrl,
        downloadUrl: downloadUrl,
        publicId: result.public_id,
        bytes: result.bytes,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ── DELETE /api/upload/:publicId ─────────────────────────── */
router.delete('/:publicId',
  protect,
  authorize('organizer', 'admin'),
  async (req, res, next) => {
    try {
      const type = req.query.type || 'image'; // ?type=raw for PDFs
      await deleteFromCloudinary(decodeURIComponent(req.params.publicId), type);
      res.json({ success: true, message: 'File deleted from Cloudinary.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
