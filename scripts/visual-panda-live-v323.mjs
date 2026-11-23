// Panda Go: visible approved Panda AI/mobile-layout smoke test.
// Legacy conversation markup is deliberately hidden under the approved v353 screen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/panda-live-v323';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const summary={screens:[],results:[],errors:[]};
try{
 for(const [width,height] of [[360,640],[390,720],[412,915]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',error=>summary.errors.push({width,message:error.message}));
  let res=await page.goto(base+'/index.html',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  await page.locator('#pg130:not([hidden])').waitFor();
  assert.equal(await page.locator('#pg130 .pg-hsk-level').count(),2,'HSK 1 and HSK 2 on approved home');
  res=await page.goto(base+'/hsk1-map.html',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  assert.equal(await page.locator('.hotspots a.lesson').count(),7,'Seven approved lesson hotspots');
  res=await page.goto(base+'/panda-voice-pilot.html?lesson=1',{waitUntil:'load'});
  assert.equal(res?.status(),200);
  await page.locator('#pg346').waitFor();
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.pg500Mounted==='true');
  assert.match(await page.locator('#pg346 .pg500-landscape').evaluate(el=>getComputedStyle(el).backgroundImage),/panda-landscape-v350/,
   'The approved v500 day/night background must live on its dedicated landscape layer');
  assert.equal(await page.locator('#pg346-topics').isVisible(),false,'Do not cover Panda with open topic menu');
  assert(await page.locator('.pg352-mascot .pg346-panda').isVisible());
  assert.equal(await page.locator('.pg352-rocks').isVisible(),false,'The approved lake already contains natural stones');
  await page.waitForFunction(()=>document.querySelector('.pg352-mascot').dataset.faceReady==='true');
  const dims=await page.evaluate(()=>{
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
     scene:rect('.pg346-scene'),mascot:rect('.pg352-mascot'),
     composer:rect('.pg346-composer'),nav:rect('.pg346-nav')};
  });
  assert(dims.scrollWidth<=dims.viewport+2,'No horizontal scrolling');
  assert(dims.mascot.top>=dims.scene.top-6&&dims.mascot.bottom<=dims.scene.bottom+5,'Entire Panda remains in scene');
  const physicalSeat=await page.evaluate(()=>{
   const scene=document.querySelector('.pg346-scene'),mascot=document.querySelector('.pg352-mascot');
   const stone=getComputedStyle(scene,'::before');
   const contact=getComputedStyle(mascot,'::before');
   return {stoneImage:stone.backgroundImage,contactFill:contact.backgroundImage,contactHeight:parseFloat(contact.height)};
  });
  assert(physicalSeat.stoneImage.includes('panda-exact-stone-v361.webp'),'Approved exact stone artwork must be visible');
  assert(physicalSeat.contactFill.includes('radial-gradient')&&physicalSeat.contactHeight>0,'Panda feet need an actual anchored contact shadow');
  assert(dims.composer.bottom<=dims.nav.top+6,'Composer stays above navigation');
  await page.screenshot({path:out+'/approved-scene-'+width+'.png',animations:'disabled'});
  await page.locator('#pg346-nonstop').click();
  assert.equal(await page.locator('#pg346-nonstop').getAttribute('aria-pressed'),'true');
  const input=page.locator('#pg346-input');
  // Approved v500: the paper plane first OPENS the compact composer.
  await page.locator('#pg346-send').click();
  assert.equal(await page.locator('#pg346').getAttribute('data-composer-open'),'true','Paper plane should open the composer before typing');
  await input.fill('你好');await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh')?.textContent==='你好！');
  assert((await page.locator('#pg346-rows').textContent()).includes('你好'));
  await page.locator('#pg346-send').click();
  assert(await input.isVisible(),'The second paper-plane tap must reopen text entry');
  await input.fill('你好吗？');await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh')?.textContent==='很好！');
  summary.results.push({width,case:'short Mandarin dialogue',reply:await page.locator('.pg346-main-zh').textContent()});
  await page.locator('#pg346-topics-btn').click();
  assert(await page.locator('#pg346-topics').isVisible(),'Topic list opens only when tapped');
  const topics=await page.locator('#pg346-topics .pg346-topic-list button').allTextContents();
  assert(topics.length>=7,'All seven original topics retained; extra HSK2 practice topics may be added');
  assert.equal(new Set(topics.map(s=>s.trim())).size,topics.length,'Visible topic entries must remain distinct');
  await page.locator('#pg346-topics-close').click();
  assert(!(await page.locator('#pg346-topics').isVisible()));
  await page.locator('#pg346-history').click();
  assert(await page.locator('#history-dialog').isVisible());
  await page.locator('[data-close="history-dialog"]').click();
  await page.screenshot({path:out+'/approved-dialog-'+width+'.png',animations:'disabled'});
  summary.screens.push({width,height,dims});
  await ctx.close();
 }
 assert.deepEqual(summary.errors,[],'No browser runtime errors');
 summary.result='passed';
 console.log('PASS Panda v352: approved scene, closed menu, Chinese dialog, seven topics, history, rocks and responsive 360/390/412px mobile layouts.');
}catch(error){summary.result='failed';summary.failure=String(error.stack||error);throw error}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(summary,null,2));await browser.close()}
