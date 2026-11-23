import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {
 APPROVED_STREET_MALE_MP3,STREET_APPROVED_MALE_VOICE_ID,
 lookupApprovedStreetMaleMp3
} from '../assets/panda-street-approved-male-mp3-v1.mjs';
const queue=JSON.parse(fs.readFileSync('assets/panda-street-male-voice-queue-v1.json','utf8'));
test('only the three native-approved original MP3 files are allowed',()=>{
 assert.equal(APPROVED_STREET_MALE_MP3.length,3);
 for(const item of APPROVED_STREET_MALE_MP3){
  const info=queue.phrases.find(x=>x.hanzi===item.hanzi);
  assert(info,'No review manifest for '+item.hanzi);
  assert.equal(item.voiceId,STREET_APPROVED_MALE_VOICE_ID);
  assert.equal(item.nativeSpeakerChecked,true);
  assert.equal(item.status,'approved');
  const buf=fs.readFileSync(item.src);
  assert.equal(buf.length,info.mp3Bytes);
  assert.equal(createHash('sha256').update(buf).digest('hex'),info.mp3Sha256);
  assert.deepEqual(lookupApprovedStreetMaleMp3(item.hanzi)?.src,'./'+item.src);
 }
 assert.equal(lookupApprovedStreetMaleMp3('你好！'),null);
});
test('public Street page uses only exact male registry and retains original Luvvoice',()=>{
 const html=fs.readFileSync('panda-street-ai-preview.html','utf8');
 assert(html.includes("const MALE_VOICE='./assets/panda-street-lesson1-luvvoice.m4a'"));
 assert(html.includes("import('./assets/panda-street-approved-male-mp3-v1.mjs?v=1')"));
 assert(html.includes('lookupApprovedStreetMaleMp3(text)'));
 assert(html.includes('playApprovedStreetMaleClip(clip,token)'));
 assert(html.includes('Фраза показана текстом'));
 assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(html));
});
test('new MP3s are included in SW and offline pack v537',()=>{
 const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
 const sw=fs.readFileSync('sw.js','utf8');
 assert.equal(pack.version,537);
 assert(sw.includes('chinese-coach-pwa-v537-street-approved-male-three'));
 for(const url of ['./assets/panda-street-approved-male-mp3-v1.mjs?v=1',
  './assets/panda-street-male-voice-v1/01.mp3',
  './assets/panda-street-male-voice-v1/02.mp3',
  './assets/panda-street-male-voice-v1/03.mp3']){
  assert(pack.files.includes(url),'Pack missing '+url);
  assert(sw.includes(url),'Worker missing '+url);
 }
});
