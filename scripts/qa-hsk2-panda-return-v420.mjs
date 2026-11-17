import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const root=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/hsk2-panda-return-v420',{recursive:true});
try{
 for(const viewport of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
  const label=viewport.width+'x'+viewport.height;
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(root+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini=0&v=420',{waitUntil:'domcontentloaded'});
  await page.locator('.pg415-ai-screen').waitFor({state:'visible'});
  await page.locator('.pg415-ai-screen .pg415-art').evaluate(async img=>{
   await img.decode();
   if(img.naturalWidth!==941||img.naturalHeight!==1672)throw Error('Approved Panda chat artwork not loaded');
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
  const composer=page.locator('.pg415-ai-answer');
  assert.equal(await composer.count(),1,'Exactly one answer field');
  assert.equal(await composer.locator('input').count(),1,'Single Chinese input');
  const send=composer.locator('button[data-pg414-send]');
  assert.equal(await send.count(),1,'Real send control');
  assert.match(await send.innerText(),/➤/,'Send icon must replace yellow check mark');
  const style=await send.evaluate(el=>({background:getComputedStyle(el).backgroundColor,zIndex:getComputedStyle(el).zIndex}));
  assert.ok(Number(style.zIndex)>=20,'Send icon must cover baked-in check mark');
  const status=await page.locator('#pg414-ai-feedback').evaluate(el=>({
    width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
    clip:getComputedStyle(el).clipPath
  }));
  assert.ok(status.width<=2&&status.height<=2,'Duplicate bottom status bar must be visually hidden: '+JSON.stringify(status));
  await page.screenshot({path:'qa/hsk2-panda-return-v420/'+label+'-approved-ai-clean.png',fullPage:false});
  const link=page.locator('a.pg415-ai-next');
  assert.match(await link.getAttribute('href'),/practice=day&mini=0.*return=done/);
  await link.click();
  await page.waitForURL(/panda-voice-pilot\.html/,{timeout:20000});
  await page.locator('a.pg346-back').waitFor({state:'visible',timeout:20000});
  const href=await page.locator('a.pg346-back').getAttribute('href');
  assert.match(href,/hsk2-life-course\.html\?from=hsk2-life-course&return=done&mini=0/);
  assert.ok(!href.includes('topic=0'),'Chat must not return to the topic list');
  await page.screenshot({path:'qa/hsk2-panda-return-v420/'+label+'-full-panda-chat.png',fullPage:false});
  await page.locator('a.pg346-back').click();
  await page.waitForURL(/hsk2-life-course\.html/,{timeout:20000});
  await page.locator('.pg415-ai-screen').waitFor({state:'visible',timeout:20000});
  await page.locator('.pg415-ai-screen .pg415-art').evaluate(async img=>{
   await img.decode();
   if(img.naturalWidth!==941||img.naturalHeight!==1672)throw Error('Approved Panda chat artwork not loaded');
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
  assert.equal(await page.locator('.topic').count(),0,'Return must not land on the mini-lesson list');
  const pixels=await page.locator('.pg415-ai-screen .pg415-art').evaluate(img=>({complete:img.complete,width:img.naturalWidth,height:img.naturalHeight}));
  assert.equal(pixels.width,941);assert.equal(pixels.height,1672);
  await page.screenshot({path:'qa/hsk2-panda-return-v420/'+label+'-returned-to-same-screen.png',fullPage:false});
  assert.deepEqual(errors,[],'No browser errors '+label);
  await context.close();console.log('PASS precise return + clear answer row/send icon at '+label);
 }
 // Lessons 2 and 3 keep the exact mini-lesson context.
 for(const mini of [1,2]){
  const context=await browser.newContext({viewport:{width:393,height:852}});
  const page=await context.newPage();
  await page.goto(root+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini='+mini+'&v=420',{waitUntil:'domcontentloaded'});
  await page.locator('.pg414-ai[data-mini="'+mini+'"]').waitFor({state:'visible'});
  await context.close();
 }
 // HSK1 retains its normal Back destination.
 const standard=await browser.newPage();
 await standard.goto(root+'/panda-voice-pilot.html?lesson=1',{waitUntil:'domcontentloaded'});
 await standard.locator('a.pg346-back').waitFor({state:'visible',timeout:20000});
 const standardBack=await standard.locator('a.pg346-back').getAttribute('href');
 assert.match(standardBack,/panda-lesson1\.html/,'No HSK1 regression');
 await standard.close();
}finally{await browser.close()}
console.log('PASS all HSK2 back links; HSK1 unchanged');
