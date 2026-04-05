/* ============================================================
   FESTNEST — routes/users.js
   Base: /api/users
   ============================================================ */

'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const {
  getProfile, updateProfile, getSavedEvents,
  getAllUsers, verifyOrganizer, deactivateUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

/* Avatar upload (memory) */
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },  /* 2 MB */
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only (JPG/PNG/WebP)'), false);
  },
}).single('avatar');

const handleAvatarUpload = (req, res, next) => {
  avatarUpload(req, res, err => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

/* ── Student / Organizer ── */
router.get ('/profile',        protect, getProfile);
router.put ('/profile',        protect, handleAvatarUpload, updateProfile);
router.get ('/saved-events',   protect, getSavedEvents);

/* ── Admin ── */
router.get ('/',               protect, authorize('admin'), getAllUsers);
router.patch('/:id/verify',    protect, authorize('admin'), verifyOrganizer);
router.patch('/:id/deactivate',protect, authorize('admin'), deactivateUser);

module.exports = router;
