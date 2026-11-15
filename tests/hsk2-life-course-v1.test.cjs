'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const data=fs.readFileSync(path.join(root,'assets/hsk2-life-course-data-v1.js'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/hsk2-life-course-app-v1.js'),'utf8');
const dayData=fs.readFileSync(path.join(root,'assets/hsk2-day-first-data-v1.js'),'utf8');
const dayUI=fs.readFileSync(path.join(root,'assets/hsk2-day-first-ui-v1.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/hsk2-life-course-v1.css'),'utf8');
const errors=[],warnings=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(e.message));
vc.on('error',s=>errors.push(String(s)));
vc.on('warn',s=>warnings.push(String(s)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{}}});
const w=dom.window,doc=w.document;
w.PandaHsk2AudioV330={lookup:()=>null,play:()=>false};
w.eval(data);w.eval(dayData);w.eval(dayUI);w.eval(app);
const topics=w.PandaLifeCourseV1.topics;
function $(selector){return doc.querySelector(selector)}
function click(selector){const b=$(selector);assert.ok(b,'Missing '+selector);assert.ok(!b.disabled,'Disabled '+selector);b.click()}
function norm(s){return String(s).replace(/[，。？！,.!?、\s]/g,'')}
assert.equal(topics.length,10);
assert.equal(topics.flatMap(t=>t.words).length,200);
assert.equal(new Set(topics.flatMap(t=>t.words.map(row=>row[0]))).size,200);
assert.ok(topics.every(t=>t.words.length===20&&t.scenes.length===3&&t.scenes.every(s=>s.length===11)));
assert.match(doc.querySelector('#screen').textContent,/30/);
assert.match(css,/topic-grid/);
click('[data-view="map"]');
assert.equal(doc.querySelectorAll('[data-topic]').length,10);
click('[data-topic="0"]');
assert.equal(doc.querySelectorAll('[data-mini]').length,4);
click('[data-mini="0"]');
assert.equal(doc.querySelectorAll('.day-vword').length,7,'Day one must contain seven studied words');
assert.ok(doc.querySelector('.day-headword').textContent.includes('起床'),'The first focused word is 起床');
assert.ok(doc.querySelector('.day-chars').textContent.includes('chuáng'),'Correct second-tone pinyin');
click('[data-day-word="3"]');
assert.ok(doc.querySelector('.day-tip').textContent.includes('第三')===false,'Tones shown in Russian without false characters');
click('[data-day-next]'); // 2: examples
assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
click('[data-day-next]'); // 3: grammar
assert.ok(doc.querySelector('.day-formula').textContent.includes('七点'));
assert.ok(doc.querySelector('.day-tip').textContent.includes('měitiān'));
click('[data-day-next]'); // 4: test
assert.equal(doc.querySelectorAll('.day-question').length,2);
click('[data-day-quiz="0:1"]');
click('[data-day-quiz="1:0"]');
for(const k of [0,1,2,3])click('[data-day-token="'+k+'"]');
assert.ok(!doc.querySelector('[data-day-next]').disabled,'Quiz and builder must pass');
click('[data-day-next]'); // 5: five-time speech practice
assert.equal(doc.querySelectorAll('.day-attempts>div').length,5);
assert.match(doc.querySelector('.day-card').textContent,/не оценивает/);
click('[data-day-next]'); // finish, microphone must be optional
assert.match(doc.querySelector('#screen').textContent,/Мини-урок пройден!/);
assert.match(doc.querySelector('.day-ai-panel a').getAttribute('href'),/practice=day&mini=0/);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,1);
click('[data-next-mini]'); // old lessons unchanged
for(let lesson=1;lesson<30;lesson++){
 const t=Math.floor(lesson/3),m=lesson%3,scene=topics[t].scenes[m];
 const expectedWords=m===2?6:7;
 assert.equal(doc.querySelectorAll('.word-card').length,expectedWords,'Mini '+lesson+' word count');
 assert.equal(doc.querySelectorAll('.word-card .audio.unavailable').length,expectedWords,'Missing audio is labeled, not faked');
 click('[data-step-next]');
 assert.ok(doc.querySelector('.gram').textContent.includes(scene[2]),'Grammar missing example in mini '+lesson);
 click('[data-step-next]');
 assert.equal(doc.querySelectorAll('.exercise').length,2);
 const word=topics[t].words[m===0?2:m===1?9:16];
 let opts=Array.from(doc.querySelectorAll('[data-quiz-word]'));
 let b=opts.find(e=>e.textContent===word[2]);
 assert.ok(b,'Missing word option: '+word[2]+' in mini '+lesson);
 b.click();
 opts=Array.from(doc.querySelectorAll('[data-quiz-sentence]'));
 b=opts.find(e=>e.textContent===scene[4]);
 assert.ok(b,'Missing sentence option: '+scene[4]);
 b.click();
 assert.ok(!doc.querySelector('[data-step-next]').disabled,'Correct quiz should enable next');
 click('[data-step-next]');
 const tiles=Array.from(doc.querySelectorAll('[data-token]')).map(e=>({key:Number(e.dataset.token),text:e.textContent}));
 const target=norm(scene[2]);
 function solve(prefix,unused,result){
  if(prefix===target&&unused.length===0)return result;
  for(let i=0;i<unused.length;i++){
   const candidate=unused[i],newPrefix=prefix+candidate.text;
   if(target.startsWith(newPrefix)){
    const answer=solve(newPrefix,unused.filter((_,j)=>j!==i),result.concat(candidate.key));
    if(answer)return answer;
   }
  }
  return null;
 }
 const order=solve('',tiles,[]);
 assert.ok(order,'No builder solution for mini '+lesson+' '+scene[2]);
 for(const k of order)click('[data-token="'+k+'"]');
 assert.ok(!doc.querySelector('[data-step-next]').disabled,'Correct builder should enable next in lesson '+lesson);
 click('[data-step-next]');
 assert.match(doc.querySelector('#screen').textContent,/Мини-урок пройден!/);
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,lesson+1);
 click('[data-next-mini]');
}
assert.equal(doc.querySelectorAll('.exam-question').length,10);
for(let t=0;t<10;t++){
 const question=doc.querySelectorAll('.exam-question')[t];
 const choice=Array.from(question.querySelectorAll('[data-exam-choice]')).find(e=>e.textContent===topics[t].scenes[0][4]);
 assert.ok(choice,'Missing final choice '+t);
 choice.click();
}
assert.match(doc.querySelector('#screen').textContent,/10 из 10/);
click('[data-exam-finish]');
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,30);
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).examPassed,true);

click('[data-nav="tones"]');
assert.equal(doc.querySelectorAll('.tone-card').length,4,'All four tones must be explained');
assert.match(doc.querySelector('.tone-rules').textContent,/ní hǎo/,'Third-tone sandhi explanation required');
assert.match(doc.querySelector('.tone-rules').textContent,/bú shì/,'不 sandhi explanation required');
click('[data-tone-answer="4"]');
assert.match(doc.querySelector('.tones').textContent,/Верно, четвёртый тон/);
assert.ok(doc.querySelector('[data-nav="tones"]'),'Tone navigation missing');
assert.deepEqual(warnings,[],'Builders must match all lesson sentences');
assert.deepEqual(errors,[],'No browser JS errors');
console.log('PASS: Panda Go course · 10 themes · 200 words · 30 mini-lessons completed · 60 quizzes · 30 builders · final 10/10 · local storage');
