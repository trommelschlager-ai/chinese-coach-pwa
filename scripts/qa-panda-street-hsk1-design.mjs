import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.QA_BASE || 'http://127.0.0.1:4173';
const out = 'qa/panda-street-hsk1-design';
fs.mkdirSync(out, {recursive: true});
const lessons = [
 {path:'panda-street-slang-lesson1-preview.html', steps:16, start:'#beginstreet'},
 {path:'panda-street-slang-lesson2-preview.html', steps:7, start:'#startlesson'}
];
const report = [];
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for (const [width,height] of [[360,640],[393,873],[412,915]]) {
  const ctx = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try {
   for (const lesson of lessons) {
    const page = await ctx.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=base+'/'+lesson.path+'?welcome=1';
    assert.equal((await page.goto(url,{waitUntil:'load'}))?.status(),200);
    const progress = page.locator('#current');
    const counter = n=>String(n).padStart(2,'0')+' / '+String(lesson.steps).padStart(2,'0');
    const prefix=lesson.steps+'-'+width;
    for(let step=1;step<=lesson.steps;step++){
     assert.equal((await progress.textContent()).trim(),counter(step),prefix+' step '+step);
     const dims=await page.evaluate(()=>{
      const rect=s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,display:getComputedStyle(e).display}};
      const el=document.querySelector('#screen');
      const frame=document.querySelector('.page');
      return {viewport:innerHeight,width:innerWidth,documentWidth:document.documentElement.scrollWidth,frame:rect('.page'),header:rect('.top'),content:rect('#screen'),footer:rect('.foot'),contentScroll:el.scrollHeight,contentClient:el.clientHeight,contentWidth:el.scrollWidth,contentClientWidth:el.clientWidth,paddingBottom:parseFloat(getComputedStyle(frame).paddingBottom),next:rect('#next'),nextBackground:getComputedStyle(document.querySelector('#next')).backgroundImage};
     });
     assert(dims.documentWidth<=width+2,prefix+' horizontal document overflow at '+step);
     assert(dims.frame.bottom<=height+2,prefix+' frame outside viewport at '+step);
     assert(dims.content.height>0,prefix+' empty content at '+step);
     if(step>1){
      assert(dims.footer.display!=='none',prefix+' footer hidden at '+step);
      assert(dims.footer.bottom<=height+2,prefix+' footer outside viewport at '+step);
      assert(dims.content.bottom<=dims.footer.top+2,prefix+' content overlaps footer at '+step);
      assert(dims.header.bottom<=dims.content.top+2,prefix+' content overlaps header at '+step);
      assert.equal(dims.paddingBottom,0,prefix+' obsolete Android gap at '+step);
      assert(dims.next.height>=44,prefix+' small touch target at '+step);
      assert.match(dims.nextBackground,/255, 134, 210/,prefix+' wrong next-button design');
      if(dims.contentScroll>dims.contentClient+2){
       const scroll=await page.locator('#screen').evaluate(el=>{el.scrollTop=el.scrollHeight;const result={actual:el.scrollTop,max:el.scrollHeight-el.clientHeight};el.scrollTop=0;return result});
       assert(scroll.actual>=scroll.max-2,prefix+' cannot scroll to end at '+step);
      }
     }
     if([1,2,Math.ceil(lesson.steps/2),lesson.steps].includes(step))await page.screenshot({path:out+'/'+prefix+'-'+step+'.png',animations:'disabled'});
     report.push({lesson:lesson.path,width,height,step,dims});
     if(step===1)await page.locator(lesson.start).click();
     else if(step<lesson.steps)await page.locator('#next').click();
    }
    await page.locator('#prev').click();
    assert.equal((await progress.textContent()).trim(),counter(lesson.steps-1));
    await page.locator('#next').click();
    assert.equal((await progress.textContent()).trim(),counter(lesson.steps));
    await page.locator('#next').click();
    assert.equal((await progress.textContent()).trim(),counter(1));
    assert.deepEqual(errors,[],prefix+' browser errors');
    await page.close();
   }
  }finally{await ctx.close()}
 }
 assert.equal(report.length,69);
 console.log('PASS: 69 Android-sized lesson screens; scroll, progress, footer, back and restart.');
} finally {
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
 await browser.close();
}
