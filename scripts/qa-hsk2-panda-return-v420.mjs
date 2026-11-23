// Current HSK2 day storyboard completion -> approved Panda AI -> same completion screen.
// The previous test targeted retired .pg415-art-screen UI and therefore timed out.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const root=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const destination='qa/hsk2-panda-return-v420';
fs.mkdirSync(destination,{recursive:true});

async function expectDone(page,mini){
 await page.locator('.pg433-root.pg433-done').waitFor({state:'visible',timeout:20000});
 const title=await page.locator('.pg433-done h2').first().textContent();
 assert.match(title,/Panda AI/,'Approved current completion page must explain the next step');
 assert.equal(await page.locator('.pg433-done .pg433-sentence').count(),2,
  'Current HSK2 completion keeps both Mandarin questions with translations and pinyin');
 const sentences=page.locator('.pg433-done .pg433-sentence');
 for(let i=0;i<2;i++){
  assert.ok((await sentences.nth(i).locator('.pg433-hanzi').count())>0,'Chinese sentence missing');
  assert.ok((await sentences.nth(i).locator('.pg433-py').textContent()).trim(),'Pinyin missing');
  assert.ok((await sentences.nth(i).locator('div > small').textContent()).trim(),'Translation missing');
 }
 const a=page.locator('.pg433-done a.pg433-ai-link');
 assert.equal(await a.count(),1,'One real Panda AI entry link on the current completion screen');
 const href=await a.getAttribute('href');
 assert.match(href,new RegExp('practice=day&mini='+mini+'(?:&|$)'));
 assert.match(href,/from=hsk2-life-course/);
 assert.match(href,/return=done/);
 return a;
}
try{
 for(const viewport of [{width:360,height:800},{width:393,height:852},{width:412,height:915}]){
  const label=viewport.width+'x'+viewport.height;
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini=0&v=420',
   {waitUntil:'load'});
  const link=await expectDone(page,0);
  await page.screenshot({path:destination+'/'+label+'-approved-hsk2-completion.png',fullPage:false});
  await link.click();
  await page.waitForURL(/panda-voice-pilot\.html/,{timeout:20000});
  await page.locator('#pg346').waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  const back=page.locator('a.pg346-back');
  await back.waitFor({state:'visible'});
  const href=await back.getAttribute('href');
  assert.match(href,/hsk2-life-course\.html\?from=hsk2-life-course&return=done&mini=0/);
  assert.ok(!href.includes('topic=0'),'Back must go to completion, not the topic map');
  for(const id of ['pg346-input','pg346-send','pg346-mic']){
   const element=page.locator('#'+id);
   await element.waitFor({state:'visible'});
   const rect=await element.boundingBox();
   assert.ok(rect&&rect.width>0&&rect.height>0&&rect.x>=-1&&
    rect.x+rect.width<=viewport.width+2,'Panda AI control outside viewport: '+id);
  }
  await page.screenshot({path:destination+'/'+label+'-full-panda-chat.png',fullPage:false});
  await back.click();
  await page.waitForURL(/hsk2-life-course\.html/,{timeout:20000});
  await expectDone(page,0);
  assert.equal(await page.locator('.topic').count(),0,'Back must not open the topic list');
  await page.screenshot({path:destination+'/'+label+'-returned-to-same-screen.png',fullPage:false});
  assert.deepEqual(errors,[],'No browser errors '+label);
  await context.close();
  console.log('PASS current HSK2 completion and Panda AI exact return at '+label);
 }
 for(const mini of [1,2]){
  const context=await browser.newContext({viewport:{width:393,height:852}});
  const page=await context.newPage();
  await page.goto(root+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini='+mini+'&v=420',
   {waitUntil:'load'});
  await expectDone(page,mini);
  await context.close();
 }
 const standard=await browser.newPage();
 await standard.goto(root+'/panda-voice-pilot.html?lesson=1',{waitUntil:'load'});
 await standard.locator('a.pg346-back').waitFor({state:'visible',timeout:20000});
 assert.match(await standard.locator('a.pg346-back').getAttribute('href'),
  /panda-lesson1\.html/,'HSK1 return must remain unchanged');
 await standard.close();
} finally {
 await browser.close();
}
console.log('PASS current HSK2 day completion links, Android widths and HSK1 back destination');
