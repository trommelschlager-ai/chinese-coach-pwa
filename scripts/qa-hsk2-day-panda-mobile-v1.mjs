import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/hsk2-start.html#map',{waitUntil:'domcontentloaded'});
 await page.locator('.content.journey-map-active .journey-head h1').waitFor({state:'visible',timeout:12000});
 assert.match(await page.locator('.journey-head h1').innerText(),/Китайский \+ Легко/);
 const headBox=await page.locator('.journey-head').boundingBox();
 const titleBox=await page.locator('.journey-head h1').boundingBox();
 assert.ok(headBox&&titleBox,'Map title must be measurable');
 assert.ok(titleBox.y>=headBox.y-3&&titleBox.y+titleBox.height<=headBox.y+headBox.height+3,'Map heading must fit its own panel');
 assert.equal(await page.locator('.journey-card').count(),10,'All ten map topics visible');
 fs.mkdirSync('qa/panda-voice-pilot',{recursive:true});
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-course-map-android.png',fullPage:false});
 await page.goto(base+'/hsk2-life-course.html?start=1',{waitUntil:'domcontentloaded'});
 await page.locator('.day-title').waitFor({state:'visible',timeout:12000});
 assert.match(await page.locator('.day-title').innerText(),/Мой распорядок дня/);
 assert.equal(await page.locator('.day-vword').count(),7);
 const footerBox=await page.locator('#day-fixed-actions').boundingBox();
 const contentBox=await page.locator('#screen').boundingBox();
 assert.ok(footerBox&&contentBox,'Navigation and content must each have a box');
 assert.ok(footerBox.y>=contentBox.y+contentBox.height-2,'Fixed navigation must never overlap Chinese study content');
 assert.equal(await page.locator('#day-fixed-actions [data-day-next]').count(),1);
 assert.equal(await page.locator('.day-audio-pending').count()>0,true,'Missing MP3 must be clearly explained, not shown as a broken button');

 fs.mkdirSync('qa/panda-voice-pilot',{recursive:true});
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-lesson-android.png',fullPage:false});
 for(let i=0;i<3;i++)await page.locator('[data-day-next]').click();
 await page.locator('[data-day-quiz="0:1"]').click();
 await page.locator('[data-day-quiz="1:0"]').click();
 for(const k of [0,1,2,3])await page.locator('[data-day-token="'+k+'"]').click();
 await page.locator('[data-day-next]').click();
 assert.match(await page.locator('.day-card').first().innerText(),/Произнеси каждое слово 5 раз/);
 await page.locator('[data-day-next]').click();
 const link=page.locator('.day-ai-panel a');
 assert.match(await link.getAttribute('href'),/practice=day&mini=0/);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-done-android.png',fullPage:false});
 await page.goto(base+'/panda-voice-pilot.html?practice=day&mini=0',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:18000});
 assert.match(await page.locator('.pg346-title').innerText(),/Мой день/);
 await page.locator('.pg346-main-zh').filter({hasText:'你每天几点起床？'}).waitFor({timeout:10000});
 for(const [answer,nextQuestion] of [
  ['我每天七点起床。','你早上洗脸吗？'],
  ['我早上洗脸。','你早上吃早饭吗？'],
  ['我早上吃早饭。','做得好！']
 ]){
  await page.locator('#pg346-input').fill(answer);
  await page.locator('#pg346-send').click();
  await page.locator('.pg346-main-zh').filter({hasText:nextQuestion}).waitFor({timeout:10000});
 }
 const back=await page.locator('.pg346-back').getAttribute('href');
 assert.match(back,/hsk2-life-course\.html\?topic=0/);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-panda-android.png',fullPage:false});
 assert.deepEqual(errors,[],'No browser JS errors');
 console.log('PASS: Android 393x852: day micro-lesson, grammar/test/voice, completion AI link, three contextual Panda AI prompts, return to course.');
 await context.close();
}finally{await browser.close()}
