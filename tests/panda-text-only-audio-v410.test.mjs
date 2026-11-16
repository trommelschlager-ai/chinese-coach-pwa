import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const example=answerLive('今天天气怎么样',{allowed:[1,7],topic:7,curriculum:[]});
test('reviewed weather answer now uses only its newly recorded v411 MP3',()=>{
 assert.equal(example.reply?.hanzi,'今天很冷。');
 assert.equal(example.reply?.pinyin,'Jīntiān hěn lěng.');
 assert.equal(example.reply?.ru,'Сегодня холодно.');
 const clip=lookupPandaVoiceClip(example.reply.hanzi);
 assert.equal(clip?.src,'./assets/panda-voice-clips-v411/p158.mp3');
 assert.equal(clip?.source,'user-luvvoice-nov16-cut');
 assert(fs.existsSync(new URL('../'+clip.src,import.meta.url)),'Exact p158 MP3 must exist');
 assert(lookupPandaVoiceClip('你好！'),'Already recorded greeting must still have exact audio');
});

test('Non-Stop shows unrecorded replies as text instead of an autoplay error',async()=>{
 const screen=await liveDOM(1,{completed:['weather']});
 try{
  const {el,send,clips,w}=screen;
  el('mode-nonstop').click();
  const before=clips.length;
  // This sentence has no recording: it must remain readable but never fake playback.
  assert.equal(lookupPandaVoiceClip('今天不热。'),null);
  send('今天热吗');
  assert.equal(el('phrase').textContent,'今天不热。');
  assert.equal(el('pinyin').textContent,'Jīntiān bù rè.');
  assert.equal(clips.length,before,'Must not create a bogus player for an unrecorded reply');
  assert.equal(el('hear').disabled,true);
  assert.equal(el('audio-note').hidden,false,'Learner must still be told the recording is missing');
  assert(!/Для этой точной фразы пока нет загруженной MP3-записи/.test(el('status').textContent),
   'Text-only response is expected content, not an autoplay playback failure');
  assert(w.PandaApprovedBridge337.snapshot().history.some(h=>h.hanzi==='今天不热。'));

  // The newly supplied, verified phrase now has a real dedicated MP3.
  send('今天天气怎么样');
  assert.equal(el('phrase').textContent,'今天很冷。');
  assert.equal(el('pinyin').textContent,'Jīntiān hěn lěng.');
  assert(clips.length>before,'Exact p158 MP3 should autoplay');
  assert.equal(el('hear').disabled,false);

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
