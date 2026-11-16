import test from 'node:test';
import assert from 'node:assert/strict';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const firstPrompt={hanzi:'你好吗？',pinyin:'Nǐ hǎo ma?',ru:'Как дела?',lesson:1,
 accepted:['我很好','我很好你呢']};
const answer=raw=>answerLive(raw,{allowed:[1],topic:1,prompt:firstPrompt,curriculum:[],
 date:new Date(2026,10,16,12),turn:1,profile:{}});

test('我很好 after 你好吗 is accepted and Panda says 很好, not 谢谢 or 你呢',()=>{
 for(const raw of ['我很好','我很好。',' 我很好！ ']){
  const result=answer(raw);
  assert.equal(result.kind,'answer');
  assert.equal(result.spoken.hanzi,raw.trim());
  assert.equal(result.spoken.pinyin,'Wǒ hěn hǎo.');
  assert.equal(result.spoken.translation,'У меня всё хорошо.');
  assert.equal(result.reply.hanzi,'很好！');
  assert.equal(result.reply.pinyin,'Hěn hǎo!');
  assert.equal(result.followup,null,'Do not prompt the learner to answer twice');
  assert(lookupPandaVoiceClip(result.reply.hanzi),
   'Use the existing verified Panda MP3 for 很好');
 }
});

test('Only an explicit 我很好，你呢? is answered by the Panda about herself',()=>{
 const a=answer('我很好，你呢？');
 assert.equal(a.kind,'answer');
 assert.equal(a.spoken.pinyin,'Wǒ hěn hǎo, nǐ ne?');
 assert.equal(a.reply.hanzi,'我也很好，谢谢！');
 assert.equal(a.reply.pinyin,'Wǒ yě hěn hǎo, xièxie!');
 assert(lookupPandaVoiceClip(a.reply.hanzi),'Exact existing MP3 must exist');
 assert.equal(a.followup,null);
});

test('Unrelated or locked content never inherits the wellbeing answer',()=>{
 assert.equal(answerLive('你好',{allowed:[1],topic:1,curriculum:[]}).reply.hanzi,'你好！');
 assert.notEqual(answerLive('我很好',{allowed:[1],topic:1,curriculum:[],prompt:null}).reply?.hanzi,'我也很好，谢谢！');
 assert.notEqual(answerLive('我不好',{allowed:[1],topic:1,curriculum:[],prompt:firstPrompt}).reply?.hanzi,'很好！',
  'Do not praise an unhappy response with 很好');
 assert.notEqual(answerLive('我很好',{allowed:[],topic:1,curriculum:[],prompt:firstPrompt}).reply?.hanzi,'很好！');
});

test('Android-style microphone conversation: 你好 → 你好吗 → 我很好 → 很好, no 你呢',async()=>{
 const page=await liveDOM(1);
 try{
  const {el,sessions,w}=page;
  el('mode-nonstop').click();
  el('mic').click();el('speech-allow').click();
  sessions[0].emit('你好',.96);
  assert.equal(el('phrase').textContent,'你好！');
  const firstAudio=page.clips.at(-1);
  assert(firstAudio,'Greeting uses a recorded Panda MP3');
  firstAudio.onended?.(); // Mock browser must signal that the first MP3 ended.
  await new Promise(resolve=>setTimeout(resolve,4850));
  assert.equal(el('phrase').textContent,'你好吗？');
  el('mic').click();
  assert.equal(sessions.length,2);
  sessions[1].emit('我很好',.96);
  assert.equal(el('phrase').textContent,'很好！');
  const snap=w.PandaApprovedBridge337.snapshot();
  assert.equal(snap.history.at(-2)?.hanzi,'我很好');
  assert.equal(snap.history.at(-1)?.hanzi,'很好！');
  assert.equal(snap.history.at(-1)?.ru,'Отлично!');
  assert.equal(snap.speechSignal?.toneVerified,false,'Speech-to-text cannot grade tones');
  await new Promise(resolve=>setTimeout(resolve,4750));
  assert.equal(el('phrase').textContent,'很好！','Do not auto-ask 你呢 after the student has already answered');
 }finally{page.close()}
});
