/* ============================================================
   FESTNEST — controllers/otpController.js
   OTP Email Verification Controller
   - Handles send-otp and verify-otp requests
   - Integrates with email service
   ============================================================ */

'use strict';

const { sendOTPEmail } = require('../utils/otpEmail');
const {
  generateOTP,
  verifyOTP,
  isOTPValid,
} = require('../services/otpService');

/**
 * POST /api/auth/send-otp
 * Send OTP to user's email
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    console.log('\n[SendOTP] ═══════════════════════════════════');
    console.log('[SendOTP] 📥 POST received');
    console.log('[SendOTP] Email:', email ? `${email.substring(0, 5)}...` : 'N/A');

    /* ── Validate email ── */
    if (!email) {
      console.log('[SendOTP] ❌ Email not provided');
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    /* ── Basic email format validation ── */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[SendOTP] ❌ Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    /* ── Generate OTP ── */
    const result = generateOTP(email);

    if (!result.success) {
      console.log('[SendOTP] ⚠️ Rate limit:', result.message);
      return res.status(429).json({
        success: false,
        message: result.message,
        retryAfter: result.retryAfter,
      });
    }

    /* ── Send email ── */
    try {
      await sendOTPEmail(email);
      console.log('[SendOTP] ✅ OTP email sent to', email);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Valid for 5 minutes.',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), /* Mask email */
        expiresIn: result.expiresIn,
      });
    } catch (emailError) {
      console.error('[SendOTP] ❌ Email send failed:', emailError.message);
      
      /* If email fails, delete the OTP so user can retry */
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
      });
    }
  } catch (error) {
    console.error('[SendOTP] 💥 Server error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and allow user to proceed with signup
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    console.log('\n[VerifyOTP] ═══════════════════════════════════');
    console.log('[VerifyOTP] 📥 POST received');
    console.log('[VerifyOTP] Email:', email ? `${email.substring(0, 5)}...` : 'N/A');
    console.log('[VerifyOTP] Code provided:', !!code);

    /* ── Validate input ── */
    if (!email || !code) {
      console.log('[VerifyOTP] ❌ Missing email or code');
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required.',
      });
    }

    /* ── Verify OTP ── */
    const result = verifyOTP(email, code);

    if (!result.success) {
      console.log('[VerifyOTP] ❌', result.message);
      return res.status(400).json({
        success: false,
        message: result.message,
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    /* ── OTP verified successfully ── */
    console.log('[VerifyOTP] ✅ OTP verified for', email);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Proceed with signup.',
      email,
      verified: true,
    });
  } catch (error) {
    console.error('[VerifyOTP] 💥 Server error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};
