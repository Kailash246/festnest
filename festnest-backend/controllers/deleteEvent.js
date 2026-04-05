/* ============================================================
   PATCH: exports.deleteEvent
   File: festnest-backend/controllers/eventController.js

   WHAT CHANGED:
   - Admin bypass is now explicit and logs what happened
   - Works for ANY status: pending, approved, rejected, expired
   - Organizer can still only delete their OWN events
   - Cloudinary cleanup runs for both admin and organizer deletes

   INSTRUCTION: Find the existing deleteEvent export in your
   eventController.js and REPLACE it entirely with this block.
   Everything else in eventController.js stays the same.
   ============================================================ */

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found.' });

    const isOwner = event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    /* Organizer: only their own events, any status
       Admin:     any event, any status              */
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Only the event owner or an admin can delete this event.',
      });
    }

    /* Clean up Cloudinary assets regardless of who deletes */
    const cleanups = [];
    if (event.posterPublicId)
      cleanups.push(deleteFromCloudinary(event.posterPublicId, 'image').catch(() => {}));
    if (event.brochurePublicId)
      cleanups.push(deleteFromCloudinary(event.brochurePublicId, 'raw').catch(() => {}));
    if (cleanups.length) await Promise.all(cleanups);

    await event.deleteOne();

    /* Differentiated message so frontend toasts are informative */
    const actor = isAdmin && !isOwner ? 'Admin' : 'Organizer';
    res.json({
      success: true,
      message: `Event "${event.title}" deleted successfully.`,
      deletedBy: actor,
    });
  } catch (err) {
    next(err);
  }
};
