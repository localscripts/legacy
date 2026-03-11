(() => {
  const THEME_CHANGE_EVENT = "site-theme-change";
  const DEFAULT_HEX = "#3B82F6";
  const MODAL_EXIT_MS = 240;

  const initCustomThemePicker = (scope = document) => {
    const control = scope.getElementById("customThemeControl");
    const trigger = scope.getElementById("customThemeTrigger");
    const modal = scope.getElementById("customThemeModal");
    const popover = scope.getElementById("customThemePopover");
    const input = scope.getElementById("customThemeHexInput");
    const preview = scope.getElementById("customThemePreview");
    const previewValue = scope.getElementById("customThemePreviewValue");
    const error = scope.getElementById("customThemeError");
    const cancelButton = scope.getElementById("customThemeCancel");
    const applyButton = scope.getElementById("customThemeApply");
    const closeButton = scope.getElementById("customThemeClose");

    if (!control || !trigger || !modal || !popover || !input || !preview || !previewValue || !error || !cancelButton || !applyButton || !closeButton) {
      return;
    }

    if (control.dataset.customThemeBound === "true") {
      return;
    }

    const normalizeHex = (value) =>
      window.normalizeCustomSiteThemeHex?.(value) || null;

    const getStoredHex = () =>
      window.getStoredCustomSiteThemeHex?.() || DEFAULT_HEX;

    const getActiveTheme = () =>
      window.getActiveSiteTheme?.() || "blue";

    let previousBodyOverflow = "";
    let closeTimerId = 0;

    const isModalOpen = () => !modal.hidden;

    const setError = (message = "") => {
      error.textContent = message;
      error.hidden = !message;
      input.setAttribute("aria-invalid", String(Boolean(message)));
    };

    const syncPreview = (value) => {
      const normalized = normalizeHex(value);
      if (normalized) {
        preview.style.backgroundColor = normalized;
        previewValue.textContent = normalized;
        return true;
      }

      const fallback = getStoredHex();
      preview.style.backgroundColor = fallback;
      previewValue.textContent = value.trim() ? "Invalid hex" : fallback;
      return false;
    };

    const unlockBody = () => {
      document.body.style.overflow = previousBodyOverflow;
      previousBodyOverflow = "";
    };

    const closePopover = ({ restoreFocus = false } = {}) => {
      window.clearTimeout(closeTimerId);
      closeTimerId = 0;

      if (!modal.hidden) {
        modal.classList.remove("is-open");
        modal.classList.add("is-closing");

        closeTimerId = window.setTimeout(() => {
          modal.hidden = true;
          modal.classList.remove("is-closing");
          unlockBody();
          closeTimerId = 0;
        }, MODAL_EXIT_MS);
      }

      trigger.classList.remove("is-active");
      trigger.setAttribute("aria-expanded", "false");
      setError("");

      if (restoreFocus) {
        trigger.focus();
      }
    };

    const openPopover = () => {
      window.clearTimeout(closeTimerId);
      closeTimerId = 0;

      const storedHex = getStoredHex();
      input.value = storedHex;
      syncPreview(storedHex);
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      modal.hidden = false;
      modal.classList.remove("is-closing");
      trigger.classList.add("is-active");
      trigger.setAttribute("aria-expanded", "true");
      setError("");

      requestAnimationFrame(() => {
        modal.classList.add("is-open");
        input.focus();
        input.select();
      });
    };

    const syncState = () => {
      const storedHex = getStoredHex();
      const isCustomActive = getActiveTheme() === "custom";

      trigger.style.setProperty("color", isCustomActive ? storedHex : "");

      if (isModalOpen()) {
        input.value = storedHex;
      }

      preview.style.backgroundColor = storedHex;
      if (!input.value.trim()) {
        previewValue.textContent = storedHex;
      }
    };

    const applyCustomHex = () => {
      const normalized = normalizeHex(input.value);
      if (!normalized) {
        setError("Enter a valid hex like #3B82F6.");
        syncPreview(input.value);
        input.focus();
        return;
      }

      window.applyCustomSiteTheme?.(normalized);
      window.syncThemeSwitcherUI?.(document);
      closePopover();
      syncState();
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isModalOpen()) {
        openPopover();
        return;
      }

      closePopover();
    });

    cancelButton.addEventListener("click", (event) => {
      event.preventDefault();
      closePopover({ restoreFocus: true });
    });

    applyButton.addEventListener("click", (event) => {
      event.preventDefault();
      applyCustomHex();
    });

    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      closePopover({ restoreFocus: true });
    });

    input.addEventListener("input", () => {
      if (syncPreview(input.value)) {
        setError("");
      } else if (!input.value.trim()) {
        setError("");
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCustomHex();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closePopover({ restoreFocus: true });
      }
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closePopover({ restoreFocus: true });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isModalOpen()) {
        closePopover({ restoreFocus: true });
      }
    });

    window.addEventListener(THEME_CHANGE_EVENT, syncState);

    control.dataset.customThemeBound = "true";
    trigger.setAttribute("aria-expanded", "false");
    syncState();
  };

  window.initCustomThemePicker = initCustomThemePicker;
})();
