import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ENVELOPES} from '../assets/panda-live-envelope.mjs';
import {JSDOM} from 'jsdom';
import {CONVERSATIONS,selectConversation,missingConversationAudio,pendingVoiceQueue} from '../assets/panda-live-lessons.mjs';
import {chineseNumber} from '../assets/panda-live-drafts.mjs';
import {verifyAnswerFor} from '../assets/panda-voice-pilot-engine.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(id,index,text)=>verifyAnswerFor(CONVERSATIONS[id-1].lines,index,text);
test('all seven conversations have complete mapped audio and open by normal lesson URLs',()=>{
 assert.equal(CONVERSATIONS.length,7);
 for(let id=2;id<=7;id++){
  assert.equal(selectConversation('?lesson='+id).id,id);
  assert.equal(selectConversation('?lesson='+id+'&preview=1').id,id);
  assert.equal(CONVERSATIONS[id-1].requiresLesson,id);
 }
 assert.deepEqual(CONVERSATIONS.slice(1).map(x=>missingConversationAudio(x,lookupPilotAudio).length),[0,0,0,0,0,0]);
 const queue=pendingVoiceQueue(lookupPilotAudio);assert.equal(queue.length,0);
 assert.equal(new Set(queue.map(x=>x.phrase)).size,0);
 assert(!queue.some(x=>['你好！','谢谢！'].includes(x.phrase)));
 const script=fs.readFileSync(new URL('../docs/PANDA-LIVE-BATCH-VOICE.txt',import.meta.url),'utf8').trim().split(/\n\n/);
 const received=JSON.parse(fs.readFileSync(new URL('../assets/panda-live-voice-v3/manifest.json',import.meta.url),'utf8'));assert.deepEqual(script,received.clips.map(x=>x.text));assert.equal(received.clips.length,14);
 for(const clip of received.clips){
  const path=lookupPilotAudio(clip.text);assert(path.endsWith(clip.file));
  const bytes=fs.readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256,clip.text);
  assert(Math.abs(ENVELOPES[path].levels.length*.025-clip.decodedSeconds)<.026,clip.text);
 }

 assert.equal(lookupPilotAudio('谢谢！'),'./assets/panda-live-voice-v2/thanks.mp3');
});
test('age, weekday, date, family and weather answers follow their own context',()=>{
 for(let age=1;age<=100;age++){
  assert(check(3,1,`我${chineseNumber(age)}岁`).ok,age);
  assert(check(3,1,`我${age}岁`).ok,age);
 }
 assert(check(3,1,'我两岁').ok);
 for(const text of ['我0岁','我101岁','我二十十岁','我是二十五岁','二十五','我很好'])assert(!check(3,1,text).ok,text);
 assert.deepEqual([10,11,20,99,100].map(chineseNumber),['十','十一','二十','九十九','一百']);
 for(const text of ['星期一','今天是星期一','今天星期1'])assert(check(4,1,text).ok);
 assert(!check(4,1,'今天星期三').ok,'Training context is Monday, not the real calendar');
 for(const text of ['三月五号','今天是3月5号','今天是三月五日'])assert(check(5,1,text).ok);
 for(const text of ['三月六号','二月三十号','今天星期一'])assert(!check(5,1,text).ok,text);
 assert.equal(check(6,1,'我有两个哥哥').branch,'has-brother');
 assert.equal(check(6,1,'没有，我没有哥哥').branch,'no-brother');
 assert(!check(6,1,'我有姐姐').ok);
 for(const text of ['今天很冷','今天天气很热','今天下雨','今天是晴天','今天阴天'])assert(check(7,1,text).ok,text);
 for(const text of ['明天下雨','明天天气很好','明天很冷'])assert(check(7,2,text).ok,text);
 assert(!check(7,2,'今天天气很热').ok,'Tomorrow question must not accept explicit today answer');
 assert(!check(7,1,'我是老师').ok);
});
test('weather preview renders three turns, advances twice and ends with the already supplied thanks',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:'https://example.test/panda-voice-pilot.html?lesson=7&preview=1',pretendToBeVisual:true});
 const d=dom.window.document,el=id=>d.getElementById(id),clips=[];
 Object.assign(globalThis,{window:dom.window,document:d,localStorage:dom.window.localStorage,Audio:class{
  constructor(src){this.src=src;clips.push(this)}play(){return Promise.resolve()}pause(){}
 }});
 try{
  await import('../assets/panda-voice-pilot-ui.mjs?batch-weather');
  assert.equal(d.querySelectorAll('.bar').length,3);assert.equal(el('step').textContent,'1 из 3');
  el('type-toggle').click();el('answer').value='你好';el('send').click();await sleep(950);
  assert.equal(el('phrase').textContent,'今天天气怎么样？');assert.equal(el('step').textContent,'2 из 3');assert(!el('hear').hidden);assert(el('audio-note').hidden);
  el('answer').value='今天很冷';el('send').click();await sleep(950);
  assert.equal(el('phrase').textContent,'明天天气怎么样？');assert.equal(el('step').textContent,'3 из 3');
  el('answer').value='今天天气很热';el('send').click();assert.equal(el('phrase').textContent,'明天天气怎么样？');
  el('answer').value='明天下雨';el('send').click();await sleep(950);
  assert.equal(el('phrase').textContent,'谢谢！');assert(!el('completed').hidden);assert(!el('hear').hidden);assert(clips.at(-1).src.endsWith('thanks.mp3'));
  assert.notEqual(el('character').dataset.state,'talking','Pending play promise alone does not animate talking');
  assert(dom.window.localStorage.getItem('pg-panda-voice-lesson7-last'));
  assert.equal(dom.window.localStorage.getItem('pg-panda-voice-pilot-v1-last'),null);
 }finally{
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();for(const key of ['window','document','localStorage','Audio'])delete globalThis[key];
 }
});
test('calendar previews expose fictional conditions before any answer is given',async()=>{
 for(const [id,context] of [[4,'понедельник'],[5,'5 марта']]){
  const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:`https://example.test/panda-voice-pilot.html?lesson=${id}&preview=1`,pretendToBeVisual:true});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document});
  try{await import(`../assets/panda-voice-pilot-ui.mjs?calendar-${id}`);assert(document.getElementById('exercise-context').textContent.includes(context))}
  finally{dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();delete globalThis.window;delete globalThis.document}
 }
});

test('device-local greetings keep validation, voice coverage and topic boundaries consistent',async()=>{
 const {GREETINGS,greetingForHour,withLocalGreeting,adjacentConversation}=await import('../assets/panda-live-greetings.mjs');
 assert.deepEqual([0,4,5,10,11,12,13,17,18,23].map(h=>greetingForHour(h).answer),['晚上好','晚上好','早上好','早上好','中午好','中午好','下午好','下午好','晚上好','晚上好']);
 for(const hour of [-1,24,NaN])assert.throws(()=>greetingForHour(hour),RangeError);
 for(const hour of [8,12,15,20])for(const original of CONVERSATIONS){
  const modified=withLocalGreeting(original,new Date(2026,10,11,hour)),first=modified.lines[0];
  assert(verifyAnswerFor(modified.lines,0,first.answer).ok);
  assert(verifyAnswerFor(modified.lines,0,first.pinyin).ok);
  assert(verifyAnswerFor(modified.lines,0,'你好').ok);
  assert(!verifyAnswerFor(modified.lines,0,'我很好').ok);
  assert(!verifyAnswerFor(modified.lines,0,first.answer+first.answer).ok);
  assert.equal(original.lines[0].panda,'你好！','Do not mutate approved dialogue data');
  assert.deepEqual(missingConversationAudio(modified,lookupPilotAudio),[]);
  assert.equal(modified.lines[1],original.lines[1]);
 }
 assert.equal(adjacentConversation(CONVERSATIONS,7,1).id,1);
 assert.equal(adjacentConversation(CONVERSATIONS,1,-1).id,7);
 const draft={...CONVERSATIONS[0],id:8,status:'draft-test'};
 assert.equal(adjacentConversation([...CONVERSATIONS,draft],7,1).id,1);
 assert.equal(adjacentConversation([...CONVERSATIONS,draft],7,1,true).id,8);
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/panda-live-voice-v4/manifest.json',import.meta.url),'utf8'));
 for(const [index,clip] of manifest.clips.entries()){
  const path=lookupPilotAudio(GREETINGS[index].audioKey),bytes=fs.readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
  assert(Math.abs(ENVELOPES[path].levels.length*.025-clip.decodedSeconds)<.026);
 }
});
