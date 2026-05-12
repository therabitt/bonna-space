/* ============================================
   LETTERS IN TIME — Layer 3
   One letter. One day. Never skipped.
   Begins 14 days after first login.
   ============================================ */

// ============================================
// LETTER CONTENT
// Add more letters here. Raditya fills these.
// ============================================
const LETTERS = [
  {
    id: 1,
    text: `It's been two weeks since the farewell.

I've been wondering how you've been settling into
whatever comes after school. A little lighter, maybe.
A little uncertain. Both at once.

That's allowed. That's actually how it's supposed to feel.

I built this place before that day, knowing I'd give it to you on it.
I hope it's been useful. I hope it's been something else too —
something that reminds you someone is paying attention,
even from far away.

You're not starting from zero. You're starting from everything you already are.

— R`,
  },
  {
    id: 2,
    text: `Something I've noticed about your art:

It doesn't try to be anything other than what it is.
There's no pretending in it. No performance.

That's rarer than people think.

Most things in the world are performing. Your work just... is.
And I think that's why it stays with people.

— R`,
  },
  {
    id: 3,
    text: `I wanted to tell you something I've never said directly:

The way you care about the details — the way you agonize over the small things,
the way you go back and fix what most people wouldn't even notice —

That's not perfectionism. That's integrity.

And I find it genuinely beautiful.

— R`,
  },
  {
    id: 4,
    text: `Some days I wonder what it was like before I knew you.

I think it was probably fine. Normal.
But "fine" and "normal" are very different things from what I have now.

I'm not sure I'd trade it.

Actually — I'm entirely sure I wouldn't.

— R`,
  },
  {
    id: 5,
    text: `Tu n'as pas à tout comprendre d'un coup.

Ni la vie, ni l'art, ni les gens — ni toi-même.

The not-knowing is part of it. It always has been.
I think the bravest thing you do, every day, is show up
for something you're still figuring out.

Most people stop before that. You don't.

— R`,
  },
];

// Timeless fallback letters — shown when the main pool is exhausted.
// Written to feel appropriate on any day, without referencing time.
const FALLBACK_LETTERS = [
  {
    id: 'fallback_1',
    text: `Just checking in.

Not because anything happened. Not because today is special.
Just because you crossed my mind, and I wanted to leave something here
for the moment you arrived.

You're doing well. I believe that even when you don't.

— R`,
  },
  {
    id: 'fallback_2',
    text: `A reminder, gently:

Your worth is not determined by your output today.
Not by how much you made, or saved, or finished.

You are allowed to simply exist for a while.

This studio will be here when you're ready to come back.
So will I.

— R`,
  },
  {
    id: 'fallback_3',
    text: `I keep a running list of things I love about you.

It's longer than you'd expect.
And today, I added something new to it.

I won't say what yet.
But I thought you should know it's growing.

— R`,
  },
];

// ============================================
// LETTERS SYSTEM
// ============================================
const lettersSystem = {
  ACTIVATION_DAYS: 14, // Days after first login before letters begin

  _getFirstLoginDate() {
    const stored = localStorage.getItem('bonna_first_login');
    if (!stored) {
      // If no first login recorded, record now and return null (not yet active)
      localStorage.setItem('bonna_first_login', new Date().toISOString());
      return null;
    }
    return new Date(stored);
  },

  _isActivated() {
    const firstLogin = this._getFirstLoginDate();
    if (!firstLogin) return false;
    const daysSince = Math.floor((Date.now() - firstLogin.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= this.ACTIVATION_DAYS;
  },

  _getTodayKey() {
    return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  },

  _getState() {
    try {
      return JSON.parse(localStorage.getItem('bonna_letter_state') || 'null');
    } catch (_) {
      return null;
    }
  },

  _saveState(state) {
    localStorage.setItem('bonna_letter_state', JSON.stringify(state));
  },

  // Returns the letter to show today, or null if already shown this session
  _getLetterForToday() {
    const today = this._getTodayKey();
    const state = this._getState() || { letterIndex: 0, lastDeliveredDate: null };

    // Already delivered today — return same letter (don't advance)
    if (state.lastDeliveredDate === today) {
      return this._getLetterByIndex(state.letterIndex - 1);
    }

    // Advance to next letter
    const index = state.letterIndex;
    this._saveState({ letterIndex: index + 1, lastDeliveredDate: today });
    return this._getLetterByIndex(index);
  },

  _getLetterByIndex(index) {
    if (index < LETTERS.length) {
      return LETTERS[index];
    }
    // Pool exhausted — rotate fallback letters
    const fallbackIndex = (index - LETTERS.length) % FALLBACK_LETTERS.length;
    return FALLBACK_LETTERS[fallbackIndex];
  },

  // Check if a letter should appear this session (first session of the day)
  _hasDeliveredToSession() {
    return sessionStorage.getItem('bonna_letter_delivered') === '1';
  },

  _markDeliveredToSession() {
    sessionStorage.setItem('bonna_letter_delivered', '1');
  },

  // ---- Envelope Trigger ----
  showEnvelope() {
    if (!this._isActivated()) return;
    if (this._hasDeliveredToSession()) return;

    // Check if letter was already shown today
    const today = this._getTodayKey();
    const state = this._getState();
    if (state && state.lastDeliveredDate === today) return;

    // Delay envelope appearance — let the dashboard settle first
    setTimeout(() => {
      const trigger = document.getElementById('letter-envelope-trigger');
      if (!trigger) return;
      trigger.classList.add('envelope-visible');

      // Auto-dismiss after 20 seconds if not clicked
      setTimeout(() => {
        if (!this._hasDeliveredToSession()) {
          trigger.classList.remove('envelope-visible');
        }
      }, 20000);
    }, 8000); // 8 seconds after load
  },

  // ---- Open Letter Modal ----
  openLetter() {
    const letter = this._getLetterForToday();
    if (!letter) return;

    this._markDeliveredToSession();

    // Hide envelope
    const trigger = document.getElementById('letter-envelope-trigger');
    if (trigger) trigger.classList.remove('envelope-visible');

    // Populate modal
    const modal = document.getElementById('letter-modal');
    const textEl = document.getElementById('letter-text');
    const dateEl = document.getElementById('letter-date');

    if (!modal || !textEl) return;

    if (dateEl) {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    // Convert newlines to paragraphs
    const paragraphs = letter.text.trim().split('\n\n');
    textEl.innerHTML = paragraphs
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    modal.classList.add('letter-modal-open');
    document.body.classList.add('modal-open');
  },

  closeLetter() {
    const modal = document.getElementById('letter-modal');
    if (modal) modal.classList.remove('letter-modal-open');
    document.body.classList.remove('modal-open');
  },

  init() {
    // Envelope click → open letter
    const trigger = document.getElementById('letter-envelope-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => this.openLetter());
    }

    // Close button
    const closeBtn = document.getElementById('letter-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeLetter());
    }

    // Close on backdrop click
    const backdrop = document.getElementById('letter-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeLetter());
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeLetter();
    });

    // Schedule envelope
    this.showEnvelope();
  },
};
