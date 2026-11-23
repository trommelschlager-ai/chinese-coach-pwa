// Real Chromium IndexedDB smoke: a reviewed Panda exchange survives loss of network.
// Does not modify or import this module into the live Panda app.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  const staged=await page.evaluate(async()=>{
    const m=await import('/assets/panda-offline-memory-v1.mjs');
    const db=m.createPandaMemoryStore();
    const input={
      ownerId:'learner-test-2026',topic:'movies',trigger:'我想看电影。',
      answer:'你想看什么电影？',pinyin:'Nǐ xiǎng kàn shénme diànyǐng?',
      ru:'Какой фильм ты хочешь посмотреть?',level:'HSK2',consent:true
    };
    const candidate=m.preparePandaMemoryCandidate(input);
    const first=await db.stage(input);
    const unreviewed=await db.recall({ownerId:input.ownerId,topic:input.topic,trigger:input.trigger});
    const audioBlob=new Blob([Uint8Array.from([73,68,51,4,0,0,0,0,0,0,255,251,144,100])],{type:'audio/mpeg'});
    const ready=await db.approve({candidate,source:'approved-course-audio',reviewRef:'reviewed:qa_approved_01',audioBlob,voiceId:'voice-093'});
    const again=await db.stage(input);
    const reviewed=await db.recall({ownerId:input.ownerId,topic:input.topic,trigger:'我想看电影'});
    window.__pandaOfflineQA={db,owner:input.ownerId};
    return {first,unreviewed,ready,again,
      reviewed:reviewed?{answer:reviewed.answer,size:reviewed.audioBlob.size,voiceId:reviewed.voiceId}:null};
  });
  assert.equal(staged.first.status,'pending-review');
  assert.equal(staged.unreviewed,null);
  assert.equal(staged.ready.status,'offline-ready');
  assert.equal(staged.again.status,'offline-ready','Repeated internet phrase must not destroy approved MP3');
  assert.deepEqual(staged.reviewed,{answer:'你想看什么电影？',size:14,voiceId:'voice-093'});
  await context.setOffline(true);
  const offline=await page.evaluate(async()=>{
    const db=window.__pandaOfflineQA.db;
    const ownerId=window.__pandaOfflineQA.owner;
    const saved=await db.recall({ownerId,topic:'movies',trigger:'我想看电影！'});
    return saved&&{zh:saved.answer,pinyin:saved.pinyin,ru:saved.ru,
      size:saved.audioBlob.size,voice:saved.voiceId};
  });
  assert.deepEqual(offline,{
    zh:'你想看什么电影？',
    pinyin:'Nǐ xiǎng kàn shénme diànyǐng?',
    ru:'Какой фильм ты хочешь посмотреть?',
    size:14,voice:'voice-093'
  });
  const clear=await page.evaluate(async()=>{
    const {db,owner}=window.__pandaOfflineQA;
    await db.clearOwner(owner);
    return await db.recall({ownerId:owner,topic:'movies',trigger:'我想看电影。'});
  });
  assert.equal(clear,null,'User must be able to delete all local Panda memory');
  console.log('PASS: reviewed Xiaoxiao phrase persisted, survived offline mode, and was deleted on request');
  await context.close();
}finally{await browser.close()}
