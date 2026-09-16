/* 064 — work stills scatter into a 3D cloud; scroll flies the camera on Z. */
(() => {
  let ctx = null;
  let seq = 0;
  let onResize = null;

  const unit = (i, s) => {
    const n = Math.sin(i * 127.13 + s * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const sCurve = t => {
    const x = t < 0 ? 0 : t > 1 ? 1 : t;
    return x * x * (3 - 2 * x);
  };

  const kill = () => {
    seq += 1;
    if (onResize) removeEventListener('resize', onResize);
    onResize = null;
    try { ctx?.revert(); } catch {}
    ctx = null;
  };

  /* Loose OS board — mix of sizes, spread across the screen like Her. */
  const BOARD = [
    { ux: -0.72, uy: -0.42, s: 0.64, portrait: false },
    { ux: -0.28, uy: -0.48, s: 0.48, portrait: true },
    { ux:  0.22, uy: -0.38, s: 0.42, portrait: false },
    { ux:  0.62, uy: -0.44, s: 0.38, portrait: true },
    { ux:  0.82, uy: -0.06, s: 0.34, portrait: true },
    { ux: -0.68, uy:  0.08, s: 0.56, portrait: true },
    { ux: -0.12, uy:  0.12, s: 0.50, portrait: false },
    { ux:  0.48, uy:  0.10, s: 0.44, portrait: false },
    { ux: -0.38, uy:  0.46, s: 0.88, portrait: false },
    { ux:  0.58, uy:  0.44, s: 0.50, portrait: true },
  ];
  const DEPTH = [2, 0, 5, 1, 7, 3, 8, 4, 6, 9];

  const pose = (i, n, mobile) => {
    const b = BOARD[i % BOARD.length];
    const d = DEPTH[i % DEPTH.length];
    const jx = (unit(i, 1) - 0.5) * 0.1;
    const jy = (unit(i, 2) - 0.5) * 0.08;
    return {
      ux: b.ux + jx,
      uy: (mobile ? b.uy * 0.9 : b.uy) + jy,
      s: b.s * (mobile ? 0.92 : 1) * (0.94 + unit(i, 3) * 0.12),
      z: -200 - d * 150 - unit(i, 4) * 50,
      rx: (unit(i, 5) - 0.5) * 8,
      ry: (unit(i, 6) - 0.5) * 14,
      portrait: b.portrait,
    };
  };

  const boot = async () => {
    kill();
    const my = seq;
    const site = window.Site;
    const root = document.querySelector('[data-effect-064]');
    if (!site || !root || document.body.dataset.page !== 'work' || document.body.dataset.slug) return;

    const { esc, pad, thumb, data, reduced, fine } = site;
    const items = (await data).filter(e => e.onSite !== false && e.kind !== 'writing' && e.media?.length);
    if (my !== seq || !items.length) return;

    const track = root.querySelector('.fx064-track') || root;
    const stage = root.querySelector('.fx064-stage');
    const world = root.querySelector('.fx064-world');
    const hint = root.querySelector('.fx064-hint');
    if (!stage || !world) return;

    if (reduced || !window.gsap) {
      root.classList.add('gather', 'stills', 'fx064-flat');
      track.style.height = 'auto';
      world.innerHTML = items.map((e, i) => {
        const href = e.href ? ` href="${esc(e.href)}"` : '';
        const tag = e.href ? 'a' : 'article';
        const n = e.homeWork || i + 1;
        return `<${tag} class="piece piece-${n} still"${href}>
          <span class="shot sq"><img src="${esc(thumb(e.media[0], 1600))}" alt=""></span>
          <span class="pill">${esc(pad(n))} ${esc(e.title)}</span>
        </${tag}>`;
      }).join('');
      if (hint) hint.hidden = true;
      return;
    }

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const mobile = matchMedia('(max-width: 860px)').matches;
    const N = items.length;
    world.innerHTML = items.map((e, i) => {
      const href = e.href ? ` href="${esc(e.href)}"` : '';
      const tag = e.href ? 'a' : 'article';
      const p = pose(i, N, mobile);
      const n = e.homeWork || i + 1;
      return `<${tag} class="fx064-card${p.portrait ? ' is-portrait' : ' is-land'}"${href} aria-label="${esc(e.title)}">
        <span class="fx064-shot sq"><img src="${esc(thumb(e.media[0], 900))}" alt="" decoding="async" draggable="false"></span>
        <span class="fx064-pill">${esc(pad(n))} ${esc(e.title)}</span>
      </${tag}>`;
    }).join('');

    const cards = [...world.querySelectorAll('.fx064-card')];
    const pills = cards.map(c => c.querySelector('.fx064-pill'));
    const poses = cards.map((_, i) => pose(i, N, mobile));
    const farthest = Math.max(...poses.map(p => -p.z));
    const travel = farthest + 560;
    track.style.height = `${Math.max(560, 90 + N * 62)}vh`;

    ctx = gsap.context(() => {
      gsap.set(world, { transformStyle: 'preserve-3d', force3D: true, z: 0, rotationX: 0, rotationY: 0 });
      gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%', force3D: true });

      const lens = () => {
        const fov = 2 * Math.atan(18 / 35);
        stage.style.perspective = `${Math.round((innerWidth / 2) / Math.tan(fov / 2))}px`;
      };

      const bases = cards.map(() => ({ x: 0, y: 0 }));
      const placeXY = () => {
        lens();
        const w = innerWidth, h = innerHeight;
        const padX = matchMedia('(max-width: 860px)').matches ? 0.4 : 0.48;
        const padY = matchMedia('(max-width: 860px)').matches ? 0.36 : 0.42;
        cards.forEach((card, i) => {
          const p = poses[i];
          bases[i].x = p.ux * w * padX;
          bases[i].y = p.uy * h * padY;
          gsap.set(card, { x: bases[i].x, y: bases[i].y, scale: p.s });
        });
      };

      const cam = { z: 0 };
      const shots = cards.map(c => c.querySelector('.fx064-shot'));
      const maxBlur = mobile ? 6 : 9;
      const dof = rel => {
        if (rel > 24) return 0;
        const d = 30 - rel;
        if (d < 220) return 0;
        const t = Math.min(1, (d - 220) / 1800);
        return Math.round(sCurve(t) * maxBlur * 2) / 2;
      };
      const paint = () => {
        gsap.set(world, { z: cam.z });
        const room = Math.min(innerWidth, innerHeight);
        const fadeFrom = room * 0.72;
        const fadeTo = room * 1.12;
        cards.forEach((card, i) => {
          const rel = (gsap.getProperty(card, 'z') || 0) + cam.z;
          let opacity = 1;
          const box = card.getBoundingClientRect();
          const span = Math.max(box.width, box.height);
          if (span > fadeFrom) opacity = 1 - sCurve((span - fadeFrom) / (fadeTo - fadeFrom));
          else if (rel < -4800) opacity = Math.max(0.2, 1 - sCurve((-rel - 4800) / 1400));
          const gone = opacity < 0.02;
          card.style.opacity = gone ? '0' : String(Math.max(0, opacity));
          card.style.pointerEvents = gone || opacity < 0.32 ? 'none' : 'auto';
          const blur = gone ? 0 : dof(rel);
          const shot = shots[i];
          if (shot) shot.style.filter = blur ? `blur(${blur}px)` : 'none';
          const mid = Math.abs(rel + 20);
          if (pills[i]) pills[i].style.opacity = String(!gone && mid < 380 && opacity > 0.55 && blur < 2 ? 1 - mid / 480 : 0);
        });
        if (hint) hint.style.opacity = String(Math.max(0, 1 - sCurve(cam.z / 320)));
      };

      placeXY();
      const PUSH = 480;
      cards.forEach((card, i) => {
        const p = poses[i];
        gsap.set(card, { z: p.z - PUSH, rotationX: p.rx, rotationY: p.ry });
      });
      paint();

      const land = gsap.timeline({ defaults: { ease: 'back.out(1.25)' }, onUpdate: paint });
      cards.forEach((card, i) => {
        land.to(card, { z: poses[i].z, duration: 1.15 }, 0);
      });
      if (hint) land.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.25);

      if (window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.65,
          onUpdate: self => {
            cam.z = self.progress * travel;
            paint();
          },
        });
      }

      if (fine) {
        const rx = gsap.quickTo(world, 'rotationX', { duration: 1.15, ease: 'power3.out' });
        const ry = gsap.quickTo(world, 'rotationY', { duration: 1.15, ease: 'power3.out' });
        stage.addEventListener('pointermove', e => {
          const r = stage.getBoundingClientRect();
          rx(((e.clientY - r.top) / r.height - 0.5) * -3);
          ry(((e.clientX - r.left) / r.width - 0.5) * 4);
        });
        stage.addEventListener('pointerleave', () => { rx(0); ry(0); });
      }

      onResize = () => {
        const m = matchMedia('(max-width: 860px)').matches;
        cards.forEach((_, i) => { poses[i] = pose(i, N, m); });
        placeXY();
        cards.forEach((card, i) => gsap.set(card, { z: poses[i].z, rotationX: poses[i].rx, rotationY: poses[i].ry }));
        paint();
        window.ScrollTrigger?.refresh?.();
      };
      addEventListener('resize', onResize);
    }, root);
  };

  addEventListener('site:page', boot);
})();
