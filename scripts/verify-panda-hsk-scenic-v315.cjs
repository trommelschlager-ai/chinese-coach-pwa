'use strict';
/* Panda Go v315: approved scenic two-level home, real links and existing petals. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const js=read('assets/panda-v130.js'),css=read('assets/panda-hsk-scenic-v315.css');
const index=read('index.html'),sw=read('sw.js'),pack=JSON.parse(read('assets/offline-pack.json'));
assert(index.includes('panda-hsk-scenic-v315.css?v=315'),'New scenic CSS must load');
assert(index.includes('panda-v130.js?v=315'),'New home JS must bypass old cached versions');
const first=js.indexOf('function home(){'),last=js.indexOf('function learn(){',first);
assert(first>=0 && last>first,'Home section not found');
const output=[];const frame=(html,cls)=>output.push({html,cls});
vm.runInNewContext(js.slice(first,last)+'\nhome();',{frame,esc:s=>String(s)});
assert.equal(output.length,1);
const {html}=output[0];const dom=new JSDOM('<main id="pg130">'+html+'</main>');
const root=dom.window.document.getElementById('pg130');
const levels=[...root.querySelectorAll('nav.pg-hsk-level-list > a.pg-hsk-choice')];
assert.equal(levels.length,2,'Only two real level links should be displayed');
assert.deepEqual(levels.map(x=>x.getAttribute('href')),['./hsk1-map.html','./hsk2-start.html#map']);
assert.deepEqual(levels.map(x=>x.querySelector('strong')?.textContent),['Начальный уровень','Продолжающий уровень']);
assert.deepEqual(levels.map(x=>x.querySelector('small')?.textContent),['Китайский с нуля','Знакомство и разговор']);
for(const button of levels){
 assert(button.getAttribute('aria-label')?.includes('Открыть уровень'),'Button not accessible');
 assert(button.querySelector('svg.pg-hsk-illustration'),'Decorative educational illustration missing');
 assert(button.querySelector('.pg-hsk-choice-arrow'),'Active navigation arrow missing');
}
assert(root.querySelector('svg text')?.textContent==='初','Beginning scroll should carry 初, not HSK1');
assert(root.innerHTML.includes('pg315book'),'Advanced icon must be a book with dialogues rather than a fan');
assert(root.querySelector('img.pg-hsk-bridge')?.getAttribute('src')==='./assets/panda-reference-v175/bridge.webp','Scenic bridge must remain');
assert(root.querySelector('img.pg-hsk-backdrop img')===null || root.querySelector('.pg-hsk-backdrop img')?.getAttribute('src')==='./assets/panda-reference-v175/hero.webp','Approved panda hero missing');
assert(!levels.some(el=>el.textContent.includes('HSK')),'No HSK numeric labels on the buttons');
const petalSection=js.slice(js.indexOf('function petalMarkup(){'),js.indexOf('// Keep the shell',js.indexOf('function petalMarkup(){')));
assert(petalSection.includes('length:18') && petalSection.includes('pg-sakura-petal'),'Old animated falling petals removed');
assert(css.includes('#pg130 .pg-sakura') && css.includes('pointer-events:none!important'),'Petals must remain non-interactive');
for(const p of ['./assets/panda-v130/landscape.webp','./assets/panda-v130/flowers.webp','./assets/panda-reference-v175/hero.webp','./assets/panda-reference-v175/bridge.webp'])
 assert(fs.existsSync(p),'Scenic asset missing: '+p);
for(const q of ['linear-gradient','box-shadow','mask-image','pg-hsk-choice-blue','pg-hsk-illustration'])
 assert(css.includes(q),'Missing neon button or continuous background style '+q);
const core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);
for(const name of ['./assets/panda-v130.js?v=315','./assets/panda-hsk-scenic-v315.css?v=315','./hsk2-start.html','./hsk2-introduction.html']){
 assert(core.includes(name),'Offline CORE missing '+name);
 assert(pack.files.includes(name),'Offline pack missing '+name);
}
assert(read('hsk2-start.html').includes('./hsk2-introduction.html'),'HSK2 introduction link broken');
assert(read('hsk1-map.html').includes('pg-hsk1-v3-complete'),'HSK1 progress keys changed');
dom.window.close();
console.log('PASS v315: two accessible live levels, luminous scenery, initial scroll, conversation book, old petals, HSK1 progress and HSK2 routes.');
