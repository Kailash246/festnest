# Firebase Implementation Checklist

## Phase 1: Backend Configuration

### Firebase Setup
- [ ] Create Firebase project (if not already done)
- [ ] Generate service account key from Firebase Console
- [ ] Install firebase-admin: `npm install firebase-admin`
- [ ] Create `.env` entry: `FIREBASE_SERVICE_ACCOUNT_KEY='...json...'`
- [ ] Verify `config/firebase.js` loads admin SDK without errors

### Backend Integration
- [ ] Verify `controllers/firebaseAuthController.js` exists
- [ ] Verify `routes/firebaseAuth.js` exists
- [ ] Check `server.js` has `app.use('/api/auth/firebase', ...)`
- [ ] Test endpoint: `POST /api/auth/firebase-login` with valid token
- [ ] Test endpoint: `POST /api/auth/firebase-register` with onboarding data
- [ ] Verify JWT response format matches FN_AUTH expectations

### Database
- [ ] Verify User model has `firebaseUid` field (indexed)
- [ ] Verify password can be optional for Firebase users
- [ ] Test: Create Firebase user in MongoDB
- [ ] Test: Check duplicate entry prevention

---

## Phase 2: Frontend Infrastructure

### Firebase SDK Setup
- [ ] Add Firebase SDK script tags to `index.html`:
  - `firebase-app.js`
  - `firebase-auth.js`
- [ ] Update config in `assets/js/firebase-config.js` with your Firebase credentials
- [ ] Verify `FN_FIREBASE` global object works in browser console
- [ ] Test `FN_FIREBASE.signup()`, `FN_FIREBASE.login()`, `FN_FIREBASE.getIdToken()`

### Backend Integration Layer
- [ ] Verify `assets/js/firebase-auth-bridge.js` exists
- [ ] Verify auth modal integration works
- [ ] Test: Submit form in auth modal → Firebase → Backend → Response
- [ ] Test: New user detected correctly (isNewUser flag)
- [ ] Test: Redirect to onboarding for new users

---

## Phase 3: Onboarding Flow

### Onboarding UI
- [ ] Verify `pages/onboarding.html` exists
- [ ] Check all 3 steps render correctly and look good
- [ ] Verify progress indicator shows correct step
- [ ] Test: Navigate between steps with Back/Next buttons
- [ ] Test: All form fields visible and accessible

### Onboarding Logic
- [ ] Verify `assets/js/pages/onboarding.js` exists
- [ ] Test: Step 1 (role selection) validation
- [ ] Test: Step 2 (profile form) validation
- [ ] Test: Required fields enforced
- [ ] Test: Submit button shows loading state
- [ ] Test: Success/error messages display correctly
- [ ] Test: Redirect to correct page based on role:
  - Student → `/pages/events.html`
  - Organizer → `/pages/organizer-dashboard.html`

### Form Validation
- [ ] Email format validated
- [ ] Required fields enforced (firstName, lastName, college, year)
- [ ] Phone number format checked (optional but validated if provided)
- [ ] Error messages clear and helpful

---

## Phase 4: Integration Testing

### New User Signup Flow
- [ ] Email/password signup in auth modal
- [ ] Onboarding page loads
- [ ] Role selection works
- [ ] Profile form submits
- [ ] User created in MongoDB with all fields
- [ ] Correct dashboard loads after
- [ ] `FN_AUTH.getUser()` returns user data
- [ ] Page shows authenticated state

### Returning User Login
- [ ] Login with existing email/password
- [ ] Skips onboarding (goes straight to dashboard)
- [ ] `FN_AUTH.getUser()` returns stored user data
- [ ] All user features work (create event, save event, etc.)

### Google OAuth Flow
- [ ] Google auth button works
- [ ] Google popup opens and closes correctly
- [ ] Email and name prefilled in onboarding
- [ ] Rest of flow works same as email signup
- [ ] User created with googleAuth indicator (optional)

### Session & Persistence
- [ ] Refresh page → user still logged in
- [ ] Close browser → localStorage persists FN_AUTH
- [ ] Open in new tab → session still valid
- [ ] Logout button clears session
- [ ] Login again → new session created

### Protected Routes
- [ ] Unauthenticated users redirected to login
- [ ] `requireAuth()` middleware works
- [ ] `requireRole('student')` restricts access
- [ ] `requireRole('organizer')` restricts access
- [ ] Admin routes protected

---

## Phase 5: Firebase Console Configuration

### Authentication Methods
- [ ] Email/Password enabled
- [ ] Google OAuth enabled
- [ ] Other methods enabled (optional): Apple, Facebook, etc.

### Security Rules
- [ ] Authorized domains added:
  - [ ] `localhost:3000` (if dev frontend)
  - [ ] `localhost:5000` (if dev backend)
  - [ ] Your production domain
- [ ] API key restrictions set (optional but recommended)

### Testing
- [ ] Test from localhost:5000
- [ ] Test from localhost:3000 (if separate)
- [ ] Test from production domain
- [ ] Clear cookies and test incognito mode

---

## Phase 6: Error Handling

### Frontend Error Cases
- [ ] Invalid email format shows error
- [ ] Weak password shows Firebase message
- [ ] Account already exists shows error
- [ ] Network error shows retry message
- [ ] Firebase init error shows helpful message
- [ ] Backend token verification failure shows "Invalid login"

### Backend Error Cases
- [ ] Invalid Firebase token returns 401
- [ ] Missing required fields returns 400
- [ ] Duplicate email returns 400
- [ ] Service account key missing returns 500
- [ ] Firebase admin SDK error returns 500

### User-Facing Messages
- [ ] All errors clear and non-technical
- [ ] Toast notifications appear (not alerts)
- [ ] Error messages auto-clear after 5 seconds
- [ ] Loading states show during API calls

---

## Phase 7: Mobile Responsiveness

### Onboarding Mobile
- [ ] Onboarding form is mobile-friendly
- [ ] Input fields are full width
- [ ] Buttons are large enough to tap
- [ ] No horizontal scrolling
- [ ] Progress indicator visible on mobile
- [ ] Keyboard behavior correct (no overlaps)

### Auth Modal Mobile
- [ ] Auth modal is readable on small screens
- [ ] Form inputs accessible
- [ ] Buttons tappable (40px+ height)
- [ ] Error messages don't overlap
- [ ] Smooth scrolling if form taller than viewport

---

## Phase 8: Performance & Analytics

### Page Load
- [ ] Firebase SDK loads without blocking
- [ ] Auth modal opens quickly (<500ms)
- [ ] Onboarding page loads quickly
- [ ] No console errors on load

### Form Submission
- [ ] Login completes within 2-3 seconds (typical)
- [ ] Register → Onboarding → Submit takes <5 seconds
- [ ] No double-submit on fast clicks
- [ ] Loading indicators show during delays

### Resources
- [ ] Firebase SDK ~80KB (inline scripts)
- [ ] Auth modal doesn't reload page
- [ ] Onboarding doesn't cause memory leaks
- [ ] Session persists efficiently

---

## Phase 9: Documentation & Cleanup

### Code Quality
- [ ] Remove console.log debugging statements
- [ ] Add JSDoc comments to new functions
- [ ] Check for unused variables
- [ ] Verify error handling is complete

### Documentation
- [ ] FIREBASE_SETUP_GUIDE.md created ✅
- [ ] Architecture diagram in README
- [ ] API endpoints documented
- [ ] Environment variables documented

### Deployment Configuration
- [ ] .env.example created with required variables
- [ ] Firebase config not hardcoded in production
- [ ] Service account key stored securely
- [ ] Deployment guide written

---

## Phase 10: Edge Cases & Final Testing

### Edge Cases
- [ ] User signs up as Student, tries to access organizer routes
- [ ] User changes email in Firebase, syncs to app
- [ ] Rate limiting works (too many login attempts)
- [ ] Session expires correctly after logout
- [ ] Multiple tabs: logout in one tab updates others
- [ ] Browser back button after logout works

### Cross-Browser Testing
- [ ] Chrome - ✅ / ❌
- [ ] Firefox - ✅ / ❌
- [ ] Safari - ✅ / ❌
- [ ] Edge - ✅ / ❌
- [ ] Mobile Chrome - ✅ / ❌
- [ ] Mobile Safari - ✅ / ❌

### Final Verification
- [ ] All original features still work
- [ ] No "Access Denied" errors on valid routes
- [ ] Role system works correctly
- [ ] No regressions in existing functionality

---

## Rollback Plan

If Firebase implementation causes critical issues:

1. **Immediate**: Revert `server.js` to remove Firebase routes
2. **Revert auth modal** to use old `FN_AUTH_API.login/register`
3. **Disable Firebase** in Firebase Console (or delete web app)
4. **Clear user sessions**: `localStorage.clear()`
5. **Verify old auth works**: Test login/signup with old system

---

## Notes & Dependencies

**Required npm packages (backend):**
```
firebase-admin
express-rate-limit (if not already installed)
```

**Required Firebase services:**
- Cloud Firestore (for real-time features, optional)
- Storage (for user avatars, optional)
- Authentication (REQUIRED)

**Browser requirements:**
- ES6+ support (all modern browsers)
- localStorage API
- Cookies (for session persistence)

---

**Estimated Time:** 4-6 hours for full implementation
**Difficulty:** Medium (integration work, not complex logic)
**Risk Level:** Low (old flow still works as fallback)

Last updated: April 2, 2026
