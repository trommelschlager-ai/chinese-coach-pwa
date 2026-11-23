// Panda v540: real Chromium/mobile viewport guard for restored approved UI.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const DIR='qa/panda-v540-approved-visual';
fs.mkdirSync(DIR,{recursive:true});
try{
 for(const width of [360,393,412]){
  const page=await browser.newPage({viewport:{width,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('pg-hsk1-v3-complete',
    JSON.stringify(['foundations','pronouns','numbers','weekdays','dates','family','weather'])));
  const response=await page.goto(BASE+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  assert.equal(response?.status(),200);
  await page.locator('#pg346').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.pg500Mounted==='true',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('.pg346-panda')?.naturalWidth>0,{timeout:30000});
  const status=await page.evaluate(()=>{
   const root=document.querySelector('#pg346'),scene=root.querySelector('.pg346-scene'),mascot=root.querySelector('.pg352-mascot');
   const rail=root.querySelector('.pg346-side-rail');
   const rr=[...rail.querySelectorAll('button')].map(b=>{
    const r=b.getBoundingClientRect();return {label:b.getAttribute('aria-label'),left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}
   });
   const mascotBounds=mascot.getBoundingClientRect(),sceneBounds=scene.getBoundingClientRect();
   const c=getComputedStyle(mascot),paw=getComputedStyle(mascot,'::before');
   return {
    unexpectedAudioBanner:[...root.querySelectorAll('button')].filter(b=>b.textContent?.includes('Включить голос Панды')).length,
    audioBar:!!root.querySelector('.pg502-start-audio'),
    sideButtons:rr,extraRightButtons:root.querySelectorAll('.pg500-side:not(.pg346-side-rail .pg500-side)').length,
    mascotBottomGap:sceneBounds.bottom-mascotBounds.bottom,
    mascotAnimation:c.animationName,mascotTransform:c.transform,
    pawContact:paw.content,pawBackground:paw.backgroundImage,
    height:innerHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    cssSeatBottom:getComputedStyle(root).getPropertyValue('--pg-seat-bottom').trim()
   };
  });
  assert.equal(status.unexpectedAudioBanner,0,'No reappearing voice-enable banner: '+JSON.stringify(status));
  assert.equal(status.audioBar,false,'No old translucent audio bar');
  assert.equal(status.sideButtons.length,3,'Three shortcuts must share one side rail: '+JSON.stringify(status));
  assert.equal(status.extraRightButtons,0,'No duplicated buttons outside approved side rail');
  assert.equal(status.mascotAnimation,'none','Panda must not bob');
  assert.equal(status.mascotTransform,'none','Panda must remain stationary on the stone');
  assert(status.mascotBottomGap<65,'Panda must sit close to stone, not float: '+JSON.stringify(status));
  assert.notEqual(status.pawContact,'none','Natural seating/contact shadow must exist');
  assert(status.scrollWidth<=width+2,'No horizontal clipping or zoom');
  for(let i=0;i<status.sideButtons.length;i++){
   const a=status.sideButtons[i];
   assert(a.left>=0&&a.right<=width+2&&a.top>=0&&a.bottom<=852,'Shortcut goes offscreen: '+JSON.stringify(a));
   for(let j=i+1;j<status.sideButtons.length;j++){
    const b=status.sideButtons[j];
    assert(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,
      'Right-side buttons overlap: '+JSON.stringify([a,b]));
   }
  }
  await page.screenshot({path:DIR+'/approved-initial-'+width+'.png',fullPage:false});
  await page.evaluate(()=>{
   document.querySelector('#pg346-input').value='我爱你';
   document.querySelector('#pg346-send').click();
  });
  await page.waitForFunction(()=>document.querySelector('#pg346-rows')?.textContent?.includes('你叫什么名字'),{timeout:10000});
  await page.evaluate(()=>{
   document.querySelector('#pg346-input').value='安东';
   document.querySelector('#pg346-send').click();
  });
  await page.waitForFunction(()=>document.querySelector('#pg346-rows')?.textContent?.includes('很高兴认识你'),{timeout:10000});
  assert.deepEqual(errors,[],'No JavaScript errors at '+width+'px');
  await page.screenshot({path:DIR+'/approved-name-dialogue-'+width+'.png',fullPage:false});
  console.log('PASS v540 '+width+'px: approved screen, no audio banner, three non-overlapping side buttons, grounded Panda and bare-name conversation');
  await page.close();
 }
}finally{await browser.close();}
