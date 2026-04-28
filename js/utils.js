/* ============================================
   BONNA — Shared Utilities
   Loaded before script.js and admin.js
   ============================================ */

const BonnaUtils = {

  // ==========================================
  // CONSTANTS
  // ==========================================

  /** Number of gallery items loaded per batch */
  ITEMS_PER_LOAD: 12,

  /** Page transition duration in ms */
  TRANSITION_MS: 600,

  /** Overlay hide duration in ms (after transition) */
  OVERLAY_HIDE_MS: 700,

  /** Nav height in px (must match --nav-height CSS variable) */
  NAV_HEIGHT: 60,

  /** App initialization failsafe timeout in ms */
  INIT_FAILSAFE_MS: 5000,

  // ==========================================
  // DATA HELPERS
  // ==========================================

  /**
   * Case-insensitive, whitespace-insensitive key lookup on a data object.
   * Handles keys like "ImageURL", "image_url", "Image URL" all as the same.
   * @param {Object} obj - The data object
   * @param {string} key - The key to look up
   * @returns {string} The value, or empty string if not found
   */
  getVal(obj, key) {
    if (!obj) return '';
    const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
    const actualKey = Object.keys(obj).find(
      k => k.toLowerCase().replace(/[\s_]/g, '') === normalizedKey
    );
    return actualKey ? (obj[actualKey] ?? '') : '';
  },

  /**
   * Escape HTML to prevent XSS when inserting user content into innerHTML.
   * @param {string} text - Raw text to escape
   * @returns {string} HTML-safe string
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  },

  /**
   * Get a default description for a commission type.
   * Used when no description is set in the CMS.
   * @param {string} type - Commission type name (e.g. "Chibi")
   * @returns {string} Default description text
   */
  getDefaultDescription(type) {
    const descriptions = {
      'Chibi':     'Cute chibi characters with big heads and tiny bodies',
      'Close Up':  'Portrait style focusing on face and expression',
      'Half Body': 'Upper body with some pose and details',
      'Full Body': 'Complete character from head to toe',
      'Scene':     'Full scene with background and environment',
    };
    return descriptions[type] || 'Commission artwork';
  },

  // ==========================================
  // DOM HELPERS
  // ==========================================

  /**
   * Debounce a function call.
   * @param {Function} func - Function to debounce
   * @param {number} wait - Delay in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        clearTimeout(timeout);
        func(...args);
      }, wait);
    };
  },

  /**
   * Format a date string for display.
   * @param {string} dateString
   * @returns {string} Formatted date, or 'Unknown date'
   */
  formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Show a toast notification.
   * Requires a #status-toast element in the DOM.
   * @param {string} message
   * @param {'info'|'success'|'error'} type
   * @param {number} duration - ms before auto-hide
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('status-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `admin-status ${type}`;
    toast.style.display = 'block';
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  },

  /**
   * Put a button into loading state (spinner + disabled).
   * Stores original HTML in data-original-content for restore.
   * @param {HTMLElement} element
   * @param {string} text - Loading text
   */
  showLoading(element, text = 'Loading...') {
    if (!element) return;
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;
    element.disabled = true;
  },

  /**
   * Restore a button from loading state.
   * @param {HTMLElement} element
   */
  hideLoading(element) {
    if (!element || !element.dataset.originalContent) return;
    element.innerHTML = element.dataset.originalContent;
    element.disabled = false;
    delete element.dataset.originalContent;
  },

};
