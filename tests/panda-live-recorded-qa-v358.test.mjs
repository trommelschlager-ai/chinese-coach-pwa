import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {RECORDED_PANDA_QA,recordedPandaAnswer} from '../assets/panda-recorded-qa-v358.mjs';
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
  for(const [question,pinyin,translation,answer,apy,aru,lesson] of RECORDED_PANDA_QA){
   assert(catalog.has(norm(question)),'No recorded question: '+question);
   assert(catalog.has(norm(answer)),'No recorded answer: '+answer);
   assert(pinyin&&translation&&apy&&aru,'Missing translation/pinyin for '+question);
   const result=recordedPandaAnswer(question,[1,2,3,4,5,6,7]);
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
    ['你早上做什么','我早上吃早饭'],['你有几支笔','我有一支笔'],['你累吗','我不累']]){
   const actual=answerLive(question,options);
   assert.equal(actual.kind,'question',question);
   assert.equal(norm(actual.reply.hanzi),norm(want),question);
 }
 const locked=recordedPandaAnswer('你有几支笔',[1]);
 assert.equal(locked.kind,'locked');
});
