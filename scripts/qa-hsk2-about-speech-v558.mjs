import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/hsk2-about-speech-v558',{recursive:true});
try{
 for(const [width,height] of [[360,800],[393,873],[412,915]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
   const seed={step:6,grammarDone:true,heardWords:[0,1,2,3,4,5],mic:[],selfSpoken:[],unlockedSection:2};
   for(const key of ['panda-go-hsk2-about-me-v1','pg-hsk2-about-me-preview-v1'])
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));
   window.SpeechRecognition=class{
    start(){setTimeout(()=>this.onresult?.({resultIndex:0,results:[[{transcript:'来自',confidence:1}]]}),25)}
    stop(){} abort(){}
   };
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/hsk2-about-me.html?step=6',{waitUntil:'load'});
  await page.locator('#app[data-view="6"] .about-speech-approved-art').waitFor();
  assert.equal(await page.locator('.practice-modes').count(),0);
  assert.equal(await page.locator('.pg-standard-speech-row').count(),6);
  assert.equal(await page.locator('.pg-standard-speech-row [data-mic]').count(),6);
  assert.equal(await page.locator('.pg-standard-speech-row [data-say]').count(),6);
  assert.equal(await page.locator('.about-speech-approved-art image').getAttribute('href'),'./assets/hsk2-lesson4-hobby-3d/stages-v2.webp');
  const image=await page.request.get(base+'/assets/hsk2-lesson4-hobby-3d/stages-v2.webp');assert(image.ok());
  const geo=await page.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   return {hero:rect('.tones-hero'),art:rect('.about-speech-approved-art'),card:rect('.tones-hero .hero-message'),tabs:rect('.tone-tabs'),list:rect('.pg-standard-list'),footer:rect('.pg433-footer'),width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.querySelector('.pg-standard-list').scrollHeight};
  });
  assert(geo.card.left>=geo.art.right-1,'Card overlaps panda: '+JSON.stringify(geo));
  assert(geo.tabs.top-geo.hero.bottom<=15&&geo.tabs.top>=geo.hero.bottom-1,'Excess gap under panda: '+JSON.stringify(geo));
  assert(geo.list.top-geo.tabs.bottom<=15&&geo.list.top>=geo.tabs.bottom-1,'Excess gap before list: '+JSON.stringify(geo));
  assert(geo.list.height>220&&geo.list.bottom<=geo.footer.top+2,'Word list clipped by footer: '+JSON.stringify(geo));
  assert(geo.scrollWidth<=geo.width+1&&geo.footer.bottom<=geo.height+2,'Viewport overflow: '+JSON.stringify(geo));
  await page.screenshot({path:'qa/hsk2-about-speech-v558/words-'+width+'.png',animations:'disabled'});
  await page.locator('[data-tone-tab="phrases"]').click();
  assert.equal(await page.locator('.about-speech-phrases .approved-phrase-row').count(),6);
  await page.locator('[data-tone-tab="words"]').click();
  await page.locator('[data-mic="0"]').click();
  await page.waitForFunction(()=>document.querySelector('#feedback')?.textContent.includes('Тоны не проверены'));
  assert.equal(await page.locator('#feedback.good').count(),0,'ASR must not mark tones as correct');
  assert((await page.evaluate(()=>window.PandaGoHSK2Preview.getProgress())).mic.includes(0));
  await page.locator('.about-speech-fallback').click();
  assert.equal(await page.locator('[data-self-spoken]').count(),6);
  await page.locator('.about-speech-fallback').click();
  assert.equal(await page.locator('[data-mic]').count(),6);
  assert.deepEqual(errors,[]);
  console.log('PASS HSK2 About Me speech layout '+width+'px',JSON.stringify(geo));
  await context.close();
 }
}finally{await browser.close()}
