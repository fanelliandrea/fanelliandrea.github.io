/* 064 — work stills scatter into a 3D cloud; scroll flies the camera on Z. */
(() => {
  const Z_STEP = 320;
  let ctx = null;
  let seq = 0;
  let onResize = null;
  const golden = Math.PI * (3 - Math.sqrt(5));

  const kill = () => {
    seq += 1;
    if (onResize) removeEventListener('resize', onResize);
    onResize = null;
    try { ctx?.revert(); } catch {}
    ctx = null;
  };

  const pose = (i, n, mobile) => {
    const k = i + 1.2;
    const a = k * golden + 0.45;
    const r = 7 + Math.sqrt(k) * (mobile ? 7.5 : 9.5);
    return {
      x: Math.cos(a) * r * (mobile ? 0.78 : 0.86),
      y: Math.sin(a * 1.08) * r * (mobile ? 0.42 : 0.46),
      z: -50 - i * Z_STEP + (i % 2 ? -36 : 20),
      rx: Math.sin(a) * 8,
      ry: Math.cos(a) * (mobile ? 9 : 16),
      portrait: i % 3 !== 1,
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
    const travel = (N - 1) * Z_STEP + 520;
    track.style.height = `${Math.max(480, 80 + N * 48)}vh`;

    ctx = gsap.context(() => {
      gsap.set(world, { transformStyle: 'preserve-3d', force3D: true, z: 0, rotationX: 0, rotationY: 0 });
      gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%', force3D: true });

      const placeXY = () => {
        const w = innerWidth, h = innerHeight;
        cards.forEach((card, i) => {
          const p = poses[i];
          gsap.set(card, { x: (p.x / 100) * w, y: (p.y / 100) * h });
        });
      };

      const cam = { z: 0 };
      const paint = () => {
        gsap.set(world, { z: cam.z });
        cards.forEach((card, i) => {
          const rel = (gsap.getProperty(card, 'z') || 0) + cam.z;
          let opacity = 1;
          if (rel > 180) opacity = Math.max(0, 1 - (rel - 180) / 360);
          else if (rel < -2200) opacity = Math.max(0.12, 1 - (-rel - 2200) / 900);
          card.style.opacity = String(opacity);
          card.style.pointerEvents = opacity < 0.28 || rel > 160 ? 'none' : 'auto';
          const mid = Math.abs(rel + 60);
          if (pills[i]) pills[i].style.opacity = String(mid < 400 && opacity > 0.45 ? 1 - mid / 500 : 0);
        });
        if (hint) hint.style.opacity = String(Math.max(0, 1 - cam.z / 280));
      };

      placeXY();
      cards.forEach((card, i) => {
        const p = poses[i];
        gsap.set(card, { z: p.z - 2000, rotationX: 28, rotationY: p.ry * 1.6 });
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
          rx(((e.clientY - r.top) / r.height - 0.5) * -6);
          ry(((e.clientX - r.left) / r.width - 0.5) * 8);
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
