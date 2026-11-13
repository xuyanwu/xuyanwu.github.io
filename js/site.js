(() => {
  const html = document.documentElement;
  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  const themeBtn = document.getElementById("theme-toggle");
  const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function currentSystemTheme() {
    return systemDarkQuery.matches ? "dark" : "light";
  }

  function syncThemeUI() {
    const pinned = html.dataset.theme;
    const effective = pinned === "light" || pinned === "dark" ? pinned : currentSystemTheme();
    if (metaScheme) {
      metaScheme.content = pinned === "light" || pinned === "dark" ? pinned : "light dark";
    }
    if (themeBtn) {
      const label = themeBtn.querySelector(".theme-label");
      const isPinned = pinned === "light" || pinned === "dark";
      themeBtn.setAttribute("aria-pressed", String(isPinned));
      if (label) {
        label.textContent = isPinned ? (effective === "dark" ? "Dark (pinned)" : "Light (pinned)") : "System";
      }
      themeBtn.setAttribute(
        "aria-label",
        isPinned
          ? `Color theme pinned to ${effective}; activate to follow system preference`
          : `Following system (${effective}) theme; activate to switch to ${effective === "dark" ? "light" : "dark"}`
      );
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const pinned = html.dataset.theme;
      if (pinned === "light" || pinned === "dark") {
        delete html.dataset.theme;
        try {
          localStorage.removeItem("color-scheme");
        } catch (_) {}
      } else {
        const opposite = currentSystemTheme() === "dark" ? "light" : "dark";
        html.dataset.theme = opposite;
        try {
          localStorage.setItem("color-scheme", opposite);
        } catch (_) {}
      }
      syncThemeUI();
    });
  }

  systemDarkQuery.addEventListener("change", syncThemeUI);
  syncThemeUI();

  // Mobile navigation toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.getElementById("primary-nav-menu");
  if (navToggle && navMenu) {
    const closeMenu = () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
        closeMenu();
        navToggle.focus();
      }
    });

    navMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });
  }

  // Interactive Publications filter
  const pubRoot = document.querySelector("[data-publications-root]");
  if (pubRoot) {
    const pills = Array.from(pubRoot.querySelectorAll("[data-filter]"));
    const searchInput = pubRoot.querySelector("[data-pub-search]");
    const cards = Array.from(pubRoot.querySelectorAll(".pub-card, [data-pub-entry]"));
    const countEl = pubRoot.querySelector("[data-pub-count]");
    const emptyEl = pubRoot.querySelector("[data-pub-empty]");
    let activeFilter = "all";

    const applyFilter = () => {
      const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
      let visible = 0;

      for (const card of cards) {
        const categories = (card.dataset.category || "").split(/\s+/);
        const matchesCat = activeFilter === "all" || categories.includes(activeFilter);
        const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
        const show = matchesCat && matchesQuery;
        card.hidden = !show;
        if (show) visible += 1;
      }

      const lists = Array.from(pubRoot.querySelectorAll(".pub-list, [data-pub-section-list]"));
      for (const list of lists) {
        const hasVisible = Array.from(list.querySelectorAll(".pub-card, [data-pub-entry]")).some((c) => !c.hidden);
        const heading = list.previousElementSibling;
        if (heading && heading.classList.contains("pub-section-heading")) {
          heading.hidden = !hasVisible;
        }
        list.hidden = !hasVisible;
      }

      if (countEl) {
        countEl.textContent = `Showing ${visible} of ${cards.length} entries`;
      }
      if (emptyEl) {
        emptyEl.hidden = visible > 0;
      }
    };

    for (const pill of pills) {
      pill.addEventListener("click", () => {
        activeFilter = pill.dataset.filter || "all";
        for (const other of pills) {
          other.setAttribute("aria-pressed", String(other === pill));
        }
        applyFilter();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilter);
    }

    applyFilter();
  }

  // Interactive Denoising Gear Shift demo
  const gearLab = document.querySelector("[data-gear-lab]");
  if (gearLab) {
    const gearButtons = Array.from(gearLab.querySelectorAll("[data-gear]"));
    const nameEl = gearLab.querySelector("[data-gear-name]");
    const speedEl = gearLab.querySelector("[data-gear-speed]");
    const fillEl = gearLab.querySelector("[data-gear-fill]");
    const descEl = gearLab.querySelector("[data-gear-desc]");
    const visualEl = gearLab.querySelector("[data-gear-visual]");
    const tagEl = gearLab.querySelector("[data-gear-tag]");

    const presets = {
      "50": {
        name: "Standard Multi-Step Diffusion",
        speed: "1× baseline · 50 NFE",
        pct: "14%",
        desc: "Iterative denoising over dozens of UNet/DiT evaluations delivers high quality at the cost of multi-second server latency.",
        tag: "50 NFE · Slow"
      },
      "4": {
        name: "Few-Step Mobile Distillation",
        speed: "12.5× fewer steps",
        pct: "66%",
        desc: "Streamlined architectures and few-step distillation (MobileDiffusion, SnapGen, SnapGen-V) bring 1024px image & 5s video onto mobile devices.",
        tag: "4 NFE · Mobile"
      },
      "1": {
        name: "Second Gear: Single-Forward Diffusion-GAN",
        speed: "50× fewer steps",
        pct: "100%",
        desc: "Distills iterative denoising into a single forward pass via Diffusion-GAN & adversarial training (UFOGen, SF-V), enabling subsecond on-device image and video synthesis.",
        tag: "1 NFE · Instant"
      }
    };

    for (const btn of gearButtons) {
      btn.addEventListener("click", () => {
        const key = btn.dataset.gear || "1";
        const preset = presets[key];
        if (!preset) return;
        for (const other of gearButtons) {
          other.setAttribute("aria-pressed", String(other === btn));
        }
        if (nameEl) nameEl.textContent = preset.name;
        if (speedEl) speedEl.textContent = preset.speed;
        if (fillEl) fillEl.style.setProperty("--gear-pct", preset.pct);
        if (descEl) descEl.textContent = preset.desc;
        if (visualEl) visualEl.dataset.gearVisual = key;
        if (tagEl) tagEl.textContent = preset.tag;
      });
    }
  }
})();
