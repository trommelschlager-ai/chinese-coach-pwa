import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_USER_V563_BATCH as batch,lookupApprovedPandaVoice as lookup} from '../assets/panda-approved-voice-registry-v516.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-hsk2-preview-audio-v1.mjs';
const pack=JSON.parse(readFileSync(new URL('../assets/offline-pack.json',import.meta.url)));
test('12 exact user supplied MP3s, byte integrity, offline and live registry',()=>{assert.equal(batch.length,12);for(const x of batch){const b=readFileSync(new URL('../'+x.src.slice(2),import.meta.url));assert.equal(b.length,x.bytes,x.id);assert.equal(createHash('sha256').update(b).digest('hex'),x.sha256,x.id);assert.equal(lookup(x.zh)?.src,x.src,x.id);assert.equal(lookupPandaVoiceClip(x.zh)?.src,x.src,x.id);assert(pack.files.includes(x.src),x.id);}});
