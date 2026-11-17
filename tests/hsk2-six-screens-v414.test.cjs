'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
assert.match(html,/hsk2-six-screens-v414\.js\?v=414/);
assert.match(html,/hsk2-six-screens-v414\.css\?v=414/);
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc});
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
for(const f of ['assets/hsk2-life-course-data-v1.js','assets/hsk2-day-first-data-v1.js','assets/hsk2-day-topic-one-v391.js','assets/hsk2-day-first-ui-v1.js','assets/hsk2-six-screens-v414.js','assets/hsk2-exact-overlay-v415.js','assets/hsk2-life-course-app-v1.js'])
 w.eval(fs.readFileSync(path.join(root,f),'utf8'));
function click(selector){
 const el=doc.querySelector(selector);
 assert.ok(el,'Missing '+selector+' in '+doc.body.textContent.slice(-200));
 assert.equal(el.disabled,false,'Disabled '+selector);
 el.click();return el;
}
function assertStage(index){
 const art=doc.querySelector('.pg415-art-screen');
 if(art){
  assert.ok(art.classList.contains('pg415-step-'+index),'Wrong approved art stage '+index);
  assert.equal(doc.querySelectorAll('.pg415-tab').length,4);
  assert.match(doc.querySelector('.pg415-art').getAttribute('src'),new RegExp(['01-words','02-rule','03-speech','04-test','05-examples'][index]));
  return;
 }
 const tabs=[...doc.querySelectorAll('.pg414-tabs span')];
 assert.equal(tabs.length,5);
 assert.ok(tabs[index].classList.contains('active'),'Wrong stage '+index);
}
function fullQuiz(mini){
 const src=w.PandaGoDayModulesV391[mini],fill=[0,1,1][mini],truth=[true,true,false][mini];
 click('[data-day-quiz="0:'+src.quiz[0].answer+'"]');
 click('[data-day-quiz="1:'+src.quiz[1].answer+'"]');
 for(let i=0;i<3;i++){click('[data-day-pair-left="'+i+'"]');click('[data-day-pair-right="'+i+'"]')}
 click('[data-day-listen="0"]');
 for(let i=0;i<src.builder.length;i++)click('[data-day-token="'+i+'"]');
 click('[data-day-fill="'+fill+'"]');
 click('[data-day-truth="'+truth+'"]');
 assert.match(doc.querySelector('.pg414-test .pg414-progress').textContent,/7\/7/);
}
click('.approved-start');
const wordCount=[7,7,6];
for(let mini=0;mini<3;mini++){
 assertStage(0);
 assert.equal(doc.querySelectorAll('.pg414-vocab-row').length,wordCount[mini]);
 assert.equal(doc.querySelectorAll('.pg414-vocab-row button.audio').length,wordCount[mini]);
 assert.ok(doc.querySelectorAll('.pg414-pinyin').length>0,'Pinyin visible');
 click('[data-day-pinyin]');
 assert.equal(doc.querySelectorAll('.pg414-pinyin').length,0,'Pinyin switch must hide pinyin');
 click('[data-day-pinyin]');
 click('[data-day-next]');assertStage(1);
 assert.equal(doc.querySelectorAll('.pg414-example-compact').length,2);
 click('[data-day-rule-choice="0"]');
 click('[data-day-next]');assertStage(2);
 assert.equal(doc.querySelectorAll('.pg414-speech-row').length,wordCount[mini]);
 if(mini===0){
  click('[data-day-speech-mic="2"]');
  assert.ok(doc.querySelector('.pg415-consent'),'Consent is required: status='+starts+' buttons='+doc.querySelectorAll('[data-day-speech-mic]').length+' page='+doc.querySelector('.pg415-art-screen')?.className+' visible='+doc.querySelector('.pg415-consent,.pg414-consent')?.outerHTML.slice(0,80)+' reason='+doc.querySelector('#status')?.textContent);
  assert.equal(starts,0);
  click('[data-day-consent]');
  assert.equal(starts,1);
  current.report('起床');
  assert.match(doc.querySelector('.pg415-rec-status').textContent,/Распознано/);
  click('[data-day-speech-mic="2"]');current.report('其他');
  assert.match(doc.querySelector('.pg415-rec-status').textContent,/Повтори ещё/);
 }
 click('[data-day-next]');assertStage(3);
 assert.equal(doc.querySelectorAll('.pg414-test .pg414-question').length,7);
 assert.equal(doc.querySelector('[data-day-next]').disabled,true,'Test must gate completion');
 fullQuiz(mini);
 click('[data-day-next]');assertStage(4);
 assert.equal(doc.querySelectorAll('.pg414-example-large').length,3);
 assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
 click('[data-day-next]');
 assert.ok(doc.querySelector('.pg414-ai'));
 assert.ok(doc.querySelector('.day-ai-panel a').getAttribute('href').includes('practice=day&mini='+mini));
 if(mini<2)click('[data-next-mini]');
}
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,3);
assert.deepEqual(errors,[]);
console.log('PASS HSK2 v414: six screens, pinyin, real controls, 3×7 quiz tasks, microphone consent & repeat, Panda AI handoff, 20 words, saved progress');
