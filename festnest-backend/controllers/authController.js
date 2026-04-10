/* ============================================================
   FESTNEST — controllers/authController.js
   MULTI-COLLECTION ARCHITECTURE
   - Separate Student and Organizer collections
   - Clean, scalable, role-based architecture
   ============================================================ */
'use strict';

const Admin           = require('../models/Admin');
const Student         = require('../models/Student');
const Organizer       = require('../models/Organizer');
const { generateToken } = require('../middleware/auth');


/* ── Unified response handler for all roles ── */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);
  
  /* Build response based on role */
  const userResponse = {
    id:         user._id,
    email:      user.email,
    role:       user.role,
    avatar:     user.avatar || '',
    bio:        user.bio || '',
    isVerified: user.isVerified || false,
  };

  /* Add role-specific fields */
  if (user.role === 'admin') {
    userResponse.firstName = user.firstName;
    userResponse.lastName = user.lastName;
    userResponse.fullName = `${user.firstName} ${user.lastName}`;
    userResponse.phone = user.phone || '';
    userResponse.permissions = user.permissions || [];
  } else if (user.role === 'student') {
    userResponse.firstName = user.firstName;
    userResponse.lastName = user.lastName;
    userResponse.fullName = `${user.firstName} ${user.lastName}`;
    userResponse.college = user.college || '';
    userResponse.branch = user.branch || '';
    userResponse.year = user.year || '';
    userResponse.phone = user.phone || '';
    userResponse.city = user.city || '';
    userResponse.state = user.state || '';
    userResponse.interests = user.interests || [];
    userResponse.savedEvents = user.savedEvents || [];
  } else if (user.role === 'organizer') {
    userResponse.organizationName = user.organizationName;
    userResponse.firstName = user.organizationName;  /* For frontend compatibility */
    userResponse.lastName = '—';
    userResponse.fullName = user.organizationName;
    userResponse.phone = user.phone || '';
    userResponse.city = user.city || '';
    userResponse.state = user.state || '';
    userResponse.branch = user.branch || '';
    userResponse.events = user.events || [];
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse,
  });
};

/* ── POST /api/auth/register ──────────────────────────────── */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, college, branch, year, phone, city, organizationName } = req.body;

    console.log('\n[Register] ═══════════════════════════════════');
    console.log('[Register] 📥 POST received');
    console.log('[Register] Role:', role);
    console.log('[Register] Email:', email ? `${email.substring(0,5)}...` : 'N/A');
    console.log('[Register] Payload keys:', Object.keys(req.body));

    /* ── Validate role is provided ── */
    if (!role || !['student', 'organizer'].includes(role)) {
      console.log('[Register] ❌ Invalid role:', role);
      return res.status(400).json({ 
        success: false, 
        message: 'Valid role is required. Please select "student" or "organizer".' 
      });
    }

    /* ── Common validation (both roles) ── */
    if (!email)    return res.status(400).json({ success: false, message: 'Email is required.' });
    if (!password) return res.status(400).json({ success: false, message: 'Password is required.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    /* ── STUDENT REGISTRATION ── */
    if (role === 'student') {
      console.log('[Register] 👤 Processing STUDENT registration');
      
      /* Student-specific validation */
      if (!firstName) return res.status(400).json({ success: false, message: 'First name is required.' });
      if (!lastName)  return res.status(400).json({ success: false, message: 'Last name is required.' });
      if (!college)   return res.status(400).json({ success: false, message: 'College/University is required.' });
      if (!year)      return res.status(400).json({ success: false, message: 'Year of study is required.' });

      console.log('[Register] ✔ All required fields present for student');

      /* Check if student email already exists */
      const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
      if (existingStudent) {
        console.log('[Register] ⚠️  Email exists in student collection');
        return res.status(400).json({ success: false, message: 'An account with this email already exists in our student records.' });
      }

      /* Also check organizer collection for email uniqueness */
      const existingOrganizer = await Organizer.findOne({ email: email.toLowerCase().trim() });
      if (existingOrganizer) {
        console.log('[Register] ⚠️  Email exists in organizer collection');
        return res.status(400).json({ success: false, message: 'Email already registered as an organizer. Please log in or use a different email.' });
      }

      console.log('[Register] ✔ Email is unique across collections');

      /* Create student document */
      const studentData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
        college: college.trim(),
        year: year.trim(),
        branch: branch ? branch.trim() : '',
        role: 'student',
      };

      console.log('[Register] 🔐 Attempting to create student document');
      let student;
      try {
        student = await Student.create(studentData);
        console.log('[Register] ✅ Student created successfully, ID:', student._id);
      } catch (saveErr) {
        console.error('[Register] ❌ STUDENT SAVE ERROR:', saveErr.name, '—', saveErr.message);
        if (saveErr.name === 'ValidationError') {
          const errors = Object.entries(saveErr.errors).map(([field, error]) => `${field}: ${error.message}`);
          console.error('[Register] 📋 Schema validation failed:', errors.join(' | '));
          return res.status(400).json({ success: false, message: errors.join(' | ') });
        }
        if (saveErr.code === 11000) {
          console.error('[Register] 🔑 Duplicate key error');
          return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email.' });
        }
        throw saveErr;
      }

      return sendTokenResponse(student, 201, res);

    /* ── ORGANIZER REGISTRATION ── */
    } else if (role === 'organizer') {
      console.log('[Register] 🏢 Processing ORGANIZER registration');
      
      /* Organizer-specific validation */
      /* organizationName is now optional - removed from form */
      if (!city)             return res.status(400).json({ success: false, message: 'City is required.' });
      
      /* Phone is optional but must be exactly 10 digits if provided */
      if (phone && !/^\d{10}$/.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits.' });
      }

      console.log('[Register] ✔ All required fields present for organizer');

      /* Check if organizer email already exists */
      const existingOrganizer = await Organizer.findOne({ email: email.toLowerCase().trim() });
      if (existingOrganizer) {
        console.log('[Register] ⚠️  Email exists in organizer collection');
        return res.status(400).json({ success: false, message: 'An account with this email already exists in our organizer records.' });
      }

      /* Also check student collection for email uniqueness */
      const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
      if (existingStudent) {
        console.log('[Register] ⚠️  Email exists in student collection');
        return res.status(400).json({ success: false, message: 'Email already registered as a student. Please log in or use a different email.' });
      }

      console.log('[Register] ✔ Email is unique across collections');

      /* Create organizer document */
      /* Frontend sends org name as 'firstName' for compatibility */
      const organizerData = {
        organizationName: firstName ? firstName.trim() : (organizationName ? organizationName.trim() : ''),
        email: email.toLowerCase().trim(),
        password,
        city: city.trim(),
        phone: phone ? phone.trim() : '',
        branch: branch ? branch.trim() : '',
        role: 'organizer',
      };

      console.log('[Register] 🔐 Attempting to create organizer document');
      let organizer;
      try {
        organizer = await Organizer.create(organizerData);
        console.log('[Register] ✅ Organizer created successfully, ID:', organizer._id);
      } catch (saveErr) {
        console.error('[Register] ❌ ORGANIZER SAVE ERROR:', saveErr.name, '—', saveErr.message);
        if (saveErr.name === 'ValidationError') {
          const errors = Object.entries(saveErr.errors).map(([field, error]) => `${field}: ${error.message}`);
          console.error('[Register] 📋 Schema validation failed:', errors.join(' | '));
          return res.status(400).json({ success: false, message: errors.join(' | ') });
        }
        if (saveErr.code === 11000) {
          console.error('[Register] 🔑 Duplicate key error');
          return res.status(400).json({ success: false, message: 'Email already exists. Please use a different email.' });
        }
        throw saveErr;
      }

      return sendTokenResponse(organizer, 201, res);
    }

  } catch (err) { 
    console.error('[Register] ❌ UNEXPECTED ERROR:', err.name, '—', err.message);
    console.error('[Register] Stack:', err.stack);

    /* Handle validation errors from schema */
    if (err.name === 'ValidationError') {
      const errors = Object.entries(err.errors).map(([field, error]) => error.message);
      const message = errors.join(' | ');
      console.error('[Register] 📋 Validation:', message);
      return res.status(400).json({ success: false, message });
    }
    
    /* Handle duplicate key error (email already exists) */
    if (err.code === 11000) {
      console.error('[Register] 🔑 Duplicate key - email exists');
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ success: false, message: `A user with this ${field} already exists. Please use a different ${field} or login.` });
    }
    
    /* Handle other errors */
    console.error('[Register] 💥 Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
};

/* ── POST /api/auth/login ─────────────────────────────────── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    console.log('[Login] 🔐 Attempting login for:', email.substring(0, 5) + '...');

    /* Try to find in ADMIN collection FIRST */
    let user = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    let userType = 'admin';

    /* If not found, try Student collection */
    if (!user) {
      user = await Student.findOne({ email: email.toLowerCase().trim() }).select('+password');
      userType = 'student';
    }

    /* If still not found, try Organizer collection */
    if (!user) {
      user = await Organizer.findOne({ email: email.toLowerCase().trim() }).select('+password');
      userType = 'organizer';
    }

    /* User not found in any collection */
    if (!user) {
      console.log('[Login] ❌ User not found in any collection');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    /* Check if account is active */
    if (!user.isActive) {
      console.log('[Login] 🚫 Account deactivated');
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    /* Verify password */
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('[Login] ❌ Invalid password for', userType, 'user');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    /* Update last login */
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    console.log('[Login] ✅ Login successful - ' + userType + ' user:', user._id);
    sendTokenResponse(user, 200, res);

  } catch (err) { 
    console.error('[Login] ❌ Error:', err.message);
    next(err); 
  }
};

/* ── GET /api/auth/me  (protected) ───────────────────────── */
exports.getMe = async (req, res, next) => {
  try {
    /* req.user already contains the user from middleware */
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    let user = req.user;

    /* Optionally populate role-specific relationships */
    if (req.user.role === 'student' && req.user.savedEvents) {
      // savedEvents already populated if needed in middleware
    } else if (req.user.role === 'organizer' && req.user.events) {
      // events already populated if needed
    }

    /* Return fresh user data */
    const userResponse = {
      id:         user._id,
      email:      user.email,
      role:       user.role,
      avatar:     user.avatar || '',
      bio:        user.bio || '',
      isVerified: user.isVerified || false,
    };

    if (user.role === 'student') {
      userResponse.firstName    = user.firstName;
      userResponse.lastName     = user.lastName;
      userResponse.fullName     = `${user.firstName} ${user.lastName}`;
      userResponse.college      = user.college || '';
      userResponse.branch       = user.branch || '';
      userResponse.year         = user.year || '';
      userResponse.phone        = user.phone || '';
      userResponse.city         = user.city || '';
      userResponse.state        = user.state || '';
      userResponse.interests    = user.interests || [];
      userResponse.savedEvents  = user.savedEvents || [];
    } else if (user.role === 'organizer') {
      userResponse.organizationName = user.organizationName;
      userResponse.firstName        = user.organizationName;
      userResponse.lastName         = '—';
      userResponse.fullName         = user.organizationName;
      userResponse.phone            = user.phone || '';
      userResponse.city             = user.city || '';
      userResponse.state            = user.state || '';
      userResponse.branch           = user.branch || '';
      userResponse.events           = user.events || [];
    }

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (err) { next(err); }
};

/* ── PUT /api/auth/update-profile  (protected) ────────────── */
exports.updateProfile = async (req, res, next) => {
  try {
    /* Determine model based on role */
    const Model = req.user.role === 'student' ? Student : Organizer;
    
    /* Define allowed fields based on role */
    const studentFields = ['firstName','lastName','college','branch','year','phone','city','state','bio','interests','avatar'];
    const organizerFields = ['organizationName','phone','city','state','bio','branch','avatar'];
    
    const allowedFields = req.user.role === 'student' ? studentFields : organizerFields;
    const updates = {};
    
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates[f] = req.body[f];
      }
    });

    const user = await Model.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully.', 
      user 
    });
  } catch (err) { next(err); }
};

/* ── PUT /api/auth/change-password  (protected) ───────────── */
/* ── PUT /api/auth/change-password  (protected) ───────────── */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Current and new password required (min 8 chars).' });
    }

    /* Determine model based on role */
    const Model = req.user.role === 'student' ? Student : Organizer;
    
    const user = await Model.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};
