/* Visual verification of the newly approved seven-topic HSK 1 course. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/hsk1-v152';
const sizes=[[360,640],[390,720],[412,915]];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={screenshots:[],errors:[],checks:[]};
try{
 for(const [width,height] of sizes){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push({width,error:e.message}));
  page.on('console',msg=>{if(msg.type()==='error'&&!msg.text().includes('favicon'))report.errors.push({width,console:msg.text()})});
  async function capture(name){
   const shell=page.locator('main').first();await shell.waitFor();
   const m=await shell.evaluate(el=>({
     scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
     images:[...el.querySelectorAll('img')].map(img=>({src:img.src,ok:img.complete&&img.naturalWidth>0}))
   }));
   assert(m.scrollWidth<=m.clientWidth+2,name+' horizontal overflow at '+width);
   assert(m.images.every(i=>i.ok),name+' contains an unloaded image at '+width+': '+JSON.stringify(m.images));
   await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true,animations:'disabled'});
   report.screenshots.push({name,width,height,...m});
  }
  await page.goto(base+'/hsk1-map.html',{waitUntil:'load'});
  assert.equal(await page.locator('a.node[href*="hsk1-lesson.html"]').count(),7);
  await capture('01-map');
  await page.goto(base+'/hsk1-lesson.html?lesson=1',{waitUntil:'load'});
  assert.equal(await page.locator('.lesson-step').count(),7);
  assert.equal(await page.locator('.lesson-word').count(),9);
  await capture('02-lesson1-words');
  await page.locator('#lesson-next').click();
  assert(await page.locator('.lesson-tone-grid').isVisible());
  await capture('03-lesson1-four-tones');
  assert(await page.locator('#lesson-next').isDisabled(),'Tone discrimination is required');
  for(const tone of [3,1,4,2])await page.locator('[data-tone-choice="'+tone+'"]').click();
  assert(await page.locator('#lesson-next').isEnabled(),'Four correct tone choices unlock examples');
  await page.locator('#lesson-next').click();
  assert(await page.locator('.lesson-character-grid').isVisible());
  await page.locator('#lesson-next').click();
  assert.equal(await page.locator('.lesson-line').count(),3);
  await capture('04-lesson1-dialogue');
  await page.goto(base+'/hsk1-lesson.html?lesson=2',{waitUntil:'load'});
  assert((await page.locator('#course-heading').textContent()).includes('Личные местоимения'));
  await capture('05-lesson2-pronouns');
  await page.goto(base+'/hsk1-lesson.html?lesson=7',{waitUntil:'load'});
  assert((await page.locator('#course-heading').textContent()).includes('Погода'));
  await capture('06-lesson7-weather');
  await ctx.close();
  report.checks.push({width,height,passed:true});
 }
 assert.deepEqual(report.errors,[],'Browser runtime errors');
 report.result='passed';
 console.log('HSK 1 v152 mobile QA: 18 captures across 360, 390 and 412 px. All seven lesson routes, image loading and scrolling checked.');
}catch(e){report.result='failed';report.failure=String(e.stack||e);throw e}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
