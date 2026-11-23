import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PANDA_MEMORY_MAX_MP3_BYTES, normalizePandaChinese,
  preparePandaMemoryCandidate, prepareReviewedPandaMemory,
  fetchApprovedPandaMp3,createPandaMemoryStore
} from '../assets/panda-offline-memory-v1.mjs';

const draft=(overrides={})=>({
  ownerId:'student-test-1',topic:'movies',trigger:'我想看电影。',
  answer:'你想看什么电影？',pinyin:'Nǐ xiǎng kàn shénme diànyǐng?',
  ru:'Какой фильм ты хочешь посмотреть?',level:'HSK2',
  consent:true,...overrides
});
const mp3 = ()=>new Blob([Uint8Array.from([73,68,51,4,0,0,0,0,0,0,255,251,144,100])],{type:'audio/mpeg'});

test('New AI phrase is staged for review, never treated as a learned offline answer',()=>{
  const card=preparePandaMemoryCandidate(draft());
  assert.equal(card.status,'pending-review');
  assert.equal(card.reviewRef,null);
  assert.equal(card.audioBlob,null);
  assert.equal(card.source,'unreviewed-online-dialogue');
  assert.equal(card.triggerKey,'我想看电影');
  assert.equal(card.id,'student-test-1|movies|我想看电影');
  assert.ok(Object.isFrozen(card));
});

test('Reject any offline recording without explicit learner consent or valid Chinese',()=>{
  assert.throws(()=>preparePandaMemoryCandidate(draft({consent:false})),/CONSENT_REQUIRED/);
  assert.throws(()=>preparePandaMemoryCandidate(draft({trigger:'hello'})),/Mandarin/);
  assert.throws(()=>preparePandaMemoryCandidate(draft({answer:''})),/Chinese answer/);
  assert.throws(()=>preparePandaMemoryCandidate(draft({level:'HSK9'})),/level/);
  assert.throws(()=>preparePandaMemoryCandidate(draft({topic:'../../private'})),/topic/);
  assert.throws(()=>preparePandaMemoryCandidate(draft({ru:' '})),/Russian translation/);
  assert.equal(normalizePandaChinese('我想看电影！'),'我想看电影');
});

test('Only reviewed course approval with real Xiaoxiao MP3 permits offline playback',()=>{
  const card=preparePandaMemoryCandidate(draft());
  const audioBlob=mp3();
  for(const input of [
    {candidate:card,source:'model-unreviewed',reviewRef:'reviewed:human001',audioBlob,voiceId:'voice-093'},
    {candidate:card,source:'approved-course-audio',reviewRef:'',audioBlob,voiceId:'voice-093'},
    {candidate:card,source:'approved-course-audio',reviewRef:'reviewed:human001',audioBlob,voiceId:'male-street'},
    {candidate:card,source:'approved-course-audio',reviewRef:'reviewed:human001',audioBlob:new Blob([]),voiceId:'voice-093'},
    {candidate:card,source:'approved-course-audio',reviewRef:'reviewed:human001',audioBlob:new Blob([new Uint8Array(PANDA_MEMORY_MAX_MP3_BYTES+1)]),voiceId:'voice-093'}
  ]) assert.throws(()=>prepareReviewedPandaMemory(input));
  const approved=prepareReviewedPandaMemory({candidate:card,source:'approved-course-audio',reviewRef:'reviewed:human001',audioBlob,voiceId:'voice-093'});
  assert.equal(approved.status,'offline-ready');
  assert.strictEqual(approved.audioBlob,audioBlob);
  assert.equal(approved.voiceId,'voice-093');
});

test('Download only complete same-origin MP3, not expiring Luvvoice URLs or HTML',async()=>{
  const baseUrl='https://trommelschlager-ai.github.io/chinese-coach-pwa/';
  let requests=0;
  const fakeFetch=async(url,options)=>{
    requests++;
    assert.equal(options.redirect,'error');
    assert.equal(url,baseUrl+'assets/panda01.mp3');
    return {ok:true,type:'basic',blob:async()=>mp3()};
  };
  const result=await fetchApprovedPandaMp3('./assets/panda01.mp3',{baseUrl,fetcher:fakeFetch});
  assert.equal(result.size,14);
  assert.equal(requests,1);
  for(const src of ['https://cdn.luvvoice.com/audio/dynamic.mp3','https://evil.example/mp3/voice.mp3','javascript:alert(1)','../evil.ogg']) {
    await assert.rejects(fetchApprovedPandaMp3(src,{baseUrl,fetcher:fakeFetch}));
  }
  assert.equal(requests,1);
  await assert.rejects(fetchApprovedPandaMp3('./assets/panda01.mp3',{baseUrl,fetcher:async()=>({ok:true,blob:async()=>new Blob(['<html>error</html>'])})}),/Invalid MP3 signature/);
  await assert.rejects(fetchApprovedPandaMp3('./assets/panda01.mp3',{baseUrl,fetcher:async()=>({ok:false})}),/download failed/);
});

test('Do not pretend IndexedDB is available in unsupported browsers',async()=>{
  const memory=createPandaMemoryStore(null);
  await assert.rejects(memory.stage(draft()),/IndexedDB is unavailable/);
  await assert.rejects(memory.recall({ownerId:'student-test-1',topic:'movies',trigger:'我想看电影'}),/IndexedDB is unavailable/);
});
