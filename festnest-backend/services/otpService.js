/* ============================================================
   FESTNEST — services/otpService.js
   OTP Management Service (MongoDB Storage)
   - Generate and verify 6-digit OTPs
   - MongoDB storage (survives server restarts, works on Render)
   - 5-minute expiry
   - 5 attempts limit per OTP
   - Rate limiting: 60 seconds between send attempts
   ============================================================ */

'use strict';

const Otp = require('../models/Otp');

/* ── Configuration ── */
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MS = 60 * 1000; /* 60 seconds between sends */

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate and store OTP for an email (MongoDB)
 * @param {string} email - User email
 * @returns {object} { success, message, otp, expiresIn, retryAfter }
 */
exports.generateOTP = async (email) => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date();

    console.log(`\n[OTP Service] 🔄 generateOTP called for ${cleanEmail}`);
    console.log(`[OTP Service] 💾 Using MongoDB storage (survives restarts & load balancing)`);

    /* ── Check rate limit (60 seconds) ── */
    const existingOtp = await Otp.findOne({ email: cleanEmail });

    if (existingOtp && existingOtp.expiresAt > now) {
      const timeSinceCreated = now - existingOtp.createdAt;

      if (timeSinceCreated < RATE_LIMIT_MS) {
        const secondsRemaining = Math.ceil((RATE_LIMIT_MS - timeSinceCreated) / 1000);
        console.log(`[OTP Service] ⏱️ Rate limit hit: ${secondsRemaining}s remaining`);

        return {
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting another OTP.`,
          retryAfter: secondsRemaining,
        };
      }
    }

    /* ── Generate new OTP ── */
    const code = generateOTPCode();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); /* 5 minutes */

    /* ── Save or update OTP in MongoDB ── */
    const otpRecord = await Otp.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
        otp: code,
        expiresAt,
        attempts: 0,
        createdAt: now,
      },
      { upsert: true, new: true }
    );

    console.log(`[OTP Service] ✅ OTP ${code} stored in DB for ${cleanEmail}`);
    console.log(`[OTP Service] ⏰ Expires at: ${expiresAt.toISOString()}`);

    return {
      success: true,
      message: 'OTP generated successfully',
      otp: code,
      expiresIn: 300, /* 5 minutes in seconds */
    };
  } catch (error) {
    console.error(`[OTP Service] 💥 generateOTP error:`, error.message);
    throw error;
  }
};

/**
 * Verify OTP for an email
 * @param {string} email - User email
 * @param {string} code - OTP code to verify
 * @returns {object} { success, message, attemptsRemaining }
 */
exports.verifyOTP = async (email, code) => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();
    const now = new Date();

    console.log(`\n[OTP Service] 🔍 verifyOTP called`);
    console.log(`[OTP Service] 💾 Querying MongoDB for OTP record`);
    console.log(`[OTP Service] Email: ${cleanEmail}`);
    console.log(`[OTP Service] Provided Code: ${cleanCode}`);

    /* ── Find OTP record ── */
    const otpRecord = await Otp.findOne({ email: cleanEmail });

    if (!otpRecord) {
      console.log(`[OTP Service] ❌ No OTP found for ${cleanEmail}`);
      return {
        success: false,
        message: 'No OTP found for this email. Please request a new OTP.',
      };
    }

    console.log(`[OTP Service] 📊 OTP Record Found`);
    console.log(`[OTP Service]   Stored Code: ${otpRecord.otp}`);
    console.log(`[OTP Service]   Expires At: ${otpRecord.expiresAt.toISOString()}`);
    console.log(`[OTP Service]   Current Time: ${now.toISOString()}`);
    console.log(`[OTP Service]   Attempts: ${otpRecord.attempts}/${MAX_ATTEMPTS}`);

    /* ── Check expiry ── */
    if (otpRecord.expiresAt < now) {
      console.log(`[OTP Service] ⏱️ OTP expired`);
      await Otp.deleteOne({ _id: otpRecord._id });
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    /* ── Check max attempts ── */
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      console.log(`[OTP Service] ❌ Max attempts exceeded`);
      await Otp.deleteOne({ _id: otpRecord._id });
      return {
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      };
    }

    /* ── Verify code (safe string comparison) ── */
    if (otpRecord.otp.toString() !== cleanCode) {
      console.log(`[OTP Service] ❌ Code mismatch: ${otpRecord.otp} !== ${cleanCode}`);

      /* ── Increment attempts ── */
      otpRecord.attempts += 1;
      await otpRecord.save();

      console.log(`[OTP Service] 📈 Attempts incremented to ${otpRecord.attempts}`);

      const attemptsRemaining = MAX_ATTEMPTS - otpRecord.attempts;
      return {
        success: false,
        message: `Incorrect OTP. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} remaining.`,
        attemptsRemaining,
      };
    }

    /* ── Success: Delete OTP record ── */
    console.log(`[OTP Service] ✅ OTP verified successfully`);
    console.log(`[OTP Service] 🗑️ Deleting OTP record from MongoDB...`);
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log(`[OTP Service] ✅ OTP record deleted (one-time use enforced)`);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error(`[OTP Service] 💥 verifyOTP error:`, error.message);
    throw error;
  }
};

/**
 * Check if valid OTP exists for an email (helper)
 * @param {string} email - User email
 * @returns {boolean}
 */
exports.isOTPValid = async (email) => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date();

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      expiresAt: { $gt: now },
      attempts: { $lt: MAX_ATTEMPTS },
    });

    return !!otpRecord;
  } catch (error) {
    console.error(`[OTP Service] Error checking OTP validity:`, error.message);
    return false;
  }
};

/**
 * Cleanup - remove all expired OTPs (can run periodically)
 */
exports.cleanupExpiredOtps = async () => {
  try {
    const now = new Date();
    const result = await Otp.deleteMany({ expiresAt: { $lt: now } });
    console.log(`[OTP Service] 🧹 Cleanup: Deleted ${result.deletedCount} expired OTPs`);
  } catch (error) {
    console.error(`[OTP Service] Cleanup error:`, error.message);
  }
};
