/* Panda Go v372: five separable HD approved illustration layers and strict new-path sequential locks.
   Historical HSK1 progress is NEVER deleted, but old completions cannot
   automatically bypass the new seven-step gate. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-map.html','utf8');
const css=fs.readFileSync('assets/hsk1-layered-v372.css','utf8');
const gates=fs.readFileSync('assets/panda-go-hsk1-path-v371.js','utf8');
const ids=['foundations','pronouns','numbers','weekdays','dates','family','weather'];
const layers=['background','header','ribbons','panda','actions'];
for(const layer of layers){
 assert(html.includes('hsk1-approved-v373.png'),'Current map must use the immutable approved v373 artwork');
 assert(fs.statSync('assets/hsk1-v371-'+layer+'.webp').size>20000,'HD layer too small: '+layer);
}
assert(html.includes('class="artboard"')&&html.includes('class="approved"'),'Current approved artwork must have one responsive artboard');
for(const selector of ['pg-layer-header','pg-layer-ribbons','pg-layer-panda','pg-layer-actions'])assert(css.includes(selector),'Separate layer positioning missing: '+selector);
assert(!html.includes('class="pg-approved-art"'),'No unapproved retro artwork should replace the v373 PNG');
assert(html.includes('class="gate"')&&html.includes('.lesson.locked'),'Approved lock graphics and status must remain in the active map');
const cases=[
  [{},0],
  [{'pg-hsk1-v3-complete':JSON.stringify(ids)},0],
  [{'pg-hsk1-v3-pronouns':JSON.stringify({completed:true,maxStep:6,step:6})},0],
  [{'pg-hsk1-v3-complete':'bad JSON'},0],
  [{'pg-hsk1-path-v371':'1'},1],
  [{'pg-hsk1-path-v371':'2'},2],
  [{'pg-hsk1-path-v371':'3'},3],
  [{'pg-hsk1-path-v371':'6'},6],
  [{'pg-hsk1-path-v371':'7'},7],
  [{'pg-hsk1-path-v371':'bad JSON'},0]
];
for(const [initial,completed] of cases){
 const dom=new JSDOM(html,{url:'https://panda.test/hsk1-map.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;
 Object.entries(initial).forEach(([k,v])=>w.localStorage.setItem(k,v));
 const before=JSON.stringify({...w.localStorage});
 w.eval(d.querySelector('script:not([src])').textContent);
 assert.equal(JSON.stringify({...w.localStorage}),before,'Map must never reset student progress');
 assert.equal(d.querySelectorAll('nav.hotspots > a.lesson').length,7);
 const frontier=Math.min(7,completed+1);
 for(const node of d.querySelectorAll('nav.hotspots > a.lesson')){
   const n=Number(node.dataset.num);
   const url='./'+['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'][n-1];
   assert.equal(node.getAttribute('href').split('?')[0],url);
   assert.equal(node.classList.contains('locked'),n>frontier,'Lock mismatch for lesson '+n);
   assert.equal(node.classList.contains('done'),n<=completed,'Done mismatch for lesson '+n);
   assert.equal(node.classList.contains('current'),n===frontier&&n>completed,'Current mismatch for lesson '+n);
   assert.equal(node.getAttribute('aria-disabled'),String(n>frontier));
   if(n>frontier){
     const click=new w.MouseEvent('click',{bubbles:true,cancelable:true});
     assert.equal(node.dispatchEvent(click),false,'Locked lesson '+n+' must not navigate');
   }
 }
 dom.window.close();
}
const test=new JSDOM('<!doctype html><body></body>',{url:'https://panda.test',runScripts:'outside-only'}).window;
test.eval(gates);
assert.equal(test.PandaGoPathV371.completed(),0);
assert.equal(test.PandaGoPathV371.canOpen(2),false);
assert.equal(test.PandaGoPathV371.markComplete(2),false,'Cannot finish lesson 2 before lesson 1');
assert.equal(test.PandaGoPathV371.markComplete(1),true);
assert.equal(test.PandaGoPathV371.completed(),1);
assert.equal(test.PandaGoPathV371.canOpen(2),true);
for(let n=2;n<=7;n++)assert.equal(test.PandaGoPathV371.markComplete(n),true);
assert.equal(test.PandaGoPathV371.completed(),7);
assert.equal(test.PandaGoPathV371.markComplete(1),true,'Repeating completed lesson must be allowed');
test.close();
const sw=fs.readFileSync('sw.js','utf8'),core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
const installedShellCount=require('node:vm').runInNewContext(sw.slice(0,sw.indexOf("self.addEventListener('install'"))+'INSTALL_SHELL.length');
assert(installedShellCount<=200,'Current two-course offline app shell must stay bounded');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
for(const entry of [...layers.map(x=>'./assets/hsk1-v371-'+x+'.webp'),'./assets/hsk1-layered-v372.css?v=372','./assets/hsk1-approved-v373.png','./hsk2-start.html','./hsk2-introduction.html'])
 assert(core.includes(entry)||pack.files.includes(entry),'Offline download missing '+entry);
for(const entry of core)assert(fs.existsSync(entry.split('?')[0]),'Offline file missing on disk '+entry);
for(const [file,index] of [
 ['assets/hsk1-first-v189.js',1],['assets/hsk1-second-v203.js',2],['assets/hsk1-third-v213.js',3],
 ['assets/hsk1-fourth-v214.js',4],['assets/hsk1-fifth-v227.js',5]
]){
 const source=fs.readFileSync(file,'utf8');
 assert(source.includes("pg-hsk1-path-v371"),'Lesson '+index+' must update sequential progression when completed');
}
assert(fs.readFileSync('assets/panda-go-companion-v231.js','utf8').includes('PandaGoPathV371?.markComplete(lesson)'),'Lessons 6 and 7 must also unlock progression');
console.log('PASS v372: 5 HD layers, 7 sequential gates and per-lesson completion hooks, locked taps and preserved progress.');
