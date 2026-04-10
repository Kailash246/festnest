/* ============================================================
   FESTNEST — models/Otp.js
   OTP Model for Email Verification
   - Temporary storage for OTP codes
   - Auto-deletes after 5 minutes using TTL index
   ============================================================ */

'use strict';

const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    /* ── Email ── */
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },

    /* ── OTP Code ── */
    otp: {
      type: String,
      required: [true, 'OTP code is required'],
    },

    /* ── Expiry ── */
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), /* 5 minutes */
    },

    /* ── Verification Attempts ── */
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },

    /* ── Timestamp ── */
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

/* ── TTL Index: Auto-delete expired OTPs ── */
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
