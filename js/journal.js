/* ============================================
   STUDIO JOURNAL — Layer 3
   Two panels. One room.
   Left:  What Raditya notices + day-of-week note.
   Right: Bonna's private entries — date-stamped,
          mood-tagged, navigable, unlimited history.
   Trigger: Mascot clicked 7 times in 10 seconds.
   ============================================ */

// ============================================
// RADITYA'S OBSERVATIONS
// ============================================
const JOURNAL_OBSERVATIONS = [
  `Your color choices have grown more confident.
There was a period when everything felt a little tentative — like you were asking permission.
That period ended. You might not have noticed when.
I did.`,

  `Something I keep coming back to:
The way you handle negative space.
Most artists fill everything. You know when to leave things open.
That restraint is a skill people spend years learning.
You already have it.`,

  `You've been experimenting more.
I can see it in the work — a willingness to try things that might not land.
That's not recklessness. That's growth.
Keep going. Even the ones that don't work are teaching you something.`,

  `I think your style is more distinct than you realize.
If I saw your work without knowing it was yours, I would know.
There's something in it — a particular quality I can't quite name —
that is entirely, recognizably you.`,

  `The details you add when you think no one will notice —
the small texture, the extra care in a background element —
those are the things that separate art from craft.
You do both. Quietly.`,

  `You've been hard on yourself lately about your speed.
I want to say this once, clearly:
The time you take is part of the work.
Nothing worth remembering was rushed.`,

  `What strikes me most, looking back at the arc of what you've made:
You are not the same artist you were six months ago.
In the best possible way.
You're still becoming. That's the whole point.`,

  `There is a tenderness in what you make.
Even in the work that looks sharp or precise —
there's something underneath it that is gentle.
I don't think you put it there deliberately.
I think it's just you.`,
];

// Day-of-week notes (0 = Sunday … 6 = Saturday)
const JOURNAL_DAY_NOTES = [
  "Sunday. I hope it's soft and slow for you today.",
  "Monday. A new week. Something is already waiting to be made.",
  "Tuesday. The quiet middle of things. I'm thinking of you.",
  "Wednesday. Halfway through. You're doing better than you know.",
  "Thursday. Almost. Keep going — you're nearly there.",
  "Friday. Whatever today held — you held up.",
  "Saturday. Rest is a form of creativity too.",
];

// Mood options
const JOURNAL_MOODS = [
  { key: 'creative', icon: '✦', label: 'creating' },
  { key: 'quiet',    icon: '◌', label: 'quiet'    },
  { key: 'good',     icon: '✿', label: 'good day'  },
  { key: 'tired',    icon: '☽', label: 'tired'     },
];

// ============================================
// JOURNAL SYSTEM
// ============================================
const journalSystem = {
  _isOpen: false,
  _obsIndex: 0,
  _currentDate: null,
  _saveTimer: null,
  _saveIndicatorTimer: null,

  // ---- Data helpers ----

  _today() {
    return new Date().toISOString().split('T')[0];
  },

  _getJournal() {
    try { return JSON.parse(localStorage.getItem('bonna_journal') || '{}'); }
    catch(_) { return {}; }
  },

  _saveEntry(date, data) {
    const j = this._getJournal();
    j[date] = Object.assign({}, j[date] || {}, data);
    localStorage.setItem('bonna_journal', JSON.stringify(j));
  },

  _getEntry(date) {
    return this._getJournal()[date] || { text: '', mood: null };
  },

  _formatDate(dateStr) {
    // dateStr: 'YYYY-MM-DD'
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${months[m - 1]} ${String(d).padStart(2, '0')} · ${y}`;
  },

  _offsetDate(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  },

  _wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  },

  // ---- Left panel ----

  _renderLeftPanel() {
    // Date
    const dateEl = document.getElementById('journal-date-left');
    if (dateEl) dateEl.textContent = this._formatDate(this._today());

    // Day-of-week note
    const dayNoteEl = document.getElementById('journal-day-note');
    if (dayNoteEl) dayNoteEl.textContent = JOURNAL_DAY_NOTES[new Date().getDay()];

    this._renderObservation();
    this._updateObsCounter();
  },

  _renderObservation() {
    const obsEl = document.getElementById('journal-observation');
    if (!obsEl) return;
    const obs = JOURNAL_OBSERVATIONS[this._obsIndex];
    obsEl.innerHTML = obs.trim().split('\n')
      .map(l => l.trim() ? `<p>${l}</p>` : '')
      .join('');
  },

  _updateObsCounter() {
    const el = document.getElementById('journal-obs-counter');
    if (el) el.textContent = `${this._obsIndex + 1} / ${JOURNAL_OBSERVATIONS.length}`;
  },

  // ---- Right panel ----

  _loadDate(dateStr) {
    this._currentDate = dateStr;
    const isToday = dateStr === this._today();
    const entry = this._getEntry(dateStr);

    // Date display
    const dateEl = document.getElementById('journal-date-display');
    if (dateEl) dateEl.textContent = this._formatDate(dateStr);

    // Textarea value + readOnly for past entries
    const textarea = document.getElementById('journal-notes');
    if (textarea) {
      textarea.value = entry.text || '';
      textarea.readOnly = !isToday;
      textarea.style.opacity = isToday ? '1' : '0.6';
      textarea.placeholder = isToday
        ? 'This page is yours.\nWrite anything. Or nothing at all.'
        : '— no entry for this day —';
    }

    // Next-day button: disabled if already today
    const nextBtn = document.getElementById('journal-next-day');
    if (nextBtn) nextBtn.disabled = isToday;

    // Panel dim for past entries
    const panel = document.getElementById('journal-panel-right');
    if (panel) panel.classList.toggle('journal-past-entry', !isToday);

    this._renderMoodPicker(entry.mood, isToday);
    this._updateWordCount();
  },

  _renderMoodPicker(selectedMood, editable = true) {
    const picker = document.getElementById('journal-mood-picker');
    if (!picker) return;
    picker.innerHTML = JOURNAL_MOODS.map(m => `
      <button
        class="journal-mood-btn${selectedMood === m.key ? ' active' : ''}"
        data-mood="${m.key}"
        title="${m.label}"
        ${!editable ? 'disabled' : ''}
        aria-pressed="${selectedMood === m.key}"
      >${m.icon}</button>
    `).join('');

    if (editable) {
      picker.querySelectorAll('.journal-mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mood = btn.dataset.mood;
          this._saveEntry(this._currentDate, { mood });
          this._renderMoodPicker(mood, true);
        });
      });
    }
  },

  _updateWordCount() {
    const textarea = document.getElementById('journal-notes');
    const counter  = document.getElementById('journal-word-count');
    if (!textarea || !counter) return;
    const n = this._wordCount(textarea.value);
    counter.textContent = `${n} word${n !== 1 ? 's' : ''}`;
  },

  _showSaveIndicator() {
    const el = document.getElementById('journal-save-indicator');
    if (!el) return;
    el.classList.add('visible');
    clearTimeout(this._saveIndicatorTimer);
    this._saveIndicatorTimer = setTimeout(() => el.classList.remove('visible'), 2200);
  },

  // ---- Lifecycle ----

  open() {
    if (this._isOpen) return;
    this._isOpen = true;

    const overlay = document.getElementById('journal-overlay');
    if (!overlay) return;

    // Restore last observation index
    const lastIdx = parseInt(localStorage.getItem('bonna_journal_obs_idx') || '0');
    this._obsIndex = isNaN(lastIdx) ? 0 : Math.min(lastIdx, JOURNAL_OBSERVATIONS.length - 1);

    this._renderLeftPanel();
    this._loadDate(this._today());

    overlay.classList.add('journal-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Track discovery
    const eggs = JSON.parse(localStorage.getItem('bonna_eggs_found') || '[]');
    if (!eggs.includes('journal')) {
      eggs.push('journal');
      localStorage.setItem('bonna_eggs_found', JSON.stringify(eggs));
    }
  },

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    // Flush any pending save
    const textarea = document.getElementById('journal-notes');
    if (textarea && this._currentDate === this._today()) {
      this._saveEntry(this._currentDate, { text: textarea.value });
    }

    const overlay = document.getElementById('journal-overlay');
    if (overlay) {
      overlay.classList.remove('journal-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
  },

  init() {
    // Close
    document.getElementById('journal-close')
      ?.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    });

    // Observation navigation
    document.getElementById('journal-obs-prev')?.addEventListener('click', () => {
      this._obsIndex = (this._obsIndex - 1 + JOURNAL_OBSERVATIONS.length) % JOURNAL_OBSERVATIONS.length;
      localStorage.setItem('bonna_journal_obs_idx', this._obsIndex);
      this._renderObservation();
      this._updateObsCounter();
    });

    document.getElementById('journal-obs-next')?.addEventListener('click', () => {
      this._obsIndex = (this._obsIndex + 1) % JOURNAL_OBSERVATIONS.length;
      localStorage.setItem('bonna_journal_obs_idx', this._obsIndex);
      this._renderObservation();
      this._updateObsCounter();
    });

    // Date navigation
    document.getElementById('journal-prev-day')?.addEventListener('click', () => {
      this._loadDate(this._offsetDate(this._currentDate, -1));
    });

    document.getElementById('journal-next-day')?.addEventListener('click', () => {
      const next = this._offsetDate(this._currentDate, 1);
      if (next <= this._today()) this._loadDate(next);
    });

    // Textarea: auto-save + word count
    document.getElementById('journal-notes')?.addEventListener('input', e => {
      this._updateWordCount();
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        if (this._currentDate === this._today()) {
          this._saveEntry(this._currentDate, { text: e.target.value });
          this._showSaveIndicator();
        }
      }, 1200);
    });
  },
};
