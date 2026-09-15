/* Bottom-right audio. Playlist via hidden YouTube IFrame API. */
(() => {
  if (document.querySelector('.player')) return;

  const LIST = 'PLI_JRzyhoEfc';
  const KEY = 'af-yt';
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

  const player = document.createElement('aside');
  player.className = 'player sq';
  player.setAttribute('aria-label', 'Music');
  player.innerHTML = `
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
  const saved = load();
  let yt = null;
  let shuffleOn = saved.shuffle !== false;
  shuffleBtn.classList.toggle('is-on', shuffleOn);
  shuffleBtn.setAttribute('aria-pressed', String(shuffleOn));

  const snapshot = extra => {
    if (!yt || typeof yt.getPlayerState !== 'function') return save(extra || {});
    let videoId = '';
    try { videoId = yt.getVideoData()?.video_id || ''; } catch {}
    return save({
      playing: yt.getPlayerState() === 1,
      shuffle: shuffleOn,
      index: yt.getPlaylistIndex?.() ?? 0,
      time: yt.getCurrentTime?.() || 0,
      videoId,
      ...(extra || {})
    });
  };

  const setPlaying = on => {
    playBtn.innerHTML = on ? icon.pause : icon.play;
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    player.classList.toggle('is-playing', on);
  };

  const restore = () => {
    if (!yt) return;
    try { yt.setLoop(true); } catch {}
    try { yt.setShuffle(shuffleOn); } catch {}
    const s = load();
    const list = yt.getPlaylist?.() || [];
    let i = 0;
    if (s.videoId && list.length) {
      const found = list.indexOf(s.videoId);
      if (found >= 0) i = found;
    } else if (Number.isInteger(s.index) && s.index >= 0) {
      i = s.index;
    }
    const t = s.time > 1 ? s.time : 0;
    try {
      yt.mute();
      if (list.length) yt.playVideoAt(i);
      if (t) yt.seekTo(t, true);
      if (s.playing) {
        yt.unMute();
        yt.playVideo();
      } else {
        yt.pauseVideo();
        yt.unMute();
      }
    } catch { try { yt.unMute(); } catch {} }
  };

  const boot = () => {
    if (yt || !window.YT?.Player) return;
    yt = new YT.Player('yt-audio', {
      width: 1,
      height: 1,
      playerVars: {
        listType: 'playlist',
        list: LIST,
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
          let n = 0;
          const wait = () => {
            const list = yt.getPlaylist?.() || [];
            if (list.length || n++ > 25) restore();
            else setTimeout(wait, 160);
          };
          wait();
        },
        onStateChange: e => {
          const playing = e.data === 1;
          const paused = e.data === 2;
          if (playing || paused) setPlaying(playing);
          if (playing || paused || e.data === 0) snapshot({ playing });
        },
        onError: () => { try { yt.nextVideo(); } catch {} }
      }
    });
  };

  player.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    e.stopPropagation();
    const act = btn.dataset.act;
    if (!yt) return;
    if (act === 'play') {
      const on = yt.getPlayerState() === 1;
      if (on) yt.pauseVideo(); else yt.playVideo();
      setPlaying(!on);
      snapshot({ playing: !on });
    } else if (act === 'next') {
      yt.nextVideo();
      snapshot({ playing: true });
    } else if (act === 'prev') {
      yt.previousVideo();
      snapshot({ playing: true });
    } else if (act === 'shuffle') {
      shuffleOn = !shuffleOn;
      try { yt.setShuffle(shuffleOn); } catch {}
      shuffleBtn.classList.toggle('is-on', shuffleOn);
      shuffleBtn.setAttribute('aria-pressed', String(shuffleOn));
      snapshot({ shuffle: shuffleOn });
    }
  });

  addEventListener('pagehide', () => snapshot());
  addEventListener('visibilitychange', () => { if (document.hidden) snapshot(); });
  setInterval(() => { if (yt?.getPlayerState?.() === 1) snapshot(); }, 2000);

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev?.(); boot(); };
  if (window.YT?.Player) boot();
})();
