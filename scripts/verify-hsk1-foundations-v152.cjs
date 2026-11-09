/* HSK 1 v152: all seven approved lessons must be navigable, usable, and independently saved. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const page=fs.readFileSync('hsk1-lesson.html','utf8');
const map=fs.readFileSync('hsk1-map.html','utf8');
const curriculum=fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8');
const renderer=fs.readFileSync('assets/hsk1-foundations-v152.js','utf8');
const css=fs.readFileSync('assets/hsk1-foundations-v152.css','utf8');
assert.match(map,/Базовое знакомство/);
for(const topic of ['Личные местоимения','Числа и их строение','Дни недели','Месяцы и даты','Моя семья','Погода'])assert(map.includes(topic),'Map missing '+topic);
assert(map.includes('hsk1-first-v189.html'),'Map missing rebuilt lesson 1'); assert(map.includes('hsk1-second-v203.html'),'Map must route to redesigned practice-first second lesson'); assert(map.includes('hsk1-third-v212.html'),'Map must route to the approved HSK1 numbers lesson'); assert(map.includes('hsk1-fourth-v214.html'),'Map must route lesson 4 to dedicated weekdays page'); assert(map.includes('hsk1-fifth-v227.html'),'Map missing rebuilt 14-screen lesson 5'); for(let i=6;i<=7;i++)assert(map.includes('hsk1-lesson.html?lesson='+i),'Map missing lesson '+i);
assert(!renderer.includes('pg-hsk1-completed-v1'),'Never recycle old progress');
assert(renderer.includes('pg-hsk1-v3-'),'Versioned progress key required');
assert(!page.includes('study-audio-map.js'),'Do not use noncommercial study voice previews in new lessons');
assert(css.includes('lesson-dialogue-hero')&&css.includes('approved-panda-lake-v112.webp'),'Approved scenic style retained');
assert(fs.existsSync('assets/panda-v130/dialogue-scene.webp'),'Dialogue artwork is shipped');
const audioKeys=['妈','麻','马','骂'];
for(const topicNo of [1,2,3,4,5,6,7]){
 const dom=new JSDOM(page,{url:'https://example.test/chinese-coach-pwa/hsk1-lesson.html?lesson='+topicNo,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,errors=[];
 w.scrollTo=()=>{};
 w.addEventListener('error',e=>errors.push(e.message));
 w.Audio=function(url){this.src=url;this.play=()=>Promise.resolve();this.pause=()=>{}};
 for(const s of [...d.querySelectorAll('script[src]')]){
  const path=new URL(s.src).pathname.replace('/chinese-coach-pwa/','');
  w.eval(fs.readFileSync(path,'utf8'));
 }
 assert.equal(errors.length,0,'Runtime error on lesson '+topicNo+': '+errors.join('; '));
 assert.equal(d.querySelectorAll('.lesson-step').length,7,'Seven stages in '+topicNo);
 const words=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].words.length;
 assert.equal(d.querySelectorAll('.lesson-word').length,1,'Only one vocabulary card visible at a time');
 assert.equal(d.querySelectorAll('.lesson-word .lesson-audio').length,1,'One primary audio on a vocabulary card');
 assert.equal(d.querySelectorAll('.lesson-word .lesson-audio-native').length,0,'Original human sample must not look like microphone');
 assert(d.querySelector('[data-word-pin]'),'Small bookmark available without extra full-width buttons');
 const recall=d.querySelector('[data-recall-start]');assert(recall,'Word should offer self-recall');
 recall.click();assert(d.querySelector('.pg-recall-active'),'Translation must hide during recall');
 d.querySelector('[data-recall-reveal]').click();
 d.querySelector('[data-recall-mark="review"]').click();
 const ratings=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id)).wordRatings;
 assert.equal(ratings[0],'review','Difficult words should be saved without blocking progress');
 assert(!d.getElementById('lesson-next').disabled,'One main Next action should be enabled on each word');
 assert(d.getElementById('lesson-next').textContent.includes('Следующее слово'),'First word must show clear Next label');
 for(let k=0;k<words;k++){
  assert.equal(d.querySelectorAll('.lesson-word').length,1,'Only one vocabulary card visible');
  if(k<words-1)d.getElementById('lesson-next').click();
 }
 assert(d.getElementById('lesson-next').textContent.includes('К тонам'),'Final word should open tone exercise');
 const checkpoint=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id));
 assert.equal(checkpoint.wordIndex,words-1,'Individual word index should survive reopening');
 assert.equal(checkpoint.wordPage,Math.floor((words-1)/4),'Back-compat word page must remain saved');
 if(topicNo===1){
  for(const k of audioKeys)assert(w.courseHumanAudio[k],'Tone MP3 missing for '+k);
  d.getElementById('lesson-next').click();
  assert(d.querySelector('[data-tones-demo]'),'Four-tone listening exercise missing');
  d.querySelector('[data-tones-demo]').click();
  assert(d.getElementById('lesson-next').disabled,'Listening check must precede examples');
  const sequence=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-foundations')).toneSequence;
  assert.equal(new Set(sequence).size,4,'Tone order must use each of the four tones once');
  for(const hanzi of sequence){
    const tone=['妈','麻','马','骂'].indexOf(hanzi)+1;
    const btn=d.querySelector('[data-tone-choice="'+tone+'"]');
    assert(btn,'Missing listening answer for tone '+tone);
    btn.click();
  }
  assert(d.querySelector('[data-tone-reset]'),'Retake should be available with shuffled order');
  assert(!d.getElementById('lesson-next').disabled,'Correct tone listening unlocks next stage');
 } else {
  d.getElementById('lesson-next').click();
  assert(d.querySelector('[data-listen-prompt]'),'Same-speaker ear training is visible');
  assert(d.getElementById('lesson-next').disabled,'Ear exercise cannot be skipped');
  const data=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].listen;
  for(const [hz] of data.items)assert(w.courseHumanAudio[hz],'Missing recorded single-speaker lexeme '+hz);
  for(const answer of [2,0,3,1]){
    d.querySelector('[data-listen-prompt]').click();
    d.querySelector('[data-listen-answer="'+answer+'"]').click();
  }
  assert(!d.getElementById('lesson-next').disabled,'All four listening questions unlock next');
 }
 d.getElementById('lesson-next').click();
 assert.equal(d.getElementById('lesson-count').textContent,'Шаг 3 из 7','Listening should lead to examples');
 const rules=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].rules;
 for(let k=0;k<rules.length;k++){
  assert.equal(d.querySelectorAll('.pg-rule-card').length,1,'Only one example shown');
  if(k<rules.length-1)d.getElementById('lesson-next').click();
 }
 assert(d.getElementById('lesson-next').textContent.includes('К диалогу'),'Final example should lead to dialogue');
 d.getElementById('lesson-next').click();
 assert.equal(d.getElementById('lesson-count').textContent,'Шаг 4 из 7','Examples should lead to dialogue');
 const lines=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].dialogue.length;
 for(let k=0;k<lines;k++){
  assert.equal(d.querySelectorAll('.lesson-line').length,1,'Only one dialogue line shown');
  if(k<lines-1)d.getElementById('lesson-next').click();
 }
 assert(d.getElementById('lesson-next').textContent.includes('К заданию'),'Final dialogue reply should lead to builder');
 d.getElementById('lesson-next').click();
 assert.equal(d.getElementById('lesson-count').textContent,'Шаг 5 из 7');
 assert(d.getElementById('lesson-next').disabled,'Builder must block unverified answer in '+topicNo);
 const builds=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].builds.concat(topicNo===1?
  [{target:['我','叫','小明。'],prompt:'Меня зовут Сяомин'}]:[]);
 assert.equal(builds.length,topicNo===1?4:3,'Real introduction sentence should augment existing exercises');
 for(let k=0;k<builds.length;k++){
  const target=builds[k].target;
  target.forEach((_,i)=>{
   const btn=d.querySelector('[data-add="'+i+'"]');
   assert(btn,'Missing composition token '+i+' in task '+k);btn.click();
  });
  d.querySelector('[data-verify-build]').click();
  assert(d.querySelector('.pg-build-confirmed'),'Show correct assembled phrase before advancing');
  assert(d.querySelector('.pg-build-confirmed .lesson-hanzi')?.textContent===target.join(''),
   'Correct sentence must remain visible on the confirmation screen');
  assert(!d.getElementById('lesson-next').disabled,'Next must unlock on solved sentence');
  const pending=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id));
  assert(pending.buildPending,'Successful build result should persist until Next');
  d.getElementById('lesson-next').click();
  if(k<builds.length-1)assert(d.getElementById('lesson-next').disabled,'Unsolved next build must be blocked');
 }
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id)).buildProgress,builds.length,'All assembly tasks saved');
 assert(d.getElementById('lesson-count').textContent.includes('Шаг 6'),'Last confirmed build leads to speaking');
 assert(d.getElementById('lesson-next').disabled,'Speaking confirmation needed');
 d.querySelector('[data-spoken]').click();
 if(topicNo===1){
  assert(d.getElementById('lesson-next').disabled,'Introduction speech requires a second recorded phrase');
  const phrase=d.querySelector('.pg-speak-card .lesson-hanzi');
  assert.equal(phrase.textContent,'我叫小明。','Second speech card must teach a meaningful spoken sentence');
  assert(d.querySelector('[data-play="我叫小明。"][data-speaker="male"]'),
   'Introduction speech must use approved male recording');
  d.querySelector('[data-spoken]').click();
 }
 assert(!d.getElementById('lesson-next').disabled);
 d.getElementById('lesson-next').click();
 assert(d.getElementById('lesson-next').disabled,'Quiz requires correct answer');
 const answers=topicNo===1?[w.PANDA_HSK1_FOUNDATIONS[0].quiz.correct,0,0]:
  [w.PANDA_HSK1_FOUNDATIONS[topicNo-1].quiz.correct,1,1];
 if(topicNo===2){
  const wrong=(answers[0]+1)%4;
  d.querySelector('[data-answer="'+wrong+'"]').click();
  const afterWrong=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-pronouns'));
  assert.equal(afterWrong.reviewErrors[0],1,'Wrong answers must be counted, not given credit');
 }
 for(let k=0;k<answers.length;k++){
   d.querySelector('[data-answer="'+answers[k]+'"]').click();
   assert.equal(d.getElementById('lesson-next').disabled,k<answers.length-1,
    'Review question '+k+' should not prematurely unlock completion');
 }
 const savedReview=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id));
 assert.equal(savedReview.reviewProgress,answers.length,'Review answers must persist');
 assert.equal(savedReview.firstTryCorrect,topicNo===2?2:3,'First-attempt score must not credit corrected mistakes');
 d.getElementById('lesson-next').click();
 assert(d.querySelector('.pg-result-card'),'Completion should display result before returning to map');
 const id=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id;
 const storage=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+id));
 assert(storage.completed,'Topic '+id+' must be completed');
 assert(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')).includes(id),'Topic '+id+' missing from completion list');
 assert.equal(w.localStorage.getItem('pg-hsk1-completed-v1'),null,'Old completion data must stay untouched');
 dom.window.close();
}
console.log('HSK 1 v182: seven lessons, simplified audio, context, 3-question quizzes, honest first-attempt scores, confirmed builds and preserved progress OK.');
