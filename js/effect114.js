/* GSAP Effect 114 — dense edge-to-edge cover flow (Ideas). */
(() => {
  const ANGLE = 58;
  const DEPTH = 72;
  const SIDE = 4;
  const PERSPECTIVE = 900;
  const EASE = "power3.out";

  let raf = null;
  let progress = 0;
  let target = 0;
  let cards = [];
  let root = null;
  let rail = null;
  let caption = null;
  let prevBtn = null;
  let nextBtn = null;
  let pointerBound = false;
  let resizeHandler = null;
  let keyHandler = null;
  let navHandler = null;
  let booting = false;
  let spacing = 0;

  const thumb = (u, w = 1200) => {
    if (!u) return "";
    if (/\.gif$/i.test(u)) return u;
    return `${u}${u.includes("?") ? "&" : "?"}scale-down-to=${w}`;
  };

  const pad = (n) => String(n).padStart(2, "0");

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

  const date = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y.slice(2)}`;
  };

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
      (e) => e.onSite !== false && e.kind === "writing" && e.media?.[0]
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

  function renderCards(host, items) {
    host.innerHTML = "";
    return items.map((item, i) => {
      const img = item.media?.[0] || "";
      const tag = item.href ? "a" : "article";
      const el = document.createElement(tag);
      el.className = "ideas-114__card";
      if (item.href) el.href = item.href;
      el.dataset.index = String(i);
      el.setAttribute(
        "aria-label",
        `${item.title}${item.year ? `, ${item.year}` : ""}`
      );
      const meta = item.date
        ? date(item.date)
        : item.year
          ? String(item.year)
          : item.client || "Notes";
      el.innerHTML = `
        <span class="ideas-114__shot">
          <img src="${esc(thumb(img))}" alt="${esc(item.title)}" loading="${
            i < 6 ? "eager" : "lazy"
          }" draggable="false" />
        </span>
        <span class="ideas-114__meta"><em>${esc(pad(i + 1))}</em> ${esc(
          meta
        )}</span>
      `;
      host.appendChild(el);
      el._item = item;
      return el;
    });
  }

  function measure() {
    if (!cards[0]) return;
    const half = Math.min(SIDE, Math.max(2, (cards.length - 1) / 2));
    const zEdge = half * DEPTH;
    const perspFactor = (PERSPECTIVE + zEdge) / PERSPECTIVE;
    const transformReach = window.innerWidth * 0.5 * perspFactor * 1.08;
    spacing = transformReach / half;
  }

  function propsFor(dist) {
    const abs = Math.abs(dist);
    const rotY = gsap.utils.clamp(-ANGLE, ANGLE, -dist * (ANGLE / SIDE));
    const z = -abs * DEPTH + (abs < 0.4 ? (0.4 - abs) * 36 : 0);
    const alpha = abs > SIDE + 1.8 ? 0 : 1;
    const zIndex = Math.round(200 - abs * 14);
    return {
      x: dist * spacing,
      z,
      rotationY: rotY,
      scale: 1,
      autoAlpha: alpha,
      zIndex,
      force3D: true,
    };
  }

  function syncNav() {
    if (!cards.length) return;
    const at = Math.round(target);
    if (prevBtn) prevBtn.disabled = at <= 0;
    if (nextBtn) nextBtn.disabled = at >= cards.length - 1;
  }

  function layout(at, immediate) {
    if (!cards.length) return;
    const max = cards.length - 1;
    const p = Math.max(0, Math.min(max, at));
    const active = Math.round(p);

    cards.forEach((card, i) => {
      const props = propsFor(i - p);
      if (immediate) gsap.set(card, props);
      else
        gsap.to(card, {
          ...props,
          duration: 0.45,
          ease: EASE,
          overwrite: "auto",
        });

      card.classList.toggle("is-active", i === active);
      card.tabIndex = i === active ? 0 : -1;
    });

    updateCaption(active);
    syncNav();
  }

  function updateCaption(index) {
    if (!caption) return;
    const card = cards[index];
    const item = card?._item;
    if (!item) return;
    const idxEl = caption.querySelector(".ideas-114__caption-index");
    const titleEl = caption.querySelector(".ideas-114__caption-title");
    if (idxEl) idxEl.textContent = pad(index + 1);
    if (titleEl) titleEl.textContent = item.title;
    caption.classList.add("is-on");
  }

  function step(dir) {
    if (!cards.length) return;
    target = gsap.utils.clamp(
      0,
      cards.length - 1,
      Math.round(target) + dir
    );
    syncNav();
    requestTick();
  }

  function setTargetFromClientX(clientX) {
    if (!cards.length) return;
    const max = cards.length - 1;
    const x = gsap.utils.clamp(0, window.innerWidth, clientX);
    const t = gsap.utils.mapRange(0.01, 0.99, 0, max, x / window.innerWidth);
    target = gsap.utils.clamp(0, max, t);
  }

  function tick() {
    raf = null;
    const delta = target - progress;
    if (Math.abs(delta) < 0.0008) {
      progress = target;
      layout(progress, true);
      return;
    }
    progress += delta * 0.16;
    layout(progress, true);
    raf = requestAnimationFrame(tick);
  }

  function requestTick() {
    if (raf == null) raf = requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    setTargetFromClientX(e.clientX);
    requestTick();
  }

  function onPointerDown(e) {
    if (e.pointerType !== "touch") return;
    setTargetFromClientX(e.clientX);
    requestTick();
  }

  function bindPointer() {
    if (pointerBound || !root) return;
    pointerBound = true;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerdown", onPointerDown, { passive: true });
  }

  function unbindPointer() {
    if (!pointerBound) return;
    pointerBound = false;
    window.removeEventListener("pointermove", onPointerMove);
    root?.removeEventListener("pointerdown", onPointerDown);
  }

  function teardown() {
    if (raf != null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    unbindPointer();
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    if (keyHandler) {
      window.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    if (navHandler && root) {
      root.removeEventListener("click", navHandler);
      navHandler = null;
    }
    cards.forEach((c) => gsap.killTweensOf(c));
    cards = [];
    progress = 0;
    target = 0;
  }

  function initReduced(items) {
    root.classList.add("is-reduced");
    cards.forEach((card) => {
      gsap.set(card, { clearProps: "all", opacity: 1 });
      card.classList.add("is-active");
      card.tabIndex = 0;
    });
    if (caption && items[0]) updateCaption(0);
    syncNav();
  }

  function initCoverflow() {
    measure();
    gsap.set(rail, {
      transformPerspective: PERSPECTIVE,
      transformStyle: "preserve-3d",
    });

    cards.forEach((card) => {
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        transformOrigin: "50% 50%",
        force3D: true,
        autoAlpha: 0,
        z: -280,
        scale: 0.92,
      });
    });

    measure();

    const mid = (cards.length - 1) / 2;
    progress = mid;
    target = mid;
    layout(progress, true);

    const intro = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        layout(progress, true);
        bindPointer();
      },
    });

    cards.forEach((card, i) => {
      const end = propsFor(i - mid);
      intro.fromTo(
        card,
        {
          autoAlpha: 0,
          z: end.z - 220,
          rotationY: end.rotationY * 1.08,
        },
        {
          autoAlpha: end.autoAlpha,
          z: end.z,
          x: end.x,
          scale: 1,
          rotationY: end.rotationY,
          duration: 0.95,
        },
        0.02 + Math.abs(i - mid) * 0.028
      );
    });

    if (caption) {
      intro.fromTo(
        caption,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 0.55 },
        0.35
      );
    }

    const nav = root.querySelector("[data-ideas-nav]");
    if (nav) {
      intro.fromTo(
        nav,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        0.45
      );
    }

    keyHandler = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      step(e.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", keyHandler);

    navHandler = (e) => {
      const prev = e.target.closest("[data-ideas-prev]");
      const next = e.target.closest("[data-ideas-next]");
      if (prev) {
        e.preventDefault();
        e.stopPropagation();
        step(-1);
      } else if (next) {
        e.preventDefault();
        e.stopPropagation();
        step(1);
      }
    };
    root.addEventListener("click", navHandler);

    let resizeTimer;
    resizeHandler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measure();
        layout(progress, true);
      }, 80);
    };
    window.addEventListener("resize", resizeHandler);
  }

  async function boot() {
    root = document.querySelector("[data-effect-114]");
    if (!root) {
      teardown();
      return;
    }
    if (booting) return;
    if (!window.gsap) return;

    booting = true;
    teardown();

    rail = root.querySelector(".ideas-114__rail");
    caption = root.querySelector("[data-ideas-caption]");
    prevBtn = root.querySelector("[data-ideas-prev]");
    nextBtn = root.querySelector("[data-ideas-next]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    try {
      const items = await loadIdeas();
      if (!items.length) throw new Error("no writing entries");
      cards = renderCards(rail, items);
      if (reduced) initReduced(items);
      else requestAnimationFrame(() => initCoverflow());
    } catch (err) {
      console.error(err);
      root.insertAdjacentHTML(
        "beforeend",
        `<p class="ideas-114__error">Could not load ideas.</p>`
      );
    } finally {
      booting = false;
    }
  }

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }

  addEventListener("site:page", () => setTimeout(boot, 0));
})();
