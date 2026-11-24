/* Panda Street AI · Night 38900 / Day 38897 motion layer.
 * Progressive enhancement: preserve approved static scenes and all existing hit targets.
 * Videos are muted and loop independently; only the active theme is decoded.
 * Without the two MP4 assets, the approved image-based app is unchanged.
 */
(() => {
  'use strict';
  const stage = document.getElementById('stage');
  if (!stage) return;
  const clips = {
    night: document.getElementById('street-video-night'),
    day: document.getElementById('street-video-day')
  };
  const paths = {
    night: './assets/panda-street-day-night/night-38900.mp4',
    day: './assets/panda-street-day-night/day-38897.mp4'
  };
  if (!clips.day || !clips.night) return;
  const failed = new Set();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Render only approved stationary UI / edge areas over the moving video.
  // Full video face/body is NOT blended with static character artwork.
  const overlay = document.getElementById('street-video-ui');
  const originalArt = document.getElementById('art');
  const dayArt = document.getElementById('day-art');
  const clamp = x => Math.max(0, Math.min(1, x));
  function paintApprovedUi(mode) {
    if (!overlay) return;
    const source = mode === 'day' ? dayArt : originalArt;
    if (!source || !source.width || !source.height) return;
    const w = stage.clientWidth | 0, h = stage.clientHeight | 0;
    if (w < 2 || h < 2) return;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    overlay.width = Math.round(w * scale);
    overlay.height = Math.round(h * scale);
    const ctx = overlay.getContext('2d', {alpha: true});
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.drawImage(source, 0, 0, overlay.width, overlay.height);
    const mask = document.createElement('canvas');
    mask.width = w;
    mask.height = h;
    const mx = mask.getContext('2d', {willReadFrequently: true});
    const pixels = mx.createImageData(w, h);
    const circles = [[619,572,53],[619,699,53],[619,813,54],[489,1235,52],[615,1234,68]];
    for (let yy = 0; yy < h; yy++) {
      const y = yy * 1444 / h;
      for (let xx = 0; xx < w; xx++) {
        const x = xx * 693 / w;
        const header = clamp((350 - y) / 20);
        const footer = clamp((y - 1305) / 23);
        const left = clamp((190 - x) / 60) * clamp((y - 320) / 30) * clamp((1050 - y) / 80);
        const right = clamp((x - 550) / 60) * clamp((y - 320) / 30) * clamp((1080 - y) / 75);
        const buttons = clamp((x - 425) / 60) * clamp((y - 1110) / 50);
        let a = Math.max(header, footer, left, right, buttons);
        for (const [cx,cy,r] of circles) {
          const radius = Math.hypot(x - cx, y - cy) / r;
          a = Math.max(a, clamp((1.08 - radius) / .14));
        }
        const i = (yy * w + xx) * 4;
        pixels.data[i] = 255;
        pixels.data[i+1] = 255;
        pixels.data[i+2] = 255;
        pixels.data[i+3] = Math.round(clamp(a)*255);
      }
    }
    mx.putImageData(pixels,0,0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, overlay.width, overlay.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  let desired = document.documentElement.dataset.theme === 'day' ? 'day' : 'night';
  let active = null;
  let request = 0;

  function hideMotion() {
    delete stage.dataset.streetVideoMode;
    active = null;
  }
  function pauseAll(except = null) {
    for (const v of Object.values(clips)) if (v !== except) v.pause();
  }
  function activate(mode, ticket) {
    if (ticket !== request || desired !== mode || document.hidden || reduce?.matches) return;
    const video = clips[mode];
    if (failed.has(mode) || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const current = active ? clips[active] : null;
    if (current && current !== video && Number.isFinite(video.duration) && video.duration > 0) {
      try { video.currentTime = current.currentTime % video.duration; } catch {}
    }
    video.muted = true;
    video.play().then(() => {
      if (ticket !== request || desired !== mode || reduce?.matches) {
        video.pause(); return;
      }
      pauseAll(video);
      active = mode;
      paintApprovedUi(mode);
      stage.dataset.streetVideoMode = mode;
    }).catch(() => {
      if (ticket === request) hideMotion();
    });
  }
  function selectScene() {
    const mode = document.documentElement.dataset.theme === 'day' ? 'day' : 'night';
    desired = mode;
    const ticket = ++request;
    if (reduce?.matches || document.hidden || failed.has(mode)) {
      pauseAll(); hideMotion(); return;
    }
    const chosen = clips[mode];
    pauseAll(chosen);
    if (!chosen.dataset.assetLoaded) {
      chosen.dataset.assetLoaded = '1';
      chosen.src = paths[mode];
      chosen.load();
    }
    if (chosen.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      activate(mode, ticket);
    } else {
      hideMotion(); // approved still art stays visible during loading
    }
  }
  for (const [mode, video] of Object.entries(clips)) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'none';
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    video.addEventListener('loadeddata', () => {
      if (desired === mode) activate(mode, request);
    });
    video.addEventListener('error', () => {
      failed.add(mode);
      if (desired === mode) { hideMotion(); pauseAll(); }
      console.info('Panda Street clip unavailable; approved static scene retained:', mode);
    });
  }
  const observer = new MutationObserver(selectScene);
  observer.observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  });
  reduce?.addEventListener?.('change', selectScene);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseAll(); hideMotion(); }
    else selectScene();
  });
  const refresh = () => requestAnimationFrame(() => { if (active) paintApprovedUi(active); });
  new ResizeObserver(refresh).observe(stage);
  selectScene();
})();
