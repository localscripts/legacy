(() => {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  };

  const loadInto = async (mount, path) => {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load partial (${path}): ${response.status}`);
    }
    mount.innerHTML = await response.text();
  };

  const initFooterThemeDropdown = () => {
    const dropdown = document.getElementById("themeDropdown");
    const selected = document.getElementById("themeDropdownSelected");
    const optionsRoot = document.getElementById("themeDropdownOptions");
    if (!dropdown || !selected || !optionsRoot) return;

    const setSelectedOption = (option) => {
      const optionLabel = option.querySelector("span")?.textContent?.trim() || "Theme";
      const indicator = option.querySelector(".theme-color-indicator");
      const indicatorHtml = indicator
        ? indicator.outerHTML
        : '<div class="theme-color-indicator blue"></div>';

      selected.innerHTML = `${indicatorHtml}<span>${optionLabel}</span><i class="fas fa-chevron-down"></i>`;
      optionsRoot
        .querySelectorAll(".theme-dropdown-option")
        .forEach((el) => el.classList.remove("selected"));
      option.classList.add("selected");
    };

    const defaultBlue = optionsRoot.querySelector('.theme-dropdown-option[data-theme="blue"]');
    if (defaultBlue) {
      setSelectedOption(defaultBlue);
    }

    selected.addEventListener("click", (event) => {
      event.stopPropagation();
      dropdown.classList.toggle("active");
    });

    optionsRoot.querySelectorAll(".theme-dropdown-option").forEach((option) => {
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        setSelectedOption(option);
        dropdown.classList.remove("active");
      });
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("active");
      }
    });
  };

  onReady(async () => {
    try {
      const promoMount = document.getElementById("promoMount");
      if (promoMount) {
        await loadInto(promoMount, "src/components/promo/promo.html");
      }

      const featuredMounts = [
        document.getElementById("featuredMountLeft"),
        document.getElementById("featuredMountLeftSecondary"),
        document.getElementById("featuredMount"),
        document.getElementById("featuredMountSecondary")
      ].filter(Boolean);

      if (featuredMounts.length) {
        const response = await fetch("src/components/featured/featured.html", { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load featured partial: ${response.status}`);
        }
        const html = await response.text();
        featuredMounts.forEach((mount) => {
          mount.innerHTML = html;
        });
      }

      const cardsMount = document.getElementById("cardsMount");
      if (cardsMount) {
        await loadInto(cardsMount, "src/components/cards/cards.html");
      }

      const footerMount = document.getElementById("footerMount");
      if (footerMount) {
        await loadInto(footerMount, "src/components/footer/footer.html");
        initFooterThemeDropdown();
      }
    } catch (error) {
      console.error(error);
    }
  });
})();
