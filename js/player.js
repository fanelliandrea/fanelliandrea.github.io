/* Bottom-right audio. Hidden YouTube host, playlist driven in-page. */
(() => {
  if (document.querySelector('.player')) return;

  const KEY = 'af-yt';
  const FALLBACK_IDS = ['2tOutF8B3f8', 'VHGqsnsuA3c', 'WizNXQGBMEk'];
  const icon = {
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M2.4 1.1v9.8L10.6 6z"/></svg>',
    pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2.1" y="1.4" width="2.4" height="9.2" rx=".4" fill="currentColor"/><rect x="7.5" y="1.4" width="2.4" height="9.2" rx=".4" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="1.4" y="2" width="1.5" height="8" rx=".3" fill="currentColor"/><path fill="currentColor" d="M10.4 2.1v7.8L3.6 6z"/></svg>',
    next: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M1.6 2.1v7.8L8.4 6z"/><rect x="9.1" y="2" width="1.5" height="8" rx=".3" fill="currentColor"/></svg>',
    shuffle: '<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M1.5 3.2h2.1c.9 0 1.5.5 2.4 1.8M1.5 8.8h2.1c.9 0 1.5-.5 2.4-1.8M8.2 3.2h2.3M8.2 8.8h2.3"/><path fill="currentColor" d="M9.2 1.6l2.2 1.6-2.2 1.6zm0 5.6l2.2 1.6-2.2 1.6z"/></svg>'
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
    <button class="player-btn is-shuffle" type="button" data-act="shuffle" aria-pressed="false" aria-label="Shuffle">${icon.shuffle}</button>`;
  document.body.append(player);

  const host = document.createElement('div');
  host.className = 'player-host';
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = '<div id="yt-audio"></div>';
  document.body.append(host);

  const playBtn = player.querySelector('[data-act="play"]');
  const shuffleBtn = player.querySelector('[data-act="shuffle"]');
  const coverEl = player.querySelector('.player-cover');
  const titleEl = player.querySelector('.player-title');
  const artistEl = player.querySelector('.player-artist');

  const saved = load();
  let yt = null;
  let ready = false;
  let tracks = {};
  let ids = FALLBACK_IDS.slice();
  let shuffleOn = saved.shuffle !== false;
  let order = shuffleOn ? mix(ids) : ids.slice();
  let idx = Math.max(0, order.indexOf(saved.videoId));
  if (saved.videoId && idx < 0) {
    order = shuffleOn ? mix(ids) : ids.slice();
    idx = 0;
  }
  let fails = 0;
  let pending = saved.playing ? 'play' : null;
  let resumeAt = saved.time > 1 ? saved.time : 0;

  shuffleBtn.classList.toggle('is-on', shuffleOn);
  shuffleBtn.setAttribute('aria-pressed', String(shuffleOn));

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

  const lookupDeezer = (id, parsed) => {
    const q = [parsed.artist, parsed.title].filter(Boolean).join(' ');
    if (!q) return;
    fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`)
      .then(r => r.json())
      .then(d => {
        const hit = d.data?.[0];
        if (!hit) return;
        const meta = {
          artist: parsed.artist || hit.artist?.name || '',
          title: parsed.title || hit.title || '',
          cover: hit.album?.cover_medium || hit.album?.cover_small || ''
        };
        tracks[id] = meta;
        if (order[idx] === id) paint(meta);
      })
      .catch(() => {});
  };

  const show = (id, rawTitle) => {
    if (id && tracks[id]) { paint(tracks[id]); return; }
    const parsed = parseMeta(rawTitle);
    paint({
      artist: parsed.artist,
      title: parsed.title,
      cover: id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : ''
    });
    if (id) lookupDeezer(id, parsed);
  };

  const snapshot = extra => {
    const id = order[idx] || '';
    let time = resumeAt;
    try { if (yt?.getCurrentTime) time = yt.getCurrentTime() || time; } catch {}
    return save({
      playing: player.classList.contains('is-playing'),
      shuffle: shuffleOn,
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

  const cue = (autoplay, start) => {
    const id = order[idx] || ids[0];
    if (!id) return;
    show(id);
    snapshot({ videoId: id, playing: !!autoplay });
    if (!yt || typeof yt.cueVideoById !== 'function') return;
    const t = start || 0;
    try {
      if (autoplay) yt.loadVideoById({ videoId: id, startSeconds: t });
      else yt.cueVideoById({ videoId: id, startSeconds: t });
    } catch {
      try { yt.loadVideoById(id); } catch {}
    }
  };

  const playNow = () => {
    pending = 'play';
    setPlaying(true);
    if (!ready || !yt) return;
    const state = yt.getPlayerState?.();
    try { yt.unMute(); yt.setVolume(100); } catch {}
    if (state === 1) return;
    if (state === 2) { yt.playVideo(); return; }
    cue(true, resumeAt);
  };

  const pauseNow = () => {
    pending = null;
    setPlaying(false);
    try { resumeAt = yt?.getCurrentTime?.() || resumeAt; } catch {}
    try { yt?.pauseVideo?.(); } catch {}
    snapshot({ playing: false });
  };

  const skip = dir => {
    if (!order.length) return;
    idx = (idx + dir + order.length) % order.length;
    resumeAt = 0;
    pending = 'play';
    setPlaying(true);
    cue(true, 0);
  };

  const boot = () => {
    if (yt || !window.YT?.Player) return;
    const startId = order[idx] || ids[0];
    yt = new YT.Player('yt-audio', {
      width: 200,
      height: 200,
      videoId: startId,
      host: 'https://www.youtube.com',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: location.origin
      },
      events: {
        onReady: () => {
          ready = true;
          try { yt.unMute(); yt.setVolume(100); } catch {}
          show(order[idx]);
          if (pending === 'play') playNow();
          else cue(false, resumeAt);
        },
        onStateChange: e => {
          const playing = e.data === 1;
          const paused = e.data === 2;
          const ended = e.data === 0;
          if (playing) {
            fails = 0;
            pending = 'play';
            resumeAt = 0;
            setPlaying(true);
            try {
              const data = yt.getVideoData?.() || {};
              if (data.video_id) {
                const found = order.indexOf(data.video_id);
                if (found >= 0) idx = found;
                show(data.video_id, data.title);
              }
            } catch {}
            snapshot({ playing: true });
          } else if (paused && pending !== 'play') {
            setPlaying(false);
            snapshot({ playing: false });
          } else if (ended) {
            skip(1);
          }
        },
        onError: () => {
          fails += 1;
          if (fails >= Math.max(order.length, 1)) {
            pending = null;
            setPlaying(false);
            return;
          }
          skip(1);
        }
      }
    });
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
    else if (act === 'shuffle') {
      shuffleOn = !shuffleOn;
      const current = order[idx];
      order = shuffleOn ? mix(ids) : ids.slice();
      idx = Math.max(0, order.indexOf(current));
      shuffleBtn.classList.toggle('is-on', shuffleOn);
      shuffleBtn.setAttribute('aria-pressed', String(shuffleOn));
      snapshot({ shuffle: shuffleOn });
    }
  });

  addEventListener('pagehide', () => snapshot());
  addEventListener('visibilitychange', () => { if (document.hidden) snapshot(); });
  setInterval(() => { if (player.classList.contains('is-playing')) snapshot(); }, 2000);

  const paintCatalog = () => {
    ids = Object.keys(tracks).length ? Object.keys(tracks) : FALLBACK_IDS.slice();
    const current = load().videoId;
    order = shuffleOn ? mix(ids) : ids.slice();
    idx = Math.max(0, order.indexOf(current));
    if (idx < 0) idx = 0;
    show(order[idx] || ids[0]);
  };

  fetch('/content/playlist.json')
    .then(r => r.json())
    .then(d => {
      tracks = d.tracks || {};
      const nextIds = Object.keys(tracks);
      if (nextIds.length) ids = nextIds;
      if (!ready) paintCatalog();
      else show(order[idx] || ids[0]);
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
