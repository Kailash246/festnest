/* ============================================================
   FESTNEST — routes/firebaseAuth.js
   
   Firebase Authentication Routes
   - POST /firebase-login    — Login with Firebase
   - POST /firebase-register — Complete onboarding
   - PUT  /firebase-profile  — Update profile
   ============================================================ */
'use strict';

const express = require('express');
const router  = express.Router();

const {
  firebaseLogin,
} = require('../controllers/firebaseAuthController');

/* ────────────────────────────────────
   PUBLIC ROUTES
   ──────────────────────────────────── */

/**
 * POST /api/auth/firebase-login
 * Verify Firebase token and find/create user
 */
router.post('/firebase-login', firebaseLogin);

module.exports = router;
