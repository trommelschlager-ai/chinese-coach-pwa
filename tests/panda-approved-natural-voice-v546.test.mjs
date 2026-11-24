import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PANDA_AI_NATURAL_V546} from '../assets/panda-ai-natural-voice-batch01-v546.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v544.mjs';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const manifest=JSON.parse(source('../assets/offline-pack.json'));
const queue=JSON.parse(source('../docs/panda-ai-voice-queue-v545.json'));
const normalize=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');

test('ten approved original MP3 blobs match exact SHA256 and Chinese text registry',()=>{
 assert.equal(PANDA_AI_NATURAL_V546.length,10);
 const texts=new Set(),paths=new Set();
 for(const item of PANDA_AI_NATURAL_V546){
  assert(/^PA-0(0[1-9]|10)$/.test(item.id),item.id);
  assert(!texts.has(normalize(item.zh)),'duplicate Mandarin answer');
  assert(!paths.has(item.src),'duplicate file path');
  texts.add(normalize(item.zh));paths.add(item.src);
  const path='../'+item.src.replace(/^\.\//,'');
  const file=readFileSync(new URL(path,import.meta.url));
  assert(file.length>=10000,'truncated audio '+item.id);
  assert.equal(file.subarray(0,3).toString('ascii'),'ID3',item.id);
  assert.equal(createHash('sha256').update(file).digest('hex'),item.sha256,item.id);
  const clip=lookupApprovedPandaVoice(item.zh);
  assert(clip,'no exact lookup for '+item.id);
  assert.equal(clip.src,item.src,item.id);
  assert.match(clip.source,/panda-approved-luvvoice:natural-v546/);
  const task=queue.tracks.find(t=>t.id===item.id);
  assert(task&&task.reply===item.zh,'wrong user lesson task for '+item.id);
  assert.equal(task.audio_file,item.src);
  assert.equal(task.audio_sha256,item.sha256);
  assert.equal(task.voice_approved,true);
  assert.equal(task.audio_status==='approved_and_integrated'||task.audio_status==='approved_uploaded_awaiting_android_qa',true);
  assert(manifest.files.includes(item.src),'offline missing audio '+item.id);
 }
});

test('recorded Panda replies exactly match all ten natural statements including followups',()=>{
 for(const t of queue.tracks){
  const reply=respondToNaturalStatement(t.learner,{awaiting:t.awaiting});
  assert(reply,'Panda failed to understand '+t.id);
  assert.equal(normalize(reply.reply.hanzi),normalize(t.reply),t.id);
  assert.equal(lookupApprovedPandaVoice(reply.reply.hanzi)?.src,t.audio_file,t.id);
  assert.equal(reply.spoken.toneVerified,false,'No ASR acoustic tone grade in '+t.id);
 }
});

test('approved Panda AI audio is wired to current entrypoints and new PWA cache',()=>{
 const html=source('../panda-voice-pilot.html');
 const sw=source('../sw.js');
 const core=source('../assets/panda-hsk2-preview-core-v1.mjs');
 const ui=source('../assets/panda-hsk2-preview-ui-v1.mjs');
 const aud=source('../assets/panda-hsk2-preview-audio-v1.mjs');
 const reg=source('../assets/panda-approved-voice-registry-v516.mjs');
 assert(manifest.version>=546,'Natural Panda voice release must not roll back');
 assert(sw.includes("const CACHE='chinese-coach-pwa-v"+manifest.version+"-"));
 for(const file of [
  'panda-ai-natural-voice-batch01-v546.mjs?v=546',
  'panda-approved-voice-registry-v516.mjs?v=546',
  'panda-hsk2-preview-audio-v1.mjs?v=546',
  'panda-hsk2-preview-core-v1.mjs?v=552',
  'panda-hsk2-preview-ui-v1.mjs?v=546']){
  assert(sw.includes(file),'SW missing '+file);
  assert(manifest.files.some(p=>p.endsWith(file)),'offline missing '+file);
 }
 assert(html.includes('panda-hsk2-preview-core-v1.mjs?v=552'));
 assert(html.includes('panda-hsk2-preview-ui-v1.mjs?v=546'));
 assert(core.includes('panda-hsk2-preview-audio-v1.mjs?v=546'));
 assert(ui.includes('panda-hsk2-preview-audio-v1.mjs?v=546'));
 assert(aud.includes('panda-approved-voice-registry-v516.mjs?v=546'));
 assert(reg.includes('panda-ai-natural-voice-batch01-v546.mjs?v=546'));
 assert.match(core,/say\(natural\.reply,!!lookupPandaVoiceClip\(natural\.reply\.hanzi\)\)/);
 for(const item of PANDA_AI_NATURAL_V546){
  assert(sw.includes(item.src),'SW missing MP3 '+item.id);
 }
});

test('old approved Panda AI replies remain intact without any Panda Street substitution',()=>{
 const old=[
  ['今天我有空，可以聊聊天。','panda-ai-xiaoxiao-new-replies-20261122/panda01.mp3'],
  ['好的，那你先忙吧。','panda-ai-xiaoxiao-new-replies-20261122/panda02.mp3'],
  ['那你今天想做什么？','panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3'],
  ['那你想聊聊天吗？','panda-ai-xiaoxiao-new-replies-20261122/panda04.mp3']
 ];
 for(const [hanzi,path] of old)assert(lookupApprovedPandaVoice(hanzi)?.src.endsWith(path),hanzi);
 assert(PANDA_AI_NATURAL_V546.every(e=>!e.src.includes('panda-street')),'Street voice must not mix into Panda AI');
});
