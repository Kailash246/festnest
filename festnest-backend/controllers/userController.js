/* ============================================================
   FESTNEST — controllers/userController.js
   User profile, saved events, admin user management
   ============================================================ */

'use strict';

const User  = require('../models/User');
const Event = require('../models/Event');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/* ──────────────────────────────────────
   GET /api/users/profile   (protected)
   ────────────────────────────────────── */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedEvents', 'title college startDate posterUrl status category mode');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────────────────
   PUT /api/users/profile   (protected)
   ────────────────────────────────────── */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'college', 'branch',
      'year', 'phone', 'city', 'state', 'bio', 'interests',
      'organizationName',
    ];
    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    /* Handle avatar upload */
    if (req.file) {
      const user = await User.findById(req.user.id);
      if (user.avatar) {
        /* Extract public_id from URL (simple parse) */
        const parts  = user.avatar.split('/');
        const publicId = parts.slice(-2).join('/').split('.')[0];
        await deleteFromCloudinary(publicId, 'image').catch(() => {});
      }
      const result = await uploadToCloudinary(req.file.buffer, 'festnest/avatars', 'image');
      updates.avatar = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });

    res.json({ success: true, message: 'Profile updated!', user });
  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────────────────
   GET /api/users/saved-events   (protected)
   ────────────────────────────────────── */
exports.getSavedEvents = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedEvents',
      match: { isActive: true, status: 'approved' },
      select: 'title college category mode startDate location prizes registrationFee posterUrl badge',
    });

    res.json({ success: true, count: user.savedEvents.length, events: user.savedEvents });
  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────────────────
   GET /api/users   (admin only)
   List all users
   ────────────────────────────────────── */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName:  new RegExp(search, 'i') },
        { email:     new RegExp(search, 'i') },
        { college:   new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password -passwordResetToken -passwordResetExpiry'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, total, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────────────────
   PATCH /api/users/:id/verify   (admin)
   Verify organizer account
   ────────────────────────────────────── */
exports.verifyOrganizer = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: `${user.fullName} verified as organizer.`, user });
  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────────────────
   PATCH /api/users/:id/deactivate   (admin)
   ────────────────────────────────────── */
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: `${user.fullName}'s account deactivated.` });
  } catch (err) {
    next(err);
  }
};
