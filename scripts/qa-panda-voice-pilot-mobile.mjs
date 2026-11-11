import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const DIR='qa/panda-voice-pilot';
fs.mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const checks=[];
try{
 for(const width of [360,390,412]){
  const context=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__pandaTestSpeech=[];
   class FakeSpeech{
    constructor(){window.__pandaTestSpeech.push(this)}
    start(){this.started=true}
    stop(){this.stopped=true;this.onend?.()}
    abort(){this.aborted=true;this.onend?.()}
   }
   Object.defineProperty(window,'SpeechRecognition',{configurable:true,writable:true,value:FakeSpeech});
   Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,writable:true,value:FakeSpeech});
  });
  await page.goto(BASE+'/panda-voice-pilot.html',{waitUntil:'load'});
  await page.locator('#phrase').waitFor();
  const sizes=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(sizes.scrollWidth<=width+2,'Mobile horizontal overflow '+JSON.stringify(sizes));
  const native=await page.evaluate(()=>({
   hello:window.PandaOwnerAudio?.lookup('你好'),
   student:window.PandaOwnerAudio?.lookup('我是学生')
  }));
  assert(native.hello&&native.student,'Pilot needs licensed native voice recordings');
  for(const [key,src] of Object.entries(native)){
   const response=await page.request.get(new URL(src,BASE+'/').href);
   assert.equal(response.status(),200,'Missing clip '+key);
   assert((await response.body()).length>1000,'Short clip '+key);
  }
  assert.equal(await page.locator('#phrase').textContent(),'你好！');
  assert(await page.locator('#typing').isHidden());
  await page.locator('#hear').click();
  await page.locator('#mic').click();
  await page.evaluate(()=>{
   const rec=window.__pandaTestSpeech.at(-1);
   rec.onresult?.({results:[[{transcript:'你好！'}]]});rec.onend?.();
  });
  assert.equal(await page.locator('#phrase').textContent(),'我是学生。');
  assert.equal(await page.locator('#step').textContent(),'2 из 2');
  assert(await page.locator('#hear').isEnabled());
  await page.locator('#hear').click();
  await page.locator('#mic').click();
  await page.evaluate(()=>{
   const rec=window.__pandaTestSpeech.at(-1);
   rec.onresult?.({results:[[{transcript:'我是学生'}]]});rec.onend?.();
  });
  assert(await page.locator('#completed').isVisible());
  assert(await page.locator('#conversation').isHidden());
  await page.locator('#again').click();
  assert.equal(await page.locator('#phrase').textContent(),'你好！');
  assert.deepEqual(errors,[],'Page JavaScript errors');
  await page.screenshot({path:DIR+'/android-'+width+'.png',fullPage:true,animations:'disabled'});
  checks.push({...sizes,ok:true,native});
  await context.close();
 }
 fs.writeFileSync(DIR+'/qa-report.json',JSON.stringify({
  note:'Chromium Android-style viewport and mocked SpeechRecognition. Physical microphone and Mandarin tone perception are not tested.',
  checks
 },null,2)+'\n');
 console.log('Panda voice pilot Chromium mobile: PASS 360 / 390 / 412 px');
}finally{await browser.close()}
