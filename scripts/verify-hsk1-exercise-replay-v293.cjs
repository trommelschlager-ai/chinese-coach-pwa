'use strict';
/* Panda Go v293: finished HSK1 exercises stay replayable; lesson 4 skips empty completion shells.
 * The existing full-path scripts cover all seven lesson routes; this test adds
 * backwards navigation and post-completion retake edge cases for 3 and 4.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const read=x=>fs.readFileSync(x,'utf8');
const urls=['hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html','hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'];
for(const page of urls) assert(read(page).includes('hanzi-writing.html?lesson='+(urls.indexOf(page)+1)),'Missing handwriting entrance: '+page);
const create3=(step,phase)=>{
 const dom=new JSDOM(read(urls[2]),{url:'https://panda.test/'+urls[2],runScripts:'outside-only'});
 const w=dom.window;
 w.localStorage.setItem('pg-hsk1-v213-numbers',JSON.stringify({step,done:true,firstTry:8,phase:{[step]:phase}}));
 w.Audio=function(){this.play=()=>Promise.resolve();this.pause=()=>{};};
 w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
 w.eval(read('assets/hsk1-third-v213.js'));
 return {dom,w,d:w.document};
};
const replay3=[
 [3,'[data-replay-quiz="3"]'],
 [5,'[data-review-rule="5"]'],
 [6,'[data-review-rule="6"]'],
 [7,'[data-review-rule="7"]'],
 [9,'[data-reset-build]'],
 [10,'[data-replay-quiz="10"]'],
 [11,'[data-replay-context]'],
 [12,'[data-replay-quiz="12"]']
];
for(const [step,selector] of replay3){
 const {dom,w,d}=create3(step,999);
 const control=d.querySelector(selector);
 assert(control,'Lesson 3 finished step '+(step+1)+' has no accessible replay button '+selector);
 assert(!control.disabled);
 control.click();
 const state=JSON.parse(w.localStorage.getItem('pg-hsk1-v213-numbers'));
 assert.equal(state.phase[step],0,'Lesson 3 phase must be reset '+step);
 assert.equal(state.done,true,'Lesson 3 prior achievement must survive');
 assert.equal(state.firstTry,8,'Lesson 3 first attempt result must survive');
 assert(d.getElementById('pg3-stage').textContent.trim().length>25);
 dom.window.close();
}
{
 const {dom,w,d}=create3(12,999);
 d.querySelector('[data-replay-quiz="12"]').click();
 const answer=d.querySelector('[data-exam-answer="35"]');
 assert(answer,'Expected original exam question');
 answer.click();
 assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk1-v213-numbers')).firstTry,8,'Retake must not inflate original score');
 dom.window.close();
}
const create4=(step,completed)=>{
 const dom=new JSDOM(read(urls[3]),{url:'https://panda.test/'+urls[3],runScripts:'outside-only'});
 const w=dom.window;
 const ix={4:7,7:4,9:1,10:3,11:10};
 w.localStorage.setItem('pg-hsk1-v215-weekdays',JSON.stringify({step,done:true,ix,reviewMode:false,examAnswers:{}}));
 w.Audio=function(){this.play=()=>Promise.resolve();this.pause=()=>{};};
 w.HanziWriter={create:()=>({cancelQuiz(){},pauseAnimation(){},animateCharacter(){},quiz(){}})};
 w.eval(read('assets/hsk1-fourth-v220.js'));
 return {dom,w,d:w.document};
};
for(const [step,selector] of [[4,'[data-repeat="4"]'],[7,'[data-repeat="7"]'],[9,'[data-repeat="9"]'],[10,'[data-repeat="10"]'],[11,'[data-repeat="11"]']]){
 const restored=create4(step);
 // The current approved lesson has one merged page, and its displayed
 // counter uses the stage index for steps 3–12. Check the actual stage first.
 const expectedStage=({4:5,7:8,9:9,10:12,11:12})[step];
 assert.equal(Number(restored.d.querySelector('.pg4-app').dataset.step),expectedStage,'Lesson 4 skips only completed empty shells '+step);
 assert.equal(Number(restored.d.querySelector('#pg3-count').textContent.split('/')[0]),expectedStage,'Lesson 4 header counter matches its current merged-page stage '+step);
 restored.dom.window.close();
 const {dom,w,d}=create4(step===9?9:12);
 const control=d.querySelector(selector);
 assert(control,'Lesson 4 finished step '+(step+1)+' cannot repeat: '+selector);
 assert(!control.disabled);
 control.click();
 const s=JSON.parse(w.localStorage.getItem('pg-hsk1-v215-weekdays'));
 assert.equal(s.ix[step],0,'Lesson 4 replay should reset questions '+step);
 assert.equal(s.done,true,'Lesson 4 achievement must remain');
 assert(d.getElementById('pg3-stage').textContent.trim().length>25);
 dom.window.close();
}
{
 const {dom,d}=create4(12);
 d.getElementById('pg3-prev').click();
 assert.equal(Number(d.getElementById('pg3-count').textContent.split('/')[0]),10,'Back skips finished exam and builder');
 d.getElementById('pg3-prev').click();
 assert.equal(Number(d.getElementById('pg3-count').textContent.split('/')[0]),9,'Back reaches writing');
 d.getElementById('pg3-prev').click();
 assert.equal(Number(d.getElementById('pg3-count').textContent.split('/')[0]),7,'Back skips finished calendar');
 dom.window.close();
}
const numbers=read('assets/hsk1-third-v213.js');
assert(numbers.includes("pool=[correct.at(-1),n===90?'三':'四',...correct.slice(0,-1)]"),'Number constructor should not display words in correct order');
const weekdays=read('assets/hsk1-fourth-v220.js');
assert(weekdays.includes('completedExercise(state.step)'),'Completed lesson-4 shells must be skipped');
console.log('PASS HSK1 v293: 7 entry routes, 8 lesson3 replay states, 5 lesson4 replay states, first-attempt scores and backwards navigation');
