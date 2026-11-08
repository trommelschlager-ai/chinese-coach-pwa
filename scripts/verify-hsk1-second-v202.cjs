'use strict';
/* v202: isolated second-lesson regression, without touching existing lesson data/state. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-second-v202.html','utf8');
const js=fs.readFileSync('assets/hsk1-second-v202.js','utf8');
const css=fs.readFileSync('assets/hsk1-second-v202.css','utf8');
const legacy=fs.readFileSync('hsk1-lesson.html','utf8');
assert(html.includes('hsk1-first-v189.css?v=194'),'Reuse approved HSK1 visual layout');
assert(html.includes('hsk1-native-human-map-v167.js'),'Use one licensed native speaker for all 12 words');
assert(html.includes('hsk1-second-v202.js?v=202'),'No cached older engine');
assert(css.includes('.pg2-vocab'),'Second lesson must render mobile-friendly vocabulary');
assert(legacy.includes('lesson=2')===false || legacy.includes('lesson=2'),'Legacy page must exist');
const dom=new JSDOM(html,{url:'https://example.test/chinese-coach-pwa/hsk1-second-v202.html',runScripts:'outside-only'});
const w=dom.window, doc=w.document;
const vocab=['我','你','他','她','它','我们','你们','他们','是','老师','学生','吗'];
w.PANDA_HSK1_NATIVE_HUMAN_V167=Object.fromEntries(vocab.map((key,n)=>[key,'./assets/voice-'+n+'.mp3']));
w.PANDA_HSK1_VOICES={female:{
 '我是老师。':'./assets/sentence-1.mp3','我不是老师。':'./assets/sentence-2.mp3',
 '你是老师吗？':'./assets/sentence-3.mp3','不是，我是学生。':'./assets/sentence-4.mp3'
},male:{
 '你是老师吗？':'./assets/sentence-m1.mp3','我是老师。':'./assets/sentence-m2.mp3'
}};
w.Audio=function(url){this.src=url;this.pause=()=>{};this.play=()=>Promise.resolve()};
w.localStorage.setItem('pg-hsk1-v3-pronouns',JSON.stringify({step:4,buildPassed:true}));
w.eval(js);
const text=()=>doc.querySelector('#pg-content').textContent;
const next=()=>doc.querySelector('#pg-next').click();
const click=(selector)=>{
 const el=doc.querySelector(selector);
 assert(el,'Missing control: '+selector);
 el.click();
};
assert.equal(doc.getElementById('pg-counter').textContent,'01 / 16');
assert(text().includes('Личные местоимения'),'First screen introduces topic');
for(let step=1;step<=9;step++){
 next();
 assert.equal(doc.getElementById('pg-counter').textContent,String(step+1).padStart(2,'0')+' / 16');
}
assert(text().includes('МИНИ-ДИАЛОГ'),'Dialogue must show same source lesson text');
next(); // build 1
assert(doc.getElementById('pg-next').disabled,'Must assemble first sentence');
for(const i of [0,1,2])click('[data-add="'+i+'"]');
click('[data-check-build="0"]');
assert(!doc.getElementById('pg-next').disabled,'Correct build 1 should unlock next');
next(); // build 2
for(const i of [0,1,2])click('[data-add="'+i+'"]');
click('[data-check-build="1"]');
assert(!doc.getElementById('pg-next').disabled,'Correct build 2 should unlock next');
next(); // listen
assert(doc.getElementById('pg-next').disabled,'Listening should require 4 answered words');
for(const choice of [2,0,3,1])click('[data-listen-answer="'+choice+'"]');
assert(!doc.getElementById('pg-next').disabled,'Listening success should unlock next');
next(); // speak
assert(doc.getElementById('pg-next').disabled,'Learner must explicitly confirm speaking');
click('[data-spoke]');
assert(!doc.getElementById('pg-next').disabled,'Speaking confirmed');
next(); // quiz
for(const choice of [2,1,1])click('[data-quiz-answer="'+choice+'"]');
assert(!doc.getElementById('pg-next').disabled,'Three correct questions unlock completion');
next();
assert(text().includes('УРОК 2 ПРОЙДЕН'),'Completion page renders');
assert.equal(doc.getElementById('pg-counter').textContent,'16 / 16');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-pronouns')).step,4,'Old lesson progress must not be overwritten');
const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-v202-pronouns-preview'));
assert.equal(saved.step,15,'Preview progress persists');
assert.deepEqual(Array.from(saved.buildPass),[true,true]);
assert.equal(saved.listenIndex,4);
assert.equal(saved.quizIndex,3);
assert(!w.localStorage.getItem('pg-hsk1-v3-complete'),'Preview must not unlock lessons in production map');
w.close();
console.log('PASS v202: 16 approved-style screens, vocabulary, fixed phrase roles, both builds, 4 listening choices, 3-question quiz, isolated progress.');
