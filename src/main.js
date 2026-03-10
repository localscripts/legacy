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
        window.initDisabledThemeNotice?.(document);
      }
    } catch (error) {
      console.error(error);
    }
  });
})();
