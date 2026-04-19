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
├── index.html          # Home (profile, skills, gallery)
├── commission.html     # Commission info & pricing
├── tos.html            # Terms of Service
├── admin.html          # CMS dashboard for editing data
├── css/style.css       # Single CSS file (1700+ lines, comprehensive)
├── js/script.js        # Single JS file (SPA + audio + effects)
└── assets/             # Images (mascot, artwork)
```

## Critical Conventions

### SPA Behavior
- **Internal navigation** is intercepted by JS (`script.js:414-430`)
- Pages load via `fetch()` + DOM replacement, NOT browser navigation
- After content swap, `reinitAll()` re-attaches all event listeners and effects
- **Always check** `script.js` event delegation logic when adding new interactive elements

### CMS/Data Flow
- **API endpoint** hardcoded in `script.js:8` and `admin.html:146`
- **Sheets**: Profile, Prices, Showcase/Gallery
- **Data injection**: `DataManager.injectAll()` populates elements by ID matching
- **Price table**: Rendered dynamically by `renderPrices()` — edits to `commission.html` pricing must be coordinated with Sheets data

### Styling System
- **CSS Variables** defined in `:root` (`style.css:10-81`) — colors, spacing, fonts, transitions
- **Typography**: `Press Start 2P` (pixel headers), `VT323` (body)
- **Card component**: `.retro-card` with consistent border/shadow/glow treatment
- **Animation**: `prefers-reduced-motion` respected throughout (`style.css:1605-1709`)

### Audio
- **BGM**: Lo-fi track from SoundHelix, auto-plays after first interaction (browser policy)
- **Mute state**: Persisted in `localStorage` key `bonna_muted`
- **SFX**: Hover and click sounds on interactive elements
- **Re-attach**: `attachUIListeners()` must be called after DOM changes

## Development Notes

### Testing Changes
```bash
# Any static server works
python -m http.server 8000
npx serve .
```

### Adding New Pages
1. Copy structure from `tos.html` (lightweight page template)
2. Include: preloader, background layers, `#main-content`, sound controller
3. Links to internal pages will auto-intercept via SPA engine

### Admin Panel
- `admin.html` provides UI for updating Google Sheets data
- Requires "SECRET ACCESS TOKEN" (set in Apps Script)
- POST requests use `mode: 'no-cors'` (blind send, no response confirmation)

### Mobile Considerations
- Breakpoints: 768px, 480px
- Touch: Cursor trail effects disabled on non-fine pointers
- Responsive grids collapse to single column

## External Dependencies
- FontAwesome 6.6.0 (CDN)
- Google Fonts: Press Start 2P, VT323
- BGM: SoundHelix CDN
- SFX: Mixkit CDN

## No-Go Zones
- **No npm/build tools** — don't add package.json or bundlers
- **No backend** — all dynamic data comes from Google Apps Script
- **Don't break SPA** — internal links must use `<a href="page.html">` (JS intercepts automatically)
