// Real Chromium mobile viewport and UI flow.
// SpeechRecognition events are simulated; phone's real microphone is NOT tested here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const DIR='qa/panda-voice-pilot';
fs.mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[];
try{
 for(const width of [360,390,412]){
  const context=await browser.newContext({viewport:{width,height:825},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__pandaTestSpeech=[];
   class FakeSpeech{
    constructor(){window.__pandaTestSpeech.push(this)}
    start(){this.started=true;this.onstart?.()}
    stop(){this.stopped=true;this.onend?.()}
    abort(){this.aborted=true;this.onend?.()}
   }
   Object.defineProperty(window,'SpeechRecognition',{configurable:true,writable:true,value:FakeSpeech});
   Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,writable:true,value:FakeSpeech});
  });
  await page.goto(BASE+'/panda-voice-pilot.html',{waitUntil:'load'});
  await page.locator('html[data-panda-live-ready=true]').waitFor();
  const visual=await page.evaluate(()=>({
   viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   pandaWidth:document.querySelector('.panda-picture')?.naturalWidth||0
  }));
  assert(visual.scrollWidth<=width+2,'Horizontal overflow '+JSON.stringify(visual));
  assert(visual.pandaWidth>0,'Panda artwork failed to load');
  const native=await page.evaluate(async()=>{const m=await import('./assets/panda-live-audio.mjs');return m.lookupPilotAudio('你好')});
  assert(native?.endsWith('.mp3'),'Original native hello missing');
  const response=await page.request.get(new URL(native,BASE+'/').href);
  assert.equal(response.status(),200,'Native clip URL should work');
  assert((await response.body()).length>1000,'Native clip unexpectedly tiny');
  assert.equal(await page.locator('#phrase').textContent(),'你好！');
  assert(await page.locator('#typing').isHidden());
  await page.locator('#hear').click();
  await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  await page.locator('#mic').click();
  await page.evaluate(()=>{
   const r=window.__pandaTestSpeech.at(-1);
   r.onresult?.({results:[[{transcript:'你好！'}]]});r.onend?.();
  });
  await page.waitForFunction(()=>document.getElementById('phrase').textContent==='你好吗？');
  assert.equal(await page.locator('#phrase').textContent(),'你好吗？');
  assert(await page.locator('#audio-note').isHidden(),'Uploaded question audio is present');
  assert(await page.locator('#hear').isEnabled());
  await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  await page.locator('#mic').click();
  await page.evaluate(()=>{
   const r=window.__pandaTestSpeech.at(-1);
   r.onresult?.({results:[[{transcript:'我很好，你呢？'}]]});r.onend?.();
  });
  await page.waitForFunction(()=>document.getElementById('phrase').textContent==='我也很好，谢谢！');
  assert.equal(await page.locator('#phrase').textContent(),'我也很好，谢谢！');
  assert(await page.locator('#completed').isVisible());
  await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  await page.screenshot({path:DIR+'/android-'+width+'.png',fullPage:true,animations:'disabled'});
  await page.locator('#again').click();
  await page.locator('#type-toggle').click();
  assert(await page.locator('#typing').isVisible());
  await page.locator('#answer').fill('你好');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.getElementById('phrase').textContent==='你好吗？');
  assert.equal(await page.locator('#phrase').textContent(),'你好吗？');
  await page.locator('#answer').fill('我很好');
  await page.locator('#send').click();
  await page.waitForFunction(()=>document.getElementById('phrase').textContent==='很好！');
  assert.equal(await page.locator('#phrase').textContent(),'很好！');
  assert.deepEqual(errors,[],'Browser script errors');
  report.push({...visual,success:true});
  await context.close();
 }
 fs.writeFileSync(DIR+'/qa-report.json',JSON.stringify({
  note:'Mobile Chromium, simulated speech recognition only. All four uploaded MP3 sources mapped; real playback state checked. Spoken tone acoustics need human QA.',
  results:report
 },null,2)+'\n');
 console.log('Panda conversation mobile Chromium: PASS');
}finally{await browser.close()}
