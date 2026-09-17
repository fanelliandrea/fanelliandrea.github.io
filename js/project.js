/* Project pages. Case layout (Glyph Toys) + classic renderer for other work/*.html */
(() => {
  if (window.__afProjectSky3) return;
  window.__afProjectSky3 = true;

  const BOOT = 'af-project-sky3';
  const CASE_CSS = '/css/project-case.css?v=case-sky3';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const paras = (lines = []) => lines.filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('');

  const figure = item => {
    if (!item?.src) return '';
    const layout = item.layout || 'squircle';
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
    const cta = project.cta
      ? `<p class="case-cta"><a href="${esc(project.cta.href)}" rel="noopener" target="_blank">${esc(project.cta.label)}</a></p>`
      : '';
    return `
      <section class="case-hero" aria-label="${esc(project.title)} hero">
        <img src="${esc(hero.src || '')}" alt="${esc(hero.alt || project.title)}" fetchpriority="high">
      </section>
      <section class="case-intro">
        <p class="case-eyebrow"><a href="/work.html">Work</a> / ${esc(project.year || '')}</p>
        <h1>${esc(project.title)}</h1>
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
    if (document.querySelector('link[data-case-sky]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CASE_CSS;
    link.dataset.caseSky = '1';
    document.head.append(link);
  };

  let catalogPromise;
  const loadCatalog = () => {
    if (!catalogPromise) {
      catalogPromise = fetch('/content/projects.json?v=case-sky3', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const catalog = d.projects && typeof d.projects === 'object' && !d.title ? { ...d, ...d.projects } : d;
          /* Prefer nested case objects when present, keep flat keys for other work pages. */
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

  const runClassic = async () => {
    const site = window.Site;
    if (!site) return;
    const { $, $$, esc: sEsc, thumb, data } = site;
    const slug = document.body.dataset.slug;
    const root = $('#project');
    if (!slug || !root) return;

    const [projects, entries] = await Promise.all([
      loadCatalog(),
      data,
    ]);
    const p = projects[slug];
    if (!p) { root.innerHTML = '<p class="prose">This project is not on file.</p>'; return; }
    if (p.blocks) return;

    const work = entries.filter(e => e.onSite !== false && e.kind !== 'writing');
    const i = work.findIndex(e => e.slug === slug);
    const next = work[(i + 1) % work.length];
    const prev = work[(i - 1 + work.length) % work.length];
    const hero = (typeof p.hero === 'string' ? p.hero : p.hero?.src) || work[i]?.media?.[0];

    const facts = [
      ['Type', p.type],
      ['When', p.when],
      ['Role & responsabilities', Array.isArray(p.role) ? p.role.join('\n') : p.role],
      ['Team', (p.team || []).join('\n')],
    ].filter(([, v]) => v);

    const sections = (p.sections || []).map(s => {
      const h = s.h ? `<h2>${sEsc(s.h)}</h2>` : '';
      const h3 = s.h3 ? `<h3>${sEsc(s.h3)}</h3>` : '';
      const para = (s.paras || []).map(t => `<p>${sEsc(t)}</p>`).join('');
      const links = (s.links || []).map(l => `<p><a href="${sEsc(l.href)}" rel="noopener">${sEsc(l.label)}</a></p>`).join('');
      return h + h3 + para + links;
    }).join('');

    document.title = `${p.title} — Andrea Fanelli`;
    delete document.body.dataset.layout;
    root.innerHTML = `
    <header class="p-hero">
      ${hero ? `<img src="${sEsc(thumb(hero, 2400))}" alt="">` : ''}
    </header>
    <div class="p-copy rise">
      <span class="kicker">${sEsc(p.type || '')}</span>
      <h1>${sEsc(p.title)}</h1>
    </div>
    ${p.lede ? `<p class="lede-block">${sEsc(p.lede)}</p>` : ''}
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${sEsc(k)}</dt><dd>${sEsc(v).replace(/\n/g, '<br>')}</dd></div>`).join('')}</dl>
    <div class="prose">${p.intro ? `<p>${sEsc(p.intro)}</p>` : ''}${p.note ? `<p>${sEsc(p.note)}</p>` : ''}${sections}</div>
    <nav class="next" aria-label="Next projects">
      <div><span class="kicker">Previous</span>${prev ? `<a href="${sEsc(prev.href)}">${sEsc(prev.title)}</a>` : ''}</div>
      <div style="text-align:right"><span class="kicker">Next</span>${next ? `<a href="${sEsc(next.href)}">${sEsc(next.title)}</a>` : ''}</div>
    </nav>`;

    if (window.gsap && !site.reduced && window.SplitText && window.ScrollTrigger) {
      Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(() => {
        $$('.prose p').forEach(pEl => {
          let triggers = [];
          SplitText.create(pEl, {
            type: 'lines,words', linesClass: 'ln', wordsClass: 'wd', autoSplit: true,
            onSplit(self) {
              triggers.forEach(t => t.kill(true));
              const spread = Math.min(22, innerWidth * 0.018);
              triggers = self.lines.map(line => {
                const words = [...line.querySelectorAll('.wd')];
                const mid = (words.length - 1) / 2;
                return gsap.fromTo(words,
                  { x: idx => (idx - mid) * spread, opacity: 0.28 },
                  { x: 0, opacity: 1, ease: 'none',
                    scrollTrigger: { trigger: line, start: 'top 96%', end: 'top 58%', scrub: 0.6 } }
                ).scrollTrigger;
              });
            },
          });
        });
      });
    }
  };

  const boot = () => { mountCase(); runClassic(); };
  addEventListener('site:page', boot);
  addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
