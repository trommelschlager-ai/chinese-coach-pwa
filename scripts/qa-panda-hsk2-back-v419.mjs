import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const dir='qa/panda-hsk2-back-v419';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [mini,width] of [360,393,412].entries()){
  const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/hsk2-life-course.html?from=hsk2-life-course&return=done&mini='+mini);
  const done=page.locator('.pg433-done');
  const chapter=await done.locator('.pg433-pill').innerText();
  await done.locator('[data-pg419-ai-back]').click();
  assert.equal(await page.locator('.pg433-counter').innerText(),'12 / 12');
  assert.equal(await page.locator('.pg433-pill').innerText(),chapter);
  assert.equal(await page.locator('.pg433-chat').count(),4);
  await page.locator('[data-pg433-prev]').click();
  assert.equal(await page.locator('.pg433-counter').innerText(),'11 / 12');
  assert.equal(await page.locator('.pg433-sentence').count(),3);
  await page.locator('[data-pg433-next]').click();
  await page.screenshot({path:dir+'/'+width+'-previous-dialogue.png'});
  await page.locator('[data-pg433-next]').click();
  await done.locator('.pg433-ai-link').click();
  await page.locator('a.pg346-back').click();
  await done.waitFor();
  assert.equal(await done.locator('.pg433-pill').innerText(),chapter);
  assert.deepEqual(errors,[]);
  await context.close();
 }
}finally{await browser.close()}
console.log('PASS HSK2 back navigation from completion to dialogue and from Panda AI to the same mini-lesson');
