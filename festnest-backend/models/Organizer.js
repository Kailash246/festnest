/* ============================================================
   FESTNEST — models/Organizer.js
   Organizer model — separate collection for organizers
   ============================================================ */
'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const OrganizerSchema = new mongoose.Schema(
  {
    /* ── Name & Contact ── */
    organizationName: {
      type: String,
      required: [true, 'Organization/College name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,  /* Never returned in queries by default */
    },

    /* ── Location ── */
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },

    /* ── Contact ── */
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{7,15}$/, 'Please enter a valid phone number'],
    },

    /* ── Additional Info ── */
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },

    /* ── Role (always "organizer") ── */
    role: {
      type: String,
      enum: ['organizer'],
      default: 'organizer',
    },

    /* ── Events ── */
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

    /* ── Saved Events (for bookmarking) ── */
    savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

    /* ── Account Status ── */
    isActive:           { type: Boolean, default: true },
    isVerified:         { type: Boolean, default: false },
    verificationToken:  { type: String },
    lastLogin:          { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiry:{ type: Date },
  },
  {
    timestamps: true,  /* createdAt, updatedAt */
    collection: 'organizers',
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpiry;
        delete ret.verificationToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ── Pre-save: hash password ── */
OrganizerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ── Method: compare password ── */
OrganizerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Indexes ── */
OrganizerSchema.index({ email: 1 });
OrganizerSchema.index({ city: 1 });
OrganizerSchema.index({ role: 1 });

module.exports = mongoose.model('Organizer', OrganizerSchema);
