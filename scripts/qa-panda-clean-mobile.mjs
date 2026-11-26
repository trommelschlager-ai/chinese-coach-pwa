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
  await page.goto(base+'/panda-voice-pilot.html?lesson=1');await page.locator('#pg346').waitFor();
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('panda-booting')),false,'Startup must not expose the old Panda screen');
  assert.equal(await page.locator('body>main').evaluate(el=>getComputedStyle(el).visibility),'hidden','Legacy engine UI should remain visually hidden');
  await page.waitForFunction(()=>document.querySelector('#pg346').dataset.paLayout==='v547');
  const mascot=page.locator('.pg352-mascot');
  const photo=mascot.locator('.pg346-panda');
  assert.match(await photo.getAttribute('src'),/panda-character-clean-v349\.webp/);
  assert(await photo.isVisible());
  assert.equal(await mascot.evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await mascot.evaluate(el=>getComputedStyle(el).transform),'none');
  // The approved portrait remains the sizing reference. The visible face
  // canvas replaces its pixels only after successful initialization.
  await page.waitForFunction(()=>document.querySelector('.pg352-mascot')?.dataset.faceReady==='true');
  const face=await page.locator('.pg353-face-canvas').evaluate(cv=>{
   const img=cv.parentElement.querySelector('.pg346-panda');
   const style=getComputedStyle(cv),p=getComputedStyle(img);
   const a=cv.getBoundingClientRect(),b=img.getBoundingClientRect();
   const pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
   let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>100)opaque++;
   return {visible:style.display!=='none'&&style.visibility==='visible'&&Number(style.opacity)===1,
    originalLoaded:img.complete&&img.naturalWidth>0,originalOpacity:p.opacity,opaque,
    aligned:['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<1.5)};
  });
  assert(face.visible&&face.originalLoaded&&face.originalOpacity==='0'&&face.opaque>200&&face.aligned,JSON.stringify(face));
  assert.match(await page.locator('.pg500-landscape').evaluate(el=>getComputedStyle(el).backgroundImage),/panda-landscape-v350/);
  assert.match(await page.locator('.pg346-scene').evaluate(el=>getComputedStyle(el,'::before').backgroundImage),/panda-exact-stone-v361/);
  assert.equal(await page.locator('.pg352-rocks').isVisible(),false);
  await page.screenshot({path:dir+'/welcome-'+width+'.png',animations:'disabled'});
  await page.evaluate(()=>{
   window.__playedMp3=[];
   const play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){
    this.addEventListener('playing',()=>window.__playedMp3.push(this.currentSrc),{once:true});
    return play.call(this);
   };
  });
  await page.locator('#pg346-rows button[aria-label="Слушать эту реплику"]').first().click();
  await page.waitForFunction(()=>window.__playedMp3.some(src=>/\.mp3(?:[?#]|$)/.test(src)));
  const send=async (question,answer)=>{
   if(!await page.locator('#pg346-input').isVisible())await page.locator('#pg346-send').click();
   await page.locator('#pg346-input').fill(question);
   await page.locator('#pg346-send').click();
   await page.waitForFunction(text=>document.querySelector('.pg346-main-zh').textContent===text,answer);
   assert.equal(await page.locator('#pg346-input').inputValue(),'');
  };
  await page.locator('#pg346-nonstop').click();
  for(const [question,answer] of [['你好','你好！'],['你好吗','很好！'],['今天天气怎么样','今天很冷。']])await send(question,answer);
  assert.match(await page.locator('#pg346-rows .pg346-py').last().textContent(),/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/);
  await page.locator('#pg346-topics-btn').click();assert(await page.locator('#pg346-topics').isVisible());await page.locator('#pg346-topics-close').click();
  await page.locator('#pg346-history').click();assert(await page.locator('#history-dialog').isVisible());await page.locator('[data-close="history-dialog"]').click();
  await page.locator('#pg346-mic').click();assert(await page.locator('#speech-dialog').isVisible());
  assert.equal(await page.evaluate(()=>window.__speech.length),0);await page.locator('#speech-allow').click();
  await page.waitForFunction(()=>document.querySelector('#pg346').dataset.pose==='listening');
  assert.equal(await page.evaluate(()=>window.__speech.at(-1).lang),'zh-CN');
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
  await send('你好','你好！');
  await page.locator('#pg346-mic').click();
  await page.waitForFunction(()=>document.querySelector('#pg346').dataset.pose==='listening');
  await page.evaluate(()=>window.__speech.at(-1).onresult({results:[[{transcript:'早上好',confidence:.95}]]}));
  await page.waitForFunction(()=>document.querySelector('.pg346-main-zh').textContent==='早上好！');

  for(const height of [568,640,740,825,915,400,320]){
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>Math.abs(document.querySelector('#pg346').getBoundingClientRect().height-(visualViewport?.height||innerHeight))<2);
   const fit=await page.evaluate(()=>{
    const box=el=>el.getBoundingClientRect().toJSON();
    return {
     controls:['pg346-send','pg346-mic'].map(id=>box(document.getElementById(id))),
     panda:box(document.querySelector('.pg352-mascot')),
     landscape:box(document.querySelector('.pg500-landscape')),
     viewport:innerWidth
    };
   });
   assert(fit.controls.every(r=>r.width>0&&r.height>0&&r.x>=-1&&r.right<=width+1&&r.y>=-1&&r.bottom<=height+1),JSON.stringify(fit));
   assert(fit.panda.width>100&&fit.panda.right<=width+1,JSON.stringify(fit));
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
