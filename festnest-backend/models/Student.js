/* ============================================================
   FESTNEST — models/Student.js
   Student model — separate collection for students
   ============================================================ */
'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const StudentSchema = new mongoose.Schema(
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

    /* ── Academic Profile ── */
    college: {
      type: String,
      required: [true, 'College/University is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year of study is required'],
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },

    /* ── Role (always "student") ── */
    role: {
      type: String,
      enum: ['student'],
      default: 'student',
    },

    /* ── Additional Profile ── */
    avatar:    { type: String, default: '' },   /* Cloudinary URL */
    bio:       { type: String, maxlength: 300, default: '' },
    phone:     { type: String, trim: true, default: '' },
    city:      { type: String, trim: true, default: '' },
    state:     { type: String, trim: true, default: '' },

    /* ── Interests ── */
    interests: {
      type: [String],
      enum: ['Hackathon', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Management', 'Literary'],
      default: [],
    },

    /* ── Saved Events ── */
    savedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

    /* ── Account Status ── */
    isActive:           { type: Boolean, default: true },
    isVerified:         { type: Boolean, default: false },
    lastLogin:          { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiry:{ type: Date },
  },
  {
    timestamps: true,  /* createdAt, updatedAt */
    collection: 'students',
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
StudentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/* ── Pre-save: hash password ── */
StudentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ── Method: compare password ── */
StudentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Indexes ── */
StudentSchema.index({ email: 1 });
StudentSchema.index({ college: 1 });
StudentSchema.index({ role: 1 });

module.exports = mongoose.model('Student', StudentSchema);
