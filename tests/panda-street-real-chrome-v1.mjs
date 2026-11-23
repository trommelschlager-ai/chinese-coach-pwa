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

      if(viewport.width===393){
        const files=['01.mp3','02.mp3','03.mp3'];
        const decoded=await page.evaluate(async clips=>{
          const audioContext=new AudioContext();
          const result=[];
          try{
            for(const clip of clips){
              const url='./assets/panda-street-male-voice-v1/'+clip;
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
        },files);
        for(const sound of decoded){
          assert(sound.bytes>3000,'Empty MP3: '+sound.clip);
          assert(sound.duration>0.3&&sound.duration<20,'Invalid MP3 duration: '+sound.clip);
          assert(sound.channels>=1&&sound.channels<=2,'Unexpected MP3 channel count: '+sound.clip);
        }
        for(let i=0;i<3;i++){
          await page.locator('#short').click();
          await page.locator('[data-i="'+i+'"]').click();
          await page.locator('#hear').click();
          const clip=files[i];
          await page.waitForFunction(filename=>
            window.__streetAudio.some(a=>a.src.endsWith('/'+filename)&&a.played),
            clip,{timeout:10000});
          const played=await page.evaluate(()=>window.__streetAudio.at(-1));
          assert.equal(played.error,false,'Browser reported MP3 playback error: '+clip);
          await page.locator('#close').click();
        }
        const oldCount=await page.evaluate(()=>window.__streetAudio.length);
        await page.locator('#short').click();
        await page.locator('[data-i="3"]').click();
        await page.locator('#hear').click();
        await page.waitForFunction(()=>
          document.getElementById('toast').textContent.includes('мужская запись для неё пока не загружена'),
          null,{timeout:4000});
        assert.equal(await page.evaluate(()=>window.__streetAudio.length),oldCount,
          'Unapproved 你好！ must not be synthesized or played');
        await page.locator('#close').click();
        reports.push({viewport:name,decoded,played:['01.mp3','02.mp3','03.mp3'],unapproved04:'silent'});
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
        await page.locator('#submit').click();
        await page.setViewportSize({width:393,height:852});
        await page.waitForFunction(()=>
          document.getElementById('live-learner')?.textContent.includes('我有点忙') &&
          document.getElementById('live-panda')?.textContent.includes('好，那你先忙吧！') &&
          !document.getElementById('shade')?.classList.contains('open'),
          null,{timeout:10000});
        assert.equal(await page.locator('#shade').evaluate(el=>el.classList.contains('open')),false);
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
      if(viewport.width!==393)reports.push({viewport:name,dayNight:'passed'});
    }finally{await context.close()}
  }
  assert.deepEqual(errors,[],'Browser JavaScript errors: '+errors.join('; '));
  fs.writeFileSync(output+'/results.json',JSON.stringify({reports,errors},null,2));
  console.log('STREET CHROMIUM ANDROID EMULATION PASS '+JSON.stringify(reports));
}finally{await browser.close()}
