/* ============================================================
   FESTNEST — routes/events.js

   CRITICAL BUG FIXED:
   The original file declared GET /:id BEFORE the static paths
   like /saved/list, /my/events, /admin/pending.

   Express matches routes in declaration order. When /:id comes
   first, a request to /my/events is treated as id="my" and hits
   getEvent() which calls mongoose with id="my" — fails with a
   cast error or 404, never reaching the real handler.

   RULE: All static paths MUST be declared BEFORE /:id
   ============================================================ */
'use strict';

const express = require('express');
const router  = express.Router();

const {
  getEvents, getEvent, searchEvents,
  createEvent, updateEvent, deleteEvent,
  getMyEvents,
  saveEvent, getSavedEvents,
  getPendingEvents, approveEvent, rejectEvent, getAdminStats,
} = require('../controllers/eventController');

const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadEventFiles }                  = require('../middleware/upload');
const { createEventValidator, mongoIdValidator } = require('../middleware/validate');

/* ══════════════════════════════════════════════════════════════
   PUBLIC — no auth required
   ══════════════════════════════════════════════════════════════ */

/* GET /api/events              — approved-only public feed      */
router.get('/', optionalAuth, getEvents);

/* GET /api/events/search?q=    — full-text search               */
router.get('/search', searchEvents);

/* ══════════════════════════════════════════════════════════════
   STATIC PROTECTED PATHS — must come BEFORE /:id
   ══════════════════════════════════════════════════════════════ */

/* GET  /api/events/saved/list  — my bookmarked events           */
router.get('/saved/list', protect, getSavedEvents);

/* GET  /api/events/my/events   — organizer's own events         */
router.get('/my/events', protect, authorize('organizer', 'admin'), getMyEvents);

/* ── Admin paths (also static — must precede /:id) ─────────── */
router.get('/admin/pending', protect, authorize('admin'), getPendingEvents);
router.get('/admin/stats',   protect, authorize('admin'), getAdminStats);

/* ══════════════════════════════════════════════════════════════
   ORGANIZER / ADMIN — create, update, delete
   ══════════════════════════════════════════════════════════════ */

/* POST /api/events             — create event (with file upload) */
router.post(
  '/',
  protect,
  authorize('organizer', 'admin'),
  uploadEventFiles,
  createEventValidator,
  createEvent
);

/* PUT /api/events/:id          — update event                   */
router.put(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  uploadEventFiles,
  ...mongoIdValidator('id'),
  updateEvent
);

/* DELETE /api/events/:id
   - Organizer: only their own event
   - Admin:     any event                                        */
router.delete(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  ...mongoIdValidator('id'),
  deleteEvent
);

/* POST /api/events/:id/save    — toggle save/unsave             */
router.post('/:id/save', protect, ...mongoIdValidator('id'), saveEvent);

/* PATCH /api/events/:id/approve  — admin approve               */
router.patch('/:id/approve', protect, authorize('admin'), ...mongoIdValidator('id'), approveEvent);

/* PATCH /api/events/:id/reject   — admin reject                */
router.patch('/:id/reject',  protect, authorize('admin'), ...mongoIdValidator('id'), rejectEvent);

/* GET /api/events/:id          — single event detail
   MUST BE LAST — /:id is a catch-all for any remaining GETs    */
router.get('/:id', ...mongoIdValidator('id'), optionalAuth, getEvent);

module.exports = router;
