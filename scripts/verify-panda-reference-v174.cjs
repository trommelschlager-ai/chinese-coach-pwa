'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('index.html'),map=read('hsk1-map.html'),voice=read('assets/hsk1-voices-map-v160.js');
const js=read('assets/panda-v130.js'),css=read('assets/panda-reference-faithful-v174.css'),sw=read('sw.js');
const pack=JSON.parse(read('assets/offline-pack.json'));
assert(home.includes('panda-v130.js?v=174'),'Home needs fresh JS');
for(const [name,text] of [['home',home],['map',map]]) assert(text.includes('panda-reference-faithful-v174.css?v=174'),'Approved CSS not included in '+name);
assert(js.includes('panda-go-hero-clean-v174.webp'),'Approved clean panda hero not referenced');
for(let n=1;n<=3;n++)assert(js.includes("panda-hsk-card-'+n+'-v174.webp"),'Illustrated HSK card template missing');
assert(js.includes("['4','fan'")&&js.includes("['5','lantern'")&&js.includes("['6','pagoda'"),'Approved themed HSK illustrations must stay');
const d=new JSDOM(map).window.document;
assert.equal(d.querySelectorAll('nav.map-road > a.node').length,7,'7 HTML map links must remain');
assert(d.querySelector('.pg-stone-stairs')?.getAttribute('src')?.includes('panda-stone-staircase-v174.webp'),'Stone step artwork missing');
assert(d.querySelector('.panda')?.getAttribute('src')==='./assets/panda-explorer-v174.svg','Explorer panda missing');
assert(map.includes('pg-hsk1-v3-complete')&&map.includes('localStorage'),'Original lesson progress must be retained');
assert(map.includes('event.preventDefault()'),'Locked lessons must not navigate');
assert(css.includes('panda-hsk1-mountain-v174.webp'),'Approved derived mountain panorama missing');
assert(css.includes('.map-shell .node.current'),'Working progress card style missing');
assert(css.includes('#pg130 .pg-hsk-page .pg-hsk-level'),'HSK1-6 buttons missing');
assert(voice.includes('female'),'Female Mandarin voices must not be overwritten');
const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
assert.equal(core.length,131,'ServiceWorker critical assets budget must remain 131');
for(const file of ['./assets/panda-go-hero-clean-v174.webp',
 './assets/panda-hsk1-mountain-v174.webp',
 './assets/panda-stone-staircase-v174.webp',
 './assets/panda-explorer-v174.svg',
 './assets/panda-reference-faithful-v174.css?v=174',
 './assets/panda-v130.js?v=174']){
 assert(core.includes(file),'Critical offline file missing '+file);
}
for(const path of ['assets/panda-go-hero-clean-v174.webp','assets/panda-hsk1-mountain-v174.webp',
 'assets/panda-stone-staircase-v174.webp','assets/panda-explorer-v174.svg',
 'assets/panda-hsk-card-1-v174.webp','assets/panda-hsk-card-2-v174.webp','assets/panda-hsk-card-3-v174.webp'])assert(fs.existsSync(path),'Asset missing from repo '+path);
assert.equal(pack.version,174);
console.log('PASS v174: approved-art home/map, illustrated HSK icons, stone road and explorer, seven functional lessons, original voice/progress, 131-file offline core.');
