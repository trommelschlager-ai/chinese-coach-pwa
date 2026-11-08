'use strict';
/* Full HSK1 fourth lesson regression: 13 screens, voice playback completion gates,
 * weekday rules including Sunday, calendar wrap-around, chat and 7-question exam.
 * Audio decoding, noise, visuals and pronunciation require Android listening QA.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk1-fourth-v214.html','utf8'),
 script=fs.readFileSync('assets/hsk1-fourth-v214.js','utf8'),
 styles=fs.readFileSync('assets/hsk1-fourth-v214.css','utf8'),
 map=fs.readFileSync('hsk1-map.html','utf8'),
 native=fs.readFileSync('assets/hsk1-native-human-map-v167.js','utf8'),
 numberVoice=fs.readFileSync('assets/hsk1-numbers-audio-map-v213.js','utf8'),
 weekdayVoice=fs.readFileSync('assets/hsk1-weekdays-audio-map-v214.js','utf8');
assert(map.includes('data-num="4" href="./hsk1-fourth-v214.html"'),'HSK1 map must navigate to dedicated weekday lesson');
assert(html.includes('hsk1-fourth-v214.js?v=214'));
assert(html.includes('hsk1-fourth-v214.css?v=214'));
assert(styles.includes('.pg4-day-grid')&&styles.includes('.pg4-calendar-week'));
assert(script.includes("星期天")&&script.includes("星期日")&&!script.includes("星期七',py"),'Sunday alternatives must be correct');
const dom=new JSDOM(html,{url:'https://panda.test/hsk1-fourth-v214.html',runScripts:'outside-only'});
const w=dom.window,d=w.document,played=[];
const previous={
 lesson1:JSON.stringify({step:13,completed:true}),
 lesson2:JSON.stringify({step:11,completed:true}),
 lesson3:JSON.stringify({step:13,done:true,score:8})
};
w.localStorage.setItem('pg-hsk1-v189-lesson1',previous.lesson1);
w.localStorage.setItem('pg-hsk1-v203-pronouns',previous.lesson2);
w.localStorage.setItem('pg-hsk1-v213-numbers',previous.lesson3);
w.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers']));
w.eval(native);w.eval(numberVoice);w.eval(weekdayVoice);
w.Audio=function(src){
 this.src=src;this.pause=()=>{};this.play=()=>{played.push(this);return Promise.resolve()};
};
w.eval(script);
const step=()=>Number(d.getElementById('pg3-count').textContent.split(' ')[0]);
function click(selector){
 const b=d.querySelector(selector);
 assert(b,'Missing '+selector+' on screen '+step());
 assert(!b.disabled,'Disabled '+selector+' on screen '+step());
 b.click();return b;
}
function play(text){
 click('[data-audio="'+text+'"]');
 const a=played.at(-1);assert(a,'No audio played for '+text);
 assert(a.src.includes('hsk1-weekdays-clean-v214/'),'Word/phrase should use one-speaker normalized sample');
 assert(typeof a.onended==='function','Recording must have finished event');
 a.onended();
}
function next(){click('#pg3-next')}
function findClick(attr,value){
 return click('['+attr+'="'+value+'"]');
}
assert.equal(step(),1);assert(d.getElementById('pg3-progress').getAttribute('aria-valuemax')==='13');
next();assert.equal(step(),2);
for(const day of ['星期一','星期二','星期三']){
 click('[data-day="'+day+'"]');
 assert(d.getElementById('pg3-next').disabled,'Cannot mark day learned until recording finished');
 played.at(-1).onended();
}
next();assert.equal(step(),3);
for(const day of ['星期四','星期五','星期六','星期日']){
 click('[data-day="'+day+'"]');played.at(-1).onended();
}
next();assert.equal(step(),4);
for(const [a,b] of [['星期二','星期二'],['星期五','星期五'],['星期日','星期日']]){
 assert(d.querySelector('[data-quiz-answer]').disabled,'Choice must wait for audio end');
 play(a);
 findClick('data-quiz-answer',b);
}
assert.equal(step(),5);
for(const target of [['星期','三'],['星期','六']]){
 for(const text of target){
  const btn=Array.from(d.querySelectorAll('[data-tile]')).find(b=>!b.disabled&&b.textContent.trim()===text);
  assert(btn,'Missing tile '+text);btn.click();
 }
 click('[data-check-tiles]');
}
assert.equal(step(),6);
assert(d.getElementById('pg3-stage').textContent.includes('星期天'));
assert(d.getElementById('pg3-stage').textContent.includes('星期日'));
assert(d.getElementById('pg3-stage').textContent.includes('星期七'),'Lesson must warn against nonstandard 星期七');
findClick('data-sunday-answer','星期天');assert.equal(step(),7);
for(const word of ['今天','明天','昨天']){
 click('[data-time="'+word+'"]');played.at(-1).onended();
}
next();assert.equal(step(),8);
for(const day of ['星期二','星期四','星期一'])findClick('data-calendar-answer',day);
assert.equal(step(),9);
assert(d.getElementById('pg3-stage').textContent.includes('不需要')||d.getElementById('pg3-stage').textContent.includes('不')||d.getElementById('pg3-stage').textContent.includes('吗'));
findClick('data-question-answer','今天星期几？');assert.equal(step(),10);
for(const pair of [['今天星期几？','今天星期五。'],['明天星期几？','明天星期六。']]){
 assert(d.querySelector('[data-chat-answer]').disabled);
 play(pair[0]);findClick('data-chat-answer',pair[1]);
}
assert.equal(step(),11);
for(const text of ['今天','星期','五']){
 const btn=Array.from(d.querySelectorAll('[data-tile]')).find(b=>!b.disabled&&b.textContent.trim()===text);
 assert(btn,'No tile '+text);btn.click();
}
click('[data-check-tiles]');assert(!d.getElementById('pg3-next').disabled);
play('今天星期五。');
next();assert.equal(step(),12);
for(const right of ['星期一','星期六','星期天','星期四','завтра','今天星期几？','星期一']){
 if(right==='星期四'){assert(d.querySelector('[data-exam-answer]').disabled);play('星期四')}
 findClick('data-exam-answer',right);
}
assert.equal(step(),13);
assert(d.querySelector('.pg13-score')?.textContent.includes('7 / 7'),'Final exam should score first attempts');
const saved=JSON.parse(w.localStorage.getItem('pg-hsk1-v214-weekdays'));
assert.equal(saved.done,true);assert.equal(saved.firstTry,7);
const done=JSON.parse(w.localStorage.getItem('pg-hsk1-v3-complete'));
assert(done.includes('weekdays')&&done.includes('numbers'));
assert.equal(w.localStorage.getItem('pg-hsk1-v189-lesson1'),previous.lesson1);
assert.equal(w.localStorage.getItem('pg-hsk1-v203-pronouns'),previous.lesson2);
assert.equal(w.localStorage.getItem('pg-hsk1-v213-numbers'),previous.lesson3);
click('#pg3-prev');assert.equal(step(),12);
click('#pg3-prev');assert.equal(step(),11);
click('#pg3-prev');assert.equal(step(),10);
click('#pg3-prev');assert.equal(step(),9);
assert(!d.getElementById('pg3-next').disabled,'Passed question must remain passed when navigating back');
dom.window.close();
console.log('PASS HSK1 lesson 4 v214: 13 screens, same-speaker audio after playback, Sunday exception, day composition, calendar wrap, dialogue, voice-gated exam, 7/7, preserved prior lessons.');
