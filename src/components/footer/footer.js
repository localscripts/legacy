(() => {
  const THEME_STORAGE_KEY = "voxlis-theme";
  const CUSTOM_THEME_STORAGE_KEY = "voxlis-custom-theme-hex";
  const CUSTOM_THEME_ID = "custom";
  const THEME_CHANGE_EVENT = "site-theme-change";
  const VALID_THEMES = new Set([
    "blue",
    "red",
    "purple",
    "green",
    "orange",
    "cyan",
    "teal",
    "indigo",
    "pink",
    "rose",
    "amber",
    "lime",
    "emerald",
    "sky",
    "violet",
    "slate",
    "gold",
    "crimson",
    "aqua",
    "magenta",
  ]);

  const getThemeRoot = () => document.documentElement;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const normalizeTheme = (theme) => {
    if (theme === CUSTOM_THEME_ID) return CUSTOM_THEME_ID;
    return VALID_THEMES.has(theme) ? theme : "blue";
  };

  const normalizeHex = (value) => {
    if (typeof value !== "string") return null;

    const raw = value.trim().replace(/^#/, "");
    if (!raw) return null;

    const expanded = /^[0-9a-fA-F]{3}$/.test(raw)
      ? raw.split("").map((char) => `${char}${char}`).join("")
      : raw;

    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
    return `#${expanded.toUpperCase()}`;
  };

  const hexToRgb = (hex) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;

    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16),
    };
  };

  const rgbToHex = ({ r, g, b }) =>
    `#${[r, g, b]
      .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;

  const mixHex = (baseHex, targetHex, weight) => {
    const base = hexToRgb(baseHex);
    const target = hexToRgb(targetHex);
    if (!base || !target) return normalizeHex(baseHex) || "#3B82F6";

    const ratio = clamp(weight, 0, 1);
    return rgbToHex({
      r: base.r + (target.r - base.r) * ratio,
      g: base.g + (target.g - base.g) * ratio,
      b: base.b + (target.b - base.b) * ratio,
    });
  };

  const rgba = (hex, alpha) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(59, 130, 246, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  const buildCustomThemeVars = (hex) => {
    const normalized = normalizeHex(hex);
    const rgb = hexToRgb(normalized);
    if (!normalized || !rgb) return {};

    const soft = mixHex(normalized, "#FFFFFF", 0.28);
    const bright = mixHex(normalized, "#FFFFFF", 0.46);
    const hover = mixHex(normalized, "#000000", 0.22);
    const deep = mixHex(normalized, "#000000", 0.35);

    return {
      "--prim": normalized,
      "--prim-hvr": hover,
      "--prim-grd": `linear-gradient(to right, ${normalized}, ${hover})`,
      "--prim-glw": rgba(normalized, 0.5),
      "--sec-hvr": rgba(normalized, 0.1),
      "--sec-hvr-bdr": rgba(normalized, 0.5),
      "--theme-color": normalized,
      "--social-hover": normalized,
      "--card-hover": normalized,
      "--ad-color": normalized,
      "--ad2-color": normalized,
      "--ad3-color": `linear-gradient(90deg, ${soft}, ${hover})`,
      "--inp-color": normalized,
      "--inp2-color": rgba(normalized, 0.5),
      "--lbl-color": normalized,
      "--checkbx-color": rgba(normalized, 0.1),
      "--checkbx2-color": rgba(normalized, 0.3),
      "--prim-rgb": `${rgb.r}, ${rgb.g}, ${rgb.b}`,
      "--warning-bg": `linear-gradient(135deg, ${soft}, ${deep})`,
      "--bdg-b-color": rgba(normalized, 0.1),
      "--bdg-color": rgba(normalized, 0.3),
      "--featured-overlay-fill": `linear-gradient(90deg, ${bright} 0%, ${normalized} 46%, #ffffff 100%)`,
      "--banner-overlay-fill": `linear-gradient(90deg, ${bright} 0%, ${normalized} 70%, ${hover} 100%)`,
      "--header-overlay-fill": `linear-gradient(90deg, ${bright} 0%, ${normalized} 70%, ${hover} 100%)`,
    };
  };

  const CUSTOM_THEME_VAR_NAMES = Object.keys(buildCustomThemeVars("#3B82F6"));

  const clearCustomThemeVars = () => {
    const root = getThemeRoot();
    CUSTOM_THEME_VAR_NAMES.forEach((name) => root.style.removeProperty(name));
  };

  const applyCustomThemeVars = (hex) => {
    const root = getThemeRoot();
    Object.entries(buildCustomThemeVars(hex)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  };

  const emitThemeChange = (theme, customHex = null) => {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme, customHex } }));
  };

  const getStoredTheme = () =>
    normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY) || "blue");

  const getStoredCustomHex = () =>
    normalizeHex(window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY) || "");

  const applyPresetTheme = (theme) => {
    const nextTheme = VALID_THEMES.has(theme) ? theme : "blue";
    const root = getThemeRoot();
    clearCustomThemeVars();
    root.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    emitThemeChange(nextTheme, null);
    return nextTheme;
  };

  const applyCustomTheme = (hex) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return applyPresetTheme("blue");

    const root = getThemeRoot();
    clearCustomThemeVars();
    root.dataset.theme = CUSTOM_THEME_ID;
    applyCustomThemeVars(normalized);
    window.localStorage.setItem(THEME_STORAGE_KEY, CUSTOM_THEME_ID);
    window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, normalized);
    emitThemeChange(CUSTOM_THEME_ID, normalized);
    return CUSTOM_THEME_ID;
  };

  const applyTheme = (theme) => {
    const nextTheme = normalizeTheme(theme);
    if (nextTheme === CUSTOM_THEME_ID) {
      const storedHex = getStoredCustomHex();
      return storedHex ? applyCustomTheme(storedHex) : applyPresetTheme("blue");
    }
    return applyPresetTheme(nextTheme);
  };

  const syncSelectedOption = (dropdown, activeTheme, customHex = getStoredCustomHex()) => {
    const selected = dropdown.querySelector("#themeDropdownSelected");
    const options = [...dropdown.querySelectorAll(".theme-dropdown-option")];
    if (!selected || !options.length) return;

    const selectedIndicator = selected.querySelector(".theme-color-indicator");
    const selectedLabel = selected.querySelector("span");

    if (activeTheme === CUSTOM_THEME_ID && customHex && selectedIndicator && selectedLabel) {
      options.forEach((option) => option.classList.remove("selected"));
      selectedIndicator.className = "theme-color-indicator custom";
      selectedIndicator.style.backgroundColor = customHex;
      selectedLabel.textContent = "Custom";
      return;
    }

    const activeOption =
      options.find((option) => option.dataset.theme === activeTheme) ||
      options.find((option) => option.dataset.theme === "blue") ||
      options[0];

    options.forEach((option) => {
      option.classList.toggle("selected", option === activeOption);
    });

    const indicator = activeOption?.querySelector(".theme-color-indicator");
    const label = activeOption?.querySelector("span");

    if (indicator && selectedIndicator) {
      selectedIndicator.className = indicator.className;
      selectedIndicator.style.backgroundColor = "";
    }

    if (label && selectedLabel) {
      selectedLabel.textContent = label.textContent;
    }
  };

  const syncThemeSwitcherUI = (scope = document) => {
    const dropdown = scope.getElementById("themeDropdown");
    if (!dropdown) return;
    syncSelectedOption(dropdown, getStoredTheme(), getStoredCustomHex());
  };

  const closeDropdown = (dropdown) => {
    dropdown.classList.remove("active");
    dropdown.querySelector("#themeDropdownSelected")?.setAttribute("aria-expanded", "false");
  };

  const openDropdown = (dropdown) => {
    dropdown.classList.add("active");
    dropdown.querySelector("#themeDropdownSelected")?.setAttribute("aria-expanded", "true");
  };

  const toggleDropdown = (dropdown) => {
    if (dropdown.classList.contains("active")) {
      closeDropdown(dropdown);
      return;
    }
    openDropdown(dropdown);
  };

  const initThemeSwitcher = (scope = document) => {
    const dropdown = scope.getElementById("themeDropdown");
    const selected = scope.getElementById("themeDropdownSelected");
    const optionsRoot = scope.getElementById("themeDropdownOptions");
    if (!dropdown || !selected || !optionsRoot) return;

    if (dropdown.dataset.themeBound === "true") {
      syncThemeSwitcherUI(scope);
      return;
    }

    const activeTheme = applyTheme(getStoredTheme());
    syncSelectedOption(dropdown, activeTheme, getStoredCustomHex());

    selected.setAttribute("role", "button");
    selected.setAttribute("tabindex", "0");
    selected.setAttribute("aria-haspopup", "listbox");
    selected.setAttribute("aria-expanded", "false");

    selected.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDropdown(dropdown);
    });

    selected.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleDropdown(dropdown);
      }

      if (event.key === "Escape") {
        closeDropdown(dropdown);
      }
    });

    optionsRoot.querySelectorAll(".theme-dropdown-option").forEach((option) => {
      option.setAttribute("role", "option");
      option.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const nextTheme = applyTheme(option.dataset.theme || "blue");
        syncSelectedOption(dropdown, nextTheme, getStoredCustomHex());
        closeDropdown(dropdown);
      });
    });

    window.addEventListener(THEME_CHANGE_EVENT, () => {
      syncSelectedOption(dropdown, getStoredTheme(), getStoredCustomHex());
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) {
        closeDropdown(dropdown);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown(dropdown);
      }
    });

    dropdown.dataset.themeBound = "true";
  };

  applyTheme(getStoredTheme());

  window.initThemeSwitcher = initThemeSwitcher;
  window.syncThemeSwitcherUI = syncThemeSwitcherUI;
  window.applySiteTheme = applyTheme;
  window.applyCustomSiteTheme = applyCustomTheme;
  window.getStoredCustomSiteThemeHex = getStoredCustomHex;
  window.getActiveSiteTheme = getStoredTheme;
  window.normalizeCustomSiteThemeHex = normalizeHex;
})();
