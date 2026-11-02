const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/#menu',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=>'';
w.speechSynthesis={getVoices:()=>[],cancel(){},speak(u){u.onend?.()}};w.SpeechSynthesisUtterance=function(text){this.text=text};
w.Audio=function(){this.play=()=>{this.onended?.();return Promise.resolve()};this.pause=()=>this.onpause?.()};
const scripts=[...d.scripts].map(s=>s.src?fs.readFileSync(decodeURI(new URL(s.src).pathname.replace('/chinese-coach-pwa/','')),'utf8'):s.textContent).join('\n').replace("'use strict';",'');
w.eval(scripts);
// All real entry-point scripts are evaluated, including the current game renderer.
w.openLearningTopics('dialogues');assert.equal(d.querySelectorAll('[data-dialog-lesson]').length,4);
let lines=0;
for(let topic=0;topic<4;topic++){
 d.querySelectorAll('[data-dialog-lesson]')[topic].click();
 do{lines+=d.querySelectorAll('.ch110-line').length;d.querySelector('[data-110-next]').click()}while(d.querySelector('[data-110-next]'));
}
assert.equal(lines,21,'Every dialogue line remains reachable');
d.querySelector('[data-dialog-lesson]').click();
assert(d.querySelector('.ch110-portrait').src.includes('approved-woman'));
assert(d.querySelectorAll('.ch110-portrait')[1].src.includes('approved-man'));
d.querySelector('[data-110-next]').click();
Object.defineProperty(w,'innerHeight',{value:390,configurable:true});w.dispatchEvent(new w.Event('resize'));
assert(d.querySelector('.ch110-heading span').textContent.includes('3–3'),'Rotation retains current line');
Object.defineProperty(w,'innerHeight',{value:852,configurable:true});w.dispatchEvent(new w.Event('resize'));
assert(d.querySelector('.ch110-heading span').textContent.includes('3–4'));
// Test pinyin can be toggled without changing current question or audio controls.
assert.equal(d.querySelectorAll('#quizplay').length,1);assert.equal(d.querySelectorAll('.approved-quiz-listen').length,0);
const hanzi=d.querySelector('#quizhanzi').textContent;
d.querySelector('#quiz-pinyin-toggle').click();assert(d.querySelector('#quizpinyin').hidden);
d.querySelector('#quiz-pinyin-toggle').click();assert(!d.querySelector('#quizpinyin').hidden);assert.equal(d.querySelector('#quizhanzi').textContent,hanzi);
for(let n=0;n<10;n++){
 const opts=[...d.querySelectorAll('#quizopts button')];assert.equal(opts.length,4);
 opts[0].click();assert(opts.every(x=>x.disabled));assert(d.querySelector('#quizfeedback').textContent);
 d.querySelector('#nextq').click();
}
assert(!d.querySelector('#quizend').classList.contains('hidden'));
d.querySelector('#resetquiz').click();assert(!d.querySelector('#quizbody').classList.contains('hidden'));
// Build every phrase in the actual v102 entry point, retaining the scene DOM on taps.
w.openGamePractice();d.querySelector('[data-game-mode="build"]').click();
const api=w.__gamePracticeV76;
assert(api&&api.items.length===10);
for(const q of api.items){
 const scene=d.querySelector('.ch110-build-screen');
 for(const [han] of q.parts){
  const tile=[...d.querySelectorAll('[data-game-token]')].find(x=>x.querySelector('strong').textContent===han);
  assert(tile,'Missing token '+han);tile.click();assert.equal(d.querySelector('.ch110-build-screen'),scene,'Scene must not be replaced on tap');
 }
 assert.equal(d.querySelectorAll('[data-game-remove]').length,q.parts.length);
 d.querySelector('[data-game-check]').click();assert(d.querySelector('.audit-feedback').textContent.includes('Верно'));
 d.querySelector('[data-game-check]').click();
}
assert.equal(api.getStats().points,100);assert.equal(api.getStats().completed,1);
d.querySelector('[data-game-hub]').click();d.querySelector('[data-game-mode="build"]').click();
d.querySelector('[data-game-token]').click();d.querySelector('[data-game-remove]').click();assert.equal(d.querySelectorAll('[data-game-remove]').length,0);
d.querySelector('[data-game-token]').click();d.querySelector('[data-game-clear]').click();assert.equal(d.querySelectorAll('[data-game-remove]').length,0);
d.querySelector('[data-game-check]').click();assert(d.querySelector('.audit-feedback').textContent.includes('Выбери'));
for(const mode of ['choose','listen']){
 d.querySelector('[data-game-back]').click();d.querySelector('[data-game-mode="'+mode+'"]').click();
 for(const q of api.items){
  const options=[...d.querySelectorAll('[data-game-option]')];assert.equal(options.length,3);
  const match=options.find(x=>x.textContent.includes(mode==='choose'?q.ru:q.zh));assert(match);match.click();
  d.querySelector('[data-game-check]').click();assert(d.querySelector('.audit-feedback').textContent.includes('Верно'));d.querySelector('[data-game-check]').click();
 }
 d.querySelector('[data-game-hub]').click();d.querySelector('[data-game-mode="build"]').click();
}
assert.equal(api.getStats().completed,3);
// Local assets referenced by the canonical stylesheet and by HTML exist.
const css=fs.readFileSync('assets/approved-mobile-v112.css','utf8');
for(const m of css.matchAll(/url\(['"]?\.\/([^'"\)]+)/g))assert(fs.existsSync('assets/'+m[1]),m[1]);
console.log('v112 passed: 21 dialogue lines, orientation anchor, single quiz audio control, pinyin, all 10 quiz questions, 30 game answers, stable scene DOM, clear/remove, persisted scores, image inventory.');
w.close();
