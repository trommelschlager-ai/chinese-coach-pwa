/* Panda AI v546: bind the approved image layout to live, working controls.
   Preserve the original speech engine, Panda image assets, and touch events. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('scenario') === 'hsk2-my-day') return;
  let complete = false;
  let observer;
  const setGeometry = (stage, pandaImage) => {
    if (stage.dataset.paGeometrySet === 'true') return;
    const sw = stage.getBoundingClientRect().width;
    const sh = stage.getBoundingClientRect().height;
    if (sw < 250 || sh < 400) return;
    const width = Math.min(sw * 0.69, 355);
    const stoneWidth = Math.min(sw * 0.83, 430);
    const stoneHeight = stoneWidth * 207 / 600;
    const stoneBottom = Math.max(82, sh * 0.125);
    const pandaBottom = stoneBottom + stoneWidth * 0.162 - 14;
    const pandaRatio = pandaImage?.naturalWidth && pandaImage?.naturalHeight
      ? pandaImage.naturalHeight / pandaImage.naturalWidth : 1.1;
    const pandaTop = Math.max(210, sh - pandaBottom - width * pandaRatio);
    const stoneTop = sh - stoneBottom - stoneHeight;
    stage.style.setProperty('--pa-panda-top', pandaTop.toFixed(1) + 'px');
    stage.style.setProperty('--pa-panda-width', width.toFixed(1) + 'px');
    stage.style.setProperty('--pa-stone-top', stoneTop.toFixed(1) + 'px');
    stage.style.setProperty('--pa-stone-width', stoneWidth.toFixed(1) + 'px');
    stage.dataset.paGeometrySet = 'true';
    // Do not recalculate geometry when the Android keyboard changes viewport.
  };

  function apply(stage) {
    if (complete || !stage || stage.dataset.pg500Mounted !== 'true') return false;
    const navigation = stage.querySelector('.pg346-nav');
    const rail = stage.querySelector('.pg346-side-rail');
    const history = stage.querySelector('#pg346-history');
    const pandaImage = stage.querySelector('.pg352-mascot .pg346-panda');
    const home = navigation?.querySelector('a[href="./index.html#panda/home"]');
    const panda = navigation?.querySelector('a[href="./panda-voice-pilot.html"]');
    const profile = navigation?.querySelector('a[href="./index.html#panda/settings"]');
    const lessons = rail?.querySelector('.pg500-side-book');
    const topics = rail?.querySelector('#pg346-topics-btn');
    if (!navigation || !history || !home || !panda || !profile || !lessons || !topics || !pandaImage) return false;
    if (!pandaImage.complete || !pandaImage.naturalWidth) {
      pandaImage.addEventListener('load', () => apply(stage), {once:true});
      return false;
    }
    // Move the existing history button so its original click handler survives.
    history.classList.add('pa-nav-history');
    history.setAttribute('aria-label', 'История — все диалоги');
    const historySvg = history.querySelector('svg')?.outerHTML || '';
    history.innerHTML = historySvg + '<span>История</span>';
    navigation.replaceChildren(home, history, panda, profile);
    // The exact same links are still accessible from the course navigation.
    rail.querySelector('.pg500-side-game')?.remove();
    // The right-hand Lessons button should really open lessons, not
    // a hidden text panel with a misleading label.
    lessons.setAttribute('aria-label', 'Открыть уроки');
    lessons.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = './hsk1-map.html';
    }, {capture:true});
    setGeometry(stage, pandaImage);
    stage.dataset.paLayout = 'v546';
    complete = true;
    observer?.disconnect();
    window.dispatchEvent(new CustomEvent('panda-approved-layout-ready',{detail:{version:'v546'}}));
    return true;
  }

  function scan() {
    if (!complete) apply(document.getElementById('pg346'));
  }

  scan();
  if (!complete) {
    observer = new MutationObserver(scan);
    observer.observe(document.documentElement,{
      subtree:true,childList:true,attributes:true,attributeFilter:['data-pg500-mounted']
    });
    window.addEventListener('pageshow',scan,{once:true});
  }
})();
