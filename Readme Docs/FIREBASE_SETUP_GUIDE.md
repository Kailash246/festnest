# Firebase Authentication Integration Guide

## Overview

This document provides step-by-step instructions to integrate Firebase authentication into FestNest while maintaining the existing role-based authorization system.

## Architecture

```
User Signs Up/Logs In
        ↓
Firebase Authentication (Email/Password or Google)
        ↓
Backend API Receives Firebase ID Token
        ↓
Backend Verifies Token (Firebase Admin SDK)
        ↓
New User? → Onboarding Flow → Create in MongoDB
        ↓
Generate Backend JWT Token
        ↓
FN_AUTH Session Management (existing system)
        ↓
Access Events, Dashboard, etc.
```

## Implementation Steps

### Step 1: Backend Setup

#### 1.1 Install Firebase Admin SDK
```bash
cd festnest-backend
npm install firebase-admin
```

#### 1.2 Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file safely

#### 1.3 Add to .env

Extract the JSON key and add to `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project"...}'
```

*Note: It must be a single-line JSON string*

#### 1.4 Verify Backend Routes

Your backend now has these new endpoints:
- `POST /api/auth/firebase-login` — Verify token + find user
- `POST /api/auth/firebase-register` — Create user after onboarding
- `PUT /api/auth/firebase-profile` — Update profile

### Step 2: Frontend Setup

#### 2.1 Get Firebase Web Configuration

1. In Firebase Console → **Project Settings** → **Your Apps**
2. Select your web app (or create one)
3. Copy the config object

#### 2.2 Add Firebase Scripts to index.html

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"></script>

<!-- FestNest Firebase Integration -->
<script src="assets/js/firebase-config.js"></script>
<script src="assets/js/firebase-auth-bridge.js"></script>
```

#### 2.3 Configure Firebase in firebase-config.js

Update the config object in `assets/js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abc123def456"
};
```

*Or use environment variables if deployed*

#### 2.4 Update Google Login Button

If you have Google login buttons, add the data attribute:
```html
<button data-auth="google" type="button">Continue with Google</button>
```

Or add the handler class to your existing Google button

### Step 3: Firebase Console Setup

#### 3.1 Enable Email/Password Auth
1. Firebase Console → **Authentication**
2. Click **Sign-in Method**
3. Enable **Email/Password**

#### 3.2 Enable Google Auth
1. **Sign-in Method** → **Google**
2. Enable it
3. Add your domain to **Authorized domains** (localhost, production domain, etc.)

#### 3.3 Set Password Policy
- Minimum 6 characters recommended
- Firebase enforces this on the client

### Step 4: Test the Flow

#### Test New User Signup
```
1. Click "Sign Up Free"
2. Enter email, password, name, college, etc.
3. Should redirect to onboarding
4. Select role (Student/Organizer)
5. Fill profile → Submit
6. Redirect to Events page or Dashboard
```

#### Test Returning User
```
1. Click "Log In"
2. Enter email and password
3. Should redirect to events page directly
```

#### Test Google Login
```
1. Click "Continue with Google"
2. Complete Google auth
3. If new user → onboarding
4. If existing user → redirect to events
```

## File Structure

```
Frontend:
├── assets/
│   ├── js/
│   │   ├── firebase-config.js (Firebase SDK init + auth methods)
│   │   ├── firebase-auth-bridge.js (Integration with auth modal)
│   │   └── pages/
│   │       └── onboarding.js (Onboarding flow logic)
│   └── ...
├── pages/
│   ├── onboarding.html (New onboarding page)
│   └── ...
└── index.html (includes Firebase SDKs)

Backend:
├── config/
│   ├── firebase.js (Firebase Admin setup)
│   └── ...
├── controllers/
│   ├── firebaseAuthController.js (Firebase auth handlers)
│   └── ...
├── routes/
│   ├── firebaseAuth.js (Firebase routes)
│   ├── auth.js (imports firebaseAuth routes)
│   └── ...
├── models/
│   └── User.js (added firebaseUid field)
└── server.js (initializes Firebase)
```

## Key Features

### 1. New User Detection
- Frontend: Sends Firebase token to backend
- Backend: Checks if user exists in MongoDB
- If new: Returns `isNewUser: true`
- Frontend: Redirects to onboarding

### 2. Onboarding Flow
- Role Selection: Student or Organizer
- Profile Info: Name, college, course, year, phone
- Submit: Creates user in MongoDB with role + profile
- Redirect: To events page or organizer dashboard

### 3. Role-Based Access
- Role selected during onboarding
- Stored securely in MongoDB (not trusted from frontend)
- Backend validates role on protected routes
- `requireRole('organizer')` still works

### 4. Session Management
- Backend generates JWT token after onboarding
- FN_AUTH global object stores session (existing system)
- All existing auth guards continue working
- `requireAuth()` and `requireRole()` compatible

### 5. Google Prefill
- Google login auto-fills firstName, lastName
- Email is read-only during onboarding
- Still prompts for role and college info

## Troubleshooting

### Firebase Not Initialized
**Error:** "Firebase not initialized"
- Ensure Firebase SDK scripts are in HTML
- Check firebase-config.js is loaded
- Verify config values are correct

### "Invalid or expired token" on Backend
- Backend Firebase Admin SDK not initialized
- Check FIREBASE_SERVICE_ACCOUNT_KEY in .env
- Verify service account has necessary permissions

### "User not found" After Login
- User logged in but onboarding not completed
- Check MongoDB for user with firebaseUid
- May need to clear localStorage and retry

### Google Login Popup Blocked
- Check browser console for popup blocked message
- Add `http://localhost:5000` to authorized  JavaScript origins in Firebase
- In production, add your domain

## Security Notes

⚠️ **CRITICAL:**
1. Never expose Firebase API key in production source code (use environment variables)
2. Service account key must be stored securely on backend only
3. Role validation must always happen on backend
4. Never trust role from frontend

✅ **Already Handled:**
- Firebase tokens are verified on backend
- Role is stored in MongoDB (not frontend)
- ID token expiry is validated
- Password requirements enforced

## API Response Format

After login/signup, backend returns:
```json
{
  "success": true,
  "isNewUser": false,
  "token": "jwt_token_here",
  "user": {
    "id": "mongodb_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@college.edu",
    "role": "student",
    "college": "IIT Bombay",
    "course": "BTech",
    "year": "3rd",
    "phone": "+91...",
    "avatar": "https://...",
    "interests": [],
    "savedEvents": []
  }
}
```

## Migration from Old Auth

If users still exist with password hashes:
1. They can still log in with email/password (both systems work)
2. Next time they login, update `firebaseUid` in MongoDB
3. Password hashing continues as before

Old auth system remains fully functional alongside Firebase.

## Support

For issues:
1. Check browser console for errors
2. Check backend console for Firebase init message
3. Verify .env variables are set correctly
4. Check Firebase Console for enabled auth methods
5. Test with Postman: `POST /api/auth/firebase-login` with valid token

---

**Last Updated:** April 2, 2026  
**Status:** Ready for implementation
