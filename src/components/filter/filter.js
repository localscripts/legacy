(() => {
  const mount = document.getElementById("filterMount");
  if (!mount) return;

  const FILTER_TRIGGER_SELECTOR =
    "#filterButton, #mobileMenuFilterButton, #mobileTopFilterButton, #mobileQuickFilterButton";

  const byId = (id) => document.getElementById(id);
  const query = (selector, root = document) => root.querySelector(selector);
  const queryAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const getDrawer = () => byId("filterDrawer");
  const getSortDropdown = () => byId("filterSortDropdown");

  const setDrawerOpen = (isOpen) => {
    const drawer = getDrawer();
    if (!drawer) return;
    drawer.classList.toggle("is-open", isOpen);
    drawer.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  const closeMobileNavbarPanels = () => {
    const mobileMenu = byId("mobMenu");
    const mobileMenuToggle = byId("mobMenuTgl");
    const mobileSearchPanel = byId("mobSearchPanel");
    const mobileSearchToggle = byId("mobSearchTgl");

    if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
      mobileMenu.classList.add("hidden");
      mobileMenuToggle?.setAttribute("aria-expanded", "false");
    }

    if (mobileSearchPanel && !mobileSearchPanel.classList.contains("hidden")) {
      mobileSearchPanel.classList.add("hidden");
      mobileSearchToggle?.setAttribute("aria-expanded", "false");
    }
  };

  const openDrawer = () => {
    if (!getDrawer()) return;
    closeMobileNavbarPanels();
    setDrawerOpen(true);
    document.dispatchEvent(new CustomEvent("voxlis:filter-opened"));
  };

  const closeDrawer = () => {
    getSortDropdown()?.classList.remove("is-open");
    setDrawerOpen(false);
  };

  const setSelectedSortOption = (option) => {
    const selectedLabel = byId("filterSortDropdownSelected")?.querySelector("span");
    const optionsRoot = byId("filterSortDropdownOptions");
    if (!selectedLabel || !option || !optionsRoot) return;

    selectedLabel.textContent = option.textContent?.trim() || "Recommended";
    queryAll(".custom-dropdown-option", optionsRoot).forEach((node) => node.classList.remove("selected"));
    option.classList.add("selected");
  };

  const setSingleActive = (clickedButton) => {
    const control = clickedButton.closest(".filter-segmented-control");
    if (!control) return;
    queryAll(".filter-segment-button", control).forEach((button) => button.classList.remove("is-active"));
    clickedButton.classList.add("is-active");
  };

  const resetDrawerControls = () => {
    const drawer = getDrawer();
    if (!drawer) return;

    queryAll('input[type="checkbox"]', drawer).forEach((checkbox) => {
      checkbox.checked = false;
    });

    queryAll(".filter-segment-button", drawer).forEach((button) => {
      button.classList.toggle("is-active", button.dataset.default === "true");
    });

    const sortOptions = byId("filterSortDropdownOptions");
    const defaultSortOption = sortOptions ? query('[data-value="recommended"]', sortOptions) : null;
    if (defaultSortOption) setSelectedSortOption(defaultSortOption);
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

      if (target.closest(".filter-drawer-overlay") || target.closest("#closeFilterDrawer")) {
        closeDrawer();
        return;
      }

      if (target.closest("#applyFilters")) {
        closeDrawer();
        return;
      }

      if (target.closest("#resetFilters")) {
        resetDrawerControls();
        return;
      }

      const filterButton = target.closest(".filter-segment-button");
      if (filterButton) {
        setSingleActive(filterButton);
        return;
      }

      const dropdown = getSortDropdown();
      if (!dropdown) return;

      if (target.closest("#filterSortDropdownSelected")) {
        dropdown.classList.toggle("is-open");
        return;
      }

      const option = target.closest("#filterSortDropdownOptions .custom-dropdown-option");
      if (option) {
        setSelectedSortOption(option);
        dropdown.classList.remove("is-open");
        return;
      }

      if (!target.closest("#filterSortDropdown")) {
        dropdown.classList.remove("is-open");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!getDrawer()?.classList.contains("is-open")) return;
      closeDrawer();
    });

    document.addEventListener("voxlis:open-filter", openDrawer);
  };

  const loadFilter = async () => {
    try {
      const response = await fetch("src/components/filter/filter.html", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load filter partial: ${response.status}`);
      }
      mount.innerHTML = await response.text();
    } catch (error) {
      console.error(error);
    }
  };

  setupDrawerEvents();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFilter, { once: true });
    return;
  }

  loadFilter();
})();
