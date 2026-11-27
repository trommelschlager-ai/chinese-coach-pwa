import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
import '../assets/panda-street-voice-v20261125.js';
const female=JSON.parse(fs.readFileSync('assets/panda-ai-voice-20261127/manifest.json')).clips;
const male=JSON.parse(fs.readFileSync('assets/panda-street-voice-v20261125/manifest.json')).clips.filter(x=>['54.mp3','55.mp3'].includes(x.file));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json'));
test('58 female and 2 male exact MP3 and offline integrity, no cross-role substitution',()=>{
 assert.equal(female.length,58);assert.equal(male.length,2);
 for(const x of female){
  assert.equal(lookupApprovedPandaVoice(x.zh)?.src,x.src,x.zh);
  const bytes=fs.readFileSync(x.src);assert.equal(bytes.length,x.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),x.sha256);
  assert(pack.files.includes(x.src));
 }
 for(const x of male){
  const src='./assets/panda-street-voice-v20261125/'+x.file;
  assert.equal(globalThis.PandaStreetVoiceV20261125.lookup(x.hanzi,'male')?.src,src);
  assert.equal(globalThis.PandaStreetVoiceV20261125.lookup(x.hanzi,'female'),null);
  const b=fs.readFileSync(src);assert.equal(b.length,x.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),x.sha256);
  assert(pack.files.includes(src));assert(!lookupApprovedPandaVoice(x.hanzi)?.src.includes('panda-street'));
 }
 assert.equal(lookupApprovedPandaVoice('不存在的测试句子。'),null);
 assert.equal(pack.version,571);
});
