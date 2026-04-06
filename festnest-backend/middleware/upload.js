/* ============================================================
   festnest-backend/middleware/upload.js
   Multer middleware — memory storage, uploads to Cloudinary
   ============================================================ */
'use strict';

const multer = require('multer');

/* All files go to memory — we stream them to Cloudinary */
const storage = multer.memoryStorage();

/* ── File type filters ────────────────────────────────────── */
const imageFilter = (req, file, cb) => {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Poster must be an image: JPG, PNG, or WebP (max 2 MB)'), false);
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(new Error('Brochure must be a PDF file (max 20 MB)'), false);
};

const combinedFilter = (req, file, cb) => {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type. Accepted: JPG, PNG, WebP (poster) or PDF (brochure)'), false);
};

/* ── Wrap multer so errors return JSON, not Express default ── */
const wrapMulter = (upFn) => (req, res, next) => {
  upFn(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      let msg = 'File error.';
      if (err.code === 'LIMIT_FILE_SIZE') {
        msg = 'File exceeds maximum allowed size.';
      } else {
        msg = err.message;
      }
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(400).json({ success: false, message: err.message });
  });
};2

/* ── Exported middleware ──────────────────────────────────── */

/** Single poster upload (used in standalone upload route) */
exports.uploadPoster = wrapMulter(
  multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFilter }).single('poster')
);

/** Single brochure upload */
exports.uploadBrochure = wrapMulter(
  multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter: pdfFilter }).single('brochure')
);

/**
 * Combined: poster (image) + brochure (PDF) in one request.
 * Used in POST /api/events and PUT /api/events/:id
 */
exports.uploadEventFiles = wrapMulter(
  multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: combinedFilter,
  }).fields([
    { name: 'poster',   maxCount: 1 },
    { name: 'brochure', maxCount: 1 },
  ])
);
