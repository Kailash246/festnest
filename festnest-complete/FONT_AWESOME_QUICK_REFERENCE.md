# Font Awesome Icons — Quick Reference Card

## 🎯 Copy-Paste Ready Code Snippets

### 1. Search Icon with Input Field
```html
<div class="relative">
  <input 
    type="text" 
    class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg" 
    placeholder="Search events, hackathons, fests..." 
  />
  <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
</div>
```

### 2. Filter Button with Icon
```html
<button class="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
  <i class="fa-solid fa-sliders text-gray-600"></i>
  <span>Filters</span>
</button>
```

### 3. Navigation Menu Item
```html
<a href="/events" class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 transition">
  <i class="fa-solid fa-calendar text-gray-600 w-5"></i>
  <span>Events</span>
</a>
```

### 4. Event Card Info (Location, Date, People)
```html
<div class="space-y-2 text-sm text-gray-600 mt-3">
  <div class="flex items-center gap-2">
    <i class="fa-solid fa-calendar w-4 text-purple-600"></i>
    <span>Mar 15, 2026</span>
  </div>
  <div class="flex items-center gap-2">
    <i class="fa-solid fa-location-dot w-4 text-purple-600"></i>
    <span>Delhi, India</span>
  </div>
  <div class="flex items-center gap-2">
    <i class="fa-solid fa-users w-4 text-purple-600"></i>
    <span>2,400+ Participants</span>
  </div>
</div>
```

### 5. Favorite/Bookmark Button
```html
<button class="p-2 rounded-lg hover:bg-gray-100 transition" title="Save event">
  <i class="fa-solid fa-heart text-gray-500 hover:text-red-500 transition-colors text-lg"></i>
</button>
```

### 6. Icon-Only Button (Notification Bell)
```html
<button class="relative p-2 rounded-lg hover:bg-gray-100 transition">
  <i class="fa-solid fa-bell text-gray-600"></i>
  <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
</button>
```

### 7. Loading Spinner (Animated)
```html
<i class="fa-solid fa-spinner text-purple-600 animate-spin"></i>
```

### 8. Password Toggle (Already Implemented)
```html
<div class="relative">
  <input type="password" id="pwd" class="w-full pr-10 py-2" />
  <button type="button" id="toggle" class="absolute right-3 top-1/2 -translate-y-1/2">
    <i class="fa-solid fa-eye"></i>
  </button>
</div>
```

### 9. Status Indicator (Check/Success)
```html
<div class="flex items-center gap-2 text-green-600">
  <i class="fa-solid fa-check-circle"></i>
  <span>Event saved successfully</span>
</div>
```

### 10. Header with Icon Title
```html
<div class="flex items-center gap-3 mb-4">
  <i class="fa-solid fa-trophy text-yellow-500 text-2xl"></i>
  <h2 class="text-xl font-bold">Top Events This Week</h2>
</div>
```

---

## 🎨 Icon Color Combinations

### Gray Tones (Default)
```html
<i class="fa-solid fa-search text-gray-500"></i>           <!-- Default -->
<i class="fa-solid fa-search text-gray-600"></i>           <!-- Slightly darker -->
<i class="fa-solid fa-search text-gray-700 text-lg"></i>   <!-- Dark on hover -->
```

### Brand Colors
```html
<i class="fa-solid fa-heart text-purple-600"></i>          <!-- Primary color -->
<i class="fa-solid fa-star text-yellow-500"></i>           <!-- Accent -->
<i class="fa-solid fa-check-circle text-green-600"></i>    <!-- Success -->
```

### Interactive States
```html
<i class="fa-solid fa-search text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"></i>
```

---

## 📋 Icon Sizing Reference

```html
<!-- Small (14px) - Lists, secondary info -->
<i class="fa-solid fa-calendar text-sm"></i>

<!-- Base (16px) - Default, most UI elements -->
<i class="fa-solid fa-calendar text-base"></i>

<!-- Large (18px) - Buttons, emphasis -->
<i class="fa-solid fa-calendar text-lg"></i>

<!-- Extra Large (24px) - Hero sections, headers -->
<i class="fa-solid fa-calendar text-2xl"></i>

<!-- Or use explicit sizes -->
<i class="fa-solid fa-calendar" style="font-size: 16px;"></i>
```

---

## 🔄 Common Icon Scenarios

### Search Bar in Navigation
```html
<form class="flex items-center">
  <input type="text" placeholder="Search..." class="px-4 py-2 rounded-l-lg" />
  <button class="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition">
    <i class="fa-solid fa-search"></i>
  </button>
</form>
```

### Sidebar Navigation
```html
<nav class="space-y-1">
  <a href="#" class="flex items-center gap-3 px-4 py-2 rounded text-gray-700 hover:bg-gray-100">
    <i class="fa-solid fa-home w-5 text-center"></i>
    <span>Home</span>
  </a>
  <a href="#" class="flex items-center gap-3 px-4 py-2 rounded text-gray-700 hover:bg-gray-100">
    <i class="fa-solid fa-calendar w-5 text-center"></i>
    <span>Events</span>
  </a>
  <a href="#" class="flex items-center gap-3 px-4 py-2 rounded text-gray-700 hover:bg-gray-100">
    <i class="fa-solid fa-heart w-5 text-center"></i>
    <span>Saved</span>
  </a>
</nav>
```

### Status Badges
```html
<!-- Verified -->
<div class="flex items-center gap-1 text-green-600">
  <i class="fa-solid fa-circle-check text-sm"></i>
  <span class="text-sm font-medium">Verified</span>
</div>

<!-- Featured -->
<div class="flex items-center gap-1 text-purple-600">
  <i class="fa-solid fa-star text-sm"></i>
  <span class="text-sm font-medium">Featured</span>
</div>

<!-- Trending -->
<div class="flex items-center gap-1 text-orange-600">
  <i class="fa-solid fa-fire text-sm"></i>
  <span class="text-sm font-medium">Trending</span>
</div>
```

---

## ✅ Implementation Rules

1. **Always**: Use `fa-solid` prefix
2. **Always**: Add size class (`text-base`, `text-lg`, etc.)
3. **Always**: Use gray tones for default state
4. **Always**: Add hover effects for interactive icons
5. **Never**: Mix icon libraries
6. **Never**: Use emojis when Font Awesome icons available
7. **Never**: Forget to add `pointer-events-none` to decorative icons in input fields

---

## 🔗 Find More Icons

Visit **https://fontawesome.com/icons** to search for specific icons.

Search tips:
- `fa-solid fa-heart` — Favorites
- `fa-solid fa-bell` — Notifications
- `fa-solid fa-calendar` — Dates
- `fa-solid fa-location-dot` — Location
- `fa-solid fa-users` — Team/group
- `fa-solid fa-trophy` — Prizes/achievement
- `fa-solid fa-star` — Rating/featured
- `fa-solid fa-fire` — Trending
- `fa-solid fa-check-circle` — Verified
- `fa-solid fa-shield` — Security/protection

---

**Version**: Font Awesome 6.5.1 (via CDN)
**Last Updated**: April 10, 2026
