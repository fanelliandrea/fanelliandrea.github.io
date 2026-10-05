/* Project case pages — white field, Satoshi, medium type */
(() => {
  const BOOT = "af-project-light";

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
    return `<figure class="case-media">
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

  const nextHtml = (slugs, catalog, register) => {
    const links = (slugs || [])
      .map((slug) => {
        const p = catalog[slug];
        const r = (register || []).find((e) => e.slug === slug);
        if (!p && !r) return "";
        const title = p?.title || r?.title || slug;
        const href = p?.href || r?.href || `/work/${slug}.html`;
        return `<a class="case-next__card" href="${esc(href)}">${esc(title)}</a>`;
      })
      .filter(Boolean)
      .join("");
    if (!links) return "";
    return `<section class="case-next" aria-label="Next projects">
      <h2>Next</h2>
      <div class="case-next__row">${links}</div>
    </section>`;
  };

  const render = (project, register) => {
    const hero = project.hero || {};
    const cta = project.cta
      ? `<p class="case-cta"><a href="${esc(project.cta.href)}" rel="noopener" target="_blank">${esc(project.cta.label)}</a></p>`
      : "";
    const heroFig = hero.src
      ? `<figure class="case-hero">
        <img src="${esc(hero.src)}" alt="${esc(hero.alt || project.title)}" fetchpriority="high">
      </figure>`
      : "";

    return `
      <section class="case-intro">
        <p class="case-eyebrow"><a href="/work.html">Work</a></p>
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
      ${nextHtml(project.next, window.__AF_PROJECTS__ || {}, register)}
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
    root.innerHTML = render(project, register);
    document.title = `${project.title} — Andrea Fanelli`;
  };

  addEventListener("DOMContentLoaded", mount);
  addEventListener("site:page", mount);
  if (document.readyState !== "loading") mount();
})();
