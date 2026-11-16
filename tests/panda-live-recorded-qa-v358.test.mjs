import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {RECORDED_PANDA_QA,recordedPandaAnswer,recordedCourseScope} from '../assets/panda-recorded-qa-v358.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';

const env={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk2-user-voice/phrase-index-v332.js',import.meta.url),'utf8'),env);
const list=env.window.PandaUserVoiceIndexV332.clips;
const norm=s=>String(s||'').replace(/[。！？?!，,\s]/gu,'');
const catalog=new Set(list.map(x=>norm(x.zh)));

test('all newly connected Panda questions and answers are real uploaded MP3 clips',()=>{
 assert(RECORDED_PANDA_QA.length>=40);
 assert.equal(env.window.PandaUserVoiceIndexV332.segmentedUtterances,155);
 globalThis.window={PandaUserVoiceIndexV332:env.window.PandaUserVoiceIndexV332};
 try{
  for(const [question,pinyin,translation,answer,apy,aru,lesson,course='hsk1'] of RECORDED_PANDA_QA){
   assert(catalog.has(norm(question)),'No recorded question: '+question);
   assert(catalog.has(norm(answer)),'No recorded answer: '+answer);
   assert(pinyin&&translation&&apy&&aru,'Missing translation/pinyin for '+question);
   const result=recordedPandaAnswer(question,[1,2,3,4,5,6,7],{course});
   assert.equal(result.course,course);
   assert.equal(result.kind,'question');
   assert.equal(result.lesson,lesson);
   assert.equal(norm(result.reply.hanzi),norm(answer));
   assert(lookupPandaVoiceClip(question),'Question MP3 cannot be found: '+question);
   assert(lookupPandaVoiceClip(result.reply.hanzi),'Reply MP3 cannot be found: '+answer);
   assert(fs.statSync(new URL('../'+lookupPandaVoiceClip(answer).src.replace(/^\.\//,''),import.meta.url)).size>3000);
  }
 }finally{delete globalThis.window}
});

test('recorded beginner questions receive authored rather than generic Panda answers',()=>{
 const options={allowed:[1,2,3,4,5,6,7],topic:1,curriculum:[],date:new Date(2026,10,15)};
 for(const [question,want] of [['你会写汉字吗','会写一点'],
    ['你冷吗','我不冷'],['你有几支笔','我有一支笔'],['你累吗','我不累']]){
   const actual=answerLive(question,options);
   assert.equal(actual.kind,'question',question);
   assert.equal(norm(actual.reply.hanzi),norm(want),question);
 }
 const locked=recordedPandaAnswer('你有几支笔',[1]);
 assert.equal(locked.kind,'locked');
});

test('HSK1 weather and HSK2 My Day recorded questions never collide',()=>{
 globalThis.window={PandaUserVoiceIndexV332:env.window.PandaUserVoiceIndexV332};
 try{
 const day=RECORDED_PANDA_QA.filter(x=>x[7]==='hsk2-day');
 assert.equal(day.length,10,'Exactly ten user-recorded questions belong to HSK2 My Day');
 assert(day.every(x=>x[6]===1),'My Day is HSK2 topic 1, not HSK1 weather lesson 7');
 for(const [question,, ,answer] of day){
  assert.equal(recordedCourseScope(question),'hsk2-day');
  for(const unlocked of [[1],[1,2,3,4,5,6,7]]){
   const hsk1=recordedPandaAnswer(question,unlocked);
   assert.equal(hsk1.kind,'clarify',question);
   assert.match(hsk1.message,/HSK2.*Мой день/,'Should direct learner to the right course');
   assert(!hsk1.reply,'Do not leak HSK2 day answer into HSK1');
   const live=answerLive(question,{allowed:unlocked,topic:7,curriculum:[],date:new Date(2026,10,16)});
   assert.equal(live.kind,'clarify','HSK1 free chat must not confuse My Day with HSK1 Weather: '+question);
  }
  const scope=recordedPandaAnswer(question,[1],{course:'hsk2-day'});
  assert.equal(scope.kind,'question',question);
  assert.equal(scope.lesson,1);
  assert.equal(norm(scope.reply.hanzi),norm(answer));
  assert(lookupPandaVoiceClip(scope.reply.hanzi),'HSK2 answer should have recorded MP3');
  const viaDialogue=answerLive(question,{allowed:[1],topic:1,curriculum:[],course:'hsk2-day'});
  assert.equal(viaDialogue.kind,'question',question);
  assert.equal(norm(viaDialogue.reply.hanzi),norm(answer));
 }
 assert.equal(recordedCourseScope('你冷吗'),'hsk1');
 assert.equal(recordedPandaAnswer('你冷吗',[1,2,3,4,5,6,7]).kind,'question');
 assert.equal(recordedPandaAnswer('你冷吗',[1]).kind,'locked');
 assert.equal(recordedPandaAnswer('你冷吗',[1],{course:'hsk2-day'}),null);
 }finally{delete globalThis.window}
});
