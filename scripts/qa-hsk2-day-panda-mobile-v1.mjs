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
 await page.goto(base+'/hsk2-life-course.html?view=map',{waitUntil:'domcontentloaded'});
 await page.locator('.approved-map-screen img[src$="/course-map.png"]').waitFor({state:'visible',timeout:12000});
 assert.equal(await page.locator('.poster-map-card[data-topic]').count(),10,'Exact approved map has 10 real links');
 fs.mkdirSync('qa/panda-voice-pilot',{recursive:true});
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-course-map-android.png',fullPage:false});
 await page.goto(base+'/hsk2-life-course.html?start=1&v=414',{waitUntil:'domcontentloaded'});
 // v432 approved lesson 1 starts on the user's full-height cover; enter
 // through its real accessible button instead of bypassing the artwork.
 await page.locator('.pg432-cover img[src$="/lesson1.jpg"]').waitFor({state:'visible',timeout:12000});
 await page.locator('[data-pg432-cover-start]').click();
 await page.locator('.pg414-vocab-row').first().waitFor({state:'visible',timeout:12000});
 assert.equal(await page.locator('.pg414-vocab-row').count(),7);
 assert.equal(await page.locator('.pg415-art-screen [data-day-next]').count(),1);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-lesson-android.png',fullPage:false});
 await page.locator('[data-day-next]').click(); // rule
 assert.equal(await page.locator('.pg415-step-1,.pg414-rule').count(),1);
 await page.locator('[data-day-next]').click(); // speech
 assert.equal(await page.locator('.pg414-speech-row').count(),7);
 await page.locator('[data-day-next]').click(); // seven-question test
 assert.equal(await page.locator('.pg414-question').count(),3);
 await page.locator('[data-day-quiz="0:1"]').click();
 await page.locator('[data-day-quiz="1:0"]').click();
 for(let i=0;i<3;i++){await page.locator('[data-day-pair-left="'+i+'"]').click();await page.locator('[data-day-pair-right="'+i+'"]').click();}
 await page.locator('[data-pg418-test-next]').click();
 assert.equal(await page.locator('.pg414-question').count(),2);
 await page.locator('[data-day-listen="0"]').click();
 for(let i=0;i<4;i++)await page.locator('[data-day-token="'+i+'"]').click();
 await page.locator('[data-pg418-test-next]').click();
 assert.equal(await page.locator('.pg414-question').count(),2);
 await page.locator('[data-day-fill="0"]').click();
 await page.locator('[data-day-truth="true"]').click();
 assert.match(await page.locator('.pg414-test .pg414-progress').textContent(),/7\/7/);
 await page.locator('[data-day-next]').click(); // examples
 assert.equal(await page.locator('.pg414-example-large').count(),3);
 await page.locator('[data-day-next]').click(); // Panda AI
 assert.match(await page.locator('.day-ai-panel a').getAttribute('href'),/practice=day&mini=0/);
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-done-android.png',fullPage:false});
 await page.goto(base+'/panda-voice-pilot.html?practice=day&mini=0',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:18000});
 assert.match(await page.locator('.pg346-title').innerText(),/Мой день/);
 await page.locator('.pg346-main-zh').filter({hasText:'你早上做什么？'}).waitFor({timeout:10000});
 for(const [answer,nextQuestion] of [
  ['我每天七点起床。','你起床以后做什么？'],
  ['我早上洗脸。','你上午做什么？'],
  ['我早上吃早饭。','做得好！']
 ]){
  await page.locator('#pg346-input').fill(answer);
  await page.locator('#pg346-send').click();
  await page.locator('.pg346-main-zh').filter({hasText:nextQuestion}).waitFor({timeout:10000});
 }
 const back=await page.locator('.pg346-back').getAttribute('href');
  const returnUrl=new URL(back,base+'/');
  assert(returnUrl.pathname.endsWith('/hsk2-life-course.html'),'The Panda back link must return to HSK2');
  assert(returnUrl.searchParams.get('topic')==='0'||
    (returnUrl.searchParams.get('from')==='hsk2-life-course'&&returnUrl.searchParams.get('return')==='done'&&returnUrl.searchParams.get('mini')==='0'),
    'Back link must point to the approved HSK2 day page or completed lesson');
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-panda-android.png',fullPage:false});
 assert.deepEqual(errors,[],'No browser JS errors');
 console.log('PASS: Android 393x852: day micro-lesson, grammar/test/voice, completion AI link, three contextual Panda AI prompts, return to course.');
 await context.close();
}finally{await browser.close()}
