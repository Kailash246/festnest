/* ============================================================
   FESTNEST — middleware/auth.js
   UPDATED FOR MULTI-COLLECTION ARCHITECTURE
   - Supports both Student and Organizer models
   - JWT includes role for model detection
   ============================================================ */
'use strict';

const jwt       = require('jsonwebtoken');
const Admin     = require('../models/Admin');
const Student   = require('../models/Student');
const Organizer = require('../models/Organizer');

const generateToken = (id, role = 'student') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
  }

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    /* Determine which collection to query based on role */
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    } else if (decoded.role === 'student') {
      user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'organizer') {
      user = await Organizer.findById(decoded.id).select('-password');
    }

    if (!user)
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] Token error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action.`,
    });
  next();
};

const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('[optionalAuth] No bearer token');
    return next();
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    console.log('[optionalAuth] Token verified:', { role: decoded.role, id: decoded.id });
    
    /* Determine which collection to query based on role */
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    } else if (decoded.role === 'student') {
      user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'organizer') {
      user = await Organizer.findById(decoded.id).select('-password');
    }
    
    if (user) {
      console.log('[optionalAuth] User found:', { id: user._id, role: decoded.role });
      req.user = user;
    } else {
      console.log('[optionalAuth] User not found in DB:', { role: decoded.role, id: decoded.id });
    }
  } catch (err) {
    console.log('[optionalAuth] Token verification failed:', err.message);
  }
  next();
};

module.exports = { protect, authorize, optionalAuth, generateToken };
