// Public course library integration: install once, remember without internet,
// update idempotently, keep private learner data in independent IndexedDB.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({
 headless:true,args:['--no-sandbox','--host-resolver-rules=MAP panda.localhost 127.0.0.1']
});
try{
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 const remote='https://trommelschlager-ai.github.io/chinese-coach-pwa/';
 const files={
  [remote+'assets/panda-context-voice-20261122/chat03.mp3']:'assets/panda-context-voice-20261122/chat03.mp3',
  [remote+'assets/panda-ai-xiaoxiao-new-replies-20261122/panda06.mp3']:'assets/panda-ai-xiaoxiao-new-replies-20261122/panda06.mp3',
  [remote+'assets/panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3']:'assets/panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3',
  [remote+'assets/panda-shared-library/manifest-v1.json']:'assets/panda-shared-library/manifest-v1.json'
 };
 const downloads={};
 for(const [url,path] of Object.entries(files)){
  downloads[url]=0;
  await page.route(url,route=>{
   downloads[url]++;
   return route.fulfill({path,status:200,headers:{
    'access-control-allow-origin':'*','cache-control':'no-store',
    'content-type':path.endsWith('.mp3')?'audio/mpeg':'application/json'
   }});
  });
 }
 await page.goto('http://panda.localhost:4173/panda-shared-memory.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#release').textContent(),'не скачана');
 assert.equal(await page.locator('#count').textContent(),'0');
 await page.locator('#download').click();
 await page.waitForFunction(()=>document.querySelector('#downloadStatus')?.textContent.includes('Скачано 3 фраз'),null,{timeout:20000});
 assert.equal(await page.locator('#count').textContent(),'3');
 assert.equal(await page.locator('#release').textContent(),'№ 1');
 const before=Object.values(downloads).reduce((a,b)=>a+b,0);
 await page.locator('#download').click();
 await page.waitForFunction(()=>document.querySelector('#downloadStatus')?.textContent.includes('Актуальная версия уже сохранена'));
 const after=Object.values(downloads).reduce((a,b)=>a+b,0);
 assert.equal(after,before+1,'Only catalog refresh should occur; MP3s must not redownload');

 // Create separate learner-owned private card to prove shared deletion cannot erase it.
 const privateBefore=await page.evaluate(async()=>{
  const m=await import('./assets/panda-offline-memory-v1.mjs');
  const db=m.createPandaMemoryStore();
  const input={ownerId:'qa-learner-private',topic:'movies',trigger:'我想看喜剧片。',
   answer:'我喜欢喜剧片。',pinyin:'Wǒ xǐhuan xǐjùpiàn.',ru:'Я люблю комедии.',
   level:'HSK2',consent:true};
  const candidate=m.preparePandaMemoryCandidate(input);
  await db.stage(input);
  await db.approve({candidate,source:'approved-course-audio',
   reviewRef:'reviewed:qa_private_test',audioBlob:new Blob([Uint8Array.from([73,68,51,4,0,0,0,0,0,0,255,251,144,100])],{type:'audio/mpeg'}),
   voiceId:'voice-093'});
  return (await db.recall({ownerId:input.ownerId,topic:input.topic,trigger:input.trigger}))?.answer;
 });
 assert.equal(privateBefore,'我喜欢喜剧片。');

 await page.locator('#prepare').click();
 await page.waitForFunction(()=>document.querySelector('#downloadStatus')?.textContent.includes('Страница готова для авиарежима'),null,{timeout:40000});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:10000});

 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded',timeout:12000});
 await page.waitForFunction(()=>document.querySelector('#online')?.textContent.includes('Офлайн'),null,{timeout:7000});
 await page.locator('#sample').selectOption('movie-why');
 await page.locator('#phrase').fill('你为什么喜欢喜剧片!');
 await page.locator('#check').click();
 await page.waitForFunction(()=>document.querySelector('#answer .zh')?.textContent==='因为喜剧片很好笑。',null,{timeout:7000});
 assert.equal(await page.locator('#answer .py').textContent(),'Yīnwèi xǐjùpiàn hěn hǎoxiào.');
 assert.equal(await page.locator('#play').isDisabled(),false);
 await page.locator('#play').click();
 await page.waitForFunction(()=>document.querySelector('#testStatus')?.textContent.includes('Воспроизводится скачанная запись Xiaoxiao'),null,{timeout:7000});
 await page.locator('#clearShared').click();
 await page.waitForFunction(()=>document.querySelector('#downloadStatus')?.textContent.includes('Личная память не тронута'),null,{timeout:7000});
 assert.equal(await page.locator('#count').textContent(),'0');
 const personalAfter=await page.evaluate(async()=>{
  const {createPandaMemoryStore}=await import('./assets/panda-offline-memory-v1.mjs');
  const privateCard=await createPandaMemoryStore().recall({ownerId:'qa-learner-private',topic:'movies',trigger:'我想看喜剧片。'});
  return privateCard?.answer;
 });
 assert.equal(personalAfter,'我喜欢喜剧片。','Deleting common library must leave private memory unchanged');
 await page.locator('#check').click();
 await page.waitForFunction(()=>document.querySelector('#testStatus')?.textContent.includes('Этой фразы нет'),null,{timeout:7000});
 assert.deepEqual(pageErrors,[]);
 console.log('PASS shared Panda pack: 3 genuine Xiaoxiao MP3, idempotent download, offline reload/audio, separate private IndexedDB');
 await context.close();
}finally{await browser.close()}
