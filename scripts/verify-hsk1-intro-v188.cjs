'use strict';
/* HSK1 v188 learner-order, 3-screen intro and progress regression. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const page=fs.readFileSync('hsk1-lesson.html','utf8');
const scripts=['./assets/hsk1-intro-v188.js?v=188','./assets/hsk1-foundations-data-v152.js?v=188'];
for(const path of scripts)assert(page.includes(path),'Lesson missing new intro/curriculum asset '+path);
const data=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const check=new JSDOM('',{url:'https://example.test/chinese-coach-pwa/hsk1-lesson.html',runScripts:'outside-only'}).window;
check.eval(data);
const topic=check.PANDA_HSK1_FOUNDATIONS[0];
assert.equal(topic.words[0][0],'我','The first spoken word after introduction must be 我');
const taught=topic.words.map(w=>w[0]);
for(const item of ['我','是','学生','你','你好','人','口','木','日'])assert(taught.includes(item),'Intro vocabulary missing '+item);
assert.equal(taught.slice(0,3).join(','),'我,是,学生','Student introduced before first sentence');
assert(topic.words.find(w=>w[0]==='你好')[2].includes('好 — хороший'),'Explain 好 on the 你好 card');
for(const [speaker,text] of topic.dialogue){
 assert(['A','Б','А','B'].includes(speaker),'Unexpected dialogue speaker');
 for(const token of ['我','是','学生','你','你好']){
  // Spoken dialogue tokens are all introduced in the vocabulary stage.
  if(text.includes(token))assert(taught.includes(token),'Dialogue introduces unknown '+token);
 }
}
assert(topic.rules.some(r=>r[1].includes('叫 (jiào)')&&r[1].includes('小明')),'Explain 叫 and 小明 before dialogue');
const dom=new JSDOM(page,{url:'https://example.test/chinese-coach-pwa/hsk1-lesson.html?lesson=1',runScripts:'outside-only'});
const w=dom.window;
w.scrollTo=()=>{};
w.Audio=function(src){this.src=src;this.play=()=>Promise.resolve();this.pause=()=>{}};
for(const s of [...w.document.querySelectorAll('script[src]')]){
 const path=new URL(s.src).pathname.replace('/chinese-coach-pwa/','');
 w.eval(fs.readFileSync(path,'utf8'));
}
const d=w.document;
assert(d.querySelector('.pg-intro-overlay'),'New learner should see 3-step hanzi introduction');
assert(d.querySelector('[data-intro-screen]').textContent.includes('Черта'),'Introduce written strokes first');
assert(d.querySelectorAll('.lesson-step').length===7,'Preserve seven lesson stages');
assert(d.querySelectorAll('.lesson-word').length===1,'Keep existing word-card DOM and progress');
d.querySelector('[data-intro-next]').click();
assert(d.querySelectorAll('[data-intro-radical]').length===3,'Teach exactly 3 initial radicals');
assert(d.querySelector('[data-intro-screen]').textContent.includes('木 + 木 = 林'),'Explain component structure');
d.querySelector('[data-intro-radical="1"]').click();
assert(d.querySelector('.pg-intro-detail-character').textContent==='口');
d.querySelector('[data-intro-next]').click();
assert(d.querySelector('[data-intro-screen]').textContent.includes('две черты'),'Practice two-stroke 人');
d.querySelector('[data-intro-stroke="1"]').click();
assert(d.querySelector('[data-intro-stroke="1"]').getAttribute('aria-pressed')==='true');
d.querySelector('[data-intro-next]').click();
assert(!d.querySelector('.pg-intro-overlay'),'Introduction closes before new word');
assert.equal(w.localStorage.getItem('pg-hsk1-hanzi-intro-v188-done'),'1');
assert(d.querySelector('[data-recall-start]'),'Existing recall still works');
assert.equal(d.querySelector('.lesson-word .lesson-hanzi').textContent,'我');
assert(d.querySelector('[title="Повторить основы иероглифов"]'),'Reopen button retained');
d.querySelector('[title="Повторить основы иероглифов"]').click();
assert(d.querySelector('.pg-intro-overlay'),'User can repeat introduction');
assert.equal(w.localStorage.getItem('pg-hsk1-v3-foundations')!==null,true,'Do not destroy original progress');
assert(page.includes('hsk1-intro-v188.css'),'New intro has matching stylesheet');
console.log('PASS v188: 3 beginner introduction screens, 3 radicals, stroke sequence, first word 我, preserved progress');