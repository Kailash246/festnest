# 🚀 FestNest — Complete Deployment Guide
## Host Everything for FREE

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FESTNEST STACK (ALL FREE)                  │
├─────────────────┬───────────────┬────────────────────────────┤
│  FRONTEND       │  BACKEND      │  SERVICES                   │
│  Vercel / Netlify│  Render       │  MongoDB Atlas M0 (512 MB)  │
│  (Static HTML)  │  (Node.js)    │  Cloudinary (25 GB images)  │
│  FREE forever   │  FREE 750 hrs │  Gmail (emails)             │
└─────────────────┴───────────────┴────────────────────────────┘
```

---

## STEP 1 — Set Up MongoDB Atlas (Free Database)

1. Go to **https://cloud.mongodb.com** and create a free account
2. Click **"Build a Database"** → choose **M0 FREE** tier
3. Select region closest to India: `ap-south-1` (Mumbai)
4. Create a **Database User**:
   - Username: `festnest_user`
   - Password: (generate a strong one — save it!)
5. Under **Network Access** → Add IP Address → Click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
6. Click **Connect** → **Drivers** → Copy your connection string:
   ```
   mongodb+srv://festnest_user:<password>@cluster0.xxxxx.mongodb.net/festnest
   ```
7. Replace `<password>` with your actual password

---

## STEP 2 — Set Up Cloudinary (Free File Storage)

1. Go to **https://cloudinary.com** → Sign up free (no credit card)
2. On your Dashboard, note:
   - **Cloud Name** (e.g., `dfxxx123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopq`)
3. Free tier gives you: **25 GB storage + 25 GB bandwidth/month**

---

## STEP 3 — Deploy Backend on Render (Free)

1. Push your `festnest-backend` folder to a **GitHub repository**
2. Go to **https://render.com** → Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo → Select `festnest-backend`
5. Configure:
   ```
   Name:         festnest-api
   Environment:  Node
   Region:       Singapore (closest to India)
   Branch:       main
   Build Command: npm install
   Start Command: npm start
   Plan:         Free
   ```
6. Add **Environment Variables** (click "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | `mongodb+srv://...` (from Step 1) |
   | `JWT_SECRET` | `(any 64-char random string)` |
   | `JWT_EXPIRE` | `7d` |
   | `CLOUDINARY_CLOUD_NAME` | (from Step 2) |
   | `CLOUDINARY_API_KEY` | (from Step 2) |
   | `CLOUDINARY_API_SECRET` | (from Step 2) |
   | `FRONTEND_URL` | `https://your-festnest.vercel.app` |
   | `EMAIL_USER` | `your.email@gmail.com` |
   | `EMAIL_PASS` | `your_gmail_app_password` |

7. Click **"Create Web Service"**
8. Render will give you a URL like: `https://festnest-api.onrender.com`
9. **Test it:** Open `https://festnest-api.onrender.com/api/health` in browser
10. **Seed the database:** In Render dashboard → Shell → run: `node utils/seed.js`

> ⚠️ **Free tier note:** Render free tier spins down after 15 min inactivity.
> First request after sleep takes ~30 seconds. Upgrade to $7/month to avoid this.

---

## STEP 4 — Deploy Frontend on Vercel (Free)

1. Push your `festnest-frontend` folder to a **GitHub repository**
2. Go to **https://vercel.com** → Sign up with GitHub
3. Click **"Add New Project"** → Import your repo
4. Configure:
   ```
   Framework Preset: Other
   Root Directory:   ./  (or festnest-frontend)
   Build Command:    (leave empty — it's static HTML)
   Output Directory: ./
   ```
5. Click **"Deploy"**
6. Vercel gives you: `https://festnest.vercel.app`

---

## STEP 5 — Connect Frontend to Backend

After deploying, update your frontend's `api.js`:

```javascript
// In assets/js/api.js — line ~8
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://festnest-api.onrender.com/api';  // ← Your actual Render URL
```

Commit and push — Vercel auto-redeploys.

---

## STEP 6 — Update HTML Script Tags

In each `.html` page, replace old script tags with the new live versions:

### In `events.html` — change the last script:
```html
<!-- OLD -->
<script src="../assets/js/pages/events.js"></script>

<!-- NEW -->
<script src="../assets/js/api.js"></script>
<script src="../assets/js/pages/events-live.js"></script>
```

### In `event-detail.html`:
```html
<!-- OLD -->
<script src="../assets/js/pages/event-detail.js"></script>

<!-- NEW -->
<script src="../assets/js/api.js"></script>
<script src="../assets/js/pages/event-detail-live.js"></script>
```

### In `post-event.html`:
```html
<!-- OLD -->
<script src="../assets/js/pages/post-event.js"></script>

<!-- NEW -->
<script src="../assets/js/api.js"></script>
<script src="../assets/js/pages/post-event-live.js"></script>
```

### In `saved.html`:
```html
<!-- OLD -->
<script src="../assets/js/pages/saved.js"></script>

<!-- NEW -->
<script src="../assets/js/api.js"></script>
<script src="../assets/js/pages/saved-live.js"></script>
```

### In ALL pages — replace `auth.js`:
```html
<!-- OLD -->
<script src="../assets/js/auth.js"></script>

<!-- NEW -->
<script src="../assets/js/api.js"></script>
<script src="../assets/js/auth-ui.js"></script>
```

---

## STEP 7 — Set Up Gmail App Password (for Emails)

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Search for **"App Passwords"** → Create one for "Mail"
4. Copy the 16-character password
5. Add to Render env vars as `EMAIL_PASS`

---

## STEP 8 — Verify Everything Works

Test these URLs after deployment:

```
✅ https://festnest-api.onrender.com/api/health
   → Should return: {"success":true,"message":"🪺 FestNest API is running!"}

✅ https://festnest-api.onrender.com/api/events
   → Should return: {"success":true,"events":[...8 seeded events...]}

✅ https://festnest.vercel.app
   → Should show your landing page

✅ https://festnest.vercel.app/pages/events.html
   → Should show REAL events from MongoDB (not static data)
```

---

## 💰 Cost Summary

| Service | Free Tier Limits | Cost |
|---------|-----------------|------|
| **MongoDB Atlas M0** | 512 MB storage, forever free | **$0** |
| **Cloudinary** | 25 GB storage, 25 GB/month bandwidth | **$0** |
| **Render** (backend) | 750 hrs/month, spins down after 15 min | **$0** |
| **Vercel** (frontend) | Unlimited deploys, 100 GB bandwidth | **$0** |
| **Gmail** (email) | 500 emails/day | **$0** |
| **Total** | | **$0/month** |

### When you need to scale up:
| Service | Upgrade | Cost |
|---------|---------|------|
| Render (no sleep) | Starter | $7/month |
| MongoDB Atlas | M2 cluster | $9/month |
| Cloudinary | Plus plan | $89/month |

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] JWT_SECRET is at least 64 random characters
- [ ] MongoDB Atlas IP whitelist (or `0.0.0.0/0` for dev)
- [ ] Cloudinary API secret is private (never in frontend code)
- [ ] CORS `FRONTEND_URL` set to your actual Vercel domain
- [ ] Rate limiting enabled (already done in server.js)

---

## 🔧 Common Issues & Fixes

**"CORS error" in browser console:**
→ Update `FRONTEND_URL` in Render env vars to your exact Vercel URL (no trailing slash)

**"MongoDB connection timeout":**
→ Check Atlas Network Access — add `0.0.0.0/0` to IP whitelist

**"Cannot POST /api/events — 401 Unauthorized":**
→ You're not logged in. The frontend must send the JWT token in the Authorization header.

**Events not showing after seed:**
→ Events need `status: 'approved'` to appear publicly. Run seed again or approve via admin API.

**Render cold start (~30s delay):**
→ Normal on free tier. Use a cron job or UptimeRobot to ping `/api/health` every 14 minutes to keep it awake.

**Images not uploading:**
→ Check Cloudinary credentials in Render env vars. Test via `/api/health` first.

---

## 📡 Full API Reference

### Auth
| Method | Route | Auth | Body |
|--------|-------|------|------|
| POST | `/api/auth/register` | Public | `{firstName, lastName, email, password, role, college}` |
| POST | `/api/auth/login` | Public | `{email, password}` |
| GET | `/api/auth/me` | 🔒 Any | — |
| PUT | `/api/auth/update-profile` | 🔒 Any | `{firstName, college, ...}` |
| PUT | `/api/auth/change-password` | 🔒 Any | `{currentPassword, newPassword}` |

### Events
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/events` | Public | List with `?category=&mode=&fee=&search=&sort=&page=` |
| GET | `/api/events/search?q=` | Public | Full-text search |
| GET | `/api/events/:id` | Public | Single event |
| POST | `/api/events` | 🔒 Organizer | Create (FormData with poster/brochure) |
| PUT | `/api/events/:id` | 🔒 Organizer | Update |
| DELETE | `/api/events/:id` | 🔒 Organizer | Delete |
| GET | `/api/events/my/events` | 🔒 Organizer | My posted events |
| POST | `/api/events/:id/save` | 🔒 Any | Toggle save |
| GET | `/api/events/saved/list` | 🔒 Any | Get saved events |
| GET | `/api/events/admin/pending` | 🔒 Admin | Review queue |
| PATCH | `/api/events/:id/approve` | 🔒 Admin | Approve + set badge |
| PATCH | `/api/events/:id/reject` | 🔒 Admin | Reject with reason |
| GET | `/api/events/admin/stats` | 🔒 Admin | Dashboard stats |

### Upload
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/upload/poster` | 🔒 Organizer | Upload image → Cloudinary |
| POST | `/api/upload/brochure` | 🔒 Organizer | Upload PDF → Cloudinary |

---

*FestNest — Built for Indian students* 🇮🇳
