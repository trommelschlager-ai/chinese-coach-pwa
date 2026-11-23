// Regression against the CURRENT approved HSK2 day storyboard (v439).
// The welcome CTA intentionally routes to the separate "О себе" lesson.
// Exercise the genuine 12-page day mini-lesson via its persisted resume state,
// including the seven graded items, real navigation, screenshots and completion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const folder='qa/hsk2-v414-six-screens';
fs.mkdirSync(folder,{recursive:true});
try {
 for(const size of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
  const tag=size.width+'x'+size.height,errors=[];
  const context=await browser.newContext({
   viewport:size,deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
  await context.addInitScript(()=>{
   localStorage.setItem('pg-hsk2-life-course-v1',JSON.stringify({
    completed:[],difficult:[],showPy:true,examPassed:false,
    resume:{topic:0,mini:0,stage:0,stepOrderV413:true,wordOrderV414:true}
   }));
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/hsk2-life-course.html?v=439',{waitUntil:'load'});
  assert.equal(response?.status(),200);
  await page.locator('#pg433.pg433-root').waitFor({state:'visible'});
  const stage=page.locator('#pg433');
  const content=page.locator('#pg433-content');
  async function checkPage(n,shot){
   await page.waitForFunction(expected=>document.querySelector('.pg433-counter')?.textContent.trim()===expected,
    (n+1)+' / 12');
   assert.ok(await content.isVisible(),'Current approved teaching content must be visible');
   const result=await page.evaluate(()=>{
    const art=document.querySelector('#pg433');
    const b=art.getBoundingClientRect();
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      box:{x:b.x,y:b.y,width:b.width,height:b.height}};
   });
   assert.ok(result.scrollWidth<=size.width+2,'No horizontal overflow '+tag+' page '+n);
   assert.ok(result.box.width>=size.width*.82,'Mobile teaching surface too narrow '+tag);
   assert.equal(await page.locator('.pg433-title strong').textContent(),'Мой день');
   if(shot)await page.screenshot({path:folder+'/'+tag+'-'+shot+'.png',fullPage:false});
  }
  async function next(n,shot){const btn=page.locator('[data-pg433-next]');
   assert.equal(await btn.isDisabled(),false,'Page '+n+' is ready to advance');
   await btn.click();await checkPage(n+1,shot);
  }
  await checkPage(0,'01-words');
  assert.equal(await content.locator('.pg433-wordrow').count(),4,'Word page 1 has four words');
  await next(0,'01-words-continued');
  assert.equal(await content.locator('.pg433-wordrow').count(),3,'Word page 2 has three words');
  await next(1,'02-rule');
  assert.ok((await content.textContent()).includes('七点'));
  await next(2,'02-rule-practice');
  await page.locator('[data-day-rule-choice="0"]').click();
  await next(3,'03-speech');
  assert.equal(await content.locator('.pg433-speechrow').count(),4);
  await next(4,'03-speech-continued');
  assert.equal(await content.locator('.pg433-speechrow').count(),3);
  await next(5,'04-test-1');
  assert.equal(await content.locator('.pg433-quiz').count(),2);
  for(const choice of ['0:1','1:0']){
   await page.locator('[data-day-quiz="'+choice+'"]').click();
  }
  assert.equal(await page.locator('[data-pg433-next]').isDisabled(),false,'Correct questions must unlock next');
  await next(6,'04-test-2');
  for(let i=0;i<3;i++){
   await page.locator('[data-day-pair-left="'+i+'"]').click();
   await page.locator('[data-day-pair-right="'+i+'"]').click();
  }
  assert.match(await content.textContent(),/3\/3/);
  await next(7,'04-test-3');
  await page.locator('[data-day-listen="0"]').click();
  const builder=await page.evaluate(()=>window.PandaGoDayModulesV391[0].builder);
  assert.ok(builder.length>=4);
  for(let i=0;i<builder.length;i++)await page.locator('[data-day-token="'+i+'"]').click();
  await next(8,'04-test-4');
  await page.locator('[data-day-fill="0"]').click();
  await page.locator('[data-day-truth="true"]').click();
  await next(9,'05-examples');
  assert.ok(await content.locator('.pg433-sentence').count()>=2);
  await next(10,'05-dialogue');
  assert.equal(await content.locator('.pg433-chat').count(),4);
  const complete=page.locator('[data-pg433-next]');
  await complete.click();
  await page.locator('#pg433.pg433-done').waitFor({state:'visible'});
  assert.match(await page.locator('.pg433-ai-link').getAttribute('href'),/practice=day&mini=0/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pg-hsk2-life-course-v1')));
  assert.ok(saved.completed.includes(0),'Successful seven-item test must save completion');
  await page.screenshot({path:folder+'/'+tag+'-06-panda-ai.png',fullPage:false});
  assert.deepEqual(errors,[],'Browser errors at '+tag);
  console.log('PASS HSK2 approved storyboard: 7 words, full grammar, mic screens, 7 tasks, dialogue, Panda AI at '+tag);
  await context.close();
 }
} finally {await browser.close()}
