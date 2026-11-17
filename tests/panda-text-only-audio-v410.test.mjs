import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const example=answerLive('今天天气怎么样',{allowed:[1,7],topic:7,curriculum:[]});
test('reviewed weather answer uses the genuine v411 recording',()=>{
 assert.equal(example.reply?.hanzi,'今天很冷。');
 assert.equal(example.reply?.pinyin,'Jīntiān hěn lěng.');
 assert.equal(example.reply?.ru,'Сегодня холодно.');
 assert.equal(lookupPandaVoiceClip(example.reply.hanzi)?.src,'./assets/panda-voice-clips-v411/p158.mp3');
 assert.equal(lookupPandaVoiceClip('这句话没有录音'),null,'Never invent audio for unknown sentences');
 assert(lookupPandaVoiceClip('你好！'),'Already recorded greeting must still have exact audio');
});

test('Non-Stop autoplays exact newly recorded replies without fabricated audio',async()=>{
 const screen=await liveDOM(1,{completed:['weather']});
 try{
  const {el,send,clips,w}=screen;
  el('mode-nonstop').click();
  const before=clips.length;
  send('今天天气怎么样');
  assert.equal(el('phrase').textContent,'今天很冷。');
  assert.equal(el('pinyin').textContent,'Jīntiān hěn lěng.');
  assert.equal(clips.length,before+1,'Exactly one real MP3 should play for the v411 recorded weather reply');
  assert(clips.at(-1).src?.includes('p158.mp3')||clips.at(-1).src?.endsWith('p158.mp3'),'Play p158, not a substitute phrase');
  assert.equal(el('hear').disabled,false);
  assert.equal(el('audio-note').hidden,true,'Do not claim the recorded clip is missing');
  assert(!/Для этой точной фразы пока нет загруженной MP3-записи/.test(el('status').textContent),
   'Exact v411 audio should not trigger missing-audio warning');
  assert(w.PandaApprovedBridge337.snapshot().history.some(h=>h.hanzi==='今天很冷。'));

  send('你好');
  assert.equal(el('phrase').textContent,'你好！');
  assert(clips.length>before,'Exact approved MP3 should still autoplay');
  assert.equal(el('hear').disabled,false);
 }finally{screen.close()}
});

test('safe autoplay gate is applied centrally to every Panda response',()=>{
 const source=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(source.includes("if(autoplay&&(lookupPandaVoiceClip(line.hanzi||line.panda)||lookupPandaVoiceClip(line.audioKey)))play()"));
});
