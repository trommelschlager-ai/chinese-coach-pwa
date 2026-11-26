import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-approved-layout-v547',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  for(const width of [360,393,412]){
    const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.paLayout==='v547',{timeout:15000});
    const snapshot=async()=>page.evaluate(()=>{
      const stage=document.getElementById('pg346');
      const panda=stage.querySelector('.pg352-mascot').getBoundingClientRect();
      const scene=stage.querySelector('.pg346-scene');
      const nav=stage.querySelector('.pg346-nav');
      const head=stage.querySelector('.pg346-header');
      const text=el=>el?.textContent?.trim()||'';
      const cards=Array.from(stage.querySelectorAll('#pg346-rows .pg346-row'));
      const rail=stage.querySelector('.pg346-side-rail');
      const stoneStyle=getComputedStyle(scene,'::before');
      return {
        panda:{x:panda.x,y:panda.y,w:panda.width,h:panda.height},
        stoneTop:stoneStyle.top,stoneWidth:stoneStyle.width,
        labels:Array.from(nav.children).map(text),
        right:Array.from(rail.children).filter(el=>getComputedStyle(el).display!=='none').map(el=>el.getAttribute('aria-label')||text(el)),
        historyInsideFooter:nav.contains(stage.querySelector('#pg346-history')),
        historyInsideHeader:head.contains(stage.querySelector('#pg346-history')),
        rows:cards.length,
        headerRect:head.getBoundingClientRect().toJSON(),
        historyRect:stage.querySelector('.pg346-history').getBoundingClientRect().toJSON(),
        railRect:rail.getBoundingClientRect().toJSON()
      };
    });
    const pandaPixels=async()=>page.evaluate(()=>{
      const stage=document.getElementById('pg346');
      const img=stage.querySelector('.pg352-mascot .pg346-panda');
      const cs=getComputedStyle(img),face=stage.querySelector('.pg353-face-canvas');
      const cv=document.createElement('canvas');cv.width=40;cv.height=40;
      const ctx=cv.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0,40,40);
      const data=ctx.getImageData(0,0,40,40).data;
      let opaque=0;for(let i=3;i<data.length;i+=4)if(data[i]>100)opaque++;
      return {loaded:img.complete&&img.naturalWidth>100,opacity:cs.opacity,
        display:cs.display,visibility:cs.visibility,
        faceDisplay:getComputedStyle(face).display,faceOpacity:getComputedStyle(face).opacity,faceVisibility:getComputedStyle(face).visibility,faceReady:face.parentElement.dataset.faceReady,faceRect:face.getBoundingClientRect().toJSON(),imgRect:img.getBoundingClientRect().toJSON(),opaque};
    });
    const portrait=await pandaPixels();
    assert(portrait.loaded,'Panda original image is not loaded: '+JSON.stringify(portrait));
    assert.equal(portrait.faceReady,'true','Original face renderer failed to initialize');
    assert.equal(portrait.opacity,'0','Original image must retain geometry but not overlap the animated canvas');
    assert.equal(portrait.visibility,'visible','Panda image visibility lost: '+JSON.stringify(portrait));
    assert(portrait.opaque>200,'Panda image has no visible pixels: '+JSON.stringify(portrait));
    assert.equal(portrait.faceDisplay,'block','Animated canvas must be visible');
    assert.equal(portrait.faceOpacity,'1');assert.equal(portrait.faceVisibility,'visible');
    for(const k of ['x','y','width','height'])assert(Math.abs(portrait.faceRect[k]-portrait.imgRect[k])<1.5,'Canvas not aligned: '+k);
    const initial=await snapshot();
    assert.deepEqual(initial.labels,['Главная','История','Panda AI','Профиль'],'Wrong footer order: '+JSON.stringify(initial));
    assert.equal(initial.right.length,2,'Right buttons should be Topics and Lessons only: '+JSON.stringify(initial.right));
    assert(initial.right.some(s=>s.includes('Все темы'))&&initial.right.some(s=>s.includes('уроки')),'Right labels are wrong: '+JSON.stringify(initial.right));
    assert(initial.historyInsideFooter&&!initial.historyInsideHeader,'History button was not moved to bottom');
    assert(initial.panda.w>150&&initial.panda.h>150,'Panda is missing or too small: '+JSON.stringify(initial.panda));
    assert(initial.historyRect.bottom<=initial.panda.y+15,'Panda overlaps chat: '+JSON.stringify(initial));

    // Open text via plane, then SEND exactly once: the first tap must work.
    await page.locator('#pg346-send').click();
    await page.locator('#pg346-input').fill('你好');
    await page.locator('#pg346-send').click();
    await page.waitForFunction(()=>document.querySelector('#pg346-input')?.value==='',{timeout:6000});
    const afterSend=await snapshot();
    const afterPortrait=await pandaPixels();
    assert.equal(afterPortrait.faceDisplay,'block','Animated Panda disappeared after text send');
    for(const key of ['x','y','w','h'])
      assert(Math.abs(afterSend.panda[key]-initial.panda[key])<1.5,'Panda jumps after send: '+key);
    assert.equal(afterSend.stoneTop,initial.stoneTop);
    assert.equal(afterSend.stoneWidth,initial.stoneWidth);

    // Send a known recorded reply and sample actual visible mouth canvas pixels.
    // Do not fake audio or infer movement from a status label alone.
    const mouthSnapshot=()=>page.evaluate(()=>{
      const m=document.querySelector('.pg352-mascot'),cv=m.querySelector('.pg353-face-canvas'),style=getComputedStyle(cv);
      const ctx=cv.getContext('2d');const w=cv.width,h=cv.height;
      const d=ctx.getImageData(Math.floor(w*.57),Math.floor(h*.36),Math.floor(w*.16),Math.floor(h*.10)).data;
      let hash=2166136261;for(const value of d)hash=Math.imul(hash^value,16777619);
      return {hash,lips:m.dataset.lips,frame:Number(m.dataset.mouthFrame),visible:style.display!=='none'&&style.opacity==='1'&&style.visibility==='visible',rect:m.getBoundingClientRect().toJSON()};
    });
    for(const mode of ['short','nonstop']){
      await page.locator('#pg346-'+mode).click();
      const input=page.locator('#pg346-input'),send=page.locator('#pg346-send');
      if(!await input.isVisible())await send.click();
      await input.fill('你现在在做什么');await send.click();
      await page.waitForFunction(()=>document.querySelector('.pg352-mascot')?.dataset.lips==='moving',null,{timeout:10000});
      const samples=[];
      for(let i=0;i<6;i++){samples.push(await mouthSnapshot());await page.waitForTimeout(90);}
      assert(samples.every(x=>x.visible),'Mouth canvas hidden during playback');
      assert(new Set(samples.filter(x=>x.lips==='moving').map(x=>x.hash)).size>=2,'Visible mouth pixels did not change: '+JSON.stringify(samples));
      for(const x of samples)for(const k of ['x','y','width','height'])assert(Math.abs(x.rect[k]-samples[0].rect[k])<1.5,'Body moved during speech '+k);
      await page.waitForFunction(()=>document.querySelector('.pg352-mascot')?.dataset.lips==='rest',null,{timeout:15000});
      console.log('PASS visible mouth motion '+width+'px '+mode);
    }
    // If initialization fails, original artwork must remain visible.
    await page.evaluate(()=>document.querySelector('.pg352-mascot').dataset.faceReady='false');
    const fallback=await pandaPixels();assert.equal(fallback.opacity,'1');assert.equal(fallback.faceDisplay,'none');
    await page.evaluate(()=>document.querySelector('.pg352-mascot').dataset.faceReady='true');

    // Mimic the Android keyboard changing visualViewport: art must be stable.
    await page.evaluate(()=>{
      document.documentElement.dataset.keyboard='true';
      document.documentElement.style.setProperty('--screen-height','475px');
    });
    const duringKeyboard=await snapshot();
    for(const key of ['x','y','w','h'])
      assert(Math.abs(duringKeyboard.panda[key]-initial.panda[key])<1.5,'Panda jumps with keyboard: '+key);
    assert.equal(duringKeyboard.stoneTop,initial.stoneTop);
    assert.equal(duringKeyboard.stoneWidth,initial.stoneWidth);
    await page.evaluate(()=>{
      document.documentElement.dataset.keyboard='false';
      document.documentElement.style.removeProperty('--screen-height');
    });

    // Topics remain functional after the rearrangement.
    await page.locator('#pg346-topics-btn').click();
    assert.equal(await page.locator('#pg346-topics').isVisible(),true);
    await page.locator('#pg346-topics-close').click();
    assert.equal(await page.locator('#pg346-topics').isVisible(),false);

    assert.deepEqual(errors,[],'Browser JS errors');
    await page.screenshot({path:'qa/panda-approved-layout-v547/approved-'+width+'.png',animations:'disabled',fullPage:false});
    console.log('PASS Panda AI approved layout '+width+'px');
    await context.close();
  }
}finally{await browser.close()}
