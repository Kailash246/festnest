/* ============================================================
   FESTNEST — models/User.js
   User model — students and organizers
   ============================================================ */

'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    /* ── Identity ── */
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
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
      required: function() {
        /* Password required only if not a Firebase user */
        return !this.firebaseUid;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,  /* Never returned in queries by default */
    },
    
    /* ── Firebase Auth (optional, for Firebase users) ── */
    firebaseUid: {
      type: String,
      default: null,
      sparse: true,  /* Allow null values, but email must be unique if present */
    },

    /* ── Role ── */
    role: {
      type: String,
      enum: ['student', 'organizer', 'admin'],
      default: 'student',
    },

    /* ── Profile ── */
    college: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state:     { type: String, trim: true, default: '' },
    avatar:    { type: String, default: '' },   /* Cloudinary URL */
    bio:       { type: String, maxlength: 300, default: '' },

    /* ── Interests (for students) ── */
    interests: {
      type: [String],
      enum: ['Hackathon', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Management', 'Literary'],
      default: [],
    },

    /* ── Saved Events ── */
    savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

    /* ── College/Org verified (for organizers) ── */
    isVerified: { type: Boolean, default: false },
    organizationName: {
      type: String,
      trim: true,
      default: '',
    },

    /* ── Auth ── */
    isActive:           { type: Boolean, default: true },
    lastLogin:          { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiry:{ type: Date },
  },
  {
    timestamps: true,  /* createdAt, updatedAt */
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpiry;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ── Virtual: full name ── */
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/* ── Pre-save: hash password (only for non-Firebase users) ── */
UserSchema.pre('save', async function (next) {
  /* Skip hashing if Firebase user or password not modified */
  if (this.firebaseUid || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ── Method: compare password ── */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Index ── */
UserSchema.index({ email: 1 });
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ college: 1 });

module.exports = mongoose.model('User', UserSchema);
