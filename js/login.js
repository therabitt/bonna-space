/* ============================================
   BONNA — Admin Login Gate v3
   "Bonna's Secret Sanctuary"
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

const ADMIN_TOKEN_HASH = 'd52708198b99361130471e71103b4f4dc828781825afb50c7b1a7a945b7b3cdb';

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
window.hashToken = hashToken;

// ============================================
// TYPEWRITER + DELETE ENGINE
// ============================================
function typewriter(element, text, speed = 38) {
  return new Promise(resolve => {
    element.textContent = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        element.textContent += text[i++];
        setTimeout(tick, speed + Math.random() * 18);
      } else {
        resolve();
      }
    };
    tick();
  });
}

function deleteText(element, speed = 22) {
  return new Promise(resolve => {
    const tick = () => {
      const current = element.textContent;
      if (current.length > 0) {
        element.textContent = current.slice(0, -1);
        setTimeout(tick, speed + Math.random() * 10);
      } else {
        resolve();
      }
    };
    tick();
  });
}

// Pause cursor blink during typing/deleting so it doesn't flicker
function setCursorActive(cursorEl, active) {
  if (!cursorEl) return;
  cursorEl.style.animation = active
    ? 'none'           // cursor stays solid while typing
    : 'cursorBlink 0.8s step-end infinite'; // blinks when idle
  cursorEl.style.opacity = '1';
}

// ============================================
// QUOTE POOL (cycling typewriter quotes)
// ============================================
const QUOTES = [
  'A quiet corner of the internet, made for you.',
  'Un sanctuaire numérique, fait avec soin.',
  'Pixel by pixel. With intention.',
  'Everything here was made thinking of you.',
  'Come in. You\'re always welcome here.',
  'This space has been waiting, quietly.',
  'Every colour here was chosen for you.',
  'You are the reason this place exists.',
];

// Error flavor texts (poetic, retro-themed)
const ERROR_FLAVORS = [
  'wrong door, love. try again.',
  'the stars don\'t align this time. try once more.',
  'that key doesn\'t fit this lock, mon amour.',
  'almost. the universe says not yet.',
  'a wrong note in a right song. try again.',
];

let quoteIndex = -1;
let quoteRunning = false;

async function cycleQuotes(quoteEl, cursorEl) {
  quoteRunning = true;

  // Initial type-in
  let next;
  do { next = Math.floor(Math.random() * QUOTES.length); } while (next === quoteIndex);
  quoteIndex = next;
  setCursorActive(cursorEl, true);
  await typewriter(quoteEl, QUOTES[quoteIndex], 36);
  setCursorActive(cursorEl, false);

  while (quoteRunning) {
    // Pause with blinking cursor
    await new Promise(r => setTimeout(r, 3000));
    if (!quoteRunning) break;

    // Delete characters one by one
    setCursorActive(cursorEl, true);
    await deleteText(quoteEl, 20);
    if (!quoteRunning) break;

    // Brief pause before typing next
    await new Promise(r => setTimeout(r, 350));

    // Pick next quote
    do { next = Math.floor(Math.random() * QUOTES.length); } while (next === quoteIndex);
    quoteIndex = next;

    // Type next quote
    await typewriter(quoteEl, QUOTES[quoteIndex], 36);
    setCursorActive(cursorEl, false);
  }
}

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
  if (preloader) setTimeout(() => preloader.classList.add('hidden'), 700);

  // Start typewriter quote cycling
  const quoteEl  = document.getElementById('sanctuary-quote-text');
  const cursorEl = document.querySelector('.sanctuary-cursor');
  if (quoteEl) cycleQuotes(quoteEl, cursorEl);

  // Element references (new sanctuary IDs)
  const form        = document.getElementById('login-form');
  const keyInput    = document.getElementById('login-key');
  const loginBtn    = document.getElementById('login-btn');
  const toggleBtn   = document.getElementById('toggle-key');
  const messageEl   = document.getElementById('login-message');
  const flavorEl    = document.getElementById('sanctuary-flavor');
  const inputGroup  = keyInput?.closest('.sanctuary-input-group');

  // Auto-focus input
  setTimeout(() => keyInput?.focus(), 900);

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
    messageEl.className = `sanctuary-message sanctuary-message--${type}`;
    messageEl.style.display = 'block';
  }

  function clearMessage() {
    messageEl.style.display = 'none';
  }

  // Button loading state
  function setLoading(loading) {
    loginBtn.disabled = loading;
    const textSpan = loginBtn.querySelector('.sanctuary-submit-text');
    const icon     = loginBtn.querySelector('.sanctuary-submit-icon');
    if (loading) {
      if (textSpan) textSpan.textContent = 'ONE MOMENT...';
      if (icon) icon.className = 'fa-solid fa-spinner fa-spin sanctuary-submit-icon';
    } else {
      if (textSpan) textSpan.textContent = 'ENTER';
      if (icon) icon.className = 'fa-solid fa-arrow-right sanctuary-submit-icon';
    }
  }

  // Shake animation on wrong key
  function shakeInput() {
    if (!inputGroup) return;
    inputGroup.classList.remove('sanctuary-shake');
    void inputGroup.offsetWidth; // force reflow
    inputGroup.classList.add('sanctuary-shake');
    setTimeout(() => inputGroup.classList.remove('sanctuary-shake'), 500);
  }

  // Change flavor text on wrong key (poetic feedback)
  function setErrorFlavor() {
    if (!flavorEl) return;
    const pick = ERROR_FLAVORS[Math.floor(Math.random() * ERROR_FLAVORS.length)];
    flavorEl.style.transition = 'opacity 0.4s ease';
    flavorEl.style.opacity = '0';
    setTimeout(() => {
      flavorEl.innerHTML = pick;
      flavorEl.style.opacity = '1';
    }, 420);
  }

  // Reset flavor text after a delay
  function resetFlavor() {
    setTimeout(() => {
      if (!flavorEl) return;
      flavorEl.style.transition = 'opacity 0.4s ease';
      flavorEl.style.opacity = '0';
      setTimeout(() => {
        flavorEl.innerHTML = 'The key is where it has always been, <em>mon amour</em>.';
        flavorEl.style.opacity = '1';
      }, 420);
    }, 3500);
  }

  // Main login handler
  async function handleLogin() {
    const token = keyInput.value.trim();

    clearMessage();

    if (!token) {
      showMessage('whisper your key and step inside.');
      keyInput.focus();
      return;
    }

    setLoading(true);

    try {
      // Dev mode
      if (!ADMIN_TOKEN_HASH) {
        sessionStorage.setItem('bonna_admin_token', token);
        showMessage('✨ dev mode — the door is open.', 'success');
        quoteRunning = false;
        setTimeout(() => window.location.replace('admin.html'), 900);
        return;
      }

      const inputHash = await hashToken(token);

      if (inputHash === ADMIN_TOKEN_HASH) {
        sessionStorage.setItem('bonna_admin_token', token);
        quoteRunning = false;
        showMessage('welcome back, belle. ✦', 'success');
        setTimeout(() => window.location.replace('admin.html'), 1200);
      } else {
        shakeInput();
        setErrorFlavor();
        resetFlavor();
        showMessage(ERROR_FLAVORS[Math.floor(Math.random() * ERROR_FLAVORS.length)]);
        keyInput.value = '';
        keyInput.focus();
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      showMessage('connection lost. try again, love.');
      setLoading(false);
    }
  }

  // Form submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
  });
});
