/* 109 — ideas as a two-way accordion of squircles.
   One essay stays open, its image behind a dark glass Journal widget;
   the rest fold into strips with a rotated title. The widget slides in
   from the side you came from. */
(async () => {
  const { $, $$, reduced, esc, pad, thumb, date, data } = window.Site;
  const root = $('#ideas-acc');
  if (!root || !window.gsap) return;

  const all = 'all' in root.dataset;
  const essays = (await data)
    .filter(e => e.kind === 'writing' && e.onSite !== false && e.media?.length)
    .filter(e => all || e.homeIdea)
    .sort((a, b) => all ? a._i - b._i : a.homeIdea - b.homeIdea);
  root.innerHTML = essays.map((e, i) => `<article class="acc-panel sq">
      <button class="acc-strip" type="button" aria-expanded="false" aria-controls="idea-${i}">
        <span class="num">${pad(i + 1)}</span>
        <span class="acc-label">${esc(e.title)}</span>
        <span class="num">${e.year ? String(e.year).slice(2) : '—'}</span>
      </button>
      <div class="acc-content" id="idea-${i}">
        <div class="acc-media"><img src="${esc(thumb(e.media[0], 1200))}" alt="" decoding="async"></div>
        <div class="acc-copy widget sq">
          <span class="kicker">Journal</span>
          <span class="num">${e.date ? date(e.date) : e.year ?? '—'}</span>
          <h3>${esc(e.title)}</h3>
          ${e.href ? `<a class="btn" href="${esc(e.href)}">Read</a>` : ''}
        </div>
      </div>
    </article>`).join('');

  const panels = $$('.acc-panel', root).map(p => ({
    el: p, strip: $('.acc-strip', p), content: $('.acc-content', p),
    media: $('.acc-media', p), copy: $('.acc-copy', p),
  }));
  const M = reduced ? 0 : 1;                     // movement off under reduced motion; fades stay
  let cur = -1, tl;

  function open(i, animate = true) {
    if (i === cur) return;
    const dir = cur < 0 ? 0 : Math.sign(i - cur);
    cur = i;
    tl?.kill();
    tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    panels.forEach((p, j) => {
      const on = j === i;
      p.el.classList.toggle('is-open', on);
      p.strip.setAttribute('aria-expanded', on);
      p.content.inert = !on;
      tl.to(p.el, { flexGrow: on ? 8 : 1, duration: 0.8 * M, ease: 'power3.inOut' }, 0);
      tl.to(p.strip, { autoAlpha: on ? 0 : 1, duration: on ? 0.2 : 0.4 }, on ? 0 : 0.35 * M);
      if (!on) tl.to([p.media, p.copy], { autoAlpha: 0, duration: 0.25 }, 0);
    });
    const p = panels[i];
    tl.fromTo(p.media, { autoAlpha: 0, scale: 1 + 0.08 * M }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'expo.out' }, 0.15 * M)
      .fromTo(p.copy, { autoAlpha: 0, x: -dir * 60 * M, scale: 1 - 0.04 * M }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.8, ease: 'expo.out' }, 0.3 * M);
    if (!animate) tl.progress(1);
  }

  panels.forEach((p, j) => p.strip.addEventListener('click', () => open(j)));
  open(0, false);
})();
