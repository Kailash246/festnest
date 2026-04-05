# Firebase Authentication - Quick Start Guide

**⚡ Start Here: Complete 60-minute implementation**

---

## 📚 Documentation Quicklinks

### 1️⃣ **READ FIRST** — Understanding the Architecture (15 min)
[FIREBASE_IMPLEMENTATION_SUMMARY.md](./FIREBASE_IMPLEMENTATION_SUMMARY.md)
- Architecture diagram
- How Firebase + Backend work together
- All files that were created
- Security model explained

### 2️⃣ **FOLLOW NEXT** — Step-by-Step Implementation (30 min)
[FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
- Phase 1: Backend Setup
- Phase 2: Frontend Setup
- Phase 3: Firebase Console Configuration
- Phase 4: Testing & Troubleshooting

### 3️⃣ **TRACK PROGRESS** — Testing Checklist (15 min)
[FIREBASE_IMPLEMENTATION_CHECKLIST.md](./FIREBASE_IMPLEMENTATION_CHECKLIST.md)
- 10 implementation phases
- Detailed yes/no tasks
- Edge case testing
- Cross-browser verification

### 4️⃣ **REFERENCE** — Configuration Details (5 min)
[festnest-backend/.env.example](./.env.example)
- All environment variables
- How to get each value
- Development vs Production config

---

## 🎯 Implementation Path

### Phase 1: Setup (15 min)
```bash
# 1. Get Firebase Service Account Key
→ Firebase Console → Project Settings → Service Accounts
→ Generate New Private Key
→ Copy JSON key

# 2. Add to backend .env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# 3. Install npm package
cd festnest-backend
npm install firebase-admin
```

### Phase 2: Configure Frontend (10 min)
```javascript
// Update assets/js/firebase-config.js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY_HERE",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

### Phase 3: Firebase Console (5 min)
- [ ] Enable Email/Password authentication
- [ ] Enable Google OAuth
- [ ] Add authorized domains (localhost:5000, production)

### Phase 4: Test (30 min)
```
✅ Backend: POST /api/auth/firebase-login with token
✅ Frontend: Email signup → Onboarding → Events page
✅ Frontend: Email login → Events page directly
✅ Frontend: Google OAuth → Onboarding
✅ Protected Routes: Verify role-based access still works
```

---

## 📂 What Was Built

### Backend Files Created (3)
- `config/firebase.js` — Firebase Admin SDK initialization
- `controllers/firebaseAuthController.js` — Auth logic
- `routes/firebaseAuth.js` — API endpoints

### Backend Files Modified (2)
- `models/User.js` — Added `firebaseUid` field
- `server.js` — Added Firebase routes

### Frontend Files Created (4)
- `assets/js/firebase-config.js` — Firebase SDK wrapper
- `assets/js/firebase-auth-bridge.js` — Integration layer
- `pages/onboarding.html` — Onboarding form (3 steps)
- `assets/js/pages/onboarding.js` — Onboarding logic

### Documentation Files (4)
- `FIREBASE_IMPLEMENTATION_SUMMARY.md` — Architecture & design
- `FIREBASE_SETUP_GUIDE.md` — Step-by-step instructions
- `FIREBASE_IMPLEMENTATION_CHECKLIST.md` — Testing tasks
- `festnest-backend/.env.example` — Configuration reference

---

## 🔗 Authentication Flow

```
User Signup
    ↓
Auth Modal (existing code + Firebase)
    ↓
Firebase Authentication
    ↓
Backend Verification: POST /api/auth/firebase-login
    ↓
    ├─ New User? → Onboarding
    │   ├─ Step 1: Select Role
    │   ├─ Step 2: Fill Profile
    │   └─ Step 3: Confirmation
    │   ↓
    │   Backend: POST /api/auth/firebase-register
    │   ↓
    │   Create User + Generate JWT
    │
    └─ Existing User? → Return JWT directly
            ↓
    Store in FN_AUTH (existing system)
            ↓
    Redirect to Dashboard/Events
```

---

## ✅ Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Email/Password Auth | ✅ Built | Firebase handles passwords securely |
| Google OAuth | ✅ Built | Setup needed in Firebase Console |
| Role Selection | ✅ Built | During onboarding (step 1) |
| Profile Collection | ✅ Built | Name, college, course, year, phone |
| Role-Based Access | ✅ Built | Student vs Organizer vs Admin |
| Session Persistence | ✅ Built | Uses existing FN_AUTH system |
| New User Detection | ✅ Built | Automatic onboarding redirect |
| JWT Generation | ✅ Built | After successful auth |
| Backward Compat | ✅ Built | Old auth system still works |

---

## ⚠️ Critical Checklist

Before considering this done:

- [ ] Firebase project created
- [ ] Service account key obtained
- [ ] .env updated with key
- [ ] firebase-config.js has your project config
- [ ] `npm install firebase-admin` completed
- [ ] Email/Password enabled in Firebase
- [ ] Google OAuth enabled in Firebase
- [ ] Localhost domains added to Firebase
- [ ] Backend server restarted
- [ ] Tested signup → onboarding → dashboard
- [ ] Tested login → dashboard directly
- [ ] Tested Google OAuth
- [ ] Verified role-based routes work
- [ ] Checked protected routes still work
- [ ] Verified localStorage persists session

---

## 🚀 Time Breakdown

| Task | Time |
|------|------|
| Read FIREBASE_IMPLEMENTATION_SUMMARY.md | 15 min |
| Follow FIREBASE_SETUP_GUIDE.md steps | 30 min |
| Test all flows | 20 min |
| Debug any issues | 10 min |
| **Total** | **~75 min** |

Most common setup time: **60 minutes**

---

## 🆘 If Something Goes Wrong

### "Firebase not initialized"
→ Check `assets/js/firebase-config.js` has your config values

### "Service account key error"
→ Check .env has proper JSON (escaped newlines as `\n`)

### "Cannot verify token"
→ Backend not finding Firebase config (check .env, restart server)

### "Onboarding not loading"
→ Check `/pages/onboarding.html` loads without errors
→ Check `/assets/js/pages/onboarding.js` is linked

### "Role not working"
→ Check User created in MongoDB has `role` field
→ Check onboarding form submitted successfully
→ Verify backend JWT contains role

---

## 📖 Document Guide

**For Developers:**
1. Start: FIREBASE_IMPLEMENTATION_SUMMARY.md (understand why)
2. Follow: FIREBASE_SETUP_GUIDE.md (understand how)
3. Test: FIREBASE_IMPLEMENTATION_CHECKLIST.md (verify it works)

**For Operations/DevOps:**
1. Check: FIREBASE_SETUP_GUIDE.md Phase 1 & 2
2. Reference: festnest-backend/.env.example
3. Monitor: FIREBASE_IMPLEMENTATION_CHECKLIST.md Phase 9

**For QA/Testing:**
1. Review: FIREBASE_IMPLEMENTATION_SUMMARY.md (understand flows)
2. Execute: FIREBASE_IMPLEMENTATION_CHECKLIST.md (all test cases)
3. Document: Test results in issue tracker

---

## 🎓 Learning Outcomes

After completing this implementation, you'll know:
- ✅ How Firebase authentication works
- ✅ How to verify Firebase tokens on backend
- ✅ How to integrate Firebase with existing auth systems
- ✅ How to handle new vs returning users
- ✅ How to maintain role-based authorization
- ✅ Best practices for authentication architecture

---

## 📞 Support Resources

**Firebase Documentation:** https://firebase.google.com/docs/auth
**Node.js Express Auth:** https://expressjs.com/
**JWT Overview:** https://jwt.io/
**FestNest Repo:** Check README.md for architecture

---

**Last Updated:** April 2, 2026  
**Implementation Status:** Code Complete, Ready for Setup  
**Estimated Completion:** 60 minutes from reading this guide
