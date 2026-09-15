/* Bottom-right Spotify pill. Andrea’s embed, unchanged. */
(() => {
  if (document.querySelector('.player')) return;

  const KEY = 'af-player-open';

  const player = document.createElement('aside');
  player.className = 'player sq';
  player.setAttribute('aria-label', 'Music');
  player.innerHTML = `
    <button class="player-toggle" type="button" aria-expanded="false" aria-controls="player-body" aria-label="Open player">
      <span class="glyph" aria-hidden="true"><i></i><i></i></span>
    </button>
    <div class="player-body" id="player-body">
      <div class="player-embed">
        <iframe data-testid="embed-iframe" style="border-radius:12px" src="https://open.spotify.com/embed/playlist/3Re8uDFkQ3KMSaLgdqAfCc?utm_source=generator&theme=0&si=61f2886ad6604d68" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      </div>
    </div>`;
  document.body.append(player);

  const toggle = player.querySelector('.player-toggle');
  const body = player.querySelector('.player-body');

  const measure = () => {
    const trans = body.style.transition;
    body.style.transition = 'none';
    body.style.width = 'auto';
    const w = Math.ceil(body.getBoundingClientRect().width);
    body.style.width = '0px';
    body.style.transition = trans;
    void body.offsetWidth;
    return w;
  };

  const setOpen = (open, instant) => {
    player.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close player' : 'Open player');
    try { sessionStorage.setItem(KEY, open ? '1' : '0'); } catch {}
    if (instant) body.style.transition = 'none';
    if (open) {
      if (instant) {
        body.style.width = 'auto';
        body.style.width = `${Math.ceil(body.getBoundingClientRect().width)}px`;
      } else {
        body.style.width = `${measure()}px`;
      }
    } else {
      body.style.width = '0px';
    }
    if (instant) {
      void body.offsetWidth;
      body.style.transition = '';
    }
  };

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(!player.classList.contains('is-open'));
  });

  try {
    if (sessionStorage.getItem(KEY) === '1') setOpen(true, true);
  } catch {}
})();
