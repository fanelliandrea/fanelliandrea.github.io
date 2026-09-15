/* 091 — the work on a turning cylinder of white squircles.
   Turns on its own, tilts toward the cursor, speeds up with scroll,
   and can be thrown with a drag. Tiles fade with their angle; the
   front tile names itself in the pill below. */
(async () => {
  const { $, $$, reduced, fine, esc, pad, thumb, label, data } = window.Site;
  const root = $('#wheel');
  if (!root || !window.gsap) return;

  const items = (await data).filter(e => e.homeWork && e.media?.length).sort((a, b) => a.homeWork - b.homeWork);
  const N = items.length, step = 360 / N;
  const tilt = $('.wheel-tilt', root), spin = $('.wheel-spin', root);
  spin.innerHTML = items.map(e =>
    `<figure class="wheel-tile sq"><img src="${esc(thumb(e.media[0], 640))}" alt="${esc(e.title)}, ${esc(e.client)}" draggable="false" decoding="async"></figure>`
  ).join('');
  const tiles = $$('.wheel-tile', spin);
  const setOpacity = tiles.map(t => gsap.quickSetter(t, 'opacity'));
  const setRot = gsap.quickSetter(spin, 'rotationY', 'deg');
  const cap = Object.fromEntries($$('[data-cap]', root.parentNode).map(el => [el.dataset.cap, el]));
  cap.dots.innerHTML = items.map(() => '<i></i>').join('');
  const dots = [...cap.dots.children];

  const TILT_Z = -3;
  const layout = () => {
    const R = Math.round(tiles[0].offsetWidth / 2 / Math.tan(Math.PI / N) * 1.22);
    tiles.forEach((t, i) => { t.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
    gsap.set(spin, { z: -R });                                   // front tile sits at z = 0
    gsap.set(tilt, { transformOrigin: `50% 50% ${-R}px`, rotationZ: TILT_Z });
  };
  layout();
  addEventListener('resize', layout);

  // degrees per 60fps frame
  const BASE = reduced ? 0 : -0.09;
  let rot = 0, vel = BASE, front = -1, visible = true, dragging = false;

  const render = () => {
    setRot(rot);
    let best = 0, bestC = -2;
    for (let i = 0; i < N; i++) {
      const c = Math.cos((i * step + rot) * Math.PI / 180);
      setOpacity[i](c > 0 ? 0.3 + 0.7 * c : 0);
      if (c > bestC) { bestC = c; best = i; }
    }
    if (best !== front) {
      front = best;
      const e = items[best];
      cap.n.textContent = pad(best + 1);
      cap.title.textContent = e.title;
      cap.meta.textContent = label(e);
      dots.forEach((d, i) => d.classList.toggle('on', i === best));
    }
  };
  render();

  gsap.ticker.add((time, dt) => {
    if (!visible) return;
    const f = Math.min(dt / 16.667, 3);
    if (!dragging) {
      vel += (BASE - vel) * 0.035 * f;                           // momentum settles back to cruising speed
      rot += vel * f;
    }
    render();
  });

  if (window.ScrollTrigger) {
    const st = ScrollTrigger.create({
      trigger: root, start: 'top bottom', end: 'bottom top',
      onToggle: s => { visible = s.isActive; },
      onUpdate: s => { if (!reduced && !dragging) vel = gsap.utils.clamp(-5, 5, vel - s.getVelocity() * 0.00022); },
    });
    visible = st.isActive;
  }

  if (fine && !reduced) {
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.2, ease: 'power3.out' });
    const rz = gsap.quickTo(tilt, 'rotationZ', { duration: 1.2, ease: 'power3.out' });
    root.addEventListener('pointermove', e => {
      const r = root.getBoundingClientRect();
      rx(((e.clientY - r.top) / r.height - 0.5) * -12);
      rz(TILT_Z + ((e.clientX - r.left) / r.width - 0.5) * 6);
    });
    root.addEventListener('pointerleave', () => { rx(0); rz(TILT_Z); });
  }

  if (window.Observer) {
    Observer.create({
      target: root, type: 'touch,pointer', dragMinimum: 3, lockAxis: true,
      onPress: () => { dragging = true; },
      onDrag: s => { rot += s.deltaX * 0.22; },
      onRelease: s => {
        dragging = false;
        vel = gsap.utils.clamp(-6, 6, (s.velocityX * 0.22) / 60);  // a flick keeps turning
      },
    });
  }
})();
