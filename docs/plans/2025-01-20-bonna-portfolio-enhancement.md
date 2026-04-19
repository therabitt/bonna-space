# Bonna Portfolio Enhancement - Implementation Plan

> **Project:** Meaningful Gift for Bonna - Digital Artist Portfolio  
> **Goal:** Create perfect no-code workflow for non-technical user  
> **Status:** Phase 1 Ready for Implementation  

---

## 📋 EXECUTIVE SUMMARY

Transform current static portfolio into **professional, self-managed portfolio** with:
- ✅ Dedicated Gallery page with filtering & lightbox
- ✅ Commission preview images per type
- ✅ Enhanced Admin Dashboard with image upload
- ✅ Hybrid image strategy (URL + File Upload)

---

## 🎯 PHASE-BY-PHASE IMPLEMENTATION

### **PHASE 1: Foundation & Gallery Page** ⏳ IN PROGRESS
**Duration:** ~2-3 sessions  
**Goal:** Create dedicated gallery.html with filtering, lightbox, and pagination

**Deliverables:**
- ✅ `gallery.html` - New full gallery page
- ✅ Update `index.html` - Remove showcase section, add gallery link
- ✅ Update `css/style.css` - Gallery-specific styles
- ✅ Update `js/script.js` - Gallery rendering logic

**Key Features:**
- Filter pills by type (dynamic from Prices sheet)
- Lightbox modal for full image view
- "Load More" pagination (6 items per load)

**Tasks:**
1. Create `gallery.html` structure (copy from `tos.html`)
2. Add gallery styles to `css/style.css`
3. Add gallery rendering logic to `js/script.js`
4. Update `index.html` (remove showcase section)
5. Create Google Sheets `Gallery` sheet

---

### **PHASE 2: Commission Page Enhancement** 📅 PENDING
**Duration:** ~2 sessions  
**Goal:** Add preview images per commission type

**Deliverables:**
- ✅ Update `commission.html` - Add preview section
- ✅ Update `js/script.js` - Commission preview renderer
- ✅ Update Google Sheets - Add CommissionTypes sheet

**Key Features:**
- Grid layout below pricing table
- 1 sample image per commission type
- Dynamic rendering from Sheets

---

### **PHASE 3: Admin Dashboard 2.0 - Core Structure** 📅 PENDING
**Duration:** ~3 sessions  
**Goal:** Reorganize admin with better UX and new tabs

**Deliverables:**
- ✅ Create `js/admin.js` - Separated admin logic
- ✅ Create `css/admin.css` - Admin-specific styles
- ✅ Major `admin.html` redesign - New tab structure

**Key Features:**
- New tab: Gallery Manager
- New tab: Commission Manager
- Better visual feedback (toasts, loading states)
- Side-by-side live preview

---

### **PHASE 4: Image Upload System (Hybrid)** 📅 PENDING
**Duration:** ~3 sessions  
**Goal:** Implement URL + File Upload with Imgur integration

**Deliverables:**
- ✅ Imgur upload integration (with placeholder Client-ID)
- ✅ File-to-URL conversion flow
- ✅ Image validation and preview

**Key Flow:**
```
User selects file → Convert to Base64 → Upload to Imgur → 
Get direct URL → Save to Sheets → Display in Gallery
```

---

### **PHASE 5: Integration & Polish** 📅 PENDING
**Duration:** ~2 sessions  
**Goal:** Test all flows, add error handling, final polish

**Deliverables:**
- ✅ End-to-end testing (Sheets → Website)
- ✅ Error handling and fallbacks
- ✅ Mobile responsive check
- ✅ Final aesthetic polish

---

## 📁 GOOGLE SHEETS STRUCTURE

### **Sheet 1: Profile** (Existing)
```csv
Key,Value
tagline,Welcome to Bonna's space...
about_name,BONNA LUCINE DE BUTTERBON
about_text,💜 You may call me Bonna :3🦋 She/Her...
```

### **Sheet 2: Prices** (Existing - used for dropdown)
```csv
Category,Type,PriceUSD,PriceIDR
Chibi,Base,15,225000
Close Up,Base,20,300000
Half Body,Base,25,375000
Full Body,Base,35,525000
```

### **Sheet 3: Gallery** ★NEW★
```csv
ID,Title,ImageURL,Type,Description,Order,CreatedAt
1,Chibi Sample,https://i.imgur.com/xxx.jpg,Chibi,Sample...,1,2024-01-15
```

### **Sheet 4: CommissionTypes** ★NEW★
```csv
Type,SampleImage,Description,DisplayOrder
Chibi,https://i.imgur.com/xxx.jpg,Cute chibi characters,1
Close Up,https://i.imgur.com/xxx.jpg,Portrait style,2
```

---

## 🔧 IMGUR SETUP DOCUMENTATION

### **Step 1: Register Imgur App**
1. Go to: https://api.imgur.com/oauth2/addclient
2. Application name: `BonnaPortfolio`
3. Authorization type: `Anonymous usage without user authentication`
4. Callback URL: (leave blank or put `https://localhost`)
5. Email: Your email
6. Description: `Image hosting for artist portfolio`

### **Step 2: Get Client ID**
After registration, you'll receive:
- **Client ID**: `xxxxxxxxxxxxxxx` (will be placed in code)
- Client Secret: (not needed for anonymous uploads)

### **Step 3: Update Code**
In `js/admin.js`, find:
```javascript
const IMGUR_CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
```

Replace with your actual Client ID.

### **Limits (Free Tier):**
- 1,250 uploads per day
- Images stored permanently
- Perfect for portfolio needs

---

## 🎨 DESIGN DECISIONS CONFIRMED

### Gallery Page:
- ✅ **Grid:** Fixed columns (responsive: 3 on desktop, 2 on tablet, 1 on mobile)
- ✅ **Aspect Ratio:** Square (1:1) with object-fit: cover
- ✅ **Filter Position:** Above grid, pill-style buttons
- ✅ **Lightbox:** 
  - Close on backdrop click: Yes
  - Show title/description: Yes
  - Navigation arrows: Yes

---

## 📂 FINAL FILE STRUCTURE

```
bonna-portfolio/
├── index.html              # Home (gallery removed)
├── gallery.html            # ★NEW★ Full gallery page
├── commission.html         # Enhanced with previews
├── tos.html               # (as-is)
├── admin.html             # Enhanced dashboard
├── css/
│   ├── style.css          # Main styles
│   └── admin.css          # ★NEW★ Admin styles
├── js/
│   ├── script.js          # Main SPA logic
│   └── admin.js           # ★NEW★ Admin logic
├── docs/
│   └── plans/
│       └── 2025-01-20-bonna-portfolio-enhancement.md  # This file
└── assets/
    └── (images)
```

---

## ✅ ACCEPTANCE CRITERIA

### Phase 1:
- [ ] `gallery.html` exists and loads
- [ ] Filter buttons work (filter by type)
- [ ] Lightbox opens on image click
- [ ] "Load More" loads next 6 items
- [ ] Gallery section removed from `index.html`
- [ ] Navigation link to gallery exists

### Phase 2:
- [ ] Commission preview section exists
- [ ] 1 sample image per commission type
- [ ] Images load dynamically from Sheets

### Phase 3:
- [ ] Admin dashboard has Gallery Manager tab
- [ ] Admin dashboard has Commission Manager tab
- [ ] Live preview works

### Phase 4:
- [ ] File upload works
- [ ] Images auto-upload to Imgur
- [ ] URLs saved to Sheets

### Phase 5:
- [ ] All flows tested end-to-end
- [ ] Mobile responsive
- [ ] Error handling in place

---

## 📝 CHANGELOG

| Date | Phase | Notes |
|------|-------|-------|
| 2025-01-20 | Plan Created | Initial comprehensive plan |

---

**Next Action:** Begin Phase 1 Implementation
