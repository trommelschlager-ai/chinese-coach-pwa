import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],sizes=[{width:360,height:800},{width:393,height:852},{width:412,height:915}];
fs.mkdirSync('qa/hsk2-approved-v391',{recursive:true});
try{
 for(const {width,height} of sizes){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
  const page=await ctx.newPage();
  page.on('pageerror',error=>errors.push(width+': '+error.message));
  const tag=width+'x'+height;
  await page.goto(base+'/hsk2-life-course.html?v=391',{waitUntil:'domcontentloaded'});
  await page.locator('.approved-welcome-screen .approved-art.ready').waitFor({state:'visible',timeout:25000});
  // NEW user-approved poster 842×1867 replaces the old 941×1672
  // artwork AND its decorative sky/lake letterboxes.
  const picture=await page.locator('.approved-welcome-screen').evaluate(node=>{
   const stage=node.getBoundingClientRect(),art=node.querySelector('.approved-art').getBoundingClientRect(),image=node.querySelector('img');
   return {stage:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},
    art:{x:art.x,y:art.y,w:art.width,h:art.height},
    image:{width:image.naturalWidth,height:image.naturalHeight},
    before:getComputedStyle(node,'::before').display,
    after:getComputedStyle(node,'::after').display};
  });
  assert.deepEqual(picture.image,{width:842,height:1867},'Exact new 842×1867 PNG '+tag);
  assert.equal(picture.before,'none','No duplicate sky or strip at the top '+tag);
  assert.equal(picture.after,'none','No duplicate lake or strip at the bottom '+tag);
  assert.ok(Math.abs(picture.art.w/picture.art.h-842/1867)<0.002,'No stretching of illustrated objects '+tag);
  assert.ok(picture.stage.y>=-0.5&&picture.stage.y+picture.stage.h>=height-0.5,'Full-height welcome stage '+tag);
  assert.ok(picture.art.x<=0.5&&picture.art.y<=0.5&&picture.art.x+picture.art.w>=width-0.5&&picture.art.y+picture.art.h>=height-0.5,
   'One continuous full-screen image, no upper/lower blank regions '+tag+' '+JSON.stringify(picture));
  for(const selector of ['.approved-program','.approved-start','.poster-welcome-ai','.poster-welcome-ai-card']){
   const hit=await page.locator('.approved-welcome-screen '+selector).boundingBox();
   assert.ok(hit&&hit.width>=35&&hit.height>=30&&hit.x>=-1&&hit.y>=-1&&hit.x+hit.width<=width+1&&hit.y+hit.height<=height+1,
    'Clickable hotspot inside visible artwork '+tag+' '+selector);
  }
  await page.screenshot({path:'qa/hsk2-approved-v391/welcome-'+tag+'.png',fullPage:false});
  await page.locator('.approved-program').click();
  assert.equal(await page.locator('.poster-map-card[data-topic]').count(),10);
  await page.locator('.approved-map-screen .approved-art.ready').waitFor({state:'visible',timeout:25000});
  await page.screenshot({path:'qa/hsk2-approved-v391/map-'+tag+'.png',fullPage:false});
  const mapMargins=await page.locator('.approved-map-screen').evaluate(node=>({
    top:parseFloat(getComputedStyle(node,'::before').height),
    bottom:parseFloat(getComputedStyle(node,'::after').height),
    topImage:getComputedStyle(node,'::before').backgroundImage,
    bottomImage:getComputedStyle(node,'::after').backgroundImage
  }));
  assert.ok(mapMargins.top>=12&&mapMargins.bottom>=12,'Map sky and lake reach phone edges '+tag);
  assert.match(mapMargins.topImage,/sky-extension-v403/);
  assert.match(mapMargins.bottomImage,/lake-extension-v403/);

  for(const hit of await page.locator('.poster-map-card,.poster-map-nav').all()){
   const box=await hit.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Map hit fully visible '+tag);
  }
  await page.locator('.poster-map-card[data-topic="0"]').click();
  assert.match(await page.locator('.topic h1').innerText(),/распорядок дня/);
  await page.locator('[data-mini="0"]').first().click();
  await page.locator('.pg414-vocab-row').first().waitFor({state:'visible',timeout:25000});
  assert.equal(await page.locator('.pg414-vocab-row').count(),7,'First mini-lesson retains all seven words');
  assert.equal(await page.locator('.pg414-tabs span').count(),5,'Five interactive lesson stages');
  await page.screenshot({path:'qa/hsk2-approved-v391/art-'+tag+'.png',fullPage:false});
  await page.locator('[data-day-next]').click(); // rule
  assert.equal(await page.locator('.pg414-example-compact').count(),2);
  await page.locator('[data-day-next]').click(); // speech
  assert.equal(await page.locator('.pg414-speech-row').count(),7);
  await page.screenshot({path:'qa/hsk2-approved-v391/speech-'+tag+'.png',fullPage:false});
  await page.locator('[data-day-next]').click(); // test
  assert.equal(await page.locator('.pg414-question').count(),7);
  await page.locator('[data-day-quiz="0:1"]').click();
  await page.locator('[data-day-quiz="1:0"]').click();
  for(let i=0;i<3;i++){await page.locator('[data-day-pair-left="'+i+'"]').click();await page.locator('[data-day-pair-right="'+i+'"]').click();}
  await page.locator('[data-day-listen="0"]').click();
  for(let i=0;i<4;i++)await page.locator('[data-day-token="'+i+'"]').click();
  await page.locator('[data-day-fill="0"]').click();
  await page.locator('[data-day-truth="true"]').click();
  assert.match(await page.locator('.pg414-progress').innerText(),/7\/7/);
  await page.locator('[data-day-next]').click(); // examples
  assert.equal(await page.locator('.pg414-example-large').count(),3);
  await page.locator('[data-day-next]').click(); // Panda AI
  assert.match(await page.locator('.day-ai-panel a').getAttribute('href'),/practice=day&mini=0/);
  await page.screenshot({path:'qa/hsk2-approved-v391/ai-'+tag+'.png',fullPage:false});
  assert.deepEqual(errors,[],'No JS errors during HSK2 v414 first lesson '+tag);
  await page.goto(base+'/hsk2-bastian-intro.html');
  await page.locator('.bs394-page:not([hidden]) .bs396-phrases img').waitFor();
  await page.screenshot({path:'qa/hsk2-approved-v391/bastian-1-'+tag+'.png'});
  await page.locator('.bs394-page:not([hidden]) .bs394-next').click();
  const slice=await page.locator('.bs394-page:not([hidden]) .bs396-grammar').boundingBox();assert.ok(slice.width>100,'Second full-screen grammar art has real width');
  await page.screenshot({path:'qa/hsk2-approved-v391/bastian-2-'+tag+'.png'});
  await page.locator('.bs394-page:not([hidden]) .bs394-next').click();
  assert.ok(await page.locator('#practice').isVisible());
  await page.goto(base+'/index.html#panda/training');
  await page.waitForURL(/#panda\/home$/);
  await ctx.close();
 }
}finally{await browser.close()}
