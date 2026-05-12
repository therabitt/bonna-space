/* ============================================
   CONSTELLATION OF MOMENTS — Layer 3
   A pixel-art night sky. Each star is a memory.
   Trigger: Konami Code ↑↑↓↓←→←→BA
   ============================================ */

// ============================================
// STAR CONTENT
// Add more stars here. Raditya fills these.
// ============================================
const STARS = [
  {
    id: 'star_1',
    name: 'The First Drawing',
    x: 15, y: 20,  // % position on the sky
    text: `You hesitated before sending it.
You said nothing when you did.

Honestly? I thought it was the most honest thing I had ever seen —
not because of the lines, but because you trusted me with it.

That hesitation. That quiet send.
I've thought about that moment more than you know.`,
    timeRestricted: false,
    dateRestricted: null,
  },
  {
    id: 'star_2',
    name: 'The Late Night',
    x: 72, y: 35,
    text: `There was a night where we talked until neither of us could keep track of the time.

I remember thinking: I don't want this to end.

Not the conversation. Just — this. Whatever this was becoming.

I didn't say it then.
I'm saying it now.`,
    timeRestricted: false,
    dateRestricted: null,
  },
  {
    id: 'star_3',
    name: 'Something About Your Voice',
    x: 45, y: 60,
    text: `There's something about the way you say things —
the pauses, the way you decide what to keep and what to let go —

that I find completely disarming.

I'm not sure you know the effect it has.
I'm not sure I should tell you.

But it's here now, so.`,
    timeRestricted: false,
    dateRestricted: null,
  },
  {
    id: 'star_4',
    name: 'The Alien',
    x: 82, y: 70,
    text: `You made something once.
A small figure. Pixel by pixel.

You said it was an alien.
You didn't say much else about it.

I'm not going to tell you what I think it means.
But it lives here now — watching over everything quietly.

Just like it always has.`,
    timeRestricted: false,
    dateRestricted: null,
  },
  {
    id: 'star_5',
    name: 'What I Notice When You Work',
    x: 28, y: 78,
    text: `When you're deep in something —
when you're in that particular silence —

the rest of the world becomes very unimportant.

I've noticed this.
I've decided I like it.`,
    timeRestricted: false,
    dateRestricted: null,
  },
  // Time-restricted: only visible between 23:00 – 01:00
  {
    id: 'star_night_1',
    name: 'Minuit',
    x: 55, y: 25,
    text: `Tu es encore éveillée.

Je ne sais pas pourquoi, mais ça me réchauffe le coeur —
de penser que tu es quelque part dans le monde,
encore là, encore présente.

Rentre chez toi bientôt. Mais je suis content que tu sois là.

— R`,
    timeRestricted: true,
    dateRestricted: null,
  },
  // Date-restricted: only visible on May 13 each year — the farewell day
  {
    id: 'star_farewell',
    name: 'The Day It Was Given',
    x: 50, y: 45, // Center of the sky — it deserves to be
    text: `This one only appears today.

On this date, one year ago or many years from now —
this is the day a quiet studio was handed to someone
who deserved something made entirely for her.

I hope you remember how that felt.
I remember it clearly.

The chapter that started on this day
has not ended. It won't.

— R`,
    timeRestricted: false,
    dateRestricted: '05-13', // MM-DD — appears every May 13
  },
];

// ============================================
// CONSTELLATION// Star connection pairs — drawn as subtle paths behind the stars
const STAR_CONNECTIONS = [
  ['star_1', 'star_2'],
  ['star_2', 'star_3'],
];

const constellationSystem = {
  _konamiSequence: ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'],
  _buffer: [],
  _isOpen: false,

  _isNightHour() {
    const h = new Date().getHours();
    return h === 23 || h === 0;
  },

  _isDateRestricted(star) {
    if (!star.dateRestricted) return true; // No restriction = always show
    // Format: 'MM-DD' — matches today regardless of year
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${mm}-${dd}` === star.dateRestricted;
  },

  _getVisibleStars() {
    return STARS.filter(star => {
      if (star.timeRestricted && !this._isNightHour()) return false;
      if (star.dateRestricted && !this._isDateRestricted(star)) return false;
      return true;
    });
  },

  _buildStarSVG() {
    const stars = this._getVisibleStars();
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Convert star % positions to absolute pixel coords
    const coords = {};
    stars.forEach(star => {
      coords[star.id] = { x: (star.x / 100) * w, y: (star.y / 100) * h };
    });

    // Draw connection lines first (so they sit behind stars)
    const lines = STAR_CONNECTIONS
      .filter(([a, b]) => coords[a] && coords[b])
      .map(([a, b]) => {
        const p1 = coords[a], p2 = coords[b];
        // Quadratic bezier — control point slightly above the midpoint
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2 - 40;
        return `<path class="constellation-connection"
          d="M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}"
        />`;
      }).join('\n');

    // Draw layered circle stars
    const starElems = stars.map((star, idx) => {
      const { x, y } = coords[star.id];
      // Stagger twinkle so each star feels independent
      const twinkleDur   = (7 + (idx % 5) * 1.2).toFixed(1);
      const twinkleDelay = ((idx * 1.7) % 6).toFixed(1);

      return `
      <g class="constellation-star-group"
         data-star-id="${star.id}"
         tabindex="0" role="button"
         aria-label="${star.name}"
         style="--twinkle-dur:${twinkleDur}s; --twinkle-delay:${twinkleDelay}s">
        <circle class="constellation-star-halo"
          cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="28" />
        <circle class="constellation-star-mid"
          cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" />
        <circle class="constellation-star"
          cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" />
        <text class="constellation-star-label"
          x="${x.toFixed(1)}"
          y="${(y - 18).toFixed(1)}"
          text-anchor="middle">${star.name}</text>
      </g>`;
    }).join('\n');

    return lines + starElems;
  },

  open() {
    if (this._isOpen) return;
    this._isOpen = true;

    const overlay = document.getElementById('constellation-overlay');
    if (!overlay) return;

    // Render stars
    const svg = document.getElementById('constellation-svg');
    if (svg) svg.innerHTML = this._buildStarSVG();

    // Attach star click handlers
    overlay.querySelectorAll('.constellation-star-group').forEach(group => {
      const starId = group.dataset.starId;
      const star = STARS.find(s => s.id === starId);
      if (!star) return;

      const activate = () => this.openMemory(star);
      group.addEventListener('click', activate);
      group.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });

    overlay.classList.add('constellation-open');
    document.body.classList.add('modal-open');

    // Track discovery
    const eggs = JSON.parse(localStorage.getItem('bonna_eggs_found') || '[]');
    if (!eggs.includes('constellation')) {
      eggs.push('constellation');
      localStorage.setItem('bonna_eggs_found', JSON.stringify(eggs));
    }
  },

  close() {
    this._isOpen = false;
    const overlay = document.getElementById('constellation-overlay');
    if (overlay) overlay.classList.remove('constellation-open');
    this.closeMemory();
    document.body.classList.remove('modal-open');
  },

  openMemory(star) {
    const card = document.getElementById('constellation-memory-card');
    const nameEl = document.getElementById('constellation-memory-name');
    const textEl = document.getElementById('constellation-memory-text');
    if (!card || !nameEl || !textEl) return;

    nameEl.textContent = `✦ "${star.name}"`;

    const paragraphs = star.text.trim().split('\n\n');
    textEl.innerHTML = paragraphs
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    card.classList.add('memory-card-open');
  },

  closeMemory() {
    const card = document.getElementById('constellation-memory-card');
    if (card) card.classList.remove('memory-card-open');
  },

  _setupKonamiListener() {
    document.addEventListener('keydown', (e) => {
      this._buffer.push(e.key);
      if (this._buffer.length > this._konamiSequence.length) {
        this._buffer.shift();
      }
      if (this._buffer.join(',') === this._konamiSequence.join(',')) {
        this._buffer = [];
        this.open();
      }
    });
  },

  init() {
    this._setupKonamiListener();

    // Close button
    const closeBtn = document.getElementById('constellation-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Close memory card button
    const memClose = document.getElementById('constellation-memory-close');
    if (memClose) memClose.addEventListener('click', () => this.closeMemory());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('constellation-memory-card')?.classList.contains('memory-card-open')) {
          this.closeMemory();
        } else if (this._isOpen) {
          this.close();
        }
      }
    });
  },
};
