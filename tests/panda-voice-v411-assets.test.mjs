import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PANDA_V411_VOICE} from '../assets/panda-voice-v411.mjs';
import {lookupPandaVoiceClip,lookupPilotAudio} from '../assets/panda-live-audio.mjs';

const normalize=text=>String(text||'').replace(/[。！？?!，,\s]/gu,'');
test('November 16 audio registration uses ten exact one-file-per-phrase MP3s',()=>{
 assert.equal(PANDA_V411_VOICE.length,10);
 const seen=new Set();
 for(const [i,item] of PANDA_V411_VOICE.entries()){
  assert(!seen.has(item.zh),'Duplicate phrase: '+item.zh);
  seen.add(item.zh);
  assert.equal(item.src,`./assets/panda-voice-clips-v411/p${156+i}.mp3`);
  const path=new URL('../'+item.src.slice(2),import.meta.url);
  assert(fs.existsSync(path),'Missing user audio: '+item.src);
  assert(fs.statSync(path).size>3000,'Empty/broken MP3: '+item.src);
  const audio=lookupPandaVoiceClip(item.zh+'。');
  assert.equal(audio?.src,item.src);
  assert.equal(audio?.start,0);
  assert.equal(audio?.end,null);
  assert.equal(audio?.source,'user-luvvoice-nov16-cut');
  assert.equal(lookupPilotAudio(item.zh),item.src);
  assert(item.pinyin,'Missing verified written pinyin');
  assert(item.ru,'Missing Russian translation');
 }
});

test('Other reviewed Panda voice clips remain available',()=>{
 for(const text of ['你好！','你好吗？','很好！','你做什么工作？']){
  const audio=lookupPandaVoiceClip(text);
  assert(audio?.src&&audio.src.endsWith('.mp3'),text);
  assert.notEqual(audio.source,'user-luvvoice-nov16-cut',text);
 }
 assert.equal(lookupPandaVoiceClip('这不是录音的句子。'),null);
});
