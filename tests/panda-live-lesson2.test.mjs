import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {selectConversation,missingConversationAudio} from '../assets/panda-live-lessons.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {verifyAnswerFor} from '../assets/panda-voice-pilot-engine.mjs';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('draft is not exposed by an ordinary lesson URL; explicit preview has three missing clips',()=>{
 assert.equal(selectConversation('').id,1);
 assert.equal(selectConversation('?lesson=2').id,1);
 assert.equal(selectConversation('?lesson=2&preview=0').id,1);
 assert.equal(selectConversation('?lesson=999&preview=1').id,1);
 assert.equal(selectConversation('?lesson=3').id,1,'Drafts remain hidden without explicit preview');
 const draft=selectConversation('?lesson=2&preview=1');assert.equal(draft.id,2);
 assert.deepEqual(missingConversationAudio(draft,lookupPilotAudio),['你是老师吗？','我也是老师。','我是老师。']);
 for(const text of ['我是老师','是，我是老师。','wǒ shì lǎoshī'])assert.equal(verifyAnswerFor(draft.lines,1,text).branch,'teacher');
 for(const text of ['不是，我是学生。','我不是老师，我是学生','我是学生','bú shì, wǒ shì xuésheng'])assert.equal(verifyAnswerFor(draft.lines,1,text).branch,'student');
 for(const text of ['你好','我很好','我是','不是','我是老师吗','我不是老师','我是老师我是学生'])assert(!verifyAnswerFor(draft.lines,1,text).ok,text);
});
test('draft supports both roles, rejects unrelated replies, and never pretends missing audio is speaking',async()=>{
 for(const [answer,expected,run] of [['我是老师','我也是老师。',1],['不是，我是学生','我是老师。',2]]){
  const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:'https://example.test/panda-voice-pilot.html?lesson=2&preview=1',pretendToBeVisual:true});
  const d=dom.window.document,el=id=>d.getElementById(id);
  class Speech{start(){this.onstart?.()}abort(){}stop(){this.onend?.()}}
  dom.window.SpeechRecognition=Speech;
  Object.assign(globalThis,{window:dom.window,document:d,localStorage:dom.window.localStorage});
  try{
   await import(`../assets/panda-voice-pilot-ui.mjs?l2-test=${run}`);
   assert(el('pilot-note').textContent.includes('не хватает 3 записей'));
   assert.equal(el('lesson-tag').textContent,'Урок 2 · Диалог');
   assert.equal(el('back-link').getAttribute('href'),'./hsk1-second-v203.html');
   assert(!el('hear').hidden,'Existing hello can be reused');
   el('type-toggle').click();el('answer').value='你好';el('send').click();await pause(950);
   assert.equal(el('phrase').textContent,'你是老师吗？');assert(el('hear').hidden);assert(!el('audio-note').hidden);
   el('answer').value='我很好';el('send').click();assert.equal(el('phrase').textContent,'你是老师吗？');
   el('answer').value=answer;el('send').click();await pause(950);
   assert.equal(el('phrase').textContent,expected);assert(!el('completed').hidden);
   assert(el('hear').hidden);assert(!el('audio-note').hidden);
   assert.notEqual(el('character').dataset.state,'talking');
   assert(dom.window.localStorage.getItem('pg-panda-voice-lesson2-last'));
   assert.equal(dom.window.localStorage.getItem('pg-panda-voice-pilot-v1-last'),null,'Preview does not overwrite lesson one completion');
  }finally{
   dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();for(const key of ['window','document','localStorage'])delete globalThis[key];
  }
 }
});
