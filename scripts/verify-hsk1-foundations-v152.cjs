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
for(let i=1;i<=7;i++)assert(map.includes('hsk1-lesson.html?lesson='+i),'Map missing lesson '+i);
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
  for(const tone of [3,1,4,2]){
    const btn=d.querySelector('[data-tone-choice="'+tone+'"]');
    assert(btn,'Missing listening answer for tone '+tone);
    btn.click();
  }
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
 const builds=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].builds;
 assert.equal(builds.length,3,'Three independent assembly tasks');
 for(let k=0;k<builds.length;k++){
  const target=builds[k].target;
  target.forEach((_,i)=>{const btn=d.querySelector('[data-add="'+i+'"]');assert(btn,'Missing composition token '+i+' in task '+k);btn.click()});
  d.querySelector('[data-verify-build]').click();
  assert.equal(d.getElementById('lesson-next').disabled,k<2,'Task '+k+' did not unlock correctly');
 }
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id)).buildProgress,3,'Three assembly tasks saved');
 d.getElementById('lesson-next').click();
 assert(d.getElementById('lesson-next').disabled,'Speaking confirmation needed');
 d.querySelector('[data-spoken]').click();
 assert(!d.getElementById('lesson-next').disabled);
 d.getElementById('lesson-next').click();
 assert(d.getElementById('lesson-next').disabled,'Quiz requires correct answer');
 const answer=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].quiz.correct;
 d.querySelector('[data-answer="'+answer+'"]').click();
 assert(!d.getElementById('lesson-next').disabled,'Correct quiz unlocks completion');
 d.getElementById('lesson-next').click();
 const id=w.PANDA_HSK1_FOUNDATIONS[topicNo-1].id;
 const storage=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-'+id));
 assert(storage.completed,'Topic '+id+' must be completed');
 assert(JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete')).includes(id),'Topic '+id+' missing from completion list');
 assert.equal(w.localStorage.getItem('pg-hsk1-completed-v1'),null,'Old completion data must stay untouched');
 dom.window.close();
}
console.log('HSK 1 v180: seven lessons, one-card vocabulary, compact examples and dialogue, 28 same-voice listening checks, 21 sentence tasks, quiz and isolated progress OK.');
