import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const out='qa/street-native-standard';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let count=0;
try{
 for(const [width,height] of [[360,640],[393,873],[412,915]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  for(const n of [1,2]){
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const url=base+'/panda-street-slang-lesson'+n+'-preview.html?welcome=1';
   assert.equal((await page.goto(url,{waitUntil:'load'}))?.status(),200);
   await page.locator('.sheet').first().waitFor();
   assert(await page.locator('link[href*="hsk1-first-v189.css"]').count());
   const total=n===1?16:17;
   for(let step=1;step<=total;step++){
    const counter=String(step).padStart(2,'0')+' / '+total;
    assert.equal((await page.locator('#pg-counter').textContent()).trim(),counter);
    const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bottom:r('#pg-footer').bottom,contentBottom:r('#pg-content').bottom,footerTop:r('#pg-footer').top,headerBottom:r('[data-pg-hsk1-header]').bottom,contentTop:r('#pg-content').top,height:innerHeight}});
    assert(layout.scrollWidth<=width+2,'Horizontal overflow '+n+'/'+step+'/'+width);
    assert(layout.bottom<=height+2,'Footer outside viewport');
    assert(layout.contentBottom<=layout.footerTop+2&&layout.headerBottom<=layout.contentTop+2,'Content overlaps fixed controls');
    const qs=page.locator('[data-answer]');
    if(await qs.count()){assert(await page.locator('#pg-next').isDisabled());await page.locator('[data-answer="0:0"]').click();assert(await page.locator('#pg-next').isDisabled(),'Wrong answer must keep Next locked');for(const [i,j] of (n===1?[[0,1],[1,0],[2,0]]:[[0,1],[1,0],[2,2]]))await page.locator('[data-answer="'+i+':'+j+'"]').click();}
    if(await page.locator('#verify').count()){assert(await page.locator('#pg-next').isDisabled());await page.locator('#verify').click();assert(await page.locator('#pg-next').isDisabled(),'Empty answer must keep Next locked');for(const i of n===1?[1,2,0]:[1,3,4,0,2])await page.locator('[data-add="'+i+'"]').click();await page.locator('#verify').click();}
    if([1,4,Math.ceil(total/2),total].includes(step))await page.screenshot({path:out+'/lesson-'+n+'-'+width+'-'+step+'.png',animations:'disabled'});
    count++;
    if(step<total){
     // The actual HSK1 control intentionally ignores clicks within 280 ms.
     await page.waitForTimeout(320);
     await page.locator('#pg-next').click();
     await page.waitForFunction(expected=>document.querySelector('#pg-counter').textContent.trim()===expected,String(step+1).padStart(2,'0')+' / '+total);
    }
   }
   await page.locator('#repeat-course').click();assert.equal(await page.locator('#pg-counter').textContent(),'01 / '+total);
   assert.deepEqual(errors,[]);await page.close();
  }
  await ctx.close();
 }
 assert.equal(count,99);console.log('PASS: '+count+' screens with original HSK1 shell, gated exercises and restart');
}finally{await browser.close();}
