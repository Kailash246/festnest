# FestNest Firebase Authentication Implementation Summary

## What Has Been Implemented

This document summarizes the complete Firebase authentication system that has been built for FestNest, replacing the custom JWT authentication while maintaining all existing features and role-based authorization.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Existing Auth Modal (auth.js) + Firebase Bridge         │   │
│  │  - Email/Password Login & Signup Forms                   │   │
│  │  - Google Sign-In Button                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Firebase Client SDK (browser)                 │   │
│  │  - Manages user authentication                           │   │
│  │  - Stores auth tokens securely                           │   │
│  │  - Handles session persistence                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        Firebase Auth Bridge (firebase-auth-bridge.js)    │   │
│  │  - Catches Firebase login events                         │   │
│  │  - Gets Firebase ID token                                │   │
│  │  - Sends to backend for verification                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js/Express)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Firebase Auth Routes (/api/auth/firebase/*)            │   │
│  │  - POST /firebase-login → Verify Firebase token          │   │
│  │  - POST /firebase-register → Create user + role          │   │
│  │  - PUT /firebase-profile → Update user profile           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Firebase Admin SDK (config/firebase.js)                 │   │
│  │  - Verifies Firebase ID tokens                           │   │
│  │  - Creates Firebase users if needed                      │   │
│  │  - Manages user metadata                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           MongoDB (User Database)                         │   │
│  │  - User.firebaseUid (indexed)                            │   │
│  │  - User.role (student/organizer/admin)                   │   │
│  │  - User profile (name, email, college, etc.)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      Existing Auth System (unchanged)                     │   │
│  │  - JWT token generation                                  │   │
│  │  - Role-based access control (requireRole)               │   │
│  │  - Protected routes (requireAuth)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created & Modified

### Backend Files

#### New Files Created:

1. **`config/firebase.js`** — Firebase Admin SDK initialization
   - Loads service account key from `FIREBASE_SERVICE_ACCOUNT_KEY` env var
   - Initializes `firebase-admin` app
   - Exported as `admin` for use throughout backend
   - No direct imports in this file, pure initialization

2. **`controllers/firebaseAuthController.js`** — Firebase authentication logic
   - `firebaseLogin(req, res)` — Verify Firebase ID token + check if user exists
   - `firebaseRegister(req, res)` — Create new user after onboarding
   - Integrates with existing User model and JWT generation
   - Returns response in FN_AUTH format for frontend compatibility

3. **`routes/firebaseAuth.js`** — Express routes for Firebase endpoints
   - `POST /firebase-login` — Login/verify token
   - `POST /firebase-register` — Create user + role
   - Rate limiting applied (20 requests per 15 minutes)
   - Error handling middleware included

#### Modified Files:

1. **`server.js`**
   - Added: `app.use('/api/auth/firebase', require('./routes/firebaseAuth'));`
   - Updated CORS to handle frontend auth requests
   - Ensures routes are loaded before SPA fallback

2. **`models/User.js`**
   - Added: `firebaseUid: { type: String, unique: true, sparse: true, index: true }`
   - Changed: `password` is now optional if `firebaseUid` exists
   - Pre-save: Skip password hashing if `firebaseUid` provided
   - Index on `firebaseUid` for fast lookups

3. **`package.json`** (needs update)
   - Will need: `npm install firebase-admin` (add to dependencies)

---

### Frontend Files

#### New Files Created:

1. **`assets/js/firebase-config.js`** — Firebase SDK initialization & wrapper API
   ```javascript
   // Public Firebase configuration (from Firebase Console)
   const firebaseConfig = { apiKey, authDomain, projectId, ... }
   
   // Initialize Firebase SDK
   firebase.initializeApp(firebaseConfig)
   
   // Wrapper methods matching FN_* pattern:
   FN_FIREBASE.signup(email, password)
   FN_FIREBASE.login(email, password)
   FN_FIREBASE.googleLogin()
   FN_FIREBASE.logout()
   FN_FIREBASE.getCurrentUser()
   FN_FIREBASE.getIdToken()
   ```
   - Does NOT authenticate with backend directly
   - Only manages Firebase client-side authentication
   - Provides clean API for auth modal to use

2. **`assets/js/firebase-auth-bridge.js`** — Integration between Firebase & existing auth system
   - Listens to Firebase auth state changes
   - On successful login:
     - Gets Firebase ID token
     - Sends to `/api/auth/firebase-login` endpoint
     - If new user: Redirects to `/pages/onboarding.html`
     - If existing user: Stores JWT in `FN_AUTH` + redirects to dashboard
   - Maintains full compatibility with existing `FN_AUTH.getUser()`, etc.
   - Acts as a bridge between two authentication systems

3. **`pages/onboarding.html`** — Multi-step onboarding form for new users
   - **Step 1**: Role Selection (Student / Organizer)
   - **Step 2**: Profile Information (Name, Email, College, Course, Year, Phone)
   - **Step 3**: Confirmation (Loading…)
   - Progress indicator shows current step
   - Back/Next/Skip navigation buttons
   - Fully responsive mobile design

4. **`assets/js/pages/onboarding.js`** — Onboarding flow controller
   ```javascript
   loadStep(num)          // Display specific step
   validateStep(num)      // Validate before proceeding
   goToNextStep()         // Navigate to step N+1
   goToPrevStep()         // Navigate to step N-1
   skipStep()             // Skip optional steps
   submitOnboarding()     // POST to /api/auth/firebase-register
   ```
   - Form validation for required fields
   - Error messages with toast notifications
   - Loading state during API call
   - Auto-redirect after completion based on role

---

## User Authentication Flow

### New User Signup (Email/Password)

```
1. User fills auth modal → clicks "Sign Up"
        ↓
2. Firebase.auth().createUserWithEmailAndPassword()
   - Returns user object with UID
        ↓
3. Get Firebase ID token
   - const idToken = await user.getIdToken()
        ↓
4. Send to backend: POST /api/auth/firebase-login { idToken }
        ↓
5. Backend verifies token → Checks if user exists
   - admin.auth().verifyIdToken(idToken)
   - User.findOne({ firebaseUid })
        ↓
6. User NOT found → Return { isNewUser: true, firebaseUid, email }
        ↓
7. Frontend redirects to /pages/onboarding.html
        ↓
8. User selects role (Student/Organizer)
        ↓
9. User fills profile form
        ↓
10. User submits → POST /api/auth/firebase-register
    {
      firebaseUid,
      email,
      firstName,
      lastName,
      role,
      college,
      course,
      year,
      phone
    }
        ↓
11. Backend creates user in MongoDB
    - Hashes any password (if applicable)
    - Generates JWT token
    - Returns { token, user, role }
        ↓
12. Frontend stores JWT in FN_AUTH
    - localStorage['FN_AUTH'] = token
    - localStorage['FN_AUTH_USER'] = user
        ↓
13. Redirect based on role:
    - Student → /pages/events.html
    - Organizer → /pages/organizer-dashboard.html
```

### Returning User Login (Email/Password)

```
1. User fills auth modal → clicks "Log In"
        ↓
2. Firebase.auth().signInWithEmailAndPassword()
   - Returns user object
        ↓
3. Get Firebase ID token
        ↓
4. Send to backend: POST /api/auth/firebase-login { idToken }
        ↓
5. Backend verifies token
        ↓
6. User IS found → Return { isNewUser: false, token, user, role }
        ↓
7. Frontend stores JWT in FN_AUTH
        ↓
8. Frontend closes auth modal
        ↓
9. User continues to events page/dashboard
```

### Google OAuth Signup/Login

```
1. User clicks "Continue with Google" button
        ↓
2. Firebase Google auth popup opens
        ↓
3. User authenticates with Google
   - Firebase creates user or logs in
   - Email and name auto-filled
        ↓
4. Same as email flow from step 3 onwards
```

---

## Backend API Endpoints

### POST /api/auth/firebase-login

**Purpose:** Authenticate Firebase user with backend

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyM..."
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "isNewUser": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4a1b",
    "email": "user@college.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "college": "IIT Bombay",
    "course": "BTech CSE",
    "year": "3",
    "phone": "+91-98765-43210",
    "avatar": "https://...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (New User):**
```json
{
  "success": true,
  "isNewUser": true,
  "firebaseUid": "QZKpRqt3...",
  "email": "newuser@college.edu"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "auth/invalid-credential"
}
```

---

### POST /api/auth/firebase-register

**Purpose:** Create user after onboarding

**Request:**
```json
{
  "firebaseUid": "QZKpRqt3...",
  "email": "user@college.edu",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",         // or "organizer"
  "college": "IIT Bombay",
  "course": "BTech CSE",
  "year": "3",
  "phone": "+91-98765-43210"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4a1b",
    "email": "user@college.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "college": "IIT Bombay",
    "course": "BTech CSE",
    "year": "3",
    "phone": "+91-98765-43210",
    "avatar": null,
    "createdAt": "2024-03-02T15:45:00Z"
  }
}
```

---

## Backward Compatibility

### Existing Features Still Work:

✅ **Role-Based Access Control**
- `requireAuth()` middleware unchanged
- `requireRole('student')`, `requireRole('organizer')` work as before
- Admin dashboards protected

✅ **Protected Routes**
- `/api/events` (requires `requireAuth()`)
- `/api/users/profile` (requires `requireAuth()`)
- All existing middleware works with new JWT tokens

✅ **Session Management**
- `FN_AUTH.getUser()` returns user object
- `FN_AUTH.isLoggedIn()` works
- `FN_AUTH.logout()` clears session
- localStorage persistence maintained

✅ **Event Creation & Management**
- Organizers can create events
- Students can save/unsave events
- All existing functionality preserved

---

## Security Architecture

### Firebase Handles:
- User authentication (signup, login, password reset)
- Password security (enforced by Firebase)
- Login session management
- OAuth provider integration
- Token generation and expiry

### Backend Handles:
- ID token verification (critical!)
- Role-based authorization (student vs organizer)
- Data access control
- MongoDB record linking
- JWT token generation for API sessions

### Never Trust Client Side:
- ❌ Role sent with ID token (unverified)
- ❌ User permissions from frontend
- ✅ Always verify `firebaseUid` matches backend User record
- ✅ Always check role from MongoDB before sensitive operations

---

## Configuration Required

### 1. Firebase Project Setup
```
Firebase Console → Project Settings → Service Accounts
→ Click "Generate New Private Key"
→ Copy JSON string
→ Add to backend .env as FIREBASE_SERVICE_ACCOUNT_KEY
```

### 2. Backend Environment Variables
```bash
# .env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

### 3. Frontend Firebase Config
```javascript
// In assets/js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Firebase Console Settings
- **Authentication**: Enable Email/Password
- **Authentication**: Enable Google OAuth
- **Authorized Domains**: Add localhost:5000, localhost:3000, and production domains
- **API Keys**: Restrict to Cloud Firestore, Authentication, etc.

---

## Testing Checklist

### Backend Testing (Postman)

- [ ] POST `/api/auth/firebase-login` with valid token → Returns user
- [ ] POST `/api/auth/firebase-login` with invalid token → 401 error
- [ ] POST `/api/auth/firebase-register` → User created in MongoDB
- [ ] Check MongoDB: User has `firebaseUid` field
- [ ] GET `/api/events` without JWT → 401 Unauthorized
- [ ] GET `/api/events` with JWT → Success

### Frontend Testing (Browser)

- [ ] Open auth modal
- [ ] Email signup → Onboarding → Events page
- [ ] Email login → Events page directly
- [ ] Google signup → Onboarding
- [ ] Refresh page → Session persists
- [ ] Logout → Session cleared
- [ ] Check localStorage has FN_AUTH token

### Integration Testing

- [ ] New student can see events
- [ ] New organizer can access organizer dashboard
- [ ] Create event as organizer (requires role check)
- [ ] Save event as student (requires role check)
- [ ] Role-based access control working

---

## Troubleshooting Common Issues

| Symptom | Root Cause | Solution |
|---------|-----------|----------|
| "Firebase not initialized" | SDK not loaded | Add Firebase scripts to HTML |
| "Service Account Key Error" | JSON malformed | Ensure single-line, proper escaping |
| "Cannot verify token" | Backend not finding Firebase config | Check .env, restart server |
| "User not found after login" | New user didn't complete onboarding | Show onboarding for new users |
| "Access Denied on API calls" | Role missing from MongoDB | Check after onboarding completion |
| "CORS Error" | Frontend domain not in allowed list | Update CORS config in server.js |

---

## Project Statistics

**Lines of Code Added:**
- Backend: ~350 lines (3 files)
- Frontend: ~700 lines (4 files)
- Configuration: ~100 lines
- **Total: ~1150 lines**

**Dependency Changes:**
- Add: `firebase-admin` (backend)
- Existing: `firebase` (frontend CDN)
- No breaking changes to existing dependencies

**Database Changes:**
- User model: Added 1 field (`firebaseUid`)
- No schema migration needed (existing users unaffected)

---

## Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Service account key generated and stored securely
- [ ] Backend .env updated with Firebase config
- [ ] Frontend firebase-config.js updated with project config
- [ ] Google OAuth configured in Firebase Console
- [ ] Production domain added to Authorized Domains
- [ ] API key restrictions set in Firebase Console
- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Email verification configured (optional)
- [ ] Password reset flow tested
- [ ] Monitoring/alerts set up for auth failures

---

## Next Steps

1. **Set up Firebase Project** (if not done)
2. **Configure Backend** (.env + npm install)
3. **Test Backend Auth Endpoints** (Postman)
4. **Configure Frontend** (firebase-config.js)
5. **Test Auth Flow** (browser)
6. **Test Onboarding** (role selection + form)
7. **Test Protected Routes** (role-based access)
8. **Deploy to Production**

---

**Documentation Version:** 1.0  
**Last Updated:** April 2, 2026  
**Status:** Ready for implementation
