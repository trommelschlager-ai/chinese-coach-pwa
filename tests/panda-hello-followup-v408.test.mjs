import test from 'node:test';
import assert from 'node:assert/strict';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const speak=(hanzi,opts={})=>answerLive(hanzi,{
 allowed:[1],topic:1,curriculum:[],date:new Date(2026,10,16,12),
 turn:0,profile:{},...opts
});

test('你好 is a greeting, never a premature 你呢 question',()=>{
 for(const raw of ['你好','你好！',' 你好。 ']){
  const a=speak(raw);
  assert.equal(a.kind,'question');
  assert.equal(a.spoken.hanzi,raw);
  assert.equal(a.spoken.pinyin,'Nǐ hǎo!');
  assert.equal(a.spoken.translation,'Привет!');
  assert.equal(a.reply.hanzi,'你好！');
  assert.equal(a.followup?.hanzi,'你好吗？');
  assert.equal(a.followup?.pinyin,'Nǐ hǎo ma?');
  assert.equal(a.followup?.ru,'Как дела?');
  assert.equal(a.followup?.lesson,1);
  assert.equal(a.followup?.isContextual,true,
   'The general topic picker must not replace this question with 你呢');
  assert.equal(a.followup?.audioKey,'你好吗');
  assert(lookupPandaVoiceClip(a.reply.hanzi),'Panda must use the actual recorded greeting');
  assert(lookupPandaVoiceClip(a.followup.hanzi),'Panda must use the actual recorded follow-up');
 }
});

test('你呢 remains valid Chinese for a contextual reciprocal question',()=>{
 const a=speak('你呢？');
 assert.equal(a.spoken?.known,true);
 assert.equal(a.spoken?.pinyin,'Nǐ ne?');
 assert.notEqual(a.reply?.hanzi,'你好！');
 assert.equal(speak('你好',{allowed:[]}).followup?.hanzi,undefined,
  'Do not offer a lesson question from a locked chapter');
});

test('speech recognition of 你好 in Non-Stop produces 你好 then 你好吗, not 你呢',async()=>{
 const dom=await liveDOM(1);
 try{
  const {el,sessions,clips,w}=dom;
  el('mode-nonstop').click();
  el('mic').click();el('speech-allow').click();
  assert.equal(sessions.length,1);
  sessions[0].emit('你好',.96);
  const bridge=w.PandaApprovedBridge337;
  assert.equal(el('phrase').textContent,'你好！');
  assert.equal(bridge.snapshot().speechSignal?.kind,'text-only');
  assert.equal(bridge.snapshot().speechSignal?.toneVerified,false);
  assert.equal(bridge.snapshot().history.at(-1)?.hanzi,'你好！');
  const greetingAudio=clips.at(-1);
  assert(greetingAudio?.src?.endsWith('/p039.mp3')||
    greetingAudio?.src?.endsWith('/hello.mp3')||
    greetingAudio?.src?.includes('panda-live-voice-v2/hello.mp3'),
    'Only the verified 你好 MP3 is allowed for greeting');
  greetingAudio?.onended?.();
  await new Promise(resolve=>setTimeout(resolve,4850));
  assert.equal(el('phrase').textContent,'你好吗？',
   'Ask the first real social question, not a contextless 你呢');
  assert.equal(bridge.snapshot().current.pinyin,'Nǐ hǎo ma?');
  assert.equal(bridge.snapshot().audioAvailable,true);
  assert.equal(bridge.snapshot().history.at(-1)?.hanzi,'你好吗？');
 }finally{dom.close()}
});
