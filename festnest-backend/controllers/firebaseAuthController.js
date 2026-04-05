/* ============================================================
   FESTNEST — controllers/firebaseAuthController.js
   
   Firebase Authentication Bridge
   - Verifies Firebase ID tokens
   - Creates/retrieves users in MongoDB
   - Returns backend JWT for session management
   ============================================================ */
'use strict';

const admin    = require('firebase-admin');
const User     = require('../models/User');
const { generateToken } = require('../middleware/auth');

/* ── Response helper — same format as email/password auth ── */
const sendTokenResponse = (user, statusCode, res, isNewUser = false) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    isNewUser,  /* Flag to trigger onboarding on frontend */
    token,
    user: {
      id:           user._id,
      firstName:    user.firstName,
      lastName:     user.lastName,
      fullName:     `${user.firstName} ${user.lastName}`,
      email:        user.email,
      role:         user.role,
      college:      user.college  || '',
      branch:       user.branch   || '',
      year:         user.year     || '',
      phone:        user.phone    || '',
      city:         user.city     || '',
      state:        user.state    || '',
      avatar:       user.avatar   || '',
      bio:          user.bio      || '',
      interests:    user.interests || [],
      isVerified:   user.isVerified || false,
      savedEvents:  user.savedEvents || [],
    },
  });
};

/**
 * POST /api/auth/firebase-login
 * 
 * Handles Firebase login (email/password or Google)
 * - Verifies Firebase ID token
 * - Finds or creates user in MongoDB
 * - Returns backend JWT
 * 
 * Body: { idToken, email }
 */
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { idToken, email } = req.body;

    if (!idToken || !email) {
      return res.status(400).json({
        success: false,
        message: 'idToken and email are required.',
      });
    }

    /* ── Verify Firebase ID token ── */
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Firebase token.',
      });
    }

    const firebaseUid = decodedToken.uid;

    /* ── Find user in MongoDB ── */
    let user = await User.findOne({
      $or: [{ email }, { firebaseUid }],
    });

    if (!user) {
      /* ── New user detected ── */
      return res.status(200).json({
        success: true,
        isNewUser: true,
        firebaseUid,
        email,
        message: 'New user. Please complete onboarding.',
      });
    }

    /* ── Existing user ── */
    /* Update Firebase UID if logging in for first time via Firebase */
    if (!user.firebaseUid) {
      user.firebaseUid = firebaseUid;
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    /* ── Return user with backend JWT ── */
    sendTokenResponse(user, 200, res, false);

  } catch (err) {
    next(err);
  }
};
