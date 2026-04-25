/* ============================================
   BONNA — Admin Login Gate
   ============================================

   SETUP INSTRUCTIONS:
   1. Open browser DevTools console on this page
   2. Run: await hashToken('your-admin-token-here')
   3. Copy the output (64-char hex string)
   4. Paste it as the value of ADMIN_TOKEN_HASH below
   5. Save and reload

   The "admin token" is the same secret token you
   use in your Google Apps Script backend.
   ============================================ */

const ADMIN_TOKEN_HASH = 'd52708198b99361130471e71103b4f4dc828781825afb50c7b1a7a945b7b3cdb'; // ← Paste your SHA-256 hash here after setup

// ============================================
// HASH UTILITY (exposed globally for setup)
// ============================================
async function hashToken(token) {
  const encoded = new TextEncoder().encode(token.trim());
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
window.hashToken = hashToken; // Accessible from DevTools console

// ============================================
// LOGIN LOGIC
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // If already authenticated this session, skip login
  if (sessionStorage.getItem('bonna_admin_token')) {
    window.location.replace('admin.html');
    return;
  }

  // Hide preloader
  const preloader = document.getElementById('preloader');
  if (preloader) setTimeout(() => preloader.classList.add('hidden'), 600);

  // Element references
  const form = document.getElementById('login-form');
  const keyInput = document.getElementById('login-key');
  const loginBtn = document.getElementById('login-btn');
  const toggleBtn = document.getElementById('toggle-key');
  const messageEl = document.getElementById('login-message');

  // Auto-focus input
  keyInput?.focus();

  // Show/hide password toggle
  toggleBtn?.addEventListener('click', () => {
    const isHidden = keyInput.type === 'password';
    keyInput.type = isHidden ? 'text' : 'password';
    const icon = toggleBtn.querySelector('i');
    icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  });

  // Message helpers
  function showMessage(text, type = 'error') {
    messageEl.textContent = text;
    messageEl.className = `login-message login-message--${type}`;
    messageEl.style.display = 'block';
  }

  function clearMessage() {
    messageEl.style.display = 'none';
  }

  // Button loading state
  function setLoading(loading) {
    loginBtn.disabled = loading;
    loginBtn.innerHTML = loading
      ? '<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying...</span>'
      : '<i class="fa-solid fa-key"></i> <span>ENTER THE KINGDOM</span>';
  }

  // Shake animation on wrong key
  function shakeInput() {
    keyInput.classList.remove('shake');
    void keyInput.offsetWidth; // force reflow
    keyInput.classList.add('shake');
    setTimeout(() => keyInput.classList.remove('shake'), 500);
  }

  // Main login handler
  async function handleLogin() {
    const token = keyInput.value.trim();

    clearMessage();

    if (!token) {
      showMessage('⚠️ Enter your secret key, traveler!');
      keyInput.focus();
      return;
    }

    setLoading(true);

    try {
      // Dev mode: if no hash configured, allow any non-empty token
      if (!ADMIN_TOKEN_HASH) {
        sessionStorage.setItem('bonna_admin_token', token);
        showMessage('✨ Dev mode active — no hash configured. Access granted!', 'success');
        setTimeout(() => window.location.replace('admin.html'), 900);
        return;
      }

      const inputHash = await hashToken(token);

      if (inputHash === ADMIN_TOKEN_HASH) {
        // Store token for use by admin dashboard
        sessionStorage.setItem('bonna_admin_token', token);
        showMessage('✨ Access granted! Entering the Kingdom...', 'success');
        setTimeout(() => window.location.replace('admin.html'), 1000);
      } else {
        showMessage('🚫 The kingdom remains sealed. Wrong key!');
        keyInput.value = '';
        keyInput.focus();
        shakeInput();
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      showMessage('❌ Verification failed. Check your connection and try again.');
      setLoading(false);
    }
  }

  // Form submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
  });
});
