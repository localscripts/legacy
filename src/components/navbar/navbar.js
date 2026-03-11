const byId = (id) => document.getElementById(id);
const qs = (sel) => document.querySelector(sel);
const on = (el, type, fn, options) => el && el.addEventListener(type, fn, options);
const isVisible = (el) => {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};
const getRect = (el) => (isVisible(el) ? el.getBoundingClientRect() : null);

const initNavbar = () => {
  const THEME_GLOW_DURATION_MS = 20000;
  const THEME_GLOW_EXIT_MS = 420;
  const el = {
    hdr: byId("hdr"),
    hdrCntr: qs(".hdr-cntr"),
    logoLnk: qs(".logo-lnk"),
    logoImg: qs(".logo-img"),
    srchCntr: qs(".srch-cntr"),
    hdrNav: qs(".hdr-nav"),
    mobQuickNav: qs(".mob-quick-nav"),
    mobActions: qs(".mob-actions"),
    mobMenu: byId("mobMenu"),
    mobMenuTgl: byId("mobMenuTgl"),
    mobSearchTgl: byId("mobSearchTgl"),
    mobSearchPanel: byId("mobSearchPanel"),
    mobTopFltrBtn: byId("mobTopFltrBtn"),
    mobQuickSearchBtn: byId("mobQuickSearchBtn"),
    themeNavTrigger: byId("themeNavTrigger"),
    mobQuickThemeBtn: byId("mobQuickThemeBtn"),
    mobThemeBtn: byId("mobThemeBtn"),
    mobQuickFltrBtn: byId("mobQuickFltrBtn"),
    mobFltrBtn: byId("mobFltrBtn"),
    fltrBtn: byId("fltrBtn"),
    srchInp: byId("srchInp"),
    mobPanelSrchInp: byId("mobPanelSrchInp"),
    mobSrchInp: byId("mobSrchInp"),
  };

  if (!el.hdr || !el.hdrCntr || !el.logoLnk || !el.srchCntr || !el.hdrNav || !el.mobMenu || !el.mobMenuTgl) return;

  const menuOpen = () => !el.mobMenu.classList.contains("hidden");
  const panelOpen = () => Boolean(el.mobSearchPanel && !el.mobSearchPanel.classList.contains("hidden"));
  const setHidden = (node, hidden) => node && node.classList.toggle("hidden", hidden);
  const setExpanded = (node, value) => node && node.setAttribute("aria-expanded", String(Boolean(value)));
  let themeGlowTimeout = 0;
  let themeGlowExitTimeout = 0;

  const syncHeaderScrolled = () => {
    el.hdr.classList.toggle("scrolled", window.scrollY > 0);
  };

  const syncMenuTop = () => {
    const top = Math.max(0, el.hdr.getBoundingClientRect().bottom);
    el.mobMenu.style.setProperty("--mob-menu-top", `${top}px`);
  };

  const syncDropdownSearchVisibility = () => {
    el.mobMenu.classList.toggle("hide-dup-search", isVisible(el.srchCntr));
  };

  const bindSearchField = (container, input, clearButton) => {
    if (!container || !input) return;

    const syncState = () => {
      const hasValue = input.value.length > 0;
      container.classList.toggle("has-value", hasValue);
      clearButton?.classList.toggle("hidden", !hasValue);
    };

    on(input, "input", syncState);
    on(input, "change", syncState);
    on(clearButton, "click", () => {
      input.value = "";
      syncState();
      input.focus();
    });

    syncState();
  };

  const closeMenu = () => {
    setHidden(el.mobMenu, true);
    document.body.style.overflow = "";
    setExpanded(el.mobMenuTgl, false);
  };

  const closeMobileSearchPanel = () => {
    setHidden(el.mobSearchPanel, true);
    setExpanded(el.mobSearchTgl, false);
  };

  const openMenu = (focusSearch = false) => {
    if (panelOpen()) closeMobileSearchPanel();
    syncHeaderScrolled();
    syncMenuTop();
    syncDropdownSearchVisibility();
    setHidden(el.mobMenu, false);
    document.body.style.overflow = "hidden";
    setExpanded(el.mobMenuTgl, true);

    if (!focusSearch) return;
    window.setTimeout(() => {
      if (!el.mobMenu.classList.contains("hide-dup-search") && el.mobSrchInp) {
        el.mobSrchInp.focus();
        return;
      }
      if (el.srchInp && isVisible(el.srchInp)) el.srchInp.focus();
    }, 60);
  };

  const openMobileSearchPanel = () => {
    if (!el.mobSearchPanel) return;
    if (menuOpen()) closeMenu();
    setHidden(el.mobSearchPanel, false);
    setExpanded(el.mobSearchTgl, true);
    if (el.mobPanelSrchInp) window.setTimeout(() => el.mobPanelSrchInp.focus(), 50);
  };

  const clearThemeGlow = ({ animate = false } = {}) => {
    const themeControl = byId("themeDropdownSelected");

    window.clearTimeout(themeGlowTimeout);
    themeGlowTimeout = 0;
    window.clearTimeout(themeGlowExitTimeout);
    themeGlowExitTimeout = 0;

    if (!themeControl) return;

    if (animate && themeControl.classList.contains("is-nav-glow")) {
      themeControl.classList.remove("is-nav-glow-out");
      void themeControl.offsetWidth;
      themeControl.classList.add("is-nav-glow-out");
      themeGlowExitTimeout = window.setTimeout(() => {
        themeControl.classList.remove("is-nav-glow", "is-nav-glow-out");
        themeGlowExitTimeout = 0;
      }, THEME_GLOW_EXIT_MS);
      return;
    }

    themeControl.classList.remove("is-nav-glow", "is-nav-glow-out");
  };

  const glowThemeControl = () => {
    const themeControl = byId("themeDropdownSelected");
    if (!themeControl) return false;

    clearThemeGlow();
    void themeControl.offsetWidth;
    themeControl.classList.add("is-nav-glow");
    themeGlowTimeout = window.setTimeout(() => {
      clearThemeGlow({ animate: true });
    }, THEME_GLOW_DURATION_MS);

    return true;
  };

  const scrollToThemes = () => {
    if (menuOpen()) closeMenu();
    if (panelOpen()) closeMobileSearchPanel();

    const scrollTarget = document.querySelector(".site-footer") || byId("footerMount");
    scrollTarget?.scrollIntoView({ behavior: "smooth", block: "start" });

    let attempts = 0;
    const maxAttempts = 18;

    const syncGlow = () => {
      attempts += 1;
      if (glowThemeControl() || attempts >= maxAttempts) return;
      window.setTimeout(syncGlow, 150);
    };

    window.setTimeout(syncGlow, 120);
  };

  const syncLayout = () => {
    syncDropdownSearchVisibility();
    if (menuOpen()) syncMenuTop();
  };

  bindSearchField(el.srchCntr, el.srchInp, byId("clrSrch"));
  bindSearchField(qs(".mob-search-panel-field"), el.mobPanelSrchInp, byId("mobPanelClrSrch"));
  bindSearchField(qs(".mob-srch-cntr"), el.mobSrchInp, byId("mobClrSrch"));

  on(el.mobMenuTgl, "click", () => (menuOpen() ? closeMenu() : openMenu()));
  on(el.mobSearchTgl, "click", () => (panelOpen() ? closeMobileSearchPanel() : openMobileSearchPanel()));
  on(el.mobQuickSearchBtn, "click", () => {
    if (window.innerWidth > 700 && el.srchInp && isVisible(el.srchCntr)) {
      el.srchInp.focus();
      return;
    }
    panelOpen() ? closeMobileSearchPanel() : openMobileSearchPanel();
  });
  [el.themeNavTrigger, el.mobQuickThemeBtn, el.mobThemeBtn].forEach((trigger) => {
    on(trigger, "click", (event) => {
      event.preventDefault();
      scrollToThemes();
    });
  });
  on(document, "click", (event) => {
    if (event.target.closest(".theme-switcher-controls")) {
      window.requestAnimationFrame(() => {
        clearThemeGlow({ animate: true });
      });
    }
  }, true);
  on(el.mobMenu, "click", (event) => event.target === el.mobMenu && closeMenu());
  on(document, "keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuOpen()) closeMenu();
    if (panelOpen()) closeMobileSearchPanel();
  });

  syncHeaderScrolled();
  syncLayout();
  on(window, "scroll", syncHeaderScrolled, { passive: true });
  on(window, "resize", () => {
    syncLayout();
    if (window.innerWidth > 700 && panelOpen()) closeMobileSearchPanel();
    if (window.innerWidth > 980 && menuOpen()) closeMenu();
  });

  const navModeMq = window.matchMedia("(max-width: 980px)");
  on(navModeMq, "change", () => {
    syncLayout();
    if (window.innerWidth > 700 && panelOpen()) closeMobileSearchPanel();
    if (window.innerWidth > 980 && menuOpen()) closeMenu();
  });

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(syncLayout);
    [el.hdrCntr, el.logoLnk, el.hdrNav, el.mobQuickNav].forEach((node) => node && observer.observe(node));
  }

  document.fonts?.ready?.then(syncLayout);
};

(() => {
  const mount = byId("navbarMount");
  if (!mount) return;

  const loadNavbar = async () => {
    try {
      const response = await fetch("src/components/navbar/navbar.html", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Failed to load navbar partial: ${response.status}`);
      mount.innerHTML = await response.text();
      initNavbar();
    } catch (error) {
      console.error(error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNavbar, { once: true });
    return;
  }
  loadNavbar();
})();
