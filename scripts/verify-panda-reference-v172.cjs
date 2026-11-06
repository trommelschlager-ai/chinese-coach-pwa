'use strict';
/* Panda Go v172: approved three-screen reference, with real HTML controls rather than flattened screenshot buttons. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const read=f=>fs.readFileSync(f,'utf8');
const root=read('index.html'),map=read('hsk1-map.html'),lesson=read('hsk1-lesson.html');
const homeJs=read('assets/panda-v130.js'),stepsJs=read('assets/hsk1-foundations-v152.js');
const css=read('assets/panda-approved-three-screen-v172.css');
const sw=read('sw.js');
const pack=JSON.parse(read('assets/offline-pack.json'));
for(const [pageName,page] of [['home',root],['map',map],['lesson',lesson]])
 assert(page.includes('assets/panda-approved-three-screen-v172.css?v=172'),
  'Missing visual reference CSS in '+pageName);
assert(root.includes('panda-v130.js?v=172'),'Home script cache must refresh');
assert(lesson.includes('hsk1-foundations-v152.js?v=172'),'Lesson step icons must refresh');
assert(homeJs.includes('panda-go-home-v136-clean.png'),'Existing approved panda hero must remain');
assert(stepsJs.includes('pg-hsk1-v3-'),'Persisted lesson progress must stay isolated');
assert(stepsJs.includes('FEMALE_SPEED_KEY'),'Lesson audio speed must remain working');
assert(lesson.includes('hsk1-voices-map-v160.js'),'Do not alter the female and male voice assignments');
assert(lesson.includes('hsk1-native-human-map-v167.js'),'Existing 59 real voice samples remain available');
for(const name of ['fan','lantern','pagoda'])
 assert(homeJs.includes(name+':'),'HSK 4–6 motif '+name+' missing');
const levelSection=homeJs.slice(homeJs.indexOf('function home(){'),homeJs.indexOf('function learn(){'));
for(const item of ["['1','brush'","['2','book'","['3','chat'","['4','fan'","['5','lantern'","['6','pagoda'"])
 assert(levelSection.includes(item),'Approved HSK 1–6 order/image missing '+item);
assert(levelSection.includes('href="./hsk1-map.html"'),'HSK1 must open actual map');
assert(levelSection.includes('pg-hsk-unavailable'),'Future HSK2–6 must not lead to broken pages');
const m=new JSDOM(map).window.document;
assert.equal(m.querySelectorAll('nav.map-road > a.node').length,7,'Map must display seven actual lessons');
assert.equal(m.querySelectorAll('nav.map-road > a[href^="./hsk1-lesson.html?lesson="]').length,7);
assert(map.includes('pg-hsk1-v3-complete'),'HSK map progress must use original storage key');
assert(map.includes('assets/game-panda-v76.svg'),'Original transparent panda stays on road');
const l=new JSDOM(lesson).window.document;
assert(l.querySelector('#lesson-next')&&l.querySelector('#lesson-prev'),'Real lesson navigation is required');
assert(l.querySelector('#lesson-progress[role="progressbar"]'),'Seven-step progress remains accessible');
assert(l.querySelector('#hsk1-female-voice-speed'),'Speaker speed setting remains accessible');
assert(stepsJs.includes("['Новые слова','📖']")&&stepsJs.includes("['Диалог','💬']"),
 'Seven stage icons must align to the mockup');
for(const selector of ['#pg130 .pg-hsk-level-list','.map-shell .map-road','.lesson-shell .lesson-step.active',
 '.lesson-shell .lesson-line .lesson-hanzi','.lesson-shell .lesson-progress::after'])
 assert(css.includes(selector),'Approved design lacks '+selector);
for(const keep of ['panda-go-home-v136-clean.png','approved-panda-lake-v112.webp','panda-v130/landscape.webp','panda-v130/flowers.webp'])
 assert(css.includes(keep)||homeJs.includes(keep),'Approved landscape asset missing '+keep);
const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
assert(core.length<=131,'Install must remain under 131 critical assets');
assert(core.includes('./assets/panda-approved-three-screen-v172.css?v=172'),'Offline style is not in critical assets');
assert(core.includes('./assets/panda-v130.js?v=172'),'New home must work offline');
assert(core.includes('./assets/hsk1-foundations-v152.js?v=172'),'Lesson controls must work offline');
assert(pack.version===172&&pack.files.includes('./assets/panda-approved-three-screen-v172.css?v=172'),
 'Full offline pack must carry the new art stylesheet');
console.log('PASS v172: 3 real approved screens, 6 HSK buttons, 7 real map lessons, 7 stages, voice/progress untouched and offline reference styles.');
