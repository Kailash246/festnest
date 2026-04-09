/* ============================================================
   FESTNEST — services/otpService.js
   OTP Management Service
   - Generate and verify 6-digit OTPs
   - In-memory storage with 5-minute expiry
   - 5 attempts limit per OTP
   - Rate limiting: 60 seconds between send attempts
   ============================================================ */

'use strict';

/* ── In-memory OTP storage ──
   Format: {
     email: {
       code: '123456',
       expiresAt: timestamp,
       attempts: 0,
       lastSentAt: timestamp
     }
   }
   ────────────────────────── */
const otpStore = new Map();

/* ── Configuration ── */
const OTP_EXPIRY_MS = 5 * 60 * 1000;       /* 5 minutes */
const MAX_ATTEMPTS = 5;                     /* Failed verification attempts */
const RATE_LIMIT_MS = 60 * 1000;            /* 60 seconds between sends */

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate and store OTP for an email
 * @param {string} email - User email
 * @returns {object} { success, message, expiresIn }
 */
exports.generateOTP = (email) => {
  const now = Date.now();
  const cleanEmail = email.toLowerCase().trim();

  /* ── Check rate limit (60 seconds) ── */
  if (otpStore.has(cleanEmail)) {
    const existing = otpStore.get(cleanEmail);
    const timeSinceLastSent = now - existing.lastSentAt;

    if (timeSinceLastSent < RATE_LIMIT_MS) {
      const secondsRemaining = Math.ceil((RATE_LIMIT_MS - timeSinceLastSent) / 1000);
      return {
        success: false,
        message: `Please wait ${secondsRemaining} seconds before requesting another OTP.`,
        retryAfter: secondsRemaining,
      };
    }
  }

  /* ── Generate new OTP ── */
  const code = generateOTPCode();
  const expiresAt = now + OTP_EXPIRY_MS;

  otpStore.set(cleanEmail, {
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
  });

  console.log(`✅ OTP generated for ${cleanEmail}: ${code} (expires in 5 min)`);

  return {
    success: true,
    message: 'OTP sent successfully',
    expiresIn: 300, /* 5 minutes in seconds */
  };
};

/**
 * Verify OTP for an email
 * @param {string} email - User email
 * @param {string} code - OTP code to verify
 * @returns {object} { success, message }
 */
exports.verifyOTP = (email, code) => {
  const now = Date.now();
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  /* ── Check if OTP exists ── */
  if (!otpStore.has(cleanEmail)) {
    return {
      success: false,
      message: 'No OTP found for this email. Please request a new OTP.',
    };
  }

  const otpData = otpStore.get(cleanEmail);

  /* ── Check if OTP expired ── */
  if (now > otpData.expiresAt) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      message: 'OTP has expired. Please request a new OTP.',
    };
  }

  /* ── Check attempt limit ── */
  if (otpData.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  /* ── Verify code ── */
  if (cleanCode !== otpData.code) {
    otpData.attempts += 1;
    const attemptsRemaining = MAX_ATTEMPTS - otpData.attempts;

    if (attemptsRemaining === 0) {
      otpStore.delete(cleanEmail);
      return {
        success: false,
        message: 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.',
      };
    }

    return {
      success: false,
      message: `Incorrect OTP. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining.`,
      attemptsRemaining,
    };
  }

  /* ── OTP verified! ── */
  otpStore.delete(cleanEmail);

  console.log(`✅ OTP verified for ${cleanEmail}`);

  return {
    success: true,
    message: 'OTP verified successfully. Proceed with signup.',
  };
};

/**
 * Check if email has valid OTP
 * @param {string} email - User email
 * @returns {boolean}
 */
exports.isOTPValid = (email) => {
  const cleanEmail = email.toLowerCase().trim();
  
  if (!otpStore.has(cleanEmail)) {
    return false;
  }

  const otpData = otpStore.get(cleanEmail);
  return Date.now() <= otpData.expiresAt;
};

/**
 * Get OTP status for debugging (admin only)
 * @param {string} email - User email
 * @returns {object} OTP status data
 */
exports.getOTPStatus = (email) => {
  const cleanEmail = email.toLowerCase().trim();

  if (!otpStore.has(cleanEmail)) {
    return { stored: false };
  }

  const otpData = otpStore.get(cleanEmail);
  const now = Date.now();
  const isExpired = now > otpData.expiresAt;
  const expiresIn = Math.ceil((otpData.expiresAt - now) / 1000);

  return {
    stored: true,
    isExpired,
    expiresIn: isExpired ? 0 : expiresIn,
    attempts: otpData.attempts,
    maxAttempts: MAX_ATTEMPTS,
    code: otpData.code, /* SECURITY: Only for debugging */
  };
};

/**
 * Clear all expired OTPs (cleanup task)
 */
exports.cleanupExpiredOTPs = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [email, otpData] of otpStore.entries()) {
    if (now > otpData.expiresAt) {
      otpStore.delete(email);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 OTP cleanup: Removed ${cleaned} expired entries`);
  }

  return cleaned;
};
