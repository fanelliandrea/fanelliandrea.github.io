/* Ideas playlist — register photos in Daybreak-style frames on daylight sky. */
(() => {
  let STEP = 18; /* degrees — recomputed so cards never overlap */
  const PASTELS = [
    "#f6d5c4",
    "#f0c8d4",
    "#f7efe6",
    "#d5e2ef",
    "#e4d4ea",
    "#eddcc8",
    "#d3e4de",
    "#f2d2c8",
    "#ddd4ec",
    "#ebe3d8",
    "#c9d8e8",
    "#efd8ce",
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
  let orbit = null;
  let focusEl = null;
  let prevBtn = null;
  let nextBtn = null;
  let cards = [];
  let items = [];
  let progress = 0;
  let target = 0;
  let raf = null;
  let radius = 320;
  let cardW = 168;
  let fadeSlots = 3.2;
  let booting = false;
  let pointerBound = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartTarget = 0;
  let moved = false;
  let navLockUntil = 0;
  let scrubResumeX = null;

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

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function count() {
    return cards.length || 1;
  }

  /** Shortest signed distance on a looping ring of n slots */
  function wrapDist(i, p, n = count()) {
    let d = i - (((p % n) + n) % n);
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  function modIndex(p, n = count()) {
    return ((Math.round(p) % n) + n) % n;
  }

  /** Nearest absolute progress that lands on index i */
  function nearestTarget(i) {
    const n = count();
    const cur = target;
    const base = Math.round(cur / n) * n;
    const candidates = [base + i - n, base + i, base + i + n];
    return candidates.reduce((best, v) =>
      Math.abs(v - cur) < Math.abs(best - cur) ? v : best
    );
  }

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

  function measure() {
    const stage = root.querySelector(".ideas-pl__stage");
    const w = stage?.clientWidth || window.innerWidth;
    const h = stage?.clientHeight || window.innerHeight;
    const desktop = w >= 900;
    cardW = clamp(
      Math.round(w * (desktop ? 0.118 : 0.2)),
      desktop ? 124 : 110,
      desktop ? 176 : 160
    );
    const cardH = cardW * (4 / 3);

    if (desktop) {
      /* Fit arc so outermost cards land near bottom-left / bottom-right */
      const topPad = clamp(h * 0.12, 56, 120); /* lower wheel a bit */
      const drop = clamp(h * 0.045, 28, 56);
      /* Aim the far card body into the corner (origin is bottom-center) */
      const cornerX = clamp(cardW * 0.55, 48, 110);
      const cornerY = h - clamp(h * 0.02, 8, 24);
      let best = null;
      for (let deg = 62; deg <= 88; deg += 0.35) {
        const th = (deg * Math.PI) / 180;
        const s = Math.sin(th);
        const c = Math.cos(th);
        if (s < 0.3) continue;
        const r = (w / 2 - cornerX) / s;
        if (r < 320 || r > w * 1.55) continue;
        const orbitY = cornerY + c * r + drop;
        const apexTop = orbitY - r - cardH;
        if (apexTop < h * 0.04 || apexTop > h * 0.38) continue;
        const score =
          Math.abs(apexTop - topPad) * 1.2 +
          Math.abs(cornerY - (h - 16)) * 0.35 +
          Math.abs(orbitY - (h + drop)) * 0.05;
        if (!best || score < best.score) {
          best = { score, r, orbitY, deg, apexTop };
        }
      }
      if (best) {
        radius = Math.round(best.r);
        if (orbit) orbit.style.top = `${(best.orbitY / h) * 100}%`;
        const gap = clamp(Math.round(cardW * 0.24), 18, 40);
        const half = Math.asin(
          clamp((cardW + gap) / (2 * Math.max(radius, 1)), 0.01, 0.95)
        );
        STEP = clamp((half * 2 * 180) / Math.PI, 12, 24);
        /* Keep full opacity through the corner seat; soft-fade just past it */
        fadeSlots = clamp(best.deg / STEP, 3, 7);
      } else {
        const orbitPct = 1.22;
        if (orbit) orbit.style.top = `${orbitPct * 100}%`;
        const orbitTop = h * orbitPct;
        radius = clamp(
          Math.round(Math.min(w * 0.78, orbitTop - cardH - topPad)),
          420,
          1200
        );
        const gap = clamp(Math.round(cardW * 0.26), 20, 44);
        const half = Math.asin(
          clamp((cardW + gap) / (2 * Math.max(radius, 1)), 0.01, 0.95)
        );
        STEP = clamp((half * 2 * 180) / Math.PI, 14, 28);
        fadeSlots = 4.2;
      }
    } else {
      const orbitPct = 1.12;
      if (orbit) orbit.style.top = `${orbitPct * 100}%`;
      const orbitTop = h * orbitPct;
      const topPad = clamp(h * 0.1, 36, 64);
      radius = clamp(
        Math.round(Math.min(w * 0.72, orbitTop - cardH - topPad)),
        260,
        720
      );
      const gap = clamp(Math.round(cardW * 0.22), 16, 36);
      const half = Math.asin(
        clamp((cardW + gap) / (2 * Math.max(radius, 1)), 0.01, 0.95)
      );
      STEP = clamp((half * 2 * 180) / Math.PI, 15, 30);
      fadeSlots = clamp(58 / STEP, 2.2, 4);
    }

    cards.forEach((el) => {
      el.style.width = `${cardW}px`;
    });
  }

  function thumb(url, w = 900) {
    if (window.Site?.thumb) return window.Site.thumb(url, w);
    if (!url) return "";
    return /\.gif$/i.test(url) ? url : `${url}?scale-down-to=${w}`;
  }

  function renderCards(host, list) {
    host.innerHTML = "";
    return list.map((item, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ideas-pl__card";
      const tone = PASTELS[i % PASTELS.length];
      el.style.setProperty("--tone", tone);
      el.setAttribute("aria-label", item.title);
      el.dataset.index = String(i);
      const src = item.media?.[0] ? thumb(item.media[0], 900) : "";
      el.innerHTML = `
        <span class="ideas-pl__frame">
          <span class="ideas-pl__well">
          ${
            src
              ? `<img class="ideas-pl__shot" src="${esc(src)}" alt="" loading="lazy" decoding="async" draggable="false" />`
              : `<span class="ideas-pl__fallback">${esc(item.title)}</span>`
          }
          </span>
        </span>`;
      el.addEventListener("click", (e) => {
        if (moved) {
          e.preventDefault();
          return;
        }
        const active = modIndex(target);
        /* Second click on the focused card opens the article */
        if (i === active && item.href) {
          e.preventDefault();
          location.href = item.href;
          return;
        }
        lockNav();
        target = nearestTarget(i);
        updateFocus(i);
        requestTick();
      });
      host.appendChild(el);
      return el;
    });
  }

  function propsFor(dist) {
    const deg = dist * STEP;
    const rad = (deg * Math.PI) / 180;
    const x = Math.sin(rad) * radius;
    const y = -Math.cos(rad) * radius;
    const abs = Math.abs(dist);
    const sign = dist === 0 ? 0 : dist < 0 ? -1 : 1;
    /* Visible out to the corner-fitted arc length */
    const fadeStart = fadeSlots;
    const fadeEnd = fadeStart + 1.15;
    const alpha =
      abs >= fadeEnd ? 0 : abs <= fadeStart ? 1 : 1 - (abs - fadeStart) / 1.15;
    /* 0 at center → 1 at outer arc: ease-in so blur/distort build toward corners */
    const t = clamp(abs / Math.max(fadeStart, 0.001), 0, 1);
    const grad = t * t;
    const blurPx = grad * 10;
    /* Corners feel nearer to the screen: larger + swung toward camera */
    const near = grad;
    const scale = 1 + near * 0.12;
    const skewX = sign * near * 7;
    const scaleX = 1 + near * 0.07;
    const scaleY = 1 + near * 0.035;
    const rotY = -sign * near * 20;
    return {
      xPercent: -50,
      yPercent: -100,
      x,
      y,
      z: near * 90,
      rotation: deg,
      rotationY: rotY,
      skewX,
      scaleX: scale * scaleX,
      scaleY: scale * scaleY,
      transformOrigin: "50% 100%",
      transformPerspective: 1100,
      autoAlpha: alpha,
      filter: blurPx < 0.2 ? "blur(0px)" : `blur(${blurPx.toFixed(2)}px)`,
      zIndex: Math.round(40 - abs * 2),
      force3D: true,
    };
  }

  function updateFocus(index) {
    if (!focusEl || !items[index]) return;
    const item = items[index];
    const title = focusEl.querySelector("[data-ideas-title]");
    const cta = focusEl.querySelector("[data-ideas-cta]");
    if (title) title.textContent = item.title;
    if (cta) {
      cta.hidden = false;
      cta.textContent = "Read";
      if (item.href) {
        cta.href = item.href;
        cta.removeAttribute("aria-disabled");
        cta.classList.remove("is-soon");
        cta.onclick = null;
      } else {
        cta.href = "#";
        cta.setAttribute("aria-disabled", "true");
        cta.classList.add("is-soon");
        cta.onclick = (e) => e.preventDefault();
      }
    }
  }

  function layout(at, immediate) {
    if (!cards.length || !window.gsap) return;
    const n = count();
    const active = modIndex(at, n);

    cards.forEach((card, i) => {
      const props = propsFor(wrapDist(i, at, n));
      if (immediate) gsap.set(card, props);
      else
        gsap.to(card, {
          ...props,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
      card.classList.toggle("is-active", i === active);
      card.tabIndex = i === active ? 0 : -1;
    });

    updateFocus(active);
    syncArrows();
  }

  function tick() {
    raf = null;
    const delta = target - progress;
    if (Math.abs(delta) < 0.0009) {
      progress = target;
      layout(progress, true);
      return;
    }
    /* Soft follow — fluid but not snappy */
    progress += delta * 0.08;
    layout(progress, true);
    raf = requestAnimationFrame(tick);
  }

  function requestTick() {
    if (raf == null) raf = requestAnimationFrame(tick);
  }

  function setFromClientX(clientX) {
    if (!cards.length) return;
    const n = count();
    const w = window.innerWidth;
    /* Map only the central scrub band to the playlist */
    const x0 = w * 0.3;
    const x1 = w * 0.7;
    const x = clamp(clientX, x0, x1);
    const local = gsap.utils.mapRange(x0, x1, 0, n, x);
    const base = Math.round(progress / n) * n;
    const mapped = base + (((local % n) + n) % n);
    const alts = [mapped - n, mapped, mapped + n];
    const desired = alts.reduce((best, v) =>
      Math.abs(v - progress) < Math.abs(best - progress) ? v : best
    );
    /* Ease toward the cursor mapping — no hard snaps */
    target += (desired - target) * 0.2;
  }

  function inScrubZone(clientX, clientY) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nx = clientX / w;
    const ny = clientY / h;
    /* Cursor scrub only in the middle — not the side/bottom corners */
    if (nx < 0.28 || nx > 0.72) return false;
    if (ny < 0.06 || ny > 0.72) return false;
    return true;
  }

  function onPointerMove(e) {
    if (dragging) {
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 4) moved = true;
      const delta = (-dx / window.innerWidth) * Math.max(1.6, count() * 0.28);
      target = dragStartTarget + delta;
      requestTick();
      return;
    }
    /* After arrow/keyboard steps, ignore mouse-X scrub until the pointer
       travels far enough — otherwise the cursor position snaps the wheel back. */
    if (Date.now() < navLockUntil) return;
    if (e.target.closest?.("[data-ideas-nav], .ideas-pl__cta, a")) return;
    if (scrubResumeX != null) {
      if (Math.abs(e.clientX - scrubResumeX) < window.innerWidth * 0.07) return;
      scrubResumeX = null;
    }
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!inScrubZone(e.clientX, e.clientY)) return;
    setFromClientX(e.clientX);
    requestTick();
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("[data-ideas-nav], .ideas-pl__cta, a")) return;
    if (!inScrubZone(e.clientX, e.clientY)) return;
    dragging = true;
    moved = false;
    dragStartX = e.clientX;
    dragStartTarget = target;
    scrubResumeX = null;
    root.classList.add("is-dragging");
  }

  function onPointerUp() {
    dragging = false;
    root.classList.remove("is-dragging");
    target = Math.round(target);
    requestTick();
  }

  function lockNav(ms = 1100, clientX) {
    navLockUntil = Date.now() + ms;
    scrubResumeX =
      typeof clientX === "number" && Number.isFinite(clientX)
        ? clientX
        : window.innerWidth * 0.5;
  }

  function step(dir, clientX) {
    if (!cards.length) return;
    lockNav(1200, clientX);
    target = Math.round(target) + dir;
    updateFocus(modIndex(target));
    requestTick();
  }

  function syncArrows() {
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  }

  function onWheel(e) {
    if (!cards.length) return;
    e.preventDefault();
    if (Date.now() < navLockUntil) return;
    const dir = Math.sign(e.deltaY || e.deltaX);
    if (!dir) return;
    step(dir, e.clientX);
  }

  function onKey(e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  }

  function onNavClick(e) {
    const prev = e.target.closest("[data-ideas-prev]");
    const next = e.target.closest("[data-ideas-next]");
    if (prev) {
      e.preventDefault();
      e.stopPropagation();
      step(-1, e.clientX);
    } else if (next) {
      e.preventDefault();
      e.stopPropagation();
      step(1, e.clientX);
    }
  }

  function bind() {
    if (pointerBound || !root) return;
    pointerBound = true;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("click", onNavClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
  }

  function unbind() {
    if (!pointerBound) return;
    pointerBound = false;
    window.removeEventListener("pointermove", onPointerMove);
    root?.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    root?.removeEventListener("wheel", onWheel);
    root?.removeEventListener("click", onNavClick);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measure();
      layout(progress, true);
    }, 80);
  }

  function intro() {
    measure();
    progress = 0;
    target = 0;

    cards.forEach((card, i) => {
      const end = propsFor(wrapDist(i, 0));
      gsap.set(card, {
        ...end,
        y: end.y - 36,
        autoAlpha: 0,
        scaleX: end.scaleX * 0.92,
        scaleY: end.scaleY * 0.92,
        filter: "blur(8px)",
      });
    });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        layout(progress, true);
        bind();
      },
    });

    cards.forEach((card, i) => {
      const end = propsFor(wrapDist(i, 0));
      tl.to(
        card,
        {
          ...end,
          duration: 0.95,
        },
        0.04 + Math.abs(wrapDist(i, 0)) * 0.035
      );
    });

    if (focusEl) {
      tl.fromTo(
        focusEl,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.65 },
        0.35
      );
    }
  }

  function reduced() {
    root.classList.add("is-reduced");
    cards.forEach((c) => {
      gsap.set(c, { clearProps: "all", autoAlpha: 1 });
      c.tabIndex = 0;
    });
    updateFocus(0);
  }

  async function boot() {
    const next = document.querySelector("[data-ideas-playlist]");
    if (!next) {
      unbind();
      return;
    }
    if (booting) return;
    if (!window.gsap) return;
    booting = true;
    unbind();
    root = next;
    if (raf != null) {
      cancelAnimationFrame(raf);
      raf = null;
    }

    orbit = root.querySelector(".ideas-pl__orbit");
    focusEl = root.querySelector("[data-ideas-focus]");
    prevBtn = root.querySelector("[data-ideas-prev]");
    nextBtn = root.querySelector("[data-ideas-next]");
    const preferReduced =
      window.Site?.reduced ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      items = await loadIdeas();
      if (!items.length) throw new Error("no writing");
      cards = renderCards(orbit, items);
      if (!document.querySelector('link[href*="/css/ideas.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/ideas.css?v=ideas-live1";
        document.head.appendChild(link);
      }
      if (preferReduced) reduced();
      else requestAnimationFrame(intro);
    } catch (err) {
      console.error(err);
      orbit.innerHTML = `<p class="ideas-pl__error">Could not load ideas.</p>`;
    } finally {
      booting = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }
  addEventListener("site:page", () => setTimeout(boot, 0));
})();
