// Panda's real HSK2 chat -> opt-in private memory with approved MP3,
// plus staging of an unreviewed new phrase, all without changing the chat UI.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--host-resolver-rules=MAP panda.localhost 127.0.0.1']});
try{
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://trommelschlager-ai.github.io/chinese-coach-pwa/assets/panda-context-voice-20261122/chat03.mp3',
  route=>route.fulfill({status:200,path:'assets/panda-context-voice-20261122/chat03.mp3',
   headers:{'access-control-allow-origin':'*','content-type':'audio/mpeg'}}));
 await page.goto('http://panda.localhost:4173/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
 await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
 await page.locator('#panda-memory-live-controls').waitFor({state:'attached',timeout:10000});
 assert.equal(await page.locator('#pg346 .pg346-panda').count(),1);
 assert.equal(await page.locator('#pml-consent').isChecked(),false);
 await page.locator('#pg346-nonstop').click();
 await page.locator('#pg346-send').click();
 await page.locator('#pg346-input').fill('我想看喜剧片。');
 await page.locator('#pg346-send').click();
 await page.waitForFunction(()=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent==='我喜欢喜剧片。',null,{timeout:10000});
 await page.locator('#pg346-history').click();
 await page.locator('#pml-save').click();
 await page.waitForFunction(()=>document.querySelector('#pml-status')?.textContent.includes('Сначала подтверди согласие'));
 assert.equal(await page.locator('#pml-auto').isDisabled(),true);
 await page.locator('#pml-consent').check();
 await page.locator('#pml-save').click();
 await page.waitForFunction(()=>document.querySelector('#pml-status')?.textContent.includes('MP3 Xiaoxiao сохранены'),null,{timeout:10000});
 await page.waitForFunction(()=>document.querySelector('#pml-count')?.textContent.includes('с MP3: 1'),null,{timeout:7000});
 await page.locator('#pml-check').click();
 await page.waitForFunction(()=>document.querySelector('#pml-status')?.textContent.includes('Сохранён ответ'),null,{timeout:7000});
 assert.match(await page.locator('#pml-status').textContent(),/我喜欢喜剧片/);

 // Enable "save next pairs" explicitly. This must be false after reload.
 await page.locator('#pml-auto').check();
 await page.locator('#history-dialog').evaluate(dialog=>dialog.close());
 await page.locator('#pg346-send').click();
 await page.locator('#pg346-input').fill('我想看电影。');
 await page.locator('#pg346-send').click();
 await page.waitForFunction(()=>document.querySelector('#pg346-rows .pg346-row:last-child .pg346-zh')?.textContent==='你想看什么电影？',null,{timeout:10000});
 await page.waitForFunction(()=>document.querySelector('#pml-count')?.textContent.includes('ждут проверки: 1'),null,{timeout:10000});

 const dbStatus=await page.evaluate(async()=>{
  const {createPandaMemoryStore}=await import('./assets/panda-offline-memory-v1.mjs');
  const owner=localStorage.getItem('panda-memory-device-owner-v1');
  return (await createPandaMemoryStore().list(owner)).map(x=>({trigger:x.trigger,status:x.status,hasAudio:x.hasAudio}));
 });
 assert.deepEqual(dbStatus.map(x=>x.status).sort(),['offline-ready','pending-review']);
 assert.equal(dbStatus.find(x=>x.status==='pending-review').hasAudio,false,'Never approve a newly generated text');
 assert.equal(dbStatus.find(x=>x.status==='offline-ready').hasAudio,true,'Approved Xiaoxiao MP3 must be saved');

 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#panda-memory-live-controls').waitFor({state:'attached',timeout:15000});
 assert.equal(await page.locator('#pml-auto').isChecked(),false,'Auto consent must not persist silently');
 assert.equal(await page.locator('#pml-consent').isChecked(),false,'Consent must default off every session');
 await page.waitForFunction(()=>document.querySelector('#pml-count')?.textContent.includes('На устройстве: 2'),null,{timeout:7000});
 await context.setOffline(true);
 const savedOffline=await page.evaluate(async()=>{
  const {createPandaMemoryStore}=await import('./assets/panda-offline-memory-v1.mjs');
  return (await createPandaMemoryStore().recall({
   ownerId:localStorage.getItem('panda-memory-device-owner-v1'),
   topic:'movies',trigger:'我想看喜剧片。'
  }));
 });
 assert.equal(savedOffline.answer,'我喜欢喜剧片。');
 assert.ok(savedOffline.audioBlob.size>0,'Store full MP3 Blob, not only URL');
 const signature=new Uint8Array(await savedOffline.audioBlob.slice(0,3).arrayBuffer());
 assert.ok(
  (signature[0]===73&&signature[1]===68&&signature[2]===51)||
  (signature[0]===255&&(signature[1]&224)===224),
  'Saved offline content must carry an MP3 signature'
 );
 assert.deepEqual(errors,[]);
 console.log('PASS: real Panda conversation opt-in, approved Xiaoxiao MP3, pending new phrase, session-only consent, offline recall');
 await context.close();
}finally{await browser.close()}
