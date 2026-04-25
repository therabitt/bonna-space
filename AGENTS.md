# AGENTS.md — Bonna Portfolio

## Repository Overview

Static portfolio website for a digital artist. **No build step** — open HTML files directly in browser or serve with any static server.

## Tech Stack

- **Structure**: Semantic HTML5
- **Styling**: Vanilla CSS with custom properties (CSS variables for theming)
- **Logic**: Vanilla JavaScript (SPA engine, no frameworks)
- **Data**: Google Apps Script API (`script.google.com`) for dynamic content

## File Structure

```
├── index.html              # Home (profile, skills, gallery CTA)
├── commission.html         # Commission info, pricing, samples, process
├── gallery.html            # Full art gallery with filters & lightbox
├── tos.html                # Terms of Service
├── admin-login.html        # Admin login gate (secret key entry)
├── admin.html              # CMS dashboard — requires login session
├── css/
│   ├── style.css           # Main stylesheet (theme, nav, all components)
│   └── admin.css           # Admin dashboard + login page styles
├── js/
│   ├── utils.js            # ★ Shared utilities — MUST load before all other scripts
│   ├── script.js           # SPA engine, audio, effects, gallery, data injection
│   └── admin.js            # Admin dashboard logic (tabs, Imgur upload, Sheets save)
├── assets/                 # Mascot images and decorative assets
└── docs/plans/             # Development planning documents
```

## Critical Conventions

### Script Loading Order

Every public-facing page (`index`, `commission`, `gallery`, `tos`) loads scripts in this exact order:

```html
<script src="js/utils.js"></script>
<!-- FIRST — exposes BonnaUtils global -->
<script src="js/script.js"></script>
<!-- SECOND — uses BonnaUtils -->
```

`admin.html` loads:

```html
<script src="js/utils.js"></script>
<script src="js/admin.js"></script>
```

`admin-login.html` loads only `js/login.js` (standalone, no dependency on utils or script).

**Never** reverse this order or merge scripts.

### BonnaUtils Global (`js/utils.js`)

Exposes a single global object `BonnaUtils` with shared constants and helpers:

- `getVal(obj, key)` — case/whitespace-insensitive key lookup (handles CMS column name inconsistencies)
- `escapeHtml(text)` — XSS-safe HTML insertion via `textContent` trick
- `getDefaultDescription(type)` — fallback descriptions for commission types
- `showToast / showLoading / hideLoading` — UI feedback helpers
- `ITEMS_PER_LOAD`, `TRANSITION_MS`, `OVERLAY_HIDE_MS`, `NAV_HEIGHT`, `INIT_FAILSAFE_MS`

Do **not** duplicate any of these in `script.js` or `admin.js`. Do **not** convert to ES modules.

### SPA Behavior

- **Internal navigation** is intercepted by `script.js` (global click listener on `document`)
- Pages load via `fetch()` + DOM replacement of `#main-content` innerHTML — NOT browser navigation
- After content swap, `reinitAll()` re-attaches all event listeners, effects, and data injection
- **Always check** the SPA link interceptor when adding new interactive elements
- Scripts inside `#main-content` do NOT re-execute after SPA swap — keep all JS in external files
- The `<nav class="site-nav">` and all background/overlay elements live OUTSIDE `#main-content` so they persist across SPA navigations

### Navigation Bar

- Lives in **every** public HTML file as a sibling of `<main>`, inserted between the parallax divs and `<main>`
- Active link is set dynamically by `updateNavActive()` in `script.js`, called at the end of every `reinitAll()`
- Active link detection uses `window.location.pathname` matched against `data-page` attributes (`index`, `commission`, `gallery`, `tos`)
- Mobile hamburger menu is set up once in `script.js` outer scope (not in `reinitAll`) since the nav persists

### Admin Login Flow

```
admin-login.html  →  login.js  →  sessionStorage  →  admin.html
```

1. User enters secret key on `admin-login.html`
2. `login.js` hashes it with SHA-256 (Web Crypto API) and compares against `ADMIN_TOKEN_HASH`
3. Match → raw token stored as `sessionStorage.getItem('bonna_admin_token')` → redirect to `admin.html`
4. `admin.html` has an inline auth guard `<script>` as the **very first element in `<body>`** that redirects to `admin-login.html` if no session token
5. All save operations in `admin.js` read the token via `sessionStorage.getItem('bonna_admin_token')`
6. Logout clears sessionStorage and redirects to `admin-login.html`

**First-time hash setup:** Open `admin-login.html` in browser → DevTools console → run `await hashToken('your-gas-token')` → copy the 64-char hex → paste into `ADMIN_TOKEN_HASH` in `js/login.js`.

If `ADMIN_TOKEN_HASH` is empty string, any non-empty key grants access (dev mode).

### CMS/Data Flow

- **API endpoint** hardcoded in `script.js` (`const API_URL`) and `admin.js` (`CONFIG.API_URL`)
- **Sheets**: Profile, Prices, Gallery, CommissionTypes
- **Data injection**: `DataManager.injectAll()` in `script.js` populates elements by ID matching
  - `field-{Key}` → element gets `textContent` set to the value
  - `field-tagline` → stored as `data-full-text` attribute, then animated by typewriter
  - `about_text` → split by newlines → rendered as `.about-tag` list items in `#dynamic-about-tags`
  - `commission_status` → renders a `.commission-status-badge` into `#field-commission_status`
- **Price table**: Rendered dynamically by `renderPrices()` into `#dynamic-prices-container`
- **Gallery**: Rendered by `GalleryManager` class (singleton with AbortController cleanup)
- **Commission Samples**: Rendered by `CommissionPreviewManager` (singleton with AbortController cleanup)

### Commission Status Badge

Add/update a row in the Profile Google Sheet:

```
Key: commission_status
Value: open       ← or: closed / waitlist
```

The badge in `index.html` and `commission.html` (element `#field-commission_status`) updates automatically on next page load.

### Styling System

- **CSS Variables** defined in `:root` (`style.css`) — colors, spacing, fonts, transitions, `--nav-height`
- **Typography**: `Press Start 2P` (pixel headers/labels), `VT323` (body/descriptions)
- **Card component**: `.retro-card` with consistent border/shadow/glow treatment
- **Navigation**: `.site-nav` fixed at top; `.main-container` has `padding-top: calc(var(--nav-height) + var(--space-xl))` to offset
- **Animation**: `prefers-reduced-motion` respected throughout (`style.css` bottom section)

### Page Manager Singletons (Memory Leak Prevention)

`GalleryManager` and `CommissionPreviewManager` are instantiated via singletons in `script.js`:

```js
let _galleryManager = null;
let _commissionPreviewManager = null;
```

`reinitAll()` calls `.destroy()` on the old instance (aborts event listeners via AbortController) before creating a new one. Never use `new GalleryManager()` directly outside of `reinitAll()`.

### Audio

- **BGM**: Lo-fi track from SoundHelix, auto-plays after first interaction (browser policy)
- **Mute state**: Persisted in `localStorage` key `bonna_muted`
- **SFX**: Hover and click sounds on interactive elements
- **Re-attach**: `audioManager.attachUIListeners()` is called inside `reinitAll()` after every SPA swap

## Development Notes

### Testing Changes

```bash
# Any static server works
python -m http.server 8000
npx serve .
```

### Adding New Pages

1. Copy structure from `tos.html` (lightweight page template)
2. Copy the `<nav class="site-nav" ...>` block from any existing page and paste it between the parallax divs and `<main>`
3. Add `<script src="js/utils.js"></script>` before `<script src="js/script.js"></script>`
4. Links to internal pages will auto-intercept via SPA engine
5. Add a new `<a ... data-page="newpage" ...>` entry inside the nav HTML in **all** existing pages

### Imgur Integration

Image uploads in the admin dashboard route through Imgur:

1. Register at `https://api.imgur.com/oauth2/addclient` (anonymous auth)
2. Get the **Client ID**
3. Set it in `js/admin.js` → `CONFIG.IMGUR_CLIENT_ID`

### Admin Panel

- `admin.html` provides CMS UI for Profile, Gallery, and CommissionTypes sheets
- Requires login session — access via `admin-login.html` first
- POST requests use `mode: 'no-cors'` (blind send — no response confirmation possible)
- Token is read from `sessionStorage`, not a form field

### Mobile Considerations

- Breakpoints: 768px, 480px
- Nav hamburger appears at ≤480px; nav links collapse into a fixed drawer
- Touch: Cursor trail effects disabled on non-fine pointers
- Responsive grids collapse to single column

## No-Go Zones

- **No npm/build tools** — don't add package.json or bundlers
- **No backend** — all dynamic data comes from Google Apps Script
- **Don't break SPA** — internal links must use `<a href="page.html">` (JS intercepts automatically)
- **Don't add `<script>` tags inside `#main-content`** — they won't re-execute after SPA swaps
- **Don't use ES modules** — no `type="module"`, everything is global script scope
- **Don't duplicate BonnaUtils methods** — `getVal`, `escapeHtml`, `getDefaultDescription`, etc. must only live in `utils.js`
- **Don't load `utils.js` after `script.js` or `admin.js`** — it must always be first
