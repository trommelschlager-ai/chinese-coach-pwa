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
   await shell.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));
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
  assert.equal(await page.locator('.map-road a.node').count(),7,'All seven approved HSK 1 route stops must be accessible');
  await capture('01-map');
  await page.goto(base+'/hsk1-lesson.html?lesson=1',{waitUntil:'load'});
  assert.equal(await page.locator('.lesson-step').count(),7);
  assert.equal(await page.locator('.lesson-word').count(),4);
  assert(await page.locator('#lesson-next').isDisabled(),'Words must be visited in groups');
  const speed=page.locator('#hsk1-female-voice-speed');
  assert(await speed.isVisible(),'Visible female speed selector on '+width+'px');
  assert.equal(await speed.inputValue(),'0.85','Default female educational speed must be 0.85×');
  await capture('02-lesson1-words');
  await speed.selectOption('0.75');
  assert.equal(await page.evaluate(()=>localStorage.getItem('pg-hsk1-female-speed-v161')),'0.75','Store speech speed separately from user progress');
  await page.locator('[data-word-next]').click();
  await capture('02a-lesson1-next-words');
  while(await page.locator('[data-word-next]').count())await page.locator('[data-word-next]').click();
  assert(await page.locator('#lesson-next').isEnabled());
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
  assert.equal(await page.locator('#hsk1-female-voice-speed').inputValue(),'0.75','Slow speed must persist across lessons');
  await page.locator('#hsk1-female-voice-speed').selectOption('0.85');
  await capture('05-lesson2-pronouns');
  while(await page.locator('[data-word-next]').count())await page.locator('[data-word-next]').click();
  await page.locator('#lesson-next').click();
  assert(await page.locator('[data-listen-prompt]').count(),'Listening quiz must be present for pronouns');
  assert(await page.locator('#lesson-next').isDisabled(),'Cannot skip listening');
  await capture('05a-lesson2-listening');
  for(const index of [2,0,3,1])await page.locator('[data-listen-answer="'+index+'"]').click();
  assert(await page.locator('#lesson-next').isEnabled(),'Four correct answers unlock next step');
  await page.goto(base+'/hsk1-lesson.html?lesson=7',{waitUntil:'load'});
  assert((await page.locator('#course-heading').textContent()).includes('Погода'));
  await capture('06-lesson7-weather');
  await ctx.close();
  report.checks.push({width,height,passed:true});
 }
 assert.deepEqual(report.errors,[],'Browser runtime errors');
 report.result='passed';
 console.log('HSK 1 v154 mobile QA: word groups, listening quiz and scenic lessons on 360, 390 and 412 px. All seven lesson routes, image loading and scrolling checked.');
}catch(e){report.result='failed';report.failure=String(e.stack||e);throw e}
finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
