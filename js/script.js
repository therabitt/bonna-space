/* ============================================
   BONNA - Portfolio Redesign
   JavaScript: Animations & Interactivity (SPA Edition)
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const API_URL =
    "https://script.google.com/macros/s/AKfycbxY6ITbRNFv8FyuTp_DLkcoT_0Tx1cSau3yjimbo2riZ_gNP9u21Oh0xzkcYPiWPObh/exec";

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
        console.log("✨ Data Synced:", this.cache);
        return this.cache;
      } catch (err) {
        console.error("❌ Data Sync Failed:", err);
        return null;
      }
    }

    injectAll(data) {
      if (!data) return;

      // 1. Inject Profile Data
      if (data.Profile) {
        data.Profile.forEach((item) => {
          const rawKey = (item.Key || "").toString();
          const k = rawKey.toLowerCase().replace(/[\s_]/g, "");
          const el = document.getElementById(`field-${rawKey}`);

          if (el || k === "abouttext" || k === "commissionstatus") {
            if (k === "tagline") {
              const val = item.Value || "";
              el.setAttribute("data-full-text", val);
              if (el) el.textContent = "";
            } else if (k === "abouttext") {
              // Convert multi-line bio into Tags
              const tagContainer =
                document.getElementById("dynamic-about-tags");
              if (tagContainer) {
                const lines = (item.Value || "")
                  .split("\n")
                  .filter((l) => l.trim() !== "");
                if (lines.length > 0) {
                  tagContainer.innerHTML = ""; // Clear default tags
                  lines.forEach((line) => {
                    const li = document.createElement("li");
                    li.className = "about-tag reveal";
                    const emojiMatch = line.match(
                      /^(\ud83c[\udf00-\uffff]|\ud83d[\udc00-\ude4f\ude80-\udeff]|\ud83e[\udd00-\uddff]|[\u2600-\u27bf])\s*/,
                    );
                    if (emojiMatch) {
                      const emoji = emojiMatch[0];
                      const text = line.replace(emoji, "");
                      li.innerHTML = `<span class="tag-emoji">${emoji}</span> ${text}`;
                    } else {
                      li.textContent = line;
                    }
                    tagContainer.appendChild(li);
                  });
                }
              }
              // Force clear the paragraph text to prevent "double" content
              const pBio = document.getElementById("field-about_text");
              if (pBio) pBio.textContent = "";
            } else if (k === "commissionstatus") {
              const statusEl = document.getElementById(
                "field-commission_status",
              );
              if (statusEl) {
                const status = (item.Value || "open").toLowerCase().trim();
                const validStatuses = ["open", "closed", "waitlist"];
                const safeStatus = validStatuses.includes(status)
                  ? status
                  : "open";
                const labels = {
                  open: "OPEN",
                  closed: "CLOSED",
                  waitlist: "WAITLIST",
                };
                statusEl.innerHTML = `<span class="commission-status-badge status-${safeStatus}">${labels[safeStatus]}</span>`;
              }
            } else if (el) {
              el.textContent = item.Value || "";
            }
          }
        });
      }

      // 2. Inject Prices (Commission Page)
      const priceContainer = document.getElementById(
        "dynamic-prices-container",
      );
      if (priceContainer && data.Prices) {
        this.renderPrices(data.Prices, priceContainer);
      }

      // 3. Inject Gallery Preview (Index Page)
      const galleryPreviewContainer = document.getElementById(
        "dynamic-gallery-preview",
      );
      if (galleryPreviewContainer && (data.Gallery || data.Showcase)) {
        this.renderGalleryPreview(data.Gallery || data.Showcase, galleryPreviewContainer);
      }
    }

    renderGalleryPreview(items, container) {
      container.innerHTML = "";
      const previewItems = items.slice(0, 3);

      if (previewItems.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; font-family: var(--font-pixel); font-size: 0.5rem; color: var(--clr-coral);'>No memories found yet.</p>";
        return;
      }

      previewItems.forEach((item, index) => {
        const title = BonnaUtils.escapeHtml(BonnaUtils.getVal(item, "Title") || "Artwork");
        const imgUrl = BonnaUtils.getVal(item, "ImageURL");

        const div = document.createElement("a");
        div.href = "gallery.html";
        div.className = `gallery-preview-item reveal reveal-delay-${index}`;
        div.setAttribute("aria-label", `View ${title} in gallery`);
        div.innerHTML = `<div class="gallery-preview-bg" style="background-image: url('${imgUrl}')" title="${title}"></div>`;
        container.appendChild(div);
      });
    }

    renderPrices(prices, container) {
      container.innerHTML = ""; // Clear placeholders

      // Group by Category
      const groups = {};
      prices.forEach((p) => {
        if (!groups[p.Category]) groups[p.Category] = [];
        groups[p.Category].push(p);
      });

      for (const [category, items] of Object.entries(groups)) {
        const section = document.createElement("div");
        section.className = "price-category-group reveal";
        section.innerHTML = `
          <h4 class="category-title">${category}</h4>
          <div class="retro-table-wrapper">
            <table class="retro-table">
              <thead><tr><th>TYPES</th><th>USD</th><th>IDR</th></tr></thead>
              <tbody>
                ${items.map((p) => `<tr><td>${p.Type}</td><td>$${p.PriceUSD}</td><td>${p.PriceIDR}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        `;
        container.appendChild(section);
      }
    }
  }

  // --- 1. Audio Management (Persistent) ---
  class RetroAudioManager {
    constructor() {
      const savedMute = localStorage.getItem("bonna_muted");
      this.isMuted = savedMute === null ? true : savedMute === "true";

      // BGM - Persistent
      this.bgm = new Audio(
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      );
      this.bgm.loop = true;
      this.bgm.volume = 0.3;

      // SFX
      this.sfxHover = new Audio(
        "https://assets.mixkit.co/sfx/preview/mixkit-classic-click-1117.mp3",
      );
      this.sfxClick = new Audio(
        "https://assets.mixkit.co/sfx/preview/mixkit-digital-quick-click-2307.mp3",
      );
      this.sfxHover.volume = 0.15;
      this.sfxClick.volume = 0.25;

      this.init();
    }

    init() {
      // First interaction to start audio (browser policy)
      document.body.addEventListener(
        "click",
        () => {
          if (!this.isMuted && this.bgm.paused) {
            this.bgm.play().catch(() => { });
          }
        },
        { once: true },
      );

      this.attachUIListeners();
    }

    // Call this whenever page content changes
    attachUIListeners() {
      const toggleBtn = document.getElementById("sound-toggle");
      if (toggleBtn) {
        // Remove old listeners to avoid duplicates if any
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

        newBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggle();
        });
        this.updateUI(newBtn);
      }

      const interactive = document.querySelectorAll(
        ".cta-btn, .social-icon, .back-home-btn, .fandom-tag, .game-chip",
      );
      interactive.forEach((el) => {
        el.addEventListener("mouseenter", () => this.playSFX(this.sfxHover));
        el.addEventListener("mouseup", () => this.playSFX(this.sfxClick));
      });
    }

    toggle() {
      this.isMuted = !this.isMuted;
      localStorage.setItem("bonna_muted", this.isMuted);
      const btn = document.getElementById("sound-toggle");
      this.updateUI(btn);

      if (this.isMuted) {
        this.bgm.pause();
      } else {
        this.bgm.play().catch(() => { });
      }
    }

    updateUI(btn) {
      if (!btn) return;
      const icon = btn.querySelector("i");
      if (this.isMuted) {
        icon.className = "fa-solid fa-volume-xmark";
        btn.classList.remove("on");
      } else {
        icon.className = "fa-solid fa-volume-high";
        btn.classList.add("on");
      }
    }

    playSFX(audio) {
      if (!this.isMuted) {
        audio.currentTime = 0;
        audio.play().catch(() => { });
      }
    }
  }

  // --- 2. Modular Visual Effects ---
  const visualEffects = {
    initReveal() {
      if (prefersReducedMotion) return;
      const revealElements = document.querySelectorAll(".reveal");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
      );
      revealElements.forEach((el) => observer.observe(el));
    },

    initStaggers() {
      const stagger = (selector, parentSelector) => {
        const parent = document.querySelector(parentSelector);
        if (!parent) return;
        const items = parent.querySelectorAll(selector);
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                items.forEach((item, index) => {
                  if (prefersReducedMotion) {
                    item.style.opacity = "1";
                    item.style.transform = "none";
                  } else {
                    item.style.opacity = "0";
                    item.style.transform = "translateY(10px)";
                    item.style.transition = `opacity 0.4s ease ${index * 0.05}s, transform 0.4s ease ${index * 0.05}s`;
                    setTimeout(() => {
                      item.style.opacity = "1";
                      item.style.transform = "translateY(0)";
                    }, 50);
                  }
                });
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.2 },
        );
        observer.observe(parent);
      };
      stagger(".about-tag", ".about-list");
      stagger(".draw-item", ".draw-grid");
      stagger(".fandom-tag", ".fandom-tags");
      stagger(".tool-item", ".tools-grid");
      stagger(".game-chip", ".niche-games");
    },

    typewriterTimeout: null,

    initTypewriter() {
      const tagline = document.querySelector(".site-tagline");
      if (!tagline) return;

      // Stop any existing typewriter animation
      if (this.typewriterTimeout) {
        clearTimeout(this.typewriterTimeout);
      }

      if (prefersReducedMotion) {
        tagline.style.visibility = "visible";
        return;
      }

      // Use dynamic text if available
      const text =
        tagline.getAttribute("data-full-text") || tagline.textContent;

      tagline.innerHTML =
        '<span class="typewriter-text"></span><span class="typewriter-cursor" style="color:var(--clr-coral); font-weight:bold;">_</span>';
      tagline.style.visibility = "visible";
      const textSpan = tagline.querySelector(".typewriter-text");
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
      if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
      const cards = document.querySelectorAll(".retro-card");
      cards.forEach((card) => {
        let rafPending = false;
        let targetX = 0, targetY = 0;

        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          targetX = e.clientX - rect.left;
          targetY = e.clientY - rect.top;

          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const baseScale = 4;
              const dimensionFactor = Math.min(
                1,
                500 / Math.max(rect.width, rect.height),
              );
              const dynamicScale = baseScale * dimensionFactor;
              const rotateX = ((targetY - centerY) / centerY) * -dynamicScale;
              const rotateY = ((targetX - centerX) / centerX) * dynamicScale;
              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`;
              card.style.transition = "none";
              card.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2 + 5}px 0px var(--retro-shadow)`;
              rafPending = false;
            });
          }
        });
        card.addEventListener("mouseleave", () => {
          card.style.transform = "translate(-2px, -2px)";
          card.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
          card.style.boxShadow = "8px 8px 0px var(--retro-shadow)";
        });
      });
    },

    initMascots() {
      const mascotImg = document.querySelector(".mascot-img");
      if (mascotImg) {
        mascotImg.addEventListener("click", () => createConfetti());
      }
    },
  };

  // --- 3. Content Switcher (SPA Engine) ---
  const dataManager = new DataManager(API_URL);
  const audioManager = new RetroAudioManager();

  const loadPage = async (url) => {
    // Close mobile nav if open
    const navLinksEl = document.getElementById("nav-links");
    const navHamburger = document.getElementById("nav-hamburger");
    if (navLinksEl) navLinksEl.classList.remove("open");
    if (navHamburger) {
      navHamburger.classList.remove("open");
      navHamburger.setAttribute("aria-expanded", "false");
    }

    const overlay = document.querySelector(".page-transition-overlay");
    if (overlay) {
      overlay.style.display = "block";
      // Small delay to ensure display:block is applied before adding .active
      setTimeout(() => {
        overlay.classList.add("active");
        overlay.classList.remove("exit");
      }, 10);
    }

    try {
      // Add cache-busting timestamp
      const cacheBustUrl = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
      const response = await fetch(cacheBustUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const newContent = doc.getElementById("main-content").innerHTML;
      const newTitle = doc.title;

      // Small delay to let overlay reach 100%
      setTimeout(() => {
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
          mainContent.innerHTML = newContent;
          document.title = newTitle;
          window.scrollTo(0, 0);

          // Force a small reflow/repaint before re-initializing
          requestAnimationFrame(() => {
            reinitAll();
          });
        }

        // Finalize transition
        if (overlay) {
          overlay.classList.add("exit");
          overlay.classList.remove("active");
          setTimeout(() => {
            overlay.style.display = "none";
          }, BonnaUtils.OVERLAY_HIDE_MS);
        }
      }, BonnaUtils.TRANSITION_MS);
    } catch (err) {
      console.error("Failed to load page:", err);
      window.location.href = url; // Fallback
    }
  };

  // Page-specific manager singletons (prevents memory leaks on SPA navigation)
  let _galleryManager = null;
  let _commissionPreviewManager = null;

  const reinitAll = () => {
    console.log("🔄 Re-initializing page components...");

    // Re-inject dynamic data if already cached
    if (dataManager.cache) dataManager.injectAll(dataManager.cache);

    visualEffects.initReveal();
    visualEffects.initStaggers();
    visualEffects.initTypewriter();
    visualEffects.initRetroCards();
    visualEffects.initMascots();

    // Audio listeners need rebinding to new elements
    if (typeof audioManager !== "undefined") {
      audioManager.attachUIListeners();
    }

    // Gallery Manager — only on gallery page
    const galleryGrid = document.getElementById("gallery-grid");
    if (galleryGrid) {
      if (_galleryManager) _galleryManager.destroy();
      _galleryManager = new GalleryManager(dataManager);
    } else {
      _galleryManager = null;
    }

    // Commission Preview Manager — only on commission page
    const commissionPreviewGrid = document.getElementById(
      "commission-preview-grid",
    );
    if (commissionPreviewGrid) {
      if (_commissionPreviewManager) _commissionPreviewManager.destroy();
      _commissionPreviewManager = new CommissionPreviewManager(dataManager);
    } else {
      _commissionPreviewManager = null;
    }

    updateNavActive();
  };

  const updateNavActive = () => {
    const path = window.location.pathname;
    const links = document.querySelectorAll(".nav-link[data-page]");
    links.forEach((link) => {
      link.classList.remove("active");
      const page = link.dataset.page;
      const isHome =
        page === "index" &&
        (path === "/" || path.endsWith("/") || path.endsWith("index.html"));
      const isMatch = path.endsWith(`${page}.html`);
      if (isHome || isMatch) {
        link.classList.add("active");
      }
    });
  };

  // Global Link Interceptor
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    const isInternal =
      href &&
      !href.startsWith("http") &&
      !href.startsWith("#") &&
      !href.includes("mailto:");
    if (isInternal) {
      e.preventDefault();
      const targetUrl = link.href;
      history.pushState(null, "", targetUrl);
      loadPage(targetUrl);
    }
  });

  // Handle Back/Forward
  window.addEventListener("popstate", () => {
    loadPage(window.location.href);
  });

  // --- 4. Initialization (First Run) ---

  // Preloader & First entry
  const preloader = document.querySelector(".preloader");
  const hidePreloader = () => {
    if (preloader) preloader.classList.add("hidden");
  };

  // Initialize App (Data First)
  const initApp = async () => {
    // Hide old text immediately while we fetch
    const tagline = document.querySelector(".site-tagline");
    if (tagline) tagline.textContent = "";

    await dataManager.fetchData(); // populates dataManager.cache

    setTimeout(hidePreloader, BonnaUtils.TRANSITION_MS);
    reinitAll(); // reinitAll will call injectAll from cache
  };

  let _appInitialized = false;
  const safeInitApp = () => {
    if (_appInitialized) return;
    _appInitialized = true;
    initApp();
  };

  if (document.readyState === "complete") {
    safeInitApp();
  } else {
    window.addEventListener("load", safeInitApp);
    setTimeout(safeInitApp, BonnaUtils.INIT_FAILSAFE_MS);
  }

  // Shared Static Visuals (Scroll listeners optimized & consolidated)
  const isPointerFine = window.matchMedia("(pointer: fine)").matches;
  const siteNav = document.getElementById("site-nav");
  const navLinksList = document.getElementById("nav-links");
  let lastScrollY = window.scrollY;

  // Setup Parallax Background (Desktop Only)
  let l1, l2, l3;
  if (!prefersReducedMotion && isPointerFine) {
    l1 = document.querySelector(".parallax-layer-1");
    l2 = document.querySelector(".parallax-layer-2");
    l3 = document.querySelector(".parallax-layer-3");
    if (l1 && l2 && l3) {
      const stars = (d) => {
        let s = [];
        for (let i = 0; i < d; i++)
          s.push(
            `${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px ${Math.random() > 0.8 ? "var(--clr-gold-soft)" : "var(--clr-light-peach)"}`,
          );
        return s.join(", ");
      };
      l1.style.boxShadow = stars(100);
      l2.style.boxShadow = stars(200);
      l3.style.boxShadow = stars(300);
    }
  }

  // Setup Mascot Parallax & Scroll Progress variables
  const mascotLayers = document.querySelectorAll(".mascot-parallax");
  const progress = document.querySelector(".scroll-progress");

  // Unified RAF Scroll Listener
  let scrollRafId = null;
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollRafId) {
        scrollRafId = requestAnimationFrame(() => {
          const y = window.scrollY;

          // 1. Navbar Toggle (Hide on Scroll Down, Show on Scroll Up)
          if (siteNav) {
            const isNavOpen = navLinksList && navLinksList.classList.contains("open");
            // Only hide if mobile menu is NOT open
            if (!isNavOpen) {
              if (y > lastScrollY && y > 100) {
                siteNav.classList.add("nav-hidden");
              } else {
                siteNav.classList.remove("nav-hidden");
              }
            }
          }
          lastScrollY = y;

          // 2. Stars Parallax (Motion sensitive)
          if (!prefersReducedMotion && isPointerFine && l1 && l2 && l3) {
            l1.style.transform = `translateY(${y * 0.5}px)`;
            l2.style.transform = `translateY(${y * 0.3}px)`;
            l3.style.transform = `translateY(${y * 0.15}px)`;
          }

          // 3. Mascot Parallax (Motion sensitive)
          if (!prefersReducedMotion && mascotLayers.length > 0) {
            const vh = window.innerHeight;
            const center = vh / 2;
            mascotLayers.forEach((layer) => {
              const rect = layer.getBoundingClientRect();
              const rel = rect.top + rect.height / 2 - center;
              layer.style.setProperty("--scroll-y", `${rel * 0.05}px`);
              layer.style.setProperty(
                "--scroll-rotate",
                `${Math.sin(y * 0.005) * 3}deg`,
              );
            });
          }

          // 4. Scroll Progress
          if (progress) {
            const root = document.documentElement;
            const scrollable = root.scrollHeight - root.clientHeight;
            const pct = scrollable <= 0 ? 0 : (root.scrollTop / scrollable) * 100;
            progress.style.width = `${Math.min(100, pct)}%`;
          }

          scrollRafId = null;
        });
      }
    },
    { passive: true }
  );

    // Sparkle Trail (Text-based characters)
    if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
      const chars = ['✦', '·', '☆', '★', '*', '✨'];
      const cols = [
        'var(--clr-coral)',
        'var(--clr-warm-crimson)',
        'var(--clr-salmon)',
        'var(--clr-gold)',
        'var(--clr-gold-soft)'
      ];

      let lastMove = 0;
      document.addEventListener("mousemove", (e) => {
        const now = Date.now();
        // Throttle slightly and use random probability for a balanced, airy trail
        if (now - lastMove > 16 && Math.random() > 0.6) {
          lastMove = now;
          const s = document.createElement("span");
          s.className = "text-sparkle";
          s.textContent = chars[Math.floor(Math.random() * chars.length)];
          s.style.left = (e.clientX + Math.random() * 16 - 8) + "px";
          s.style.top = (e.clientY + Math.random() * 16 - 8) + "px";
          s.style.color = cols[Math.floor(Math.random() * cols.length)];
          s.style.fontSize = (7 + Math.random() * 9) + "px";

          document.body.appendChild(s);
          setTimeout(() => s.remove(), 700);
        }
      }, { passive: true });
    }

  // Floating particles (Desktop only)
  const bg = document.querySelector(".page-background");
  if (bg && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const p = document.createElement("div");
        p.classList.add("floating-particle");
        p.style.cssText = `width:${Math.random() * 4 + 2}px; height:${Math.random() * 4 + 2}px; left:${Math.random() * 100}vw; animation-duration:${Math.random() * 10 + 10}s;`;
        bg.appendChild(p);
      }, i * 800);
    }
  }

  // Ripple effect
  document.body.addEventListener("click", (e) => {
    const host = e.target.closest(".cta-btn, .social-icon, .back-home-btn");
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.cssText = `left:${e.clientX - rect.left}px; top:${e.clientY - rect.top}px;`;
    host.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  // --- Nav Hamburger Toggle (one-time setup, nav is outside #main-content) ---
  const navHamburger = document.getElementById("nav-hamburger");
  const navLinksEl = document.getElementById("nav-links");
  if (navHamburger && navLinksEl) {
    navHamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = navLinksEl.classList.toggle("open");
      navHamburger.classList.toggle("open", isOpen);
      navHamburger.setAttribute("aria-expanded", String(isOpen));
    });

    // Close nav when a link is clicked (mobile)
    navLinksEl.addEventListener("click", (e) => {
      if (e.target.closest(".nav-link")) {
        navLinksEl.classList.remove("open");
        navHamburger.classList.remove("open");
        navHamburger.setAttribute("aria-expanded", "false");
      }
    });

    // Close nav when clicking outside
    document.addEventListener("click", (e) => {
      if (!navHamburger.contains(e.target) && !navLinksEl.contains(e.target)) {
        navLinksEl.classList.remove("open");
        navHamburger.classList.remove("open");
        navHamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // --- Scroll to Top Button ---
  const scrollToTopBtn = document.getElementById("scroll-to-top");
  if (scrollToTopBtn) {
    window.addEventListener(
      "scroll",
      () => {
        scrollToTopBtn.classList.toggle("visible", window.scrollY > 300);
      },
      { passive: true },
    );

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- Anti-Copy Protection ---
  document.addEventListener("contextmenu", (e) => {
    if (e.target.tagName === "IMG" || e.target.classList.contains("gallery-item-image") || e.target.closest(".gallery-lightbox-image")) {
      e.preventDefault();
      return false;
    }
  }, false);

  document.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "IMG") {
      e.preventDefault();
      return false;
    }
  }, false);

  // --- 5. Gallery Page Management ---
  class GalleryManager {
    constructor(dataManager) {
      this._abortController = new AbortController();
      this.dataManager = dataManager;
      this.itemsPerPage = BonnaUtils.ITEMS_PER_LOAD;
      this.currentPage = 1;
      this.allGalleryItems = [];
      this.filteredItems = [];
      this.currentFilter = "all";
      this.currentCategoryFilter = "all";
      this.currentTypeFilter = "all";
      this.currentSort = "most-liked";
      this.currentLightboxIndex = 0;

      this.elements = {
        grid: document.getElementById("gallery-grid"),
        filtersContainer: document.getElementById("gallery-filters-dynamic"),
        categoryFiltersContainer: document.getElementById(
          "gallery-filters-categories",
        ),
        loadMoreBtn: document.getElementById("gallery-load-more"),
        noResults: document.getElementById("gallery-no-results"),
        lightbox: document.getElementById("gallery-lightbox"),
        lightboxImage: document.getElementById("lightbox-image"),
        lightboxTitle: document.getElementById("lightbox-title"),
        lightboxType: document.getElementById("lightbox-type"),
        lightboxDesc: document.getElementById("lightbox-desc"),
        lightboxLikeBtn: document.getElementById("lightbox-like-btn"),
        lightboxLikeCount: document.getElementById("lightbox-like-count"),
        filterButtons: document.querySelectorAll(".gallery-filter-btn"),
        sortButtons: document.querySelectorAll(".gallery-sort-btn"),
        stats: document.getElementById("gallery-stats"),
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
      this._checkDataInterval = setInterval(() => {
        if (this.dataManager.cache) {
          clearInterval(this._checkDataInterval);
          this._checkDataInterval = null;
          this.loadGalleryData();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this._checkDataInterval) {
          clearInterval(this._checkDataInterval);
          this._checkDataInterval = null;
        }
      }, 10000);
    }

    setupEventListeners() {
      // Event delegation for gallery items (fixes iOS double-tap & rebind issues)
      if (this.elements.grid) {
        this.elements.grid.addEventListener("click", (e) => {
          // Like button on card
          const likeBtn = e.target.closest(".gallery-item-like-btn");
          if (likeBtn) {
            e.stopPropagation();
            const id = likeBtn.closest(".gallery-item")?.dataset.id;
            if (id) this.handleLike(id, likeBtn);
            return;
          }

          const item = e.target.closest(".gallery-item");
          if (item) {
            const index = parseInt(item.dataset.index);
            this.openLightbox(index);
          }
        });
      }

      // Filter buttons
      if (this.elements.filterButtons) {
        this.elements.filterButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const filter = e.currentTarget.dataset.filter;
            const kind = e.currentTarget.dataset.filterKind || "type";
            this.setFilter(filter, kind);
          });
        });
      }

      // Sort buttons
      if (this.elements.sortButtons) {
        this.elements.sortButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const sort = e.currentTarget.dataset.sort;
            this.setSort(sort);
          });
        });
      }

      // Load more button
      if (this.elements.loadMoreBtn) {
        this.elements.loadMoreBtn.addEventListener("click", () =>
          this.loadMore(),
        );
      }
    }

    setupLightboxListeners() {
      if (!this.elements.lightbox) return;

      // Close on backdrop click
      this.elements.lightbox
        .querySelector(".gallery-lightbox-backdrop")
        .addEventListener("click", () => {
          this.closeLightbox();
        });

      // Close button
      this.elements.lightbox
        .querySelector(".gallery-lightbox-close")
        .addEventListener("click", () => {
          this.closeLightbox();
        });

      // Navigation
      this.elements.lightbox
        .querySelector(".gallery-lightbox-prev")
        .addEventListener("click", () => {
          this.navigateLightbox(-1);
        });

      this.elements.lightbox
        .querySelector(".gallery-lightbox-next")
        .addEventListener("click", () => {
          this.navigateLightbox(1);
        });

      // Lightbox like button
      if (this.elements.lightboxLikeBtn) {
        this.elements.lightboxLikeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = this.elements.lightboxLikeBtn.dataset.artworkId;
          if (id) this.handleLike(id, this.elements.lightboxLikeBtn, true);
        });
      }

      // Keyboard navigation
      document.addEventListener(
        "keydown",
        (e) => {
          if (!this.elements.lightbox?.classList.contains("active")) return;
          if (e.key === "Escape") this.closeLightbox();
          if (e.key === "ArrowLeft") this.navigateLightbox(-1);
          if (e.key === "ArrowRight") this.navigateLightbox(1);
        },
        { signal: this._abortController.signal },
      );
    }

    loadGalleryData() {
      const data = this.dataManager.cache;
      if (!data) return;

      // Get gallery data (support both Showcase and Gallery)
      this.allGalleryItems = data.Gallery || data.Showcase || [];

      // Reset both filters on fresh data load
      this.currentCategoryFilter = "all";
      this.currentTypeFilter = "all";
      this.currentSort = "most-liked";

      // Apply default sort (Most Liked)
      this.applySort(false);

      // Initialize filtered items
      this.filteredItems = [...this.allGalleryItems];

      // Generate dynamic filters
      this.generateFilters();

      // Initial render
      this.renderGallery();
    }

    generateFilters() {
      this.generateCategoryFilters();
      this.generateTypeFilters();
    }

    generateCategoryFilters() {
      const container = this.elements.categoryFiltersContainer;
      if (!container) return;

      // Always seed from Prices first — every known style is always visible as a filter
      const categories = new Set();
      if (this.dataManager.cache?.Prices) {
        this.dataManager.cache.Prices.forEach((p) => {
          if (p.Category) categories.add(p.Category);
        });
      }

      // Also add any custom categories that exist on gallery items but aren't in Prices
      this.allGalleryItems.forEach((item) => {
        const cat = BonnaUtils.getVal(item, "Category");
        if (cat) categories.add(cat);
      });

      container.innerHTML = "";
      Array.from(categories)
        .sort()
        .forEach((category) => {
          const btn = document.createElement("button");
          btn.className = "gallery-filter-btn";
          btn.dataset.filter = category.toLowerCase();
          btn.dataset.filterKind = "category";
          btn.innerHTML = `<i class="fa-solid fa-palette"></i> ${BonnaUtils.escapeHtml(category)}`;
          btn.addEventListener(
            "click",
            () => this.setFilter(category.toLowerCase(), "category"),
            {
              signal: this._abortController.signal,
            },
          );
          container.appendChild(btn);
        });
    }

    generateTypeFilters() {
      const container = this.elements.filtersContainer;
      if (!container) return;

      // Always seed from CommissionTypes first — this is the authoritative source
      const types = new Set();
      if (this.dataManager.cache?.CommissionTypes) {
        this.dataManager.cache.CommissionTypes.forEach((ct) => {
          const type = BonnaUtils.getVal(ct, "Type");
          if (type) types.add(type);
        });
      }

      // Also include types from Prices sheet (fallback/legacy support)
      if (this.dataManager.cache?.Prices) {
        this.dataManager.cache.Prices.forEach((p) => {
          if (p.Type) types.add(p.Type);
        });
      }

      // Also add any custom types that exist on gallery items but aren't in the above sheets
      this.allGalleryItems.forEach((item) => {
        const type = BonnaUtils.getVal(item, "Type");
        if (type) types.add(type);
      });

      container.innerHTML = "";
      Array.from(types)
        .sort()
        .forEach((type) => {
          const btn = document.createElement("button");
          btn.className = "gallery-filter-btn";
          btn.dataset.filter = type.toLowerCase();
          btn.dataset.filterKind = "type";
          btn.innerHTML = `<i class="fa-solid fa-filter"></i> ${BonnaUtils.escapeHtml(type)}`;
          btn.addEventListener(
            "click",
            () => this.setFilter(type.toLowerCase(), "type"),
            {
              signal: this._abortController.signal,
            },
          );
          container.appendChild(btn);
        });
    }

    setFilter(filter, kind = "type", resetPage = true) {
      if (resetPage) this.currentPage = 1;

      if (kind === "category") {
        this.currentCategoryFilter = filter;

        // Update active state — only touch category row buttons
        document
          .querySelector('[data-filter="all"][data-filter-kind="category"]')
          ?.classList.toggle("active", filter === "all");
        document
          .querySelectorAll(
            '[data-filter-kind="category"]:not([data-filter="all"])',
          )
          .forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.filter === filter);
          });
      } else {
        this.currentTypeFilter = filter;

        // Update active state — only touch type row buttons
        document
          .querySelector('[data-filter="all"][data-filter-kind="type"]')
          ?.classList.toggle("active", filter === "all");
        document
          .querySelectorAll(
            '[data-filter-kind="type"]:not([data-filter="all"])',
          )
          .forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.filter === filter);
          });
      }

      // Apply BOTH active filters simultaneously
      this.filteredItems = this.allGalleryItems.filter((item) => {
        const itemCategory = (BonnaUtils.getVal(item, "Category") || "").toLowerCase();
        const itemType = (BonnaUtils.getVal(item, "Type") || "").toLowerCase();

        const categoryMatch =
          this.currentCategoryFilter === "all" ||
          itemCategory === this.currentCategoryFilter;
        const typeMatch =
          this.currentTypeFilter === "all" ||
          itemType === this.currentTypeFilter;

        return categoryMatch && typeMatch;
      });

      this.renderGallery();
    }

    renderGallery(isLoadMore = false) {
      if (!this.elements.grid) return;

      // Show no results if empty
      if (this.filteredItems.length === 0) {
        this.elements.grid.innerHTML = "";
        this.elements.noResults.style.display = "block";
        this.elements.loadMoreBtn.style.display = "none";
        return;
      }

      this.elements.noResults.style.display = "none";

      // Get items to show
      const startIndex = isLoadMore ? (this.currentPage - 1) * this.itemsPerPage : 0;
      const endIndex = this.currentPage * this.itemsPerPage;
      const itemsToShow = this.filteredItems.slice(startIndex, endIndex);
      const likedIds = this.getLikedIds();

      // Create fragment for better performance
      const html = itemsToShow
        .map((item, index) => {
          const actualIndex = startIndex + index;
          const title = BonnaUtils.getVal(item, "Title") || "Untitled";
          const imageUrl = BonnaUtils.getVal(item, "ImageURL");
          const type = BonnaUtils.getVal(item, "Type") || "Artwork";
          const desc = BonnaUtils.getVal(item, "Description") || "";
          const id = BonnaUtils.getVal(item, "ID") || actualIndex;
          const likes = parseInt(BonnaUtils.getVal(item, "Likes")) || 0;
          const isLiked = likedIds.includes(String(id));

          if (!imageUrl) return "";

          return `
          <div class="gallery-item reveal" data-index="${actualIndex}" data-id="${BonnaUtils.escapeHtml(String(id))}" data-title="${BonnaUtils.escapeHtml(title)}" data-type="${BonnaUtils.escapeHtml(type)}" data-desc="${BonnaUtils.escapeHtml(desc)}" data-image="${BonnaUtils.escapeHtml(imageUrl)}">
            <div class="gallery-item-image-wrapper">
              <img src="${imageUrl}" alt="${BonnaUtils.escapeHtml(title)}" class="gallery-item-image" loading="lazy">
              <div class="gallery-item-overlay">
                <div class="gallery-item-title-tag">${BonnaUtils.escapeHtml(title)}</div>
              </div>
              <div class="gallery-item-like-bar">
                <button class="gallery-item-like-btn ${isLiked ? 'liked' : ''}" data-artwork-id="${BonnaUtils.escapeHtml(String(id))}" aria-label="Like ${BonnaUtils.escapeHtml(title)}">
                  <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <span class="gallery-item-like-count">${likes}</span>
              </div>
            </div>
          </div>
        `;
        })
        .join("");

      if (isLoadMore) {
        this.elements.grid.insertAdjacentHTML("beforeend", html);
      } else {
        this.elements.grid.innerHTML = html;
      }

      // Update stats
      if (this.elements.stats) {
        const count = Math.min(endIndex, this.filteredItems.length);
        this.elements.stats.textContent = `Showing ${count} of ${this.filteredItems.length} Artworks`;
        this.elements.stats.style.display = "block";
      }

      // Show/hide load more button
      const hasMore = endIndex < this.filteredItems.length;
      this.elements.loadMoreBtn.style.display = hasMore
        ? "inline-flex"
        : "none";
      this.elements.loadMoreBtn.classList.remove("loading");
      this.elements.loadMoreBtn.innerHTML =
        '<i class="fa-solid fa-chevron-down"></i><span>Load More</span>';

      // Re-trigger reveal animations
      if (typeof visualEffects !== "undefined" && visualEffects.initReveal) {
        visualEffects.initReveal();
      }
    }

    loadMore() {
      this.elements.loadMoreBtn.classList.add("loading");
      this.elements.loadMoreBtn.innerHTML =
        '<i class="fa-solid fa-spinner"></i><span>Loading...</span>';

      // Simulate loading delay for better UX
      setTimeout(() => {
        this.currentPage++;
        this.renderGallery(true);
      }, 500);
    }

    openLightbox(index) {
      this.currentLightboxIndex = index;
      this.updateLightboxContent();

      this.elements.lightbox.classList.add("active");
      this.elements.lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    closeLightbox() {
      this.elements.lightbox.classList.remove("active");
      this.elements.lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
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

      const title = BonnaUtils.getVal(item, "Title") || "Untitled";
      const imageUrl = BonnaUtils.getVal(item, "ImageURL");
      const type = BonnaUtils.getVal(item, "Type") || "Artwork";
      const desc = BonnaUtils.getVal(item, "Description") || "";
      const id = BonnaUtils.getVal(item, "ID") || this.currentLightboxIndex;
      const likes = parseInt(BonnaUtils.getVal(item, "Likes")) || 0;
      const liked = this.isLiked(id);

      // Show loading state
      this.elements.lightboxImage.classList.remove("loaded");
      this.elements.lightboxImage.src = imageUrl;

      // Update info
      this.elements.lightboxTitle.textContent = title;
      this.elements.lightboxType.textContent = type;
      this.elements.lightboxDesc.textContent = desc;

      // Update like button in lightbox
      if (this.elements.lightboxLikeCount) {
        this.elements.lightboxLikeCount.textContent = likes;
      }
      if (this.elements.lightboxLikeBtn) {
        this.elements.lightboxLikeBtn.dataset.artworkId = String(id);
        this.elements.lightboxLikeBtn.classList.toggle("liked", liked);
        const icon = this.elements.lightboxLikeBtn.querySelector("i");
        if (icon) {
          icon.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        }
      }

      // Handle image load
      this.elements.lightboxImage.onload = () => {
        this.elements.lightboxImage.classList.add("loaded");
      };

      // Update navigation buttons visibility
      const prevBtn = this.elements.lightbox.querySelector(
        ".gallery-lightbox-prev",
      );
      const nextBtn = this.elements.lightbox.querySelector(
        ".gallery-lightbox-next",
      );

      prevBtn.style.visibility =
        this.currentLightboxIndex > 0 ? "visible" : "hidden";
      nextBtn.style.visibility =
        this.currentLightboxIndex < this.filteredItems.length - 1
          ? "visible"
          : "hidden";
    }

    applySort(refilter = true, resetPage = true) {
      const sort = this.currentSort;

      const getDate = (item) => {
        const d = BonnaUtils.getVal(item, "Date");
        if (d) return new Date(d).getTime();
        const o = parseInt(BonnaUtils.getVal(item, "Order")) || 0;
        return o;
      };

      this.allGalleryItems.sort((a, b) => {
        if (sort === "most-liked") {
          const la = parseInt(BonnaUtils.getVal(a, "Likes")) || 0;
          const lb = parseInt(BonnaUtils.getVal(b, "Likes")) || 0;
          if (la !== lb) return lb - la;
          return getDate(b) - getDate(a); // Secondary sort by newest
        }
        if (sort === "newest") {
          const diff = getDate(b) - getDate(a);
          if (diff !== 0) return diff;
          const oa = parseInt(BonnaUtils.getVal(a, "Order")) || 0;
          const ob = parseInt(BonnaUtils.getVal(b, "Order")) || 0;
          return oa - ob;
        }
        if (sort === "oldest") {
          const diff = getDate(a) - getDate(b);
          if (diff !== 0) return diff;
          const oa = parseInt(BonnaUtils.getVal(a, "Order")) || 0;
          const ob = parseInt(BonnaUtils.getVal(b, "Order")) || 0;
          return oa - ob;
        }
        // default
        const oa = parseInt(BonnaUtils.getVal(a, "Order")) || 0;
        const ob = parseInt(BonnaUtils.getVal(b, "Order")) || 0;
        return oa - ob;
      });

      if (refilter) {
        this.setFilter(this.currentCategoryFilter, "category", resetPage);
      }
    }

    setSort(sort) {
      this.currentSort = sort;
      this.currentPage = 1;

      // Update active UI
      document.querySelectorAll(".gallery-sort-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.sort === sort);
      });

      this.applySort(true);
    }

    getLikedIds() {
      try {
        const raw = localStorage.getItem(BonnaUtils.LIKED_ARTWORKS_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    isLiked(id) {
      return this.getLikedIds().includes(String(id));
    }

    async handleLike(id, btnElement, isLightbox = false) {
      const strId = String(id);
      if (this.isLiked(strId)) {
        BonnaUtils.showToast("You already liked this artwork!", "info");
        return;
      }

      const likedIds = this.getLikedIds();
      likedIds.push(strId);
      localStorage.setItem(BonnaUtils.LIKED_ARTWORKS_KEY, JSON.stringify(likedIds));

      const sourceItem = this.allGalleryItems.find(
        (item) => String(BonnaUtils.getVal(item, "ID")) === strId
      );
      
      let newLikesCount = 1;
      if (sourceItem) {
        const currentLikes = parseInt(BonnaUtils.getVal(sourceItem, "Likes")) || 0;
        // Find existing key or use "Likes"
        const likesKey = Object.keys(sourceItem).find(
          (k) => k.toLowerCase().replace(/[\s_]/g, "") === "likes"
        ) || "Likes";
        sourceItem[likesKey] = currentLikes + 1;
        newLikesCount = sourceItem[likesKey];
      }

      // Update grid item visually (if it's in the DOM)
      const gridBtn = document.querySelector(`.gallery-item-like-btn[data-artwork-id="${strId}"]`);
      if (gridBtn) {
        gridBtn.classList.add("liked");
        const icon = gridBtn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-heart";
        const countEl = gridBtn.nextElementSibling;
        if (countEl) countEl.textContent = newLikesCount;
      }

      // Update lightbox visually (if it's open and shows the same artwork)
      if (this.elements.lightboxLikeBtn && this.elements.lightboxLikeBtn.dataset.artworkId === strId) {
        this.elements.lightboxLikeBtn.classList.add("liked");
        const icon = this.elements.lightboxLikeBtn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-heart";
        if (this.elements.lightboxLikeCount) {
          this.elements.lightboxLikeCount.textContent = newLikesCount;
        }
      }

      // Send to backend
      this.sendLikeToSheet(strId);
    }

    sendLikeToSheet(artworkId) {
      try {
        fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "like", artworkId }),
        });
      } catch (err) {
        console.error("Like send failed:", err);
      }
    }

    destroy() {
      this._abortController.abort();
      if (this._checkDataInterval) {
        clearInterval(this._checkDataInterval);
        this._checkDataInterval = null;
      }
    }
  }

  // --- 6. Commission Preview Manager ---
  class CommissionPreviewManager {
    constructor(dataManager) {
      this._abortController = new AbortController();
      this.dataManager = dataManager;
      this.container = document.getElementById("commission-preview-grid");

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

      const prices = data.Prices || [];

      if (prices.length === 0) {
        this.container.innerHTML =
          '<p style="text-align: center; color: var(--text-secondary);">No commission samples available yet.</p>';
        return;
      }

      // Extract unique categories
      const rawCategories = prices.map(item => BonnaUtils.getVal(item, "Category")).filter(c => c);
      const categories = [...new Set(rawCategories)];

      // Render structure
      let html = "";

      // 1. Tabs
      if (categories.length > 0) {
        html += `
          <div class="commission-preview-tabs reveal">
            <button class="commission-tab active" data-category="all">
              <i class="fa-solid fa-border-all"></i> ALL
            </button>
            ${categories.map(cat => `
              <button class="commission-tab" data-category="${cat}">
                ${cat.toUpperCase()}
              </button>
            `).join("")}
          </div>
        `;
      }

      // 2. Scroller Wrapper
      html += `
        <div class="commission-preview-scroller-wrapper reveal">
          <button class="scroller-nav scroller-prev" aria-label="Previous">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          
          <div class="commission-preview-scroller" id="commission-scroller">
            ${prices.map(item => this.renderCard(item)).join("")}
          </div>

          <button class="scroller-nav scroller-next" aria-label="Next">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `;

      this.container.innerHTML = html;

      // Setup Listeners
      this.setupTabs();
      this.setupScroller();

      // Re-trigger reveal animations
      if (typeof visualEffects !== "undefined" && visualEffects.initReveal) {
        visualEffects.initReveal();
      }
    }

    renderCard(item) {
      const category = BonnaUtils.escapeHtml(BonnaUtils.getVal(item, "Category") || "");
      const typeName = BonnaUtils.escapeHtml(BonnaUtils.getVal(item, "Type") || "Artwork");
      const sampleImage = BonnaUtils.getVal(item, "SampleImage");
      const description = BonnaUtils.escapeHtml(
        BonnaUtils.getVal(item, "Description") ||
        BonnaUtils.getDefaultDescription(BonnaUtils.getVal(item, "Type"))
      );
      const priceUSD = BonnaUtils.getVal(item, "PriceUSD");
      const priceIDR = BonnaUtils.getVal(item, "PriceIDR");
      const priceDisplay = priceUSD
        ? `$${priceUSD}` + (priceIDR ? ` / Rp${priceIDR}` : "")
        : "Contact for pricing";

      return `
        <div class="commission-preview-card" data-category="${category}">
          <div class="commission-preview-image-container">
            ${sampleImage
          ? `<img src="${sampleImage}" alt="${typeName} sample" class="commission-preview-image" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'commission-preview-image-placeholder\\'>${typeName}<br>Sample<br>Coming Soon</div>'">`
          : `<div class="commission-preview-image-placeholder">${typeName}<br>Sample<br>Coming Soon</div>`
        }
          </div>
          <div class="commission-preview-info">
            ${category ? `<span class="commission-preview-category">${category}</span>` : ""}
            <h4 class="commission-preview-type">${typeName}</h4>
            <p class="commission-preview-desc">${description}</p>
            <div class="commission-preview-price">${priceDisplay}</div>
          </div>
        </div>
      `;
    }

    setupTabs() {
      const tabs = this.container.querySelectorAll(".commission-tab");
      const scroller = this.container.querySelector(".commission-preview-scroller");
      if (!tabs.length || !scroller) return;

      tabs.forEach(tab => {
        tab.addEventListener("click", () => {
          const category = tab.dataset.category;

          // Update active UI
          tabs.forEach(t => t.classList.remove("active"));
          tab.classList.add("active");

          // Filter with animation
          scroller.style.opacity = "0";

          setTimeout(() => {
            const cards = scroller.querySelectorAll(".commission-preview-card");
            cards.forEach(card => {
              if (category === "all" || card.dataset.category === category) {
                card.style.display = "block";
              } else {
                card.style.display = "none";
              }
            });

            scroller.scrollTo({ left: 0 });
            scroller.style.opacity = "1";
          }, 200);
        });
      });
    }

    setupScroller() {
      const scroller = this.container.querySelector(".commission-preview-scroller");
      const prevBtn = this.container.querySelector(".scroller-prev");
      const nextBtn = this.container.querySelector(".scroller-next");

      if (!scroller || !prevBtn || !nextBtn) return;

      const getScrollAmount = () => {
        const card = scroller.querySelector(".commission-preview-card:not([style*='display: none'])");
        return card ? card.offsetWidth + 24 : 320; // width + gap
      };

      prevBtn.addEventListener("click", () => {
        const { scrollLeft } = scroller;
        if (scrollLeft <= 10) {
          // Loop to end
          scroller.scrollTo({ left: scroller.scrollWidth, behavior: "smooth" });
        } else {
          scroller.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
        }
      });

      nextBtn.addEventListener("click", () => {
        const { scrollLeft, scrollWidth, clientWidth } = scroller;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          // Loop to start
          scroller.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scroller.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
        }
      });

      // Arrows always visible for "infinite" feel
      const updateArrows = () => {
        const { scrollWidth, clientWidth } = scroller;
        // Only hide if content doesn't overflow at all
        const isOverflowing = scrollWidth > clientWidth + 10;
        prevBtn.style.display = isOverflowing ? "flex" : "none";
        nextBtn.style.display = isOverflowing ? "flex" : "none";
      };

      scroller.addEventListener("scroll", BonnaUtils.debounce(updateArrows, 50));
      window.addEventListener("resize", BonnaUtils.debounce(updateArrows, 100));

      // Initial check
      setTimeout(updateArrows, 500);
    }

    destroy() {
      this._abortController.abort();
    }
  }

  // Re-run for first time - this will initialize managers based on current page
  reinitAll();
});

// Helper for confetti
function createConfetti() {
  const colors = [
    "#ffd700",
    "#e8725a",
    "#f5b890",
    "#f7c5c5",
    "#8b2252",
    "#fcd5c0",
  ];
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(container);
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("div");
    const size = Math.random() * 8 + 4;
    c.style.cssText = `position:absolute; width:${size}px; height:${size}px; background:${colors[Math.floor(Math.random() * colors.length)]}; left:${50 + (Math.random() - 0.5) * 30}%; top:30%; border-radius:${Math.random() > 0.5 ? "50%" : "2px"}; animation:confettiFall ${Math.random() * 1.5 + 1}s ease-out ${Math.random() * 0.3}s forwards; --drift-x:${(Math.random() - 0.5) * 180}px; --rotation:${Math.random() * 720}deg;`;
    container.appendChild(c);
  }
  if (!document.getElementById("confetti-style")) {
    const s = document.createElement("style");
    s.id = "confetti-style";
    s.textContent =
      ".site-tagline { font-family: var(--font-retro); font-size: clamp(1rem, 2.5vw, 1.2rem); color: var(--clr-light-peach); max-width: 500px; margin: 0 auto var(--space-xl); line-height: 1.3; text-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: color var(--transition-smooth), transform var(--transition-smooth); user-select: none; min-height: 3.2em; } @keyframes confettiFall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(60vh) translateX(var(--drift-x)) rotate(var(--rotation)); opacity: 0; } }";
    document.head.appendChild(s);
  }
  setTimeout(() => container.remove(), 3000);
}
