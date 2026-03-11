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

  const escapeHtml = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderInlineMarkdown = (value) => {
    let html = escapeHtml(value);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return html;
  };

  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";

  const parseMarkdown = (source) => {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let title = "";
    const sections = [];
    let currentSection = { title: "Overview", blocks: [] };
    let paragraph = [];
    let listItems = [];
    let quoteLines = [];

    const pushBlock = (block) => {
      currentSection.blocks.push(block);
    };

    const flushParagraph = () => {
      if (!paragraph.length) return;
      pushBlock(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!listItems.length) return;
      pushBlock(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
      listItems = [];
    };

    const flushQuote = () => {
      if (!quoteLines.length) return;
      pushBlock(`<blockquote>${renderInlineMarkdown(quoteLines.join(" "))}</blockquote>`);
      quoteLines = [];
    };

    const flushSection = () => {
      if (!currentSection.blocks.length) return;
      sections.push({
        title: currentSection.title,
        html: currentSection.blocks.join(""),
        id: `overview-${slugify(currentSection.title)}`,
      });
      currentSection = { title: "Overview", blocks: [] };
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        flushQuote();
        continue;
      }

      const h1 = line.match(/^#\s+(.+)$/);
      const h2 = line.match(/^##\s+(.+)$/);
      const h3 = line.match(/^###\s+(.+)$/);
      const list = line.match(/^[-*]\s+(.+)$/);
      const quote = line.match(/^>\s+(.+)$/);

      if (h1) {
        flushParagraph();
        flushList();
        flushQuote();
        if (!title) {
          title = h1[1].trim();
        } else {
          pushBlock(`<h2>${renderInlineMarkdown(h1[1].trim())}</h2>`);
        }
        continue;
      }

      if (h2) {
        flushParagraph();
        flushList();
        flushQuote();
        flushSection();
        currentSection = { title: h2[1].trim(), blocks: [] };
        continue;
      }

      if (h3) {
        flushParagraph();
        flushList();
        flushQuote();
        pushBlock(`<h3>${renderInlineMarkdown(h3[1].trim())}</h3>`);
        continue;
      }

      if (list) {
        flushParagraph();
        flushQuote();
        listItems.push(list[1].trim());
        continue;
      }

      if (quote) {
        flushParagraph();
        flushList();
        quoteLines.push(quote[1].trim());
        continue;
      }

      flushList();
      flushQuote();
      paragraph.push(line);
    }

    flushParagraph();
    flushList();
    flushQuote();
    flushSection();

    return {
      title,
      sections,
    };
  };

  const renderSectionCards = (sections) =>
    sections
      .map(
        (section, index) => `
          <article id="${section.id}" class="overview-section overview-card overview-content-card${index === 0 ? " overview-content-card-primary" : ""}">
            <div class="overview-section-kicker">Section ${index + 1}</div>
            <h2 class="overview-section-title">${escapeHtml(section.title)}</h2>
            <div class="overview-richtext overview-markdown">
              ${section.html}
            </div>
          </article>
        `
      )
      .join("");

  const renderSectionNav = (sections) => {
    if (!sections.length) {
      return '<span class="overview-section-nav-empty">No section headings were found in the markdown.</span>';
    }

    return `
      <nav class="overview-jump-list" aria-label="Overview sections">
        ${sections
          .map(
            (section) => `
              <a href="#${section.id}" class="overview-jump-link">
                ${escapeHtml(section.title)}
              </a>
            `
          )
          .join("")}
      </nav>
    `;
  };

  const loadMarkdownSource = async () => {
    const candidates = ["overview/volt.md", "volt.md"];

    for (const path of candidates) {
      const response = await fetch(path, { cache: "no-cache" });
      if (!response.ok) continue;
      const source = await response.text();
      if (source.trim()) {
        return { path, source };
      }
    }

    return { path: "volt.md", source: "" };
  };

  const loadOverviewMarkdown = async () => {
    const sectionsRoot = document.getElementById("overviewSections");
    const sectionNav = document.getElementById("overviewSectionNav");
    const title = document.getElementById("overviewTitle");
    const subtitle = document.getElementById("overviewSubtitle");
    if (!sectionsRoot) return;

    try {
      const { path, source } = await loadMarkdownSource();
      if (!source.trim()) {
        sectionsRoot.innerHTML = `
          <article class="overview-section overview-card overview-content-card">
            <h2 class="overview-section-title">Overview</h2>
            <div class="overview-richtext overview-markdown">
              <p><code>volt.md</code> is empty right now. Add markdown there and this page will render it automatically.</p>
            </div>
          </article>
        `;
        if (sectionNav) {
          sectionNav.innerHTML = '<span class="overview-section-nav-empty">No sections available yet.</span>';
        }
        return;
      }

      const rendered = parseMarkdown(source);
      if (rendered.title && title) {
        title.textContent = rendered.title;
      }

      if (subtitle) {
        subtitle.innerHTML = `Rendering placeholder content from <code>${path}</code>`;
      }

      sectionsRoot.innerHTML = renderSectionCards(rendered.sections);

      if (sectionNav) {
        sectionNav.innerHTML = renderSectionNav(rendered.sections);
      }
    } catch (error) {
      console.error(error);
      sectionsRoot.innerHTML = `
        <article class="overview-section overview-card overview-content-card">
          <h2 class="overview-section-title">Overview</h2>
          <div class="overview-richtext overview-markdown">
            <p>Unable to load <code>volt.md</code> for this overview page.</p>
          </div>
        </article>
      `;
      if (sectionNav) {
        sectionNav.innerHTML = '<span class="overview-section-nav-empty">Unable to load section navigation.</span>';
      }
    }
  };

  onReady(async () => {
    try {
      const promoMount = document.getElementById("promoMount");
      if (promoMount) {
        await loadInto(promoMount, "src/components/promo/promo.html");
      }

      await loadOverviewMarkdown();

      const featuredMounts = [
        document.getElementById("featuredMountLeft"),
        document.getElementById("featuredMountLeftSecondary"),
        document.getElementById("featuredMount"),
        document.getElementById("featuredMountSecondary"),
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

      const footerMount = document.getElementById("footerMount");
      if (!footerMount) return;

      await loadInto(footerMount, "src/components/footer/footer.html");
      const customThemeMount = document.getElementById("customThemeMount");
      if (customThemeMount) {
        await loadInto(customThemeMount, "src/components/custom-theme/custom-theme.html");
      }
      window.initThemeSwitcher?.(document);
      window.initCustomThemePicker?.(document);
    } catch (error) {
      console.error(error);
    }
  });
})();
