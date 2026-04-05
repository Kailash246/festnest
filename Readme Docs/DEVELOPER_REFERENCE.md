# Firebase Integration - Developer Reference Card

Quick reference for developers implementing Firebase authentication in FestNest.

---

## 🏗️ Architecture Layers

```
┌─────────────────────────┐
│   Auth Modal (auth.js)   │  [existing code, unmodified]
│   + Firebase Bridge      │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  Firebase Client SDK     │  [firebase.initializeApp()]
│  (browser session)       │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  Backend API             │  [/api/auth/firebase/*]
│  Firebase Admin SDK      │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│  MongoDB User Record     │  [User model with firebaseUid]
└─────────────────────────┘
```

---

## 🔑 Key Code Patterns

### Pattern 1: Firebase Client Signup
```javascript
// In auth.js or auth modal
const email = "user@college.edu";
const password = "StrongPassword123";

firebase.auth().createUserWithEmailAndPassword(email, password)
  .then(userCredential => {
    const user = userCredential.user;
    // Get ID token for backend verification
    return user.getIdToken();
  })
  .then(idToken => {
    // Send to backend for verification
    fetch('/api/auth/firebase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    })
    .then(res => res.json())
    .then(data => {
      if (data.isNewUser) {
        // Redirect to onboarding
        window.location.href = '/pages/onboarding.html';
      } else {
        // Existing user, store JWT
        FN_AUTH.setToken(data.token);
        FN_AUTH.setUser(data.user);
      }
    });
  })
  .catch(error => {
    // Handle Firebase errors
    showError(error.message);
  });
```

### Pattern 2: Firebase Admin Token Verification (Backend)
```javascript
// In firebaseAuthController.js
const admin = require('../config/firebase');
const User = require('../models/User');

exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // 1. Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    
    // 2. Find user in MongoDB
    const user = await User.findOne({ firebaseUid: uid });
    
    if (user) {
      // 3. Existing user - return JWT
      const token = generateToken(user._id);
      res.json({
        success: true,
        isNewUser: false,
        token,
        user: user.toJSON()
      });
    } else {
      // 4. New user - signal onboarding
      res.json({
        success: true,
        isNewUser: true,
        firebaseUid: uid,
        email
      });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
```

### Pattern 3: Onboarding Form Submission
```javascript
// In assets/js/pages/onboarding.js
async function submitOnboarding() {
  const formData = {
    firebaseUid: sessionStorage.getItem('firebaseUid'),
    email: document.getElementById('email').value,
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    role: document.getElementById('role').value,
    college: document.getElementById('college').value,
    course: document.getElementById('course').value,
    year: document.getElementById('year').value,
    phone: document.getElementById('phone').value
  };

  try {
    const response = await fetch('/api/auth/firebase-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      // Store JWT for session
      FN_AUTH.setToken(data.token);
      FN_AUTH.setUser(data.user);

      // Redirect based on role
      if (data.user.role === 'organizer') {
        window.location.href = '/pages/organizer-dashboard.html';
      } else {
        window.location.href = '/pages/events.html';
      }
    } else {
      showError(data.message);
    }
  } catch (error) {
    showError('Failed to complete onboarding');
  }
}
```

### Pattern 4: Firebase Admin SDK Initialization
```javascript
// In config/firebase.js
const admin = require('firebase-admin');

// Get service account from environment
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

console.log('✅ Firebase initialized');

module.exports = admin;
```

### Pattern 5: User Model with Firebase Support
```javascript
// In models/User.js
const userSchema = new Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Optional if Firebase user
    }
  },
  firstName: String,
  lastName: String,
  role: {
    type: String,
    enum: ['student', 'organizer', 'admin'],
    required: true
  },
  college: String,
  course: String,
  year: String,
  phone: String
});

// Skip password hashing for Firebase users
userSchema.pre('save', async function(next) {
  if (this.firebaseUid) {
    return next(); // Don't hash password for Firebase users
  }
  // Hash password for non-Firebase users
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
```

---

## 🎯 Function Reference

### Frontend Functions

#### `FN_FIREBASE.signup(email, password)`
```javascript
// Create Firebase user with email/password
const user = await FN_FIREBASE.signup('user@college.edu', 'Password123');
// Returns: Firebase User object OR throws error
```

#### `FN_FIREBASE.login(email, password)`
```javascript
// Sign in Firebase user
const user = await FN_FIREBASE.login('user@college.edu', 'Password123');
// Returns: Firebase User object OR throws error
```

#### `FN_FIREBASE.googleLogin()`
```javascript
// Sign in with Google OAuth
const user = await FN_FIREBASE.googleLogin();
// Returns: Firebase User object with Google data OR throws error
```

#### `FN_FIREBASE.getIdToken()`
```javascript
// Get current session's ID token (expires in 1 hour)
const token = await FN_FIREBASE.getIdToken();
// Returns: JWT string for backend verification
```

#### `FN_FIREBASE.logout()`
```javascript
// Sign out current user
FN_FIREBASE.logout();
// Clears Firebase session, doesn't clear FN_AUTH (do separately)
```

#### `FN_FIREBASE.getCurrentUser()`
```javascript
// Get currently logged in Firebase user
const user = FN_FIREBASE.getCurrentUser();
// Returns: Firebase User object or null if not logged in
```

### Backend Functions

#### `firebaseAuthController.firebaseLogin(req, res)`
**Purpose:** Verify Firebase token and find or flag user
**Input:**
```json
{ "idToken": "eyJhbGci..." }
```
**Output (Existing User):**
```json
{
  "success": true,
  "isNewUser": false,
  "token": "jwt_token",
  "user": { ...user object }
}
```
**Output (New User):**
```json
{
  "success": true,
  "isNewUser": true,
  "firebaseUid": "uid",
  "email": "user@college.edu"
}
```

#### `firebaseAuthController.firebaseRegister(req, res)`
**Purpose:** Create user after onboarding
**Input:**
```json
{
  "firebaseUid": "uid",
  "email": "user@college.edu",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "college": "IIT Bombay",
  "course": "BTech",
  "year": "3",
  "phone": "+91..."
}
```
**Output:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { ...user with all fields }
}
```

---

## 🧪 Testing Code Snippets

### Test 1: Verify Firebase Config
```javascript
// In browser console
console.log(firebase.app().name); // Should show "[DEFAULT]"
console.log(FN_FIREBASE); // Should show object with methods
```

### Test 2: Test Signup Flow
```javascript
// In browser console
FN_FIREBASE.signup('test@college.edu', 'Test123456')
  .then(user => console.log('Signed up:', user.email))
  .catch(err => console.error('Error:', err.message));
```

### Test 3: Get ID Token
```javascript
// In browser console
FN_FIREBASE.getIdToken()
  .then(token => {
    console.log('ID Token:', token);
    // Now can send to backend
  })
  .catch(err => console.error('Error:', err));
```

### Test 4: Backend Token Verification (Postman)
```
POST /api/auth/firebase-login
Content-Type: application/json

{
  "idToken": "<copy-from-browser-console>"
}
```

### Test 5: Verify Database
```javascript
// In MongoDB shell or Compass
db.users.findOne({ firebaseUid: "uid_here" })

// Should show:
{
  _id: ObjectId,
  firebaseUid: "QZKpRqt3...",
  email: "user@college.edu",
  firstName: "John",
  role: "student",
  ...
}
```

---

## 🔐 Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Service account key in .env | [ ] | Must be added to .gitignore |
| Firebase config hardcoded | [ ] | Must use env vars in production |
| Role verified on backend | [ ] | Never trust frontend role value |
| ID token verified | [ ] | Always verify before using |
| Password optional for Firebase | [ ] | Check User model |
| JWT token in response | [ ] | Should be returned after auth |
| CORS configured | [ ] | Frontend domain must be allowed |
| Rate limiting on auth | [ ] | Prevent brute force attacks |
| Email unique | [ ] | Enforce at DB and Firebase level |
| Old auth system deprecated | [ ] | Still functional as fallback |

---

## 🐛 Common Debugging Steps

### Bundle includes old auth code and new Firebase code (OK)
- Firebase integration is additive, doesn't break old auth
- Both systems can coexist during rollout

### New user gets JWT but can't access protected routes
- Check if role is in MongoDB (not in token)
- Verify `requireRole()` middleware checks DB
- Test: `GET /api/user` to see what data backend has

### Onboarding form doesn't submit
- Check browser console for errors
- Verify fetch is sending to correct endpoint
- Check backend logs for 400/500 errors
- Review form validation logic

### User logs in but session doesn't persist
- Check localStorage for `FN_AUTH` key
- Verify `FN_AUTH.setToken()` was called
- Check browser privacy settings (3rd party cookies)
- Try incognito/private mode

### Firebase token verification fails
- Check service account key JSON format
- Verify environment variable is set
- Restart backend after changing .env
- Check Firebase console for token issues

---

## 📊 Data Flow Diagrams

### New User Signup Data Flow
```
Browser
  ├─ Email/Password form
  ├─ Firebase.auth().createUserWithEmailAndPassword()
  │   └─ Returns Firebase User + UID
  ├─ user.getIdToken()
  │   └─ Returns JWT ID token
  └─ POST /api/auth/firebase-login { idToken }

Backend
  ├─ admin.auth().verifyIdToken(idToken)
  │   └─ Returns { uid, email, ...}
  ├─ User.findOne({ firebaseUid: uid })
  │   └─ Returns null (new user)
  └─ Response: { isNewUser: true, firebaseUid, email }

Browser
  ├─ Sees isNewUser flag
  ├─ Redirect to /pages/onboarding.html
  └─ Pass firebaseUid in sessionStorage

Onboarding Page
  ├─ User selects role
  ├─ User fills profile form
  └─ POST /api/auth/firebase-register { firebaseUid, email, firstName, ... }

Backend
  ├─ Create User document in MongoDB
  ├─ generateToken(userId)
  │   └─ Returns JWT
  └─ Response: { token, user }

Browser
  ├─ FN_AUTH.setToken(token)
  ├─ FN_AUTH.setUser(user)
  └─ Redirect to /pages/events.html (or organizer-dashboard)
```

### Returning User Login Data Flow
```
Browser
  ├─ Email/Password form
  ├─ Firebase.auth().signInWithEmailAndPassword()
  │   └─ Returns Firebase User
  ├─ user.getIdToken()
  │   └─ Returns JWT ID token
  └─ POST /api/auth/firebase-login { idToken }

Backend
  ├─ admin.auth().verifyIdToken(idToken)
  │   └─ Returns { uid, email, ... }
  ├─ User.findOne({ firebaseUid: uid })
  │   └─ Returns existing User document
  ├─ generateToken(userId)
  │   └─ Returns JWT
  └─ Response: { isNewUser: false, token, user }

Browser
  ├─ FN_AUTH.setToken(token)
  ├─ FN_AUTH.setUser(user)
  ├─ Close auth modal
  └─ User already on correct page
```

---

## 📝 Code Location Reference

| Task | File | Function |
|------|------|----------|
| Firebase Client Init | assets/js/firebase-config.js | FN_FIREBASE object |
| Firebase Bridge | assets/js/firebase-auth-bridge.js | Integration logic |
| Onboarding UI | pages/onboarding.html | HTML structure |
| Onboarding Ctrl | assets/js/pages/onboarding.js | Form handling |
| Backend Init | config/firebase.js | admin.initializeApp() |
| Backend Login | controllers/firebaseAuthController.js | firebaseLogin() |
| Backend Register | controllers/firebaseAuthController.js | firebaseRegister() |
| Routes | routes/firebaseAuth.js | Express endpoints |
| Model | models/User.js | User schema |

---

## ⭐ Pro Tips

1. **Use browser console to test Firebase before backend**
   - Test signup, getIdToken, logout
   - Verify Firebase is initialized

2. **Add console.log in onboarding submit**
   - Check what data is being sent
   - Verify fetch is reaching backend

3. **Check MongoDB directly**
   - Verify user created with correct fields
   - Confirm role is saved

4. **Test role-based routes with Postman**
   - Create event (requires organizer role)
   - Should return 403 if student
   - Should work if organizer

5. **Keep old auth working during rollout**
   - New users through Firebase
   - Existing users can still use old system
   - Cutover when ready

6. **Monitor JWT token size**
   - If token > 8KB, might cause issues
   - Check what data is being encoded

---

**Last Updated:** April 2, 2026  
**Version:** 1.0 
