import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {
 APPROVED_STREET_MALE_MP3, STREET_APPROVED_MALE_VOICE_ID,
 lookupApprovedStreetMaleMp3, normalizeStreetMalePhrase
} from '../assets/panda-street-approved-male-mp3-v1.mjs';

const read=(path)=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('panda-street-ai-preview.html');
const queue=JSON.parse(read('assets/panda-street-male-voice-queue-v1.json'));
const base={
 hanzi:'我有点忙。',
 src:'assets/panda-street-male-voice-v1/01.mp3',
 voiceId:STREET_APPROVED_MALE_VOICE_ID,
 reviewRef:'reviewed:street-luvvoice-20261123-01',
 status:'approved',
 nativeSpeakerChecked:true
};
test('three native-approved MP3s are installed and exactly match the owner-reviewed audio',()=>{
 assert.equal(APPROVED_STREET_MALE_MP3.length,3);
 assert.equal(queue.phrases.filter(x=>x.priority==='P0'&&x.status==='native-speaker-approved-active-in-pr').length,3);
 assert.equal(queue.phrases.filter(x=>x.priority==='P0'&&x.status==='awaiting-approved-male-luvvoice').length,3);
 for(const item of APPROVED_STREET_MALE_MP3){
   const record=queue.phrases.find(row=>row.hanzi===item.hanzi);
   assert.ok(record,'missing record for '+item.hanzi);
   const bytes=fs.readFileSync(new URL('../'+item.src,import.meta.url));
   assert.equal(bytes.length,record.mp3Bytes);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),record.mp3Sha256);
   assert.equal(item.voiceId,STREET_APPROVED_MALE_VOICE_ID);
   assert.equal(item.status,'approved');
   assert.equal(item.nativeSpeakerChecked,true);
   assert.deepEqual(lookupApprovedStreetMaleMp3(item.hanzi),{
     src:'./'+item.src,hanzi:item.hanzi,voiceId:STREET_APPROVED_MALE_VOICE_ID
   });
 }
 assert.equal(lookupApprovedStreetMaleMp3('你好！'),null,'Unapproved 04 must remain silent');
});
test('registry resolves ONLY independently reviewed male Luvvoice MP3s',()=>{
 assert.deepEqual(lookupApprovedStreetMaleMp3(' 我有点忙！ ',[base]),{
  src:'./assets/panda-street-male-voice-v1/01.mp3',
  hanzi:'我有点忙。',
  voiceId:STREET_APPROVED_MALE_VOICE_ID
 });
 assert.equal(normalizeStreetMalePhrase('你  好！'),'你好');
 for(const patch of [
  {voiceId:'female-Xiaoxiao'},
  {voiceId:'another-male'},
  {status:'pending-review'},
  {nativeSpeakerChecked:false},
  {reviewRef:'unreviewed:01'},
  {reviewRef:'reviewed:street-luvvoice-20261123-07'},
  {src:'https://external-provider.example/sample.mp3'},
  {src:'assets/panda-street-male-voice-v1/99.mp3'},
  {src:'../hidden/01.mp3'},
  {src:'assets/panda-street-male-voice-v1/01.m4a'}
 ]){
  assert.equal(lookupApprovedStreetMaleMp3('我有点忙',[{...base,...patch}]),null,
   'unapproved audio was accepted: '+JSON.stringify(patch));
 }
 assert.equal(lookupApprovedStreetMaleMp3('你好',[base]),null);
});
test('Street page keeps approved v1 voice, supports new MP3 and never uses system/female TTS',()=>{
 assert.match(html,/const MALE_VOICE='\.\/assets\/panda-street-lesson1-luvvoice\.m4a'/);
 assert.match(html,/import\('\.\/assets\/panda-street-approved-male-mp3-v1\.mjs\?v=1'\)/);
 assert.match(html,/lookupApprovedStreetMaleMp3\(text\)/);
 assert.match(html,/playApprovedStreetMaleClip\(clip,token\)/);
 assert.match(html,/streetFaceRig\?\.setState\('talking'\)/);
 assert.match(html,/Фраза показана текстом · мужская запись для неё пока не загружена/);
 assert.doesNotMatch(html,/speechSynthesis|SpeechSynthesisUtterance/);
});
