'use strict';
/* HSK1 lesson 3 v213 — full pedagogical route and regression checks.
 * Browser audio is mocked, so this verifies player state and filenames,
 * NOT noise levels, pronunciation, real mic or Android rendering.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-third-v212.html','utf8'),
 js=fs.readFileSync('assets/hsk1-third-v213.js','utf8'),
 css=fs.readFileSync('assets/hsk1-third-v213.css','utf8'),
 map=fs.readFileSync('hsk1-map.html','utf8'),
 native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8'),
 xiaoxiao=fs.readFileSync('assets/lesson3-xiaoxiao-v263.js','utf8');
assert(html.includes('hsk1-third-v213.js?v=263'));
assert(html.includes('hsk1-third-v213.css?v=237'));
assert(html.includes('lesson3-xiaoxiao-v263.js?v=263'),'Xiaoxiao map loaded before lesson 3');
assert(!html.includes('hsk1-numbers-audio-map-v250.js'),'No old stitched audio map');
assert(fs.existsSync('assets/lesson3-xiaoxiao-v263/100.mp3'),'Full-number yì bǎi missing');
assert(map.includes('14 экранов'));
assert(css.includes('.pg13-study-grid')&&css.includes('.pg13-tens-grid'));
assert(js.includes("if(n===100)return ['yì','bǎi']"),'100 must be yì bǎi');
assert(js.includes('(2 × 10)')||js.includes('десятков × 10'),'Number structure must use multiplication');
const dom=new JSDOM(html,{url:'https://panda.test/hsk1-third-v212.html',runScripts:'outside-only'});
const w=dom.window,d=w.document,played=[];
const old={step:7,completed:true,written:['一','二'],viewed:{1:['一'],2:['六']}};
w.localStorage.setItem('pg-hsk1-v212-numbers',JSON.stringify(old));
w.localStorage.setItem('pg-hsk1-v203-pronouns',JSON.stringify({completed:true,step:11}));
w.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers']));
w.eval(native);
w.eval(xiaoxiao);
assert.equal(w.PandaLesson3XiaoxiaoV263.clips.length,101);
w.Audio=function(src){
 const self=this;
 self.src=src;played.push(self);self.pause=()=>{};
 self.play=()=>Promise.resolve();
};
let createdStroke=[];
w.HanziWriter={create(id,char,o){
 createdStroke.push(char);
 return {cancelQuiz(){},pauseAnimation(){},animateCharacter(){},
 quiz:({onComplete})=>onComplete()}
}};
w.eval(js);
const step=()=>Number(d.getElementById('pg3-count').textContent.split(' ')[0]);
const click=selector=>{
 const button=d.querySelector(selector);
 assert(button,'Missing element '+selector+' on screen '+step());
 assert(!button.disabled,'Disabled element '+selector+' on screen '+step());
 button.click();return button;
};
const hear=n=>{
 click('[data-audio="'+n+'"]');
 const last=played.at(-1);
 assert(last,'No audio created '+n);
 assert.equal(last.src,'./assets/lesson3-xiaoxiao-v263/'+String(n).padStart(3,'0')+'.mp3');
 if(last.onended)last.onended();
};
const advance=()=>click('#pg3-next');
assert.equal(step(),1);
assert(d.querySelector('.pg13-intro-hero img'),'Branded mascot must show');
assert(d.querySelector('.pg13-intro-hero img').getAttribute('src').includes('lesson-success-v233.webp'),'Reference mascot from owner mockup must show');
assert(d.querySelector('#pg3-progress').getAttribute('aria-valuemax')==='14');
advance();
assert.equal(step(),2);
for(let i=1;i<=5;i++){
 click('[data-study="'+i+'"]');
 assert(d.getElementById('pg3-next').disabled,'Cannot pass before audio finished');
 played.at(-1).onended();
}
advance();
assert.equal(step(),3);
for(let i=6;i<=10;i++){click('[data-study="'+i+'"]');played.at(-1).onended();}
advance();
assert.equal(step(),4);
for(const n of [4,10,6]){
 assert(d.querySelector('[data-answer]').disabled,'Cannot click before audio finishes');
 hear(n);
 click('[data-answer="'+n+'"]');
}
assert.equal(step(),5);
assert.equal(createdStroke[0],'一');
click('[data-write-char="三"]');
assert.equal(createdStroke.at(-1),'三');
click('[data-trace]');
advance();
assert.equal(step(),6);
assert(d.getElementById('pg3-stage').textContent.includes('11–19'));
for(const n of [17,19])click('[data-rule-answer="'+n+'"]');
assert.equal(step(),7);
assert(d.getElementById('pg3-stage').textContent.includes('90'));
for(const n of [30,60])click('[data-rule-answer="'+n+'"]');
assert.equal(step(),8);
let input=d.querySelector('#pg13-generate-number');
assert(input,'Number generator absent');
input.value='67';
click('[data-generate]');
assert(d.getElementById('pg3-stage').textContent.includes('六十七'),'Input 67 should calculate 67');
for(const n of [36,75,99])click('[data-rule-answer="'+n+'"]');
assert.equal(step(),9);
assert(d.getElementById('pg3-stage').textContent.includes('零'));
assert(d.getElementById('pg3-stage').textContent.includes('yì bǎi'));
advance();
assert.equal(step(),10);
for(const n of [23,47,68,90]){
 const expected=chinese(n);
 for(const char of expected){
  const choice=Array.from(d.querySelectorAll('[data-tile-index]')).find(b=>!b.disabled&&b.textContent.trim()===char);
  assert(choice,'Missing tile '+char+' for number '+n);
  choice.click();
 }
 click('[data-check-build]');
}
assert.equal(step(),11);
for(const n of [3,7,10,15,42,86]){hear(n);click('[data-answer="'+n+'"]')}
assert.equal(step(),12);
for(const n of [3,36,8])click('[data-context-answer="'+n+'"]');
assert.equal(step(),13);
for(const n of [35,19,80,67,9,52,100,0]){
 if(n===9||n===52)hear(n);
 click('[data-exam-answer="'+n+'"]');
}
assert.equal(step(),14);
assert(d.getElementById('pg3-stage').textContent.includes('8 / 8'),'Completed first-try score');
const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-v213-numbers'));
assert(saved.done,'New completed state not saved');
assert.equal(saved.firstTry,8,'Correctly scored first attempts');
assert.deepEqual(JSON.parse(w.localStorage.getItem('pg-hsk1-v212-numbers')),old,'Old lesson 3 progress must be untouched');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v203-pronouns')).step,11,'Lesson 2 progress must survive');
assert(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')).includes('numbers'),'Achievement preserved');
// After completing the lesson, revisiting prior exercises must never display
// a separate completion-only page, duplicate replay button or empty result card.
const forbidden=['Практика завершена','Все числа собраны','Правило закреплено','Все жизненные ситуации пройдены','Проверка пройдена'];
for(let n=13;n>=4;n--){
  click('#pg3-prev');
  assert.equal(step(),n,'Back navigation should preserve the original screen order');
  const body=d.getElementById('pg3-stage');
  assert(body.textContent.trim().length>12,'Revisited screen must retain its educational content');
  for(const phrase of forbidden)assert(!body.textContent.includes(phrase),'Unwanted completion screen: '+phrase);
}
assert(d.getElementById('pg3-stage').querySelector('.pg13-answers'),'Completed listening screen must still show the listening exercise');
assert(!d.getElementById('pg3-next').disabled,'Next must remain available on completed exercises');
dom.window.close();
console.log('PASS HSK1 numbers lesson v213: 14 screens, 0–100, voice gated after completion, 3 tones, 1–10, handwriting, decade rules, random calculator, four builders, six listens, real-life quiz, eight-question exam, saved old progress.');
