/* Project case pages — white field, serif title, bleed stills, quiet nav */
(() => {
  const BOOT = "af-project-land1";
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
    <div class="case-scroll-veil" data-case-veil aria-hidden="true"></div>`;

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

  const bindChrome = (root) => {
    const top = root.querySelector("[data-case-top]");
    let veil = root.querySelector("[data-case-veil]");
    if (veil && veil.parentElement !== document.body) {
      document.body.appendChild(veil);
    }
    if (!top && !veil) return;

    const paint = () => {
      const y = window.scrollY || 0;
      if (top) top.hidden = y < Math.min(420, window.innerHeight * 0.55);
      // Keep the fold fade until the first hero has been opened
      if (veil) veil.classList.toggle("is-gone", y > window.innerHeight * 0.45);
    };

    top?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", paint, { passive: true });
    paint();
  };

  const mount = async () => {
    const root = document.querySelector(rootSel);
    if (!root) return;
    const slug = root.getAttribute("data-project-case") || document.body.dataset.slug;
    if (!slug) return;
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
