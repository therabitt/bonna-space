/* ============================================
   BONNA - Portfolio Redesign
   JavaScript: Animations & Interactivity (SPA Edition)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const API_URL = 'https://script.google.com/macros/s/AKfycbxY6ITbRNFv8FyuTp_DLkcoT_0Tx1cSau3yjimbo2riZ_gNP9u21Oh0xzkcYPiWPObh/exec';

  // --- 0. Data Management (Dynamic CMS) ---
  class DataManager {
    constructor(apiUrl) {
      this.apiUrl = apiUrl;
      this.cache = null;
    }

    async fetchData() {
      try {
        const response = await fetch(this.apiUrl);
        this.cache = await response.json();
        console.log('✨ Data Synced:', this.cache);
        return this.cache;
      } catch (err) {
        console.error('❌ Data Sync Failed:', err);
        return null;
      }
    }

    injectAll(data) {
      if (!data) return;

      // 1. Inject Profile Data
      if (data.Profile) {
        data.Profile.forEach(item => {
          const rawKey = (item.Key || '').toString();
          const k = rawKey.toLowerCase().replace(/[\s_]/g, '');
          const el = document.getElementById(`field-${rawKey}`);
          
          if (el || k === 'abouttext') {
            if (k === 'tagline') {
              const val = item.Value || '';
              el.setAttribute('data-full-text', val);
              if (el) el.textContent = ''; 
            } else if (k === 'abouttext') {
              // Convert multi-line bio into Tags
              const tagContainer = document.getElementById('dynamic-about-tags');
              if (tagContainer) {
                const lines = (item.Value || '').split('\n').filter(l => l.trim() !== '');
                if (lines.length > 0) {
                  tagContainer.innerHTML = ''; // Clear default tags
                  lines.forEach(line => {
                    const li = document.createElement('li');
                    li.className = 'about-tag reveal';
                    const emojiMatch = line.match(/^(\ud83c[\udf00-\uffff]|\ud83d[\udc00-\ude4f\ude80-\udeff]|\ud83e[\udd00-\uddff]|[\u2600-\u27bf])\s*/);
                    if (emojiMatch) {
                      const emoji = emojiMatch[0];
                      const text = line.replace(emoji, '');
                      li.innerHTML = `<span class="tag-emoji">${emoji}</span> ${text}`;
                    } else {
                      li.textContent = line;
                    }
                    tagContainer.appendChild(li);
                  });
                }
              }
              // Force clear the paragraph text to prevent "double" content
              const pBio = document.getElementById('field-about_text');
              if (pBio) pBio.textContent = ''; 
            } else if (el) {
              el.textContent = item.Value || '';
            }
          }
        });
      }

      // 2. Inject Prices (Commission Page)
      const priceContainer = document.getElementById('dynamic-prices-container');
      if (priceContainer && data.Prices) {
        this.renderPrices(data.Prices, priceContainer);
      }

      // 3. Inject Showcase (Home / Showcase Section)
      const showcaseGrid = document.getElementById('dynamic-showcase-grid');
      const showcaseData = data.Showcase || data.Gallery; // Support both tab names
      if (showcaseGrid && showcaseData) {
        this.renderShowcase(showcaseData, showcaseGrid);
      }
    }

    renderPrices(prices, container) {
      container.innerHTML = ''; // Clear placeholders
      
      // Group by Category
      const groups = {};
      prices.forEach(p => {
        if (!groups[p.Category]) groups[p.Category] = [];
        groups[p.Category].push(p);
      });

      for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement('div');
        section.className = 'price-category-group reveal';
        section.innerHTML = `
          <h4 class="category-title">${category}</h4>
          <div class="retro-table-wrapper">
            <table class="retro-table">
              <thead><tr><th>TYPES</th><th>USD</th><th>IDR</th></tr></thead>
              <tbody>
                ${items.map(p => `<tr><td>${p.Type}</td><td>$${p.PriceUSD}</td><td>${p.PriceIDR}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        `;
        container.appendChild(section);
      }
    }

    // Helper to get value from object with any case key (e.g. ImageURL, imageurl, Image URL)
    getVal(obj, key) {
      if (!obj) return '';
      const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
      const actualKey = Object.keys(obj).find(k => k.toLowerCase().replace(/[\s_]/g, '') === normalizedKey);
      return actualKey ? obj[actualKey] : '';
    }

    renderShowcase(items, container) {
      container.innerHTML = '';
      items.forEach((item, index) => {
        const title = this.getVal(item, 'Title');
        const img = this.getVal(item, 'ImageURL');
        const desc = this.getVal(item, 'Description');

        if (!img) return; // Skip if no image

        const card = document.createElement('div');
        card.className = `retro-card reveal artwork-card reveal-delay-${(index % 4) + 1}`;
        card.innerHTML = `
          <div class="artwork-frame">
            <img src="${img}" alt="${title}" loading="lazy">
          </div>
          <div class="artwork-info">
            <h4 class="artwork-title">${title || 'Untitled'}</h4>
            <p class="artwork-desc">${desc || ''}</p>
          </div>
        `;
        container.appendChild(card);
      });
    }
  }

  // --- 1. Audio Management (Persistent) ---
  class RetroAudioManager {
    constructor() {
      const savedMute = localStorage.getItem('bonna_muted');
      this.isMuted = savedMute === null ? true : savedMute === 'true';
      
      // BGM - Persistent
      this.bgm = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
      this.bgm.loop = true;
      this.bgm.volume = 0.3;
      
      // SFX
      this.sfxHover = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-classic-click-1117.mp3');
      this.sfxClick = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-digital-quick-click-2307.mp3');
      this.sfxHover.volume = 0.15;
      this.sfxClick.volume = 0.25;

      this.init();
    }

    init() {
      // First interaction to start audio (browser policy)
      document.body.addEventListener('click', () => {
        if (!this.isMuted && this.bgm.paused) {
          this.bgm.play().catch(() => {});
        }
      }, { once: true });
      
      this.attachUIListeners();
    }

    // Call this whenever page content changes
    attachUIListeners() {
      const toggleBtn = document.getElementById('sound-toggle');
      if (toggleBtn) {
        // Remove old listeners to avoid duplicates if any
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
        
        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });
        this.updateUI(newBtn);
      }

      const interactive = document.querySelectorAll('.cta-btn, .social-icon, .back-home-btn, .fandom-tag, .game-chip');
      interactive.forEach(el => {
        el.addEventListener('mouseenter', () => this.playSFX(this.sfxHover));
        el.addEventListener('mouseup', () => this.playSFX(this.sfxClick));
      });
    }

    toggle() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('bonna_muted', this.isMuted);
      const btn = document.getElementById('sound-toggle');
      this.updateUI(btn);
      
      if (this.isMuted) {
        this.bgm.pause();
      } else {
        this.bgm.play().catch(() => {});
      }
    }

    updateUI(btn) {
      if (!btn) return;
      const icon = btn.querySelector('i');
      if (this.isMuted) {
        icon.className = 'fa-solid fa-volume-xmark';
        btn.classList.remove('on');
      } else {
        icon.className = 'fa-solid fa-volume-high';
        btn.classList.add('on');
      }
    }

    playSFX(audio) {
      if (!this.isMuted) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    }
  }

  // --- 2. Modular Visual Effects ---
  const visualEffects = {
    initReveal() {
      if (prefersReducedMotion) return;
      const revealElements = document.querySelectorAll('.reveal');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      revealElements.forEach(el => observer.observe(el));
    },

    initStaggers() {
      const stagger = (selector, parentSelector) => {
        const parent = document.querySelector(parentSelector);
        if (!parent) return;
        const items = parent.querySelectorAll(selector);
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              items.forEach((item, index) => {
                if (prefersReducedMotion) {
                  item.style.opacity = '1';
                  item.style.transform = 'none';
                } else {
                  item.style.opacity = '0';
                  item.style.transform = 'translateY(10px)';
                  item.style.transition = `opacity 0.4s ease ${index * 0.05}s, transform 0.4s ease ${index * 0.05}s`;
                  setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, 50);
                }
              });
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        observer.observe(parent);
      };
      stagger('.about-tag', '.about-list');
      stagger('.draw-item', '.draw-grid');
      stagger('.fandom-tag', '.fandom-tags');
      stagger('.tool-item', '.tools-grid');
      stagger('.game-chip', '.niche-games');
    },

    typewriterTimeout: null,

    initTypewriter() {
      const tagline = document.querySelector('.site-tagline');
      if (!tagline) return;
      
      // Stop any existing typewriter animation
      if (this.typewriterTimeout) {
        clearTimeout(this.typewriterTimeout);
      }

      if (prefersReducedMotion) {
        tagline.style.visibility = 'visible';
        return;
      }
      
      // Use dynamic text if available
      const text = tagline.getAttribute('data-full-text') || tagline.textContent;
      
      tagline.innerHTML = '<span class="typewriter-text"></span><span class="typewriter-cursor" style="color:var(--clr-coral); font-weight:bold;">_</span>';
      tagline.style.visibility = 'visible';
      const textSpan = tagline.querySelector('.typewriter-text');
      let charIndex = 0;
      
      const type = () => {
        if (charIndex < text.length) {
          textSpan.textContent += text.charAt(charIndex);
          charIndex++;
          this.typewriterTimeout = setTimeout(type, 45);
        } else {
          this.typewriterTimeout = null;
        }
      };
      
      // Initial delay - start faster on first load
      this.typewriterTimeout = setTimeout(type, 400);
    },

    initRetroCards() {
      if (prefersReducedMotion) return;
      const cards = document.querySelectorAll('.retro-card');
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const baseScale = 4;
          const dimensionFactor = Math.min(1, 500 / Math.max(rect.width, rect.height));
          const dynamicScale = baseScale * dimensionFactor;
          const rotateX = ((y - centerY) / centerY) * -dynamicScale;
          const rotateY = ((x - centerX) / centerX) * dynamicScale;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`;
          card.style.transition = 'none';
          card.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2 + 5}px 0px var(--retro-shadow)`;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translate(-2px, -2px)';
          card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
          card.style.boxShadow = '8px 8px 0px var(--retro-shadow)';
        });
      });
    },

    initMascots() {
      const mascotImg = document.querySelector('.mascot-img');
      if (mascotImg) {
        mascotImg.addEventListener('click', () => createConfetti());
      }
    }
  };

  // --- 3. Content Switcher (SPA Engine) ---
  const dataManager = new DataManager(API_URL);
  const audioManager = new RetroAudioManager();

  const loadPage = async (url) => {
    const overlay = document.querySelector('.page-transition-overlay');
    if (overlay) {
      overlay.style.display = 'block';
      overlay.classList.remove('exit');
      overlay.classList.add('active');
    }

    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newContent = doc.getElementById('main-content').innerHTML;
      const newTitle = doc.title;

      // Small delay to let overlay reach 0
      setTimeout(() => {
        document.getElementById('main-content').innerHTML = newContent;
        document.title = newTitle;
        window.scrollTo(0, 0);

        // Re-run all effects
        reinitAll();
        
        // Finalize transition
        if (overlay) {
          overlay.classList.add('exit');
          overlay.classList.remove('active');
          setTimeout(() => { overlay.style.display = 'none'; }, 700);
        }
      }, 600);
    } catch (err) {
      console.error('Failed to load page:', err);
      window.location.href = url; // Fallback
    }
  };

  const reinitAll = () => {
    // Re-inject dynamic data if already cached
    if (dataManager.cache) dataManager.injectAll(dataManager.cache);

    visualEffects.initReveal();
    visualEffects.initStaggers();
    visualEffects.initTypewriter();
    visualEffects.initRetroCards();
    visualEffects.initMascots();
    audioManager.attachUIListeners();
  };

  // Global Link Interceptor
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    const isInternal = href && !href.startsWith('http') && !href.startsWith('#') && !href.includes('mailto:');
    if (isInternal) {
      e.preventDefault();
      const targetUrl = link.href;
      history.pushState(null, '', targetUrl);
      loadPage(targetUrl);
    }
  });

  // Handle Back/Forward
  window.addEventListener('popstate', () => {
    loadPage(window.location.href);
  });

  // --- 4. Initialization (First Run) ---
  
  // Preloader & First entry
  const preloader = document.querySelector('.preloader');
  const hidePreloader = () => { if (preloader) preloader.classList.add('hidden'); };
  
  // Initialize App (Data First)
  const initApp = async () => {
    // Hide old text immediately while we fetch
    const tagline = document.querySelector('.site-tagline');
    if (tagline) tagline.textContent = '';

    const data = await dataManager.fetchData();
    dataManager.injectAll(data);
    
    // Hide preloader faster after data is ready
    setTimeout(hidePreloader, 600);
    reinitAll();
  };

  if (document.readyState === 'complete') {
    initApp();
  } else {
    window.addEventListener('load', initApp);
    setTimeout(initApp, 4000); // Fail-safe
  }

  // Shared Static Visuals (Scroll listeners only added once)
  if (!prefersReducedMotion) {
    // Parallax Background
    const l1 = document.querySelector('.parallax-layer-1');
    const l2 = document.querySelector('.parallax-layer-2');
    const l3 = document.querySelector('.parallax-layer-3');
    if (l1 && l2 && l3) {
      const stars = (d) => {
        let s = [];
        for(let i=0; i<d; i++) s.push(`${Math.floor(Math.random()*2000)}px ${Math.floor(Math.random()*2000)}px ${Math.random()>0.8?'var(--clr-gold-soft)':'var(--clr-light-peach)'}`);
        return s.join(', ');
      };
      l1.style.boxShadow = stars(100); l2.style.boxShadow = stars(200); l3.style.boxShadow = stars(300);
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        l1.style.transform = `translateY(${y * 0.5}px)`;
        l2.style.transform = `translateY(${y * 0.3}px)`;
        l3.style.transform = `translateY(${y * 0.15}px)`;
      }, { passive: true });
    }

    // Mascot Parallax Variable (Delegated Scroll)
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const center = vh / 2;
      document.querySelectorAll('.mascot-parallax').forEach(layer => {
        const rect = layer.getBoundingClientRect();
        const rel = rect.top + rect.height/2 - center;
        layer.style.setProperty('--scroll-y', `${rel * 0.05}px`);
        layer.style.setProperty('--scroll-rotate', `${Math.sin(y * 0.005) * 3}deg`);
      });
    }, { passive: true });

    // Scroll Progress
    const progress = document.querySelector('.scroll-progress');
    if (progress) {
      window.addEventListener('scroll', () => {
        const root = document.documentElement;
        const scrollable = root.scrollHeight - root.clientHeight;
        const pct = scrollable <= 0 ? 0 : (root.scrollTop / scrollable) * 100;
        progress.style.width = `${Math.min(100, pct)}%`;
      }, { passive: true });
    }

    // Sparkle Trail
    if (window.matchMedia('(pointer: fine)').matches) {
      const sparkles = [];
      for (let i = 0; i < 8; i++) {
        const s = document.createElement('div');
        s.classList.add('cursor-sparkle');
        document.body.appendChild(s);
        sparkles.push({ el: s, x: 0, y: 0, tx: 0, ty: 0 });
      }
      let mx = 0, my = 0, moving = false, t;
      document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY; moving = true;
        clearTimeout(t); t = setTimeout(() => moving = false, 100);
      });
      const anim = () => {
        sparkles.forEach((s, i) => {
          s.tx = mx; s.ty = my;
          s.x += (s.tx - s.x) / ((i+1)*3);
          s.y += (s.ty - s.y) / ((i+1)*3);
          s.el.style.left = `${s.x}px`; s.el.style.top = `${s.y}px`;
          s.el.style.opacity = moving ? (1 - i/8) * 0.6 : 0;
          s.el.style.transform = `scale(${1 - i/8})`;
        });
        requestAnimationFrame(anim);
      };
      anim();
    }
  }

  // Floating particles
  const bg = document.querySelector('.page-background');
  if (bg && !prefersReducedMotion) {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        p.classList.add('floating-particle');
        p.style.cssText = `width:${Math.random()*4+2}px; height:${Math.random()*4+2}px; left:${Math.random()*100}vw; animation-duration:${Math.random()*10+10}s;`;
        bg.appendChild(p);
      }, i * 800);
    }
  }

  // Ripple effect
  document.body.addEventListener('click', (e) => {
    const host = e.target.closest('.cta-btn, .social-icon, .back-home-btn');
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.cssText = `left:${e.clientX - rect.left}px; top:${e.clientY - rect.top}px;`;
    host.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  // Re-run for first time
  reinitAll();
});

// Helper for confetti
function createConfetti() {
  const colors = ['#ffd700', '#e8725a', '#f5b890', '#f7c5c5', '#8b2252', '#fcd5c0'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    const size = Math.random() * 8 + 4;
    c.style.cssText = `position:absolute; width:${size}px; height:${size}px; background:${colors[Math.floor(Math.random()*colors.length)]}; left:${50+(Math.random()-0.5)*30}%; top:30%; border-radius:${Math.random()>0.5?'50%':'2px'}; animation:confettiFall ${Math.random()*1.5+1}s ease-out ${Math.random()*0.3}s forwards; --drift-x:${(Math.random()-0.5)*180}px; --rotation:${Math.random()*720}deg;`;
    container.appendChild(c);
  }
  if (!document.getElementById('confetti-style')) {
    const s = document.createElement('style');
    s.id = 'confetti-style';
    s.textContent = '.site-tagline { font-family: var(--font-retro); font-size: clamp(1rem, 2.5vw, 1.2rem); color: var(--clr-light-peach); max-width: 500px; margin: 0 auto var(--space-xl); line-height: 1.3; text-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: color var(--transition-smooth), transform var(--transition-smooth); user-select: none; min-height: 3.2em; } @keyframes confettiFall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(60vh) translateX(var(--drift-x)) rotate(var(--rotation)); opacity: 0; } }';
    document.head.appendChild(s);
  }
  setTimeout(() => container.remove(), 3000);
}
