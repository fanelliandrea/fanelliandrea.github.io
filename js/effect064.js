/* 064 — work stills scatter into a 3D cloud; scroll flies the camera on Z. */
(() => {
  const Z_STEP = 460;
  const TRACK_VH = 560;
  let ctx = null;
  let seq = 0;
  let onResize = null;

  const kill = () => {
    seq += 1;
    if (onResize) removeEventListener('resize', onResize);
    onResize = null;
    try { ctx?.revert(); } catch {}
    ctx = null;
  };

  const layout = (i, n, mobile) => {
    const gold = Math.PI * (3 - Math.sqrt(5));
    const a = i * gold + 0.35;
    const r = (mobile ? 16 : 22) + Math.sqrt(i + 1) * (mobile ? 9 : 12);
    return {
      x: Math.cos(a) * r * (mobile ? 0.9 : 1.15),
      y: Math.sin(a * 1.12) * r * (mobile ? 0.55 : 0.62),
      z: -i * Z_STEP + ((i % 2) ? -90 : 50),
      rx: Math.sin(a) * 7,
      ry: Math.cos(a) * (mobile ? 10 : 18),
      portrait: i % 3 !== 1,
    };
  };

  const depthStyle = (rel, card, pill) => {
    const near = rel > 220;
    const far = rel < -2400;
    const mid = Math.abs(rel + 180);
    let opacity = 1;
    if (near) opacity = Math.max(0, 1 - (rel - 220) / 380);
    else if (rel < -1400) opacity = Math.max(0.08, 1 - (-rel - 1400) / 1400);
    if (far) opacity = 0;
    const blur = rel < -900 ? Math.min(10, (-rel - 900) / 220) : 0;
    card.style.opacity = String(opacity);
    card.style.filter = blur ? `blur(${blur}px)` : 'none';
    card.style.pointerEvents = opacity < 0.2 || near ? 'none' : 'auto';
    if (pill) pill.style.opacity = String(mid < 420 && opacity > 0.45 ? 1 - mid / 520 : 0);
  };

  const boot = async () => {
    kill();
    const my = seq;
    const site = window.Site;
    const root = document.querySelector('[data-effect-064]');
    if (!site || !root || document.body.dataset.page !== 'work' || document.body.dataset.slug) return;

    const { esc, pad, thumb, data, reduced } = site;
    const items = (await data).filter(e => e.homeWork && e.media?.length).sort((a, b) => a.homeWork - b.homeWork);
    if (my !== seq) return;
    if (!items.length) return;

    const track = root.querySelector('.fx064-track') || root;
    const stage = root.querySelector('.fx064-stage');
    const world = root.querySelector('.fx064-world');
    const hint = root.querySelector('.fx064-hint');
    if (!stage || !world) return;

    if (reduced || !window.gsap) {
      root.classList.add('gather', 'stills', 'fx064-flat');
      track.style.height = 'auto';
      world.innerHTML = items.map(e => {
        const href = e.href ? ` href="${esc(e.href)}"` : '';
        const tag = e.href ? 'a' : 'article';
        return `<${tag} class="piece piece-${e.homeWork} still"${href}>
          <span class="shot sq"><img src="${esc(thumb(e.media[0], 1600))}" alt=""></span>
          <span class="pill">${esc(pad(e.homeWork))} ${esc(e.title)}</span>
        </${tag}>`;
      }).join('');
      if (hint) hint.hidden = true;
      return;
    }

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const mobile = matchMedia('(max-width: 860px)').matches;
    world.innerHTML = items.map((e, i) => {
      const href = e.href ? ` href="${esc(e.href)}"` : '';
      const tag = e.href ? 'a' : 'article';
      const p = layout(i, items.length, mobile);
      return `<${tag} class="fx064-card${p.portrait ? ' is-portrait' : ' is-land'}"${href} aria-label="${esc(e.title)}">
        <span class="fx064-shot sq"><img src="${esc(thumb(e.media[0], 900))}" alt="" decoding="async" draggable="false"></span>
        <span class="fx064-pill">${esc(pad(e.homeWork))} ${esc(e.title)}</span>
      </${tag}>`;
    }).join('');

    const cards = [...world.querySelectorAll('.fx064-card')];
    const pills = cards.map(c => c.querySelector('.fx064-pill'));
    const poses = cards.map((_, i) => layout(i, items.length, mobile));
    const travel = (items.length - 1) * Z_STEP + 1100;
    track.style.height = `${TRACK_VH}vh`;

    ctx = gsap.context(() => {
      gsap.set(world, { transformStyle: 'preserve-3d', force3D: true, z: 0 });
      gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%', force3D: true });

      const place = (boost = 0) => {
        const w = innerWidth, h = innerHeight;
        cards.forEach((card, i) => {
          const p = poses[i];
          gsap.set(card, {
            x: (p.x / 100) * w,
            y: (p.y / 100) * h,
            z: p.z + boost,
            rotationX: p.rx,
            rotationY: p.ry,
          });
        });
      };

      const cam = { z: 0 };
      const paint = () => {
        gsap.set(world, { z: cam.z });
        cards.forEach((card, i) => {
          depthStyle((gsap.getProperty(card, 'z') || 0) + cam.z, card, pills[i]);
        });
        if (hint) hint.style.opacity = String(Math.max(0, 1 - cam.z / 280));
      };

      place(-2200);
      paint();

      const land = gsap.timeline({ defaults: { ease: 'power3.out' } });
      cards.forEach((card, i) => {
        land.to(card, {
          z: poses[i].z,
          duration: 1.45,
          delay: i * 0.07,
          onUpdate: paint,
        }, 0);
      });
      if (hint) land.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.6);

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

      onResize = () => {
        const m = matchMedia('(max-width: 860px)').matches;
        cards.forEach((_, i) => { poses[i] = layout(i, items.length, m); });
        place(0);
        paint();
        window.ScrollTrigger?.refresh?.();
      };
      addEventListener('resize', onResize);
    }, root);
  };

  addEventListener('site:page', boot);
})();
