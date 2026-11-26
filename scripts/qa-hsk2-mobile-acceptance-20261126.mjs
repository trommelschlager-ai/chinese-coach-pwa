import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const dir='qa/hsk2-mobile-acceptance';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const visibleInViewport=async locator=>{
 const box=await locator.boundingBox();
 const viewport=locator.page().viewportSize();
 assert(box&&box.width>0&&box.height>0&&box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,
  'Control is clipped: '+JSON.stringify({box,viewport}));
};
try{
 for(const [width,height] of [[360,800],[393,852],[412,915]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'ru-RU',serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(base+'/hsk2-life-course.html?view=map',{waitUntil:'domcontentloaded'});
   const home=page.locator('.pgc-main-menu');
   await home.waitFor({state:'visible'});
   await visibleInViewport(home);
   assert.equal(await page.locator('.pgc-feature-card').count(),10);
   assert.match(await page.locator('.pg433-pill').innerText(),/10 уроков.*3 демо/);
   await page.screenshot({path:dir+'/'+width+'-catalog.png',animations:'disabled'});
   await home.click();
   await page.waitForURL(/index\.html#panda\/home/);
   await page.locator('.pg-photo1-home .pg-photo1-image').waitFor({state:'visible'});
   await page.waitForFunction(()=>{const img=document.querySelector('.pg-photo1-home .pg-photo1-image');return img?.complete&&img.naturalWidth>0;});
   await page.locator('.pg-photo1-hit-1').waitFor({state:'visible'});
   await page.locator('.pg-photo1-hit-2').waitFor({state:'visible'});
   await page.screenshot({path:dir+'/'+width+'-home.png',animations:'disabled'});
   await page.goto(base+'/hsk2-lesson1.html?step=2',{waitUntil:'domcontentloaded'});
   await page.locator('#app[data-view="2"] .word-row').first().waitFor({state:'visible'});
   assert.equal(await page.locator('#app[data-view="2"] .word-row').count(),6);
   await visibleInViewport(page.locator('#next'));
   await page.screenshot({path:dir+'/'+width+'-day-words.png',animations:'disabled'});
   // Simulate restored listening progress without claiming audio playback was tested.
   await page.evaluate(()=>{const k='panda-go-hsk2-lesson1-word-flow-review-v1';const s=JSON.parse(localStorage.getItem(k)||'{}');s.step=2;s.heardWords=[0,1,2,3,4,5];localStorage.setItem(k,JSON.stringify(s));});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#app[data-view="2"] .word-row').first().waitFor();
   assert.match(await page.locator('.audio-note').first().innerText(),/6 из 6.*Можно продолжать/);
   assert.equal(await page.locator('#next').isEnabled(),true);
   await visibleInViewport(page.locator('#next'));
   await page.goto(base+'/hsk2-lesson7-future-preview.html?step=2',{waitUntil:'domcontentloaded'});
   const cards=page.locator('.l7-horizontal-card');
   await cards.first().waitFor({state:'visible'});
   assert.equal(await cards.count(),8);
   const layout=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,audio:!!el.querySelector('button.orb'),py:!!el.querySelector('.py'),ru:!!el.querySelector('.ru')};}));
   assert(layout.every((r,i)=>Math.abs(r.x-layout[0].x)<2&&r.w>width*.8&&r.audio&&r.py&&r.ru&&(!i||r.y>=layout[i-1].y+layout[i-1].h-1)),JSON.stringify(layout));
   await visibleInViewport(page.locator('#next'));
   await page.screenshot({path:dir+'/'+width+'-future-words.png',animations:'disabled'});
   const collisions=await cards.evaluateAll(els=>els.flatMap((card,i)=>{
    const parts=[...card.querySelectorAll(':scope > .l7-horizontal-art,:scope > .l7-horizontal-hanzi,:scope > .l7-horizontal-translation,:scope > button.orb')];
    const rects=parts.map(el=>el.getBoundingClientRect());const result=[];
    if(parts.length!==4)result.push('missing components '+i);
    for(let j=1;j<rects.length;j++)if(rects[j].left<rects[j-1].right-1)result.push('column collision '+i+':'+j);
    for(const selectors of [['.cn','.tone-strokes'],['.py','.ru']]){
     const a=card.querySelector(selectors[0])?.getBoundingClientRect(),b=card.querySelector(selectors[1])?.getBoundingClientRect();
     if(!a||!b||a.bottom>b.top+1)result.push('text overlap '+i+':'+selectors.join('/'));
    }
    return result;
   }));
   assert.deepEqual(collisions,[],'Vocabulary components must not overlap');
   await cards.last().scrollIntoViewIfNeeded();
   await visibleInViewport(cards.last());
   await visibleInViewport(page.locator('#next'));
   await page.screenshot({path:dir+'/'+width+'-future-last-word.png',animations:'disabled'});
   assert.deepEqual(errors,[],'Uncaught browser errors');
   console.log('PASS mobile acceptance '+width+'x'+height);
  }finally{await context.close();}
 }
}finally{await browser.close();}
