/* Panda Go v129 approved design: real interactive elements + live routes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const hanzi=fs.readFileSync('hanzi-lab.html','utf8');
const css=fs.readFileSync('assets/panda-approved-lesson-ui-v129.css','utf8');
const hanziCss=fs.readFileSync('assets/panda-approved-hanzi-ui-v129.css','utf8');
const motion=fs.readFileSync('assets/panda-approved-lesson-ui-v129.js','utf8');
const menu=fs.readFileSync('assets/menu-v3-approved.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert(html.includes('panda-approved-lesson-ui-v129.css?v=1'),'Main UI stylesheet linked');
assert(html.includes('panda-approved-lesson-ui-v129.js?v=1'),'Sakura animation script linked');
assert(html.includes('menu-v3-approved.js?v=3'),'Menu cache query bumped');
assert(hanzi.includes('panda-hanzi-v130.css?v=130'),'Hanzi writer uses the isolated current presentation');
assert(!hanzi.includes('simple-learning.css'),'Conflicting legacy Hanzi rules are no longer loaded');
assert(css.includes('body[data-current-page="tones"]'),'Tone screen receives design');
assert(css.includes('#topics .clean-study-card'),'Vocabulary details receive design');
assert(css.includes('#topics .ch110-speech'),'Dialogue bubbles receive design');
assert(css.includes('#topics .clean-practice-card'),'Memory/practice receives design');
assert(css.includes('#quiz .quizpanel'),'Quiz receives design');
assert(hanziCss.includes('.paper'),'Live Hanzi canvas retained');
assert(css.includes('body:not(.launch-active):has(#tones.active)'),'Only active lesson animations');
assert(css.includes('prefers-reduced-motion:reduce'),'Motion preference honoured');
assert(!css.includes('#topics[data-simple-section]{'),'Do not restyle approved game shell');
assert(motion.includes("pointer-events")||css.includes('pointer-events:none'),'Petals cannot intercept taps');
assert(sw.includes('chinese-coach-pwa-v131'),'Fresh offline cache');
for(const name of ['panda-approved-lesson-ui-v129.css','panda-approved-lesson-ui-v129.js','panda-approved-hanzi-ui-v129.css']){
 assert(sw.includes(name),'Offline cache missing '+name);
}
const button=(n)=>'<button type="button" class="six-card" data-choice="'+n+'">Original '+n+'</button>';
const shell='<!doctype html><html><body class="launch-active">'+
 '<div id="launch-entry"><section id="launch-menu" class="six-lessons-menu"><div class="six-screen-content"><nav class="six-menu-cards">'+
 Array.from({length:7},(_,i)=>button(i)).join('')+'<a href="./travel.html" class="six-card six-travel">Travel</a></nav>'+
 '</div></section></div><button id="launch-back"></button><button id="launch-all"></button>'+
 '</body></html>';
const dom=new JSDOM(shell,{url:'https://example.test/chinese-coach-pwa/index.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.eval(menu);
assert.equal(d.querySelectorAll('.panda-v3-hit').length,5,'Five live main controls');
assert.equal(d.querySelectorAll('.panda-v3-petal').length,16,'Original decorative main sakura retained');
let events=[];
for(let i=0;i<7;i++)d.querySelector('[data-choice="'+i+'"]').onclick=()=>events.push(i);
d.querySelector('.panda-v3-learn').click();
assert.equal(d.querySelector('.panda-v3-panel').dataset.kind,'learn','Learn panel opened');
assert.equal(d.querySelectorAll('.panda-v3-subcard').length,4,'Four lessons');
assert.equal(d.querySelectorAll('.panda-v3-subcard-copy small').length,4,'Descriptions for clarity');
d.querySelector('.panda-v3-subcard').click();
assert.deepEqual(events,[0],'Original tone lesson handler preserved');
d.querySelector('.panda-v3-practice').click();
assert.equal(d.querySelector('.panda-v3-panel').dataset.kind,'practice');
assert.equal(d.querySelectorAll('.panda-v3-subcard').length,3,'Practice, quiz, game');
d.querySelectorAll('.panda-v3-subcard')[2].click();
assert.deepEqual(events,[0,6],'Original Game Practice handler preserved');
w.eval(motion);
assert.equal(d.querySelectorAll('.panda-v129-petal').length,12,'Only 12 lightweight petals');
assert.equal(d.querySelectorAll('.panda-v129-petals[aria-hidden=true]').length,1);
assert.equal(d.querySelectorAll('.six-menu-cards [data-choice]').length,7,'No existing lesson link removed');
w.close();
console.log('Panda v129 design OK: four study, three practice, real navigation, sakura, offline, Hanzi and Game safety.');
