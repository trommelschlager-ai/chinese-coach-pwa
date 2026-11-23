import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const load=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const html=load('../panda-voice-pilot.html');
const mirror=load('../panda-ai-hsk2-preview.html');
const script=load('../assets/panda-ai-approved-layout-v547.js');
const css=load('../assets/panda-ai-approved-layout-v547.css');

test('approved screenshot is implemented as real DOM controls, not a flat screenshot',()=>{
  assert.match(script,/navigation.replaceChildren\(home, history, panda, profile\)/);
  assert.match(script,/history.classList.add\('pa-nav-history'\)/);
  assert.match(script,/history.innerHTML = historySvg \+ '<span>История<\/span>'/);
  assert.match(script,/rail.querySelector\('\.pg500-side-game'\)\?\.remove\(\)/);
  assert.match(script,/const lessons = rail\?\.querySelector\('\.pg500-side-book'\)/);
  assert.match(script,/const topics = rail\?\.querySelector\('#pg346-topics-btn'\)/);
  assert.match(script,/window.location.href = '\.\/hsk1-map.html'/);
});
test('old listeners are preserved on moved history button and regular Panda chat',()=>{
  assert.match(script,/navigation.replaceChildren\(home, history, panda, profile\)/);
  assert.doesNotMatch(script,/cloneNode\(/);
  assert.match(script,/if \(new URLSearchParams\(location.search\).get\('scenario'\) === 'hsk2-my-day'\) return/);
  assert.match(script,/stage.dataset.paLayout = 'v547'/);
  assert.match(css,/#pg346\[data-pa-layout="v547"\]/);
  assert.match(script,/event.stopImmediatePropagation\(\)/);
});
test('Panda and original stone use static stage coordinates through keyboard resize',()=>{
  assert.match(script,/stage.dataset.paGeometrySet = 'true'/);
  assert.match(script,/--pa-panda-top/);
  assert.match(script,/--pa-stone-top/);
  assert.match(script,/Do not recalculate geometry when the Android keyboard/);
  assert.match(css,/position:static!important;container-type:normal!important/);
  assert.match(css,/top:var\(--pa-panda-top/);
  assert.match(css,/top:var\(--pa-stone-top/);
  assert.match(css,/panda-exact-stone-v361.webp/);
  assert.match(css,/animation:none!important/);
});
test('four footer controls and lowered pair of right controls match approved image',()=>{
  assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/);
  assert.match(css,/top:71\.5%!important/);
  assert.match(css,/\.pg500-side-game\{display:none!important\}/);
  assert.match(css,/\.pg346-nav \.pa-nav-history span/);
});
test('both pages, offline pack and service worker use exact new layout version',()=>{
  for(const page of [html,mirror]){
    assert.match(page,/panda-ai-approved-layout-v547\.css\?v=547/);
    assert.match(page,/panda-ai-approved-layout-v547\.js\?v=547/);
  }
  const pack=JSON.parse(load('../assets/offline-pack.json'));
  const sw=load('../sw.js');
  assert.equal(pack.version,547);
  assert.match(sw,/const CACHE='chinese-coach-pwa-v547-/);
  for(const file of ['./assets/panda-ai-approved-layout-v547.css?v=547','./assets/panda-ai-approved-layout-v547.js?v=547']){
    assert(pack.files.includes(file),'missing offline file '+file);
    assert(sw.includes(file),'missing worker preload '+file);
  }
  assert.doesNotMatch(script,/\.mp3|Audio\(/);
});
