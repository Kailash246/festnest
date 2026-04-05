# Firebase Authentication Migration Plan

## Architecture Overview

```
Firebase (Identity)
    ↓ (ID Token)
Backend API (Bridge)
    ↓ (Create/Find User)
MongoDB (User Data)
    ↓ (Backend JWT)
Frontend (Session)
```

## Implementation Checklist

### Backend
- [ ] Install Firebase Admin SDK
- [ ] Initialize Firebase Admin in server.js or config
- [ ] Add Firebase token verification middleware
- [ ] Create POST /api/auth/firebase-login endpoint
- [ ] Create POST /api/auth/firebase-register endpoint
- [ ] Update User model to store firebaseUid
- [ ] Ensure onboarding saves role to MongoDB

### Frontend
- [ ] Initialize Firebase SDK in index.html
- [ ] Replace login/signup with Firebase methods
- [ ] Create onboarding flow
- [ ] Handle new user detection
- [ ] Keep FN_AUTH session system

### Testing
- [ ] Test email/password signup
- [ ] Test email/password login
- [ ] Test Google login
- [ ] Test onboarding flow
- [ ] Test returning users
- [ ] Test role-based access

## Key Points
- Firebase provides identity
- Backend provides authorization
- Role selection happens during onboarding (backend stores it)
- Existing UI/UX MUST NOT change
- All existing flows must continue working
