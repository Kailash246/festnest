/* ============================================================
   FESTNEST FRONTEND — assets/js/firebase-config.js
   
   Firebase SDK Initialization and API Methods
   
   Requires in HTML:
   <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"></script>
   ============================================================ */
'use strict';

/* ── Firebase Config — Update with your project values ── */
const firebaseConfig = {
  apiKey:            "AIzaSyAZgYE5a5vxQ1sspDX_S7wr7HxwYCL_AzE",
  authDomain:        "festnest-5840d.firebaseapp.com",
  projectId:         "festnest-5840d",
  storageBucket:     "festnest-5840d.firebasestorage.app",
  messagingSenderId: "482557172053",
  appId:             "1:482557172053:web:ecce47feaa143899ba77dc",
};

/* ────────────────────────────────────────────────────────
   FIREBASE AUTH HANDLER
   ──────────────────────────────────────────────────────── */
const FN_FIREBASE = {
  /**
   * Initialize Firebase (call once at page load)
   */
  init() {
    try {
      firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      console.log('✓ Firebase initialized');
    } catch (err) {
      console.error('Firebase init error:', err.message);
    }
  },

  /**
   * Sign up with email and password
   * - Creates Firebase user
   * - Does NOT create MongoDB user yet (happens in onboarding)
   */
  async signupEmail(email, password) {
    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      const idToken = await result.user.getIdToken();
      return {
        success: true,
        idToken,
        email: result.user.email,
        uid: result.user.uid,
      };
    } catch (err) {
      return {
        success: false,
        message: this._translateError(err.code),
      };
    }
  },

  /**
   * Sign in with email and password
   * - Authenticates with Firebase
   * - Calls backend to check if user exists
   */
  async loginEmail(email, password) {
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      const idToken = await result.user.getIdToken();
      return {
        success: true,
        idToken,
        email: result.user.email,
        uid: result.user.uid,
      };
    } catch (err) {
      return {
        success: false,
        message: this._translateError(err.code),
      };
    }
  },

  /**
   * Sign in with Google
   * - Opens Google login dialog
   */
  async loginGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.auth.signInWithPopup(provider);
      const idToken = await result.user.getIdToken();
      
      return {
        success: true,
        idToken,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        uid: result.user.uid,
        isNewUser: result.additionalUserInfo.isNewUser,
      };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          message: 'Login cancelled.',
        };
      }
      return {
        success: false,
        message: this._translateError(err.code),
      };
    }
  },

  /**
   * Sign out
   */
  async logout() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: 'Logout failed: ' + err.message,
      };
    }
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  },

  /**
   * Get Firebase ID token
   */
  async getIdToken(user = null) {
    const u = user || this.auth.currentUser;
    if (!u) return null;
    return u.getIdToken();
  },

  /**
   * Firebase error code translator
   */
  _translateError(code) {
    const errors = {
      'auth/email-already-in-use':     'Email already in use.',
      'auth/invalid-email':             'Invalid email address.',
      'auth/weak-password':             'Password must be at least 6 characters.',
      'auth/user-not-found':            'User not found.',
      'auth/wrong-password':            'Incorrect password.',
      'auth/too-many-requests':         'Too many login attempts. Try again later.',
      'auth/account-exists-with-different-credential': 'Email is already registered.',
      'auth/popup-closed-by-user':      'Login popup was closed.',
    };
    return errors[code] || err.message;
  },
};

/* ── Initialize on load ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FN_FIREBASE.init());
} else {
  FN_FIREBASE.init();
}

window.FN_FIREBASE = FN_FIREBASE;
