import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
for(const [w,h] of [[320,568],[360,640],[393,852],[412,915],[694,1331]]){
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/hsk1-map.html',{waitUntil:'load'});
 await page.evaluate(()=>localStorage.setItem('pg-hsk1-path-v371','4'));
 await page.reload({waitUntil:'load'});
 const data=await page.evaluate(()=>{
  const art=document.querySelector('.artboard').getBoundingClientRect();
  return {
   noScroll:document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1,
   art:{x:art.x,width:art.width,height:art.height},
   image:[document.querySelector('.approved').naturalWidth,document.querySelector('.approved').naturalHeight],
   backdrop:getComputedStyle(document.body,'::before').backgroundImage,
   lessons:[...document.querySelectorAll('.lesson')].map(a=>{
    const g=a.querySelector('.gate'),r=g.getBoundingClientRect();
    return {n:Number(a.dataset.num),cls:a.className,display:getComputedStyle(g).display,mark:g.textContent,g:{centerX:(r.x+r.width/2-art.x)/art.width,width:r.width/art.width},aria:a.getAttribute('aria-disabled')};
   })
  };
 });
 assert.deepEqual(data.image,[694,1536]);
 assert(data.noScroll,'Unexpected horizontal or vertical scroll at '+w+'x'+h);
 assert(data.backdrop.includes('hsk1-approved-v373.png'),'Side background not from approved artwork');
 for(const a of data.lessons){
  assert.equal(a.aria,String(a.n>5));
  if([2,3,4,5].includes(a.n)){
   assert.equal(a.display,'grid');
   assert(a.g.centerX>0.86&&a.g.centerX<0.92,'Overlay misaligned '+a.n);
   assert(a.g.width>0.08&&a.g.width<0.13,'Overlay must cover underlying lock '+a.n);
   assert.equal(a.mark,a.n===5?'▶':'✓');
  }else assert.equal(a.display,'none');
 }
 if(w===393||w===694)await page.screenshot({path:'qa/hsk1-v373/android-'+w+'x'+h+'-saved4-v374.png',fullPage:true});
 console.log('PASS Chrome '+w+'x'+h+' no scroll, preserved art, saved progress 4, 6 lock states, opaque overlay');
 await context.close();
}
await browser.close();