(() => {
  const mount = document.getElementById("mobileFilterMount");
  if (!mount) return;

  const FILTER_TRIGGER_SELECTOR = "#fltrBtn, #mobFltrBtn, #mobTopFltrBtn, #mobQuickFltrBtn";

  const byId = (id) => document.getElementById(id);

  const getDrawer = () => byId("fltrDrwr");

  const setDrawerOpen = (open) => {
    const drawer = getDrawer();
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  const closeMobileNavbarPanels = () => {
    const mobMenu = byId("mobMenu");
    const mobMenuTgl = byId("mobMenuTgl");
    const mobSearchPanel = byId("mobSearchPanel");
    const mobSearchTgl = byId("mobSearchTgl");

    if (mobMenu && !mobMenu.classList.contains("hidden")) {
      mobMenu.classList.add("hidden");
      mobMenuTgl?.setAttribute("aria-expanded", "false");
    }

    if (mobSearchPanel && !mobSearchPanel.classList.contains("hidden")) {
      mobSearchPanel.classList.add("hidden");
      mobSearchTgl?.setAttribute("aria-expanded", "false");
    }
  };

  const openDrawer = () => {
    if (!getDrawer()) return;
    closeMobileNavbarPanels();
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    const dropdown = byId("mobSortDropdown");
    dropdown?.classList.remove("active");
    setDrawerOpen(false);
  };

  const setSelectedSortOption = (option) => {
    const selectedLabel = byId("mobSortDropdownSelected")?.querySelector("span");
    if (!selectedLabel || !option) return;

    selectedLabel.textContent = option.textContent?.trim() || "Recommended";
    option
      .closest("#mobSortDropdownOptions")
      ?.querySelectorAll(".custom-dropdown-option")
      .forEach((node) => node.classList.remove("selected"));
    option.classList.add("selected");
  };

  const setSingleActive = (clickedButton, groupSelector, buttonSelector) => {
    const group = clickedButton.closest(groupSelector);
    if (!group) return;
    group.querySelectorAll(buttonSelector).forEach((button) => button.classList.remove("actv"));
    clickedButton.classList.add("actv");
  };

  const resetDrawerControls = () => {
    const drawer = getDrawer();
    if (!drawer) return;

    drawer.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });

    drawer.querySelectorAll(".mob-prc-btn").forEach((btn) => {
      btn.classList.toggle("actv", btn.dataset.prc === "all");
    });

    drawer.querySelectorAll(".mob-key-btn").forEach((btn) => {
      btn.classList.toggle("actv", btn.dataset.key === "all");
    });

    drawer.querySelectorAll(".mob-type-btn").forEach((btn) => {
      btn.classList.toggle("actv", btn.dataset.type === "all");
    });

    const defaultSort = byId("mobSortDropdownOptions")?.querySelector('[data-value="recommended"]');
    if (defaultSort) setSelectedSortOption(defaultSort);
  };

  const setupDrawerEvents = () => {
    document.addEventListener("click", (event) => {
      const target = event.target;
      const drawer = getDrawer();

      const trigger = target.closest(FILTER_TRIGGER_SELECTOR);
      if (trigger) {
        event.preventDefault();
        openDrawer();
        return;
      }

      if (!drawer) return;

      if (target.closest(".fltr-drwr-ovl")) {
        closeDrawer();
        return;
      }

      if (target.closest("#applyFltrs")) {
        closeDrawer();
        return;
      }

      if (target.closest("#mobRstFltrs")) {
        resetDrawerControls();
        closeDrawer();
        return;
      }

      const priceButton = target.closest(".mob-prc-btn");
      if (priceButton) {
        setSingleActive(priceButton, ".mob-prc-btns", ".mob-prc-btn");
        return;
      }

      const keyButton = target.closest(".mob-key-btn");
      if (keyButton) {
        setSingleActive(keyButton, ".mob-key-btns", ".mob-key-btn");
        return;
      }

      const typeButton = target.closest(".mob-type-btn");
      if (typeButton) {
        setSingleActive(typeButton, ".mob-type-btns", ".mob-type-btn");
        return;
      }

      const dropdown = byId("mobSortDropdown");
      if (!dropdown) return;

      if (target.closest("#mobSortDropdownSelected")) {
        dropdown.classList.toggle("active");
        return;
      }

      const option = target.closest("#mobSortDropdownOptions .custom-dropdown-option");
      if (option) {
        setSelectedSortOption(option);
        dropdown.classList.remove("active");
        return;
      }

      if (!target.closest("#mobSortDropdown")) {
        dropdown.classList.remove("active");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!getDrawer()?.classList.contains("open")) return;
      closeDrawer();
    });

    document.addEventListener("voxlis:open-mobile-filter", openDrawer);
  };

  const loadMobileFilter = async () => {
    try {
      const response = await fetch("src/components/mobile-filter/mobile-filter.html", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load mobile filter partial: ${response.status}`);
      }
      mount.innerHTML = await response.text();
    } catch (error) {
      console.error(error);
    }
  };

  setupDrawerEvents();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadMobileFilter, { once: true });
    return;
  }

  loadMobileFilter();
})();
