/* ============================================================
   FESTNEST — config/db.js
   MongoDB Atlas connection (already called in server.js,
   kept here for reference / standalone scripts)
   ============================================================ */

'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI environment variable is not set!\n' +
        'On Render: Add MONGODB_URI to Environment Variables in dashboard\n' +
        'Locally: Ensure .env file exists with MONGODB_URI=mongodb+srv://...'
      );
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
