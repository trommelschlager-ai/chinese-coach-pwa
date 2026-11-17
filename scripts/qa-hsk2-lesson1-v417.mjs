import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/hsk2-v417',{recursive:true});
try{
 for(const vp of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
 const tag=vp.width+'x'+vp.height,ctx=await browser.newContext({viewport:vp,deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/hsk2-life-course.html?start=1&v=416',{waitUntil:'domcontentloaded'});
 await page.locator('.pg415-art').first().waitFor();
 async function screenshot(name,root='.pg415-art-screen'){
  const met=await page.locator(root).evaluate(async e=>{
   const image=e.querySelector('.pg415-art');
   await image.decode();
   const a=image.getBoundingClientRect(),b=document.querySelector('#screen').getBoundingClientRect();
   return {w:a.width,h:a.height,sw:b.width,sh:b.height,srcW:image.naturalWidth,srcH:image.naturalHeight};
  });
  assert.equal(met.srcW,941);assert.equal(met.srcH,1672);
  assert.ok(met.w>=met.sw*.985,'Width does not fill '+name+' '+tag+JSON.stringify(met));
  assert.ok(met.h>=met.sh*.985,'Height does not fill '+name+' '+tag+JSON.stringify(met));
  assert.equal(await page.locator('.pg395-pulse').count(),0,'Unexpected yellow pulse');
  await page.screenshot({path:'qa/hsk2-v417/'+tag+'-'+name+'.png'});
  console.log('PASS full viewport '+name+' '+tag);
 }
 await screenshot('1-words');
 const missing=page.locator('.pg415-vocab-audio [data-missing-sound]');
 assert.ok(await missing.count()>0,'No honest missing-audio indicator');
 await missing.first().click();
 assert.match(await page.locator('#message').innerText(),/нет проверенной MP3-записи/);
 assert.equal(await page.locator('.pg395-pulse').count(),0);
 await page.locator('[data-day-next]').click();await screenshot('2-rule');
 await page.locator('[data-day-rule-choice="1"]').click();
 assert.equal(await page.locator('.pg395-pulse').count(),0);
 await page.locator('[data-day-rule-choice="0"]').click();
 await page.locator('[data-day-next]').click();await screenshot('3-speech');
 await page.locator('[data-day-next]').click();await screenshot('4-test');
 const box=page.locator('.pg415-live-test');
 const overflow=await box.evaluate(e=>e.scrollHeight-e.clientHeight);
 if(overflow>24){
  await box.evaluate(e=>e.scrollTop=Math.min(65,e.scrollHeight-e.clientHeight));
  const y=await box.evaluate(e=>e.scrollTop);
  await page.locator('[data-day-quiz="0:1"]').evaluate(el=>el.click());
  await page.waitForTimeout(80);
  assert.ok(Math.abs((await box.evaluate(e=>e.scrollTop))-y)<6,'Answer must not reset inner scrolling');
 }
 await page.locator('[data-day-quiz="0:1"]').click();
 await page.locator('[data-day-quiz="1:0"]').click();
 for(let i=0;i<3;i++){await page.locator('[data-day-pair-left="'+i+'"]').click();await page.locator('[data-day-pair-right="'+i+'"]').click()}
 await page.locator('[data-pg418-test-next]').click();
 assert.equal(await page.locator('.pg414-question').count(),2);
 await screenshot('4-test-2');
 await page.locator('[data-day-listen="0"]').click();
 for(let i=0;i<4;i++)await page.locator('[data-day-token="'+i+'"]').click();
 await page.locator('[data-pg418-test-next]').click();
 assert.equal(await page.locator('.pg414-question').count(),2);
 await screenshot('4-test-3');
 await page.locator('[data-day-fill="0"]').click();
 await page.locator('[data-day-truth="true"]').click();
 assert.match(await page.locator('.pg414-test .pg414-progress').innerText(),/7\/7/);
 await page.locator('[data-day-next]').click();await screenshot('5-examples');
 await page.locator('[data-day-next]').click();await screenshot('6-panda-ai','.pg415-ai-screen');
 assert.match(await page.locator('.pg415-ai-next').getAttribute('href'),/practice=day&mini=0/);
 assert.deepEqual(errors,[]);await ctx.close();
 }
}finally{await browser.close()}
