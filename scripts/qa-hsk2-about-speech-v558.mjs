import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,393,412]){
  const page=await browser.newPage({viewport:{width,height:800},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{
   localStorage.setItem('panda-go-hsk2-about-me-v1',JSON.stringify({step:6,heardWords:[0,1,2,3,4,5],grammarDone:true,unlockedSection:2,migrationV1:true}));
   window.SpeechRecognition=class{start(){window.qaRecognition=this}abort(){}};
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/hsk2-about-me.html?step=6',{waitUntil:'load'});
  assert.equal(await page.locator('#app').getAttribute('data-view'),'6');
  assert.equal(await page.locator('.tones-hero .about-speech-approved-art image').getAttribute('href'),"./assets/hsk2-lesson4-hobby-3d/stages-v2.webp");
  assert.equal(await page.locator('.practice-modes').count(),0);
  assert.equal(await page.locator('.pg-standard-speech-row').count(),6);
  assert.equal(await page.locator('.pg-standard-speech-row [data-mic]').count(),6);
  const layout=await page.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect();
   const a=rect('.tones-hero .about-speech-approved-art'),b=rect('.tones-hero .hero-message'),t=rect('.tone-tabs'),l=rect('.pg-standard-list');
   return {right:b.left-a.right,gap:t.top-a.bottom,listGap:l.top-t.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert(layout.right>=0&&layout.right<=15,JSON.stringify(layout));
  assert(layout.gap>=0&&layout.gap<=15,JSON.stringify(layout));
  assert(layout.listGap>=0&&layout.listGap<=15&&!layout.overflow,JSON.stringify(layout));
  fs.mkdirSync('qa/hsk2-about-speech-v558',{recursive:true});
  await page.screenshot({path:'qa/hsk2-about-speech-v558/'+width+'.png'});
  await page.locator('[data-tone-tab="phrases"]').click();
  assert.equal(await page.locator('.phrase-review').count(),1);
  await page.locator('[data-tone-tab="words"]').click();
  await page.locator('.pg-standard-speech-row [data-mic]').first().click();
  await page.evaluate(()=>window.qaRecognition.onresult({results:[[{transcript:'来自'}]],resultIndex:0}));
  assert.match(await page.locator('#feedback').textContent(),/Тоны не оценивались/);
  assert.equal(await page.locator('.pg-standard-speech-row .mic.recognized').count(),0);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('PASS lesson 1 speech layout '+width);
 }
}finally{await browser.close()}
