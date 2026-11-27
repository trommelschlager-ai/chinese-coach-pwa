import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base='http://127.0.0.1:4173';
const output='qa/panda-street-browser-v1';
fs.mkdirSync(output,{recursive:true});
const errors=[];
const reports=[];
const browser=await chromium.launch({
  channel:'chrome',
  headless:true,
  args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']
});
try{
  for(const viewport of [{width:393,height:852},{width:360,height:800}]){
    const context=await browser.newContext({
      viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1
    });
    await context.addInitScript(()=>{
      window.__streetAudio=[];
      const NativeAudio=window.Audio;
      window.Audio=function(src){
        const a=new NativeAudio(src);
        const entry={src:new URL(src,location.href).pathname,played:false,error:false};
        window.__streetAudio.push(entry);
        a.addEventListener('playing',()=>{entry.played=true});
        a.addEventListener('error',()=>{entry.error=true});
        return a;
      };
    });
    try{
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(String(e.message)));
      await page.goto(base+'/panda-street-ai-preview.html',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>{
        const src=document.getElementById('src');
        const canvas=document.getElementById('art');
        return src?.naturalWidth>0&&canvas?.width>0;
      },null,{timeout:20000});
      assert.equal(await page.locator('#art').count(),1);
      assert.equal(await page.locator('#theme').count(),1);
      await page.waitForFunction(()=>document.getElementById('street-face-motion-layer'),null,{timeout:20000});
      await page.waitForFunction(()=>document.querySelector('#stage.street-live-v12 #street-face-motion-layer[data-motion-state="idle"]'),null,{timeout:20000});
      await page.evaluate(()=>{
        window.__streetSample=(x,y,w,h)=>Array.from(document.querySelector('#street-face-motion-layer').getContext('2d').getImageData(x,y,w,h).data);
        window.__streetChanged=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>18)n++;return n;};
        window.__streetMouthBefore=window.__streetSample(286,604,168,75);
        window.__streetFixedBefore=window.__streetSample(20,900,120,120);
        window.__streetMotionLog=[];
        const layer=document.getElementById('street-face-motion-layer');
        new MutationObserver(()=>window.__streetMotionLog.push(layer.getAttribute('data-motion-state')))
          .observe(layer,{attributes:true,attributeFilter:['data-motion-state']});
      });
      const name=viewport.width+'x'+viewport.height;
      await page.screenshot({path:output+'/night-'+name+'.png'});
      const state=await page.evaluate(()=>({
        artWidth:document.getElementById('art').width,
        stageWidth:document.getElementById('stage').getBoundingClientRect().width,
        viewportWidth:innerWidth,
        activeTheme:document.documentElement.dataset.theme||'night'
      }));
      assert(state.artWidth>0,'Night scene did not render');
      assert(state.stageWidth<=state.viewportWidth+2,'Street is wider than the Android viewport');
      assert.notEqual(state.activeTheme,'day','Fresh profile should start with approved night view');

      const streetUrl=page.url();
      await page.locator('#topics').click();
      assert.equal(await page.locator('#title').innerText(),'Все темы');
      assert.equal(await page.locator('[data-topic]').count(),3);
      await page.locator('[data-topic="2"]').click();
      assert.equal(await page.locator('[data-topic-phrase]').count(),2);
      await page.locator('#street-topics-back').click();
      await page.locator('[data-topic="0"]').click();
      await page.locator('[data-topic-phrase="3"]').click();
      assert.equal(await page.locator('#title').innerText(),'Практика фразы');
      await page.locator('#close').click();
      assert.equal(page.url(),streetUrl,'Topic selection must remain inside Street');
      if(viewport.width===393){
        const files=['21.mp3','22.mp3','23.mp3','24.mp3','25.mp3','26.mp3'];
        const packageFiles=Array.from({length:53},(_,i)=>String(i+1).padStart(2,'0')+'.mp3');
        const decoded=await page.evaluate(async clips=>{
          const audioContext=new AudioContext();
          const result=[];
          try{
            for(const clip of clips){
              const url='./assets/panda-street-voice-v20261125/'+clip;
              const response=await fetch(url);
              if(!response.ok)throw Error('MP3 response '+clip+': '+response.status);
              const data=await response.arrayBuffer();
              // decodeAudioData() detaches the input buffer; measure bytes before decoding.
              const bytes=data.byteLength;
              const decoded=await audioContext.decodeAudioData(data);
              result.push({clip,bytes,duration:decoded.duration,channels:decoded.numberOfChannels});
            }
            return result;
          }finally{await audioContext.close()}
        },packageFiles);
        for(const sound of decoded){
          assert(sound.bytes>3000,'Empty MP3: '+sound.clip);
          assert(sound.duration>0.3&&sound.duration<20,'Invalid MP3 duration: '+sound.clip);
          assert(sound.channels>=1&&sound.channels<=2,'Unexpected MP3 channel count: '+sound.clip);
        }
        for(let i=0;i<files.length;i++){
          await page.locator('#short').click();
          await page.locator('[data-i="'+i+'"]').click();
          await page.locator('#hear').click();
          const clip=files[i];
          await page.waitForFunction(filename=>
            window.__streetAudio.some(a=>a.src.endsWith('/'+filename)&&a.played),
            clip,{timeout:10000});
          if(i===0){
            await page.waitForFunction(()=>window.__streetChanged(window.__streetMouthBefore,window.__streetSample(286,604,168,75))>15,null,{timeout:8000});
            assert.equal(await page.evaluate(()=>window.__streetChanged(window.__streetFixedBefore,window.__streetSample(20,900,120,120))),0,'Stationary background pixels must not move during speech');
          }
          const played=await page.evaluate(()=>window.__streetAudio.at(-1));
          assert.equal(played.error,false,'Browser reported MP3 playback error: '+clip);
          await page.locator('#close').click();
        }
        assert(await page.evaluate(()=>window.__streetMotionLog.includes('talking')),
          'Approved male MP3 playback must animate Panda face');
        const motionCanvas=await page.evaluate(()=>{
          const c=document.getElementById('street-face-motion-layer');
          return {width:c.width,height:c.height,cssWidth:c.getBoundingClientRect().width,
                  sourceWidth:document.getElementById('art').width};
        });
        assert(motionCanvas.width===865&&motionCanvas.height===1536&&motionCanvas.cssWidth>0,
          'V1.2 compositing canvas must be visible; localized movement verified by pixel comparisons above');
        assert(await page.evaluate(()=>window.PandaStreetVoiceV20261125.lookup('我叫安娜，你呢？','male')===null),'Female dialogue must never be routed to Street AI');
        assert(await page.evaluate(()=>window.PandaStreetVoiceV20261125.lookup('没有这句话','male')===null),'Unknown phrase must not fabricate a clip');
        reports.push({viewport:name,decoded,played:files,roleBoundary:'passed'});
      }
      if(viewport.width===393){
        // Regression from Android screen recording 38791.mp4:
        // one Send tap on valid 我有点忙 must close input, show both turns
        // and save it to history instead of opening "Панда объясняет".
        const intactBefore=await page.locator('#stage').boundingBox();
        await page.locator('#send').click();
        await page.locator('#entry').fill('我有点忙');
        // Reproduce the Android keyboard reducing viewport height without width change.
        await page.setViewportSize({width:393,height:520});
        await page.waitForTimeout(120);
        const intactWithKeyboard=await page.locator('#stage').boundingBox();
        assert(Math.abs(intactBefore.width-intactWithKeyboard.width)<=1,
          'Android keyboard must not shrink Panda scene WIDTH');
        assert(Math.abs(intactBefore.height-intactWithKeyboard.height)<=1,
          'Android keyboard must not shrink Panda scene HEIGHT');
        await page.screenshot({path:output+'/keyboard-stable-'+name+'.png'});
        const silentBefore=await page.evaluate(()=>window.__streetAudio.length);
        await page.locator('#submit').click();
        await page.setViewportSize({width:393,height:852});
        await page.waitForFunction(()=>
          document.getElementById('live-learner')?.textContent.includes('我有点忙') &&
          document.getElementById('live-panda')?.textContent.includes('好，那你先忙吧！') &&
          !document.getElementById('shade')?.classList.contains('open'),
          null,{timeout:10000});
        assert.equal(await page.locator('#shade').evaluate(el=>el.classList.contains('open')),false);
        assert.equal(await page.evaluate(()=>window.__streetAudio.length),silentBefore,'Unrecorded reply must remain silent');
        assert(await page.evaluate(()=>window.__streetMotionLog.includes('reaction')),
          'Text-only Panda reply must show a short silent facial reaction');
        await page.screenshot({path:output+'/face-reaction-'+name+'.png'});
        await page.locator('#history').click();
        assert.match(await page.locator('#body').innerText(),/我有点忙/);
        assert.match(await page.locator('#body').innerText(),/好，那你先忙吧/);
        await page.locator('#close').click();
        reports.push({viewport:name,oneTapSend:'passed',validBusyPhrase:'conversational reply'});
      }
      await page.locator('#theme').click();
      await page.waitForFunction(()=>document.documentElement.dataset.theme==='day',null,{timeout:10000});
      await page.screenshot({path:output+'/day-'+name+'.png'});
      await page.locator('#theme').click();
      await page.waitForFunction(()=>document.documentElement.dataset.theme==='night',null,{timeout:5000});
      // Verify the real Street UI can save a grammar correction and the
      // ordinary Panda AI history can train the very same local card.
      await page.locator('#send').click();
      await page.locator('#entry').fill('他有二个妹妹');
      await page.locator('#submit').click();
      await page.locator('#street-correction-review').click();
      await page.locator('#street-review-consent').check();
      await page.locator('#street-review-save').click();
      await page.locator('#street-review-start').click();
      assert.match(await page.locator('#street-recall-prompt').innerText(),/две младшие сестры/);
      assert(!await page.locator('#body').innerText().then(t=>t.includes('他有两个妹妹')));
      await page.locator('#street-recall-close').click();
      await page.locator('#close').click();
      await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#pg346-history')&&document.documentElement.dataset.pandaUiReady==='true');
      await page.locator('#pg346-history').click();
      await page.locator('#pg-review-summary').click();
      assert.match(await page.locator('#pg-review-list').innerText(),/他有两个妹妹/);
      await page.locator('#pg-review-consent').check();
      await page.locator('#pg-review-start').click();
      await page.locator('#pg-review-input').fill('他有两个妹妹');
      await page.locator('#pg-review-form button[type="submit"]').click();
      assert.match(await page.locator('#pg-review-feedback').innerText(),/Следующее повторение через 1 день/);
      assert.match(await page.locator('#pg-review-stats').innerText(),/Позже: 1/);
      await page.screenshot({path:output+'/shared-review-'+name+'.png'});
      reports.push({viewport:name,sharedReview:'passed'});
      if(viewport.width!==393)reports.push({viewport:name,dayNight:'passed'});
    }finally{await context.close()}
  }
  // Reproduce 38813.jpg: one dependency cannot load on Android,
  // but the Panda must still answer, keep its face animation and never show
  // "Модуль Panda AI недоступен. Проверь подключение".
  const fallbackContext=await browser.newContext({
    viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1
  });
  try{
    const fallbackPage=await fallbackContext.newPage();
    fallbackPage.on('pageerror',e=>errors.push(String(e.message)));
    await fallbackPage.route('**/assets/panda-cross-character-memory-v1.mjs*',route=>route.abort('failed'));
    await fallbackPage.goto(base+'/panda-street-ai-preview.html',{waitUntil:'domcontentloaded'});
    await fallbackPage.waitForFunction(()=>document.querySelector('#stage')?.dataset.brainState==='fallback',null,{timeout:15000});
    await fallbackPage.waitForFunction(()=>document.querySelector('#street-face-motion-layer'),null,{timeout:15000});
    await fallbackPage.waitForFunction(()=>document.querySelector('#stage.street-live-v12 #street-face-motion-layer[data-motion-state="idle"]'),null,{timeout:20000});
    await fallbackPage.evaluate(()=>{
      window.__streetFallbackMotions=[];
      const face=()=>Array.from(document.querySelector('#street-face-motion-layer').getContext('2d').getImageData(190,420,360,258).data);
      const neutral=face();
      window.__streetReactionChanged=()=>{const current=face();let n=0;for(let i=0;i<neutral.length;i+=4)if(Math.abs(neutral[i]-current[i])+Math.abs(neutral[i+1]-current[i+1])+Math.abs(neutral[i+2]-current[i+2])>18)n++;return n;};
      const layer=document.getElementById('street-face-motion-layer');
      new MutationObserver(()=>{
        const state=layer.getAttribute('data-motion-state');
        window.__streetFallbackMotions.push(state);

      }).observe(layer,{attributes:true,attributeFilter:['data-motion-state']});
    });
    await fallbackPage.locator('#send').click();
    await fallbackPage.locator('#entry').fill('我有点忙。');
    await fallbackPage.locator('#submit').click();
    await fallbackPage.waitForFunction(()=>
      document.getElementById('live-panda')?.textContent.includes('好，那你先忙吧')&&
      document.getElementById('live-learner')?.textContent.includes('我有点忙')&&
      !document.getElementById('shade')?.classList.contains('open'),
      null,{timeout:12000});
    await fallbackPage.waitForFunction(()=>window.__streetFallbackMotions?.includes('reaction'),null,{timeout:6000});
    await fallbackPage.waitForFunction(()=>window.__streetReactionChanged()>15,null,{timeout:1500});
    assert(await fallbackPage.evaluate(()=>window.__streetReactionChanged()>15),'Silent reaction must change actual face pixels');
    assert(!await fallbackPage.locator('#toast').innerText().then(s=>s.includes('Модуль Panda AI недоступен')),
      'Older fatal-error toast must never show');
    await fallbackPage.screenshot({path:output+'/brain-import-failed-graceful.png'});
    reports.push({viewport:'393x852',forcedModuleFailure:'graceful limited chat',silentFaceMotion:'passed'});
  }finally{await fallbackContext.close()}
  assert.deepEqual(errors,[],'Browser JavaScript errors: '+errors.join('; '));
  fs.writeFileSync(output+'/results.json',JSON.stringify({reports,errors},null,2));
  console.log('STREET CHROMIUM ANDROID EMULATION PASS '+JSON.stringify(reports));
}finally{await browser.close()}
