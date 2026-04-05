/* ============================================================
   FESTNEST — config/firebase.js
   
   Firebase Admin SDK Initialization
   Requires FIREBASE_SERVICE_ACCOUNT_KEY in .env
   ============================================================ */
'use strict';

const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * Call this once at server startup
 */
const initializeFirebase = () => {
  /* Check if Firebase already initialized */
  if (admin.apps.length > 0) {
    console.log('✓ Firebase Admin initialized');
    return;
  }

  try {
    /* Parse service account from .env */
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (!serviceAccountKey) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY not set in .env. ' +
        'Firebase authentication disabled. ' +
        'Add JSON from Firebase Console → Project Settings → Service Accounts.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });

    console.log('✓ Firebase Admin SDK initialized');
  } catch (err) {
    console.error('✗ Firebase initialization error:', err.message);
    /* Continue without Firebase — old auth still works */
  }
};

module.exports = { initializeFirebase };
