import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';



const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/hsk2-v418',{recursive:true});
try{
 for(const vp of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
  const tag=vp.width+'x'+vp.height;
  const context=await browser.newContext({viewport:vp,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/hsk2-life-course.html?start=1&v=418',{waitUntil:'domcontentloaded'});
  async function capture(part,selector='.pg415-art-screen'){
   await page.locator(selector+' .pg415-art').evaluate(async im=>{await im.decode()});
   const geo=await page.locator(selector).evaluate(el=>{
    const outer=document.querySelector('#screen').getBoundingClientRect(),img=el.querySelector('.pg415-art').getBoundingClientRect();
    return [outer.width,outer.height,img.width,img.height];
   });
   assert.ok(geo[2]>=geo[0]*.98 && geo[3]>=geo[1]*.98,'Letterbox '+tag+' '+part+': '+geo);
   await page.screenshot({path:'qa/hsk2-v418/'+tag+'-'+part+'.png',fullPage:false});
  }
  await capture('01-words');
  await page.locator('[data-day-next]').click();
  await capture('02-rule');
  assert.equal(await page.locator('.pg415-rule-notice').count(),0,'Old yellow floating rectangle');
  const art=await page.locator('.pg415-graphic').boundingBox(),exercise=await page.locator('.pg418-rule-exercise').boundingBox();
  assert.ok(exercise.y-art.y<art.height*.76,'Exercise remains too low');
  assert.equal(await page.locator('.pg418-rule-options button').count(),2);
  await page.locator('[data-day-rule-choice="0"]').click();
  assert.equal(await page.locator('.pg395-pulse').count(),0);
  await page.locator('[data-day-next]').click();await capture('03-speech');
  await page.locator('[data-day-next]').click();await capture('04-test-1');
  assert.equal(await page.locator('.pg414-question').count(),3);
  await page.locator('[data-day-quiz="0:1"]').click();
  await page.locator('[data-day-quiz="1:0"]').click();
  for(let i=0;i<3;i++){await page.locator('[data-day-pair-left="'+i+'"]').click();await page.locator('[data-day-pair-right="'+i+'"]').click();}
  await page.locator('[data-pg418-test-next]').click();await capture('04-test-2');
  assert.equal(await page.locator('.pg414-question').count(),2);
  await page.locator('[data-pg418-test-prev]').first().click();
  assert.equal(await page.locator('.pg414-pairs button.correct').count(),6,'Answers lost after navigating backward');
  await page.locator('[data-pg418-test-next]').click();
  await page.locator('[data-day-listen="0"]').click();
  for(let i=0;i<4;i++)await page.locator('[data-day-token="'+i+'"]').click();
  await page.locator('[data-pg418-test-next]').click();await capture('04-test-3');
  assert.equal(await page.locator('.pg414-question').count(),2);
  await page.locator('[data-day-fill="0"]').click();await page.locator('[data-day-truth="true"]').click();
  assert.match(await page.locator('.pg414-progress').innerText(),/7\/7/);
  await page.locator('[data-day-next]').click();await capture('05-examples');
  await page.locator('[data-day-next]').click();await capture('06-panda-ai','.pg415-ai-screen');
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS HSK2 Android three-page test and raised grammar '+tag);
 }
}finally{await browser.close()}
