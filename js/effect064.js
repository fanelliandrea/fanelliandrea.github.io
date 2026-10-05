/* 064 — work stills scatter into a 3D cloud; scroll flies the camera on Z. */
(() => {
  let ctx = null;
  let seq = 0;
  let onResize = null;
  let onTick = null;
  let hitsLayer = null;
  let raf = 0;

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
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (onResize) removeEventListener('resize', onResize);
    onResize = null;
    if (onTick) {
      try { window.gsap?.ticker.remove(onTick); } catch {}
      onTick = null;
    }
    hitsLayer?.remove();
    hitsLayer = null;
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
      const p = pose(i, N, mobile);
      const aspect = lockedCard ? lockAspect(e) : null;
      const portrait = aspect ? aspect.portrait : p.portrait;
      const orient = portrait ? ' is-portrait' : ' is-land';
      const shotStyle = aspect ? ` style="aspect-ratio:${aspect.ratio}"` : '';
      return `<article class="fx064-card${orient}${lockedCard ? ' is-locked' : ''}" aria-label="${esc(e.title)}">
        <span class="fx064-shot"${shotStyle}>
          <span class="fx064-frame"><span class="fx064-well"><img src="${esc(thumb(e.media[0], 900))}" alt="" decoding="async" draggable="false"></span></span>
          <span class="fx064-pill">${lockedCard ? LOCK : ''}${esc(e.title)}</span>
        </span>
      </article>`;
    }).join('');

    const cards = [...world.querySelectorAll('.fx064-card')];
    hitsLayer?.remove();
    hitsLayer = document.createElement('div');
    hitsLayer.className = 'fx064-hits';
    const hits = [];
    items.forEach((e, i) => {
      if (e.locked || !e.href) return;
      const a = document.createElement('a');
      a.className = 'fx064-hit';
      a.href = e.href;
      a.setAttribute('aria-label', e.title);
      a.dataset.i = String(i);
      a.addEventListener('pointerenter', () => cards[i]?.classList.add('is-hot'));
      a.addEventListener('pointerleave', () => cards[i]?.classList.remove('is-hot'));
      hitsLayer.appendChild(a);
      hits.push(a);
    });
    stage.appendChild(hitsLayer);
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
      const zs = poses.map(p => p.z);
      const rzs = poses.map(p => p.rz);
      const scs = poses.map(() => 1);
      const shotWH = cards.map(() => ({ w: 1, h: 1 }));
      const view = { w: innerWidth, h: innerHeight, p: 1400 };
      const cam = { z: 0 };
      const shots = cards.map(c => c.querySelector('.fx064-shot'));
      const placeXY = () => {
        lens();
        view.w = stage.clientWidth || innerWidth;
        view.h = stage.clientHeight || innerHeight;
        view.p = parseFloat(stage.style.perspective) || 1400;
        const R = Math.min(view.w, view.h) * (matchMedia('(max-width: 860px)').matches ? 0.56 : 0.66);
        cards.forEach((card, i) => {
          const p = poses[i];
          bases[i].x = p.ux * R;
          bases[i].y = p.uy * R;
          gsap.set(card, { x: bases[i].x, y: bases[i].y });
          const shot = shots[i];
          shotWH[i].w = shot?.offsetWidth || card.offsetWidth || 1;
          shotWH[i].h = shot?.offsetHeight || card.offsetHeight || 1;
        });
      };
      const maxBlur = mobile ? 4 : 6;
      const dof = rel => {
        if (rel > 24) return 0;
        const d = 30 - rel;
        if (d < 220) return 0;
        const t = Math.min(1, (d - 220) / 3400);
        return Math.round(sCurve(t) * maxBlur);
      };
      let landed = false;
      let lastCam = NaN;
      let lastRx = NaN;
      let lastRy = NaN;
      const DEG = Math.PI / 180;
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

      const writeHit = (hit, on, x, y, w, h) => {
        if (hit._on !== on) {
          hit._on = on;
          hit.classList.toggle('is-on', on);
        }
        if (!on) return;
        const tx = Math.round(x);
        const ty = Math.round(y);
        const tw = Math.max(8, Math.round(w));
        const th = Math.max(8, Math.round(h));
        if (hit._x !== tx || hit._y !== ty) {
          hit._x = tx;
          hit._y = ty;
          hit.style.transform = `translate3d(${tx}px,${ty}px,0)`;
        }
        if (hit._w !== tw) {
          hit._w = tw;
          hit.style.width = `${tw}px`;
        }
        if (hit._h !== th) {
          hit._h = th;
          hit.style.height = `${th}px`;
        }
      };

      const syncHits = (worldRx, worldRy) => {
        if (!hitsLayer) return;
        const P = view.p;
        const ox = view.w * 0.5;
        const oy = view.h * 0.48;
        const tx0 = view.w * 0.5;
        const ty0 = view.h * 0.5;
        const cy = Math.cos(worldRy);
        const sy = Math.sin(worldRy);
        const cx = Math.cos(worldRx);
        const sx = Math.sin(worldRx);
        for (let h = 0; h < hits.length; h++) {
          const hit = hits[h];
          const i = +hit.dataset.i;
          const card = cards[i];
          if (!card) continue;
          const opacity = card._op ?? 1;
          const gone = card._gone === 1;
          if (gone || opacity < 0.32) {
            writeHit(hit, false, 0, 0, 0, 0);
            continue;
          }
          const hw = shotWH[i].w * 0.5;
          const hh = shotWH[i].h * 0.5;
          const rz = rzs[i] * DEG;
          const cr = Math.cos(rz);
          const sr = Math.sin(rz);
          const sc = scs[i];
          const bx = bases[i].x;
          const by = bases[i].y;
          const cz = zs[i];
          let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, ok = 0;
          for (let c = 0; c < 4; c++) {
            const lx = corners[c][0] * hw * sc;
            const ly = corners[c][1] * hh * sc;
            const x1 = lx * cr - ly * sr + bx;
            const y1 = lx * sr + ly * cr + by;
            const x2 = x1 * cy + cz * sy;
            const z2 = -x1 * sy + cz * cy;
            const y3 = y1 * cx - z2 * sx;
            const z3 = y1 * sx + z2 * cx + cam.z;
            const d = P - z3;
            if (d < 8) continue;
            const k = P / d;
            const sxv = ox + (tx0 + x2 - ox) * k;
            const syv = oy + (ty0 + y3 - oy) * k;
            if (sxv < minX) minX = sxv;
            if (syv < minY) minY = syv;
            if (sxv > maxX) maxX = sxv;
            if (syv > maxY) maxY = syv;
            ok += 1;
          }
          const w = maxX - minX;
          const ht = maxY - minY;
          writeHit(hit, ok > 2 && w > 8 && ht > 8, minX, minY, w, ht);
        }
      };

      const paint = () => {
        if (world._z !== cam.z) {
          world._z = cam.z;
          gsap.set(world, { z: cam.z });
        }
        const worldRx = (gsap.getProperty(world, 'rotationX') || 0) * DEG;
        const worldRy = (gsap.getProperty(world, 'rotationY') || 0) * DEG;
        for (let i = 0; i < N; i++) {
          const card = cards[i];
          if (!landed) {
            zs[i] = gsap.getProperty(card, 'z') || 0;
            rzs[i] = gsap.getProperty(card, 'rotationZ') || 0;
            scs[i] = gsap.getProperty(card, 'scale') || 1;
          } else {
            zs[i] = poses[i].z;
            rzs[i] = poses[i].rz;
            scs[i] = 1;
          }
          const rel = zs[i] + cam.z;
          let opacity = 1;
          if (landed && rel > -22) opacity = 1 - sCurve((rel + 22) / 200);
          else if (rel < -3600) opacity = Math.max(0.14, 1 - sCurve((-rel - 3600) / 1400));
          const gone = landed && opacity < 0.015;
          const op = gone ? 0 : Math.max(0, opacity);
          if (card._op !== op) {
            card._op = op;
            card.style.opacity = String(op);
          }
          const vis = gone ? 1 : 0;
          if (card._gone !== vis) {
            card._gone = vis;
            card.style.visibility = gone ? 'hidden' : 'visible';
          }
          const blur = gone ? 0 : dof(rel);
          const shot = shots[i];
          if (shot && shot._blur !== blur) {
            shot._blur = blur;
            shot.style.filter = blur ? `blur(${blur}px)` : 'none';
          }
          const mid = Math.abs(rel + 20);
          const pillOp = !gone && mid < 380 && opacity > 0.55 && blur < 2 ? 1 - mid / 480 : 0;
          const pill = pills[i];
          if (pill && pill._op !== pillOp) {
            pill._op = pillOp;
            pill.style.opacity = String(pillOp);
          }
        }
        if (hint) {
          const hop = Math.max(0, 1 - sCurve(cam.z / 320));
          if (hint._op !== hop) {
            hint._op = hop;
            hint.style.opacity = String(hop);
          }
        }
        if (!landed || lastCam !== cam.z || lastRx !== worldRx || lastRy !== worldRy) {
          lastCam = cam.z;
          lastRx = worldRx;
          lastRy = worldRy;
          syncHits(worldRx, worldRy);
        }
      };

      const requestPaint = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          paint();
        });
      };

      placeXY();
      cards.forEach((card, i) => {
        const p = poses[i];
        card.style.pointerEvents = 'none';
        gsap.set(card, { z: p.z - 2600, rotationX: 0, rotationY: 0, rotationZ: p.rz * 1.2, scale: 0.94 });
      });
      paint();

      const land = gsap.timeline({
        onUpdate: requestPaint,
        onComplete: () => { landed = true; paint(); },
      });
      cards.forEach((card, i) => {
        const p = poses[i];
        const at = 0.05 + i * 0.055;
        land.to(card, {
          z: p.z,
          duration: 1.15,
          ease: 'power3.out',
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
            requestPaint();
          },
        });
      }

      if (fine) {
        const rx = gsap.quickTo(world, 'rotationX', { duration: 1.15, ease: 'power3.out' });
        const ry = gsap.quickTo(world, 'rotationY', { duration: 1.15, ease: 'power3.out' });
        stage.addEventListener('pointermove', e => {
          rx((e.clientY / view.h - 0.5) * -3);
          ry((e.clientX / view.w - 0.5) * 4);
          requestPaint();
        });
        stage.addEventListener('pointerleave', () => { rx(0); ry(0); requestPaint(); });
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
