import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const professions=['老师','学生','医生','工程师','护士','老板','经理','司机','厨师','服务员','警察','销售员','工人','翻译','演员','商人','程序员','设计师'];
const expected=job=>job==='老师'?'是，我是老师。':'不是，我是老师。';
const expectedClip=job=>job==='老师'?'p083.mp3':'p085.mp3';

test('All 18 profession questions without 吗 are understood and use existing approved voice',()=>{
 for(const job of professions){
  for(const input of ['你是'+job,'你是'+job+'？','你是'+job+'吗？','你是不是'+job+'？']){
   const result=respondToNaturalStatement(input);
   assert(result,'Not understood: '+input);
   assert.equal(result.kind,'question',input);
   assert.equal(result.domain,'work',input);
   assert.equal(result.spoken.hanzi,input);
   assert.equal(result.spoken.toneVerified,false,'ASR text does not verify tones');
   assert(result.spoken.pinyin.startsWith('Nǐ '),input);
   assert.equal(result.spoken.pinyin.includes(' ma?'),input.includes('吗'),input);
   assert.equal(result.reply.hanzi,expected(job),input);
   const clip=lookupApprovedPandaVoice(result.reply.hanzi);
   assert(clip?.src.endsWith('/'+expectedClip(job)),input+' must play a reviewed Panda AI recording');
  }
 }
});
test('Teacher and doctor are distinct; 我是医生 remains a learner statement, not a question',()=>{
 const teacher=respondToNaturalStatement('你是老师');
 const doctor=respondToNaturalStatement('你是医生');
 const self=respondToNaturalStatement('我是医生');
 assert.equal(teacher.reply.hanzi,'是，我是老师。');
 assert.equal(doctor.reply.hanzi,'不是，我是老师。');
 assert.equal(self.kind,'statement');
 assert.equal(self.reply.hanzi,'你是医生！你在哪儿工作？');
 assert(lookupApprovedPandaVoice(self.reply.hanzi)?.src.endsWith('/PA-002.mp3'));
 assert.equal(respondToNaturalStatement('你是火星人'),null,'Unsupported professions must not be made up');
});
test('Active Android Non-Stop Panda responds to short profession questions and plays exact MP3',async()=>{
 const f=await liveDOM(1,{active:true});
 try{
  f.w.PandaApprovedBridge337.setMode('nonstop');
  for(const job of ['医生','工程师','老师','护士']){
   f.send('你是'+job);
   const history=f.w.PandaApprovedBridge337.snapshot().history;
   assert.equal(history.at(-2).hanzi,'你是'+job,job);
   assert.equal(history.at(-1).hanzi,expected(job),job);
   assert(f.clips.at(-1)?.src.endsWith('/'+expectedClip(job)),job+' missing exact approved MP3');
  }
  assert.equal(f.el('speech-recovery').hidden,true);
 }finally{f.close()}
});
test('Android speech-to-text question without 吗 follows question path; no false microphone failure',async()=>{
 const f=await liveDOM(1,{active:true});
 try{
  f.w.PandaApprovedBridge337.setMode('nonstop');
  f.el('mic').click();
  f.el('speech-allow').click();
  assert.equal(f.sessions.length,1);
  f.sessions[0].emit('你是医生',.95);
  const history=f.w.PandaApprovedBridge337.snapshot().history;
  assert.equal(history.at(-2).hanzi,'你是医生');
  assert.equal(history.at(-1).hanzi,'不是，我是老师。');
  assert(f.clips.some(x=>x.src.endsWith('/p085.mp3')),'Voice must be recorded approved Panda AI speech');
  assert.equal(f.el('speech-recovery').hidden,true);
  assert.equal(f.el('mic').getAttribute('aria-pressed'),'false');
  assert.equal(f.w.PandaApprovedBridge337.snapshot().speechSignal.toneVerified,false);
 }finally{f.close()}
});
