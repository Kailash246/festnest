// festnest-backend/controllers/eventController.js
'use strict';

const Event = require('../models/Event');
const User  = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/* ── Helper: safely parse JSON that arrives as a string via FormData ── */
function tryParse(value, fallback = {}) {
  if (value && typeof value === 'object') return value;      // already parsed
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC
═══════════════════════════════════════════════════════════ */

/**
 * GET /api/events
 * Query: page, limit, category, mode, fee, search, sort, badge
 */
exports.getEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, mode, fee, search, sort = 'newest', badge } = req.query;

    const filter = { status: 'approved' };

    if (category && category !== 'All')
      filter.category = { $regex: new RegExp('^' + category.trim() + '$', 'i') };
    if (mode && mode !== 'All')
      filter.mode = { $regex: new RegExp('^' + mode.trim() + '$', 'i') };
    if (badge)
      filter.badge = badge;
    if (fee === 'Free')
      filter.registrationFee = 'Free';
    if (fee === 'Paid')
      filter.registrationFee = { $ne: 'Free' };
    if (search && search.trim())
      filter.$text = { $search: search.trim() };

    const sortMap = {
      newest  : { createdAt : -1 },
      oldest  : { createdAt :  1 },
      popular : { views     : -1 },
      deadline: { startDate :  1 },
    };

    const pg  = Math.max(1, +page);
    const lim = Math.min(50, Math.max(1, +limit));

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip((pg - 1) * lim)
        .limit(lim)
        .select('-__v -rejectionReason -approvedBy -posterPublicId -brochurePublicId')
        .populate('organizer', 'firstName lastName email organizationName'),
      Event.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: pg, pages: Math.ceil(total / lim), count: events.length, events });
  } catch (err) { next(err); }
};

/** GET /api/events/search?q= */
exports.searchEvents = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    if (!q?.trim()) return res.status(400).json({ success: false, message: 'Search query (q) is required.' });

    const filter = { status: 'approved', $text: { $search: q.trim() } };
    const pg = Math.max(1, +page), lim = Math.min(50, +limit);

    const [events, total] = await Promise.all([
      Event.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((pg - 1) * lim)
        .limit(lim)
        .select('title college category mode startDate location prizes registrationFee posterUrl badge'),
      Event.countDocuments(filter),
    ]);

    res.json({ success: true, total, query: q.trim(), count: events.length, events });
  } catch (err) { next(err); }
};

/** GET /api/events/:id  — increments view count */
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email organizationName isVerified')
      .select('-posterPublicId -brochurePublicId -__v');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    // Non-approved events only visible to owner or admin
    if (event.status !== 'approved') {
      const uid     = req.user?.id;
      const isOwner = uid && event.organizer && event.organizer._id.toString() === uid;
      const isAdmin = req.user?.role === 'admin';
      
      // Debug logging
      console.log('[getEvent] Checking access for pending event:', {
        eventId: req.params.id,
        eventStatus: event.status,
        uid,
        organizerId: event.organizer?._id.toString(),
        isOwner,
        userRole: req.user?.role,
        isAdmin,
        userExists: !!req.user
      });
      
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ success: false, message: 'Event not found or access denied.' });
      }
    }

    // Ensure organizer exists and has _id
    if (!event.organizer || !event.organizer._id) {
      return res.status(500).json({ success: false, message: 'Event data error: missing organizer information.' });
    }

    /* Ensure event has _id (defensive check) */
    if (!event._id) {
      return res.status(500).json({ success: false, message: 'Event data error: missing ID.' });
    }

    // Async — don't await so response isn't delayed
    Event.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    res.json({ success: true, event });
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════════
   ORGANIZER / ADMIN — Create
═══════════════════════════════════════════════════════════ */

/**
 * POST /api/events
 * Body: multipart/form-data
 *   — All text fields + optional files: poster (image), brochure (pdf)
 *   — OR posterUrl field if poster was pre-uploaded via /api/upload/poster
 *   — Nested objects (location, prizes, contact) sent as JSON strings
 */
exports.createEvent = async (req, res, next) => {
  try {
    const b = req.body;

    /* ── 1. Get poster URL ────────────────────────────────── */
    let posterUrl = '', posterPublicId = '';
    
    /* First check if posterUrl was sent as a field (from /api/upload/poster) */
    if (b.posterUrl) {
      console.log('[Event] Using pre-uploaded posterUrl:', b.posterUrl);
      posterUrl = b.posterUrl;
      /* posterPublicId will be empty since it was uploaded separately */
    }
    /* Otherwise check if poster file was sent with the form */
    else if (req.files?.poster?.[0]) {
      try {
        const result    = await uploadToCloudinary(
          req.files.poster[0].buffer,
          'festnest/posters',
          'image'
        );
        posterUrl       = result.secure_url;
        posterPublicId  = result.public_id;
      } catch (uploadErr) {
        console.error('[Cloudinary] poster upload failed:', uploadErr.message);
        // Non-fatal: event is still created without poster
      }
    }

    /* ── 2. Upload brochure (PDF) to Cloudinary ──────────── */
    let brochureUrl = '', brochurePublicId = '';
    if (req.files?.brochure?.[0]) {
      try {
        const result       = await uploadToCloudinary(
          req.files.brochure[0].buffer,
          'festnest/brochures',
          'raw'
        );
        brochureUrl        = result.secure_url;
        brochurePublicId   = result.public_id;
      } catch (uploadErr) {
        console.error('[Cloudinary] brochure upload failed:', uploadErr.message);
      }
    }

    /* ── 3. Parse nested JSON strings ────────────────────── */
    const location = tryParse(b.location, {});
    const prizes   = tryParse(b.prizes,   {});
    const contact  = tryParse(b.contact,  {});

    /* ── 4. Tags (comma-separated string OR array) ───────── */
    let tags = [];
    if (Array.isArray(b.tags)) {
      tags = b.tags.filter(Boolean);
    } else if (typeof b.tags === 'string' && b.tags.trim()) {
      tags = b.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    /* ── 5. Create event document ────────────────────────── */
    const event = await Event.create({
      title:               b.title,
      description:         b.description,
      category:            b.category,
      mode:                b.mode,
      college:             b.college,
      startDate:           b.startDate,
      endDate:             b.endDate             || undefined,
      registrationDeadline:b.registrationDeadline|| undefined,
      location,
      prizes,
      contact,
      tags,
      registrationFee:     b.registrationFee  || 'Free',
      registrationLink:    b.registrationLink || '',
      eligibility:         b.eligibility      || '',
      rules:               b.rules            || '',
      posterUrl,
      posterPublicId,
      brochureUrl,
      brochurePublicId,
      organizer:           req.user.id,
      organizerName:       `${req.user.firstName} ${req.user.lastName}`,
      // Admins publish immediately; organizers go to review
      status:              req.user.role === 'admin' ? 'approved' : 'pending',
      badge:               'new',
    });

    const message = req.user.role === 'admin'
      ? 'Event published successfully!'
      : 'Event submitted for review! It will go live within 24 hours.';

    res.status(201).json({ success: true, message, event });
  } catch (err) { next(err); }
};

/* ── Update ────────────────────────────────────────────────── */
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (!event.organizer) return res.status(500).json({ success: false, message: 'Event data error: missing organizer.' });
    const isOwner = event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorized to update this event.' });

    // Replace poster
    if (req.files?.poster?.[0]) {
      await deleteFromCloudinary(event.posterPublicId, 'image');
      const r = await uploadToCloudinary(req.files.poster[0].buffer, 'festnest/posters', 'image');
      req.body.posterUrl = r.secure_url; req.body.posterPublicId = r.public_id;
    }
    // Replace brochure
    if (req.files?.brochure?.[0]) {
      await deleteFromCloudinary(event.brochurePublicId, 'raw');
      const r = await uploadToCloudinary(req.files.brochure[0].buffer, 'festnest/brochures', 'raw');
      req.body.brochureUrl = r.secure_url; req.body.brochurePublicId = r.public_id;
    }

    if (req.body.location) req.body.location = tryParse(req.body.location, {});
    if (req.body.prizes)   req.body.prizes   = tryParse(req.body.prizes,   {});
    if (req.body.contact)  req.body.contact  = tryParse(req.body.contact,  {});

    // Organizer edits reset to pending
    if (!isAdmin) req.body.status = 'pending';

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Event updated.', event });
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════════
   DELETE  — Organizer (own) OR Admin (any)
═══════════════════════════════════════════════════════════ */
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (!event.organizer) return res.status(500).json({ success: false, message: 'Event data error: missing organizer.' });
    const isOwner = event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event.' });

    // Clean up Cloudinary assets
    await deleteFromCloudinary(event.posterPublicId,   'image');
    await deleteFromCloudinary(event.brochurePublicId, 'raw');

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════════
   SAVE / UNSAVE (toggle)
═══════════════════════════════════════════════════════════ */
exports.saveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    /* Use req.user from middleware (already populated from correct collection) */
    const user     = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'User not found. Please log in.' });
    
    const isSaved  = user.savedEvents && user.savedEvents.some(id => id.toString() === req.params.id);

    if (isSaved) {
      user.savedEvents = user.savedEvents.filter(id => id.toString() !== req.params.id);
      await user.save();
      await Event.findByIdAndUpdate(req.params.id, { $inc: { saves: -1 } });
      return res.json({ success: true, saved: false, message: 'Removed from saved.' });
    }

    /* Initialize savedEvents array if it doesn't exist */
    if (!user.savedEvents) user.savedEvents = [];
    user.savedEvents.push(req.params.id);
    await user.save();
    await Event.findByIdAndUpdate(req.params.id, { $inc: { saves: 1 } });
    res.json({ success: true, saved: true, message: 'Event saved!' });
  } catch (err) { next(err); }
};

exports.getSavedEvents = async (req, res, next) => {
  try {
    /* Use req.user from middleware (already populated from correct collection) */
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'User not found. Please log in.' });
    
    /* Re-fetch to populate savedEvents with full event details */
    const UserModel = user.role === 'student' ? require('../models/Student') : require('../models/Organizer');
    const updatedUser = await UserModel.findById(user.id).populate({
      path   : 'savedEvents',
      match  : { status: 'approved' },
      select : 'title college category mode startDate location prizes registrationFee posterUrl badge',
    }).select('savedEvents');
    
    const savedEvents = updatedUser?.savedEvents || [];
    res.json({ success: true, count: savedEvents.length, events: savedEvents });
  } catch (err) { next(err); }
};

exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ createdAt: -1 })
      .select('_id title college category mode status startDate views saves badge createdAt posterUrl');
    res.json({ success: true, count: events.length, events });
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════════
   ADMIN
═══════════════════════════════════════════════════════════ */
exports.getPendingEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .select('-posterPublicId -brochurePublicId -__v')
      .populate('organizer', 'firstName lastName email college organizationName isVerified');
    
    // Filter out any null/undefined events
    const validEvents = events.filter(ev => ev && ev._id);
    res.json({ success: true, count: validEvents.length, events: validEvents });
  } catch (err) { next(err); }
};

exports.approveEvent = async (req, res, next) => {
  try {
    const { badge = 'new', isFeatured = false } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', badge, isFeatured, approvedAt: new Date(), approvedBy: req.user.id },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: `"${event.title}" approved and live!`, event });
  } catch (err) { next(err); }
};

exports.rejectEvent = async (req, res, next) => {
  try {
    const { reason = 'Does not meet FestNest guidelines.' } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: `"${event.title}" rejected.`, event });
  } catch (err) { next(err); }
};

exports.getAdminStats = async (req, res, next) => {
  try {
    const [total, pending, approved, rejected, viewsAgg, savesAgg, userCount] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'pending' }),
      Event.countDocuments({ status: 'approved' }),
      Event.countDocuments({ status: 'rejected' }),
      Event.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Event.aggregate([{ $group: { _id: null, total: { $sum: '$saves' } } }]),
      User.countDocuments({ isActive: true }),
    ]);
    res.json({
      success: true,
      stats: {
        events    : { total, pending, approved, rejected },
        engagement: { totalViews: viewsAgg[0]?.total || 0, totalSaves: savesAgg[0]?.total || 0 },
        users     : { total: userCount },
      },
    });
  } catch (err) { next(err); }
};
