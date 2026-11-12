import {liveDOM} from './panda-live-dom-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {selectConversation,missingConversationAudio} from '../assets/panda-live-lessons.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {verifyAnswerFor} from '../assets/panda-voice-pilot-engine.mjs';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('voice-complete second conversation opens normally without missing recordings',()=>{
 assert.equal(selectConversation('').id,1);
 assert.equal(selectConversation('?lesson=2').id,2);
 assert.equal(selectConversation('?lesson=2&preview=0').id,2);
 assert.equal(selectConversation('?lesson=999&preview=1').id,1);
 assert.equal(selectConversation('?lesson=3').id,3);
 const draft=selectConversation('?lesson=2&preview=1');assert.equal(draft.id,2);
 assert.deepEqual(missingConversationAudio(draft,lookupPilotAudio),[]);
 for(const text of ['我是老师','是，我是老师。','wǒ shì lǎoshī'])assert.equal(verifyAnswerFor(draft.lines,1,text).branch,'teacher');
 for(const text of ['不是，我是学生。','我不是老师，我是学生','我是学生','bú shì, wǒ shì xuésheng'])assert.equal(verifyAnswerFor(draft.lines,1,text).branch,'student');
 for(const text of ['你好','我很好','我是','不是','我是老师吗','我不是老师','我是老师我是学生'])assert(!verifyAnswerFor(draft.lines,1,text).ok,text);
});
test('second conversation keeps both roles, context and exact audio clips',async()=>{
 for(const [answer,expected] of [['我是老师','我也是老师。'],['不是，我是学生','我是老师。']]){const f=await liveDOM(2),{el,send}=f;try{
  assert.equal(el('lesson-select').value,'2');assert.equal(el('back-link').getAttribute('href'),'./hsk1-second-v203.html');send('你好');assert.equal(el('phrase').textContent,'你是老师吗？');send('我很好');assert.equal(el('phrase').textContent,'你是老师吗？');send(answer);assert.equal(el('phrase').textContent,expected);assert(el('audio-note').hidden);assert(f.w.localStorage.getItem('pg-panda-voice-lesson2-last'));assert.equal(f.w.localStorage.getItem('pg-panda-voice-pilot-v1-last'),null);
 }finally{f.close()}}
});
