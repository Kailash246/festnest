# 🪺 FestNest — Complete Frontend (API-Connected)

**Gather, Connect, Compete & Win**  
India's #1 Campus Event Discovery Platform

---

## 📁 Complete File Structure

```
festnest/
│
├── index.html                          ← Landing Page (Home)
│
├── pages/
│   ├── events.html                     ← Events Feed (with live filters)
│   ├── event-detail.html               ← Single Event Detail (dynamic by ?id=)
│   ├── post-event.html                 ← Organizer: Post Event Form
│   ├── saved.html                      ← Student: Saved/Bookmarked Events
│   ├── search.html                     ← Full Search + Trending
│   ├── profile.html                    ← User Profile Page
│   └── about.html                      ← Why FestNest / About Us
│
├── assets/
│   ├── css/
│   │   ├── variables.css               ← Design Tokens (colors, radius, spacing)
│   │   ├── reset.css                   ← CSS Reset + Base Styles
│   │   ├── typography.css              ← Font Classes + Text Utilities
│   │   ├── components.css              ← Buttons, Cards, Forms, Modal, Toast
│   │   ├── navbar.css                  ← Navbar + Mobile Hamburger Drawer
│   │   ├── footer.css                  ← Footer
│   │   ├── animations.css              ← Keyframes + Skeleton Loading
│   │   └── pages/
│   │       ├── landing.css             ← Hero, Features, How-It-Works, Categories
│   │       └── inner-pages.css         ← Events, Detail, Post, Saved, Search, Profile, About
│   │
│   ├── js/
│   │   ├── api.js                      ← ★ API Client — all backend calls + token mgmt
│   │   ├── toast.js                    ← Toast Notification System
│   │   ├── utils.js                    ← Shared utils: card builder, debounce, helpers
│   │   ├── navbar.js                   ← Hamburger, scroll shadow, active link, auth state
│   │   ├── auth.js                     ← Login/Signup Modal → Real Backend API
│   │   ├── landing.js                  ← Landing page scroll animations
│   │   └── pages/
│   │       ├── events.js               ← Events page: filter, sort, search, paginate
│   │       ├── event-detail.js         ← Detail page: fetch by ID, save/register
│   │       ├── post-event.js           ← Post form: validation, file upload, submit
│   │       ├── saved.js                ← Saved page: fetch from API, unsave
│   │       ├── search.js               ← Search: live results + trending sections
│   │       └── profile.js              ← Profile: stats, interests, menu actions
│   │
│   └── images/                         ← Add your images here
│
└── README.md                           ← This file
```

---

## 🚀 How to Run Locally

### Option A — VS Code Live Server (Recommended)
1. Open this folder in **VS Code**
2. Install **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **"Open with Live Server"**
4. Site opens at `http://127.0.0.1:5500`

### Option B — Python server
```bash
cd festnest
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## 🔌 Connecting to the Backend

**Step 1:** Open `assets/js/api.js` — find line ~5:
```javascript
const API_BASE = (function(){
  const h = window.location.hostname;
  return (h === 'localhost' || h === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://your-festnest-backend.onrender.com/api'; // ← UPDATE THIS
}());
```

**Step 2:** Replace `your-festnest-backend.onrender.com` with your actual Render URL after deploying the backend.

**Step 3:** Start the backend:
```bash
cd festnest-backend
npm install
npm run seed     # Seed 8 sample events + 7 users
npm run dev      # Starts at http://localhost:5000
```

**Step 4:** Open the frontend. Events will now load from MongoDB!

---

## 🎨 Brand Design System

| Token            | Value                                     |
|------------------|-------------------------------------------|
| Primary Gradient | `linear-gradient(135deg, #2F80ED, #7B2FF7)` |
| Primary Color    | `#5A4BFF`                                 |
| Accent Color     | `#FF8A00`                                 |
| Background       | `#F4F6FB`                                 |
| Card Background  | `#FFFFFF`                                 |
| Text Primary     | `#1A1A1A`                                 |
| Text Secondary   | `#666666`                                 |
| Display Font     | Clash Display (headings, logo, numbers)   |
| Body Font        | Plus Jakarta Sans (all UI text)           |

---

## ✅ All Features

| Feature | Page | Status |
|---------|------|--------|
| Hero + animated phone mockup | `index.html` | ✅ |
| Stats strip | `index.html` | ✅ |
| Feature cards grid | `index.html` | ✅ |
| How It Works | `index.html` | ✅ |
| Category showcase links | `index.html` | ✅ |
| Testimonials | `index.html` | ✅ |
| CTA Banner | `index.html` | ✅ |
| Responsive navbar + mobile drawer | All pages | ✅ |
| Login / Signup modal (→ real API) | All pages | ✅ |
| Events feed with live API data | `events.html` | ✅ |
| Sidebar filters (category, mode, fee) | `events.html` | ✅ |
| Category pill tabs | `events.html` | ✅ |
| Live search with debounce | `events.html` | ✅ |
| Sort (newest, prize, popular, date) | `events.html` | ✅ |
| Trending tag chips | `events.html` | ✅ |
| Pagination with page buttons | `events.html` | ✅ |
| URL param (?cat=Hackathon) | `events.html` | ✅ |
| Skeleton loading states | `events.html` | ✅ |
| Event detail (dynamic from ?id=) | `event-detail.html` | ✅ |
| Prize breakdown grid | `event-detail.html` | ✅ |
| Contact + rules + tags sections | `event-detail.html` | ✅ |
| Register → opens registration link | `event-detail.html` | ✅ |
| Save / Unsave → real API | `event-detail.html` | ✅ |
| Share (Web Share API) | `event-detail.html` | ✅ |
| Brochure PDF download link | `event-detail.html` | ✅ |
| Post event form (6 sections) | `post-event.html` | ✅ |
| File upload zones (poster + PDF) | `post-event.html` | ✅ |
| Live card preview while typing | `post-event.html` | ✅ |
| Form validation + error messages | `post-event.html` | ✅ |
| Submit → real API with files | `post-event.html` | ✅ |
| Success modal on submit | `post-event.html` | ✅ |
| Saved events from API | `saved.html` | ✅ |
| Empty state + login prompt | `saved.html` | ✅ |
| Clear all saved | `saved.html` | ✅ |
| Big search bar + live results | `search.html` | ✅ |
| Popular tags chips | `search.html` | ✅ |
| Trending + New sections | `search.html` | ✅ |
| Profile hero + stats | `profile.html` | ✅ |
| Recent activity feed | `profile.html` | ✅ |
| Interests toggle chips | `profile.html` | ✅ |
| Profile menu (saved, logout...) | `profile.html` | ✅ |
| Why FestNest + mission + team | `about.html` | ✅ |
| Toast notification system | All pages | ✅ |
| Fully responsive (mobile + tablet) | All pages | ✅ |

---

## 🆓 Free Hosting

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** or **Netlify** | Host this frontend | **Free** |
| **Render** | Host Node.js backend | Free (750 hrs/mo) |
| **MongoDB Atlas M0** | Database | Free (512 MB) |
| **Cloudinary** | Image/PDF uploads | Free (25 GB) |

---

*FestNest · Made with ❤️ for Indian students 🇮🇳*
