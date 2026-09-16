/* Ideas board — Her-style scattered pastel notes on daylight sky. */
(() => {
  const PASTELS = [
    "#f4c9a8",
    "#e8b8c8",
    "#f2ebe3",
    "#c9d6e4",
    "#dcc9e0",
    "#e8d4b8",
    "#c8d9d4",
    "#f0d0c4",
    "#d4cce8",
    "#e6dfd2",
    "#bcd0e0",
    "#ebd4c8",
  ];

  /** Soft letter-paper accents on a few notes */
  const ACCENTS = [1, 4, 7, 10];

  /**
   * Curated scatter — percent of stage, slight tilt.
   * Cycles if there are more ideas than slots.
   */
  const SLOTS = [
    { x: 6, y: 14, r: -5.5, w: 1 },
    { x: 22, y: 8, r: 3.2, w: 1.08 },
    { x: 41, y: 16, r: -2.4, w: 0.94 },
    { x: 58, y: 7, r: 4.1, w: 1.05 },
    { x: 76, y: 18, r: -3.6, w: 0.98 },
    { x: 10, y: 42, r: 2.8, w: 1.02 },
    { x: 30, y: 38, r: -4.2, w: 1.1 },
    { x: 49, y: 44, r: 1.6, w: 0.96 },
    { x: 68, y: 40, r: -2.1, w: 1.04 },
    { x: 84, y: 48, r: 5.2, w: 0.92 },
    { x: 16, y: 64, r: -1.8, w: 1 },
    { x: 38, y: 62, r: 3.8, w: 1.06 },
    { x: 60, y: 68, r: -4.8, w: 0.95 },
    { x: 78, y: 70, r: 2.2, w: 1.02 },
  ];

  const BLURBS = {
    "the-golden-age-of-audio": "Listening as a craft again.",
    "fashion-tech": "Where fabric meets interface.",
    "the-process-is-the-product": "The making is the meaning.",
    "taste-is-the-only-skill-to-learn": "Judgment over tooling.",
    "urban-undergrounds": "Cities below the street line.",
    "great-design-language": "Words before pixels.",
    "apps-are-evolving-into-experiences": "Beyond the icon grid.",
    "a-future-with-invisible-technology": "Presence without chrome.",
    "how-to-design-better-cities": "Form that serves daily life.",
    "product-as-a-service": "Use over ownership.",
    "movie-her-design-fiction": "Fiction as a design lab.",
    "turn-left": "Constraints that reshape the map.",
  };

  let root = null;
  let field = null;
  let cards = [];
  let zTop = 10;
  let floatTweens = [];
  let resizeHandler = null;
  let booting = false;

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]
    );

  function blurbFor(item) {
    if (item.blurb) return item.blurb;
    if (item.excerpt) return item.excerpt;
    if (BLURBS[item.slug]) return BLURBS[item.slug];
    return "A note from the practice.";
  }

  async function loadIdeas() {
    if (window.Site?.data) {
      const entries = await window.Site.data;
      return pickIdeas(entries);
    }
    const res = await fetch("/content/register.json", { cache: "no-store" });
    if (!res.ok) throw new Error("register.json missing");
    const data = await res.json();
    return pickIdeas(data.entries || []);
  }

  function pickIdeas(entries) {
    const writing = entries.filter(
      (e) => e.onSite !== false && e.kind === "writing"
    );
    const featured = writing
      .filter((e) => e.homeIdea)
      .sort((a, b) => a.homeIdea - b.homeIdea);
    const rest = writing
      .filter((e) => !e.homeIdea)
      .sort(
        (a, b) =>
          (b.year ?? -Infinity) - (a.year ?? -Infinity) ||
          String(a.title).localeCompare(String(b.title))
      );
    return [...featured, ...rest];
  }

  function placeCard(el, i, total) {
    const slot = SLOTS[i % SLOTS.length];
    const row = Math.floor(i / SLOTS.length);
    const jitter = ((i * 17) % 7) - 3;
    const x = Math.min(88, Math.max(2, slot.x + jitter * 0.35 + row * 3));
    const y = Math.min(72, Math.max(4, slot.y + jitter * 0.5 + row * 4));
    el.style.setProperty("--nx", `${x}%`);
    el.style.setProperty("--ny", `${y}%`);
    el.style.setProperty("--nr", `${slot.r + jitter * 0.15}deg`);
    el.style.setProperty("--nw", String(slot.w));
    el.style.zIndex = String(2 + (total - i));
  }

  function renderCards(host, items) {
    host.innerHTML = "";
    return items.map((item, i) => {
      const tag = item.href ? "a" : "article";
      const el = document.createElement(tag);
      const tone = PASTELS[i % PASTELS.length];
      el.className = "ideas-board__note";
      if (ACCENTS.includes(i % 12)) el.classList.add("has-accent");
      el.style.setProperty("--note-tone", tone);
      if (item.href) el.href = item.href;
      el.setAttribute("aria-label", item.title);
      el.innerHTML = `
        <span class="ideas-board__paper">
          <span class="ideas-board__title">${esc(item.title)}</span>
          <span class="ideas-board__blurb">${esc(blurbFor(item))}</span>
        </span>`;
      placeCard(el, i, items.length);
      host.appendChild(el);
      return el;
    });
  }

  function bringFront(el) {
    zTop += 1;
    el.style.zIndex = String(zTop);
  }

  function bindInteraction(els) {
    els.forEach((el, i) => {
      el.addEventListener("pointerenter", () => bringFront(el));
      el.addEventListener("focus", () => bringFront(el));

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let originLeft = 0;
      let originTop = 0;
      let moved = false;

      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        el.style.left = `${originLeft + dx}px`;
        el.style.top = `${originTop + dy}px`;
        el.style.right = "auto";
        el.style.bottom = "auto";
        el.style.setProperty("--nx", "0px");
        el.style.setProperty("--ny", "0px");
        el.dataset.free = "1";
        el.classList.add("is-dragging");
      };

      const onUp = (e) => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove("is-dragging");
        el.releasePointerCapture?.(e.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (moved && el.tagName === "A") {
          const block = (ev) => {
            ev.preventDefault();
            el.removeEventListener("click", block, true);
          };
          el.addEventListener("click", block, true);
        }
        resumeFloat(el, i);
      };

      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        bringFront(el);
        pauseFloat(el);
        const rect = el.getBoundingClientRect();
        const parent = field.getBoundingClientRect();
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        originLeft = rect.left - parent.left;
        originTop = rect.top - parent.top;
        if (window.gsap) gsap.set(el, { x: 0, y: 0 });
        el.style.left = `${originLeft}px`;
        el.style.top = `${originTop}px`;
        el.setPointerCapture?.(e.pointerId);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });
    });
  }

  function pauseFloat(el) {
    const tw = el._floatTween;
    if (tw) tw.pause();
  }

  function resumeFloat(el, i) {
    const tw = el._floatTween;
    if (tw) {
      tw.resume();
      return;
    }
    if (!window.gsap) return;
    const t = gsap.to(el, {
      y: `+=${6 + (i % 4)}`,
      duration: 3.2 + (i % 5) * 0.35,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    el._floatTween = t;
    floatTweens.push(t);
  }

  function animateIn(els) {
    floatTweens.forEach((t) => t.kill());
    floatTweens = [];
    const reduced =
      window.Site?.reduced ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!window.gsap || reduced) {
      els.forEach((el) => {
        el.style.opacity = "1";
        el.classList.add("is-in");
      });
      return;
    }

    gsap.set(els, { opacity: 0, y: 28 });
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      stagger: { each: 0.06, from: "random" },
      ease: "power3.out",
      onComplete: () => {
        els.forEach((el) => el.classList.add("is-in"));
        els.forEach((el, i) => resumeFloat(el, i));
      },
    });
  }

  function layout() {
    cards.forEach((el, i) => {
      if (el.dataset.free === "1") return;
      placeCard(el, i, cards.length);
    });
  }

  function destroy() {
    floatTweens.forEach((t) => t.kill());
    floatTweens = [];
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    cards = [];
  }

  async function boot(node) {
    if (booting) return;
    booting = true;
    destroy();
    root = node;
    field = root.querySelector(".ideas-board__field");
    if (!field) {
      booting = false;
      return;
    }

    try {
      const items = await loadIdeas();
      if (!items.length) {
        field.innerHTML = `<p class="ideas-board__error">No ideas yet.</p>`;
        booting = false;
        return;
      }
      cards = renderCards(field, items);
      bindInteraction(cards);
      animateIn(cards);
      resizeHandler = () => layout();
      window.addEventListener("resize", resizeHandler);
    } catch (err) {
      console.error(err);
      field.innerHTML = `<p class="ideas-board__error">Could not load ideas.</p>`;
    }
    booting = false;
  }

  function init() {
    const node = document.querySelector("[data-ideas-board]");
    if (!node) {
      destroy();
      return;
    }
    if (window.Site?.reduced) node.classList.add("is-reduced");
    boot(node);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  addEventListener("site:page", () => setTimeout(init, 0));
})();
