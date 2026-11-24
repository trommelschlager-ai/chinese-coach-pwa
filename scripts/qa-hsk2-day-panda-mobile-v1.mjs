/* Android 393x852 E2E — approved 12-screen HSK2 storyboard, then Panda AI.
 * Uses actual visible controls; no bypassing stages or silent test skipping.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const dir=process.env.HSK2_QA_DIR||'qa/panda-voice-pilot';
const widths=(process.env.HSK2_QA_WIDTHS||'393').split(',').map(Number);
fs.mkdirSync(dir,{recursive:true});
try{
 for(const width of widths){
 const errors=[];
 const context=await browser.newContext({viewport:{width,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));


 // HSK2 v433 switched from a PNG poster map to ten accessible HTML cards.
 await page.goto(base+'/hsk2-life-course.html?view=map',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.pgc-feature-list .pgc-feature-card').count(),10);
 assert.match(await page.locator('.pgc-feature-day').getAttribute('href'),/hsk2-lesson1\.html/);
 await page.goto(base+'/hsk2-life-course.html?topic=0',{waitUntil:'domcontentloaded'});
 await page.locator('[data-practice-mini="0:0"]').click();
 await page.locator('.pg433-root:not(.pg433-map)').waitFor({state:'visible',timeout:15000});
 const next=async(from,to)=>{
  assert.equal((await page.locator('.pg433-counter').innerText()).trim(),(from+1)+' / 12','Unexpected storyboard page '+from);
  const button=page.locator('[data-pg433-next]');
  assert.equal(await button.isDisabled(),false,'Lesson should permit next after completing page '+(from+1));
  const layout=await page.evaluate(()=>{
   const main=document.querySelector('#pg433-content');
   const footer=document.querySelector('.pg433-footer').getBoundingClientRect();
   return {overflow:main.scrollWidth-main.clientWidth,bottom:footer.bottom,height:innerHeight};
  });
  assert(layout.overflow<=2&&layout.bottom<=layout.height+1,JSON.stringify(layout));
  await page.screenshot({path:dir+'/'+width+'-page-'+(from+1)+'.png'});
  await button.click();
  if(to!==null)assert.equal((await page.locator('.pg433-counter').innerText()).trim(),(to+1)+' / 12');
 };
 // 1–2: seven visible words across two pages.
 assert.equal(await page.locator('.pg433-wordrow').count(),4);
 await page.screenshot({path:dir+'/'+width+'-words.png',fullPage:false});
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
 await page.screenshot({path:dir+'/'+width+'-done.png',fullPage:false});

 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('pg-hsk2-life-course-v1')).completed),[0]);
 await page.reload();
 // The stored completion remains available through the catalog after reload.
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('pg-hsk2-life-course-v1')).completed),[0]);
 assert.match(await page.locator('[data-topic="0"]').innerText(),/1 \/ 3/);
 assert.deepEqual(errors,[],'No browser JS errors');
 console.log('PASS: HSK2 catalog, all twelve learning pages, seven tasks and persisted progress.');
 await context.close();
 }
}finally{await browser.close()}
