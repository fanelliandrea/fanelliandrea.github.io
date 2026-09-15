/* Chrome + image lists. Copy stays from the live site. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const KIND = { object: 'Product Design', brand: 'Brand Design', film: 'Film', web: 'Web', writing: 'Writing' };
  const label = e => e.role || KIND[e.kind] || e.kind;
  const yearOf = e => e.yearLabel || e.year || '—';
  const thumb = (u, w = 1600) => (!u ? '' : /\.gif$/i.test(u) ? u : `${u}?scale-down-to=${w}`);
  const date = iso => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y.slice(2)}`;
  };
  const page = document.body.dataset.page || '';
  const romeClock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
  const romeDay = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'short' });
  const tick = () => {
    const now = new Date();
    const t = romeClock.format(now);
    const d = romeDay.format(now);
    $$('[data-clock]').forEach(el => { el.textContent = t; });
    $$('[data-os-clock]').forEach(el => { el.textContent = t; });
    $$('[data-os-day]').forEach(el => { el.textContent = d; });
  };
  tick();
  setInterval(tick, 1000);

  const data = fetch('/content/register.json').then(r => r.json()).then(d => d.entries
    .map((e, i) => ({ ...e, _i: i }))
    .sort((a, b) => (b.sort ?? b.year ?? -Infinity) - (a.sort ?? a.year ?? -Infinity) || a._i - b._i));

  if (window.gsap) gsap.registerPlugin(...[window.ScrollTrigger, window.SplitText].filter(Boolean));
  window.Site = { $, $$, reduced, fine, esc, pad, thumb, date, KIND, label, yearOf, data, tick };

  if (!$('.sky')) {
    const sky = document.createElement('div');
    sky.className = 'sky';
    sky.setAttribute('aria-hidden', 'true');
    sky.innerHTML = '<div class="field"></div><i class="wisp wisp-a"></i><i class="wisp wisp-b"></i>';
    document.body.prepend(sky);
  }

  const hud = $('#hud');
  if (hud && !hud.innerHTML.trim()) {
    hud.innerHTML = `
      <a class="hud-mark" href="/">af</a>
      <p class="hud-meta"><span data-clock></span><span class="sep">·</span>Rome</p>
      <p class="hud-avail">Independent</p>`;
    tick();
  }

  const here = {
    home: page === 'home',
    work: page === 'work',
    ideas: page === 'ideas',
    info: page === 'info',
  };
  if (!$('.dock')) {
    const dock = document.createElement('nav');
    dock.className = 'dock sq';
    dock.setAttribute('aria-label', 'Primary');
    dock.innerHTML = `
      <a href="/"${here.home ? ' aria-current="page"' : ''}>Home</a>
      <a href="/work.html"${here.work ? ' aria-current="page"' : ''}>Work</a>
      <a href="/ideas.html"${here.ideas ? ' aria-current="page"' : ''}>Ideas</a>
      <a href="/info.html"${here.info ? ' aria-current="page"' : ''}>Info</a>
      <a href="mailto:fanelliandrea@outlook.com">Contact</a>`;
    document.body.appendChild(dock);
  }

  const osWork = $('#os-work');
  if (osWork) data.then(entries => {
    const work = entries.filter(e => e.homeWork && e.media?.length).sort((a, b) => a.homeWork - b.homeWork);
    osWork.innerHTML = work.map((e, i) => {
      const href = e.href ? `href="${esc(e.href)}"` : '';
      const tag = e.href ? 'a' : 'article';
      return `<${tag} class="card-3d sq" ${href} style="--i:${i}">
        <img src="${esc(thumb(e.media[0], 900))}" alt="${esc(e.title)}" decoding="async">
        <span class="card-name">${esc(e.title)}</span>
      </${tag}>`;
    }).join('');
    dispatchEvent(new Event('site:os'));
  });

  const osIdeas = $('#os-ideas');
  if (osIdeas) data.then(entries => {
    const notes = entries.filter(e => e.onSite !== false && e.kind === 'writing').slice(0, 3);
    osIdeas.innerHTML = notes.map(e => {
      const href = e.href ? `href="${esc(e.href)}"` : 'href="/ideas.html"';
      return `<a class="idea-row" ${href}><span>${esc(e.title)}</span><span class="idea-y">${esc(e.date ? date(e.date) : yearOf(e))}</span></a>`;
    }).join('');
  });

  const stills = $('#stills');
  if (stills) data.then(entries => {
    const work = entries.filter(e => e.homeWork).sort((a, b) => a.homeWork - b.homeWork);
    stills.classList.add('gather');
    stills.innerHTML = work.map(e => {
      const href = e.href ? ` href="${esc(e.href)}"` : '';
      const img = e.media?.[0];
      const tag = e.href ? 'a' : 'article';
      return `<${tag} class="piece piece-${e.homeWork} still"${href}>
        <span class="shot sq">${img ? `<img src="${esc(thumb(img, 1600))}" alt="">` : ''}</span>
        <span class="pill">${esc(pad(e.homeWork))} ${esc(e.title)}</span>
      </${tag}>`;
    }).join('');
    dispatchEvent(new Event('site:stills'));
  });

  const notes = $('#notes');
  if (notes) data.then(entries => {
    notes.innerHTML = entries.filter(e => e.onSite !== false && e.kind === 'writing').map(e => {
      const href = e.href ? ` href="${esc(e.href)}"` : '';
      const tag = e.href ? 'a' : 'article';
      const img = e.media?.[0];
      return `<${tag} class="note-card"${href}>
        <span class="shot sq">${img ? `<img src="${esc(thumb(img, 900))}" alt="">` : ''}</span>
        <span class="caption"><b>${esc(e.title)}</b><span>${esc(e.date ? date(e.date) : yearOf(e))}</span></span>
      </${tag}>`;
    }).join('');
  });

  const reg = $('#register');
  if (reg) data.then(entries => {
    const list = entries.filter(e => e.onSite !== false);
    reg.innerHTML = list.map(e => {
      const tag = e.href ? 'a' : 'div';
      return `<${tag} class="row"${e.href ? ` href="${esc(e.href)}"` : ''}><span class="year">${esc(yearOf(e))}</span><span>${esc(e.title)}</span><span class="client">${esc(e.client || '—')}</span><span class="kind">${esc(label(e))}</span></${tag}>`;
    }).join('');
  });
})();
