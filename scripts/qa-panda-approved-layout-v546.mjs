import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.QA_BASE||'http://127.0.0.1:4173';
fs.mkdirSync('qa/panda-approved-layout-v546',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  for(const width of [360,393,412]){
    const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.paLayout==='v546',{timeout:15000});
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
    for(const key of ['x','y','w','h'])
      assert(Math.abs(afterSend.panda[key]-initial.panda[key])<1.5,'Panda jumps after send: '+key);
    assert.equal(afterSend.stoneTop,initial.stoneTop);
    assert.equal(afterSend.stoneWidth,initial.stoneWidth);

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
    await page.screenshot({path:'qa/panda-approved-layout-v546/approved-'+width+'.png',animations:'disabled',fullPage:false});
    console.log('PASS Panda AI approved layout '+width+'px');
    await context.close();
  }
}finally{await browser.close()}
