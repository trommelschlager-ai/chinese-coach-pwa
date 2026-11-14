'use strict';
/* Exact user-approved photo 1: immutable visual asset, real level hotspots, old petals */
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const jpeg=fs.readFileSync('assets/panda-home-approved-photo1-v319.jpg');
assert.equal(jpeg.length,479610,'The original photo must remain uncompressed and unmodified');
assert.equal(crypto.createHash('sha256').update(jpeg).digest('hex'),'cf1ea6a501ff657a504a40b2a2f44693b0ad88b6c8383dc7f1d9a57cd3406e24','Panda face and scenery cannot be changed');
assert.equal(jpeg[0],255);assert.equal(jpeg[1],216,'Original JPEG signature lost');
const js=read('assets/panda-v130.js'),css=read('assets/panda-home-photo1-v319.css'),index=read('index.html');
const sw=read('sw.js'),pack=JSON.parse(read('assets/offline-pack.json'));
assert(index.includes('panda-v130.js?v=319'),'Updated home JS must load');
assert(index.includes('panda-home-photo1-v319.css?v=319'),'Exact image cover CSS must load');
const start=js.indexOf('function home(){'),end=js.indexOf('\nfunction learn(){',start);
assert(start>=0&&end>start,'Home function not found');
const frames=[];
vm.runInNewContext(js.slice(start,end)+'\nhome();',{frame:(html,cls)=>frames.push({html,cls}),esc:s=>String(s)});
assert.equal(frames.length,1);
assert(frames[0].cls.includes('pg-photo1-home'),'Photo1 visual screen not active');
const dom=new JSDOM('<main id="pg130">'+frames[0].html+'</main>');
const document=dom.window.document;
const image=document.querySelector('.pg-photo1-image');
assert.equal(image?.getAttribute('src'),'./assets/panda-home-approved-photo1-v319.jpg','Only exact original image can appear');
assert.equal(image.getAttribute('width'),'864');assert.equal(image.getAttribute('height'),'1536');
const buttons=[...document.querySelectorAll('nav.pg-hsk-level-list > a.pg-photo1-hit')];
assert.equal(buttons.length,2,'Only two working hotspots');
assert.deepEqual(buttons.map(x=>x.getAttribute('href')),['./hsk1-map.html','./hsk2-start.html#map']);
assert.deepEqual(buttons.map(x=>x.querySelector('strong')?.textContent),['Начальный уровень','Продолжающий уровень']);
assert(buttons.every(x=>x.getAttribute('aria-label')?.includes('Открыть уровень')),'Buttons must remain accessible and functional');
assert(!document.querySelector('.pg-hsk-bridge'),'No separate blurry bridge may overlay the original landscape');
assert(!document.querySelector('.pg-hsk-choice-art'),'No redrawn graphic may replace the approved screenshot');
for(const key of ['object-fit:contain','image-rendering:auto','filter:none!important','pg-photo1-hit-1{top:45.7%}','pg-photo1-hit-2{top:59.9%}','pointer-events:auto','clip-path:inset(50%)'])assert(css.includes(key),'Exact artboard or interactive overlay missing: '+key);
assert(css.includes('56.25cqh')&&css.includes('177.77778cqw'),'Cover must preserve photo aspect across Android screens');
const petals=js.slice(js.indexOf('function petalMarkup(){'),js.indexOf('// Keep the shell',js.indexOf('function petalMarkup(){')));
assert(petals.includes('length:18')&&petals.includes('pg-sakura-petal'),'Original falling petals removed');
assert(css.includes('#pg130 .pg-sakura')&&css.includes('pointer-events:none!important'),'Petals must never block navigation');
for(const file of ['hsk1-map.html','hsk2-start.html','hsk2-introduction.html'])assert(fs.existsSync(file),'Level page missing: '+file);
assert(read('hsk1-map.html').includes('pg-hsk1-v3-complete'),'HSK 1 progress storage must remain unchanged');
assert(read('hsk2-start.html').includes('./hsk2-introduction.html'),'HSK 2 lesson navigation unavailable');
const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
const optionalArt=JSON.parse(sw.match(/const CORE_ART=new Set\((\[[^\n]+\])\)/)[1]);
const shell=core.filter(path=>!/.\.(?:mp3|ogg)(?:\?|$)/i.test(path)&&(!/.\.(?:png|jpe?g|webp)(?:\?|$)/i.test(path)||optionalArt.includes(path)));

for(const file of ['./assets/panda-v130.js?v=319','./assets/panda-home-photo1-v319.css?v=319','./assets/panda-home-approved-photo1-v319.jpg']){
 assert(shell.includes(file),'PWA install shell missing '+file);
 assert(pack.files.includes(file),'Offline download missing '+file);
}
assert(shell.length<=170,'Too many install shell assets');
dom.window.close();
console.log('PASS v319: original photo1 verified SHA-256, lossless background, two functional level links, aspect preserved, falling petals and existing HSK1+HSK2.');
