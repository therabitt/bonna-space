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
    
    // Re-initialize page-specific managers
    // Gallery Manager - only on gallery page
    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) {
      new GalleryManager(dataManager);
    }
    
    // Commission Preview Manager - only on commission page
    const commissionPreviewGrid = document.getElementById('commission-preview-grid');
    if (commissionPreviewGrid) {
      new CommissionPreviewManager(dataManager);
    }
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

  // --- 5. Gallery Page Management ---
  class GalleryManager {
    constructor(dataManager) {
      this.dataManager = dataManager;
      this.itemsPerPage = 6;
      this.currentPage = 1;
      this.allGalleryItems = [];
      this.filteredItems = [];
      this.currentFilter = 'all';
      this.currentLightboxIndex = 0;
      
      this.elements = {
        grid: document.getElementById('gallery-grid'),
        filtersContainer: document.getElementById('gallery-filters-dynamic'),
        loadMoreBtn: document.getElementById('gallery-load-more'),
        noResults: document.getElementById('gallery-no-results'),
        lightbox: document.getElementById('gallery-lightbox'),
        lightboxImage: document.getElementById('lightbox-image'),
        lightboxTitle: document.getElementById('lightbox-title'),
        lightboxType: document.getElementById('lightbox-type'),
        lightboxDesc: document.getElementById('lightbox-desc'),
        filterButtons: document.querySelectorAll('.gallery-filter-btn')
      };
      
      if (this.elements.grid) {
        this.init();
      }
    }
    
    init() {
      this.setupEventListeners();
      this.setupLightboxListeners();
      
      // Check if data is already available
      if (this.dataManager.cache) {
        this.loadGalleryData();
        return;
      }
      
      // Wait for data to be loaded
      const checkData = setInterval(() => {
        if (this.dataManager.cache) {
          clearInterval(checkData);
          this.loadGalleryData();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkData), 10000);
    }
    
    setupEventListeners() {
      // Filter buttons
      if (this.elements.filterButtons) {
        this.elements.filterButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            this.setFilter(filter);
          });
        });
      }
      
      // Load more button
      if (this.elements.loadMoreBtn) {
        this.elements.loadMoreBtn.addEventListener('click', () => this.loadMore());
      }
    }
    
    setupLightboxListeners() {
      if (!this.elements.lightbox) return;
      
      // Close on backdrop click
      this.elements.lightbox.querySelector('.gallery-lightbox-backdrop').addEventListener('click', () => {
        this.closeLightbox();
      });
      
      // Close button
      this.elements.lightbox.querySelector('.gallery-lightbox-close').addEventListener('click', () => {
        this.closeLightbox();
      });
      
      // Navigation
      this.elements.lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', () => {
        this.navigateLightbox(-1);
      });
      
      this.elements.lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', () => {
        this.navigateLightbox(1);
      });
      
      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.elements.lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
        if (e.key === 'ArrowRight') this.navigateLightbox(1);
      });
    }
    
    loadGalleryData() {
      const data = this.dataManager.cache;
      if (!data) return;
      
      // Get gallery data (support both Showcase and Gallery)
      this.allGalleryItems = data.Gallery || data.Showcase || [];
      
      // Sort by Order (if available)
      this.allGalleryItems.sort((a, b) => {
        const orderA = parseInt(this.getVal(a, 'Order')) || 0;
        const orderB = parseInt(this.getVal(b, 'Order')) || 0;
        return orderA - orderB;
      });
      
      this.filteredItems = [...this.allGalleryItems];
      
      // Generate dynamic filters
      this.generateFilters();
      
      // Initial render
      this.renderGallery();
    }
    
    generateFilters() {
      if (!this.elements.filtersContainer) return;
      
      // Get unique types from gallery items
      const types = new Set();
      this.allGalleryItems.forEach(item => {
        const type = this.getVal(item, 'Type');
        if (type) types.add(type);
      });
      
      // Get types from Prices sheet as fallback
      if (types.size === 0 && this.dataManager.cache?.Prices) {
        this.dataManager.cache.Prices.forEach(p => {
          if (p.Type) types.add(p.Type);
        });
      }
      
      // Create filter buttons
      this.elements.filtersContainer.innerHTML = '';
      
      Array.from(types).sort().forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'gallery-filter-btn';
        btn.dataset.filter = type.toLowerCase();
        btn.innerHTML = `<i class="fa-solid fa-filter"></i> ${type}`;
        btn.addEventListener('click', () => this.setFilter(type.toLowerCase()));
        this.elements.filtersContainer.appendChild(btn);
      });
    }
    
    setFilter(filter) {
      this.currentFilter = filter;
      this.currentPage = 1;
      
      // Update active state on buttons
      document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
      
      // Filter items
      if (filter === 'all') {
        this.filteredItems = [...this.allGalleryItems];
      } else {
        this.filteredItems = this.allGalleryItems.filter(item => {
          const itemType = this.getVal(item, 'Type')?.toLowerCase() || '';
          return itemType === filter;
        });
      }
      
      this.renderGallery();
    }
    
    renderGallery() {
      if (!this.elements.grid) return;
      
      // Show no results if empty
      if (this.filteredItems.length === 0) {
        this.elements.grid.innerHTML = '';
        this.elements.noResults.style.display = 'block';
        this.elements.loadMoreBtn.style.display = 'none';
        return;
      }
      
      this.elements.noResults.style.display = 'none';
      
      // Get items to show
      const endIndex = this.currentPage * this.itemsPerPage;
      const itemsToShow = this.filteredItems.slice(0, endIndex);
      
      // Render items
      this.elements.grid.innerHTML = itemsToShow.map((item, index) => {
        const title = this.getVal(item, 'Title') || 'Untitled';
        const imageUrl = this.getVal(item, 'ImageURL');
        const type = this.getVal(item, 'Type') || 'Artwork';
        const desc = this.getVal(item, 'Description') || '';
        
        if (!imageUrl) return '';
        
        return `
          <div class="gallery-item reveal" data-index="${index}" data-title="${this.escapeHtml(title)}" data-type="${this.escapeHtml(type)}" data-desc="${this.escapeHtml(desc)}" data-image="${this.escapeHtml(imageUrl)}">
            <img src="${imageUrl}" alt="${this.escapeHtml(title)}" class="gallery-item-image" loading="lazy">
            <div class="gallery-item-overlay">
              <h4 class="gallery-item-title">${this.escapeHtml(title)}</h4>
              <span class="gallery-item-type">${this.escapeHtml(type)}</span>
            </div>
          </div>
        `;
      }).join('');
      
      // Add click handlers
      this.elements.grid.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          this.openLightbox(index);
        });
      });
      
      // Show/hide load more button
      const hasMore = endIndex < this.filteredItems.length;
      this.elements.loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
      this.elements.loadMoreBtn.classList.remove('loading');
      this.elements.loadMoreBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i><span>Load More</span>';
      
      // Re-trigger reveal animations
      if (typeof visualEffects !== 'undefined' && visualEffects.initReveal) {
        visualEffects.initReveal();
      }
    }
    
    loadMore() {
      this.elements.loadMoreBtn.classList.add('loading');
      this.elements.loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner"></i><span>Loading...</span>';
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        this.currentPage++;
        this.renderGallery();
      }, 500);
    }
    
    openLightbox(index) {
      this.currentLightboxIndex = index;
      this.updateLightboxContent();
      
      this.elements.lightbox.classList.add('active');
      this.elements.lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    
    closeLightbox() {
      this.elements.lightbox.classList.remove('active');
      this.elements.lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    
    navigateLightbox(direction) {
      const newIndex = this.currentLightboxIndex + direction;
      
      if (newIndex < 0 || newIndex >= this.filteredItems.length) return;
      
      this.currentLightboxIndex = newIndex;
      this.updateLightboxContent();
    }
    
    updateLightboxContent() {
      const item = this.filteredItems[this.currentLightboxIndex];
      if (!item) return;
      
      const title = this.getVal(item, 'Title') || 'Untitled';
      const imageUrl = this.getVal(item, 'ImageURL');
      const type = this.getVal(item, 'Type') || 'Artwork';
      const desc = this.getVal(item, 'Description') || '';
      
      // Show loading state
      this.elements.lightboxImage.classList.remove('loaded');
      this.elements.lightboxImage.src = imageUrl;
      
      // Update info
      this.elements.lightboxTitle.textContent = title;
      this.elements.lightboxType.textContent = type;
      this.elements.lightboxDesc.textContent = desc;
      
      // Handle image load
      this.elements.lightboxImage.onload = () => {
        this.elements.lightboxImage.classList.add('loaded');
      };
      
      // Update navigation buttons visibility
      const prevBtn = this.elements.lightbox.querySelector('.gallery-lightbox-prev');
      const nextBtn = this.elements.lightbox.querySelector('.gallery-lightbox-next');
      
      prevBtn.style.visibility = this.currentLightboxIndex > 0 ? 'visible' : 'hidden';
      nextBtn.style.visibility = this.currentLightboxIndex < this.filteredItems.length - 1 ? 'visible' : 'hidden';
    }
    
    getVal(obj, key) {
      if (!obj) return '';
      const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
      const actualKey = Object.keys(obj).find(k => k.toLowerCase().replace(/[\s_]/g, '') === normalizedKey);
      return actualKey ? obj[actualKey] : '';
    }
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }
  
  // --- 6. Commission Preview Manager ---
  class CommissionPreviewManager {
    constructor(dataManager) {
      this.dataManager = dataManager;
      this.container = document.getElementById('commission-preview-grid');
      
      if (this.container) {
        this.init();
      }
    }
    
    init() {
      // Check if data is already available
      if (this.dataManager.cache) {
        this.loadCommissionPreviews();
        return;
      }
      
      // Wait for data to be loaded
      const checkData = setInterval(() => {
        if (this.dataManager.cache) {
          clearInterval(checkData);
          this.loadCommissionPreviews();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkData), 10000);
    }
    
    loadCommissionPreviews() {
      const data = this.dataManager.cache;
      if (!data) return;
      
      // Get commission types data (from CommissionTypes sheet or fallback to Prices)
      let commissionTypes = data.CommissionTypes;
      
      // Fallback: Generate from Prices if CommissionTypes doesn't exist
      if (!commissionTypes && data.Prices) {
        const uniqueTypes = [...new Set(data.Prices.map(p => p.Category))];
        commissionTypes = uniqueTypes.map((type, index) => ({
          Type: type,
          SampleImage: '',
          Description: this.getDefaultDescription(type),
          DisplayOrder: index + 1
        }));
      }
      
      if (!commissionTypes || commissionTypes.length === 0) {
        this.container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No commission samples available yet.</p>';
        return;
      }
      
      // Sort by DisplayOrder
      commissionTypes.sort((a, b) => {
        const orderA = parseInt(this.getVal(a, 'DisplayOrder')) || 0;
        const orderB = parseInt(this.getVal(b, 'DisplayOrder')) || 0;
        return orderA - orderB;
      });
      
      // Get prices for each type
      const prices = data.Prices || [];
      
      // Render preview cards
      this.container.innerHTML = commissionTypes.map(type => {
        const typeName = this.getVal(type, 'Type');
        const sampleImage = this.getVal(type, 'SampleImage');
        const description = this.getVal(type, 'Description') || this.getDefaultDescription(typeName);
        
        // Find price for this type
        const typePrice = prices.find(p => p.Category === typeName);
        const priceDisplay = typePrice ? `From $${typePrice.PriceUSD} / Rp${typePrice.PriceIDR}` : 'Contact for pricing';
        
        return `
          <div class="commission-preview-card reveal" data-type="${this.escapeHtml(typeName)}" onclick="window.location.href='#dynamic-prices-container'">
            <div class="commission-preview-image-container">
              ${sampleImage ? 
                `<img src="${sampleImage}" alt="${this.escapeHtml(typeName)} sample" class="commission-preview-image" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'commission-preview-image-placeholder\\'>${this.escapeHtml(typeName)}<br>Sample<br>Coming Soon</div>'">` : 
                `<div class="commission-preview-image-placeholder">${this.escapeHtml(typeName)}<br>Sample<br>Coming Soon</div>`
              }
            </div>
            <div class="commission-preview-info">
              <h4 class="commission-preview-type">${this.escapeHtml(typeName)}</h4>
              <p class="commission-preview-desc">${this.escapeHtml(description)}</p>
              <div class="commission-preview-price">${priceDisplay}</div>
            </div>
          </div>
        `;
      }).join('');
      
      // Re-trigger reveal animations
      if (typeof visualEffects !== 'undefined' && visualEffects.initReveal) {
        visualEffects.initReveal();
      }
    }
    
    getDefaultDescription(type) {
      const descriptions = {
        'Chibi': 'Cute chibi characters with big heads and tiny bodies',
        'Close Up': 'Portrait style focusing on face and expression',
        'Half Body': 'Upper body with some pose and details',
        'Full Body': 'Complete character from head to toe',
        'Scene': 'Full scene with background and environment'
      };
      return descriptions[type] || 'Commission artwork';
    }
    
    getVal(obj, key) {
      if (!obj) return '';
      const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
      const actualKey = Object.keys(obj).find(k => k.toLowerCase().replace(/[\s_]/g, '') === normalizedKey);
      return actualKey ? obj[actualKey] : '';
    }
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Re-run for first time - this will initialize managers based on current page
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
