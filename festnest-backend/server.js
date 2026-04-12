/* ============================================================
   FESTNEST BACKEND — server.js
   WHY THIS WAS CHANGED:
   - Added express.static to serve festnest-complete/ so
     opening http://localhost:5000 works without a separate
     live-server instance (eliminates cross-origin issues)
   - CORS now also allows localhost:5000 as an origin
   - SPA fallback added so page-refreshes don't 404
   ============================================================ */
'use strict';

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');
require('dotenv').config();

/* ── Firebase initialization ──────────────────────────────── */
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

const app = express();

/* ── Trust proxy for production ── */
app.set('trust proxy', 1);

/* ── Database ─────────────────────────────────────────────── */
if (!process.env.MONGODB_URI) {
  console.error('❌  FATAL: MONGODB_URI environment variable is not set!');
  console.error('   On Render: Add MONGODB_URI to Environment Variables in dashboard');
  console.error('   Locally: Ensure .env file exists with MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => { console.error('❌  MongoDB:', err.message); process.exit(1); });

/* ── Validate Email Config ─────────────────────────────── */
if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('\n❌  CRITICAL: Email configuration incomplete!');
  console.error('   Missing SMTP variables:');
  console.error('   - EMAIL_HOST (should be: smtp.zoho.in)');
  console.error('   - EMAIL_PORT (should be: 587)');
  console.error('   - EMAIL_USER (should be: noreply@festnest.in)');
  console.error('   - EMAIL_PASS (your Zoho app password)');
  console.error('\n   On Render: Add these to Environment Variables in dashboard');
  console.error('   Locally: Ensure .env file has these values\n');
  process.exit(1);
}

/* ── Security ─────────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

/* ── CORS ─────────────────────────────────────────────────── */
const ALLOWED = [
  'http://localhost:5000',   // backend self-serves frontend
  'http://127.0.0.1:5000',
  'http://localhost:5500',   // VS Code Live Server
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://festnest.in',         // Production custom domain
  'https://www.festnest.in',     // Production custom domain with www
  'https://festnest.vercel.app', // Vercel deployment
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Allow Postman / curl (no origin) and any allowed origin
    if (!origin || ALLOWED.includes(origin)) return cb(null, true);
    // In development allow everything
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    cb(new Error('CORS: Origin not allowed — ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Body parsers ─────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ── Logging ──────────────────────────────────────────────── */
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

/* ── Rate limiting ────────────────────────────────────────── */
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' },
}));

/* ── Serve frontend ───────────────────────────────────────────
   Resolves to:  festnest-backend/../festnest-complete
   Override with FRONTEND_PATH env var if your layout differs.
──────────────────────────────────────────────────────────── */
const FRONTEND = process.env.FRONTEND_PATH
  || path.resolve(__dirname, '..', 'festnest-complete');

app.use(express.static(FRONTEND));

/* ── API Routes ───────────────────────────────────────────── */
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));

/* ── Health ───────────────────────────────────────────────── */
app.get('/api/health', (req, res) => res.json({
  success: true,
  message: '🪺 FestNest API running!',
  env: process.env.NODE_ENV,
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  ts: new Date().toISOString(),
}));

/* ── SPA fallback — sends index.html for any non-API GET ─── */
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND, 'index.html'), err => { if (err) next(); });
});

/* ── 404 ──────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found: ' + req.originalUrl });
});

/* ── Global error handler ─────────────────────────────────── */
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ success: false, message: 'Invalid JSON body.' });
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: msgs.join('. ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `${field} already exists.` });
  }
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });

  console.error('💥', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

/* ── Start ────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Server  →  http://localhost:${PORT}`);
  console.log(`🌐  App     →  http://localhost:${PORT}/index.html`);
  console.log(`📡  API     →  http://localhost:${PORT}/api/health`);
  console.log(`📁  Frontend served from: ${FRONTEND}\n`);
});

module.exports = app;
