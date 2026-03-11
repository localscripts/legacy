(() => {
  const HIDE_ADS_SELECTOR = ".promo-hide-ads";

  const hideFeaturedAds = () => {
    const mainLayout = document.querySelector(".main-lyt");
    if (!mainLayout) return;

    mainLayout.classList.add("ads-hidden");
    mainLayout.querySelectorAll(".featured-sec").forEach((section) => section.remove());
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(HIDE_ADS_SELECTOR);
    if (!trigger) return;

    event.preventDefault();
    hideFeaturedAds();
  });
})();
