/* Project case pages — pale azure + Body Shop rhythm + Effect 097 word tighten */
(() => {
  const BOOT = "af-project-e097";

  const rootSel = "[data-project-case]";

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const paras = (lines = []) =>
    lines
      .filter(Boolean)
      .map((t) => `<p>${esc(t)}</p>`)
      .join("");

  const figure = (item) => {
    if (!item?.src) return "";
    const layout = item.layout === "full" ? "full" : "squircle";
    return `<figure class="case-media case-media--${layout} sq">
      <img src="${esc(item.src)}" alt="${esc(item.alt || "")}" loading="lazy" decoding="async">
    </figure>`;
  };

  const details = (map = {}) => {
    const rows = Object.entries(map);
    if (!rows.length) return "";
    return `<dl class="case-details">
      ${rows
        .map(
          ([k, v]) => `<div>
        <dt>${esc(k)}</dt>
        <dd>${esc(v).replace(/\n/g, "<br>")}</dd>
      </div>`
        )
        .join("")}
    </dl>`;
  };

  const blockHtml = (block) => {
    if (!block) return "";
    if (block.type === "media") return figure(block);
    if (block.type === "section") {
      const media = (block.media || []).map(figure).join("");
      return `<section class="case-section">
        <header class="case-section__copy">
          <h2>${esc(block.title)}</h2>
          <div class="case-prose">${paras(block.body)}</div>
        </header>
        ${media ? `<div class="case-section__media">${media}</div>` : ""}
      </section>`;
    }
    return "";
  };

  const nextHtml = (slugs, catalog, register) => {
    const cards = (slugs || [])
      .map((slug) => {
        const p = catalog[slug];
        const r = (register || []).find((e) => e.slug === slug);
        if (!p && !r) return "";
        const title = p?.title || r?.title || slug;
        const role = p?.role || r?.role || "";
        const href = p?.href || r?.href || `/work/${slug}.html`;
        const thumb =
          p?.hero?.src ||
          (r?.media && r.media[0]) ||
          "";
        return `<a class="case-next__card sq" href="${esc(href)}">
          ${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : ""}
          <span>
            <b>${esc(title)}</b>
            <i>${esc(role)}</i>
          </span>
        </a>`;
      })
      .filter(Boolean)
      .join("");
    if (!cards) return "";
    return `<section class="case-next" aria-label="Next projects">
      <h2>Next projects</h2>
      <div class="case-next__row">${cards}</div>
    </section>`;
  };

  const render = (project, register) => {
    const hero = project.hero || {};
    const cta = project.cta
      ? `<p class="case-cta"><a href="${esc(project.cta.href)}" rel="noopener" target="_blank">${esc(project.cta.label)}</a></p>`
      : "";

    return `
      <section class="case-hero" aria-label="${esc(project.title)} hero">
        <img src="${esc(hero.src || "")}" alt="${esc(hero.alt || project.title)}" fetchpriority="high">
      </section>

      <section class="case-intro">
        <p class="case-eyebrow"><a href="/work.html">Work</a></p>
        <h1>${esc(project.title)}${(project.yearLabel || project.year) ? `, ${esc(project.yearLabel || project.year)}` : ""}</h1>
        <p class="case-meta">${esc([project.client, project.role].filter(Boolean).join(" · "))}</p>
        <div class="case-prose case-prose--lead">${paras(project.lead)}</div>
        ${cta}
        ${details(project.details)}
      </section>

      <div class="case-body">
        ${(project.blocks || []).map(blockHtml).join("")}
      </div>

      ${nextHtml(project.next, window.__AF_PROJECTS__ || {}, register)}
    `;
  };

  /* Effect 097 — tightening word lines (scroll-scrubbed) */
  const tightenWords = (root) => {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (root.dataset.tightenReady === "1") return;
    gsap.registerPlugin(ScrollTrigger);

    const targets = root.querySelectorAll(
      ".case-intro h1, .case-prose p, .case-section__copy h2"
    );

    targets.forEach((el) => {
      if (el.dataset.tighten === "1") return;
      const raw = el.textContent.replace(/\s+/g, " ").trim();
      if (!raw || raw.split(" ").length < 2) return;

      el.dataset.tighten = "1";
      el.classList.add("case-tighten");
      el.innerHTML = raw
        .split(" ")
        .map((w) => `<span class="case-word">${esc(w)}</span>`)
        .join(" ");

      const words = [...el.querySelectorAll(".case-word")];
      const lineMap = new Map();
      words.forEach((w) => {
        const top = Math.round(w.offsetTop);
        if (!lineMap.has(top)) lineMap.set(top, []);
        lineMap.get(top).push(w);
      });

      [...lineMap.values()]
        .filter((L) => L.length > 1)
        .forEach((lineWords) => {
          const lineBox = document.createElement("span");
          lineBox.className = "case-line";
          lineWords[0].before(lineBox);
          lineWords.forEach((w, i) => {
            lineBox.appendChild(w);
            if (i < lineWords.length - 1) lineBox.appendChild(document.createTextNode(" "));
          });
        });
    });

    // Second pass after line wrappers exist
    requestAnimationFrame(() => {
      root.querySelectorAll(".case-line").forEach((lineBox) => {
        if (lineBox.dataset.bound === "1") return;
        const lineWords = [...lineBox.querySelectorAll(".case-word")];
        if (lineWords.length < 2) return;
        lineBox.dataset.bound = "1";

        const host =
          lineBox.closest(".case-prose, .case-intro h1, .case-section__copy") ||
          lineBox.parentElement;
        // Use content column width, not shrink-wrapped line
        const col =
          lineBox.closest(".case-prose") ||
          lineBox.closest(".case-section__copy") ||
          lineBox.closest(".case-intro");
        const avail = Math.max(
          (col && col.clientWidth) || 0,
          host.getBoundingClientRect().width,
          480
        );

        lineBox.style.display = "block";
        lineBox.style.width = `${avail}px`;
        lineBox.style.maxWidth = "100%";

        const box = lineBox.getBoundingClientRect();
        const natural = lineWords.map((w) => {
          const r = w.getBoundingClientRect();
          return { left: r.left - box.left, width: r.width };
        });

        const totalW = natural.reduce((s, n) => s + n.width, 0);
        const gaps = lineWords.length - 1;
        const leftover = Math.max(avail - totalW, avail * 0.45);
        const spreadGap = gaps > 0 ? leftover / gaps : 0;

        let cursor = 0;
        const spreadX = natural.map((n, i) => {
          const x = cursor - n.left;
          cursor += n.width + (i < gaps ? spreadGap : 0);
          return x;
        });

        gsap.fromTo(
          lineWords,
          { x: (i) => spreadX[i], display: "inline-block" },
          {
            x: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: lineBox,
              start: "top 92%",
              end: "top 50%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });

      root.dataset.tightenReady = "1";
      ScrollTrigger.refresh();
    });
  };

  const elWidth = (el) => {
    let n = el;
    while (n && n !== document.body) {
      const w = n.getBoundingClientRect().width;
      if (w > 40) return w;
      n = n.parentElement;
    }
    return window.innerWidth;
  };

  let catalogPromise;
  const loadCatalog = () => {
    if (!catalogPromise) {
      catalogPromise = fetch("/content/projects.json")
        .then((r) => r.json())
        .then((d) => {
          window.__AF_PROJECTS__ = d.projects || {};
          return window.__AF_PROJECTS__;
        })
        .catch(() => ({}));
    }
    return catalogPromise;
  };

  const mount = async () => {
    const root = document.querySelector(rootSel);
    if (!root) return;
    const slug = root.getAttribute("data-project-case") || document.body.dataset.slug;
    if (!slug) return;
    if (root.dataset.boot === BOOT && root.dataset.slug === slug && root.childElementCount) return;

    const [catalog, register] = await Promise.all([
      loadCatalog(),
      (window.Site?.data || fetch("/content/register.json").then((r) => r.json()).then((d) => d.entries)).catch(() => []),
    ]);

    const project = catalog[slug];
    if (!project) {
      root.innerHTML = `<section class="case-intro"><p class="case-prose">Project not found.</p></section>`;
      return;
    }

    root.dataset.boot = BOOT;
    root.dataset.slug = slug;
    delete root.dataset.tightenReady;
    root.removeAttribute("aria-busy");
    root.innerHTML = render(project, register);
    document.title = `${project.title} — Andrea Fanelli`;

    if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const nodes = root.querySelectorAll(".case-intro, .case-section, .case-media, .case-next");
      gsap.fromTo(
        nodes,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "transform",
          onComplete: () => tightenWords(root),
        }
      );
      setTimeout(() => tightenWords(root), 850);
    }
  };

  addEventListener("DOMContentLoaded", mount);
  addEventListener("site:page", mount);
  if (document.readyState !== "loading") mount();
})();
