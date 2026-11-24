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
  selectScene();
})();
