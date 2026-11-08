const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-map.html','utf8');
const ids=['foundations','pronouns','numbers','weekdays','dates','family','weather'];
for(const initial of [{},{'pg-hsk1-v3-complete':JSON.stringify(['foundations'])},{'pg-hsk1-v3-complete':JSON.stringify(['foundations','weather'])},{'pg-hsk1-v3-pronouns':JSON.stringify({completed:true,maxStep:6,step:6})},{'pg-hsk1-v3-complete':'bad JSON'}]){
 const dom=new JSDOM(html,{url:'https://test.local/',runScripts:'outside-only'}),w=dom.window;
 Object.entries(initial).forEach(([k,v])=>w.localStorage.setItem(k,v));
 const before=JSON.stringify({...w.localStorage});w.eval(w.document.querySelector('script').textContent);
 assert.equal(w.document.querySelectorAll('.node').length,7);
 assert.equal(JSON.stringify({...w.localStorage}),before,'Map must not write or reset saved progress');
 for(const n of w.document.querySelectorAll('.node')){assert.equal(n.getAttribute('href'),n.dataset.num==='1'?'./hsk1-first-v189.html':n.dataset.num==='2'?'./hsk1-second-v203.html':'./hsk1-lesson.html?lesson='+n.dataset.num);if(n.classList.contains('locked')){const ev=new w.MouseEvent('click',{bubbles:true,cancelable:true});assert.equal(n.dispatchEvent(ev),false,'Locked lesson prevents navigation');assert.equal(n.getAttribute('aria-disabled'),'true')} }
 if(initial['pg-hsk1-v3-complete']?.includes('foundations'))assert(w.document.querySelector('[data-num="2"]').classList.contains('current'));
 if(initial['pg-hsk1-v3-complete']?.includes('weather'))assert(!w.document.querySelector('[data-num="7"]').classList.contains('locked'));
 dom.window.close();
}
const sw=fs.readFileSync('sw.js','utf8'),core=JSON.parse(sw.match(/const CORE=(\[[^\n]+\])/)[1]);assert(core.length<=141);for(const f of core)assert(fs.existsSync(f.split('?')[0]),f);
console.log('PASS v175: seven authentic links, locked navigation, completed and out-of-order lessons, malformed state, no progress writes, at most 141 offline files.');
