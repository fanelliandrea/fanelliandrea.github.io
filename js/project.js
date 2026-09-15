/* Project page renderer. Each /work/*.html sets body[data-slug]. */
(() => {
const runProject = async () => {
  const { $, $$, esc, thumb, data } = window.Site;
  const slug = document.body.dataset.slug;
  const root = $('#project');
  if (!slug || !root) return;

  const [projects, entries] = await Promise.all([
    fetch('/content/projects.json').then(r => r.json()),
    data,
  ]);
  const p = projects[slug];
  if (!p) { root.innerHTML = '<p class="prose">This project is not on file.</p>'; return; }

  const work = entries.filter(e => e.onSite !== false && e.kind !== 'writing');
  const i = work.findIndex(e => e.slug === slug);
  const next = work[(i + 1) % work.length];
  const prev = work[(i - 1 + work.length) % work.length];
  const hero = p.hero || work[i]?.media?.[0];

  const facts = [
    ['Type', p.type],
    ['When', p.when],
    ['Role & responsabilities', (p.role || []).join('\n')],
    ['Team', (p.team || []).join('\n')],
  ].filter(([, v]) => v);

  const sections = (p.sections || []).map(s => {
    const h = s.h ? `<h2>${esc(s.h)}</h2>` : '';
    const h3 = s.h3 ? `<h3>${esc(s.h3)}</h3>` : '';
    const paras = (s.paras || []).map(t => `<p>${esc(t)}</p>`).join('');
    const links = (s.links || []).map(l => `<p><a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a></p>`).join('');
    return h + h3 + paras + links;
  }).join('');

  document.title = `${p.title} — Andrea Fanelli`;

  root.innerHTML = `
    <header class="p-hero">
      ${hero ? `<img src="${esc(thumb(hero, 2400))}" alt="">` : ''}
    </header>
    <div class="p-copy rise">
      <span class="kicker">${esc(p.type || '')}</span>
      <h1>${esc(p.title)}</h1>
    </div>
    ${p.lede ? `<p class="lede-block">${esc(p.lede)}</p>` : ''}
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v).replace(/\n/g, '<br>')}</dd></div>`).join('')}</dl>
    <div class="prose">${p.intro ? `<p>${esc(p.intro)}</p>` : ''}${sections}</div>
    <nav class="next" aria-label="Next projects">
      <div><span class="kicker">Previous</span>${prev ? `<a href="${esc(prev.href)}">${esc(prev.title)}</a>` : ''}</div>
      <div style="text-align:right"><span class="kicker">Next</span>${next ? `<a href="${esc(next.href)}">${esc(next.title)}</a>` : ''}</div>
    </nav>`;

  if (window.gsap && !window.Site.reduced && window.SplitText && window.ScrollTrigger) {
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
                { x: i => (i - mid) * spread, opacity: 0.28 },
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
addEventListener('site:page', () => { runProject(); });
})();
