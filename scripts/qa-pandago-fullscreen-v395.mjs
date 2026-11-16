import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const sizes=[{width:360,height:800},{width:393,height:852},{width:412,height:915}];
const errors=[];
fs.mkdirSync('qa/pandago-fullscreen-v395',{recursive:true});

async function visibleArt(page,selector,tag){
 await page.locator(selector+' .approved-art.ready').waitFor({state:'visible',timeout:30000});
 const result=await page.locator(selector).evaluate(node=>{
  const box=node.getBoundingClientRect();
  const art=node.querySelector('.approved-art').getBoundingClientRect();
  const bg=getComputedStyle(node,'::before');
  return {h:box.height,background:bg.backgroundImage,display:bg.display,artH:art.height,artW:art.width};
 });
 assert.ok(result.h>400,tag+' should be a full screen container');
 assert.ok(result.background.includes('url('),'Approved scenic extension should be visible on '+tag);
 assert.notEqual(result.display,'none','Scenic extension must not be hidden '+tag);
 assert.ok(result.artW>0&&result.artH>0,'Original artwork remains visible '+tag);
 return result;
}
async function tapFeedback(page,sel,tag){
 const el=page.locator(sel).first();
 await el.waitFor({state:'visible'});
 await el.dispatchEvent('pointerdown',{pointerType:'touch',clientX:0,clientY:0});
 assert.equal(await el.evaluate(e=>e.classList.contains('pg395-active')),true,tag+' should display pressed state');
 assert.ok(await page.locator('.pg395-pulse').count()>0,tag+' should give a persistent tap pulse');
}
try{
 for(const {width,height} of sizes){
  const tag=width+'x'+height;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ru-RU'});
  const page=await context.newPage();
  page.on('pageerror',err=>errors.push(tag+': '+err.message));

  await page.goto(base+'/hsk2-bastian-intro.html?test=v395',{waitUntil:'domcontentloaded'});
  await page.locator('.bs394-page:not([hidden]) .bs396-layout .bs396-phrases img').waitFor({state:'visible',timeout:16000});
  assert.equal(await page.locator('.bs394-page:not([hidden]) .bs396-crop').count(),3,'Page one contains original header, face and four phrase cards');
  assert.ok((await page.locator('.bs396-layout').first().boundingBox()).height>450,'Portrait reflow fills available screen space');
  assert.equal(await page.locator('.bs394-page:not([hidden])').count(),1);
  const bastianBg=await page.locator('.bs394-page:not([hidden])').evaluate(n=>getComputedStyle(n).backgroundImage);
  assert.match(bastianBg,/bastian-approved-reference-v5/,'Portrait layout uses original approved Bastian background');
  await tapFeedback(page,'.bs394-page:not([hidden]) .bs394-next','Bastian page 1');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/bastian1-'+tag+'.png',fullPage:false});
  await page.locator('.bs394-page:not([hidden]) .bs394-next').click();
  assert.match(await page.locator('.bs394-page:not([hidden]) .bs394-bar').innerText(),/2 \/ 2/);
  assert.equal(await page.locator('#poster .bs394-page:visible').count(),1,'Only the second Bastian slide may be visible');
  assert.equal(await page.locator('.bs394-page:not([hidden]) .bs396-grammar').isVisible(),true,'Page 2 must contain grammar, not a duplicate of Page 1');
  assert.equal(await page.locator('.bs394-page:not([hidden]) .bs396-crop').count(),3,'Second page contains grammar, phonetics and lesson progress');
  assert.equal(await page.locator('.bs394-page:not([hidden]) .bs396-crop [data-term]').count(),4,'All four original tone-audio hotspots preserved');
  await tapFeedback(page,'.bs394-page:not([hidden]) .bs394-next','Bastian page 2');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/bastian2-'+tag+'.png',fullPage:false});
  await page.locator('.bs394-page:not([hidden]) .bs394-next').click();
  assert.equal(await page.locator('#practice').isVisible(),true,'Bastian practice must still work');

  await page.goto(base+'/hsk2-life-course.html?v=395',{waitUntil:'domcontentloaded'});
  await visibleArt(page,'.approved-welcome-screen',tag+' welcome');
  await tapFeedback(page,'.approved-welcome-screen .approved-program',tag+' course welcome button');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/welcome-'+tag+'.png',fullPage:false});
  await page.locator('.approved-welcome-screen .approved-program').click();
  await visibleArt(page,'.approved-map-screen',tag+' map');
  assert.equal(await page.locator('.approved-map-screen .poster-map-card[data-topic]').count(),10);
  await tapFeedback(page,'.approved-map-screen .poster-map-card[data-topic="0"]',tag+' map topic');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/map-'+tag+'.png',fullPage:false});
  await page.locator('.approved-map-screen .poster-map-card[data-topic="0"]').click();
  await page.locator('[data-mini="0"]').first().click();
  await visibleArt(page,'.day-visual-start',tag+' day lesson');
  await tapFeedback(page,'.day-visual-start .art-next',tag+' day next button');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/day-'+tag+'.png',fullPage:false});
  await page.locator('.day-visual-start .art-next').click();
  assert.equal(await page.locator('.day-vword').count(),7,'Full real word breakdown available after artwork');
  assert.equal(await page.locator('#day-fixed-actions [data-day-next]').count(),1,'Real step navigation preserved');

  assert.deepEqual(errors,[],'No JS errors: '+tag);
  console.log('PASS '+tag+': Bastian 2 pages, three approved image screens, 5 visible tap highlights, real word practice.');
  await context.close();
 }
}finally{await browser.close()}
