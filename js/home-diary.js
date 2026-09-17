/* One pale line on the home sky: live-site hero, letter by letter. */
(() => {
  const ROOT_ID = 'home-diary';
  const CSS = '/css/home-diary.css?v=home-diary7';
  const LINE = "A curious mind exploring the edges of all that's possible with design and beyond.";

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
  };

  const build = root => {
    const p = document.createElement('p');
    p.className = 'diary-line';
    const words = LINE.split(' ').map(text => {
      const wrap = document.createElement('span');
      wrap.className = 'diary-word';
      const letters = [...text].map(ch => {
        const s = document.createElement('span');
        s.className = 'diary-l';
        s.textContent = ch;
        wrap.appendChild(s);
        return s;
      });
      return { wrap, letters };
    });
    words.forEach(word => p.appendChild(word.wrap));
    root.appendChild(p);
    return words;
  };

  const showAll = words => {
    words.forEach(w => w.letters.forEach(el => { el.style.opacity = '1'; }));
  };

  const play = root => {
    kill();
    hide(root);
    document.body.classList.add('lit');
    document.body.classList.remove('arrived');

    const words = build(root);

    if (reduced() || !window.gsap) {
      showAll(words);
      arrive();
      return;
    }

    gsap.set(words.flatMap(w => w.letters), { opacity: 0 });
    tl = gsap.timeline({ defaults: { ease: 'none' } });
    let at = .28;
    const perLetter = .026;
    const letterDur = .08;
    const wordPause = .14;
    words.forEach((word, wi) => {
      word.letters.forEach((el, li) => {
        tl.to(el, { opacity: 1, duration: letterDur }, at + li * perLetter);
      });
      at += word.letters.length * perLetter + wordPause;
      if (wi === words.length - 1) tl.add(arrive, at);
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
      kill();
      hide(root);
      showAll(build(root));
      arrive();
      return;
    }
    seen = true;
    play(root);
  };

  addEventListener('site:page', start);
})();
