const {JSDOM}=require('jsdom');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const before=require('child_process').execFileSync('git',['show','HEAD:index.html'],{encoding:'utf8'});
const course=s=>vm.runInNewContext('JSON.stringify('+s.match(/const COURSE = (\[[\s\S]*?\n\]);/)[1]+')');
const normalizeCourse=s=>{const parsed=JSON.parse(course(s));parsed[1].dialogue='AUDITED_INTRO_DIALOGUE';return JSON.stringify(parsed)};
assert.equal(normalizeCourse(html),normalizeCourse(before),'All course content except the audited Lesson 2 dialogue must be preserved');
assert.deepEqual(JSON.parse(course(html))[1].dialogue,[
 ['A','你好！','nǐ hǎo!','Привет!'],
 ['B','你好！','nǐ hǎo!','Привет!'],
 ['A','你叫什么名字？','nǐ jiào shénme míngzi?','Как тебя зовут?'],
 ['B','我叫安娜。你呢？','wǒ jiào Ānnà. nǐ ne?','Меня зовут Анна. А тебя?'],
 ['A','我叫小明。','wǒ jiào Xiǎomíng.','Меня зовут Сяомин.'],
 ['B','再见！','zàijiàn!','До свидания!']
],'Lesson 2 dialogue must remain a coherent introduction');
const welcome=s=>s.match(/<div[^>]*id="welcome-gate"[\s\S]*?(?=<script|<div class="shell")/)?.[0];
// The protected illustration must remain the exact same file bytes.
for(const name of ['approved-home-v36.png','approved-welcome.png','approved-final-home.svg'])assert(fs.readFileSync('assets/'+name).equals(require('child_process').execFileSync('git',['show','HEAD:assets/'+name],{maxBuffer:10e6})));
const dom=new JSDOM(html,{url:'https://test.local/chinese-coach-pwa/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.URL.createObjectURL=()=>'';
let spoken=[];w.speechSynthesis={getVoices:()=>[{lang:'zh-CN',localService:true}],cancel(){},speak(u){spoken.push(u.text)}};w.SpeechSynthesisUtterance=function(t){this.text=t};
w.eval(fs.readFileSync('assets/semantic-art.js','utf8'));
w.eval([...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(s=>s[1]).join('\n').replace("'use strict';",'')); 
w.eval(fs.readFileSync('assets/voice-settings.js','utf8'));
w.eval(fs.readFileSync('assets/listening-lab.js','utf8'));
w.eval(fs.readFileSync('assets/pronunciation-hub.js','utf8'));
const doc=w.document;
assert.equal(doc.querySelectorAll('#pronunciation-hub [data-pronunciation-mode]').length,4,'Four pronunciation actions, including pinyin combinations');
assert(doc.querySelector('#pronunciation-hub #pronunciation-settings'),'Voice options remain in the hub');
assert.equal(doc.querySelectorAll('#pronunciation-hub [data-demo-voice]').length,3,'Two human voice demos and one system voice');
assert.equal(doc.querySelectorAll('#pronunciation-hub .pronunciation-audio-credits a').length,2,'Human demos have license attribution');
assert(doc.getElementById('listening-lab').hidden,'Audio quiz is hidden on the hub start screen');
doc.querySelector('[data-pronunciation-mode="quiz"]').click();
assert.equal(doc.getElementById('listening-lab').hidden,false,'Audio quiz opens when chosen');
assert(doc.getElementById('tones').querySelector('.tonegrid').hidden,'Other exercises stay hidden');
doc.getElementById('pronunciation-back').click();
assert.equal(doc.getElementById('pronunciation-hub').hidden,false,'Back returns to four actions');
doc.querySelector('[data-pronunciation-mode="speak"]').click();
assert.equal(doc.getElementById('tones').querySelector('.practice').hidden,false,'Mic exercise still available');
doc.getElementById('pronunciation-back').click();
doc.querySelector('[data-pronunciation-mode="listen"]').click();
assert.equal(doc.getElementById('tones').querySelector('.tonegrid').hidden,false,'Four tone cards still available');
doc.getElementById('pronunciation-back').click();
doc.querySelector('[data-pronunciation-mode="combinations"]').click();
assert(!doc.getElementById('pinyin-combinations').hidden,'Pinyin combinations open from the pronunciation menu');
assert.equal(doc.querySelectorAll('[data-pinyin-audio]').length,13,'Thirteen accurately transcribed example syllables');
assert(doc.querySelector('[data-pinyin-audio="chi"]').textContent.includes('chī'),'ch is taught as an initial');
assert(doc.querySelector('[data-pinyin-audio="pai"]').textContent.includes('pāi'),'pai is a complete syllable');
assert(doc.querySelector('.pinyin-combo-warning').textContent.includes('«sz»'),'Invalid sz spelling is clearly corrected');
doc.getElementById('pronunciation-back').click();
assert.equal(doc.querySelectorAll('#mandarin-voice-settings select').length,1,'Voice selector is available');
assert.equal(doc.querySelectorAll('#mandarin-voice-settings #mandarin-voice-preview').length,1,'Voice preview control is available');
assert.equal(doc.querySelectorAll('#listening-lab [data-ear-tone]').length,5,'Listening lab presents four tones plus the neutral tone');
assert.equal(doc.querySelectorAll('#listening-lab .ear-credits a').length,14,'All 14 human sample recordings are credited');
assert.equal(doc.querySelector('#ear-counter').textContent,'Вопрос 1 из 10');
assert([...doc.querySelectorAll('#listening-lab [data-ear-tone]')].every(b=>b.disabled),'Choices stay locked until audio plays');
let panels=0,questions=0,options=0,missing=new Set();
const asset=el=>{if(el?.dataset.art){const p=w.semanticArt.path(el.dataset.art);if(!fs.existsSync(p))missing.add(p)}};
for(let id=1;id<=5;id++){
 for(let step=0;step<4;step++){
  w.openCourseLesson(id,step);if(id===1&&step===0)assert(doc.getElementById('focus-open-listening'),'Listening link visible in Lesson 1');assert.equal(doc.querySelector('.step-counter').textContent,`Шаг ${step+1} из 4`);panels++;
  if(step===1){const total=JSON.parse(course(html))[id-1].vocab.length;for(let j=0;j<total;j++){asset(doc.querySelector('.focus-phrase'));doc.querySelector('[data-play-focus]').click();assert(spoken.length>0);if(j<total-1)doc.getElementById('course-next').click()}}
  if(step===2){const total=JSON.parse(course(html))[id-1].dialogue.length;for(let j=0;j<total;j++){asset(doc.querySelector('.focus-phrase'));assert(doc.getElementById('focus-check'));if(j<total-1)doc.getElementById('course-next').click()}}
  if(step===3){const qs=JSON.parse(course(html))[id-1].quiz;for(const q of qs){questions++;asset(doc.querySelector('.course-quiz-question'));const bs=[...doc.querySelectorAll('[data-answer]')];assert.equal(bs.length,4);for(const b of bs){asset(b);options++}bs[q[2]].click();assert(bs[q[2]].classList.contains('correct'));assert(bs.every(b=>b.disabled));assert(!doc.getElementById('course-answer-next').classList.contains('hidden'));doc.getElementById('course-answer-next').click()}assert(doc.querySelector('.course-score').textContent.includes('7 / 7'))}
 }
}
assert(JSON.parse(w.localStorage.getItem('chinese-coach-course-v1')).completed.length===5);
// Wrong-answer path remains distinct, locks the question and reveals correct answer.
w.openCourseLesson(2,3);doc.querySelector('[data-answer="0"]').click();assert(doc.querySelector('[data-answer="0"]').classList.contains('incorrect'));assert(doc.querySelector('[data-answer="1"]').classList.contains('correct'));
for(const meaning of ['чай','спасибо','друг','хорошо']){const expected={чай:'tea',спасибо:'thanks',друг:'friends',хорошо:'good'}[meaning];assert.equal(w.semanticArt.key(meaning),expected)}
w.go('quiz');for(let i=0;i<10;i++){const bs=[...doc.querySelectorAll('#quizopts button')];assert.equal(bs.length,4);bs.forEach(asset);bs[0].click();assert(bs.every(b=>b.disabled));doc.getElementById('nextq').click()}assert(!doc.getElementById('quizend').classList.contains('hidden'));
w.go('tones');doc.querySelectorAll('.tonegrid .tone').forEach(b=>{b.click();asset(b)});
w.go('dialog');for(const scene of ['intro','cafe']){doc.querySelector(`[data-scene="${scene}"]`).click();assert(doc.getElementById('dialogprompt').value.includes(scene==='cafe'?'кафе':'Знакомство'))}
assert(!doc.querySelector('.foot'));assert.equal(doc.querySelector('#quiz .columnhead p'),null);
console.log(JSON.stringify({panels,questions,options,spoken:spoken.length,missing:[...missing]},null,2));
if(!process.argv.includes('--allow-pending'))assert.equal(missing.size,0,'Missing image assets');
w.close();
