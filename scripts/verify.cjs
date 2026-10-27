const {JSDOM}=require('jsdom');
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const before=require('child_process').execFileSync('git',['show','HEAD:index.html'],{encoding:'utf8'});
const course=s=>vm.runInNewContext('JSON.stringify('+s.match(/const COURSE = (\[[\s\S]*?\n\]);/)[1]+')');
assert.equal(course(html),course(before),'Every lesson/content item must be preserved');
const welcome=s=>s.match(/<div[^>]*id="welcome-gate"[\s\S]*?(?=<script|<div class="shell")/)?.[0];
// The protected illustration must remain the exact same file bytes.
for(const name of ['approved-welcome.png','approved-final-home.svg'])assert(fs.readFileSync('assets/'+name).equals(require('child_process').execFileSync('git',['show','HEAD:assets/'+name],{maxBuffer:10e6})));
const dom=new JSDOM(html,{url:'https://test.local/chinese-coach-pwa/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.URL.createObjectURL=()=>'';
let spoken=[];w.speechSynthesis={getVoices:()=>[{lang:'zh-CN',localService:true}],cancel(){},speak(u){spoken.push(u.text)}};w.SpeechSynthesisUtterance=function(t){this.text=t};
w.eval(fs.readFileSync('assets/semantic-art.js','utf8'));
w.eval([...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(s=>s[1]).join('\n').replace("'use strict';",'')); 
const doc=w.document;
let panels=0,questions=0,options=0,missing=new Set();
const asset=el=>{if(el?.dataset.art){const p=w.semanticArt.path(el.dataset.art);if(!fs.existsSync(p))missing.add(p)}};
for(let id=1;id<=5;id++){
 for(let step=0;step<4;step++){
  w.openCourseLesson(id,step);assert.equal(doc.querySelector('.step-counter').textContent,`Шаг ${step+1} из 4`);panels++;
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
