/* Case pages — Work projects + Ideas articles share the same layout/UI */
(() => {
  const BOOT = "af-case-ideas1";
  const rootSel = "[data-project-case], [data-article-case]";

  /* Dreamy edge blur — short rim + fold only, center stays crisp */
  const veilLayers = () => {
    const edge = [
      { blur: 2, clear: 91, mid: 97 },
      { blur: 6, clear: 93, mid: 98 },
      { blur: 12, clear: 95, mid: 99 },
    ]
      .map(({ blur, clear, mid }) => {
        const mask = `radial-gradient(ellipse 92% 88% at 50% 48%, transparent ${clear}%, rgba(0,0,0,0.45) ${mid}%, #000 100%)`;
        return `<i class="case-dream__edge" style="-webkit-backdrop-filter:blur(${blur}px);backdrop-filter:blur(${blur}px);-webkit-mask-image:${mask};mask-image:${mask}"></i>`;
      })
      .join("");

    // Bottom fold stays compact (~10–16% of viewport)
    const fold = [0, 1, 2]
      .map((i) => {
        const blur = (2 + i * 5).toFixed(1);
        const h = 10 + i * 3;
        const mask = `linear-gradient(to top, #000 0%, rgba(0,0,0,0.7) 35%, transparent 100%)`;
        return `<i class="case-dream__fold" style="-webkit-backdrop-filter:blur(${blur}px);backdrop-filter:blur(${blur}px);-webkit-mask-image:${mask};mask-image:${mask};height:${h}%"></i>`;
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

  const paras = (lines = []) => {
    const list = Array.isArray(lines)
      ? lines
      : String(lines ?? "")
          .split(/\n+/)
          .map((s) => s.trim());
    return list
      .filter(Boolean)
      .map((t) => `<p>${esc(t)}</p>`)
      .join("");
  };

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

  /* Keep long untitled walls broken into short paragraph groups (2–3 lines) */
  const expandBlocks = (blocks = []) => {
    const out = [];
    for (const block of blocks) {
      if (
        block?.type === "section" &&
        !block.title &&
        Array.isArray(block.body) &&
        block.body.length > 3
      ) {
        const body = block.body.filter(Boolean);
        const media = block.media || [];
        for (let i = 0; i < body.length; i += 2) {
          out.push({
            type: "section",
            title: null,
            body: body.slice(i, i + 2),
            media: i === 0 ? media : [],
          });
        }
        continue;
      }
      out.push(block);
    }
    return out;
  };

  const blockHtml = (block) => {
    if (!block) return "";
    if (block.type === "media") return figure(block);
    if (block.type === "section") {
      const media = (block.media || []).map(figure).join("");
      const title = block.title ? `<h2>${esc(block.title)}</h2>` : "";
      const prose = paras(block.body);
      if (!title && !prose && !media) return "";
      return `<section class="case-section">
        <header class="case-section__copy">
          ${title}
          ${prose ? `<div class="case-prose">${prose}</div>` : ""}
        </header>
        ${media ? `<div class="case-section__media">${media}</div>` : ""}
      </section>`;
    }
    return "";
  };

  const modeOf = () => {
    const page = document.body?.dataset?.page;
    if (page === "ideas") {
      return {
        kind: "ideas",
        indexHref: "/ideas.html",
        indexLabel: "All ideas",
        backLabel: "Back to Ideas",
        pagerLabel: "Ideas",
        pathPrefix: "/ideas/",
        notFound: "Article not found.",
        catalogUrl: "/content/articles.json",
        catalogKey: "articles",
        globalKey: "__AF_ARTICLES__",
        writing: true,
      };
    }
    return {
      kind: "work",
      indexHref: "/work.html",
      indexLabel: "All work",
      backLabel: "Back to Work",
      pagerLabel: "Projects",
      pathPrefix: "/work/",
      notFound: "Project not found.",
      catalogUrl: "/content/projects.json",
      catalogKey: "projects",
      globalKey: "__AF_PROJECTS__",
      writing: false,
    };
  };

  const sequence = (catalog, register, mode) => {
    const list = (register || [])
      .filter((e) => {
        if (!e || !e.slug || !catalog[e.slug] || e.onSite === false) return false;
        if (mode.writing) return e.kind === "writing";
        return e.kind !== "writing";
      })
      .slice();
    list.sort((a, b) => {
      if (mode.writing) {
        return (
          (a.homeIdea ?? 999) - (b.homeIdea ?? 999) ||
          (b.year ?? 0) - (a.year ?? 0) ||
          String(a.title || "").localeCompare(String(b.title || ""))
        );
      }
      return (
        (a.homeWork ?? 999) - (b.homeWork ?? 999) ||
        (b.sort ?? b.year ?? 0) - (a.sort ?? a.year ?? 0)
      );
    });
    const seen = new Set(list.map((e) => e.slug));
    Object.keys(catalog).forEach((slug) => {
      if (!seen.has(slug)) list.push({ slug, title: catalog[slug].title });
    });
    return list.map((e) => e.slug);
  };

  const neighbors = (slug, catalog, register, mode) => {
    const order = sequence(catalog, register, mode);
    if (!order.length) return { prev: null, next: null };
    const i = Math.max(0, order.indexOf(slug));
    const prevSlug = order[(i - 1 + order.length) % order.length];
    const nextSlug = order[(i + 1) % order.length];
    const pack = (s) =>
      s && s !== slug
        ? {
            slug: s,
            title: catalog[s]?.title || s,
            href: catalog[s]?.href || `${mode.pathPrefix}${s}.html`,
          }
        : null;
    if (order.length < 2) return { prev: null, next: null };
    return { prev: pack(prevSlug), next: pack(nextSlug) };
  };

  const pagerHtml = (slug, catalog, register, mode) => {
    const { prev, next } = neighbors(slug, catalog, register, mode);
    return `<nav class="case-pager" aria-label="${esc(mode.pagerLabel)}">
      ${
        prev
          ? `<a class="case-pager__link case-pager__prev" href="${esc(prev.href)}">
          <span>Previous</span>
          <b>${esc(prev.title)}</b>
        </a>`
          : `<span class="case-pager__link is-empty"></span>`
      }
      <a class="case-pager__all" href="${esc(mode.indexHref)}">${esc(mode.indexLabel)}</a>
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

  const chromeHtml = (mode) => `<nav class="case-chrome" aria-label="Case">
      <a class="case-chrome__back" href="${esc(mode.indexHref)}" aria-label="${esc(mode.backLabel)}">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <button type="button" class="case-chrome__top" data-case-top hidden aria-label="Back to top">Top</button>
    </nav>
    <div class="case-scroll-veil" data-case-veil aria-hidden="true">${veilLayers()}</div>`;

  const render = (project, register, catalog, mode) => {
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
      ${chromeHtml(mode)}
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
        ${expandBlocks(project.blocks || []).map(blockHtml).join("")}
      </div>

      ${credits(project.details)}
      ${pagerHtml(project.slug, catalog, register, mode)}
    `;
  };

  const catalogPromises = {};
  const loadCatalog = (mode) => {
    if (!catalogPromises[mode.kind]) {
      catalogPromises[mode.kind] = fetch(mode.catalogUrl)
        .then((r) => r.json())
        .then((d) => {
          const catalog = d[mode.catalogKey] || {};
          window[mode.globalKey] = catalog;
          return catalog;
        })
        .catch(() => ({}));
    }
    return catalogPromises[mode.kind];
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
    const mode = modeOf();
    const root = document.querySelector(
      mode.kind === "ideas" ? "[data-article-case]" : "[data-project-case]"
    );
    const slugAttr =
      mode.kind === "ideas" ? "data-article-case" : "data-project-case";
    const onCase =
      (document.body.dataset.page === mode.kind ||
        (mode.kind === "work" && document.body.dataset.page === "work")) &&
      (document.body.dataset.slug || root?.getAttribute(slugAttr));
    if (!onCase || !root || !document.body.dataset.slug) {
      // Gallery / playlist pages must not keep a leftover veil
      if (!document.body.dataset.slug) killVeil();
      return;
    }
    const slug = root.getAttribute(slugAttr) || document.body.dataset.slug;
    if (!slug) {
      killVeil();
      return;
    }
    if (root.dataset.boot === BOOT && root.dataset.slug === slug && root.childElementCount)
      return;

    const [catalog, register] = await Promise.all([
      loadCatalog(mode),
      (window.Site?.data ||
        fetch("/content/register.json")
          .then((r) => r.json())
          .then((d) => d.entries)
      ).catch(() => []),
    ]);

    const project = catalog[slug];
    if (!project) {
      root.innerHTML = `<section class="case-intro"><p class="case-prose">${esc(
        mode.notFound
      )}</p></section>`;
      return;
    }

    root.dataset.boot = BOOT;
    root.dataset.slug = slug;
    root.removeAttribute("aria-busy");
    root.innerHTML = render(project, register, catalog, mode);
    document.title = `${project.title} — Andrea Fanelli`;
    bindChrome(root);
  };

  addEventListener("DOMContentLoaded", mount);
  addEventListener("site:page", mount);
  if (document.readyState !== "loading") mount();
})();
