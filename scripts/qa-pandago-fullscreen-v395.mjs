import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const sizes=[{width:360,height:800},{width:393,height:852},{width:412,height:915}];
const errors=[];
fs.mkdirSync('qa/pandago-fullscreen-v395',{recursive:true});

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
  const bastianBg=await page.locator('.bs394-page:not([hidden])').evaluate(n=>getComputedStyle(n,'::before').backgroundImage);
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
  await page.locator('#next').click(); // after 10 words comes 10x5 speaking
  assert.match(await page.locator('#step-title').innerText(),/2 · Произношение 5 раз/);
  assert.equal(await page.locator('.pg397-tile').count(),10,'Ten Bastian words on one screen');
  assert.equal(await page.locator('.pg397-dot').count(),50,'Five real attempt slots per word');
  assert.equal(await page.locator('.pg397-dot.ok,.pg397-dot.bad').count(),0,'No false check marks');
  assert.equal(await page.locator('#toggle-py').isVisible(),true,'Toggle pinyin is visible');
  assert.equal(await page.locator('.pg397-pinyin').count(),10);
  await page.locator('#toggle-py').click();
  assert.equal(await page.locator('.pg397-pinyin').count(),0);
  await page.locator('#toggle-py').click();
  assert.equal(await page.locator('.pg397-pinyin').count(),10);
  assert.equal(await page.locator('#next').isDisabled(),true,'No false completion until 50 attempts or explicit skip');
  const area=await page.locator('#practice').boundingBox();
  const tileGrid=await page.locator('.pg397-grid').boundingBox();
  assert.ok(tileGrid && area && tileGrid.y>=area.y-2 && tileGrid.y+tileGrid.height<=area.y+area.height+3,'Speaking grid remains inside phone viewport');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/bastian-voice-five-'+tag+'.png',fullPage:false});
  await page.locator('[data-voice-skip]').click();
  await page.locator('[data-voice-skip-confirm]').click();
  assert.equal(await page.locator('#next').isDisabled(),false);
  await page.locator('#next').click();
  assert.match(await page.locator('#step-title').innerText(),/Грамматика/);


  await page.goto(base+'/hsk2-life-course.html?view=map',{waitUntil:'domcontentloaded'});
  await page.locator('.pgc-feature-day').click();
  await page.waitForURL(url=>url.pathname.endsWith('/hsk2-lesson1.html'));
  const cover=page.getByRole('button',{name:'Начать урок',exact:true});
  await cover.waitFor();
  const hit=await cover.boundingBox();
  assert(hit&&hit.width>=35&&hit.height>=30&&hit.y+hit.height<=height+1,'Start control fits the approved day cover');
  await page.screenshot({path:'qa/pandago-fullscreen-v395/day-'+tag+'.png',fullPage:false});
  await cover.click();
  await page.waitForURL(url=>url.searchParams.get('step')==='2');
  assert.deepEqual(errors,[],'No JS errors: '+tag);
  console.log('PASS '+tag+': Bastian practice and current fullscreen My Day cover with a working start button.');
  await context.close();
 }
}finally{await browser.close()}
