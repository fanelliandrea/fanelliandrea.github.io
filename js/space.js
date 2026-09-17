/* Arrival in the field. Homepage sky walks from morning to sunset on scroll. */
(() => {
  const tilt = (el, max = 5) => {
    const site = window.Site;
    if (!site || !window.gsap || site.reduced || !site.fine) return;
    gsap.set(el, { transformPerspective: 1600, transformStyle: 'preserve-3d' });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 1.35, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 1.35, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * max);
      rx(-((e.clientY - r.top) / r.height - .5) * (max * .6));
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  };

  const land = () => {
    const site = window.Site;
    if (!site) return;
    document.body.classList.add('lit', 'arrived');

    if (reduced || !window.gsap) return;

    const field = $('.field');
    const wisps = $$('.wisp');
    if (field) gsap.set(field, { opacity: 0 });
    gsap.set(wisps, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    if (field) tl.to(field, { opacity: 1, duration: 1.4 }, 0);
    tl.to(wisps, { opacity: .28, duration: 1.6, stagger: .2 }, .15);
  };

  const clamp01 = n => Math.min(1, Math.max(0, n));
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  };
  const along = (stops, t) => {
    const n = stops.length - 1;
    const x = clamp01(t) * n;
    const i = Math.min(n - 1, Math.floor(x));
    return mix(stops[i], stops[i + 1], x - i);
  };

  /* Landing stays Info. Scroll bleaches into shujaat-like pastels; sunset is only a blush. */
  const hours = {
    c0: ['#eaf4fb', '#f4f7fc', '#f3f2fb', '#f8f3f4'],
    c1: ['#9cc9ea', '#d5e4f2', '#d7d5f5', '#edd6f0'],
    c2: ['#5aa0d4', '#c5d6e8', '#d4dff5', '#ead5dc'],
    c3: ['#3d86be', '#b4c8dc', '#c8cce8', '#e0cdd4'],
    day: ['#6eafd8', '#d4e2ee', '#dcdcf2', '#eee2e6'],
  };

  const day = () => {
    const site = window.Site;
    if (!site || document.body.dataset.page !== 'home') return;
    const root = document.body;

    const paint = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const raw = site.reduced ? 0 : clamp01(scrollY / max);
      const t = Math.pow(raw, .72);
      root.style.setProperty('--c0', along(hours.c0, t));
      root.style.setProperty('--c1', along(hours.c1, t));
      root.style.setProperty('--c2', along(hours.c2, t));
      root.style.setProperty('--c3', along(hours.c3, t));
      root.style.setProperty('--day', along(hours.day, t));
    };

    addEventListener('scroll', paint, { passive: true });
    paint();
    site.day = paint;
  };

  const stillsIn = () => {
    const site = window.Site;
    if (!site) return;
    const stills = site.$$('.still');
    if (!stills.length) return;
    if (site.reduced) {
      stills.forEach(el => el.classList.add('in'));
      return;
    }
    const reveal = () => {
      stills.forEach(el => {
        if (el.classList.contains('in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * .94) el.classList.add('in');
      });
    };
    addEventListener('scroll', reveal, { passive: true });
    reveal();
    site.day?.();
  };

  const boot = () => {
    if (document.body.dataset.page === 'home') {
      land();
    }
    const site = window.Site;
    if (!site || !window.gsap || site.reduced || !site.fine) return;
    const veil = site.$('#menu');
    if (!veil) return;
    const links = site.$$('nav a', veil);
    if (!links.length) return;
    links.forEach(a => gsap.set(a, { transformPerspective: 800 }));
    veil.addEventListener('pointermove', e => {
      links.forEach(a => {
        const r = a.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        gsap.to(a, { rotationY: dx * 10, duration: .8, ease: 'power3.out', overwrite: 'auto' });
      });
    });
  };

  addEventListener('site:stills', () => {
    const site = window.Site;
    stillsIn();
    if (!site?.fine || site.reduced || !window.gsap) return;
    site.$$('.still .shot').forEach(el => {
      if (el.dataset.tilt) return;
      el.dataset.tilt = '1';
      tilt(el, 4);
    });
  });

  setTimeout(() => document.body.classList.add('arrived', 'lit'), 180);

  if (document.readyState !== 'loading') boot();
  else addEventListener('DOMContentLoaded', boot);
})();
