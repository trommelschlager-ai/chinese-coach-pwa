/* Run: node scripts/verify-hsk2-city-work.cjs
 * Beginner HSK2 learner regression: two words, one rule, short checks.
 * Browser acoustic-tone scoring and mobile visual rendering remain unverified.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('hsk2-city-work.html','utf8');
const map=fs.readFileSync('hsk2-start.html','utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(inline.length,1);new Function(inline[0]);
for(const term of ['Моя первая фраза','Всего два новых слова','Одно правило грамматики','我在公司工作。','gōngsī','gōngzuò','5 раз'])
assert(html.includes(term),'Missing learner material: '+term);
assert(!html.includes('会 + ГЛАГОЛ'),'Advanced grammar must not reappear');
assert(map.includes('href="./hsk2-city-work.html"'),'Course map must link to beginner pilot');
const dom=new JSDOM(html,{url:'https://panda-go.example/hsk2-city-work.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;
const read=f=>fs.readFileSync(f,'utf8');
w.eval(read('assets/hsk2-user-voice/phrase-index-v332.js'));
w.eval(read('assets/hsk2-audio-v330.js'));
const real=w.PandaHsk2AudioV330,heard=[];
for(const zh of ['公司','工作','你做什么工作','我在公司工作'])assert(real.lookup(zh),'Approved MP3 missing: '+zh);
w.PandaHsk2AudioV330={...real,play:(txt,report)=>{heard.push(txt);report('Recorded source played');return true}};
w.PandaHSK2PracticeV326={speechAvailable:()=>false};
w.eval(inline[0]);
const step=()=>Number(d.querySelector('#step-counter').textContent.split(' ')[0]);
const click=(sel)=>{const el=d.querySelector(sel);assert(el,'Missing '+sel);assert(!el.disabled,'Disabled '+sel);el.click();return el};
const next=()=>click('#next');
assert.equal(step(),1);
next();assert.equal(step(),2);assert.equal(d.querySelectorAll('.word').length,2);
next();assert.equal(step(),3);assert(d.querySelector('#screen').textContent.includes('我 + 在 + 公司 + 工作'));
next();assert.equal(step(),4);assert.equal(d.querySelectorAll('.bubble').length,2);
next();assert.equal(step(),5);assert(d.querySelector('#next').disabled);
click('[data-quiz="0"]');assert(d.querySelector('#next').disabled,'Incorrect answer must block');
click('[data-quiz="1"]');assert(!d.querySelector('#next').disabled);
next();assert.equal(step(),6);
for(const i of [2,3,0,1])click('[data-token="'+i+'"]');
assert(d.querySelector('#screen').textContent.includes('✓ Отлично'));assert(!d.querySelector('#next').disabled);
next();assert.equal(step(),7);assert(d.querySelector('#next').disabled);
click('[data-play="我在公司工作"]');
assert(heard.includes('我在公司工作'),'Must use recorded MP3');
click('[data-listening="2"]');assert(d.querySelector('#next').disabled);
click('[data-listening="0"]');assert(!d.querySelector('#next').disabled);
next();assert.equal(step(),8);
assert(d.querySelector('#next').disabled,'Five attempts or explicit skip required');
assert(d.querySelector('[data-mic]').disabled,'No artificial recognition with missing browser mic');
click('[data-skip-mic]');assert(!d.querySelector('#next').disabled);
next();assert.equal(step(),9);assert(d.querySelector('#screen').textContent.includes('Первый шаг сделан'));
assert(w.localStorage.getItem('pg-hsk2-city-work-easy-v2'),'Beginner progress stored separately');
click('[data-restart]');assert.equal(step(),1);
w.close();
console.log('PASS: beginner My City HSK2 lesson has 2 words, 1 grammar rule, 9 screens, correct-answer gates, owned MP3, accessible mic fallback and restart.');
