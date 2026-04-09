/* ============================================================
   FESTNEST — routes/otp.js
   OTP Verification Routes
   Base: /api/auth/otp
   
   ENDPOINTS:
   - POST /api/auth/send-otp      : Send OTP to email
   - POST /api/auth/verify-otp    : Verify OTP code
   ============================================================ */

'use strict';

const express     = require('express');
const router      = express.Router();
const rateLimit   = require('express-rate-limit');

const { sendOTP, verifyOTP } = require('../controllers/otpController');

/* ── Rate limiters ── */

/* Strict rate limit for OTP send: 3 times per minute per IP */
const otpSendLimiter = rateLimit({
  windowMs: 60 * 1000,           /* 1 minute */
  max: 3,                         /* 3 requests */
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    /* Don't rate limit if email rate-limit already applied in controller */
    return false;
  },
});

/* Standard rate limit for verification: 10 attempts per minute per IP */
const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,            /* 1 minute */
  max: 10,                        /* 10 requests */
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ──────────────────────────────────────
   PUBLIC ROUTES
   ────────────────────────────────────── */

/**
 * POST /api/auth/send-otp
 * Send OTP to user's email
 * 
 * Body: { email: "user@example.com" }
 * Response: { success, message, email (masked), expiresIn }
 */
router.post('/send-otp', otpSendLimiter, sendOTP);

/**
 * POST /api/auth/verify-otp
 * Verify OTP code sent to email
 * 
 * Body: { email: "user@example.com", code: "123456" }
 * Response: { success, message, email, verified }
 */
router.post('/verify-otp', otpVerifyLimiter, verifyOTP);

module.exports = router;
