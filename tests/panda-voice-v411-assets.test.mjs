import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_V411_VOICE} from '../assets/panda-voice-v411.mjs';
import {lookupPandaVoiceClip,lookupPilotAudio} from '../assets/panda-live-audio.mjs';

// SHA-256 hashes of the ten original user-supplied MP3 clips.
// This catches accidental swaps, mislabeled exports, and corrupt/truncated uploads.
const EXPECTED_SHA256=Object.freeze([
  '3387af68c491e038950a35eb519047eaa9b0b30f37104c6f0e16cbcd03aebd6a',
  '9f13eeb722395f538a3624a2c0fbef532a247777657918772b38833c0e3754b3',
  'c65c9af0dc259259c6ed2b2d331f7b2fe365b28d603f2647eed835ba77efb265',
  '75df86d23b94a5e9ecddafe20e3e9a55f924259d59b49f09ff3cce14af8d9f32',
  '71af20e32e0a5b0cb94e3e001e6db5713254ded772a479dbcd791a079b3996ef',
  '1f5caa478ac3be6df17367b84ee6dbccf500dd541022e1609720f9f845ce6a0d',
  '0e11a0ba8d9cebfa330ebd8ea9d5c8d430bf2d42567b159709037d3d3ff0acfd',
  '687600ba912818677c5082d2dae263c1a58c3e9a869b0df40f54dd7d4b06852f',
  '0aacfa6fc7c331855580579f543b0e5fa87dc3128af42d7a0c647913a2228465',
  '43b4c3c86fe99794ff60e58734a7c590682e6ad580f5e50df560884adb69358f'
]);
test('Nov 16 Mandarin voice: ten authentic, exact phrase-mapped clips',()=>{
 assert.equal(PANDA_V411_VOICE.length,EXPECTED_SHA256.length);
 const seen=new Set();
 for(const [i,item] of PANDA_V411_VOICE.entries()){
  assert(!seen.has(item.zh),'Duplicate phrase: '+item.zh);
  seen.add(item.zh);
  assert.equal(item.src,`./assets/panda-voice-clips-v411/p${156+i}.mp3`);
  const path=new URL('../'+item.src.slice(2),import.meta.url);
  assert(fs.existsSync(path),'Missing user audio: '+item.src);
  const bytes=fs.readFileSync(path);
  assert(bytes.length>3000,'Empty or truncated MP3: '+item.src);
  assert.equal(bytes.subarray(0,3).toString('ascii'),'ID3','Invalid MP3 header: '+item.src);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),EXPECTED_SHA256[i],'Wrong/modified source audio: '+item.src);
  const audio=lookupPandaVoiceClip(item.zh+'。');
  assert.equal(audio?.src,item.src);
  assert.equal(audio?.start,0);
  assert.equal(audio?.end,null);
  assert.equal(audio?.source,'user-luvvoice-nov16-cut');
  assert.equal(lookupPilotAudio(item.zh),item.src);
  assert(item.pinyin,'Missing written pinyin');
  assert(item.ru,'Missing Russian translation');
 }
});
test('Existing approved Panda clips remain available and no fake fallback',()=>{
 for(const phrase of ['你好！','你好吗？','很好！','你做什么工作？']){
  const audio=lookupPandaVoiceClip(phrase);
  assert(audio?.src&&audio.src.endsWith('.mp3'),phrase);
  assert.notEqual(audio.source,'user-luvvoice-nov16-cut',phrase);
 }
 assert.equal(lookupPandaVoiceClip('这不是录音的句子。'),null);
});
