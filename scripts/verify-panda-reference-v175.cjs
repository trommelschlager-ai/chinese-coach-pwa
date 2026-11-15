/* Panda Go v371: exact HD approved map and strict new-path sequential locks.
   Historical HSK1 progress is NEVER deleted, but old completions cannot
   automatically bypass the new seven-step gate. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-map.html','utf8');
const css=fs.readFileSync('assets/hsk1-approved-exact-v371.css','utf8');
const gates=fs.readFileSync('assets/panda-go-hsk1-path-v371.js','utf8');
const ids=['foundations','pronouns','numbers','weekdays','dates','family','weather'];
assert(html.includes('panda-go-hsk1-approved-v371.png'),'Original full-resolution illustration missing');
assert(html.includes('hsk1-approved-exact-v371.css?v=371'),'Approved map styles missing');
assert(css.includes('top:-11.913%'),'Fake browser toolbar must be cropped');
assert(css.includes('node.locked')&&css.includes('pg-gate'),'Lock graphics and status missing');
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
 w.eval(d.querySelector('script').textContent);
 assert.equal(JSON.stringify({...w.localStorage}),before,'Map must never reset student progress');
 assert.equal(d.querySelectorAll('nav.map-road > a.node').length,7);
 const frontier=Math.min(7,completed+1);
 for(const node of d.querySelectorAll('nav.map-road > a.node')){
   const n=Number(node.dataset.num);
   const url=n===1?'./hsk1-first-v189.html':n===2?'./hsk1-second-v203.html':n===3?'./hsk1-third-v212.html':n===4?'./hsk1-fourth-v214.html':n===5?'./hsk1-fifth-v227.html':'./hsk1-lesson.html?lesson='+n;
   assert.equal(node.getAttribute('href'),url);
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
assert(core.length<=170,'Offline app shell budget must remain below 170 entries');
for(const entry of ['./assets/panda-go-hsk1-approved-v371.png','./assets/hsk1-approved-exact-v371.css?v=371','./assets/panda-go-hsk1-path-v371.js?v=371','./hsk2-start.html','./hsk2-introduction.html'])assert(core.includes(entry),'Offline file missing '+entry);
for(const entry of core)assert(fs.existsSync(entry.split('?')[0]),'Offline file missing on disk '+entry);
console.log('PASS v371: exact HD illustration, 7 sequential gates, locked taps, repeated lessons and legacy progress preserved.');
