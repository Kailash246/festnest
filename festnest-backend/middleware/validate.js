/* ============================================================
   FESTNEST — middleware/validate.js
   Input validation using express-validator
   ============================================================ */

'use strict';

const { body, query, param, validationResult } = require('express-validator');

/* ── Run validation and respond with errors if any ── */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];
    const fieldName = firstError.path;
    const errorMessage = firstError.msg;
    
    console.error(`[Validation] ❌ Error on field "${fieldName}": ${errorMessage}`);
    console.error(`[Validation] All errors:`, errorArray.map(e => `${e.path}: ${e.msg}`).join(' | '));
    
    return res.status(400).json({
      success: false,
      message: errorMessage, // Return the specific error message, not generic
      field: fieldName,      // Include which field failed
      errors: errorArray.map(e => ({ field: e.path, message: e.msg })), // All errors for detailed frontend handling
    });
  }
  next();
};

/* ════════════════════════════════════════
   AUTH VALIDATORS
   ════════════════════════════════════════ */

/* ── REGISTER VALIDATOR — Role-aware validation ── */
const registerValidator = [
  /* Common fields for both roles */
  body('email')
    .trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['student', 'organizer']).withMessage('Role must be "student" or "organizer"'),

  /* ── Role-specific validation ── */
  body('firstName')
    .if((val, ctx) => ctx.req.body.role === 'student')
    .trim().notEmpty().withMessage('First name is required for students')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .if((val, ctx) => ctx.req.body.role === 'student')
    .trim().notEmpty().withMessage('Last name is required for students')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  
  body('college')
    .if((val, ctx) => ctx.req.body.role === 'student')
    .trim().notEmpty().withMessage('College/University is required for students'),
  
  body('year')
    .if((val, ctx) => ctx.req.body.role === 'student')
    .trim().notEmpty().withMessage('Year of study is required for students'),
  
  body('branch')
    .optional()
    .trim().isLength({ max: 50 }).withMessage('Branch cannot exceed 50 characters'),

  /* Organizer-specific fields */
  body('organizationName')
    .if((val, ctx) => ctx.req.body.role === 'organizer')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Organization name cannot exceed 100 characters'),
  
  body('city')
    .if((val, ctx) => ctx.req.body.role === 'organizer')
    .trim().notEmpty().withMessage('City is required for organizers'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\d{7,15}$/, 'g').withMessage('Phone must be 7-15 digits if provided'),
  
  body('state')
    .optional()
    .trim().isLength({ max: 50 }).withMessage('State cannot exceed 50 characters'),

  validate,
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

/* ════════════════════════════════════════
   EVENT VALIDATORS
   ════════════════════════════════════════ */
const createEventValidator = [
  body('title')
    .trim().notEmpty().withMessage('Event title is required')
    .isLength({ max: 120 }).withMessage('Title too long (max 120 chars)'),
  body('description')
    .trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 50 }).withMessage('Description must be at least 50 characters')
    .isLength({ max: 5000 }).withMessage('Description too long'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Technical', 'Cultural', 'Hackathon', 'Sports', 'Workshop', 'Management', 'Literary', 'Other'])
    .withMessage('Invalid category'),
  body('mode')
    .notEmpty().withMessage('Event mode is required')
    .isIn(['Online', 'Offline', 'Hybrid'])
    .withMessage('Mode must be Online, Offline, or Hybrid'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('college')
    .trim().notEmpty().withMessage('College / Organization name is required'),
 body('contact')
  .custom((value) => {
    try {
      const c = typeof value === 'string' ? JSON.parse(value) : value;
      if (!c.name) throw new Error('POC name is required');
      if (!c.phone) throw new Error('POC phone number is required');
      if (!c.email || !/^\S+@\S+\.\S+$/.test(c.email)) throw new Error('Valid POC email is required');
      return true;
    } catch {
      throw new Error('Invalid contact data');
    }
  }),
  validate,
];

const updateEventValidator = [
  body('title').optional().trim().isLength({ max: 120 }).withMessage('Title too long'),
  body('description').optional().isLength({ max: 5000 }).withMessage('Description too long'),
  body('category').optional().isIn(['Technical', 'Cultural', 'Hackathon', 'Sports', 'Workshop', 'Management', 'Literary', 'Other']),
  body('mode').optional().isIn(['Online', 'Offline', 'Hybrid']),
  validate,
];

/* ════════════════════════════════════════
   QUERY VALIDATORS (for list/search endpoints)
   ════════════════════════════════════════ */
const eventQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50').toInt(),
  query('category').optional().isIn(['All', 'Technical', 'Cultural', 'Hackathon', 'Sports', 'Workshop', 'Management', 'Literary', 'Other']),
  query('mode').optional().isIn(['All', 'Online', 'Offline', 'Hybrid']),
  query('sort').optional().isIn(['newest', 'oldest', 'prize', 'popular', 'deadline']),
  validate,
];

const mongoIdValidator = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  createEventValidator,
  updateEventValidator,
  eventQueryValidator,
  mongoIdValidator,
  validate,
};
