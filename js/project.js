/* Project pages. case-bs2 renderer for /work/*.html */
(() => {
  if (window.__afProjectBs2) return;
  window.__afProjectBs2 = true;

  const BOOT = 'af-project-bs2';
  const CASE_CSS = '/css/project-case.css?v=case-bs2';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const paras = (lines = []) => lines.filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('');

  const figure = item => {
    if (!item?.src) return '';
    const layout = item.layout === 'full' ? 'full' : 'squircle';
    return `<figure class="case-media case-media--${esc(layout)} sq">
      <img src="${esc(item.src)}" alt="${esc(item.alt || '')}" loading="lazy" decoding="async">
    </figure>`;
  };

  const details = (map = {}) => {
    const rows = Object.entries(map);
    if (!rows.length) return '';
    return `<dl class="case-details">${rows.map(([k, v]) => `<div>
      <dt>${esc(k)}</dt>
      <dd>${esc(v).replace(/\n/g, '<br>')}</dd>
    </div>`).join('')}</dl>`;
  };

  const blockHtml = block => {
    if (!block) return '';
    if (block.type === 'media') return figure(block);
    if (block.type === 'section') {
      const media = (block.media || []).map(figure).join('');
      return `<section class="case-section">
        <header class="case-section__copy">
          <h2>${esc(block.title)}</h2>
          <div class="case-prose">${paras(block.body)}</div>
        </header>
        ${media ? `<div class="case-section__media">${media}</div>` : ''}
      </section>`;
    }
    return '';
  };

  const thumbOf = p => {
    if (!p) return '';
    if (p.hero && typeof p.hero === 'object') return p.hero.src || '';
    if (typeof p.hero === 'string') return p.hero;
    return '';
  };

  const roleOf = p => {
    if (!p) return '';
    if (Array.isArray(p.role)) return p.type || p.role[0] || '';
    return p.role || p.type || '';
  };

  const yearOf = p => p?.yearLabel || p?.year || '';

  const nextHtml = (slugs, catalog, register) => {
    const cards = (slugs || []).map(slug => {
      const p = catalog[slug];
      const r = (register || []).find(e => e.slug === slug);
      if (!p && !r) return '';
      const title = p?.title || r?.title || slug;
      const role = roleOf(p) || r?.role || '';
      const href = p?.href || r?.href || `/work/${slug}.html`;
      const thumb = thumbOf(p) || r?.media?.[0] || '';
      return `<a class="case-next__card sq" href="${esc(href)}">
        ${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : ''}
        <span>
          <b>${esc(title)}</b>
          <i>${esc(role)}</i>
        </span>
      </a>`;
    }).filter(Boolean).join('');
    if (!cards) return '';
    return `<section class="case-next" aria-label="Next projects">
      <h2>Next projects</h2>
      <div class="case-next__row">${cards}</div>
    </section>`;
  };

  const renderCase = (project, register, catalog) => {
    const hero = project.hero && typeof project.hero === 'object' ? project.hero : { src: project.hero || '', alt: project.title };
    const year = yearOf(project);
    const cta = project.cta
      ? `<p class="case-cta"><a href="${esc(project.cta.href)}" rel="noopener" target="_blank">${esc(project.cta.label)}</a></p>`
      : '';
    return `
      <section class="case-hero" aria-label="${esc(project.title)} hero">
        <img src="${esc(hero.src || '')}" alt="${esc(hero.alt || project.title)}" fetchpriority="high">
      </section>
      <section class="case-intro">
        <p class="case-eyebrow"><a href="/work.html">Work</a></p>
        <h1>${esc(project.title)}${year ? `, ${esc(year)}` : ''}</h1>
        <p class="case-meta">${esc([project.client, roleOf(project)].filter(Boolean).join(' · '))}</p>
        <div class="case-prose case-prose--lead">${paras(project.lead)}</div>
        ${cta}
        ${details(project.details)}
      </section>
      <div class="case-body">
        ${(project.blocks || []).map(blockHtml).join('')}
      </div>
      ${nextHtml(project.next, catalog, register)}
    `;
  };

  const ensureCaseCss = () => {
    if (document.querySelector('link[data-case-bs2]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CASE_CSS;
    link.dataset.caseBs2 = '1';
    document.head.append(link);
  };

  let catalogPromise;
  const loadCatalog = () => {
    if (!catalogPromise) {
      catalogPromise = fetch('/content/projects.json?v=case-bs2', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const catalog = d.projects && typeof d.projects === 'object' && !d.title ? { ...d.projects } : { ...d };
          delete catalog._note;
          window.__AF_PROJECTS__ = catalog;
          return catalog;
        })
        .catch(() => ({}));
    }
    return catalogPromise;
  };

  const mountCase = async () => {
    const root = document.querySelector('[data-project-case]');
    if (!root) return;
    const slug = root.getAttribute('data-project-case') || document.body.dataset.slug;
    if (!slug) return;
    if (root.dataset.boot === BOOT && root.dataset.caseSlug === slug && root.querySelector('.case-body')) return;

    ensureCaseCss();
    delete document.body.dataset.layout;

    const [catalog, register] = await Promise.all([
      loadCatalog(),
      (window.Site?.data || fetch('/content/register.json').then(r => r.json()).then(d => d.entries)).catch(() => []),
    ]);

    const project = catalog[slug];
    if (!project || !project.blocks) {
      root.innerHTML = '<section class="case-intro"><p class="case-prose">Project not found.</p></section>';
      return;
    }

    root.dataset.boot = BOOT;
    root.dataset.caseSlug = slug;
    root.removeAttribute('aria-busy');
    root.innerHTML = renderCase(project, register, catalog);
    document.title = `${project.title} — Andrea Fanelli`;

    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const nodes = root.querySelectorAll('.case-intro, .case-section, .case-media, .case-next');
      gsap.fromTo(nodes, { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.06, ease: 'power3.out', clearProps: 'transform',
      });
    }
  };

  const boot = () => { mountCase(); };
  addEventListener('site:page', boot);
  addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
