'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'hsk2-life-course.html'),'utf8');
const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://example.org/hsk2-life-course.html',runScripts:'dangerously',virtualConsole:vc});
const w=dom.window,doc=w.document;
let latest=null,started=0;
class FakeSpeechRecognition{
 constructor(){latest=this;this.lang='';this.interimResults=false;this.maxAlternatives=1;}
 start(){started++}
 abort(){}
 report(transcript){this.onresult?.({results:[[{transcript}]]});this.onend?.()}
 fail(error){this.onerror?.({error});this.onend?.()}
}
w.SpeechRecognition=FakeSpeechRecognition;
w.PandaHsk2AudioV330={lookup:()=>null,play:()=>false};
for(const f of ['assets/hsk2-life-course-data-v1.js','assets/hsk2-day-first-data-v1.js','assets/hsk2-day-topic-one-v391.js','assets/hsk2-day-first-ui-v1.js','assets/hsk2-life-course-app-v1.js'])w.eval(fs.readFileSync(path.join(root,f),'utf8'));
function click(sel){const el=doc.querySelector(sel);assert.ok(el,'missing '+sel);assert.equal(el.disabled,false,'disabled '+sel);el.click()}
// Exercise the legacy engine via the same delegated mini-lesson action as the catalog.
const entry=doc.createElement('button');
entry.dataset.practiceMini='0:0';
doc.body.append(entry);
entry.click();
entry.remove();
click('[data-day-show-words]');
click('[data-day-next]'); // 2: grammar
click('[data-day-next]'); // 3: speech
assert.equal(doc.querySelectorAll('.day-attempts .heard').length,0,'No fake results before recording');
click('[data-day-record]');
assert.ok(doc.querySelector('.day-consent'),'Consent prompt required before mic starts');
assert.equal(started,0,'Microphone must not start without user consent');
click('[data-day-consent]');
assert.equal(started,1);
assert.equal(latest.lang,'zh-CN');
latest.report('起床。');
assert.equal(doc.querySelectorAll('.day-attempts .heard').length,1);
click('[data-day-record]');latest.report('吃饭');
assert.equal(doc.querySelectorAll('.day-attempts .not-heard').length,1);
for(let i=0;i<3;i++){click('[data-day-record]');latest.report('起床')}
assert.equal(doc.querySelectorAll('.day-attempts>div').length,5);
assert.equal(doc.querySelectorAll('.day-attempts .heard').length,4);
assert.equal(doc.querySelectorAll('.day-attempts .not-heard').length,1);
assert.match(doc.querySelector('.day-feedback').textContent,/4 распознано/);
assert.ok(!doc.querySelector('[data-day-record]'),'No more than five recognition attempts for one word');
click('[data-day-speech-word="3"]');
assert.equal(doc.querySelectorAll('.day-attempts .heard').length,0);
click('[data-day-record]');latest.fail('not-allowed');
assert.match(doc.querySelector('.day-card').textContent,/not-allowed/);
assert.equal(doc.querySelectorAll('.day-attempts .heard,.day-attempts .not-heard').length,0,'Failed permission is not a scored attempt');
click('[data-day-next]'); // 4: test
click('[data-day-quiz="0:1"]');click('[data-day-quiz="1:0"]');
for(let i=0;i<4;i++)click('[data-day-token="'+i+'"]');
click('[data-day-next]'); // 5: examples
assert.equal(doc.querySelectorAll('.day-dialogue').length,4);
click('[data-day-next]'); // complete
assert.ok(doc.querySelector('.day-ai-panel a').getAttribute('href').includes('practice=day&mini=0'));
assert.equal(JSON.parse(w.localStorage.getItem('pg-hsk2-life-course-v1')).completed.length,1);
assert.deepEqual(errors,[]);
console.log('PASS: consent-gated browser mic, 5 real transcript results, one error, no fabricated scores, Panda AI topic link, persisted progress');
