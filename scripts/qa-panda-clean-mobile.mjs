import assert from 'node:assert/strict';
import fs from 'node:fs';

export async function verifyCleanMobile(browser,base,dir){
 const results=[],errors=[];
 for(const width of [360,393,412,430]){
  const context=await browser.newContext({viewport:{width,height:825},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   window.__speech=[];
   window.SpeechRecognition=class{constructor(){window.__speech.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}};
   localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers','weekdays','dates','family','weather']));
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/panda-voice-pilot.html');await page.locator('#pg346').waitFor();
  await page.waitForFunction(()=>document.querySelector('.pg346-panda').naturalWidth>0);
  assert.match(await page.locator('.pg346-panda').getAttribute('src'),/panda-character-clean-v349\.webp/);
  await page.locator('#pg346-hear').click();
  await page.waitForFunction(()=>document.querySelector('#pg346').dataset.pose==='talking');
  await page.locator('#pg346-nonstop').click();
  for(const [question,answer] of [['你好','你好！'],['你好吗','很好！'],['今天天气怎么样','今天很冷。']]){
   await page.locator('#pg346-input').fill(question);await page.locator('#pg346-send').click();
   await page.waitForFunction(text=>document.querySelector('.pg346-main-zh').textContent===text,answer);
  }
  await page.locator('#pg346-py').click();assert.equal(await page.locator('.pg346-main-py').isVisible(),false);
  await page.locator('#pg346-py').click();assert.equal(await page.locator('.pg346-main-py').isVisible(),true);
  await page.locator('#pg346-topics-btn').click();assert(await page.locator('#pg346-topics').isVisible());await page.locator('#pg346-topics-close').click();
  await page.locator('#pg346-history').click();assert(await page.locator('#history-dialog').isVisible());await page.locator('[data-close="history-dialog"]').click();
  await page.locator('#pg346-mic').click();assert(await page.locator('#speech-dialog').isVisible());
  assert.equal(await page.evaluate(()=>window.__speech.length),0);await page.locator('#speech-allow').click();
  await page.waitForFunction(()=>document.querySelector('#pg346').dataset.pose==='listening');
  await page.evaluate(()=>window.__speech.at(-1).onresult({results:[[{transcript:'晚上好',confidence:.95}]]}));
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent==='晚上好！');
  for(const height of [568,640,740,825,915,400,320]){
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>Math.abs(document.querySelector('#pg346').getBoundingClientRect().height-(visualViewport?.height||innerHeight))<2);
   const fit=await page.evaluate(()=>{
    const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const stage=box(document.querySelector('#pg346'));
    return {stage,viewport:{width:innerWidth,height:innerHeight},controls:['pg346-input','pg346-send','pg346-mic','pg346-short','pg346-nonstop'].map(id=>({id,...box(document.getElementById(id))})),panda:box(document.querySelector('.pg346-panda')),scene:box(document.querySelector('.pg346-scene'))};
   });
   assert(fit.controls.every(r=>r.width>0&&r.height>0&&r.x>=-1&&r.right<=width+1&&r.y>=-1&&r.bottom<=height+1),JSON.stringify(fit));
   // The whole mascot stays inside its scene; the illustration never stretches.
   assert(fit.panda.y>=fit.scene.y-6&&fit.panda.bottom<=fit.scene.bottom+3,JSON.stringify(fit));
   results.push({width,height,...fit});
  }
  await page.setViewportSize({width,height:825});
  await page.screenshot({path:dir+'/clean-'+width+'.png',animations:'disabled'});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.pg346-panda').evaluate(el=>getComputedStyle(el).animationName),'none');
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(dir+'/qa-report.json',JSON.stringify({note:'Chromium mobile viewports and simulated speech; physical Android microphone not tested.',results,errors},null,2)+'\n');
 console.log('Clean Panda AI: '+results.length+' viewport checks, playback/listening states, visible chat controls, topics, history and reduced motion PASS');
}
