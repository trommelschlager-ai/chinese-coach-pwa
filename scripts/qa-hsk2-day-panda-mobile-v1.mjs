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
 await page.goto(base+'/hsk2-life-course.html?start=1',{waitUntil:'domcontentloaded'});
 await page.locator('.day-visual-start img[src$="/day-lesson.png"]').waitFor({state:'visible',timeout:12000});
 await page.screenshot({path:'qa/panda-voice-pilot/hsk2-day-art-android.png',fullPage:false});
 await page.locator('[data-day-show-words]').first().click();
 await page.locator('.day-title').waitFor({state:'visible',timeout:12000});
 assert.match(await page.locator('.day-title').innerText(),/Мой распорядок дня/);
 assert.equal(await page.locator('.day-vword').count(),7);
 const footerBox=await page.locator('#day-fixed-actions').boundingBox();
 const contentBox=await page.locator('#screen').boundingBox();
 assert.ok(footerBox&&contentBox,'Navigation and content must each have a box');
 assert.ok(footerBox.y>=contentBox.y+contentBox.height-2,'Fixed navigation must never overlap Chinese study content');
 assert.equal(await page.locator('#day-fixed-actions [data-day-next]').count(),1);
 const pendingAudio=await page.locator('.day-audio-pending').count();
  const recordedExample=await page.locator('.day-recorded-example').count();
  assert.ok(pendingAudio+recordedExample>0,'Absent standalone word MP3 must either show an honest warning or a separately labelled recorded SENTENCE');
  if(recordedExample){
    const example=page.locator('.day-recorded-example').first();
    assert.match(await example.textContent(),/Запись предложения/,'A recorded sentence must be explicitly labelled in the source');
    assert.match(await example.locator('button[data-sound]').getAttribute('aria-label'),/Слушать пример/,'Playback must announce a sentence example to screen readers');
  }
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
