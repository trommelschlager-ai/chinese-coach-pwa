import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_XIAOXIAO_V557_BATCH as batch,lookupApprovedPandaVoice as lookup,voiceNorm} from '../assets/panda-approved-voice-registry-v516.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-hsk2-preview-audio-v1.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../assets/panda-ai-voice-v557/manifest.json',import.meta.url)));
const pack=JSON.parse(fs.readFileSync(new URL('../assets/offline-pack.json',import.meta.url)));
test('All 64 user-supplied recordings retain exact manifest identity, byte hashes and offline support',()=>{
 assert.equal(batch.length,64);assert.equal(manifest.clips.length,64);
 assert.equal(new Set(batch.map(x=>voiceNorm(x.zh))).size,64);
 assert.equal(new Set(batch.map(x=>x.src)).size,64);
 for(const [i,x] of batch.entries()){
  const m=manifest.clips[i];
  assert.equal(m.id,i+1);
  assert.equal(x.zh,m.zh);assert.equal(x.sha256,m.sha256);
  assert.equal(x.src,'./assets/panda-ai-voice-v557/'+m.file);
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+x.src.slice(2),import.meta.url))).digest('hex'),m.sha256);
  assert.equal(lookup(x.zh).src,x.src);assert.equal(lookupPandaVoiceClip(x.zh).src,x.src);
  assert.equal(lookup(x.zh).source,'panda-xiaoxiao:user-upload-v557');
  assert(pack.files.includes(x.src));
 }
 assert(pack.version>=557);
});
test('Variable ages are not paired with arbitrary age recordings',()=>{
 for(const zh of ['你哥哥五岁！他喜欢做什么？','你妈妈55岁！她喜欢做什么？','你哥哥三十七岁！他喜欢做什么？'])assert(!lookup(zh),zh);
});
