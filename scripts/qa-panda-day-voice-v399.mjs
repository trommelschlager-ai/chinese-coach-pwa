import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('qa/panda-day-voice-v399',{recursive:true});
try {
 for(const w of [360,393,412]){
  const page=await browser.newPage({viewport:{width:w,height:w===360?800:w===393?852:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-voice-pilot.html?practice=day&mini=0&from=hsk2-life-course&start=audio',{waitUntil:'domcontentloaded'});
  await page.locator('.pg398-day-listen').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#pg346-hear').isDisabled(),false,'Current recorded My Day question must have active exact audio');
  const shown=await page.locator('.pg346-main-zh').innerText();
  assert.match(shown,/你早上做什么/,'First Panda question must match recorded native utterance');
  await page.screenshot({path:'qa/panda-day-voice-v399/ready-'+w+'.png',fullPage:false});
  await page.locator('.pg398-day-listen').click();
  assert.equal(await page.locator('.pg398-day-listen').isVisible(),true,'First-audio button persists after user gesture');
  assert.deepEqual(errors,[],'No Panda JS errors on '+w+'px');
  console.log('PASS Panda live My Day '+w+': exact recorded question, visible manual play, live conversation UI');
  await page.close();
 }
}finally{await browser.close();}
