# 🦋 Bonna's Space — Retro RPG Digital Artist Portfolio

Welcome to the digital corner of **Bonna**, a digital artist who loves drawing OCs, fanarts, and all things pixel! This portfolio is designed as an immersive **Retro RPG** experience, blending neo-brutalist aesthetics with modern interactivity.

---

## 🕹️ Key Features

- **Seamless SPA Navigation** — A custom single-page-app engine swaps content without browser refreshes, preserving audio and visual state across all pages
- **Persistent RPG Soundscape** — Lo-fi background track that survives page transitions, with tactile pixel-blip SFX on every interaction
- **3D Bento Cards** — Retro-styled cards with normalized perspective tilt and parallax mascot effects
- **Dynamic CMS** — Profile, pricing, gallery, and commission data are all driven by Google Sheets via Apps Script
- **Commission Status Badge** — Live "OPEN / CLOSED / WAITLIST" badge pulled from Sheets — no code edits needed to update it
- **Art Gallery** — Filterable grid with lightbox, keyboard navigation, and load-more pagination
- **Admin Dashboard** — Full CMS UI for managing profile, gallery, and commission data — secured behind a login gate
- **Performance First** — Zero frameworks, zero build step, pure vanilla HTML + CSS + JS

---

## 🛠️ Built With

| Layer     | Stack                                                                 |
| --------- | --------------------------------------------------------------------- |
| Structure | Semantic HTML5                                                        |
| Styling   | Vanilla CSS (CSS Variables, Flex/Grid, Custom Animations)             |
| Logic     | Vanilla JavaScript (SPA Engine, Audio Manager, Intersection Observer) |
| Data      | Google Apps Script → Google Sheets                                    |
| Fonts     | Press Start 2P, VT323 (Google Fonts)                                  |
| Icons     | FontAwesome 6.6.0 (CDN)                                               |
| Audio     | SoundHelix (BGM), Mixkit (SFX)                                        |

---

## 📁 File Structure

```
bonna/
├── index.html              # Home — profile, skills, bento grid
├── commission.html         # Commission info, pricing, samples, process
├── gallery.html            # Full art gallery with filters & lightbox
├── tos.html                # Terms of Service
├── admin-login.html        # Admin login gate (enter secret key here)
├── admin.html              # Admin dashboard — requires login session
│
├── css/
│   ├── style.css           # Main stylesheet (theme, nav, components, pages)
│   └── admin.css           # Admin dashboard + login page styles
│
├── js/
│   ├── utils.js            # Shared utilities (loaded first — before all other scripts)
│   ├── script.js           # Main SPA engine, audio, effects, gallery, data injection
│   └── admin.js            # Admin dashboard logic (CMS tabs, Imgur upload, Sheets save)
│
├── assets/
│   ├── bonna.png           # Main mascot (header, login page)
│   ├── bonna2.png          # Secondary mascot (footer)
│   ├── mascot.png          # Alt mascot asset
│   ├── mascot-sitting.png  # Alt mascot asset (sitting pose)
│   └── sparkle.png         # Decorative sparkle asset
│
└── docs/
    └── plans/              # Development planning documents
```

---

## 🚀 Pages

| Page             | URL                | Description                                   |
| ---------------- | ------------------ | --------------------------------------------- |
| Home             | `index.html`       | Profile, skills, fandom, gallery CTA          |
| Commission       | `commission.html`  | Pricing table, type samples, process, payment |
| Gallery          | `gallery.html`     | Filterable art grid + lightbox                |
| Terms of Service | `tos.html`         | Full commission ToS                           |
| Admin Login      | `admin-login.html` | Secret key entry — gate to the dashboard      |
| Admin Dashboard  | `admin.html`       | CMS for profile, gallery, commission data     |

---

## 🔐 Admin Access Flow

```
Admin navigates to admin-login.html
         ↓
Enters the secret key (= Google Apps Script token)
         ↓
JS hashes the key with SHA-256 (Web Crypto API)
         ↓
Compared against ADMIN_TOKEN_HASH in js/login.js
         ↓
✅ Match → token stored in sessionStorage → redirect to admin.html
❌ No match → shake animation, input cleared, error shown
         ↓
admin.html checks sessionStorage on load
→ No token? Immediate redirect back to admin-login.html
→ Has token? Dashboard loads and uses it for all Sheets API calls
         ↓
Logout button clears sessionStorage → redirect to login
```

### First-time Setup

1. Open `admin-login.html` in browser
2. Open DevTools console (F12)
3. Run: `await hashToken('your-actual-apps-script-token')`
4. Copy the 64-character hex string
5. Paste it as `ADMIN_TOKEN_HASH` in `js/login.js` line ~16
6. Save — login is now locked to that key

> **Note:** If `ADMIN_TOKEN_HASH` is left empty, any non-empty key grants access (dev mode).

---

## 🎨 Theming System

All visual tokens are defined as CSS variables in `:root` inside `css/style.css`:

```css
/* Colors */
--clr-dark-plum, --clr-deep-maroon, --clr-warm-crimson
--clr-coral, --clr-salmon, --clr-peach, --clr-light-peach
--clr-cream, --clr-gold, --clr-gold-soft

/* Typography */
--font-pixel   →  'Press Start 2P' (headers, UI labels)
--font-retro   →  'VT323' (body text, descriptions)

/* Spacing */
--space-xs → --space-3xl

/* Transitions */
--transition-fast, --transition-smooth, --transition-bounce

/* Layout */
--nav-height: 60px
```

---

## ⚙️ JavaScript Architecture

### `js/utils.js` — Shared Utilities (loads first)

Exposes a global `BonnaUtils` object with shared constants and helpers used by both `script.js` and `admin.js`:

- `getVal(obj, key)` — case-insensitive CMS key lookup
- `escapeHtml(text)` — XSS-safe HTML insertion
- `getDefaultDescription(type)` — fallback commission descriptions
- `showToast / showLoading / hideLoading` — UI feedback helpers
- `ITEMS_PER_LOAD`, `TRANSITION_MS`, `NAV_HEIGHT`, etc.

### `js/script.js` — Main App

- **DataManager** — fetches from Google Sheets API, injects data into the DOM by element ID
- **RetroAudioManager** — BGM + SFX with mute persistence via `localStorage`
- **visualEffects** — scroll reveal, typewriter, 3D card tilt, mascot parallax
- **SPA engine** — `loadPage()` + `reinitAll()` for seamless navigation
- **GalleryManager** — gallery filters, lightbox, pagination (singleton, AbortController cleanup)
- **CommissionPreviewManager** — renders commission type sample cards
- **Navigation** — `updateNavActive()` highlights current page in the nav bar

### `js/admin.js` — Dashboard

- `api.fetchData()` — loads all Sheets data into `state.cache`
- `api.saveData()` — POSTs changes back to Sheets (uses `mode: no-cors`)
- `api.uploadToImgur()` — uploads images to Imgur, returns direct URL
- Tabs: Profile editor · Gallery manager · Commission manager
- All save operations read the token from `sessionStorage.getItem('bonna_admin_token')`

---

## 📊 Google Sheets Data Structure

| Sheet               | Columns                                                  | Used By                                                |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| **Profile**         | Key, Value                                               | Home page (name, tagline, bio tags, commission status) |
| **Prices**          | Category, Type, PriceUSD, PriceIDR                       | Commission page pricing table                          |
| **Gallery**         | ID, Title, ImageURL, Type, Description, Order, CreatedAt | Gallery page + Commission samples                      |
| **CommissionTypes** | Type, SampleImage, Description, DisplayOrder             | Commission sample cards                                |

### Commission Status Badge

Add a row to the **Profile** sheet:

```
Key: commission_status
Value: open    ← or: closed  / waitlist
```

The badge on the home page and commission page updates automatically.

---

## 🖥️ Running Locally

No build step needed — open directly or use any static server:

```bash
# Python
python -m http.server 8000

# Node
npx serve .

# VS Code
# Install "Live Server" extension → Right-click index.html → Open with Live Server
```

---

## 🔧 Development Notes

### Adding a New Page

1. Copy `tos.html` as a template (lightest structure)
2. Add the `<nav class="site-nav">` block (copy from any existing page)
3. Add `<script src="js/utils.js"></script>` before `<script src="js/script.js"></script>`
4. Internal `<a href="newpage.html">` links auto-intercept via the SPA engine

### Modifying the Navigation

The nav bar HTML lives in **each** HTML file (for direct-URL fallback). The active link is set dynamically by `updateNavActive()` in `script.js` after every SPA navigation.

### Image Hosting

The admin dashboard integrates with **Imgur** for image uploads:

1. Register at https://api.imgur.com/oauth2/addclient
2. Choose "Anonymous usage without user authentication"
3. Copy the **Client ID**
4. Paste it as `IMGUR_CLIENT_ID` in `js/admin.js`

---

## ⚠️ No-Go Zones

| Rule                                              | Why                                                             |
| ------------------------------------------------- | --------------------------------------------------------------- |
| No npm / bundlers / frameworks                    | Zero-dependency philosophy; open HTML directly                  |
| Don't break `<a href="page.html">` internal links | The SPA engine intercepts these — non-standard hrefs won't work |
| Don't split `utils.js` into ES modules            | No `type="module"` — everything is global script                |
| Don't add `<script>` tags inside `#main-content`  | The SPA swaps innerHTML; scripts inside won't re-execute        |

---

---

## 💖 The Language of Love (Hidden Features)

Sistem ini dibangun untuk memberikan kehangatan, dukungan, dan kehadiran "Sang Arsitek" di dalam ruang kerja digital Bonna.

### 1. Raditya's Presence System (Layer 1)
- **Dynamic Greetings**: Pesan sapaan yang berubah setiap hari, mencakup perayaan spesial, pesan dukungan, dan pengingat bahwa ia tidak sendirian.
- **SYS.UPTIME**: Menghitung hari sejak awal perjalanan bersama. 
    - *Hidden Trigger*: Klik dan tahan counter uptime selama 2 detik untuk mengungkap pesan rahasia: `[ X DAYS WITH YOU ]`.

### 2. The Mascot Companion (Layer 2)
- **Comfort Tools**: Klik mascot untuk membuka panel dukungan cepat (Self-care reminders, mood boost).
- **Whisper Eggs**: Mascot sesekali akan membisikkan pesan penyemangat secara spontan.
- **The Secret Whisper**: Klik mascot sebanyak 5 kali dalam 8 detik untuk mendapatkan bisikan khusus dari Sang Arsitek.

### 3. Secret Archives (Layer 3)
- **Letters in Time**: Arsip surat digital yang terbuka seiring berjalannya waktu.
- **Constellation of Moments**: Galeri kenangan tersembunyi.
    - *Trigger*: Masukkan **Konami Code** (`↑ ↑ ↓ ↓ ← → ← → B A`) di keyboard saat berada di dashboard.
- **Studio Journal**: Catatan harian Sang Arsitek tentang perkembangan studio ini.
    - *Trigger*: Klik mascot sebanyak 7 kali dengan cepat.

### 4. The Architect's Poem (The Final Gateway)
Dokumentasi rahasia yang berisi teka-teki puitis untuk menuntun Bonna menemukan semua "bahasa cinta" di atas.
- **The Gateway**: Tarik judul utama "BONNA'S SPACE" ke bawah dan tahan selama 4 detik. Layar akan meredup hingga gelap total dengan denyut jantung emas sebelum surat terbuka.
- **The Playground**: Di bait terakhir puisi, terdapat tautan rahasia menuju repository GitHub ini sebagai "Playground Sang Arsitek".

---

_Made with ❤️ for Bonna. Designed to keep the spirit of classic RPGs alive in a modern web space._
