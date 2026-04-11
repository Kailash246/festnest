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
    console.log('\n[SendOTP] ═══════════════════════════════════');
    console.log('[SendOTP] 📥 POST received');
    console.log('[SendOTP] Full Request Body:', JSON.stringify(req.body));
    
    const { email } = req.body;
    console.log('[SendOTP] Extracted Email:', email);

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

    /* ── Generate OTP (MongoDB) ── */
    const result = await generateOTP(email);

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
      console.log(`[SendOTP] ⏳ About to call sendOTPEmail...`);
      console.log(`[SendOTP] Params: email="${email}", otp="${result.otp}"`);
      
      const emailResult = await sendOTPEmail(email, result.otp);
      
      console.log(`[SendOTP] ✅ sendOTPEmail completed successfully`);
      console.log(`[SendOTP] Result:`, emailResult);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Valid for 5 minutes.',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        expiresIn: result.expiresIn,
      });
    } catch (emailError) {
      console.error(`[SendOTP] ❌ sendOTPEmail threw error`);
      console.error(`[SendOTP] Error Message:`, emailError.message);
      console.error(`[SendOTP] Error Code:`, emailError.code);
      console.error(`[SendOTP] Error Command:`, emailError.command);
      console.error(`[SendOTP] Error Response:`, emailError.response);
      console.error(`[SendOTP] Full Error:`, emailError);
      
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

    /* ── Verify OTP (MongoDB) ── */
    const result = await verifyOTP(email, code);

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
