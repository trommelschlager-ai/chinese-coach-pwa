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
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.paLayout==='v547');
  assert.match(await page.locator('.pg346-main-zh').textContent(),/你早上做什么/);
  const prompt=page.locator('#pg346-rows article').filter({hasText:'你早上做什么'});
  const playback=page.waitForResponse(response=>response.ok()&&/\.mp3(?:[?#]|$)/.test(response.url()));
  await prompt.getByRole('button',{name:'Слушать эту реплику'}).click();
  const mp3=await playback;
  assert((await mp3.body()).length>1000,'Recorded question is playable');
  await page.screenshot({path:'qa/panda-day-voice-v399/ready-'+w+'.png',fullPage:false});
  assert.deepEqual(errors,[],'No Panda JS errors on '+w+'px');
  console.log('PASS Panda live My Day '+w+': exact recorded question, visible manual play, live conversation UI');
  await page.close();
 }
}finally{await browser.close();}
