'use strict';
/* HSK1 dates v227 regression: real 14-step DOM, buttons, persistent completion.
 * Existing audio is mocked here only; Android listening requires device QA.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-fifth-v227.html','utf8');
const js=fs.readFileSync('assets/hsk1-fifth-v227.js','utf8');
const css=fs.readFileSync('assets/panda-go-approved-lessons-v231.css','utf8');
const data=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
// Query versions advance for cache refreshes; keep the original asset identity
// and a monotonic floor instead of pinning an obsolete 2026 version.
const lessonJs=html.match(/src=["']\.\/assets\/hsk1-fifth-v227\.js\?v=(\d+)["']/);
assert(lessonJs&&Number(lessonJs[1])>=371,'Active HSK1 lesson 5 JavaScript missing or stale');
assert(html.includes('panda-lesson-audio-v240.js?v=248'));
const lessonCss=html.match(/href=["']\.\/assets\/panda-go-approved-lessons-v231\.css\?v=(\d+)["']/);
assert(lessonCss&&Number(lessonCss[1])>=237,'Approved HSK1 lesson 5 stylesheet missing or stale');
assert(!html.includes('lesson3-approved-panda'),'Wrong screenshot mosaic must never return');
assert(css.includes('lesson5-scene-v233.webp'),'Approved illustrated calendar scene required');
assert(css.includes('#faedff')&&css.includes('#fff7ff'),'Approved pale-lilac and pearl-pink palette required');
new (require('node:vm').Script)(js);
const dom=new JSDOM(html,{url:'https://panda.test/hsk1-fifth-v227.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.eval(data);
w.PANDA_HSK1_VOICES={female:Object.fromEntries(['四月','十一月','十二月'].map(x=>[x,'./assets/recordings/'+encodeURIComponent(x)+'.mp3'])),male:{}};
w.Audio=function(file){this.src=file;this.pause=()=>{};this.play=()=>{this.onended?.();return Promise.resolve()};};
w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
w.eval(js);
const steps=()=>Number(d.getElementById('pg5-count').textContent.split(' ')[0]);
const click=(selector)=>{
 const x=d.querySelector(selector);assert(x,'Missing '+selector+' on screen '+steps());
 assert(!x.disabled,'Disabled '+selector+' on screen '+steps());x.click();return x;
};
assert.equal(steps(),1);
assert(d.querySelector('.intro-art'),'Panda intro missing');
assert(d.querySelectorAll('.cover-milestones>div').length===3,'Approved 3-month cover examples missing');
assert(!d.getElementById('pg5-stage').textContent.includes('2026年11月10日'),'Remove the date beside the panda in the first approved image');
for(let i=1;i<9;i++){click('#pg5-next');assert.equal(steps(),i+1);}
assert.equal(steps(),9);
assert.equal(d.querySelectorAll('.bubble').length,3,'Original date dialogue must stay');
click('#pg5-next');assert.equal(steps(),10);
assert(d.getElementById('pg5-next').disabled,'Listening step must wait for answers');
for(const word of ['四月','十一月','十二月']){
 assert(d.querySelector('[data-listen="'+word+'"]').disabled,'Answer must be blocked before audio finishes');
 click('[data-play="'+word+'"]');
 click('[data-listen="'+word+'"]');
}
assert(!d.getElementById('pg5-next').disabled);
assert(d.querySelector('[data-repeat-listen]'),'Completed listening must show Replay');
click('[data-repeat-listen]');assert(d.querySelector('[data-listen="四月"]').disabled);
for(const word of ['四月','十一月','十二月']){click('[data-play="'+word+'"]');click('[data-listen="'+word+'"]')}
assert(!d.getElementById('pg5-next').disabled);
click('#pg5-next');assert.equal(steps(),11);
assert(d.getElementById('pg5-next').disabled,'Builder should gate advance');
for(const pieces of [['十','一','月'],['十','二','月'],['三','月']]){
 for(const piece of pieces){
  const options=[...d.querySelectorAll('[data-tile]')].filter(x=>!x.disabled);
  const target=options.find(x=>x.textContent===piece);assert(target,'No tile '+piece);target.click();
 }
 click('[data-build-check]');
}
assert(!d.getElementById('pg5-next').disabled);
assert(d.querySelector('[data-repeat-builder]'),'Completed builder must show Replay');
click('[data-repeat-builder]');
for(const pieces of [['十','一','月'],['十','二','月'],['三','月']]){for(const piece of pieces){const opts=[...d.querySelectorAll('[data-tile]')].filter(x=>!x.disabled);const target=opts.find(x=>x.textContent===piece);assert(target);target.click();}click('[data-build-check]');}
click('#pg5-next');assert.equal(steps(),12); // writing
assert(d.getElementById('writer'));
click('#pg5-next');assert.equal(steps(),13); // speaking
assert(d.querySelector('[data-record-start]'),'Self recording controls missing');
click('#pg5-next');assert.equal(steps(),14);
assert(d.getElementById('pg5-next').disabled,'All five final questions must be completed before proceeding');
const finalAnswers=[1,0,1,0,1]; // Topic quiz, November, December, 号 vs 年, reading 2026年
for(let i=0;i<finalAnswers.length;i++){
 const title=d.querySelector('.pg-final-answers')?.parentElement?.textContent||'';
 assert(title.includes((i+1)+' / '+finalAnswers.length),'Expected final question '+(i+1)+' / 5');
 if(i===1){
  click('[data-final="2"]'); // Wrong December instead of November.
  assert(d.querySelector('.pg-final-answers'),'Incorrect answer must not advance the quiz');
  assert(d.getElementById('pg5-next').disabled,'Incorrect answer must not unlock completion');
 }
 click('[data-final="'+finalAnswers[i]+'"]');
 if(i<finalAnswers.length-1)assert(d.getElementById('pg5-next').disabled,
  'Advancing after '+(i+1)+' question(s) must remain locked');
}
assert(d.querySelector('[data-final-retry]'),'Five completed questions should offer retry');
assert(!d.getElementById('pg5-next').disabled,'Five completed questions unlock lesson completion');
assert(JSON.parse(w.localStorage.getItem('pg-hsk1-l5-v227')).done);
assert(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')).includes('dates'));
assert(!w.localStorage.getItem('pg-hsk1-v3-dates'),'Original seven-step state must remain untouched');
console.log('PASS lesson 5 v227: 14 screens, existing curriculum, listening, 3 builds, writing, speaking and completion');
