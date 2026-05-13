/* ============================================
   BONNA - Admin Dashboard 2.0
   Professional CMS with Live Preview
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  API_URL:
    "https://script.google.com/macros/s/AKfycbxY6ITbRNFv8FyuTp_DLkcoT_0Tx1cSau3yjimbo2riZ_gNP9u21Oh0xzkcYPiWPObh/exec",
  IMGUR_CLIENT_ID: "b845c328e2e3330",
};

// ============================================
// PRESENCE CONFIGURATION
// Single source of truth for all personal dates & settings
// ============================================
const PRESENCE_CONFIG = {
  togetherSince: '2026-04-17',
  letterActivationDays: 14,
  midnightWindow: { start: 0, end: 1 },

  // Phase 4: fill these before the dates arrive — format 'YYYY-MM-DD'
  anniversaryDates: ['2026-05-13'],   // e.g. ['2026-04-17'] — triggers Anniversary Takeover
  specialDates: {
    // Farewell day — the day this studio was given to her
    '2026-05-13': 'A new chapter starts today. And I will be here for all of it.',
  },

  // The Song — update title/artist when you add the file
  song: {
    title:  'The Moon Song',
    artist: 'Karen O',
  },

  // Anniversary Takeover greeting — set before the date arrives
  anniversaryGreeting: 'Today. Of all the days — today. 💙',

  greetingPool: [
    'Bonjour, belle âme.',
    'Welcome home.',
    'Your art makes the world a little more honest. ✨',
    'Still my favorite person. Day [X].',
    'Something good is waiting for you today.',
    'The studio missed you. I did too.',
    'Je t’aime plus qu’hier, moins que demain.',
    'You showed up. That’s already enough.',
    'Finally. I’ve been here, waiting.',
    'Every time you open this, I’m glad you did.',
  ],
  loginSubtitles: [
    'A quiet corner of the internet, made for you.',
    'Un sanctuaire numérique, fait avec soin.',
    'Pixel by pixel. With intention.',
    'Everything here was made thinking of you.',
    'Come in. You’re always welcome here.',
    'This space has been waiting, quietly.',
  ],
};

// ── Discovery Tracking ──
const discoveryState = {
  features: { song: false, love: false, uptime: false, mascot: false },
  track(f) {
    if (this.features[f] === false) {
      this.features[f] = true;
      localStorage.setItem('bonna_discovery_' + f, 'true');
    }
  },
  isAllFound() { return Object.values(this.features).every(v => v); },
  load() {
    for (let k in this.features) if (localStorage.getItem('bonna_discovery_' + k)) this.features[k] = true;
  }
};
discoveryState.load();

// ============================================
// PRESENCE SYSTEM — Layer 1
// ============================================
const presenceSystem = {
  init() {
    this.showFirstTime();
    this.renderGreeting();
    this.renderCounter();
    this.initLogoutTooltip();
    this.renderCountdown();
    this.checkAnniversary();
    this.setupUptimeHold();
  },

  // --- Together Since Counter ---
  getTogetherSinceDays() {
    const since = new Date(PRESENCE_CONFIG.togetherSince);
    const now = new Date();
    // Zero out time for clean day diff
    since.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - since) / (1000 * 60 * 60 * 24));
    return diff;
  },

  renderCounter() {
    const el = document.getElementById('admin-together-since');
    if (!el) return;
    const days = this.getTogetherSinceDays();
    el.innerHTML = `[ SYS.UPTIME: ${String(days).padStart(3, '0')} ]`;
  },

  setupUptimeHold() {
    const el = document.getElementById('admin-together-since');
    if (!el) return;
    
    let holdTimer = null;
    const days = this.getTogetherSinceDays();
    const secretText = `[ ${days} DAYS WITH YOU ]`;
    
    const startHold = () => {
      holdTimer = setTimeout(() => {
        el.textContent = secretText;
        el.style.color = 'var(--clr-gold)';
        el.style.textShadow = '0 0 15px var(--clr-gold)';
        discoveryState.track('uptime');
      }, 2000);
    };
    
    const endHold = () => {
      clearTimeout(holdTimer);
      el.textContent = `[ SYS.UPTIME: ${String(days).padStart(3, '0')} ]`;
      el.style.color = '';
      el.style.textShadow = '';
    };
    
    el.addEventListener('mousedown', startHold);
    el.addEventListener('touchstart', startHold);
    window.addEventListener('mouseup', endHold);
    window.addEventListener('touchend', endHold);
  },


  // --- Daily Greeting Rotation ---
  // Same greeting for the whole day; does not repeat within 7 days
  renderGreeting() {
    const el = document.getElementById('admin-daily-greeting');
    if (!el) return;

    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const pool = PRESENCE_CONFIG.greetingPool;
    const days = this.getTogetherSinceDays();

    // --- Special date override (takes priority over all else) ---
    if (PRESENCE_CONFIG.specialDates && PRESENCE_CONFIG.specialDates[today]) {
      el.textContent = PRESENCE_CONFIG.specialDates[today].replace('[X]', days);
      return;
    }

    // --- Anniversary override (day-of) ---
    const isAnniversary = (PRESENCE_CONFIG.anniversaryDates || []).some(d => {
      const t = new Date(d);
      const now = new Date();
      return t.getMonth() === now.getMonth() && t.getDate() === now.getDate();
    });
    if (isAnniversary) {
      el.textContent = PRESENCE_CONFIG.anniversaryGreeting.replace('[X]', days);
      return;
    }

    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem('bonna_last_greeting') || '{}');
    } catch(_) { stored = {}; }

    // If already picked today, use that
    if (stored.date === today && typeof stored.index === 'number') {
      let text = pool[stored.index];
      text = text.replace('[X]', days);
      el.textContent = text;
      return;
    }

    // Build a list of indices not used in the last 7 days
    const recentIndices = (stored.recent || []).slice(-6); // keep last 6
    const available = pool.map((_, i) => i).filter(i => !recentIndices.includes(i));
    const pick = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : Math.floor(Math.random() * pool.length);

    const recent = [...(stored.recent || []), pick].slice(-7);
    localStorage.setItem('bonna_last_greeting', JSON.stringify({
      date: today,
      index: pick,
      recent,
    }));

    let text = pool[pick];
    text = text.replace('[X]', days);
    el.textContent = text;
  },

  // --- The First Time marker ---
  // A single, unrepeatable moment. Never shown twice.
  showFirstTime() {
    if (localStorage.getItem('bonna_first_visit')) return;
    localStorage.setItem('bonna_first_visit', '1');

    // Pick the right message depending on whether it's the farewell day
    const today = new Date().toISOString().split('T')[0];
    const isFarewellDay = today === '2026-05-13';

    const message = isFarewellDay
      ? 'One chapter ends. I built this so the next one has somewhere to begin.'
      : 'You found it. I made this for you.';

    const overlay = document.createElement('div');
    overlay.id = 'first-time-overlay';
    overlay.innerHTML = `<span class="first-time-text">${message}</span>`;
    document.body.appendChild(overlay);

    // Hold for 3.5 seconds on farewell day (the weight deserves more time)
    const holdMs = isFarewellDay ? 3500 : 3000;
    setTimeout(() => {
      overlay.classList.add('first-time-fade');
      setTimeout(() => overlay.remove(), 1200);
    }, holdMs);
  },

  // --- Logout tooltip ---
  initLogoutTooltip() {
    const btn = document.getElementById('btn-logout');
    if (!btn) return;
    btn.setAttribute('title', 'Leaving so soon? 🦥');
  },

  // --- Countdown to Something ---
  // Returns days until the next anniversary, or -1 if none configured
  _getDaysUntilAnniversary() {
    const dates = PRESENCE_CONFIG.anniversaryDates;
    if (!dates || dates.length === 0) return -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nearest = Infinity;
    for (const d of dates) {
      const target = new Date(d);
      target.setHours(0, 0, 0, 0);
      // Compute this year's occurrence
      const thisYear = new Date(today.getFullYear(), target.getMonth(), target.getDate());
      let diff = Math.floor((thisYear - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) {
        // Already passed this year — look at next year
        const nextYear = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
        diff = Math.floor((nextYear - today) / (1000 * 60 * 60 * 24));
      }
      if (diff < nearest) nearest = diff;
    }
    return nearest === Infinity ? -1 : nearest;
  },

  renderCountdown() {
    // Remove any existing countdown line first
    const existing = document.getElementById('admin-countdown-line');
    if (existing) existing.remove();

    const days = this._getDaysUntilAnniversary();
    if (days < 0 || days > 7) return; // Only show within 7-day window
    if (days === 0) return; // Day itself — Anniversary Takeover handles it

    const counterEl = document.getElementById('admin-together-since');
    if (!counterEl) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'admin-countdown-line'; // Reuse ID so removal logic still works
    wrapper.className = 'admin-countdown-wrapper';
    
    wrapper.innerHTML = `
      <div class="countdown-ticket">
        <div class="ticket-icon">
          <i class="fa-solid fa-envelope"></i>
        </div>
        <div class="ticket-content">
          <span class="ticket-days">${days} DAY${days === 1 ? '' : 'S'}</span>
          <span class="ticket-text">REMAINING...</span>
        </div>
      </div>
    `;

    counterEl.insertAdjacentElement('afterend', wrapper);
  },

  // --- Anniversary Takeover ---
  checkAnniversary() {
    const dates = PRESENCE_CONFIG.anniversaryDates;
    if (!dates || dates.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    const isAnniversary = dates.some(d => {
      // Match month-day regardless of year
      const t = new Date(d);
      const todayDate = new Date();
      return t.getMonth() === todayDate.getMonth() && t.getDate() === todayDate.getDate();
    });

    if (!isAnniversary) return false;

    // Only trigger once per calendar day
    const lastTakeover = localStorage.getItem('bonna_last_anniversary');
    if (lastTakeover === today) return true; // Already ran today, keep state
    localStorage.setItem('bonna_last_anniversary', today);

    // Override greeting
    const greetingEl = document.getElementById('admin-daily-greeting');
    if (greetingEl) greetingEl.textContent = PRESENCE_CONFIG.anniversaryGreeting;

    // Add anniversary class (triggers CSS glow)
    document.body.classList.add('anniversary-mode');

    // Launch confetti after a short delay
    setTimeout(() => this._launchConfetti(), 1000);

    return true;
  },

  _launchConfetti() {
    // Themed geometric CSS particles — colors from the design system
    const colors = [
      'var(--clr-gold)',
      'var(--clr-peach)',
      'var(--clr-coral)',
      'var(--clr-salmon)',
      'rgba(180,140,220,0.9)',
      'rgba(255,255,255,0.6)',
    ];
    const shapes = ['shape-square','shape-diamond','shape-dot','shape-rect'];
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = `confetti-piece ${shapes[Math.floor(Math.random() * shapes.length)]}`;
        el.style.setProperty('--confetti-clr', colors[Math.floor(Math.random() * colors.length)]);
        el.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 120}px`);
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (3 + Math.random() * 3) + 's';
        if (el.classList.contains('shape-diamond')) {
          el.style.transform = 'rotate(45deg)';
        }
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 6500);
      }, i * 120);
    }
  },

  init() {
    this.showFirstTime();
    this.renderGreeting();
    this.renderCounter();
    this.initLogoutTooltip();
    this.renderCountdown();
    this.checkAnniversary();
    this.setupUptimeHold();
  },
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  cache: null,
  currentTab: "profile",
  unsavedChanges: false,
  uploadInProgress: false,
};

// ============================================
// API FUNCTIONS
// ============================================
const api = {
  // Fetch all data from Google Sheets
  async fetchData() {
    try {
      BonnaUtils.showToast("Just a moment, ma chérie...", "info");
      const response = await fetch(CONFIG.API_URL);
      const data = await response.json();
      state.cache = data;
      console.log("✨ Presence data synced:", data);
      BonnaUtils.showToast("Connected. Everything’s here. 💫", "success");
      return data;
    } catch (err) {
      console.error("❌ Data sync failed:", err);
      BonnaUtils.showToast("Something went quietly wrong. Try once more?", "error");
      return null;
    }
  },

  // Save data to Google Sheets
  async saveData(targetSheet, data, token) {
    try {
      const payload = {
        token,
        targetSheet,
        data,
      };

      await fetch(CONFIG.API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      return true;
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  },

  // Upload image to Imgur with validation
  async uploadToImgur(file) {
    // Validation
    if (!file) {
      throw new Error("No file selected");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Allowed: JPG, PNG, GIF, WebP");
    }

    if (file.size > 5 * 1024 * 1024) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      throw new Error(`File too large: ${sizeMB}MB. Max: 5MB`);
    }

    // Check Client ID
    if (CONFIG.IMGUR_CLIENT_ID === "YOUR_IMGUR_CLIENT_ID_HERE") {
      throw new Error(
        "Imgur Client ID not configured. Please add your Client ID in js/admin.js line 11",
      );
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "file");
    formData.append("title", file.name);

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${CONFIG.IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.data?.error || `Upload failed: HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.data?.error || "Upload failed");
    }

    return data.data.link;
  },
};

// ============================================
// TAB MANAGEMENT
// ============================================
const tabManager = {
  // Switch between tabs
  switchTab(tabId) {
    // Update state
    state.currentTab = tabId;

    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.style.display = "none";
      tab.classList.remove("active");
    });

    // Remove active class from all buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabId}`);
    if (selectedTab) {
      selectedTab.style.display = "block";
      selectedTab.classList.add("active");
    }

    // Activate button
    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add("active");
    }

    // Load tab-specific data
    if (tabId === "gallery") {
      galleryManager.loadGalleryEditor();
    } else if (tabId === "commission") {
      commissionManager.loadCommissionEditor();
    } else if (tabId === "profile") {
      profileManager.loadProfileEditor();
    }

    // Update URL hash for deep linking
    window.location.hash = tabId;
  },

  // Initialize tabs
  init() {
    // Check for hash in URL
    const hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(`tab-${hash}`)) {
      this.switchTab(hash);
    } else {
      this.switchTab("profile");
    }

    // Add click handlers to tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });
  },
};

// ============================================
// PROFILE MANAGER
// ============================================
const profileManager = {
  loadProfileEditor() {
    if (!state.cache?.Profile) return;

    state.cache.Profile.forEach((item) => {
      const input = document.getElementById(`input-${item.Key}`);
      if (input) {
        input.value = item.Value;
      }
    });

    // Update live preview
    this.updatePreview();
  },

  updatePreview() {
    const tagline = document.getElementById("input-tagline")?.value || "";
    const name = document.getElementById("input-about_name")?.value || "";
    const bioText = document.getElementById("input-about_text")?.value || "";

    // Update preview elements
    const previewTagline = document.getElementById("preview-tagline");
    const previewName = document.getElementById("preview-name");
    const previewTags = document.getElementById("preview-tags");

    if (previewTagline) previewTagline.textContent = tagline;
    if (previewName) previewName.textContent = name;

    if (previewTags && bioText) {
      const lines = bioText.split("\n").filter((l) => l.trim() !== "");
      previewTags.innerHTML = lines
        .map((line) => {
          const emojiMatch = line.match(
            /^(\ud83c[\udf00-\uffff]|\ud83d[\udc00-\ude4f\ude80-\udeff]|\ud83e[\udd00-\uddff]|[\u2600-\u27bf])\s*/,
          );
          if (emojiMatch) {
            const emoji = emojiMatch[0];
            const text = line.replace(emoji, "");
            return `<span class="preview-tag"><span class="tag-emoji">${emoji}</span> ${BonnaUtils.escapeHtml(text)}</span>`;
          }
          return `<span class="preview-tag">${BonnaUtils.escapeHtml(line)}</span>`;
        })
        .join("");
    }
  },

  async save() {
    const token = sessionStorage.getItem("bonna_admin_token") || "";
    if (!token) {
      BonnaUtils.showToast("Session expired. Please log in again.", "error");
      setTimeout(() => window.location.replace("admin-login.html"), 1500);
      return;
    }

    const btn = document.getElementById("btn-save-profile");
    BonnaUtils.showLoading(btn, "Saving...");

    try {
      const data = [
        {
          Key: "tagline",
          Value: document.getElementById("input-tagline")?.value || "",
        },
        {
          Key: "about_name",
          Value: document.getElementById("input-about_name")?.value || "",
        },
        {
          Key: "about_text",
          Value: document.getElementById("input-about_text")?.value || "",
        },
      ];

      await api.saveData("Profile", data, token);
      BonnaUtils.showToast("Saved. The world sees you a little more clearly now. 💫", "success");
    } catch (err) {
      BonnaUtils.showToast("Error saving profile: " + err.message, "error");
    } finally {
      BonnaUtils.hideLoading(btn);
    }
  },
};

// ============================================
// GALLERY MANAGER
// ============================================
const galleryManager = {
  currentEditId: null,
  galleryItems: [],

  loadGalleryEditor() {
    this.galleryItems = state.cache?.Gallery || state.cache?.Showcase || [];
    this.renderGalleryList();
    commissionManager.populateGalleryDropdowns();
  },

  renderGalleryList() {
    const container = document.getElementById("gallery-editor-list");
    if (!container) return;

    if (this.galleryItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <h3>Empty Canvas</h3>
          <p>"This canvas is still waiting for your touch. This empty space is an invitation for you to show the world what you can create..."</p>
          <p class="empty-state-hint">Click the '+ Add Artwork' button above to start filling this gallery.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.galleryItems
      .map((item, index) => {
        const id = BonnaUtils.getVal(item, "ID") || index + 1;
        const title = BonnaUtils.getVal(item, "Title") || "Untitled";
        const imageUrl = BonnaUtils.getVal(item, "ImageURL");
        const type = BonnaUtils.getVal(item, "Type") || "Uncategorized";
        const category = BonnaUtils.getVal(item, "Category") || "";
        const desc = BonnaUtils.getVal(item, "Description") || "";

        return `
        <div class="admin-editor-item" data-index="${index}">
          <div class="admin-editor-thumb">
            ${imageUrl ? `<img src="${imageUrl}" alt="${BonnaUtils.escapeHtml(title)}" loading="lazy">` : '<i class="fa-solid fa-image"></i>'}
          </div>
          <div class="admin-editor-info">
            <h4 class="admin-editor-title">${BonnaUtils.escapeHtml(title)}</h4>
            <div class="admin-editor-meta-container">
              ${category ? `<span class="admin-editor-meta">${BonnaUtils.escapeHtml(category)}</span>` : ""}
              <span class="admin-editor-meta">${BonnaUtils.escapeHtml(type)}</span>
            </div>
            ${desc ? `<p class="admin-editor-desc">${BonnaUtils.escapeHtml(desc)}</p>` : ""}
          </div>
          <div class="admin-editor-actions">
            <button class="admin-editor-btn edit" data-action="edit" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="admin-editor-btn delete" data-action="delete" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  },

  // Open add/edit modal
  openModal(mode = "add", index = null) {
    const modal = document.getElementById("gallery-modal");
    const title = document.getElementById("gallery-modal-title");
    const form = document.getElementById("gallery-form");

    this.currentEditId = mode === "edit" && index !== null ? index : null;

    title.textContent = mode === "edit" ? "Edit Artwork" : "Add New Artwork";

    if (mode === "edit" && index !== null) {
      const item = this.galleryItems[index];
      document.getElementById("gallery-input-title").value =
        BonnaUtils.getVal(item, "Title") || "";
      document.getElementById("gallery-input-url").value =
        BonnaUtils.getVal(item, "ImageURL") || "";
      document.getElementById("gallery-input-type").value =
        BonnaUtils.getVal(item, "Type") || "";
      document.getElementById("gallery-input-category").value =
        BonnaUtils.getVal(item, "Category") || "";
      document.getElementById("gallery-input-desc").value =
        BonnaUtils.getVal(item, "Description") || "";
    } else {
      form.reset();
    }

    commissionManager.populateGalleryDropdowns();
    this.updateGalleryPreview();
    modal.classList.add("active");
  },

  closeModal() {
    const modal = document.getElementById("gallery-modal");
    modal.classList.remove("active");
    this.currentEditId = null;
  },

  // Update live preview in modal
  updateGalleryPreview() {
    const title =
      document.getElementById("gallery-input-title")?.value || "Untitled";
    const imageUrl = document.getElementById("gallery-input-url")?.value || "";
    const type =
      document.getElementById("gallery-input-type")?.value || "Artwork";
    const category =
      document.getElementById("gallery-input-category")?.value || "";

    const previewContainer = document.getElementById(
      "gallery-preview-container",
    );
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div class="gallery-preview-card">
        <div class="gallery-preview-image">
          ${imageUrl ? `<img src="${imageUrl}" alt="${BonnaUtils.escapeHtml(title)}" onerror="this.src=''">` : '<div class="gallery-preview-placeholder"><i class="fa-solid fa-image"></i><span>No image</span></div>'}
        </div>
        <div class="admin-editor-info" style="padding: var(--space-sm);">
          <h4 class="admin-editor-title">${BonnaUtils.escapeHtml(title)}</h4>
          <div class="admin-editor-meta" style="font-size: 0.7rem;">${category ? BonnaUtils.escapeHtml(category) + " · " : ""}${BonnaUtils.escapeHtml(type)}</div>
        </div>
      </div>
    `;
  },

  // Handle file upload with enhanced UX
  async handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Show file info
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const fileName =
      file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name;

    // Update UI to show selected file
    const uploadBtn = input
      .closest(".file-upload-wrapper")
      ?.querySelector(".file-upload-btn");
    if (uploadBtn) {
      uploadBtn.innerHTML = `<i class="fa-solid fa-file-image"></i> ${fileName} (${fileSizeMB}MB)`;
    }

    try {
      BonnaUtils.showToast(`Uploading “${fileName}”…`, "info");
      const imageUrl = await api.uploadToImgur(file);

      document.getElementById("gallery-input-url").value = imageUrl;
      this.updateGalleryPreview();

      BonnaUtils.showToast(
        `Archived. Another piece of your world, kept safe. ✨`,
        "success",
      );

      // Reset button text after success
      if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fa-solid fa-check"></i> Uploaded!`;
        setTimeout(() => {
          uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
        }, 2000);
      }
    } catch (err) {
      BonnaUtils.showToast(`Something went quietly wrong: ${err.message}`, "error");

      // Reset button on error
      if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
      }
    }
  },

  // Save gallery item
  async saveItem() {
    const token = sessionStorage.getItem("bonna_admin_token") || "";
    if (!token) {
      BonnaUtils.showToast("Session expired. Please log in again.", "error");
      setTimeout(() => window.location.replace("admin-login.html"), 1500);
      return;
    }

    const title = document.getElementById("gallery-input-title")?.value.trim();
    const imageUrl = document.getElementById("gallery-input-url")?.value.trim();
    const type = document.getElementById("gallery-input-type")?.value.trim();
    const category =
      document.getElementById("gallery-input-category")?.value.trim() || "";
    const desc = document.getElementById("gallery-input-desc")?.value.trim();

    if (!title || !imageUrl) {
      BonnaUtils.showToast("Title and Image are required!", "error");
      return;
    }

    const btn = document.getElementById("btn-save-gallery-item");
    BonnaUtils.showLoading(btn, "Saving...");

    try {
      let data;

      if (this.currentEditId !== null) {
        // Edit existing
        data = [...this.galleryItems];
        data[this.currentEditId] = {
          ID:
            BonnaUtils.getVal(this.galleryItems[this.currentEditId], "ID") ||
            this.currentEditId + 1,
          Title: title,
          ImageURL: imageUrl,
          Type: type,
          Category: category,
          Description: desc,
          Order: this.currentEditId + 1,
          Date: BonnaUtils.getVal(this.galleryItems[this.currentEditId], "Date") || "",  
          Likes: BonnaUtils.getVal(this.galleryItems[this.currentEditId], "Likes") || 0,
        };
      } else {
        // Add new
        const newId = this.galleryItems.length + 1;
        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        data = [
          ...this.galleryItems,
          {
            ID: newId,
            Title: title,
            ImageURL: imageUrl,
            Type: type,
            Category: category,
            Description: desc,
            Order: newId,
            Date: today,
            Likes: 0,
          },
        ];
      }

      await api.saveData("Gallery", data, token);

      // Update local cache
      state.cache.Gallery = data;
      this.galleryItems = data;

      this.renderGalleryList();
      this.closeModal();
      BonnaUtils.showToast("Archived. Another piece of your world, kept safe. ✨", "success");
    } catch (err) {
      BonnaUtils.showToast("Error saving: " + err.message, "error");
    } finally {
      BonnaUtils.hideLoading(btn);
    }
  },

  // Edit item
  editItem(index) {
    this.openModal("edit", index);
  },

  // Delete item
  async deleteItem(index) {
    if (!confirm("Are you sure you want to delete this artwork?")) return;

    const token = sessionStorage.getItem("bonna_admin_token") || "";
    if (!token) {
      BonnaUtils.showToast("Session expired. Please log in again.", "error");
      setTimeout(() => window.location.replace("admin-login.html"), 1500);
      return;
    }

    try {
      const data = [...this.galleryItems];
      data.splice(index, 1);

      // Reorder items
      data.forEach((item, i) => {
        item.Order = i + 1;
      });

      await api.saveData("Gallery", data, token);

      state.cache.Gallery = data;
      this.galleryItems = data;
      this.renderGalleryList();

      BonnaUtils.showToast("Let go. Brave, as always. 💙", "success");
    } catch (err) {
      BonnaUtils.showToast("Error deleting: " + err.message, "error");
    }
  },
};

// ============================================
// COMMISSION MANAGER (reads/writes Prices sheet)
// ============================================
const commissionManager = {
  priceItems: [],

  loadCommissionEditor() {
    this.priceItems = state.cache?.Prices || [];
    this.renderCommissionList();
  },

  populateGalleryDropdowns() {
    const priceItems = state.cache?.Prices || [];
    
    // --- Style (Category) select ---
    const categorySelect = document.getElementById("gallery-input-category");
    if (categorySelect) {
      const categories = [
        ...new Set(priceItems.map((p) => p.Category).filter(Boolean)),
      ];
      const currentCat = categorySelect.value;
      categorySelect.innerHTML = `
        <option value="">Select Style</option>
        ${categories
          .map(
            (c) =>
              `<option value="${BonnaUtils.escapeHtml(c)}">${BonnaUtils.escapeHtml(c)}</option>`,
          )
          .join("")}
      `;
      if (currentCat) categorySelect.value = currentCat;
    }

    // --- Type select ---
    const typeSelect = document.getElementById("gallery-input-type");
    if (typeSelect) {
      const rawTypes = priceItems
        .map((p) => p.Type || p.Category)
        .filter(Boolean);
      const types = [...new Set(rawTypes)];
      const currentType = typeSelect.value;
      typeSelect.innerHTML = `
        <option value="">Select Type</option>
        ${types
          .map(
            (t) =>
              `<option value="${BonnaUtils.escapeHtml(t)}">${BonnaUtils.escapeHtml(t)}</option>`,
          )
          .join("")}
        <option value="Other">Other</option>
      `;
      if (currentType) typeSelect.value = currentType;
    }
  },

  renderCommissionList() {
    const container = document.getElementById("commission-editor-list");
    if (!container) return;

    if (this.priceItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-heart-pulse"></i>
          <h3>Architect's Note</h3>
          <p>"The world is waiting for your magic. Let's begin by listing the wonders you have to offer them..."</p>
          <p class="empty-state-hint">Add a new row to the 'Prices' sheet in your Google Sheets to see it appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.priceItems
      .map((item, index) => {
        const category = BonnaUtils.getVal(item, "Category");
        const type = BonnaUtils.getVal(item, "Type");
        const sampleImage = BonnaUtils.getVal(item, "SampleImage");
        const priceUSD = BonnaUtils.getVal(item, "PriceUSD");
        const priceIDR = BonnaUtils.getVal(item, "PriceIDR");
        const desc = BonnaUtils.getVal(item, "Description") || "";

        const priceDisplay = priceUSD
          ? `$${priceUSD}` + (priceIDR ? ` / Rp${priceIDR}` : "")
          : "Contact for pricing";

        return `
        <div class="admin-editor-item" data-index="${index}">
          <div class="admin-editor-thumb">
            ${sampleImage ? `<img src="${sampleImage}" alt="${BonnaUtils.escapeHtml(type)}" loading="lazy">` : '<i class="fa-solid fa-palette"></i>'}
          </div>
          <div class="admin-editor-info">
            <h4 class="admin-editor-title">${BonnaUtils.escapeHtml(type)}</h4>
            <div class="admin-editor-meta-container">
              ${category ? `<span class="admin-editor-meta">${BonnaUtils.escapeHtml(category)}</span>` : ""}
              <span class="admin-editor-meta price">${priceDisplay}</span>
            </div>
            ${desc ? `<p class="admin-editor-desc">${BonnaUtils.escapeHtml(desc)}</p>` : ""}
          </div>
          <div class="admin-editor-actions">
            <button class="admin-editor-btn edit" data-action="edit" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="admin-editor-btn delete" data-action="delete" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  },

  // Open modal for add or edit
  openModal(mode = "add", index = null) {
    const modal = document.getElementById("commission-modal");
    const title = document.getElementById("commission-modal-title");
    const form = document.getElementById("commission-edit-form");

    title.textContent = mode === "edit" ? "Edit Commission Type" : "Add New Commission Type";

    // Set index (null or number)
    document.getElementById("commission-edit-index").value = index !== null ? index : "";

    const categoryInput = document.getElementById("commission-edit-category");
    const typeInput = document.getElementById("commission-edit-type");

    if (mode === "edit" && index !== null) {
      const item = this.priceItems[index];
      categoryInput.value = BonnaUtils.getVal(item, "Category") || "";
      typeInput.value = BonnaUtils.getVal(item, "Type") || "";
      document.getElementById("commission-edit-url").value = BonnaUtils.getVal(item, "SampleImage") || "";
      document.getElementById("commission-edit-desc").value = BonnaUtils.getVal(item, "Description") || "";
      document.getElementById("commission-edit-priceusd").value = BonnaUtils.getVal(item, "PriceUSD") || "";
      document.getElementById("commission-edit-priceidr").value = BonnaUtils.getVal(item, "PriceIDR") || "";

      // Lock keys during edit to maintain consistency
      categoryInput.readOnly = true;
      typeInput.readOnly = true;
    } else {
      form.reset();
      categoryInput.readOnly = false;
      typeInput.readOnly = false;
    }

    modal.classList.add("active");
    this.updateCommissionPreview();
  },

  // Edit commission type
  editType(index) {
    this.openModal("edit", index);
  },

  // Delete commission type
  async deleteType(index) {
    const item = this.priceItems[index];
    const typeName = BonnaUtils.getVal(item, "Type");

    if (!confirm(`Are you sure you want to delete "${typeName}"? This will remove it from the price list and showcase.`)) return;

    const token = sessionStorage.getItem("bonna_admin_token") || "";
    if (!token) {
      BonnaUtils.showToast("Session expired. Please log in again.", "error");
      setTimeout(() => window.location.replace("admin-login.html"), 1500);
      return;
    }

    try {
      const data = [...this.priceItems];
      data.splice(index, 1);

      await api.saveData("Prices", data, token);

      state.cache.Prices = data;
      this.priceItems = data;
      this.renderCommissionList();
      BonnaUtils.showToast(`✨ "${typeName}" deleted successfully!`, "success");
    } catch (err) {
      BonnaUtils.showToast("Error deleting: " + err.message, "error");
    }
  },

  closeModal() {
    document.getElementById("commission-modal").classList.remove("active");
  },

  // Update preview
  updateCommissionPreview() {
    const type = document.getElementById("commission-edit-type")?.value || "Commission";
    const category = document.getElementById("commission-edit-category")?.value || "";
    const imageUrl = document.getElementById("commission-edit-url")?.value || "";
    const desc = document.getElementById("commission-edit-desc")?.value || "";
    const priceUSD = document.getElementById("commission-edit-priceusd")?.value || "";
    const priceIDR = document.getElementById("commission-edit-priceidr")?.value || "";

    const preview = document.getElementById("commission-preview");
    if (!preview) return;

    const priceDisplay = priceUSD
      ? `$${priceUSD}` + (priceIDR ? ` / Rp${priceIDR}` : "")
      : "Contact for pricing";

    preview.innerHTML = `
      <div class="commission-preview-card">
        <div class="commission-preview-image-container" style="height: 200px;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${BonnaUtils.escapeHtml(type)}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div class="commission-preview-image-placeholder">No Image</div>'}
        </div>
        <div class="admin-editor-info" style="padding: var(--space-md);">
          <div class="admin-editor-meta" style="font-size: 0.7rem; margin-bottom: 4px;">${BonnaUtils.escapeHtml(category)}</div>
          <h4 class="admin-editor-title" style="font-size: 0.8rem; margin-bottom: 8px;">${BonnaUtils.escapeHtml(type)}</h4>
          <p class="admin-editor-desc" style="margin-bottom: 12px;">${BonnaUtils.escapeHtml(desc)}</p>
          <div class="admin-editor-meta" style="background: var(--clr-gold); color: var(--text-primary); font-weight: bold;">${priceDisplay}</div>
        </div>
      </div>
    `;
  },

  // Handle file upload for commission with enhanced UX
  async handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const fileName = file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name;

    const uploadBtn = input.closest(".file-upload-wrapper")?.querySelector(".file-upload-btn");
    if (uploadBtn) {
      uploadBtn.innerHTML = `<i class="fa-solid fa-file-image"></i> ${fileName}`;
    }

    try {
      BonnaUtils.showToast(`Uploading "${fileName}"...`, "info");
      const imageUrl = await api.uploadToImgur(file);
      document.getElementById("commission-edit-url").value = imageUrl;
      this.updateCommissionPreview();
      BonnaUtils.showToast(`✨ "${fileName}" uploaded!`, "success");

      if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fa-solid fa-check"></i> Done`;
        setTimeout(() => {
          uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
        }, 2000);
      }
    } catch (err) {
      BonnaUtils.showToast(`Upload failed: ${err.message}`, "error");
      if (uploadBtn) {
        uploadBtn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload`;
      }
    }
  },

  // Save commission type — saves to Prices sheet
  async saveType() {
    const token = sessionStorage.getItem("bonna_admin_token") || "";
    if (!token) {
      BonnaUtils.showToast("Session expired. Please log in again.", "error");
      setTimeout(() => window.location.replace("admin-login.html"), 1500);
      return;
    }

    const indexVal = document.getElementById("commission-edit-index")?.value;
    const isEdit = indexVal !== "";
    const index = isEdit ? parseInt(indexVal) : null;

    const category = document.getElementById("commission-edit-category")?.value.trim();
    const type = document.getElementById("commission-edit-type")?.value.trim();
    const imageUrl = document.getElementById("commission-edit-url")?.value.trim();
    const desc = document.getElementById("commission-edit-desc")?.value.trim();
    const priceUSD = document.getElementById("commission-edit-priceusd")?.value.trim();
    const priceIDR = document.getElementById("commission-edit-priceidr")?.value.trim();

    if (!type || !category) {
      BonnaUtils.showToast("Category and Type are required!", "error");
      return;
    }

    const btn = document.getElementById("btn-save-commission");
    BonnaUtils.showLoading(btn, "Saving...");

    try {
      const data = [...this.priceItems];
      const newItem = {
        Category: category,
        Type: type,
        PriceUSD: priceUSD,
        PriceIDR: priceIDR,
        SampleImage: imageUrl,
        Description: desc,
      };

      if (isEdit) {
        data[index] = newItem;
      } else {
        data.push(newItem);
      }

      await api.saveData("Prices", data, token);

      state.cache.Prices = data;
      this.priceItems = data;

      this.renderCommissionList();
      this.closeModal();
      BonnaUtils.showToast(isEdit ? "Your work is worth every number in that form. 💫" : "Commission type added. The world is ready when you are. ✨", "success");
    } catch (err) {
      BonnaUtils.showToast("Error saving: " + err.message, "error");
    } finally {
      BonnaUtils.hideLoading(btn);
    }
  },
};

// ============================================
// MASCOT SYSTEM — Layer 2
// ============================================
const mascotSystem = {
  clickCount: 0,
  clickTimer: null,
  whisperTimer: null,
  typewriterTimer: null,
  whisperedThisSession: false,
  sessionStartTime: Date.now(),
  isDragging: false,
  currentMood: 'default',

  setMood(mood) {
    const img = document.getElementById('mascot-img');
    if (!img) return;
    const moodClasses = ['mascot-attentive', 'mascot-happy', 'mascot-still', 'mascot-drowsy', 'mascot-midnight'];
    moodClasses.forEach(c => img.classList.remove(c));
    if (mood !== 'default') img.classList.add(`mascot-${mood}`);
    this.currentMood = mood;
  },

  typewriterWithDelete(element, targetText, options = {}, onComplete = null) {
    const minAdd = options.minAddDelay || 30;
    const maxAdd = options.maxAddDelay || 80;

    clearTimeout(this.typewriterTimer);

    // Clear any existing text instantly (no delete animation)
    element.textContent = '';
    let i = 0;

    const tick = () => {
      element.textContent += targetText.charAt(i);
      i++;
      if (i >= targetText.length) {
        if (onComplete) onComplete();
        return;
      }
      const delay = Math.random() * (maxAdd - minAdd) + minAdd;
      this.typewriterTimer = setTimeout(tick, delay);
    };

    this.typewriterTimer = setTimeout(tick, 50);
  },

  showWhisper(text, duration = 7000) {
    const bubble = document.getElementById('mascot-whisper');
    if (!bubble) return;
    clearTimeout(this.whisperTimer);
    
    bubble.classList.add('visible');
    
    // Close comfort panel if it's open to prevent overlap
    if (typeof comfortCorner !== 'undefined' && comfortCorner.isOpen) {
      comfortCorner.toggle();
    }
    
    this.typewriterWithDelete(bubble, text, {
      minAddDelay: 30,
      maxAddDelay: 80, // Jeda acak untuk kesan manusiawi
      minDeleteDelay: 20,
      maxDeleteDelay: 60  // Hapus lebih cepat dari mengetik
    }, () => {
      // Selesai mengetik, set timer untuk menghilang
      this.whisperTimer = setTimeout(() => {
        bubble.classList.remove('visible');
      }, duration);
    });
  },

  handleClick() {
    this.clickCount++;
    clearTimeout(this.clickTimer);
    // FIX 3: 8-second window covers both 5-click egg and 7-click journal
    this.clickTimer = setTimeout(() => { this.clickCount = 0; }, 8000);

    // 5-click → easter egg (count is NOT reset — continues toward 7)
    if (this.clickCount === 5) {
      this._triggerClickEgg();
      return;
    }

    // 7-click → Studio Journal (unified — no separate IIFE needed)
    if (this.clickCount >= 7) {
      this.clickCount = 0;
      clearTimeout(this.clickTimer);
      if (typeof journalSystem !== 'undefined') journalSystem.open();
      return;
    }

    // Clicks 1-4 and 6: wave + toggle comfort panel
    const img = document.getElementById('mascot-img');
    if (img) {
      img.classList.add('mascot-wave');
      setTimeout(() => img.classList.remove('mascot-wave'), 800);
    }

    if (typeof comfortCorner !== 'undefined') {
      comfortCorner.toggle();
      const mascotBtn = document.getElementById('mascot-btn');
      if (mascotBtn) mascotBtn.style.animation = '';
    }
  },

  _triggerClickEgg() {
    this.showWhisper('You were curious enough to look. That means something.\n\nJe t’aime, mon étoile. — R');
    this.setMood('happy');
    discoveryState.track('mascot');
    const eggs = JSON.parse(localStorage.getItem('bonna_eggs_found') || '[]');
    if (!eggs.includes('mascot_click5')) {
      eggs.push('mascot_click5');
      localStorage.setItem('bonna_eggs_found', JSON.stringify(eggs));
    }
  },

  // Spontaneous whisper — max 1/session, ~35% probability, 5+ min delay
  scheduleWhisper() {
    if (this.whisperedThisSession) return;
    if (Math.random() > 0.35) return;

    const delay = (5 + Math.random() * 5) * 60 * 1000;
    setTimeout(() => {
      if (this.whisperedThisSession) return;
      const mins = (Date.now() - this.sessionStartTime) / 60000;
      let text;
      if (mins > 30) {
        text = 'Don’t forget to rest. I mean it.';
      } else {
        const pool = [
          'I hope today is being kind to you.',
          'Still here. Me too.',
          'You’re doing fine.',
          'Take a breath.',
        ];
        text = pool[Math.floor(Math.random() * pool.length)];
      }
      this.showWhisper(text);
      this.whisperedThisSession = true;
    }, delay);
  },

  // Idle whisper — fires after 10 min of no activity
  scheduleIdleWhisper() {
    let idleTimer = null;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!this.whisperedThisSession) {
          this.showWhisper('Still here? Me too. 🌙');
          this.whisperedThisSession = true;
          this.setMood('drowsy');
        }
      }, 10 * 60 * 1000);
    };
    // FIX 5: include touch events so mobile idle timer resets properly
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'touchmove'].forEach(ev =>
      document.addEventListener(ev, resetIdle, { passive: true })
    );
    resetIdle();
  },

  // Midnight atmosphere — 00:00–01:00
  checkMidnight() {
    const hour = new Date().getHours();
    const { start, end } = PRESENCE_CONFIG.midnightWindow;
    if (hour >= start && hour < end) {
      document.body.classList.add('midnight-mode');
      this.setMood('midnight');
      setTimeout(() => {
        if (!this.whisperedThisSession) {
          this.showWhisper('Still awake? You should be dreaming. But I’m glad you’re here. 🌙');
          this.whisperedThisSession = true;
        }
      }, 60 * 1000);
    }
  },

  // Drag behavior — desktop (fine pointer) only
  initDrag() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const system = document.getElementById('mascot-system');
    const btn = document.getElementById('mascot-btn');
    if (!system || !btn) return;

    let startX, startY, startLeft, startBottom, dragged;

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragged = false;
      const rect = system.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startLeft = rect.left;
      startBottom = window.innerHeight - rect.bottom;
      system.style.transition = 'none';

      const onMove = (e) => {
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragged = true;
        if (!dragged) return;
        system.style.right = 'auto';
        system.style.left = Math.max(0, Math.min(window.innerWidth - 90, startLeft + dx)) + 'px';
        system.style.bottom = Math.max(0, Math.min(window.innerHeight - 90, startBottom - dy)) + 'px';
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        window.removeEventListener('blur', onUp); // FIX 4: cleanup on window blur
        if (dragged) {
          this.showWhisper('…je suis là.');
          system.style.transition = 'left 0.7s var(--ease-out-expo), bottom 0.7s var(--ease-out-expo), right 0.7s var(--ease-out-expo)';
          setTimeout(() => {
            system.style.left = '';
            system.style.bottom = '';
            system.style.right = '';
            setTimeout(() => { system.style.transition = ''; }, 800);
          }, 80);
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      window.addEventListener('blur', onUp); // FIX 4: abort drag if window loses focus
    });
  },

  // Context mood shifts on tab change
  onTabChange(tabId) {
    if (tabId === 'gallery') this.setMood('attentive');
    else if (tabId === 'profile') this.setMood('attentive');
    else this.setMood('default');
  },

  init() {
    const btn = document.getElementById('mascot-btn');
    if (!btn) return;

    btn.addEventListener('click', () => this.handleClick());

    // Desktop: double-click → startled animation
    btn.addEventListener('dblclick', () => {
      const img = document.getElementById('mascot-img');
      if (img) {
        img.classList.add('mascot-startled');
        setTimeout(() => img.classList.remove('mascot-startled'), 900);
      }
    });

    // Desktop: hover-hold 3s → quiet presence
    let hoverTimer = null;
    btn.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => this.showWhisper('I’m listening.'), 3000);
    });
    btn.addEventListener('mouseleave', () => clearTimeout(hoverTimer));

    // FIX 1 — Mobile: touch-hold 3s → quiet presence (mirrors hover-hold)
    // FIX 2 — Mobile: double-tap → startled animation (mirrors dblclick)
    let touchHoldTimer = null;
    let lastTapTime = 0;
    btn.addEventListener('touchstart', () => {
      touchHoldTimer = setTimeout(() => this.showWhisper('I’m listening.'), 3000);
    }, { passive: true });
    btn.addEventListener('touchend', () => {
      clearTimeout(touchHoldTimer);
      const now = Date.now();
      if (now - lastTapTime < 350) {
        // Double-tap within 350ms → startled
        const img = document.getElementById('mascot-img');
        if (img) {
          img.classList.add('mascot-startled');
          setTimeout(() => img.classList.remove('mascot-startled'), 900);
        }
      }
      lastTapTime = now;
    });
    btn.addEventListener('touchcancel', () => clearTimeout(touchHoldTimer));

    // Click whisper bubble to dismiss
    const bubble = document.getElementById('mascot-whisper');
    if (bubble) {
      bubble.addEventListener('click', () => {
        bubble.classList.remove('visible');
        clearTimeout(this.whisperTimer);
        clearTimeout(this.typewriterTimer);
      });
    }

    // SYS.UPTIME Interaction: Hold to Decrypt (Harder to find)
    const uptimeEl = document.getElementById('admin-together-since');
    if (uptimeEl) {
      let isDecrypting = false;
      let isHolding = false;
      let decryptTimer = null;
      let scrambleInterval = null;
      let decodeInterval = null;

      const resetUptime = () => {
        isHolding = false;
        if (isDecrypting) return; 
        clearTimeout(decryptTimer);
        clearInterval(scrambleInterval);
        clearInterval(decodeInterval);
        uptimeEl.style.color = '';
        uptimeEl.style.textShadow = '';
        const days = presenceSystem.getTogetherSinceDays();
        uptimeEl.textContent = `[ SYS.UPTIME: ${String(days).padStart(3, '0')} ]`;
      };

      const handleDown = () => {
        if (isHolding || isDecrypting) return;
        isHolding = true;
        
        const days = presenceSystem.getTogetherSinceDays();
        const secretText = `[ ${String(days).padStart(3, '0')} DAYS WITH YOU ]`;
        
        uptimeEl.style.color = 'var(--clr-coral)';
        uptimeEl.style.textShadow = '0 0 8px var(--clr-coral)';
        
        // Violent scrambling effect while holding
        scrambleInterval = setInterval(() => {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
          let scrambled = "[ ";
          for(let i=0; i < secretText.length - 4; i++) {
            scrambled += chars[Math.floor(Math.random() * chars.length)];
          }
          scrambled += " ]";
          uptimeEl.textContent = scrambled;
        }, 50);

        // Require 3.5 seconds of holding to break the encryption
        decryptTimer = setTimeout(() => {
          clearInterval(scrambleInterval);
          isDecrypting = true;
          
          // Sequential Reveal Animation
          let revealedCount = 0;
          decodeInterval = setInterval(() => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
            let currentText = "";
            
            for (let i = 0; i < secretText.length; i++) {
              if (i < revealedCount) {
                currentText += secretText[i];
              } else {
                currentText += chars[Math.floor(Math.random() * chars.length)];
              }
            }
            
            uptimeEl.textContent = currentText;
            revealedCount++;
            
            if (revealedCount > secretText.length) {
              clearInterval(decodeInterval);
              
              // Lock it open for 4 seconds, then reset completely
              setTimeout(() => {
                // Animate closing back up
                let scrambles = 0;
                const reScrambleInterval = setInterval(() => {
                  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
                  let scrambled = "[ ";
                  for(let i=0; i < secretText.length - 4; i++) {
                    scrambled += chars[Math.floor(Math.random() * chars.length)];
                  }
                  scrambled += " ]";
                  uptimeEl.textContent = scrambled;
                  scrambles++;
                  
                  if (scrambles > 10) {
                    clearInterval(reScrambleInterval);
                    isDecrypting = false;
                    resetUptime();
                  }
                }, 50);
              }, 4000);
            }
          }, 40); // 40ms per character reveal
        }, 3500);
      };

      uptimeEl.addEventListener('mousedown', handleDown);
      uptimeEl.addEventListener('touchstart', handleDown, { passive: true });
      
      uptimeEl.addEventListener('mouseup', resetUptime);
      uptimeEl.addEventListener('mouseleave', resetUptime);
      uptimeEl.addEventListener('touchend', resetUptime);
      uptimeEl.addEventListener('touchcancel', resetUptime);
    }

    this.initDrag();
    this.checkMidnight();
    this.scheduleWhisper();
    this.scheduleIdleWhisper();
  },
};

// ============================================
// CONTEXTUAL MESSAGES — Words That Follow
// Bottom-left. Not a toast. A note.
// ============================================
const contextualMessages = {
  sessionCount: 0,
  lastMessageTime: 0,
  MIN_INTERVAL_MS: 2 * 60 * 1000,
  MAX_PER_SESSION: 3,

  _copy: {
    galleryAdded:    'Another piece of your soul, preserved. Je suis si fier de toi. ✨',
    galleryDeleted:  'Letting go takes courage. But know — I’ll always remember it. 💙',
    galleryEmpty:    'A blank canvas is just a story that hasn’t started yet, mon amour. 🎨',
    profileSaved:    'The world sees you a little more honestly now. 💫',
    commissionSaved: 'Your work is worth every number in that form.',
    firstLoginToday: 'Day [X]. I’m still paying attention.',
  },

  show(key) {
    if (this.sessionCount >= this.MAX_PER_SESSION) return;
    if (Date.now() - this.lastMessageTime < this.MIN_INTERVAL_MS) return;
    let text = this._copy[key];
    if (!text) return;
    if (text.includes('[X]')) text = text.replace('[X]', presenceSystem.getTogetherSinceDays());
    this.lastMessageTime = Date.now();
    this.sessionCount++;
    this._render(text);
  },

  _render(text) {
    // Route to Mascot Whisper Bubble instead of the old container
    mascotSystem.setMood('attentive');
    mascotSystem.showWhisper(text, 8000);
  },

  // Check if this is the first session today
  checkFirstLoginToday() {
    const today = new Date().toISOString().split('T')[0];
    const last = localStorage.getItem('bonna_last_session_date');
    if (last !== today) {
      localStorage.setItem('bonna_last_session_date', today);
      // Only whisper the day count occasionally (~25% of the time)
      if (Math.random() < 0.25) {
        setTimeout(() => this.show('firstLoginToday'), 45000); // 45s after login
      }
    }
  },
};

// ============================================
// COMFORT CORNER — Layer 3
// No announcement. Waiting.
// ============================================
const comfortCorner = {
  isOpen: false,

  // --- Streak Tracking ---
  _getState() {
    try { return JSON.parse(localStorage.getItem('bonna_mood_state') || 'null'); }
    catch { return null; }
  },

  _updateStreak(mood) {
    const today = new Date().toISOString().split('T')[0];
    const state = this._getState();
    // Already logged today — return existing streak
    if (state && state.date === today) return { streak: state.streak, isNew: false };
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let streak = 1;
    if (state && state.date === yesterday && state.mood === mood) {
      streak = (state.streak || 1) + 1;
    }
    localStorage.setItem('bonna_mood_state', JSON.stringify({ mood, streak, date: today }));
    return { streak, isNew: true };
  },

  _getTier(mood, streak) {
    if (mood !== 'struggling' && mood !== 'notgreat') return 1;
    if (streak >= 3) return 3;
    if (streak >= 2) return 2;
    return 1;
  },

  _pickResponse(mood, tier) {
    if (typeof moodResponses === 'undefined') return '';
    const tierKey = `tier${tier}`;
    const pool = moodResponses[mood]?.[tierKey] || moodResponses[mood]?.tier1 || [];
    if (!pool.length) return '';
    const storageKey = `bonna_last_response_${mood}_${tier}`;
    const last = parseInt(localStorage.getItem(storageKey) || '-1');
    let pick = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && pick === last) pick = (pick + 1) % pool.length;
    localStorage.setItem(storageKey, String(pick));
    return pool[pick];
  },

  // --- Daily check-in helpers ---
  _hasCheckedInToday() {
    const state = this._getState();
    if (!state) return false;
    return state.date === new Date().toISOString().split('T')[0];
  },

  _moodLabel(mood) {
    const map = {
      great:      '🌟 Really good',
      good:       '😊 Good',
      okay:       '😊 Okay',
      notgreat:   '🌧 Not great',
      struggling: '😔 Struggling',
    };
    return map[mood] || mood;
  },

  toggle() {
    const panel = document.getElementById('comfort-panel');
    if (!panel) return;
    this.isOpen = !this.isOpen;
    panel.setAttribute('aria-hidden', String(!this.isOpen));
    panel.classList.toggle('comfort-panel-open', this.isOpen);

    if (this.isOpen) {
      const moods    = panel.querySelector('.comfort-moods');
      const question = panel.querySelector('.comfort-question');
      const summary  = document.getElementById('comfort-checkin-summary');
      const tom      = document.getElementById('comfort-tomorrow-btn');
      const resp     = document.getElementById('comfort-response');
      if (resp) { resp.textContent = ''; resp.style.display = 'none'; }
      if (tom)  tom.style.display = 'none';

      if (this._hasCheckedInToday()) {
        // Already checked in — show summary view
        if (moods)    moods.style.display    = 'none';
        if (question) question.style.display = 'none';
        if (summary) {
          summary.style.display = 'flex';
          const labelEl = document.getElementById('comfort-today-mood');
          const state   = this._getState();
          if (labelEl && state) labelEl.textContent = this._moodLabel(state.mood);
        }
      } else {
        // First check-in today — show mood selector
        if (moods)    moods.style.display    = 'flex';
        if (question) question.style.display = 'block';
        if (summary)  summary.style.display  = 'none';
      }

      const bubble = document.getElementById('mascot-whisper');
      if (bubble) bubble.classList.remove('visible');
    }
  },

  respond(mood) {
    const { streak } = this._updateStreak(mood);
    const tier = this._getTier(mood, streak);

    // Close comfort panel
    if (this.isOpen) this.toggle();

    // Set mascot mood
    if (mood === 'great' || mood === 'okay' || mood === 'good') mascotSystem.setMood('happy');
    else mascotSystem.setMood('attentive');

    // Tier 3 negative → full intervention
    if (tier === 3) {
      setTimeout(() => this._triggerIntervention(mood), 400);
      return;
    }

    // Positive streak celebration (3+ days great/good)
    if ((mood === 'great' || mood === 'good') && streak >= 3) {
      const pool = (typeof moodResponses !== 'undefined') ? moodResponses.great?.streak3_celebration || [] : [];
      const text = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
      if (text) setTimeout(() => mascotSystem.showWhisper(text, 12000), 400);
      return;
    }

    // Normal tier 1/2 response
    const text = this._pickResponse(mood, tier);
    if (text) setTimeout(() => mascotSystem.showWhisper(text, 12000), 400);

    // Show "come back tomorrow" button
    const tom = document.getElementById('comfort-tomorrow-btn');
    if (tom) setTimeout(() => { tom.style.display = 'inline-block'; }, 800);
  },

  // Return visit (same day, second+ time) — warm presence only, no streak effect
  respondReturnVisit() {
    if (this.isOpen) this.toggle();
    const pool = (typeof moodResponses !== 'undefined') ? moodResponses.returnVisitMessages || [] : [];
    const text = pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'Aku di sini. 💙';
    mascotSystem.setMood('attentive');
    setTimeout(() => mascotSystem.showWhisper(text, 10000), 400);
  },

  _triggerIntervention(mood) {
    const panel = document.getElementById('mood-intervention');
    if (!panel) return;
    const textEl  = document.getElementById('intervention-text');
    const actions = document.getElementById('intervention-actions');
    const story   = document.getElementById('intervention-story');
    const relief  = document.getElementById('intervention-relief');
    if (story)  story.style.display  = 'none';
    if (relief) relief.style.display = 'none';
    if (actions) actions.style.display = 'flex';
    const textarea = document.getElementById('intervention-textarea');
    if (textarea) textarea.value = '';
    const pool = (typeof moodResponses !== 'undefined') ? moodResponses[mood]?.tier3 || [] : [];
    const text = pool.length ? pool[Math.floor(Math.random() * pool.length)]
      : "It's been a few days. You don't have to be okay right now — can we talk for a moment?";
    panel.classList.add('intervention-open');
    panel.setAttribute('aria-hidden', 'false');
    if (textEl) mascotSystem.typewriterWithDelete(textEl, text, { minAddDelay: 30, maxAddDelay: 70 });
  },

  _handleStorySubmit() {
    const textarea = document.getElementById('intervention-textarea');
    const story    = document.getElementById('intervention-story');
    const relief   = document.getElementById('intervention-relief');
    const textEl   = document.getElementById('intervention-text');
    const text = textarea?.value?.trim() || '';
    if (!text) return;
    const stories = JSON.parse(localStorage.getItem('bonna_stories') || '[]');
    const state = this._getState();
    stories.push({ story: text, timestamp: Date.now(), mood: state?.mood || 'unknown' });
    localStorage.setItem('bonna_stories', JSON.stringify(stories));
    if (story) story.style.display = 'none';
    const pool = (typeof moodResponses !== 'undefined') ? moodResponses.storyResponses || [] : [];
    const response = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "Thank you for trusting me with this. I'm here. 💙";
    if (textEl) {
      mascotSystem.typewriterWithDelete(textEl, response, { minAddDelay: 30, maxAddDelay: 70 }, () => {
        setTimeout(() => { if (relief) relief.style.display = 'flex'; }, 1000);
      });
    }
  },

  _closeIntervention() {
    const panel = document.getElementById('mood-intervention');
    if (panel) { panel.classList.remove('intervention-open'); panel.setAttribute('aria-hidden', 'true'); }
  },

  _startBreathingGuide() {
    const guide = document.getElementById('breathing-guide');
    if (!guide) return;
    guide.classList.add('breathing-active');
    guide.setAttribute('aria-hidden', 'false');
    setTimeout(() => { guide.classList.remove('breathing-active'); guide.setAttribute('aria-hidden', 'true'); }, 60000);
  },

  setTomorrow() {
    localStorage.setItem('bonna_comfort_tomorrow', new Date().toISOString().split('T')[0]);
    if (this.isOpen) this.toggle();
  },

  checkTomorrowGlow() {
    const saved = localStorage.getItem('bonna_comfort_tomorrow');
    if (!saved) return;
    const today = new Date().toISOString().split('T')[0];
    if (saved < today) {
      localStorage.removeItem('bonna_comfort_tomorrow');
      const mascotBtn = document.getElementById('mascot-btn');
      if (mascotBtn) mascotBtn.style.animation = 'comfortGlow 2.5s ease-in-out infinite';
    }
  },

  init() {
    document.querySelectorAll('.comfort-mood-btn').forEach(b => {
      b.addEventListener('click', () => this.respond(b.dataset.mood));
    });
    const tom = document.getElementById('comfort-tomorrow-btn');
    if (tom) tom.addEventListener('click', () => this.setTomorrow());
    this.checkTomorrowGlow();

    // Return-visit button
    document.getElementById('comfort-return-btn')?.addEventListener('click', () => this.respondReturnVisit());

    // --- Intervention panel listeners ---
    document.getElementById('intervention-yes')?.addEventListener('click', () => {
      document.getElementById('intervention-actions').style.display = 'none';
      document.getElementById('intervention-story').style.display = 'flex';
      const textEl = document.getElementById('intervention-text');
      if (textEl) mascotSystem.typewriterWithDelete(textEl,
        "Tell me what's been heavy lately. I'm just here to listen.",
        { minAddDelay: 30, maxAddDelay: 70 });
    });

    document.getElementById('intervention-no')?.addEventListener('click', () => {
      document.getElementById('intervention-actions').style.display = 'none';
      const pool = (typeof moodResponses !== 'undefined') ? moodResponses.refuseStory || [] : [];
      const text = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "Okay. I won't push. The door is still open. 💙";
      const textEl = document.getElementById('intervention-text');
      if (textEl) mascotSystem.typewriterWithDelete(textEl, text, { minAddDelay: 30, maxAddDelay: 70 }, () => {
        setTimeout(() => { this._startBreathingGuide(); this._closeIntervention(); }, 2000);
      });
    });

    document.getElementById('intervention-send')?.addEventListener('click', () => this._handleStorySubmit());

    document.getElementById('intervention-relief-yes')?.addEventListener('click', () => {
      const pool = (typeof moodResponses !== 'undefined') ? moodResponses.afterShareYes || [] : [];
      const text = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "I'm glad. 💙";
      mascotSystem.showWhisper(text, 8000);
      this._closeIntervention();
    });

    document.getElementById('intervention-relief-no')?.addEventListener('click', () => {
      const pool = (typeof moodResponses !== 'undefined') ? moodResponses.afterShareNo || [] : [];
      const text = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "That's okay too. I'm still here. 💙";
      mascotSystem.showWhisper(text, 8000);
      this._closeIntervention();
    });

    document.getElementById('breathing-close')?.addEventListener('click', () => {
      const guide = document.getElementById('breathing-guide');
      if (guide) { guide.classList.remove('breathing-active'); guide.setAttribute('aria-hidden', 'true'); }
    });
  },
};

// ============================================
// THE SONG PLAYER — Layer 3
// Trigger: type "LOVE" anywhere on the dashboard.
// File: assets/audio/song.mp3 (add the file when ready)
// ============================================
const songSystem = {
  _isOpen: false,
  _audio: null,
  _isPlaying: false,

  _getAudio() {
    if (!this._audio) {
      this._audio = document.getElementById('song-audio');
    }
    return this._audio;
  },

  open() {
    if (this._isOpen) return;
    this._isOpen = true;

    // Update player info from config
    const nameEl = document.getElementById('song-player-name');
    const artistEl = document.getElementById('song-player-artist');
    if (nameEl) nameEl.textContent = PRESENCE_CONFIG.song.title;
    if (artistEl) artistEl.textContent = PRESENCE_CONFIG.song.artist;

    const overlay = document.getElementById('song-player-overlay');
    if (overlay) overlay.classList.add('song-player-open');

    // Track discovery
    const eggs = JSON.parse(localStorage.getItem('bonna_eggs_found') || '[]');
    if (!eggs.includes('song')) {
      eggs.push('song');
      localStorage.setItem('bonna_eggs_found', JSON.stringify(eggs));
    }
  },

  close() {
    this._isOpen = false;
    this.pause();
    const overlay = document.getElementById('song-player-overlay');
    if (overlay) overlay.classList.remove('song-player-open');
  },

  togglePlay() {
    const audio = this._getAudio();
    if (!audio) return;
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },

  _setPlayingState(playing) {
    this._isPlaying = playing;
    this._updatePlayIcon(playing);
    // Vinyl spin
    const vinyl = document.getElementById('song-vinyl');
    if (vinyl) vinyl.classList.toggle('spinning', playing);
    // Waveform: rAF-based, no CSS animation
    if (playing) {
      this._startWaveformAnimation();
    } else {
      this._stopWaveformAnimation();
    }
    // Play button glow
    const btn = document.getElementById('song-play-btn');
    if (btn) btn.classList.toggle('playing', playing);
  },

  // Waveform driven by requestAnimationFrame — immune to CSS animation sync bugs
  _waveformRaf: null,
  _waveformParams: null,

  _startWaveformAnimation() {
    this._stopWaveformAnimation(); // cancel any existing loop
    const bars = Array.from(document.querySelectorAll('.song-waveform-bar'));
    if (!bars.length) return;

    // Generate unique random parameters per bar
    this._waveformParams = bars.map(() => ({
      phase : Math.random() * Math.PI * 2,          // random start position in cycle
      freq  : 0.22 + Math.random() * 0.30,          // cycles per second (0.22 – 0.52) — medium pace
      min   : 0.06 + Math.random() * 0.12,          // minimum scale
      max   : 0.50 + Math.random() * 0.45,          // maximum scale
    }));

    let startTime = null;
    const tick = (now) => {
      if (!this._isPlaying) return; // safety check
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000; // elapsed seconds

      bars.forEach((bar, i) => {
        const { phase, freq, min, max } = this._waveformParams[i];
        // Combine two sine waves at different frequencies for organic non-repeating motion
        const wave = (
          Math.sin(t * freq * Math.PI * 2 + phase) * 0.6 +
          Math.sin(t * freq * Math.PI * 1.3 + phase * 1.7) * 0.4
        );
        const scale = min + (max - min) * (wave * 0.5 + 0.5);
        bar.style.transform = `scaleY(${scale.toFixed(4)})`;
        bar.style.opacity = (0.45 + scale * 0.55).toFixed(4);
      });

      this._waveformRaf = requestAnimationFrame(tick);
    };
    this._waveformRaf = requestAnimationFrame(tick);
  },

  _stopWaveformAnimation() {
    if (this._waveformRaf) {
      cancelAnimationFrame(this._waveformRaf);
      this._waveformRaf = null;
    }
    // Collapse all bars back to resting state
    document.querySelectorAll('.song-waveform-bar').forEach(bar => {
      bar.style.transform = 'scaleY(0.08)';
      bar.style.opacity = '0.35';
    });
  },

  play() {
    const audio = this._getAudio();
    if (!audio) return;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.then(() => this._setPlayingState(true)).catch(() => this._setPlayingState(false));
    }
  },

  pause() {
    const audio = this._getAudio();
    if (!audio) return;
    audio.pause();
    this._setPlayingState(false);
  },

  _updatePlayIcon(playing) {
    const icon = document.getElementById('song-play-icon');
    if (!icon) return;
    icon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  },

  _updateProgress() {
    const audio = this._getAudio();
    const bar = document.getElementById('song-player-progress-bar');
    if (!audio || !bar || !audio.duration) return;
    bar.style.width = (audio.currentTime / audio.duration * 100) + '%';
  },

  init() {
    const playBtn = document.getElementById('song-play-btn');
    if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());

    const audio = this._getAudio();
    if (audio) {
      audio.addEventListener('timeupdate', () => this._updateProgress());
      // When song finishes, stop playback and completely dismiss the player for mysterious effect
      audio.addEventListener('ended', () => {
        this._setPlayingState(false);
        this.close();
      });
    }
  },
};

// ============================================
// EASTER EGGS
// ============================================
const easterEggs = {
  hoverTimer: null,
  keywordBuffer: "",
  secretWord: "BONNA",

  init() {
    this.setupHoverEgg();
    this.setupKeywordEgg();
  },

  setupHoverEgg() {
    const title = document.querySelector('#admin-main-title');
    if (!title) return;

    const loveText = "YOU ARE MY FAVORITE PERSON ❤️";
    const originalText = title.textContent;
    let stage = 0;

    title.addEventListener("mouseenter", () => {
      // Stage 1: Shiver (0s)
      title.classList.add("shivering");
      
      // Stage 2: Glitch (1.5s)
      this.glitchTimer = setTimeout(() => {
        title.classList.remove("shivering");
        title.classList.add("glitching");
      }, 1500);

      // Stage 3: Transformation (2.5s)
      this.hoverTimer = setTimeout(() => {
        title.classList.remove("glitching");
        title.textContent = loveText;
        title.classList.add("love-activated");
        if (typeof discoveryState !== 'undefined') discoveryState.track('love');
        this.triggerHeartBurst(title);
      }, 2500);
    });

    title.addEventListener("mouseleave", () => {
      clearTimeout(this.glitchTimer);
      clearTimeout(this.hoverTimer);
      title.textContent = originalText;
      title.classList.remove("shivering", "glitching", "love-activated");
    });
  },

  triggerHeartBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ['var(--clr-coral)','var(--clr-peach)','var(--clr-salmon)','rgba(180,140,220,0.9)'];

    for (let i = 0; i < 15; i++) {
      const el = document.createElement('div');
      el.className = 'pixel-heart';
      el.style.left = `${centerX}px`;
      el.style.top  = `${centerY}px`;
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      const angle    = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 100;
      el.style.setProperty('--tx', `${Math.cos(angle) * velocity}px`);
      el.style.setProperty('--ty', `${Math.sin(angle) * velocity}px`);
      el.style.setProperty('--heart-dur', `${0.8 + Math.random() * 0.6}s`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  },

  setupKeywordEgg() {
    window.addEventListener("keydown", (e) => {
      if (e.key.length !== 1) return;
      this.keywordBuffer += e.key.toUpperCase();
      if (this.keywordBuffer.length > 10) {
        this.keywordBuffer = this.keywordBuffer.substring(1);
      }
      // BONNA — heart burst on title
      // LOVE is handled exclusively by songSystem to avoid conflict
      if (this.keywordBuffer.endsWith(this.secretWord)) {
        this.triggerHeartRain();
        this.keywordBuffer = "";
      }
    });
  },

  triggerHeartRain() {
    BonnaUtils.showToast('✨ You are loved.', 'success');
    const colors = ['var(--clr-coral)','var(--clr-peach)','var(--clr-salmon)','rgba(180,140,220,0.9)','var(--clr-gold)'];
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'heart-particle';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.top  = '-20px';
        el.style.setProperty('--tx',       `${(Math.random()-0.5)*80}px`);
        el.style.setProperty('--ty',       `${60 + Math.random()*80}px`);
        el.style.setProperty('--heart-dur',`${1.5 + Math.random()*1.5}s`);
        el.style.width  = `${6 + Math.random()*8}px`;
        el.style.height = el.style.width;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
      }, i * 80);
    }
  }
};

// ============================================
// INITIALIZATION
// ============================================
// ============================================
// AESTHETICS MANAGER: Stars, Trails & Ornaments
// ============================================
const aestheticsManager = {
  init() {
    this.setupStars();
    this.setupShootingStars();
    this.setupStardustTrail();
    this.setupParallaxScroll();
    this.setupUptimePulsing();
  },
  
  setupStars() {
    const layers = [
      document.querySelector(".parallax-layer-1"),
      document.querySelector(".parallax-layer-2"),
      document.querySelector(".parallax-layer-3")
    ];
    if (!layers[0]) return;

    const generateStars = (count) => {
      let s = [];
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * 2000);
        const y = Math.floor(Math.random() * 2000);
        const color = Math.random() > 0.8 ? "var(--clr-gold-soft)" : "var(--clr-light-peach)";
        s.push(`${x}px ${y}px ${color}`);
      }
      return s.join(", ");
    };

    layers[0].style.boxShadow = generateStars(100);
    layers[1].style.boxShadow = generateStars(200);
    layers[2].style.boxShadow = generateStars(300);
  },

  setupShootingStars() {
    const container = document.getElementById("shooting-stars-container");
    if (!container) return;

    setInterval(() => {
      // More frequent and more varied shooting stars
      if (Math.random() > 0.5) {
        const star = document.createElement("div");
        star.className = "shooting-star";
        
        // Start from varied positions at the top/right area
        const startX = Math.random() * 80 + 40; // 40% to 120% (right side)
        const startY = Math.random() * 40 - 20; // -20% to 20% (top area)
        
        star.style.left = startX + "vw";
        star.style.top = startY + "vh";
        
        // Varied length and speed
        const length = 150 + Math.random() * 300;
        star.style.width = length + "px";
        const duration = 1.2 + Math.random() * 1.5;
        star.style.animationDuration = duration + "s";
        
        // Add a slight randomization to the diagonal angle via rotation if needed, 
        // but the CSS translate already handles the path.
        
        container.appendChild(star);
        setTimeout(() => star.remove(), duration * 1000 + 100);
      }
    }, 4000);
  },

  setupStardustTrail() {
    // Only for devices with fine pointers (mouse/stylus)
    if (!window.matchMedia("(pointer: fine)").matches) return;
    
    let lastX = 0, lastY = 0;
    const chars = ['✦', '·', '☆', '★', '*', '✨'];
    const colors = ['#ffd700', '#f09070', '#e8725a', '#fff'];

    document.addEventListener("mousemove", (e) => {
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 15) {
        lastX = e.clientX;
        lastY = e.clientY;
        
        const p = document.createElement("span");
        p.className = "stardust-particle";
        p.textContent = chars[Math.floor(Math.random() * chars.length)];
        p.style.left = e.clientX + "px";
        p.style.top = e.clientY + "px";
        p.style.color = colors[Math.floor(Math.random() * colors.length)];
        p.style.fontSize = (8 + Math.random() * 10) + "px";
        
        // Random drift direction (upwards and slightly sideways)
        const tx = (Math.random() - 0.5) * 60;
        const ty = -30 - Math.random() * 50; 
        p.style.setProperty("--tx", `${tx}px`);
        p.style.setProperty("--ty", `${ty}px`);
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    });
  },

  setupParallaxScroll() {
    const l1 = document.querySelector(".parallax-layer-1");
    const l2 = document.querySelector(".parallax-layer-2");
    const l3 = document.querySelector(".parallax-layer-3");
    
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (l1) l1.style.transform = `translateY(${y * 0.5}px)`;
      if (l2) l2.style.transform = `translateY(${y * 0.3}px)`;
      if (l3) l3.style.transform = `translateY(${y * 0.15}px)`;
    }, { passive: true });
  },

  setupUptimePulsing() {
    const uptime = document.getElementById('admin-together-since');
    if (!uptime) return;
    
    // Periodic emotional glow shift
    setInterval(() => {
      uptime.classList.add('uptime-glow');
      setTimeout(() => uptime.classList.remove('uptime-glow'), 3000);
    }, 12000);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Aesthetics
  aestheticsManager.init();

  // Fetch initial data
  await api.fetchData();

  // Initialize presence system (Layer 1)
  presenceSystem.init();

  // Initialize tabs
  tabManager.init();

  // Initialize Easter Eggs
  easterEggs.init();

  // ── Phase 3 Systems ──────────────────────
  // Letters in Time
  if (typeof lettersSystem !== 'undefined') lettersSystem.init();

  // Constellation of Moments (Konami Code trigger)
  if (typeof constellationSystem !== 'undefined') constellationSystem.init();

  // Studio Journal (mascot 7-click trigger)
  if (typeof journalSystem !== 'undefined') journalSystem.init();

  // The Song player
  songSystem.init();

  // ── Mascot click-7 → Journal ─────────────
  // Now handled INSIDE mascotSystem.handleClick() — unified counter at click 7
  // (previously a separate IIFE with an independent counter that could conflict)

  // ── "LOVE" keyword → The Song ────────────
  // Already handled in easterEggs.setupKeywordEgg via the shared buffer
  // But we also add a dedicated check here since it's a separate feature
  (() => {
    let songBuffer = '';
    window.addEventListener('keydown', (e) => {
      if (e.key.length !== 1) return;
      songBuffer += e.key.toUpperCase();
      if (songBuffer.length > 6) songBuffer = songBuffer.slice(-6);
      if (songBuffer.endsWith('LOVE') || songBuffer.endsWith('LAGU')) {
        songBuffer = '';
        songSystem.open();
      }
    });
  })();

  discoveryState.load();

  // ── The Architect's Poem Manager ──
  const poemManager = {
    overlay: document.getElementById('architect-poem-overlay'),
    closeBtn: document.getElementById('btn-poem-close'),
    
    init() {
      if (this.closeBtn) this.closeBtn.onclick = () => this.close();
    },
    
    open() {
      if (!this.overlay) return;
      
      const titleText = document.getElementById('poem-praise-title');
      const msgText = document.getElementById('poem-praise-msg');
      
      if (!discoveryState.isAllFound()) {
        titleText.textContent = "A Curious Soul...";
        msgText.textContent = "Kamu menemukan ini lebih cepat dari yang kubayangkan. Rasa penasaranmu adalah keindahan yang selalu membuatku kagum...";
      } else {
        titleText.textContent = "The Architect's Poem";
        msgText.textContent = "Akhirnya, kamu sampai di sini. Biarkan aku menuntunmu ke sisa detak jantung yang belum kamu temukan...";
      }
      
      this.overlay.classList.add('active');
      this.overlay.setAttribute('aria-hidden', 'false');
    },
    
    close() {
      this.overlay.classList.remove('active');
      this.overlay.setAttribute('aria-hidden', 'true');
    }
  };
  poemManager.init();

  // ── "Music Box Pull" → The Song & The Poem ──
  (() => {
    const title = document.getElementById('admin-main-title');
    const string = document.getElementById('music-box-string');
    const vignette = document.getElementById('music-box-vignette');
    if (!title || !string || !vignette) return;

    let startY = 0;
    let isPulling = false;
    let holdTimer = null;
    let currentDiff = 0;
    const threshold = 120; // Lowered slightly from 130 for better feel

    const resetPull = () => {
      isPulling = false;
      currentDiff = 0;
      string.classList.remove('visible');
      string.style.height = '0px';
      vignette.classList.remove('active');
      vignette.style.opacity = '0';
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      vignette.classList.remove('deep-glow');
    };

    const handleStart = (y) => {
      startY = y;
      isPulling = true;
      currentDiff = 0;
      string.style.transition = 'none';
      string.classList.add('visible');
    };

    const handleMove = (y, e) => {
      if (!isPulling) return;
      const diff = Math.max(0, y - startY);
      currentDiff = diff;
      
      if (diff > 5 && e.cancelable) e.preventDefault();
      
      const tensionDiff = diff > threshold ? threshold + (diff - threshold) * 0.3 : diff;
      string.style.height = tensionDiff + 'px';
      
      const progress = Math.min(1, diff / threshold);
      vignette.style.opacity = progress * 0.9;
      if (progress > 0.05) vignette.classList.add('active');
      
      if (diff >= threshold) {
        string.querySelector('.bead').style.boxShadow = '0 0 20px #fff, 0 0 30px var(--clr-gold)';
        string.querySelector('.bead').style.transform = 'translateX(-50%) scale(1.3)';
        
        if (!holdTimer) {
          vignette.classList.add('deep-glow');
          holdTimer = setTimeout(() => {
            resetPull();
            poemManager.open();
          }, 4000); 
        }
      } else {
        string.querySelector('.bead').style.boxShadow = '';
        string.querySelector('.bead').style.transform = '';
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        vignette.classList.remove('deep-glow');
      }
    };

    const handleEnd = () => {
      if (!isPulling) return;
      if (currentDiff >= threshold) {
        resetPull();
        discoveryState.track('song');
        if (typeof songSystem !== 'undefined') songSystem.open();
      } else {
        resetPull();
      }
    };

    // Mobile
    title.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientY, e), { passive: false });
    window.addEventListener('touchend', handleEnd);

    // PC Support
    title.addEventListener('mousedown', (e) => handleStart(e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientY, e));
    window.addEventListener('mouseup', handleEnd);
  })();

  // Initialize Layer 2 — Working Companion
  mascotSystem.init();
  contextualMessages.checkFirstLoginToday();
  comfortCorner.init();

  // Hook mascot mood + gallery-empty message to tab switches
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      mascotSystem.onTabChange(tabId);
      if (tabId === 'gallery') {
        const items = state.cache?.Gallery || state.cache?.Showcase || [];
        if (items.length === 0) setTimeout(() => contextualMessages.show('galleryEmpty'), 600);
      }
    });
  });

  // Setup form event listeners for live preview
  const profileInputs = document.querySelectorAll("#tab-profile input, #tab-profile textarea");
  profileInputs.forEach((input) => {
    input.addEventListener("input", () => profileManager.updatePreview());
  });

  // Setup gallery form listeners
  const galleryInputs = document.querySelectorAll("#gallery-form input, #gallery-form select, #gallery-form textarea");
  galleryInputs.forEach((input) => {
    input.addEventListener("input", () => galleryManager.updateGalleryPreview());
  });

  // Setup commission form listeners
  const commissionInputs = document.querySelectorAll("#commission-edit-form input, #commission-edit-form textarea");
  commissionInputs.forEach((input) => {
    input.addEventListener("input", () => commissionManager.updateCommissionPreview());
  });

  // Setup file upload listeners
  const galleryFileInput = document.getElementById("gallery-input-file");
  if (galleryFileInput) {
    galleryFileInput.addEventListener("change", (e) => galleryManager.handleFileUpload(e.target));
  }

  const commissionFileInput = document.getElementById("commission-edit-file");
  if (commissionFileInput) {
    commissionFileInput.addEventListener("change", (e) => commissionManager.handleFileUpload(e.target));
  }

  // Setup save buttons — with contextual message hooks
  const saveProfileBtn = document.getElementById("btn-save-profile");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => {
      profileManager.save();
      setTimeout(() => contextualMessages.show('profileSaved'), 1500);
    });
  }

  const saveGalleryBtn = document.getElementById("btn-save-gallery-item");
  if (saveGalleryBtn) {
    saveGalleryBtn.addEventListener("click", () => {
      const isNew = galleryManager.currentEditId === null;
      galleryManager.saveItem();
      if (isNew) setTimeout(() => contextualMessages.show('galleryAdded'), 1500);
    });
  }

  const saveCommissionBtn = document.getElementById("btn-save-commission");
  if (saveCommissionBtn) {
    saveCommissionBtn.addEventListener("click", () => {
      commissionManager.saveType();
      setTimeout(() => contextualMessages.show('commissionSaved'), 1500);
    });
  }

  // Setup add new buttons
  const addGalleryBtn = document.getElementById("btn-add-gallery-item");
  if (addGalleryBtn) {
    addGalleryBtn.addEventListener("click", () => galleryManager.openModal("add"));
  }

  const addCommissionBtn = document.getElementById("btn-add-commission-type");
  if (addCommissionBtn) {
    addCommissionBtn.addEventListener("click", () => commissionManager.openModal("add"));
  }

  const detailsPanel = {
    currentType: null,
    currentIndex: null,
  
    open(type, index) {
      this.currentType = type;
      this.currentIndex = index;
      const modal = document.getElementById("details-modal");
      if (!modal) return;
  
      const img = document.getElementById("details-image");
      const title = document.getElementById("details-title");
      const meta = document.getElementById("details-meta");
      const desc = document.getElementById("details-desc");
  
      let item, imageUrl, itemTitle, itemDesc, itemTagsHTML;
  
      if (type === "gallery") {
        item = galleryManager.galleryItems[index];
        imageUrl = BonnaUtils.getVal(item, "ImageURL");
        itemTitle = BonnaUtils.getVal(item, "Title") || "Untitled";
        itemDesc = BonnaUtils.getVal(item, "Description") || "No description provided.";
        const category = BonnaUtils.getVal(item, "Category");
        const typeName = BonnaUtils.getVal(item, "Type");
        itemTagsHTML = `
          ${category ? `<span class="admin-editor-meta">${BonnaUtils.escapeHtml(category)}</span>` : ""}
          ${typeName ? `<span class="admin-editor-meta">${BonnaUtils.escapeHtml(typeName)}</span>` : ""}
        `;
      } else {
        item = commissionManager.priceItems[index];
        imageUrl = BonnaUtils.getVal(item, "SampleImage");
        itemTitle = BonnaUtils.getVal(item, "Type") || "Untitled Commission";
        itemDesc = BonnaUtils.getVal(item, "Description") || "No description provided.";
        const category = BonnaUtils.getVal(item, "Category");
        const priceUSD = BonnaUtils.getVal(item, "PriceUSD");
        const priceIDR = BonnaUtils.getVal(item, "PriceIDR");
        const priceDisplay = priceUSD ? `$${priceUSD}` + (priceIDR ? ` / Rp${priceIDR}` : "") : "Contact for pricing";
        itemTagsHTML = `
          ${category ? `<span class="admin-editor-meta">${BonnaUtils.escapeHtml(category)}</span>` : ""}
          <span class="admin-editor-meta price">${priceDisplay}</span>
        `;
      }
  
      // Handle image loading like the public gallery
      img.classList.remove("loaded");
      img.src = imageUrl || "";
      img.onload = () => img.classList.add("loaded");
      img.style.display = imageUrl ? "block" : "none";
      
      title.textContent = itemTitle;
      desc.textContent = itemDesc;
      meta.innerHTML = itemTagsHTML;
  
      modal.classList.add("active");
    },
  
    close() {
      const modal = document.getElementById("details-modal");
      if (modal) modal.classList.remove("active");
    },
  
    next() {
      const items = this.currentType === "gallery" ? galleryManager.galleryItems : commissionManager.priceItems;
      if (this.currentIndex < items.length - 1) {
        this.open(this.currentType, this.currentIndex + 1);
      } else {
        this.open(this.currentType, 0); // Loop to start
      }
    },
  
    prev() {
      const items = this.currentType === "gallery" ? galleryManager.galleryItems : commissionManager.priceItems;
      if (this.currentIndex > 0) {
        this.open(this.currentType, this.currentIndex - 1);
      } else {
        this.open(this.currentType, items.length - 1); // Loop to end
      }
    },
  
    edit() {
      this.close();
      if (this.currentType === "gallery") {
        galleryManager.editItem(this.currentIndex);
      } else {
        commissionManager.editType(this.currentIndex);
      }
    },
  
    delete() {
      this.close();
      if (this.currentType === "gallery") {
        galleryManager.deleteItem(this.currentIndex);
      } else {
        commissionManager.deleteType(this.currentIndex);
      }
    }
  };

  // Setup Details Panel buttons
  const btnDetailsEdit = document.getElementById("btn-details-edit");
  const btnDetailsDelete = document.getElementById("btn-details-delete");
  const btnDetailsNext = document.getElementById("btn-details-next");
  const btnDetailsPrev = document.getElementById("btn-details-prev");

  if (btnDetailsEdit) btnDetailsEdit.addEventListener("click", () => detailsPanel.edit());
  if (btnDetailsDelete) btnDetailsDelete.addEventListener("click", () => detailsPanel.delete());
  if (btnDetailsNext) btnDetailsNext.addEventListener("click", () => detailsPanel.next());
  if (btnDetailsPrev) btnDetailsPrev.addEventListener("click", () => detailsPanel.prev());

  // --- Click Delegation for Dynamic Lists ---
  // Gallery List
  const galleryList = document.getElementById("gallery-editor-list");
  if (galleryList) {
    galleryList.addEventListener("click", (e) => {
      const item = e.target.closest(".admin-editor-item");
      if (!item) return;
      const index = parseInt(item.dataset.index);
      
      const btn = e.target.closest(".admin-editor-btn");
      if (btn) {
        const action = btn.dataset.action;
        if (action === "edit") {
          galleryManager.editItem(index);
        } else if (action === "delete") {
          galleryManager.deleteItem(index);
        }
      } else {
        detailsPanel.open("gallery", index);
      }
    });
  }

  // Commission List
  const commissionList = document.getElementById("commission-editor-list");
  if (commissionList) {
    commissionList.addEventListener("click", (e) => {
      const item = e.target.closest(".admin-editor-item");
      if (!item) return;
      const index = parseInt(item.dataset.index);
      
      const btn = e.target.closest(".admin-editor-btn");
      if (btn) {
        const action = btn.dataset.action;
        if (action === "edit") {
          commissionManager.editType(index);
        } else if (action === "delete") {
          commissionManager.deleteType(index);
        }
      } else {
        detailsPanel.open("commission", index);
      }
    });
  }

  // Setup close modal buttons
  document.querySelectorAll(".modal-close, .modal-backdrop, .admin-lightbox-close").forEach((el) => {
    el.addEventListener("click", () => {
      galleryManager.closeModal();
      commissionManager.closeModal();
      if (typeof detailsPanel !== 'undefined') detailsPanel.close();
    });
  });

  // Close modal on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      galleryManager.closeModal();
      commissionManager.closeModal();
      if (typeof detailsPanel !== 'undefined') detailsPanel.close();
    }
  });

  console.log("✨ Admin Dashboard 2.0 Initialized");
});

// Global error handler
window.addEventListener("error", (e) => {
  console.error("Admin Dashboard Error:", e);
  BonnaUtils.showToast("An error occurred. Check console.", "error");
});
