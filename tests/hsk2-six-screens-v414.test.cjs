'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
assert.match(html,/hsk2-six-screens-v414\.js\?v=418/);
assert.match(html,/hsk2-six-screens-v414\.css\?v=414/);
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html?topic=0',runScripts:'dangerously',virtualConsole:vc});
const w=dom.window,doc=w.document;
let current=null,starts=0;
class SR{
 constructor(){current=this}
 start(){starts++}
 abort(){}
 report(t){this.onresult?.({results:[[{transcript:t}]]});this.onend?.()}
}
w.SpeechRecognition=SR;
w.speechSynthesis={cancel(){},speak(){},getVoices(){return [{lang:'zh-CN'}]}};
w.SpeechSynthesisUtterance=class {constructor(t){this.text=t}};
w.PandaHsk2AudioV330={lookup:()=>null,play:()=>true,stop(){}};
for(const f of ['assets/hsk2-life-course-data-v1.js','assets/hsk2-day-first-data-v1.js','assets/hsk2-day-topic-one-v391.js','assets/hsk2-day-first-ui-v1.js','assets/hsk2-six-screens-v414.js','assets/hsk2-exact-overlay-v415.js','assets/hsk2-storyboard-v439.js','assets/hsk2-life-course-app-v1.js'])
 w.eval(fs.readFileSync(path.join(root,f),'utf8'));
function click(selector){
 const el=doc.querySelector(selector);
 assert.ok(el,'Missing '+selector+' in '+doc.body.textContent.slice(-200));
 assert.equal(el.disabled,false,'Disabled '+selector);
 el.click();return el;
}
function count(selector){return doc.querySelectorAll(selector).length}
function next(page){
 assert.equal(doc.querySelector('.pg433-counter').textContent,page+' / 12');
 click('[data-pg433-next]');
}
function assertBlocked(){
 assert.equal(doc.querySelector('[data-pg433-next]').disabled,true);
}
click('[data-practice-mini="0:0"]');
for(const [mini,words] of [7,7,6].entries()){
 const src=w.PandaGoDayModulesV391[mini];
 assert.equal(count('.pg433-wordrow'),4);
 assert.equal(count('.pg433-wordrow .pg433-py'),4);
 next(1);
 assert.equal(count('.pg433-wordrow'),words-4);
 next(2);
 assert.match(doc.querySelector('.pg433-content').textContent,/Грамматика/);
 next(3);
 click('[data-day-rule-choice="0"]');
 assert.equal(count('[data-day-rule-choice].correct'),1);
 next(4);
 assert.equal(count('.pg433-speechrow'),4);
 if(mini===0){
  click('[data-day-speech-mic="2"]');
  assert.equal(count('[role="dialog"]'),1);
  assert.equal(starts,0);
  click('[data-day-consent]');
  assert.equal(starts,1);
  current.report('起床');
  assert.match(doc.querySelectorAll('.pg433-speechrow em')[2].textContent,/Распознано/);
  click('[data-day-speech-mic="2"]');current.report('其他');
  assert.match(doc.querySelectorAll('.pg433-speechrow em')[2].textContent,/Повтори ещё/);
 }
 next(5);
 assert.equal(count('.pg433-speechrow'),words-4);
 next(6);
 assertBlocked();
 src.quiz.forEach((question,i)=>click('[data-day-quiz="'+i+':'+question.answer+'"]'));
 next(7);
 assertBlocked();
 for(let i=0;i<3;i++){click('[data-day-pair-left="'+i+'"]');click('[data-day-pair-right="'+i+'"]')}
 next(8);
 click('[data-pg433-prev]');
 assert.equal(count('.pg433-pairs button.correct'),6,'Matching answers survive back navigation');
 next(8);
 assertBlocked();
 click('[data-day-listen="0"]');
 for(let i=0;i<src.builder.length;i++)click('[data-day-token="'+i+'"]');
 next(9);
 assertBlocked();
 click('[data-day-fill="'+[0,1,1][mini]+'"]');
 click('[data-day-truth="'+[true,true,false][mini]+'"]');
 next(10);
 assert.equal(count('.pg433-sentence'),3);
 next(11);
 assert.equal(count('.pg433-chat'),4);
 next(12);
 const link=new URL(doc.querySelector('.pg433-done .pg433-ai-link').href);
 assert.equal(link.searchParams.get('practice'),'day');
 assert.equal(link.searchParams.get('mini'),String(mini));
 assert.equal(link.searchParams.get('return'),'done');
 if(mini<2)click('[data-next-mini]');
}
assert.deepEqual(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed,[0,1,2]);
assert.deepEqual(errors,[]);
console.log('PASS HSK2 day: all three mini-lessons, 12 pages each, 21 exercises, speech consent, Panda AI links and saved progress');
