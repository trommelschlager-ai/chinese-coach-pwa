import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-street-approved-male',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 for(const width of [360,393,412]){
  const ctx=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-street-ai-preview.html',{waitUntil:'domcontentloaded'});
  await page.locator('#row1').waitFor({state:'visible',timeout:15000});
  await page.locator('#row1').click();
  for(const file of ['01.mp3','02.mp3','03.mp3']){
   await page.locator('#hear').waitFor({state:'visible',timeout:5000});
   const requested=page.waitForResponse(resp=>resp.url().includes('/assets/panda-street-male-voice-v1/'+file),{timeout:8000});
   await page.locator('#hear').click();
   const response=await requested;
   assert.equal(response.status(),200,'Approved male audio not served: '+file);
   if(file!=='03.mp3'){await page.locator('#other').click();}
  }
  assert(!errors.length,'Street page JS errors: '+errors.join('; '));
  await page.screenshot({path:'qa/panda-street-approved-male/street-'+width+'.png',fullPage:false,animations:'disabled'});
  console.log('PASS Street 3 reviewed male MP3 clips '+width+'px');
  await ctx.close();
 }
}finally{await browser.close()}
