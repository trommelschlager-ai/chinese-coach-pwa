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
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('panda-booting')),false,'Startup must not expose the old Panda screen');
  assert.equal(await page.locator('body>main').evaluate(el=>getComputedStyle(el).visibility),'hidden','Legacy engine UI should remain visually hidden');
  const planted=await page.locator('.pg352-mascot').evaluate(el=>({animation:getComputedStyle(el).animationName,transform:getComputedStyle(el).transform}));
  assert.equal(planted.animation,'none','Panda body must NOT bob or rotate on the stone');
  assert.equal(planted.transform,'none','Panda body must remain planted on its stone');
  assert(await page.locator('.pg364-ground-shadow').count()===1,'Fixed contact shadow required underneath the Panda');
  await page.waitForFunction(()=>document.querySelector('.pg346-panda').naturalWidth>0);
  assert.match(await page.locator('.pg346-panda').getAttribute('src'),/panda-character-clean-v349\.webp/);
  await page.waitForFunction(()=>document.querySelector('#pg346')?.dataset.pg500Mounted==='true');
  assert.match(await page.locator('#pg346 .pg500-landscape').evaluate(el=>getComputedStyle(el).backgroundImage),/panda-landscape-v350/,
   'Day/night Panda artwork must remain present on the approved dedicated landscape layer');
  assert.equal(await page.locator('.pg352-rocks').isVisible(),false,'The flat faux-stone slab must not cover the natural scenery');
  await page.waitForFunction(()=>document.querySelector('.pg352-mascot').dataset.faceReady==='true');
  assert(await page.locator('.pg353-face-canvas').isVisible(),'Approved mascot canvas is rendered');
  const placement=await page.evaluate(()=>{
    const mascot=document.querySelector('.pg352-mascot').getBoundingClientRect();
    const bubble=document.querySelector('.pg346-speech').getBoundingClientRect();
    const scene=document.querySelector('.pg346-scene').getBoundingClientRect();
    const glow=getComputedStyle(document.querySelector('.pg352-ear-effects'));
    return {eyeRight:mascot.left+mascot.width*.72,bubbleLeft:bubble.left,mascotBottom:mascot.bottom,sceneBottom:scene.bottom,glow:glow.opacity};
  });
  assert(placement.bubbleLeft>=placement.eyeRight-8,'Speech bubble must not conceal Panda eyes: '+JSON.stringify(placement));
  assert(placement.sceneBottom-placement.mascotBottom<65,'Panda must rest near the lake stone shoreline: '+JSON.stringify(placement));
  assert(Number(placement.glow)>.5,'Headset purple glow must be on while idle');
  if(width===360){
    const ledge=await page.locator('.pg346-scene').evaluate(el=>{
      const s=getComputedStyle(el,'::before');return {content:s.content,bottom:s.bottom,background:s.backgroundImage}
    });
    assert(ledge.content!=='none'&&ledge.background.includes('panda-exact-stone-v361.webp'),'Independent natural stone platform is missing');
    assert(parseFloat(ledge.bottom)<0,'Stone must extend below the feet, not float above them');
  }
  await page.screenshot({path:dir+'/welcome-'+width+'.png',animations:'disabled'});
  const mouthSignature=()=>page.evaluate(()=>{
    const c=document.querySelector('.pg353-face-canvas'),ctx=c.getContext('2d',{willReadFrequently:true});
    const x=Math.floor(c.width*.60),y=Math.floor(c.height*.38),w=Math.floor(c.width*.10),h=Math.floor(c.height*.08);
    const arr=ctx.getImageData(x,y,w,h).data;let hash=2166136261;
    for(let i=0;i<arr.length;i+=7)hash=Math.imul(hash^arr[i],16777619)>>>0;
    return hash;
  });
  const mouthIdle=await mouthSignature();
  await page.locator('#pg346-hear').click();
  await page.waitForFunction(()=>document.querySelector('#pg346').dataset.pose==='talking'&&
    document.querySelector('.pg352-mascot').dataset.lips==='moving'&&
    Number(document.querySelector('.pg352-mascot').dataset.mouthFrame)>0);
  const mouthTalking=await mouthSignature();
  assert.notEqual(mouthIdle,mouthTalking,'Mouth pixels must visibly change when MP3 is playing');
  if(width===360){
    // Natural blink must occur with no replacement character art or extra face layer.
    const previousBlink=await page.locator('.pg352-mascot').evaluate(el=>Number(el.dataset.blinkCount)||0);
    await page.waitForFunction(count=>
      Number(document.querySelector('.pg352-mascot').dataset.blinkCount||0)>count,
      previousBlink,{timeout:10000});
    assert(await page.locator('.pg346-sakura').isVisible(),'Sakura animation should be a separate visible overlay');
    const sakuraAnimation=await page.locator('.pg346-sakura').evaluate(el=>getComputedStyle(el).animationName);
    assert.match(sakuraAnimation,/pg354-sakura-sway/,'Branches should sway softly without moving the entire scene');
  }
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
  assert.equal(await page.locator('#pg346').getAttribute('data-headphones'),'listening','Listening switches headset to blue');
  await page.evaluate(()=>{const r=window.__speech.at(-1);r.onspeechstart?.();r.onspeechend?.()});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Речь закончилась'));
  await page.evaluate(()=>window.__speech.at(-1).onresult({results:[[{transcript:'晚上好',confidence:.95}]]}));
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent==='晚上好！');
  assert.notEqual(await page.locator('#pg346').getAttribute('data-headphones'),'correct','ASR text is not acoustic proof of tones');

  // Microphone errors must be actionable on the *approved* Panda screen.
  // The diagnostic lived inside the hidden legacy <main> before v407.
  await page.locator('#pg346-mic').click();
  await page.evaluate(()=>window.__speech.at(-1).onerror({error:'not-allowed'}));
  await page.locator('#pg346 .pg407-help-button').waitFor({state:'visible'});
  assert.match(await page.locator('#pg346-status').textContent(),/запрещён/);
  await page.locator('#pg346 .pg407-help-button').click();
  assert(await page.locator('#pg407-mic-help').isVisible(),'Recovery must be visible on approved UI');
  assert(await page.locator('#speech-recovery').isVisible(),'Existing recovery actions must not remain inside hidden main');
  assert.match(await page.locator('#speech-chrome').getAttribute('href'),/panda-voice-pilot\.html/);
  await page.evaluate(()=>{
    window.__micDiagnosticStops=0;
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{
      getUserMedia:async()=>({getTracks:()=>[{stop(){window.__micDiagnosticStops++}}]})
    }});
  });
  await page.locator('#speech-check').click();
  await page.waitForFunction(()=>document.querySelector('#speech-check-result').textContent.includes('Микрофон разрешён'));
  assert.equal(await page.evaluate(()=>window.__micDiagnosticStops),1,'Diagnostic must release the actual microphone track');
  await page.locator('.pg407-mic-close').click();
  assert.equal(await page.locator('#pg407-mic-help').isVisible(),false);
  await page.locator('#pg346-input').fill('你好');
  await page.locator('#pg346-send').click();
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent==='你好！');

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
  assert.equal(await page.locator('.pg346-sakura').evaluate(el=>getComputedStyle(el).animationName),'none','Respect reduced motion for cherry blossoms');
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(dir+'/qa-report.json',JSON.stringify({note:'Chromium mobile viewports and simulated speech; physical Android microphone not tested.',results,errors},null,2)+'\n');
 console.log('Clean Panda AI: '+results.length+' viewport checks, playback/listening states, visible chat controls, topics, history and reduced motion PASS');
}
