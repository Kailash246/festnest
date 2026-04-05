/* ============================================================
   FESTNEST — models/Admin.js
   Admin model — separate collection for administrators
   ============================================================ */
'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
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
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,  /* Never returned in queries by default */
    },

    /* ── Role (always "admin") ── */
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },

    /* ── Profile ── */
    avatar:    { type: String, default: '' },   /* Cloudinary URL */
    bio:       { type: String, maxlength: 500, default: '' },
    phone:     { type: String, trim: true, default: '' },

    /* ── Admin permissions ── */
    permissions: {
      type: [String],
      enum: ['manage-events', 'manage-users', 'manage-reports', 'view-analytics', 'send-emails'],
      default: ['manage-events', 'manage-users', 'manage-reports', 'view-analytics'],
    },

    /* ── Account Status ── */
    isActive:           { type: Boolean, default: true },
    isVerified:         { type: Boolean, default: true },
    lastLogin:          { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiry:{ type: Date },
  },
  {
    timestamps: true,  /* createdAt, updatedAt */
    collection: 'admins',
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
AdminSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/* ── Pre-save: hash password ── */
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ── Method: compare password ── */
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Indexes ── */
AdminSchema.index({ email: 1 });
AdminSchema.index({ role: 1 });

module.exports = mongoose.model('Admin', AdminSchema);
