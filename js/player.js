/* Bottom-right audio. Hidden YouTube host, playlist driven in-page. */
(() => {
  if (document.querySelector('.player')) return;

  const KEY = 'af-yt';
  const OPEN_KEY = 'af-player-open';
  const FALLBACK_IDS = ['2tOutF8B3f8', 'VHGqsnsuA3c', 'WizNXQGBMEk', 'QhZnEagfjTQ', 'xMV6l2y67rk', '26setwoKtUI'];
  const icon = {
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M2.4 1.1v9.8L10.6 6z"/></svg>',
    pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2.1" y="1.4" width="2.4" height="9.2" rx=".4" fill="currentColor"/><rect x="7.5" y="1.4" width="2.4" height="9.2" rx=".4" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="1.4" y="2" width="1.5" height="8" rx=".3" fill="currentColor"/><path fill="currentColor" d="M10.4 2.1v7.8L3.6 6z"/></svg>',
    next: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M1.6 2.1v7.8L8.4 6z"/><rect x="9.1" y="2" width="1.5" height="8" rx=".3" fill="currentColor"/></svg>',
    note: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M8.7 1.2v5.55a1.85 1.85 0 1 1-1.15-1.7V3.05L4.2 3.85v4.55a1.85 1.85 0 1 1-1.15-1.7V2.55z"/></svg>',
    close: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M2.4 2.4l7.2 7.2M9.6 2.4l-7.2 7.2"/></svg>'
  };

  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
  };
  const save = patch => {
    const next = { ...load(), ...patch };
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  };
  const mix = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const player = document.createElement('aside');
  player.className = 'player sq';
  player.setAttribute('aria-label', 'Music');
  player.innerHTML = `
    <div class="player-body">
      <div class="player-now">
        <img class="player-cover" alt="" width="72" height="72">
        <span class="player-meta">
          <b class="player-title"></b>
          <span class="player-artist"></span>
        </span>
      </div>
      <button class="player-btn" type="button" data-act="prev" aria-label="Previous">${icon.prev}</button>
      <button class="player-btn is-play" type="button" data-act="play" aria-label="Play">${icon.play}</button>
      <button class="player-btn" type="button" data-act="next" aria-label="Next">${icon.next}</button>
    </div>
    <button class="player-btn is-toggle" type="button" data-act="toggle" aria-label="Close player">${icon.close}</button>`;
  document.body.append(player);

  const host = document.createElement('div');
  host.className = 'player-host';
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = '<div id="yt-audio"></div>';
  document.body.append(host);

  const playBtn = player.querySelector('[data-act="play"]');
  const toggle = player.querySelector('[data-act="toggle"]');
  const coverEl = player.querySelector('.player-cover');
  const titleEl = player.querySelector('.player-title');
  const artistEl = player.querySelector('.player-artist');
  const htmlAudio = new Audio();
  htmlAudio.preload = 'auto';

  const saved = load();
  let yt = null;
  let ready = false;
  let gen = 0;
  let tracks = {};
  let ids = FALLBACK_IDS.slice();
  let order = mix(ids);
  let idx = 0;
  if (saved.playing && saved.videoId && ids.includes(saved.videoId)) {
    const at = order.indexOf(saved.videoId);
    if (at >= 0) idx = at;
  }
  let pending = saved.playing ? 'play' : null;
  let resumeAt = saved.time > 1 ? saved.time : 0;
  let expected = order[idx] || ids[0];

  const setOpen = open => {
    player.classList.toggle('is-open', open);
    toggle.innerHTML = open ? icon.close : icon.note;
    toggle.setAttribute('aria-label', open ? 'Close player' : 'Open player');
    try { sessionStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch {}
  };
  try { setOpen(sessionStorage.getItem(OPEN_KEY) !== '0'); }
  catch { setOpen(true); }

  const parseMeta = raw => {
    const text = String(raw || '').replace(/\s*\((?:HQ|Official[^)]*|Audio|Video|Lyrics|Visualizer)\)\s*$/i, '').trim();
    for (const sep of [' - ', ' – ', ' | ']) {
      if (!text.includes(sep)) continue;
      const [artist, title] = text.split(sep).map(s => s.trim());
      if (artist && title) return { artist, title };
    }
    return { artist: '', title: text };
  };

  const paint = meta => {
    if (!meta) return;
    titleEl.textContent = meta.title || '';
    artistEl.textContent = meta.artist || '';
    if (meta.cover && coverEl.getAttribute('src') !== meta.cover) coverEl.src = meta.cover;
    coverEl.alt = [meta.artist, meta.title].filter(Boolean).join(' — ');
    player.setAttribute('aria-label', ['Music', meta.artist, meta.title].filter(Boolean).join(', '));
  };

  const show = (id, rawTitle) => {
    if (id && tracks[id]) { paint(tracks[id]); return; }
    const parsed = parseMeta(rawTitle);
    paint({
      artist: parsed.artist,
      title: parsed.title,
      cover: id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : ''
    });
  };

  const snapshot = extra => {
    const id = order[idx] || '';
    let time = resumeAt;
    try { if (yt?.getCurrentTime) time = yt.getCurrentTime() || time; } catch {}
    return save({
      playing: player.classList.contains('is-playing'),
      index: idx,
      time,
      videoId: id,
      ...(extra || {})
    });
  };

  const setPlaying = on => {
    playBtn.innerHTML = on ? icon.pause : icon.play;
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    player.classList.toggle('is-playing', on);
  };

  const hushAudio = () => {
    try { htmlAudio.pause(); htmlAudio.removeAttribute('src'); htmlAudio.load(); } catch {}
  };

  const playFallback = () => {
    const id = expected;
    const dz = tracks[id]?.deezer;
    show(id);
    if (!dz) return;
    fetch(`https://api.deezer.com/track/${dz}`)
      .then(r => r.json())
      .then(d => {
        if (expected !== id || !d.preview) return;
        try { yt?.stopVideo?.(); } catch {}
        hushAudio();
        htmlAudio.src = d.preview;
        const play = htmlAudio.play();
        if (play && play.catch) play.catch(() => {});
        pending = 'play';
        setPlaying(true);
        snapshot({ playing: true, videoId: id });
      })
      .catch(() => {});
  };

  htmlAudio.addEventListener('ended', () => skip(1));

  const createPlayer = (id, autoplay, start) => {
    if (!window.YT?.Player || !id) return;
    const my = ++gen;
    ready = false;
    expected = id;
    try { yt.stopVideo(); } catch {}
    try { yt.destroy(); } catch {}
    yt = null;
    host.innerHTML = '<div id="yt-audio"></div>';
    yt = new YT.Player('yt-audio', {
      width: 200,
      height: 200,
      videoId: id,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        start: Math.max(0, Math.floor(start || 0)),
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: location.origin
      },
      events: {
        onReady: e => {
          if (my !== gen) return;
          ready = true;
          try { e.target.unMute(); e.target.setVolume(100); } catch {}
          if (autoplay || pending === 'play') {
            try { e.target.playVideo(); } catch {}
          }
        },
        onStateChange: e => {
          if (my !== gen) return;
          if (e.data === 1) {
            pending = 'play';
            resumeAt = 0;
            hushAudio();
            setPlaying(true);
            show(id);
            snapshot({ playing: true, videoId: id });
          } else if (e.data === 2 && pending !== 'play') {
            setPlaying(false);
            snapshot({ playing: false });
          } else if (e.data === 0) skip(1);
        },
        onError: () => {
          if (my !== gen) return;
          if (autoplay || pending === 'play') playFallback();
        }
      }
    });
  };

  const go = (autoplay, start) => {
    const id = order[idx] || ids[0];
    if (!id) return;
    expected = id;
    hushAudio();
    show(id);
    snapshot({ videoId: id, playing: !!autoplay });
    createPlayer(id, autoplay, start || 0);
  };

  const playNow = () => {
    pending = 'play';
    setPlaying(true);
    const id = order[idx];
    show(id);
    if (htmlAudio.src && htmlAudio.paused) {
      const play = htmlAudio.play();
      if (play && play.catch) play.catch(() => {});
      return;
    }
    if (ready && yt) {
      try {
        const cur = yt.getVideoData?.()?.video_id;
        const st = yt.getPlayerState?.();
        if (cur === id && st !== 1) {
          yt.unMute();
          yt.setVolume(100);
          yt.playVideo();
          return;
        }
        if (cur === id && st === 1) return;
      } catch {}
    }
    go(true, resumeAt);
  };

  const pauseNow = () => {
    pending = null;
    setPlaying(false);
    try { resumeAt = yt?.getCurrentTime?.() || resumeAt; } catch {}
    try { yt?.pauseVideo?.(); } catch {}
    try { htmlAudio.pause(); } catch {}
    snapshot({ playing: false });
  };

  const skip = dir => {
    if (!order.length) return;
    idx = (idx + dir + order.length) % order.length;
    resumeAt = 0;
    pending = 'play';
    setPlaying(true);
    go(true, 0);
  };

  const boot = () => {
    if (!window.YT?.Player) return;
    go(pending === 'play', resumeAt);
  };

  player.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    e.stopPropagation();
    const act = btn.dataset.act;
    if (act === 'play') {
      if (player.classList.contains('is-playing')) pauseNow();
      else playNow();
    } else if (act === 'next') skip(1);
    else if (act === 'prev') skip(-1);
    else if (act === 'toggle') setOpen(!player.classList.contains('is-open'));
  });

  addEventListener('pagehide', () => snapshot());
  addEventListener('visibilitychange', () => { if (document.hidden) snapshot(); });
  setInterval(() => { if (player.classList.contains('is-playing')) snapshot(); }, 2000);

  fetch('/content/playlist.json')
    .then(r => r.json())
    .then(d => {
      tracks = d.tracks || {};
      const nextIds = Object.keys(tracks);
      if (!nextIds.length) return;
      ids = nextIds;
      const current = order[idx];
      order = mix(ids);
      idx = Math.max(0, order.indexOf(current));
      if (idx < 0) idx = 0;
      show(order[idx]);
    })
    .catch(() => show(order[idx] || ids[0]));

  show(order[idx] || ids[0]);

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prevReady?.(); boot(); };
  if (window.YT?.Player) boot();
})();
