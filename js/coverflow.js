/* 114 — the work as a stack of portrait squircles.
   The stage is split into one strip per card; whichever strip the cursor
   is over comes to the front and the rest fold away with a small bounce.
   Click, arrow keys and swipe do the same on every device. */
(async () => {
  const { $, $$, reduced, fine, esc, pad, thumb, label, yearOf, data } = window.Site;
  const root = $('#coverflow');
  if (!root || !window.gsap) return;

  const items = (await data).filter(e => e.onSite !== false && e.kind !== 'writing');
  const N = items.length;
  $('.cf-track', root).innerHTML = items.map(e => {
    const has = e.media?.length;
    const face = has
      ? `<img src="${esc(thumb(e.media[0], 800))}" alt="" draggable="false" decoding="async">`
      : `<span class="cf-blank">${esc(e.status === 'nda' ? 'Under NDA' : e.title)}</span>`;
    return `<button class="cf-card" type="button" tabindex="-1" aria-label="${esc(e.title)}, ${esc(e.client)}"><span class="cf-face sq${has ? '' : ' is-blank'}">${face}</span></button>`;
  }).join('');
  const cards = $$('.cf-card', root), faces = cards.map(c => $('.cf-face', c));
  const cap = Object.fromEntries($$('[data-cap]').map(el => [el.dataset.cap, el]));
  cap.dots.innerHTML = items.map(() => '<i></i>').join('');
  const dots = [...cap.dots.children];
  const M = reduced ? 0 : 1;
  let active = -1;

  function go(i, instant = false) {
    i = gsap.utils.clamp(0, N - 1, i);
    if (i === active) return;
    active = i;
    const W = cards[0].offsetWidth, t = instant ? 0 : M;
    cards.forEach((c, j) => {
      const d = j - i, a = Math.abs(d), s = Math.sign(d);
      gsap.to(c, {
        x: d ? s * (W * 0.7 + (a - 1) * W * 0.24) : 0,
        z: d ? -W * 0.5 : 0,
        autoAlpha: a > 6 ? 0 : 1,
        duration: 0.6 * t, ease: 'power3.out', overwrite: 'auto',
      });
      // side cards face the centre; the overshoot is the "tiny bounce"
      gsap.to(faces[j], { rotationY: d ? -s * 52 : 0, duration: 0.75 * t, ease: 'back.out(1.6)', overwrite: 'auto' });
      c.tabIndex = d ? -1 : 0;
      c.toggleAttribute('aria-current', !d);
    });
    const e = items[i];
    cap.n.textContent = pad(i + 1);
    cap.title.textContent = e.title;
    cap.meta.textContent = label(e);
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  }

  if (fine) root.addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect();
    go(Math.floor(((e.clientX - r.left) / r.width) * N));
  });

  cards.forEach((c, j) => c.addEventListener('click', () => {
    if (j !== active) go(j);
    else if (items[j].href) location.href = items[j].href;
  }));

  root.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!k) return;
    e.preventDefault();
    go(active + k);
    cards[active].focus({ preventScroll: true });
  });

  if (window.Observer) Observer.create({
    target: root, type: 'touch', dragMinimum: 10, lockAxis: true,
    onDragEnd: s => {
      const dx = s.x - s.startX;
      if (Math.abs(dx) > 40 || Math.abs(s.velocityX) > 400) {
        go(active - Math.sign(dx || s.velocityX) * Math.max(1, Math.round(Math.abs(dx) / 120)));
      }
    },
  });

  addEventListener('resize', () => { const a = active; active = -1; go(a, true); });
  go(0, true);
})();
