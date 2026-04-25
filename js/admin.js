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
  IMGUR_CLIENT_ID: "YOUR_IMGUR_CLIENT_ID_HERE", // TODO: Replace with your Imgur Client ID
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
      BonnaUtils.showToast("Connecting to Kingdom data...", "info");
      const response = await fetch(CONFIG.API_URL);
      const data = await response.json();
      state.cache = data;
      console.log("✨ Admin Data Synced:", data);
      BonnaUtils.showToast("Connected! Data synced.", "success");
      return data;
    } catch (err) {
      console.error("❌ Data Sync Failed:", err);
      BonnaUtils.showToast("Connection failed. Using offline mode.", "error");
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
        headers: { "Content-Type": "application/json" },
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
      BonnaUtils.showToast("✨ Profile updated successfully!", "success");
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
          <i class="fa-solid fa-images"></i>
          <p>No artworks yet. Add your first!</p>
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

        return `
        <div class="gallery-editor-item" data-id="${id}" data-index="${index}">
          <div class="gallery-editor-thumb">
            ${imageUrl ? `<img src="${imageUrl}" alt="${BonnaUtils.escapeHtml(title)}" loading="lazy">` : '<i class="fa-solid fa-image"></i>'}
          </div>
          <div class="gallery-editor-info">
            <h4 class="gallery-editor-title">${BonnaUtils.escapeHtml(title)}</h4>
            <span class="gallery-editor-type">${category ? `<span style="opacity:0.6">${BonnaUtils.escapeHtml(category)} · </span>` : ""}${BonnaUtils.escapeHtml(type)}</span>
          </div>
          <div class="gallery-editor-actions">
            <button class="gallery-editor-btn edit" onclick="galleryManager.editItem(${index})" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="gallery-editor-btn delete" onclick="galleryManager.deleteItem(${index})" title="Delete">
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
        <div class="gallery-preview-info">
          <h4 class="gallery-preview-title">${BonnaUtils.escapeHtml(title)}</h4>
          <span class="gallery-preview-type">${category ? BonnaUtils.escapeHtml(category) + " · " : ""}${BonnaUtils.escapeHtml(type)}</span>
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
      BonnaUtils.showToast(`Uploading "${fileName}" to Imgur...`, "info");
      const imageUrl = await api.uploadToImgur(file);

      document.getElementById("gallery-input-url").value = imageUrl;
      this.updateGalleryPreview();

      BonnaUtils.showToast(
        `✨ "${fileName}" uploaded successfully!`,
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
      BonnaUtils.showToast(`Upload failed: ${err.message}`, "error");

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
        };
      } else {
        // Add new
        const newId = this.galleryItems.length + 1;
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
          },
        ];
      }

      await api.saveData("Gallery", data, token);

      // Update local cache
      state.cache.Gallery = data;
      this.galleryItems = data;

      this.renderGalleryList();
      this.closeModal();
      BonnaUtils.showToast("✨ Artwork saved!", "success");
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

      BonnaUtils.showToast("✨ Artwork deleted!", "success");
    } catch (err) {
      BonnaUtils.showToast("Error deleting: " + err.message, "error");
    }
  },
};

// ============================================
// COMMISSION MANAGER
// ============================================
const commissionManager = {
  commissionTypes: [],

  loadCommissionEditor() {
    this.commissionTypes = state.cache?.CommissionTypes || [];

    // Fallback: generate from Prices
    if (this.commissionTypes.length === 0 && state.cache?.Prices) {
      const uniqueTypes = [
        ...new Set(state.cache.Prices.map((p) => p.Category)),
      ];
      this.commissionTypes = uniqueTypes.map((type, index) => ({
        Type: type,
        SampleImage: "",
        Description: BonnaUtils.getDefaultDescription(type),
        DisplayOrder: index + 1,
      }));
    }

    this.renderCommissionList();
    this.populateGalleryDropdowns();
  },

  populateGalleryDropdowns() {
    // --- Style (Category) select ---
    const categorySelect = document.getElementById("gallery-input-category");
    if (categorySelect) {
      const categories = [
        ...new Set(
          state.cache?.Prices?.map((p) => p.Category).filter(Boolean) || [],
        ),
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
      const rawTypes =
        state.cache?.Prices?.map((p) => p.Type || p.Category).filter(Boolean) ||
        [];
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

    if (this.commissionTypes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-palette"></i>
          <p>No commission types configured.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.commissionTypes
      .map((item, index) => {
        const type = BonnaUtils.getVal(item, "Type");
        const sampleImage = BonnaUtils.getVal(item, "SampleImage");
        const description = BonnaUtils.getVal(item, "Description");

        return `
        <div class="commission-editor-item" data-index="${index}">
          <div class="commission-editor-image">
            ${sampleImage ? `<img src="${sampleImage}" alt="${BonnaUtils.escapeHtml(type)}" loading="lazy">` : '<i class="fa-solid fa-image"></i>'}
          </div>
          <div class="commission-editor-info">
            <h4 class="commission-editor-type">${BonnaUtils.escapeHtml(type)}</h4>
            <p class="commission-editor-desc">${BonnaUtils.escapeHtml(description)}</p>
          </div>
          <div class="commission-editor-actions">
            <button class="commission-editor-btn edit" onclick="commissionManager.editType(${index})" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  },

  // Edit commission type
  editType(index) {
    const item = this.commissionTypes[index];
    const type = BonnaUtils.getVal(item, "Type");
    const sampleImage = BonnaUtils.getVal(item, "SampleImage");
    const description = BonnaUtils.getVal(item, "Description");

    // Populate edit form
    document.getElementById("commission-edit-type").value = type;
    document.getElementById("commission-edit-url").value = sampleImage;
    document.getElementById("commission-edit-desc").value = description;
    document.getElementById("commission-edit-index").value = index;

    // Show modal
    document.getElementById("commission-modal").classList.add("active");
    this.updateCommissionPreview();
  },

  closeModal() {
    document.getElementById("commission-modal").classList.remove("active");
  },

  // Update preview
  updateCommissionPreview() {
    const type =
      document.getElementById("commission-edit-type")?.value || "Commission";
    const imageUrl =
      document.getElementById("commission-edit-url")?.value || "";
    const desc = document.getElementById("commission-edit-desc")?.value || "";

    const preview = document.getElementById("commission-preview");
    if (!preview) return;

    preview.innerHTML = `
      <div class="commission-preview-card">
        <div class="commission-preview-image-container" style="height: 200px;">
          ${imageUrl ? `<img src="${imageUrl}" alt="${BonnaUtils.escapeHtml(type)}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div class="commission-preview-image-placeholder">No Image</div>'}
        </div>
        <div class="commission-preview-info">
          <h4 class="commission-preview-type">${BonnaUtils.escapeHtml(type)}</h4>
          <p class="commission-preview-desc">${BonnaUtils.escapeHtml(desc)}</p>
        </div>
      </div>
    `;
  },

  // Handle file upload for commission with enhanced UX
  async handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const fileName =
      file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name;

    // Update UI
    const uploadBtn = input
      .closest(".file-upload-wrapper")
      ?.querySelector(".file-upload-btn");
    if (uploadBtn) {
      uploadBtn.innerHTML = `<i class="fa-solid fa-file-image"></i> ${fileName}`;
    }

    try {
      BonnaUtils.showToast(`Uploading "${fileName}"...`, "info");
      const imageUrl = await api.uploadToImgur(file);
      document.getElementById("commission-edit-url").value = imageUrl;
      this.updateCommissionPreview();
      BonnaUtils.showToast(`✨ "${fileName}" uploaded!`, "success");

      // Reset button
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

  // Save commission type
  async saveType() {
    const token = sessionStorage.getItem("bonna_admin_token") || "";
    if (!token) {
      BonnaUtils.showToast("Session expired. Please log in again.", "error");
      setTimeout(() => window.location.replace("admin-login.html"), 1500);
      return;
    }

    const index = parseInt(
      document.getElementById("commission-edit-index")?.value,
    );
    const type = document.getElementById("commission-edit-type")?.value;
    const imageUrl = document
      .getElementById("commission-edit-url")
      ?.value.trim();
    const desc = document.getElementById("commission-edit-desc")?.value.trim();

    if (!type) {
      BonnaUtils.showToast("Type name is required!", "error");
      return;
    }

    const btn = document.getElementById("btn-save-commission");
    BonnaUtils.showLoading(btn, "Saving...");

    try {
      const data = [...this.commissionTypes];
      data[index] = {
        Type: type,
        SampleImage: imageUrl,
        Description: desc,
        DisplayOrder: index + 1,
      };

      await api.saveData("CommissionTypes", data, token);

      state.cache.CommissionTypes = data;
      this.commissionTypes = data;

      this.renderCommissionList();
      this.closeModal();
      BonnaUtils.showToast("✨ Commission type updated!", "success");
    } catch (err) {
      BonnaUtils.showToast("Error saving: " + err.message, "error");
    } finally {
      BonnaUtils.hideLoading(btn);
    }
  },
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Fetch initial data
  await api.fetchData();

  // Initialize tabs
  tabManager.init();

  // Setup form event listeners for live preview
  const profileInputs = document.querySelectorAll(
    "#tab-profile input, #tab-profile textarea",
  );
  profileInputs.forEach((input) => {
    input.addEventListener("input", () => profileManager.updatePreview());
  });

  // Setup gallery form listeners
  const galleryInputs = document.querySelectorAll(
    "#gallery-form input, #gallery-form select, #gallery-form textarea",
  );
  galleryInputs.forEach((input) => {
    input.addEventListener("input", () =>
      galleryManager.updateGalleryPreview(),
    );
  });

  // Setup commission form listeners
  const commissionInputs = document.querySelectorAll(
    "#commission-edit-form input, #commission-edit-form textarea",
  );
  commissionInputs.forEach((input) => {
    input.addEventListener("input", () =>
      commissionManager.updateCommissionPreview(),
    );
  });

  // Setup file upload listeners
  const galleryFileInput = document.getElementById("gallery-input-file");
  if (galleryFileInput) {
    galleryFileInput.addEventListener("change", (e) =>
      galleryManager.handleFileUpload(e.target),
    );
  }

  const commissionFileInput = document.getElementById("commission-edit-file");
  if (commissionFileInput) {
    commissionFileInput.addEventListener("change", (e) =>
      commissionManager.handleFileUpload(e.target),
    );
  }

  // Setup save buttons
  const saveProfileBtn = document.getElementById("btn-save-profile");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => profileManager.save());
  }

  const saveGalleryBtn = document.getElementById("btn-save-gallery-item");
  if (saveGalleryBtn) {
    saveGalleryBtn.addEventListener("click", () => galleryManager.saveItem());
  }

  const saveCommissionBtn = document.getElementById("btn-save-commission");
  if (saveCommissionBtn) {
    saveCommissionBtn.addEventListener("click", () =>
      commissionManager.saveType(),
    );
  }

  // Setup add new artwork button
  const addGalleryBtn = document.getElementById("btn-add-gallery-item");
  if (addGalleryBtn) {
    addGalleryBtn.addEventListener("click", () =>
      galleryManager.openModal("add"),
    );
  }

  // Setup close modal buttons
  document.querySelectorAll(".modal-close, .modal-backdrop").forEach((el) => {
    el.addEventListener("click", () => {
      galleryManager.closeModal();
      commissionManager.closeModal();
    });
  });

  // Close modal on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      galleryManager.closeModal();
      commissionManager.closeModal();
    }
  });

  console.log("✨ Admin Dashboard 2.0 Initialized");
});

// Global error handler
window.addEventListener("error", (e) => {
  console.error("Admin Dashboard Error:", e);
  BonnaUtils.showToast("An error occurred. Check console.", "error");
});
