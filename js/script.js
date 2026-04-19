/* ============================================
   BONNA - Portfolio Redesign
   JavaScript: Animations & Interactivity (SPA Edition)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    initTypewriter() {
      const tagline = document.querySelector('.site-tagline');
      if (!tagline) return;
      if (prefersReducedMotion) {
        tagline.style.visibility = 'visible';
        return;
      }
      const text = tagline.textContent;
      tagline.innerHTML = '<span class="typewriter-text"></span><span class="typewriter-cursor" style="color:var(--clr-coral); font-weight:bold;">_</span>';
      tagline.style.visibility = 'visible';
      const textSpan = tagline.querySelector('.typewriter-text');
      let charIndex = 0;
      const type = () => {
        if (charIndex < text.length) {
          textSpan.textContent += text.charAt(charIndex);
          charIndex++;
          setTimeout(type, 40);
        }
      };
      setTimeout(type, 1000);
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
  
  if (document.readyState === 'complete') {
    setTimeout(hidePreloader, 800);
  } else {
    window.addEventListener('load', () => setTimeout(hidePreloader, 800));
    setTimeout(hidePreloader, 3000); // Fail-safe
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
    s.textContent = '@keyframes confettiFall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(60vh) translateX(var(--drift-x)) rotate(var(--rotation)); opacity: 0; } }';
    document.head.appendChild(s);
  }
  setTimeout(() => container.remove(), 3000);
}
