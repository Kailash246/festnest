/* ============================================================
   FESTNEST — models/Event.js
   Event model — full schema for campus events
   ============================================================ */

'use strict';

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    /* ── Core Info ── */
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Technical', 'Cultural', 'Hackathon', 'Sports', 'Workshop', 'Management', 'Literary', 'Other'],
    },
    mode: {
      type: String,
      required: [true, 'Event mode is required'],
      enum: ['Online', 'Offline', 'Hybrid'],
    },
    tags: {
      type: [String],
      default: [],
    },

    /* ── Date & Location ── */
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    registrationDeadline: {
      type: Date,
    },
    location: {
      city:    { type: String, trim: true, default: '' },
      state:   { type: String, trim: true, default: '' },
      venue:   { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
      onlineLink: { type: String, trim: true, default: '' },
    },

    /* ── Organizer ── */
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer',
      required: false,  /* Optional: admin-posted events may not have organizer */
    },
    organizerName:  { type: String, trim: true },   /* cached for fast display */
    college:        { type: String, trim: true, required: [true, 'College name is required'] },

    /* ── Media ── */
    posterUrl:       { type: String, default: '' },  /* Cloudinary URL */
    posterPublicId:  { type: String, default: '' },  /* Cloudinary public_id for deletion */
    brochureUrl:     { type: String, default: '' },  /* Cloudinary URL for PDF */
    brochurePublicId:{ type: String, default: '' },

    /* ── Prizes & Fees ── */
    prizes: {
      first:  { type: String, trim: true, default: '' },
      second: { type: String, trim: true, default: '' },
      third:  { type: String, trim: true, default: '' },
      pool:   { type: String, trim: true, default: '' },   /* e.g. "₹1,00,000" */
      other:  { type: String, trim: true, default: '' },
    },
    registrationFee: {
      type: String,
      trim: true,
      default: 'Free',
    },
    registrationLink: {
      type: String,
      trim: true,
      default: '',
    },

    /* ── Rules & Eligibility ── */
    eligibility: { type: String, default: '' },
    rules:        { type: String, default: '' },

    /* ── Contact ── */
    contact: {
      name:    { type: String, trim: true, default: '' },
      phone:   { type: String, trim: true, default: '' },
      email:   { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },

    /* ── Status ── */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },
    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date },

    /* ── Badge / Tag ── */
    badge: {
      type: String,
      enum: ['mega', 'trending', 'new', 'none'],
      default: 'new',
    },

    /* ── Engagement ── */
    views:      { type: Number, default: 0 },
    saves:      { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },

    /* ── Admin ── */
    rejectionReason: { type: String, default: '' },
    approvedAt:      { type: Date },
    approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ── Virtual: formatted location string ── */
EventSchema.virtual('locationStr').get(function () {
  if (this.mode === 'Online') return 'Online';
  const parts = [this.location.city, this.location.state].filter(Boolean);
  return parts.join(', ') || this.location.venue || 'India';
});

/* ── Virtual: is registration open ── */
EventSchema.virtual('isRegistrationOpen').get(function () {
  if (!this.registrationDeadline) return true;
  return new Date() <= this.registrationDeadline;
});

/* ── Auto-generate slug before save ── */
EventSchema.pre('save', async function (next) {
  if (this.isModified('title') || this.isNew) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const suffix = Date.now().toString(36);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

/* ── Indexes for fast queries ── */
EventSchema.index({ status: 1, isActive: 1, startDate: -1 });
EventSchema.index({ category: 1 });
EventSchema.index({ mode: 1 });
EventSchema.index({ organizer: 1 });
EventSchema.index({ college: 'text', title: 'text', description: 'text', tags: 'text' });
EventSchema.index({ isFeatured: 1, status: 1 });
EventSchema.index({ badge: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Event', EventSchema);
