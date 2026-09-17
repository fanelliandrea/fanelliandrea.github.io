/* Diary words that surface on the home sky, then leave the room quiet. */
(() => {
  const ROOT_ID = 'home-diary';
  const CSS = '/css/home-diary.css?v=home-diary2';
  /* Live fanelliandrea.com — not the redesign draft. */
  const LINES = [
    { text: 'Ciao.', kind: 'ciao' },
    { text: 'Andrea Fanelli', kind: 'name' },
    { text: 'A curious mind exploring the edges of all that\'s possible with design and beyond.', kind: 'tag' },
    { text: 'Based in Italy', kind: 'place' },
    { text: 'I believe great design is about creating a feeling.', kind: 'feel' },
    { text: 'Welcome', kind: 'welcome' }
  ];

  let tl = null;
  let seen = false;

  const reduced = () => !!(window.Site && window.Site.reduced)
    || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ensureCss = () => {
    if (document.querySelector('link[href*="home-diary.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS;
    document.head.appendChild(link);
  };

  const ensure = () => {
    ensureCss();
    let root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'diary';
    root.setAttribute('aria-hidden', 'true');
    document.body.appendChild(root);
    return root;
  };

  const kill = () => {
    if (tl) {
      tl.kill();
      tl = null;
    }
  };

  const arrive = () => {
    document.body.classList.add('lit', 'arrived');
  };

  const hide = root => {
    if (!root) return;
    root.replaceChildren();
    root.setAttribute('aria-hidden', 'true');
  };

  const play = (root, lines) => {
    kill();
    hide(root);
    document.body.classList.add('lit');
    document.body.classList.remove('arrived');

    const words = lines.map(line => {
      const el = document.createElement('p');
      el.className = `diary-word is-${line.kind}`;
      el.textContent = line.text;
      root.appendChild(el);
      return el;
    });

    if (reduced() || !window.gsap) {
      const last = words[words.length - 1];
      if (last) last.style.opacity = '1';
      arrive();
      return;
    }

    gsap.set(words, { opacity: 0, y: 16 });
    tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    words.forEach((el, i) => {
      const last = i === words.length - 1;
      const hold = last ? 1.45 : .95;
      const at = i * 2.05;
      tl.to(el, {
        opacity: 1,
        y: 0,
        duration: .7,
        onStart: last ? arrive : undefined
      }, at);
      tl.to(el, { opacity: 0, y: -10, duration: .5 }, at + .7 + hold);
    });
  };

  const start = () => {
    const root = ensure();
    if (document.body.dataset.page !== 'home') {
      kill();
      hide(root);
      document.body.classList.add('arrived', 'lit');
      return;
    }
    if (seen) {
      hide(root);
      arrive();
      return;
    }
    seen = true;
    play(root, LINES);
  };

  addEventListener('site:page', start);
})();
