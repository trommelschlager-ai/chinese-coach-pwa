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
const currentHomeScript=index.match(/panda-v130\.js\?v=\d+/)?.[0];assert(currentHomeScript,'Updated home JS must load');
assert(index.includes('panda-home-photo1-v319.css?v=319'),'Exact image cover CSS must load');
const hasFour=js.includes('function homeLegacy(){');
const start=js.indexOf(hasFour?'function homeLegacy(){':'function home(){'),end=js.indexOf('\nfunction learn(){',start);
assert(start>=0&&end>start,'Home function not found');
const frames=[];
vm.runInNewContext(js.slice(start,end)+(hasFour?'\nhomeLegacy();':'\nhome();'),{frame:(html,cls)=>frames.push({html,cls}),esc:s=>String(s)});
assert.equal(frames.length,1);
assert(frames[0].cls.includes('pg-photo1-home'),'Photo1 visual screen not active');
const dom=new JSDOM('<main id="pg130">'+frames[0].html+'</main>');
const document=dom.window.document;
const image=document.querySelector('.pg-photo1-image');
assert.equal(image?.getAttribute('src'),'./assets/panda-home-approved-photo1-v319.jpg','Only exact original image can appear');
assert.equal(image.getAttribute('width'),'864');assert.equal(image.getAttribute('height'),'1536');
const buttons=[...document.querySelectorAll('nav.pg-hsk-level-list > a.pg-photo1-hit')];
assert.equal(buttons.length,2,'Only two working hotspots');
assert.deepEqual(buttons.map(x=>x.getAttribute('href')),['./hsk1-map.html','./hsk2-life-course.html?view=welcome']);
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
const hsk1Map=read('hsk1-map.html');
assert(hsk1Map.includes('pg-hsk1-v3-complete')||(hsk1Map.includes('pg-hsk1-path-v371')&&!hsk1Map.includes('localStorage.clear(')&&!hsk1Map.includes("removeItem('pg-hsk1-v3-complete'")),'HSK 1 progress must remain saved without wiping historical data');
assert(read('hsk2-start.html').includes('./hsk2-introduction.html'),'HSK 2 lesson navigation unavailable');
const shell=require('node:vm').runInNewContext(
 sw.slice(0,sw.indexOf("self.addEventListener('install'"))+'INSTALL_SHELL'
);

for(const file of ['./assets/'+currentHomeScript,'./assets/panda-home-photo1-v319.css?v=319','./assets/panda-home-approved-photo1-v319.jpg']){
 assert(shell.includes(file),'PWA install shell missing '+file);
 assert(pack.files.some(url=>url.split('?')[0]===file.split('?')[0]),'Offline pack missing corresponding asset '+file);
}
assert(shell.length<=200,'Approved two-course shell must stay reasonably bounded');
dom.window.close();
console.log('PASS v319: original photo1 verified SHA-256, lossless background, two functional level links, aspect preserved, falling petals and existing HSK1+HSK2.');

if(hasFour){
 const png=fs.readFileSync('assets/panda-home-approved-four-levels.png');
 assert.equal(crypto.createHash('sha1').update('blob '+png.length+'\0').update(png).digest('hex'),'c435d52d7a1f36fa04ce9c03f75bf132b9a80527','Approved PNG must not be modified');
 assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
 const active=new JSDOM('<main id="pg130"></main>');
 const document=active.window.document,root=document.querySelector('#pg130');
 let pending;
 class FakeImage{constructor(){pending=this}}
 const vmContext={document,root,Image:FakeImage,current:'home',esc:s=>String(s),setTimeout:()=>0,frame:(html,cls)=>{root.innerHTML=html;root.className=cls}};
 const from=js.indexOf('const homeFourArt=');
 const entry=js.includes('function homeFour(){')?'homeFour':'home';
 assert(from>=0&&from<start);
 vmContext.home=()=>vm.runInContext(entry+'()',vmContext);
 vm.createContext(vmContext);
 vm.runInContext(js.slice(from,end)+'\n'+entry+'();',vmContext);
 assert(root.querySelector('.pg-photo1-image'),'Legacy fallback remains until new art loads');
 assert.equal(pending.src,'./assets/panda-home-approved-four-levels.png');
 pending.onload();
 assert(root.classList.contains('pg-four-approved'));
 const art=root.querySelector('.pg-four-art');
 assert.equal(art.getAttribute('src'),pending.src);
 assert.equal(art.getAttribute('width'),'1024');assert.equal(art.getAttribute('height'),'1536');
 const hits=[...root.querySelectorAll('nav .pg-four-hit')];
 assert.equal(hits.length,4);
 assert.deepEqual(hits.slice(0,3).map(x=>x.getAttribute('href')),['./hsk1-map.html','./hsk2-life-course.html?view=welcome','./panda-street-hsk1-map.html']);
 assert(hits.every(x=>x.getAttribute('aria-label')));
 assert.equal(hits[3].tagName,'BUTTON');
 const note=root.querySelector('.pg-four-note');assert(note.hidden);hits[3].click();assert(!note.hidden);assert.match(note.textContent,/в разработке/);
 for(const p of ['hsk1-map.html','hsk2-life-course.html','panda-street-hsk1-map.html'])assert(fs.existsSync(p));
 const course=vm.runInNewContext(sw.slice(0,sw.indexOf("self.addEventListener('install'"))+'COURSE_SHELL');
 assert(course.includes('./assets/panda-home-approved-four-levels.png'));assert(course.includes('./panda-street-hsk1-map.html'));
 active.window.close();
 console.log('PASS home261: immutable four-level PNG, loading fallback, three routes and fourth-level notice.');
}

if(js.includes('const homeSixArt=')){
 const png=fs.readFileSync('assets/panda-home-approved-six-20261127.png');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
 const live=new JSDOM('<main id="pg130"></main>');
 const document=live.window.document,root=document.querySelector('#pg130');
 const pending=[];
 class FakeImage{constructor(){pending.push(this)}}
 const context={document,root,Image:FakeImage,current:'home',esc:s=>String(s),setTimeout:()=>0,frame:(html,cls)=>{root.innerHTML=html;root.className=cls}};
 const from=js.indexOf('const homeSixArt=');
 vm.runInNewContext(js.slice(from,end)+'\nhome();',context);
 assert(root.querySelector('.pg-photo1-image'));
 assert.equal(pending.length,2);
 const latest=pending.find(i=>i.src==='./assets/panda-home-approved-six-20261127.png');assert(latest);
 latest.onload();assert(root.classList.contains('pg-six-approved'));
 const hits=[...root.querySelectorAll('.pg-six-hit')];assert.equal(hits.length,6);
 assert.deepEqual(hits.map(x=>x.getAttribute('href')),['./hsk1-map.html','./hsk2-life-course.html?view=welcome','./panda-street-hsk1-map.html',null,'./panda-voice-pilot.html','./panda-street-ai-preview.html']);
 assert(hits.every(x=>x.getAttribute('aria-label')));
 const art=root.querySelector('.pg-six-art');assert(art);assert.equal(root.querySelectorAll('.pg-six-art').length,1);assert.equal(art.getAttribute('src'),latest.src);assert.equal(art.getAttribute('width'),'1024');assert.equal(art.getAttribute('height'),'1536');assert(!root.querySelector('.pg-six-row,.pg-six-scene'));assert.equal(root.querySelectorAll('.pg-six-extension').length,2);
 const note=root.querySelector('.pg-six-note');assert(note.hidden);hits[3].click();assert(!note.hidden);
 const course=vm.runInNewContext(sw.slice(0,sw.indexOf("self.addEventListener('install'"))+'COURSE_SHELL');
 assert(course.includes(latest.src));assert(pack.files.some(x=>x.split('?')[0]===latest.src));
 live.window.close();console.log('PASS six-level home: approved original, six accessible controls, offline asset and old fallback.');
}
