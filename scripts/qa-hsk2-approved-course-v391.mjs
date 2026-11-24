import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.PANDA_TEST_BASE||'http://127.0.0.1:4173';
const dir='qa/hsk2-approved-v391';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const [width,height] of [[360,800],[393,852],[412,915]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/hsk2-life-course.html?view=welcome');
  const art=page.locator('.pg445-enabled > img');
  const image=await art.evaluate(async img=>{
   await img.decode();
   return {width:img.naturalWidth,height:img.naturalHeight,fit:getComputedStyle(img).objectFit};
  });
  assert.deepEqual([image.width,image.height],[941,1602]);
  assert.notEqual(image.fit,'fill','Approved artwork must preserve proportions');
  const program=page.getByRole('button',{name:'Все уроки и темы курса'});
  assert(await program.isVisible());
  await page.screenshot({path:dir+'/'+width+'-welcome.png'});
  await program.click();
  assert.equal(await page.locator('.pgc-feature-card').count(),10);
  assert.deepEqual(errors,[]);
  await page.close();
 }
}finally{await browser.close()}

process.env.HSK2_QA_WIDTHS ??= '360,393,412';
process.env.HSK2_QA_DIR ??= dir;
await import('./qa-hsk2-day-panda-mobile-v1.mjs');
