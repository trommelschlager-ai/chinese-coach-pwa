'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const errors=[],vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(e.message));
vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc});
const w=dom.window,doc=w.document;
const spoken=[];
let humanPlay=0;
w.speechSynthesis={cancel(){},speak(u){spoken.push(u.text)},getVoices(){return [{lang:'zh-CN',name:'Mandarin test'}]}};
w.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
w.PandaHsk2AudioV330={lookup(zh){return zh==='我起床以后洗脸'?'sample.mp3':null},play(){humanPlay++;return true},stop(){}};
for(const f of ['assets/hsk2-life-course-data-v1.js','assets/hsk2-day-first-data-v1.js','assets/hsk2-day-topic-one-v391.js','assets/hsk2-day-first-ui-v1.js','assets/hsk2-life-course-app-v1.js'])
 w.eval(fs.readFileSync(path.join(root,f),'utf8'));
const click=selector=>{const b=doc.querySelector(selector);assert.ok(b,'Missing '+selector);assert.ok(!b.disabled,'Disabled '+selector);b.click()};
// The public start button now opens «О себе». Enter the day module via
// the mini-lesson action shared with the current catalog.
const entry=doc.createElement('button');
entry.dataset.practiceMini='0:0';
doc.body.append(entry);
entry.click();
entry.remove();
assert.ok(doc.querySelector('.art-sound'),'Approved first-lesson art must remain');
click('.art-sound');
assert.deepEqual(spoken,['起床'],'Clicking image speaker says the exact word, not a whole unrelated sentence');
assert.equal(doc.querySelector('.art-audio-note'),null,'Sound tap must not create an overlay or cause a rerender');
assert.equal(humanPlay,0);
click('[data-day-show-words]');
const headers=()=>[...doc.querySelectorAll('.day-stages span')].map(n=>n.textContent.replace(/\s+/g,'').trim());
assert.deepEqual(headers(),['1Слово','2Правило','3Речь','4Тест','5Примеры']);
assert.ok(doc.querySelector('.day-headword').textContent.includes('起床'));
click('[data-day-next]'); // grammar
assert.ok(doc.querySelector('.day-formula').textContent.includes('七点'));
click('[data-day-next]'); // speech
assert.ok(doc.querySelector('.day-speech-card'));
assert.ok(doc.querySelectorAll('.day-attempts>div').length===5);
const genuine=doc.querySelector('.day-speechhero [data-sound="我起床以后洗脸"]');
assert.ok(genuine,'An existing full-sentence MP3 is offered as its own labelled example');
genuine.click();
assert.equal(humanPlay,1,'Real human MP3 takes priority over device voice for the exact available sample');
click('[data-day-speech-word="4"]'); // isolated 刷牙 is not in existing MP3 index
const missing=doc.querySelector('.day-speechhero .hsk2-no-mp3');
assert.ok(missing,'A missing word must show an honest non-interactive MP3 status');
assert.match(missing.textContent,/MP3 нет/);
assert.equal(doc.querySelector('.day-speechhero .missing-voice'),null,'Do not display a clickable imitation of recorded audio');
assert.deepEqual(spoken,['起床'],'Missing standalone word must not trigger robotic Android voice');
click('[data-day-next]'); // test
assert.equal(doc.querySelectorAll('.day-question').length,2);
click('[data-day-quiz="0:1"]');click('[data-day-quiz="1:0"]');
for(let i=0;i<4;i++)click('[data-day-token="'+i+'"]');
click('[data-day-next]'); // examples
assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
assert.ok(doc.querySelectorAll('.day-line .audio').length>=3,'Examples are playable even if individual MP3 files are missing');
click('[data-day-next]');
assert.ok(doc.querySelector('.day-ai-panel a'));
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,1);
assert.deepEqual(errors,[]);
console.log('PASS HSK2 v413: direct illustration speech, no popup, reordered stages, exact human MP3 priority, no robotic substitute and end-of-lesson progress');
