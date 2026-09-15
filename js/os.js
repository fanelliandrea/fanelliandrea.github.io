/* Home as a room: a desk in the sky, widgets in depth. */
(() => {
  const boot = () => {
    const site = window.Site;
    const os = document.getElementById('os');
    const desk = document.getElementById('desk');
    if (!site || !os || !desk || document.body.dataset.page !== 'home') return;

    const layout = () => {
      const shelf = document.getElementById('os-work');
      if (!shelf) return;
      const cards = [...shelf.children];
      const n = cards.length;
      if (!n) return;
      const mid = (n - 1) / 2;
      const compact = innerWidth < 860;
      cards.forEach((c, i) => {
        const d = i - mid;
        if (compact) {
          c.style.setProperty('--ry', '0deg');
          c.style.setProperty('--tx', '0px');
          c.style.setProperty('--tz', '0px');
          c.style.zIndex = String(i);
          return;
        }
        c.style.setProperty('--ry', `${d * 15}deg`);
        c.style.setProperty('--tx', `${d * 5.1}rem`);
        c.style.setProperty('--tz', `${80 - Math.abs(d) * 52}px`);
        c.style.zIndex = String(20 - Math.abs(Math.round(d)));
      });
    };

    layout();
    addEventListener('site:os', layout);
    addEventListener('resize', layout);

    if (site.reduced || !site.fine || !window.gsap || innerWidth < 860) return;

    gsap.set(desk, { transformPerspective: 1600, transformStyle: 'preserve-3d' });
    const rx = gsap.quickTo(desk, 'rotationX', { duration: 1.5, ease: 'power3.out' });
    const ry = gsap.quickTo(desk, 'rotationY', { duration: 1.5, ease: 'power3.out' });

    os.addEventListener('pointermove', e => {
      const r = os.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      ry(px * 7);
      rx(-py * 4.5);
      const shelf = document.getElementById('os-work');
      if (!shelf || innerWidth < 860) return;
      [...shelf.children].forEach((c, i) => {
        const mid = (shelf.children.length - 1) / 2;
        const d = i - mid;
        c.style.setProperty('--ry', `${d * 15 + px * 6}deg`);
      });
    });

    os.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
      layout();
    });

    site.$$('.widget', desk).forEach(el => {
      const z = Number(el.dataset.depth || 12);
      gsap.set(el, { z, transformStyle: 'preserve-3d' });
    });
  };

  if (document.readyState !== 'loading') boot();
  else addEventListener('DOMContentLoaded', boot);
})();
