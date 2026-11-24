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
  await page.locator('#pg346[data-pa-layout="v547"]').waitFor();
  assert.equal(await page.locator('#pg346-topics').isVisible(),false);
  const panda=page.locator('.pg352-mascot .pg346-panda');
  assert(await panda.isVisible());
  assert(await panda.evaluate(el=>el.complete&&el.naturalWidth>0&&Number(getComputedStyle(el).opacity)>0));
  assert.equal(await page.locator('.pg352-rocks').isVisible(),false);
  const dims=await page.evaluate(()=>{
   const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,stage:rect('#pg346'),mascot:rect('.pg352-mascot'),composer:rect('.pg346-composer'),nav:rect('.pg346-nav')};
  });
  assert(dims.scrollWidth<=dims.viewport+2,'No horizontal scrolling');
  assert(dims.mascot.left>=dims.stage.left-2&&dims.mascot.right<=dims.stage.right+2,'Panda fits approved stage');
  assert(dims.mascot.top>=dims.stage.top&&dims.mascot.bottom<=dims.composer.bottom,'Panda fits above footer');
  assert.match(await page.locator('.pg346-scene').evaluate(el=>getComputedStyle(el,'::before').backgroundImage),/panda-exact-stone-v361/);
  assert(dims.composer.bottom<=dims.nav.top+6,'Composer stays above navigation');
  await page.screenshot({path:out+'/approved-scene-'+width+'.png',animations:'disabled'});
  await page.locator('#pg346-nonstop').click();
  assert.equal(await page.locator('#pg346-nonstop').getAttribute('aria-pressed'),'true');
  const input=page.locator('#pg346-input');
  await input.fill('你好');await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh')?.textContent==='你好！');
  assert((await page.locator('#pg346-rows').textContent()).includes('你好'));
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
  await page.locator('.pg346-nav #pg346-history').click();
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
