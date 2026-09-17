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
    const a = i * gold;
    const r = 0.38 + 0.62 * Math.sqrt((i + 0.5) / n);
    const ang = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const polar = ang > Math.PI ? ang - Math.PI * 2 : ang;
    return {
      ux: Math.cos(a) * r,
      uy: Math.sin(a) * r,
      z: -10 - i * 680,
      rz: polar * (180 / Math.PI) * 0.09,
      portrait: unit(i, 7) > 0.4,
    };
  };

  const LOCK = `<span class="fx064-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2.2" stroke="currentColor" stroke-width="1.7"/><path d="M8 11V8.2a4 4 0 0 1 8 0V11" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16" r="1.15" fill="currentColor"/></svg></span>`;
  const lockAspect = e => {
    const slug = e.slug || '';
    if (slug === 'origami-computing-kami') return { ratio: '4 / 5', portrait: true };
    if (slug === '4ff-muse') return { ratio: '4 / 3', portrait: false };
    return null;
  };

  const boot = async () => {
    kill();
    const my = seq;
    const site = window.Site;
    const root = document.querySelector('[data-effect-064]');
    if (!site || !root || document.body.dataset.page !== 'work' || document.body.dataset.slug) return;

    const { esc, thumb, data, reduced, fine } = site;
    const locked = await fetch('/content/projects.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => d.lockedWork || [])
      .catch(() => []);
    const published = (await data).filter(e => e.onSite !== false && e.kind !== 'writing' && e.media?.length && !e.locked);
    const items = [...published, ...locked.filter(e => e.media?.length)]
      .sort((a, b) => (b.sort ?? b.year ?? -Infinity) - (a.sort ?? a.year ?? -Infinity));
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
        const lockedCard = !!e.locked;
        const href = !lockedCard && e.href ? ` href="${esc(e.href)}"` : '';
        const tag = !lockedCard && e.href ? 'a' : 'article';
        const n = i + 1;
        return `<${tag} class="piece piece-${n} still${lockedCard ? ' is-locked' : ''}"${href}${lockedCard ? ' aria-label="' + esc(e.title) + '"' : ''}>
          <span class="shot fx064-shot"><span class="fx064-frame"><span class="fx064-well"><img src="${esc(thumb(e.media[0], 1600))}" alt=""></span></span>
            <span class="pill fx064-pill">${lockedCard ? LOCK : ''}${esc(e.title)}</span>
          </span>
        </${tag}>`;
      }).join('');
      if (hint) hint.hidden = true;
      return;
    }

    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const mobile = matchMedia('(max-width: 860px)').matches;
    const N = items.length;
    world.innerHTML = items.map((e, i) => {
      const lockedCard = !!e.locked;
      const href = !lockedCard && e.href ? ` href="${esc(e.href)}"` : '';
      const tag = !lockedCard && e.href ? 'a' : 'article';
      const p = pose(i, N, mobile);
      const aspect = lockedCard ? lockAspect(e) : null;
      const portrait = aspect ? aspect.portrait : p.portrait;
      const orient = portrait ? ' is-portrait' : ' is-land';
      const shotStyle = aspect ? ` style="aspect-ratio:${aspect.ratio}"` : '';
      return `<${tag} class="fx064-card${orient}${lockedCard ? ' is-locked' : ''}"${href} aria-label="${esc(e.title)}">
        <span class="fx064-shot"${shotStyle}>
          <span class="fx064-frame"><span class="fx064-well"><img src="${esc(thumb(e.media[0], 900))}" alt="" decoding="async" draggable="false"></span></span>
          <span class="fx064-pill">${lockedCard ? LOCK : ''}${esc(e.title)}</span>
        </span>
      </${tag}>`;
    }).join('');

    const cards = [...world.querySelectorAll('.fx064-card')];
    const pills = cards.map(c => c.querySelector('.fx064-pill'));
    const poses = cards.map((_, i) => pose(i, N, mobile));
    cards.forEach((card, i) => {
      const e = items[i];
      if (!e?.locked || lockAspect(e)) return;
      const img = card.querySelector('img');
      const shot = card.querySelector('.fx064-shot');
      if (!img || !shot) return;
      const fit = () => {
        if (!img.naturalWidth) return;
        shot.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        if (img.naturalHeight > img.naturalWidth) card.classList.add('is-portrait');
        else card.classList.remove('is-portrait');
      };
      if (img.complete) fit();
      else img.addEventListener('load', fit, { once: true });
    });
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
      let landed = false;
      const paint = () => {
        gsap.set(world, { z: cam.z });
        cards.forEach((card, i) => {
          const rel = (gsap.getProperty(card, 'z') || 0) + cam.z;
          let opacity = 1;
          if (landed && rel > -22) opacity = 1 - sCurve((rel + 22) / 200);
          else if (rel < -3600) opacity = Math.max(0.14, 1 - sCurve((-rel - 3600) / 1400));
          const gone = landed && opacity < 0.015;
          card.style.opacity = gone ? '0' : String(Math.max(0, opacity));
          card.style.visibility = gone ? 'hidden' : 'visible';
          card.style.pointerEvents = gone || opacity < 0.32 || card.classList.contains('is-locked') ? 'none' : 'auto';
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
        gsap.set(card, { z: p.z - 2600, rotationX: 0, rotationY: 0, rotationZ: p.rz * 1.2, scale: 0.94 });
      });
      paint();

      const land = gsap.timeline({
        onComplete: () => { landed = true; paint(); },
      });
      cards.forEach((card, i) => {
        const p = poses[i];
        const at = 0.05 + i * 0.055;
        land.to(card, {
          z: p.z,
          duration: 1.15,
          ease: 'power3.out',
          onUpdate: paint,
        }, at);
        land.to(card, {
          rotationX: 0,
          rotationY: 0,
          rotationZ: p.rz,
          duration: 1.15,
          ease: 'power3.out',
        }, at);
        land.to(card, {
          scale: 1,
          duration: 1.2,
          ease: 'back.out(1.45)',
        }, at);
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
        cards.forEach((card, i) => gsap.set(card, { z: poses[i].z, rotationX: 0, rotationY: 0, rotationZ: poses[i].rz }));
        paint();
        window.ScrollTrigger?.refresh?.();
      };
      addEventListener('resize', onResize);
    }, root);
  };

  addEventListener('site:page', boot);
})();
