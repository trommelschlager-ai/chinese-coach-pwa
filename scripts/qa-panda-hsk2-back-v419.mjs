import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

// The approved completion screen changed from v415 artwork to v433 storyboard.
// Verify real navigation through current visible controls, not the removed v415 inputs.
const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const dir='qa/panda-hsk2-back-v419';
fs.mkdirSync(dir,{recursive:true});
try{
 for(const size of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
  const tag=size.width+'x'+size.height;
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'ru-RU'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const returnUrl=base+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini=0&v=419';
  await page.goto(returnUrl,{waitUntil:'load'});
  await page.locator('#pg433.pg433-done').waitFor({state:'visible'});
  assert.equal(await page.locator('.pg433-ai-link').count(),1,'Completion screen must offer a single Panda AI link');
  assert.equal(await page.locator('.pg433-done .pg433-sentence').count(),2,
   'Approved two questions remain on the completed day lesson');
  await page.screenshot({path:dir+'/'+tag+'-01-approved-completion.png',fullPage:false});
  // This exact back button previously did nothing on the approved v433 completion screen.
  await page.locator('.pg433-done [data-pg433-back]').click();
  await page.locator('#pg433-content').waitFor({state:'visible'});
  assert.match((await page.locator('.pg433-counter').textContent()).trim(),/^11\s*\/\s*12$/,
   'Back must return to examples, not restart words or open topic map');
  assert.match(await page.locator('#pg433-content h2').textContent(),/Примеры/);
  assert.equal(await page.locator('.pg433-done').count(),0);
  assert.equal(await page.locator('.topic').count(),0);
  await page.screenshot({path:dir+'/'+tag+'-02-examples-preserved.png',fullPage:false});
  // The completed lesson remains recoverable via the real Panda AI return URL.
  await page.goto(returnUrl,{waitUntil:'load'});
  await page.locator('.pg433-ai-link').click();
  await page.waitForURL(/panda-voice-pilot\.html\?.*practice=day/,{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  const back=page.locator('#pg346 a.pg346-back');
  await back.waitFor({state:'visible'});
  assert.match(await back.getAttribute('href'),/hsk2-life-course\.html\?from=hsk2-life-course&return=done&mini=0/,
   'Panda chat back link must retain lesson and mini index');
  assert.equal(await page.locator('#pg346-form').count(),1,'Only one real text composer exists');
  assert.equal(await page.locator('#pg346-send').count(),1,'Only one airplane send button exists');
  assert.equal(await page.locator('#pg346-input').count(),1,'Only one editable Mandarin input exists');
  await page.locator('#pg346-send').click();
  await page.locator('#pg346-input').waitFor({state:'visible'});
  assert.equal(await page.locator('#pg346').getAttribute('data-composer-open'),'true');
  await page.locator('#pg346-input').fill('你好');
  assert.equal(await page.locator('#pg346-input').inputValue(),'你好',
   'Mandarin text must stay editable until explicit send');
  await page.screenshot({path:dir+'/'+tag+'-03-panda-composer.png',fullPage:false});
  await back.click();
  await page.waitForURL(/hsk2-life-course\.html/,{timeout:20000});
  await page.locator('.pg433-done').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('.topic').count(),0,'No accidental route to topic map');
  assert.deepEqual(errors,[],'Browser errors on '+tag);
  await context.close();
  console.log('PASS current HSK2 completion back -> examples and Panda AI exact return '+tag);
 }
}finally{await browser.close();}
