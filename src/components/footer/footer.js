(() => {
  const THEME_STORAGE_KEY = "voxlis-theme";
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

  const normalizeTheme = (theme) => (VALID_THEMES.has(theme) ? theme : "blue");

  const applyTheme = (theme) => {
    const nextTheme = normalizeTheme(theme);
    const root = getThemeRoot();
    root.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    return nextTheme;
  };

  const getStoredTheme = () =>
    normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY) || "blue");

  const syncSelectedOption = (dropdown, activeTheme) => {
    const selected = dropdown.querySelector("#themeDropdownSelected");
    const options = [...dropdown.querySelectorAll(".theme-dropdown-option")];
    if (!selected || !options.length) return;

    const activeOption =
      options.find((option) => option.dataset.theme === activeTheme) ||
      options.find((option) => option.dataset.theme === "blue") ||
      options[0];

    options.forEach((option) => {
      option.classList.toggle("selected", option === activeOption);
    });

    const indicator = activeOption?.querySelector(".theme-color-indicator");
    const label = activeOption?.querySelector("span");
    const selectedIndicator = selected.querySelector(".theme-color-indicator");
    const selectedLabel = selected.querySelector("span");

    if (indicator && selectedIndicator) {
      selectedIndicator.className = indicator.className;
    }

    if (label && selectedLabel) {
      selectedLabel.textContent = label.textContent;
    }
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

    const activeTheme = applyTheme(getStoredTheme());
    syncSelectedOption(dropdown, activeTheme);

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
        syncSelectedOption(dropdown, nextTheme);
        closeDropdown(dropdown);
      });
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
  };

  applyTheme(getStoredTheme());

  window.initThemeSwitcher = initThemeSwitcher;
  window.applySiteTheme = applyTheme;
})();
