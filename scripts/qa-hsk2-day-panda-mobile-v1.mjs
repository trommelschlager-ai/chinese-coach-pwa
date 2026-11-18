/* Android 393x852 E2E — approved 12-screen HSK2 storyboard, then Panda AI.
 * Uses actual visible controls; no bypassing stages or silent test skipping.
 */
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
 fs.mkdirSync('qa/panda-voice-pilot',{recursive:true});

 // HSK2 v433 switched from a PNG poster map to ten accessible HTML cards.
 await page.goto(base+'/hsk2-life-course.html?view=map',{waitUntil:'domcontentloaded'});
 await page.locator('.pg433-map .pg433-map-card[data-topic="0"]').waitFor({state:'visible',timeout:15000});
 assert.equal(await page.locator('.pg433-map .pg433-map-card[data-topic]').count(),10,'All ten real course topics must be usable');
 assert.match(await page.locator('.pg433-map').innerText(),/10 тем|30 мини-уроков/);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-course-map-android.png',fullPage:false});

 await page.goto(base+'/hsk2-life-course.html?start=1&v=414',{waitUntil:'domcontentloaded'});
 await page.locator('.pg432-cover img[src$="/lesson1.jpg"]').waitFor({state:'visible',timeout:15000});
 await page.locator('[data-pg432-cover-start]').click();
 await page.locator('.pg433-root:not(.pg433-map)').waitFor({state:'visible',timeout:15000});
 const next=async(from,to)=>{
  assert.equal((await page.locator('.pg433-counter').innerText()).trim(),(from+1)+' / 12','Unexpected storyboard page '+from);
  const button=page.locator('[data-pg433-next]');
  assert.equal(await button.isDisabled(),false,'Lesson should permit next after completing page '+(from+1));
  await button.click();
  if(to!==null)assert.equal((await page.locator('.pg433-counter').innerText()).trim(),(to+1)+' / 12');
 };
 // 1–2: seven visible words across two pages.
 assert.equal(await page.locator('.pg433-wordrow').count(),4);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-lesson-android.png',fullPage:false});
 await next(0,1);
 assert.equal(await page.locator('.pg433-wordrow').count(),3);
 // 3: explicit grammar order; 4: applied rule.
 await next(1,2);
 assert.match(await page.locator('.pg433-content').innerText(),/Грамматика/);
 await next(2,3);
 assert.equal(await page.locator('[data-day-rule-choice]').count(),2);
 await page.locator('[data-day-rule-choice="0"]').click();
 // 5–6: speech practice, no invented tone grading.
 await next(3,4);
 assert.equal(await page.locator('.pg433-speechrow').count(),4);
 await next(4,5);
 assert.equal(await page.locator('.pg433-speechrow').count(),3);
 // 7: Q1–Q2; 8: match pairs; 9: listening + word order; 10: final two questions.
 await next(5,6);
 assert.equal(await page.locator('[data-day-quiz]').count()>2,true);
 await page.locator('[data-day-quiz="0:1"]').click();
 await page.locator('[data-day-quiz="1:0"]').click();
 await next(6,7);
 assert.equal(await page.locator('[data-day-pair-left]').count(),3);
 for(let i=0;i<3;i++){
  await page.locator('[data-day-pair-left="'+i+'"]').click();
  await page.locator('[data-day-pair-right="'+i+'"]').click();
 }
 await next(7,8);
 assert.equal(await page.locator('[data-day-listen]').count(),3);
 await page.locator('[data-day-listen="0"]').click();
 for(let i=0;i<4;i++)await page.locator('[data-day-token="'+i+'"]').click();
 await next(8,9);
 await page.locator('[data-day-fill="0"]').click();
 await page.locator('[data-day-truth="true"]').click();
 await next(9,10);
 // 11: real examples; 12: four-turn sample dialogue.
 assert.equal(await page.locator('.pg433-sentence').count(),3);
 await next(10,11);
 assert.equal(await page.locator('.pg433-chat').count(),4);
 await next(11,null);
 const link=page.locator('.pg433-ai-link');
 await link.waitFor({state:'visible',timeout:12000});
 assert.match(await link.getAttribute('href'),/practice=day&mini=0/);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-done-android.png',fullPage:false});

 // The verified completed-lesson link opens the approved Panda AI Day practice.
 await page.goto(base+'/panda-voice-pilot.html?practice=day&mini=0',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:18000});
 assert.match(await page.locator('.pg346-title').innerText(),/Мой день/);
 await page.locator('.pg346-main-zh').filter({hasText:'你早上做什么？'}).waitFor({timeout:10000});
 for(const [answer,reply] of [
  ['我每天七点起床。','你起床以后做什么？'],
  ['我早上洗脸。','你上午做什么？'],
  ['我早上吃早饭。','做得好！']
 ]){
  await page.locator('#pg346-input').fill(answer);
  await page.locator('#pg346-send').click();
  await page.locator('.pg346-main-zh').filter({hasText:reply}).waitFor({timeout:10000});
 }
 const back=await page.locator('.pg346-back').getAttribute('href');
 const returnUrl=new URL(back,base+'/');
 assert(returnUrl.pathname.endsWith('/hsk2-life-course.html'),'Panda AI must link back to HSK2');
 assert(returnUrl.searchParams.get('topic')==='0'||(returnUrl.searchParams.get('from')==='hsk2-life-course'&&returnUrl.searchParams.get('return')==='done'&&returnUrl.searchParams.get('mini')==='0'));
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-panda-android.png',fullPage:false});
 assert.deepEqual(errors,[],'No browser JS errors');
 console.log('PASS: Android 393x852, ten topic cards, cover, 12 learning pages, all seven test questions, four sample dialogues, Panda AI day replies and return link.');
 await context.close();
}finally{await browser.close()}