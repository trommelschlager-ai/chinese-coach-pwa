import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/panda-hsk2-back-v419',{recursive:true});
try {
 for(const size of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
  const tag=size.width+'x'+size.height;
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'ru-RU'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  // Navigate directly to the screen where the user hands over to Panda AI.
  await page.goto(base+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini=0&v=419',{waitUntil:'domcontentloaded'});
  await page.locator('.pg415-ai-screen').waitFor();
  await page.locator('.pg415-ai-screen .pg415-art').evaluate(async im=>{await im.decode()});
  assert.equal(await page.locator('.pg415-ai-submit').textContent(),'➤','Checkmark should be a send arrow');
  assert.equal(await page.locator('.pg415-ai-feedback').count(),1,'Keep accessible feedback');
  const hidden=await page.locator('.pg415-ai-feedback').evaluate(el=>{const r=el.getBoundingClientRect();return r.width<=2&&r.height<=2});
  assert.ok(hidden,'Redundant beige feedback strip must not be visible');
  await page.screenshot({path:'qa/panda-hsk2-back-v419/'+tag+'-01-panda-sixth-screen.png',fullPage:false});

  // The back button inside the sixth screen must take student to exactly the last examples step.
  await page.locator('.pg415-ai-back').click();
  await page.locator('.pg415-step-4').waitFor();
  assert.equal(await page.locator('.pg415-ai-screen').count(),0,'Should not restart the lesson or open topic map');
  assert.equal(await page.locator('.pg415-step-4 .pg415-art').count(),1,'Must return to examples 5/5');

  // Navigate again to the completed lesson and enter the separate full Panda chat.
  await page.goto(base+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini=0&v=419',{waitUntil:'domcontentloaded'});
  await page.locator('.pg415-ai-next').click();
  await page.waitForURL(/panda-voice-pilot\.html\?.*practice=day/);
  await page.locator('.pg346-back').waitFor({state:'visible',timeout:20000});
  const href=await page.locator('.pg346-back').getAttribute('href');
  assert.match(href,/hsk2-life-course\.html\?from=hsk2-life-course&return=done&mini=0/,'Panda must return to exact prior screen, not topic list');
  await page.locator('.pg346-back').click();
  await page.locator('.pg415-ai-screen').waitFor({timeout:15000});
  assert.equal(await page.locator('.topic').count(),0,'Must not return to course topic map');
  await page.screenshot({path:'qa/panda-hsk2-back-v419/'+tag+'-02-returned-to-exact-screen.png',fullPage:false});
  assert.deepEqual(errors,[],'JS errors on Android '+tag);
  await context.close();
  console.log('PASS Panda HSK2 precise back link and single chat row '+tag);
 }
}finally{await browser.close();}
