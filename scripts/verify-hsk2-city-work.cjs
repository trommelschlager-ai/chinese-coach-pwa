/* Panda Go · My City HSK2 lesson 3
 * Run: node scripts/verify-hsk2-city-work.cjs
 * Exercises real learner flow in jsdom. It cannot assess speaker accent/tones or Android UI rendering.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk2-city-work.html','utf8');
const map=fs.readFileSync('hsk2-start.html','utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(inline.length,1);
new Function(inline[0]);
for(const must of ['Встреча в кафе','Грамматика: 在','Грамматика: 会','Аудирование','Разговор с Пандой','5 попыток','bú huì','我在公司工作。','我会说中文'])
 assert(html.includes(must),'Lesson element missing: '+must);
assert(map.includes('href="./hsk2-city-work.html"'),'Course map must link to real playable pilot');
assert(html.indexOf('Грамматика: 在')<html.indexOf('Проверь понимание'),'Grammar precedes exercises');
const dom=new JSDOM(html,{url:'https://panda-go.example/hsk2-city-work.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
const read=p=>fs.readFileSync(p,'utf8');
w.eval(read('assets/hsk2-user-voice/phrase-index-v332.js'));
w.eval(read('assets/hsk2-audio-v330.js'));
const voice=w.PandaHsk2AudioV330,heard=[];
for(const word of ['工作','公司','做','医生','老师','在','你做什么工作','我在公司工作','你会说中文吗','会我会说中文'])assert(voice.lookup(word),'Missing user-provided audio: '+word);
w.PandaHsk2AudioV330={...voice,play:(text,report)=>{heard.push(text);report('Тестовое воспроизведение')}};
w.PandaHSK2PracticeV326={speechAvailable:()=>false};
w.eval(inline[0]);
const click=(sel)=>{const el=doc.querySelector(sel);assert(el,'Missing control '+sel);assert(!el.disabled,'Disabled control '+sel);el.click();return el};
const step=()=>Number(doc.querySelector('#step-counter').textContent.split(' ')[0]);
const next=()=>click('#next');
assert.equal(step(),1);assert(doc.querySelector('#screen').textContent.includes('Твоя первая работа'));
next();assert.equal(step(),2);assert.equal(doc.querySelectorAll('.bubble').length,4);
next();assert.equal(step(),3);assert.equal(doc.querySelectorAll('.word').length,6);
next();assert.equal(step(),4);assert(doc.querySelector('#screen').textContent.includes('我 + 在 + МЕСТО + 工作'));
next();assert.equal(step(),5);assert(doc.querySelector('#screen').textContent.includes('会 + ГЛАГОЛ'));
next();assert.equal(step(),6);assert(doc.querySelector('#next').disabled,'Cannot advance without comprehension answer');
click('[data-quiz="0"]');assert(doc.querySelector('#next').disabled,'Wrong translation must block');
click('[data-quiz="1"]');assert(!doc.querySelector('#next').disabled);
next();assert.equal(step(),7);
for(const i of [1,3,0,2])click('[data-token="'+i+'"]');
assert(doc.querySelector('#screen').textContent.includes('✓ Отлично!'));assert(!doc.querySelector('#next').disabled);
next();assert.equal(step(),8);
assert(doc.querySelector('#next').disabled,'Listening answer required');
click('[data-play="你会说中文吗"]');
assert(heard.includes('你会说中文吗'),'Approved listening MP3 was not triggered');
click('[data-listen="0"]');assert(doc.querySelector('#next').disabled);
click('[data-listen="2"]');assert(!doc.querySelector('#next').disabled);
next();assert.equal(step(),9);
assert(doc.querySelector('#next').disabled);
click('[data-talk-0="1"]');assert(doc.querySelector('#next').disabled,'Both responses required');
click('[data-talk-1="0"]');assert(!doc.querySelector('#next').disabled);
next();assert.equal(step(),10);
assert(doc.querySelector('#screen').textContent.includes('Тоны'));
assert(doc.querySelector('[data-act="mic"]').disabled,'Unsupported mic must not spoof speech scores');
next();assert.equal(step(),11);assert(doc.querySelector('#screen').textContent.includes('Урок завершён'));
assert(JSON.parse(w.localStorage.getItem('pg-hsk2-city-work-v1')).completed);
click('[data-act="restart"]');assert.equal(step(),1);assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-city-work-v1')).mistakes,0);
w.close();
console.log('PASS HSK2 My City lesson 3: 11 screens, grammar-before-test, exact owned MP3, incorrect-answer gates, builder, listening, dialogue, no fake tone score and restart.');
