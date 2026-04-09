/* ============================================================
   FESTNEST — routes/auth.js
   Base: /api/auth
   ============================================================ */

'use strict';

const express     = require('express');
const router      = express.Router();
const rateLimit   = require('express-rate-limit');

const {
  register, login, getMe, updateProfile, changePassword,
} = require('../controllers/authController');

const firebaseAuthRouter = require('./firebaseAuth');
const otpRouter = require('./otp');

const { protect } = require('../middleware/auth');
const {
  registerValidator, loginValidator,
} = require('../middleware/validate');

/* Strict rate limit for auth endpoints — 20 attempts per 15 min */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ──────────────────────────────────────
   PUBLIC — CUSTOM AUTH
   ────────────────────────────────────── */
router.post('/register', authLimiter, registerValidator, register);
router.post('/login',    authLimiter, loginValidator,    login);

/* ──────────────────────────────────────
   PUBLIC — FIREBASE AUTH
   ────────────────────────────────────── */
router.use('/', firebaseAuthRouter);

/* ──────────────────────────────────────
   PUBLIC — OTP VERIFICATION
   ────────────────────────────────────── */
router.use('/', otpRouter);

/* ──────────────────────────────────────
   PROTECTED
   ────────────────────────────────────── */
router.get ('/me',              protect, getMe);
router.put ('/update-profile',  protect, updateProfile);
router.put ('/change-password', protect, changePassword);

module.exports = router;
