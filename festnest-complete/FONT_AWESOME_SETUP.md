# Font Awesome 6.5.1 Setup Guide — FestNest

## ✅ Setup Complete

Font Awesome CDN is now added to **all 20+ HTML files** in the FestNest project:
- ✅ Main pages (index.html, events.html, profile.html, admin.html)
- ✅ Inner pages (blog, search, saved, post-event, my-events, etc.)
- ✅ Legal pages (terms, privacy, about, contact-us, help-center)
- ✅ Article pages (bangalore-fests, hackathons-india, win-competitions)
- ✅ Event detail pages

**CDN Link:**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
```

---

## 🎯 How to Use Font Awesome Icons

### Basic Icon Structure

Use the `fa-solid` prefix (recommended for consistency):
```html
<i class="fa-solid fa-house"></i>
```

### Common Icons for FestNest

| Icon | Code | Use Case |
|------|------|----------|
| **Menu/Hamburger** | `<i class="fa-solid fa-bars"></i>` | Navigation menu |
| **Search** | `<i class="fa-solid fa-magnifying-glass"></i>` | Search bar, filter |
| **Settings/Sliders** | `<i class="fa-solid fa-sliders"></i>` | Filter options |
| **User/Profile** | `<i class="fa-solid fa-user"></i>` | User profile |
| **Bell/Notification** | `<i class="fa-solid fa-bell"></i>` | Notifications |
| **Heart/Save** | `<i class="fa-solid fa-heart"></i>` | Favorites, saved events |
| **Calendar** | `<i class="fa-solid fa-calendar"></i>` | Dates, events |
| **Location/Map** | `<i class="fa-solid fa-location-dot"></i>` | Location, city |
| **Clock** | `<i class="fa-solid fa-clock"></i>` | Time, duration |
| **Users** | `<i class="fa-solid fa-users"></i>` | Team, group events |
| **Trophy/Award** | `<i class="fa-solid fa-trophy"></i>` | Prize, winner |
| **Star** | `<i class="fa-solid fa-star"></i>` | Rating, featured |
| **Check** | `<i class="fa-solid fa-check"></i>` | Verified, completed |
| **Eye** | `<i class="fa-solid fa-eye"></i>` | Show/view (password toggle) |
| **Eye Slash** | `<i class="fa-solid fa-eye-slash"></i>` | Hide (password toggle) |

---

## 🎨 Consistent Styling Rules

### 1. **Always Use `fa-solid`**
```html
<!-- ✅ Correct -->
<i class="fa-solid fa-magnifying-glass"></i>

<!-- ❌ Avoid -->
<i class="fa-regular fa-magnifying-glass"></i>
<i class="fa fa-magnifying-glass"></i>
```

### 2. **Set Icon Size**
Use Tailwind or inline styles for consistent sizing:
```html
<!-- Option A: Tailwind classes -->
<i class="fa-solid fa-search text-base"></i>
<i class="fa-solid fa-search text-lg"></i>

<!-- Option B: Inline style -->
<i class="fa-solid fa-search" style="font-size: 16px;"></i>

<!-- Option C: CSS custom styles -->
<i class="fa-solid fa-search icon-base"></i>
```

**Recommended Sizes:**
- `text-base` (16px) — Default for most UI elements
- `text-lg` (18px) — Buttons, emphasis
- `text-sm` (14px) — Small icons in lists

### 3. **Color Styling**
Use subtle, professional colors:
```html
<!-- Gray tones (default) -->
<i class="fa-solid fa-search text-gray-500"></i>

<!-- Interactive (hover) -->
<i class="fa-solid fa-search text-gray-700 hover:text-gray-900"></i>

<!-- Primary brand color -->
<i class="fa-solid fa-heart text-purple-600"></i>

<!-- Accent colors -->
<i class="fa-solid fa-star text-yellow-500"></i>
```

**Color Palette:**
- **Default**: `text-gray-500` (✓ Professional)
- **Hover**: `text-gray-700` (✓ Slightly darker)
- **Active**: Primary color (`#7C3AED` Purple)
- **Disabled**: `text-gray-300` (✓ Light gray)

### 4. **Add Transitions for Interactivity**
```html
<i class="fa-solid fa-heart text-gray-500 hover:text-red-500 transition-colors"></i>

<!-- With cursor pointer for clickable icons -->
<i class="fa-solid fa-search text-gray-500 cursor-pointer hover:text-gray-800 transition"></i>
```

### 5. **Positioning with Text**
```html
<!-- Inline with text (flex alignment) -->
<button class="flex items-center gap-2">
  <i class="fa-solid fa-search"></i>
  <span>Search Events</span>
</button>

<!-- Absolute positioning (inside relative container) -->
<div class="relative">
  <input type="text" class="pl-10 pr-3 py-2" placeholder="Search..." />
  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
</div>

<!-- Icon only (button) -->
<button class="p-2 rounded hover:bg-gray-100 transition">
  <i class="fa-solid fa-bell text-gray-600"></i>
</button>
```

---

## 📋 Implementation Examples

### Example 1: Search Bar with Icon
```html
<div class="relative">
  <input 
    type="text" 
    class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600" 
    placeholder="Search events, hackathons, fests..." 
  />
  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"></i>
</div>
```

### Example 2: Navigation Menu with Icons
```html
<nav class="flex flex-col gap-4">
  <a href="/events" class="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition">
    <i class="fa-solid fa-calendar text-gray-600 w-5"></i>
    <span>Events</span>
  </a>
  <a href="/saved" class="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition">
    <i class="fa-solid fa-heart text-gray-600 w-5"></i>
    <span>Saved Events</span>
  </a>
  <a href="/profile" class="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition">
    <i class="fa-solid fa-user text-gray-600 w-5"></i>
    <span>Profile</span>
  </a>
</nav>
```

### Example 3: Event Card with Icons
```html
<div class="event-card p-4 border rounded-lg">
  <h3>Tech Hackathon 2026</h3>
  <div class="flex flex-col gap-2 text-sm text-gray-600 mt-3">
    <div class="flex items-center gap-2">
      <i class="fa-solid fa-calendar text-purple-600"></i>
      <span>Mar 15, 2026</span>
    </div>
    <div class="flex items-center gap-2">
      <i class="fa-solid fa-location-dot text-purple-600"></i>
      <span>Delhi, India</span>
    </div>
    <div class="flex items-center gap-2">
      <i class="fa-solid fa-users text-purple-600"></i>
      <span>2,400+ Participants</span>
    </div>
  </div>
</div>
```

### Example 4: Filter Panel with Icons
```html
<div class="filter-header flex items-center justify-between p-4 border-b">
  <h3 class="flex items-center gap-2">
    <i class="fa-solid fa-sliders text-purple-600"></i>
    <span>Filters</span>
  </h3>
  <button class="text-gray-500 hover:text-gray-700">
    <i class="fa-solid fa-xmark"></i>
  </button>
</div>
```

### Example 5: Password Toggle (Already Implemented)
```html
<div class="relative">
  <input 
    type="password" 
    id="passwordField" 
    class="w-full pr-10 py-2 border rounded-lg" 
    placeholder="••••••••" 
  />
  <button 
    type="button" 
    id="togglePassword"
    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
  >
    <i class="fa-solid fa-eye"></i>
  </button>
</div>

<script>
  const toggleBtn = document.getElementById('togglePassword');
  const passwordField = document.getElementById('passwordField');
  
  toggleBtn.addEventListener('click', () => {
    const icon = toggleBtn.querySelector('i');
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passwordField.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });
</script>
```

---

## ✅ Best Practices Checklist

- [ ] Always use `fa-solid` for consistency
- [ ] Keep icon sizes consistent (text-base or text-lg)
- [ ] Use gray tones (`text-gray-500`) for default state
- [ ] Add hover effects for interactive icons
- [ ] Use flexbox for icon + text alignment
- [ ] Add `pointer-events-none` to decorative icons in input fields
- [ ] Use Font Awesome icons instead of emojis for professional UI
- [ ] Test icons on mobile devices
- [ ] Don't mix multiple icon libraries
- [ ] Document custom icon usages in your code

---

## 🔗 Font Awesome Documentation

- **Icon Library**: https://fontawesome.com/icons
- **Documentation**: https://fontawesome.com/docs/web/setup/get-started
- **CDN Version**: 6.5.1

---

## 📝 Notes

- This setup uses **Font Awesome Version 6.5.1** via CDN
- All icons are loaded from `cdnjs.cloudflare.com` (reliable, fast CDN)
- The `fa-solid` style is the primary recommendation for consistency
- For custom styling, use Tailwind CSS classes or inline styles
- Icons scale with text size, so adjust `font-size` or use Tailwind size utilities

---

**Last Updated**: April 10, 2026
**Status**: ✅ Complete — Ready for production
