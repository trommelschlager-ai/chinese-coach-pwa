import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v544.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const queue=JSON.parse(readFileSync(new URL('../docs/panda-ai-voice-queue-v545.json',import.meta.url),'utf8'));
const norm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
test('the external issue survives chat loss and every queued learner sentence has a real expected reply',()=>{
 assert.equal(queue.tracker,'https://github.com/trommelschlager-ai/chinese-coach-pwa/issues/216');
 assert(queue.tracks.length>=8);
 for(const x of queue.tracks){
  assert(/^PA-\d{3}$/.test(x.id),x.id);
  assert(x.pinyin && x.translation && x.reply && x.learner,x.id);
  const r=respondToNaturalStatement(x.learner,{awaiting:x.awaiting});
  assert(r,x.id+' unrecognized learner input');
  assert.equal(norm(r.reply.hanzi),norm(x.reply),x.id+' out of sync with real Panda reply');
  assert.equal(r.spoken.toneVerified,false,x.id+' cannot claim acoustic tone scoring');
 }
});
test('pending recordings must never be marked approved without an actual exact-match clip',()=>{
 const idSet=new Set();
 for(const x of queue.tracks){
  assert(!idSet.has(x.id),'duplicate ID '+x.id);
  idSet.add(x.id);
  if(x.audio_status==='approved_and_integrated'){
   const approved=lookupApprovedPandaVoice(x.reply);
   assert(approved,'missing registered MP3 for '+x.id);
   assert.equal(x.audio_file,approved.src,'wrong MP3 path for '+x.id);
   assert.equal(x.voice_approved,true,'voice review missing for '+x.id);
   assert.equal(x.android_verified,true,'Android QA missing for '+x.id);
  }else{
   assert.equal(x.voice_approved,false,'pending voice cannot be marked approved '+x.id);
   assert.equal(x.android_verified,false,'pending audio cannot be marked Android-verified '+x.id);
  }
 }
});
