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

  const pose = (i, n, mobile) => {
    const gold = Math.PI * (3 - Math.sqrt(5));
    const a = i * gold + (unit(i, 1) - 0.5) * 0.85;
    const r = Math.sqrt((i + 0.55) / n);
    return {
      ux: Math.cos(a) * r,
      uy: Math.sin(a) * r,
      z: -10 - unit(i, 4) * 200 - i * 680,
      rx: (unit(i, 5) - 0.5) * 8,
      ry: (unit(i, 6) - 0.5) * 14,
      portrait: unit(i, 7) > 0.4,
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
        const R = Math.min(w, h) * (matchMedia('(max-width: 860px)').matches ? 0.56 : 0.66);
        cards.forEach((card, i) => {
          const p = poses[i];
          bases[i].x = p.ux * R;
          bases[i].y = p.uy * R;
          gsap.set(card, { x: bases[i].x, y: bases[i].y });
        });
      };

      const cam = { z: 0 };
      const shots = cards.map(c => c.querySelector('.fx064-shot'));
      const maxBlur = mobile ? 10 : 16;
      const dof = rel => {
        if (rel > 24) return 0;
        const d = 30 - rel;
        if (d < 160) return 0;
        const t = Math.min(1, (d - 160) / 3400);
        return Math.round(sCurve(t) * maxBlur * 2) / 2;
      };
      const paint = () => {
        gsap.set(world, { z: cam.z });
        cards.forEach((card, i) => {
          const rel = (gsap.getProperty(card, 'z') || 0) + cam.z;
          let opacity = 1;
          if (rel > -22) opacity = 1 - sCurve((rel + 22) / 200);
          else if (rel < -3600) opacity = Math.max(0.14, 1 - sCurve((-rel - 3600) / 1400));
          const gone = opacity < 0.015;
          card.style.opacity = gone ? '0' : String(Math.max(0, opacity));
          card.style.visibility = gone ? 'hidden' : 'visible';
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
      cards.forEach((card, i) => {
        const p = poses[i];
        gsap.set(card, { z: p.z - 2600, rotationX: 10, rotationY: p.ry * 1.2 });
      });
      paint();

      const land = gsap.timeline({ defaults: { ease: 'back.out(1.45)' } });
      cards.forEach((card, i) => {
        const p = poses[i];
        land.to(card, {
          z: p.z,
          rotationX: p.rx,
          rotationY: p.ry,
          duration: 1.2,
          onUpdate: paint,
        }, 0.05 + i * 0.055);
      });
      if (hint) land.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.4);

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
