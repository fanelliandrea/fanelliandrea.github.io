/* Project case pages — white field, serif title, bleed stills, quiet nav */
(() => {
  const BOOT = "af-project-dream1";
  const rootSel = "[data-project-case]";

  /* Dreamy Apple-style edge/corner blur — crisp center, soft periphery + gentle fold */
  const veilLayers = () => {
    const edge = [
      { blur: 1.25, clear: 54, mid: 78 },
      { blur: 3.5, clear: 60, mid: 84 },
      { blur: 8, clear: 66, mid: 90 },
      { blur: 14, clear: 72, mid: 95 },
      { blur: 22, clear: 78, mid: 98 },
    ]
      .map(({ blur, clear, mid }) => {
        // Ellipse sits a touch high so the bottom edge feels dreamier
        const mask = `radial-gradient(ellipse 86% 80% at 50% 38%, transparent ${clear}%, rgba(0,0,0,0.4) ${mid}%, #000 100%)`;
        return `<i class="case-dream__edge" style="-webkit-backdrop-filter:blur(${blur}px);backdrop-filter:blur(${blur}px);-webkit-mask-image:${mask};mask-image:${mask}"></i>`;
      })
      .join("");

    const fold = [0, 1, 2, 3, 4]
      .map((i) => {
        const blur = (1.2 + i * 3.2).toFixed(1);
        const a = Math.max(0, 42 + i * 9);
        const b = Math.min(100, 68 + i * 7);
        const mask = `linear-gradient(to top, #000 0%, rgba(0,0,0,0.75) ${(10 + i * 3).toFixed(1)}%, transparent ${b.toFixed(1)}%)`;
        return `<i class="case-dream__fold" style="-webkit-backdrop-filter:blur(${blur}px);backdrop-filter:blur(${blur}px);-webkit-mask-image:${mask};mask-image:${mask};height:${(38 + i * 8).toFixed(1)}%"></i>`;
      })
      .join("");

    return edge + fold;
  };

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
    const bleed = item.layout === "full";
    const cls = bleed ? "case-media case-media--bleed" : "case-media";
    return `<figure class="${cls}">
      <img src="${esc(item.src)}" alt="${esc(item.alt || "")}" loading="lazy" decoding="async">
    </figure>`;
  };

  const credits = (map = {}) => {
    const rows = Object.entries(map).filter(([, v]) => v);
    if (!rows.length) return "";
    return `<section class="case-credits" aria-label="Credits">
      ${rows
        .map(
          ([k, v]) =>
            `<div><b>${esc(k)}</b> ${esc(String(v).replace(/\n+/g, ", "))}</div>`
        )
        .join("")}
    </section>`;
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

  const sequence = (catalog, register) => {
    const list = (register || [])
      .filter((e) => e && e.slug && catalog[e.slug] && e.onSite !== false && e.kind !== "writing")
      .slice();
    list.sort(
      (a, b) =>
        (a.homeWork ?? 999) - (b.homeWork ?? 999) ||
        (b.sort ?? b.year ?? 0) - (a.sort ?? a.year ?? 0)
    );
    const seen = new Set(list.map((e) => e.slug));
    Object.keys(catalog).forEach((slug) => {
      if (!seen.has(slug)) list.push({ slug, title: catalog[slug].title });
    });
    return list.map((e) => e.slug);
  };

  const neighbors = (slug, catalog, register) => {
    const order = sequence(catalog, register);
    if (!order.length) return { prev: null, next: null };
    const i = Math.max(0, order.indexOf(slug));
    const prevSlug = order[(i - 1 + order.length) % order.length];
    const nextSlug = order[(i + 1) % order.length];
    const pack = (s) =>
      s && s !== slug
        ? {
            slug: s,
            title: catalog[s]?.title || s,
            href: catalog[s]?.href || `/work/${s}.html`,
          }
        : null;
    // if only one project, no neighbors
    if (order.length < 2) return { prev: null, next: null };
    return { prev: pack(prevSlug), next: pack(nextSlug) };
  };

  const pagerHtml = (slug, catalog, register) => {
    const { prev, next } = neighbors(slug, catalog, register);
    return `<nav class="case-pager" aria-label="Projects">
      ${
        prev
          ? `<a class="case-pager__link case-pager__prev" href="${esc(prev.href)}">
          <span>Previous</span>
          <b>${esc(prev.title)}</b>
        </a>`
          : `<span class="case-pager__link is-empty"></span>`
      }
      <a class="case-pager__all" href="/work.html">All work</a>
      ${
        next
          ? `<a class="case-pager__link case-pager__next" href="${esc(next.href)}">
          <span>Next</span>
          <b>${esc(next.title)}</b>
        </a>`
          : `<span class="case-pager__link is-empty"></span>`
      }
    </nav>`;
  };

  const chromeHtml = () => `<nav class="case-chrome" aria-label="Case">
      <a class="case-chrome__back" href="/work.html" aria-label="Back to Work">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <button type="button" class="case-chrome__top" data-case-top hidden aria-label="Back to top">Top</button>
    </nav>
    <div class="case-scroll-veil" data-case-veil aria-hidden="true">${veilLayers()}</div>`;

  const render = (project, register, catalog) => {
    const hero = project.hero || {};
    const cta = project.cta
      ? `<p class="case-cta"><a href="${esc(project.cta.href)}" rel="noopener" target="_blank">${esc(project.cta.label)}</a></p>`
      : "";
    const heroFig = hero.src
      ? `<figure class="case-hero case-media--bleed">
        <img src="${esc(hero.src)}" alt="${esc(hero.alt || project.title)}" fetchpriority="high">
      </figure>`
      : "";

    return `
      ${chromeHtml()}
      <section class="case-intro">
        <h1>${esc(project.title)}</h1>
        <p class="case-meta">${esc(
          [project.client, project.role, project.yearLabel || project.year]
            .filter(Boolean)
            .join(" · ")
        )}</p>
        <div class="case-prose">${paras(project.lead)}</div>
        ${cta}
      </section>

      ${heroFig}

      <div class="case-body">
        ${(project.blocks || []).map(blockHtml).join("")}
      </div>

      ${credits(project.details)}
      ${pagerHtml(project.slug, catalog, register)}
    `;
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

  const killVeil = () => {
    document.querySelectorAll("[data-case-veil]").forEach((el) => el.remove());
  };

  const bindChrome = (root) => {
    const top = root.querySelector("[data-case-top]");
    // Keep veil inside .case so chrome stays above the dream frame; dock/player sit above .case
    const veil = root.querySelector("[data-case-veil]");
    if (veil) veil.hidden = false;
    // Strip any leftover body-hosted veil from older builds / SPA hops
    document.querySelectorAll("body > [data-case-veil]").forEach((el) => el.remove());
    document.body.classList.add("arrived", "lit");

    const paint = () => {
      const y = window.scrollY || 0;
      if (top) top.hidden = y < Math.min(420, window.innerHeight * 0.55);
    };

    if (top) {
      top.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    window.addEventListener("scroll", paint, { passive: true });
    paint();
  };

  const mount = async () => {
    const root = document.querySelector(rootSel);
    const onCase =
      document.body.dataset.page === "work" &&
      (document.body.dataset.slug || root?.getAttribute("data-project-case"));
    if (!onCase || !root) {
      killVeil();
      return;
    }
    const slug = root.getAttribute("data-project-case") || document.body.dataset.slug;
    if (!slug) {
      killVeil();
      return;
    }
    if (root.dataset.boot === BOOT && root.dataset.slug === slug && root.childElementCount) return;

    const [catalog, register] = await Promise.all([
      loadCatalog(),
      (window.Site?.data ||
        fetch("/content/register.json")
          .then((r) => r.json())
          .then((d) => d.entries)
      ).catch(() => []),
    ]);

    const project = catalog[slug];
    if (!project) {
      root.innerHTML = `<section class="case-intro"><p class="case-prose">Project not found.</p></section>`;
      return;
    }

    root.dataset.boot = BOOT;
    root.dataset.slug = slug;
    root.removeAttribute("aria-busy");
    root.innerHTML = render(project, register, catalog);
    document.title = `${project.title} — Andrea Fanelli`;
    bindChrome(root);
  };

  addEventListener("DOMContentLoaded", mount);
  addEventListener("site:page", mount);
  if (document.readyState !== "loading") mount();
})();
