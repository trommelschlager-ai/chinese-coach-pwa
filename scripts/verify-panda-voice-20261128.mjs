import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {lookupApprovedPandaVoice,voiceNorm} from '../assets/panda-approved-voice-registry-v516.mjs';
import '../assets/panda-street-voice-v20261125.js';
const manifest=JSON.parse(fs.readFileSync('assets/panda-ai-voice-20261128/manifest.json'));
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json'));
test('86 exact owner-supplied female clips, valid hashes, and existing approved voice precedence',()=>{
 assert.equal(manifest.clips.length,86);
 assert.equal(new Set(manifest.clips.map(x=>voiceNorm(x.zh))).size,86);
 for(const x of manifest.clips){
  const b=fs.readFileSync(x.src);assert.equal(b.length,x.bytes);
  assert.equal(createHash('sha256').update(b).digest('hex'),x.sha256);
  const clip=lookupApprovedPandaVoice(x.zh);
  assert(clip?.src.startsWith('./assets/'),x.zh);
  assert(!clip.src.includes('panda-street'),x.zh);
  assert(fs.existsSync(clip.src),clip.src);
  assert(pack.files.includes(x.src),x.src);
 }
 for(const zh of ['谢谢你！你喜欢这里的风景吗？','谢谢你！你喜欢熊猫吗？','谢谢你！我很开心！你叫什么名字？','你睡觉吗？','你很漂亮。','你很可爱。','今天。']){
  const item=manifest.clips.find(x=>voiceNorm(x.zh)===voiceNorm(zh));
  assert.equal(lookupApprovedPandaVoice(zh)?.src,item.src,zh);
  assert(!globalThis.PandaStreetVoiceV20261125.lookup(zh,'male')?.src.includes('panda-ai-voice-20261128'));
 }
 assert.equal(lookupApprovedPandaVoice('没有录过的测试句子。'),null);
});
