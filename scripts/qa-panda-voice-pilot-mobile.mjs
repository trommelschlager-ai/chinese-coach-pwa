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
  assert(['早上好！','中午好！','下午好！','晚上好！'].includes(await page.locator('#phrase').textContent()));
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
 // Every newly enabled conversation, including both branching outcomes.
 const context=await browser.newContext({viewport:{width:390,height:825},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 const scenarios=[
  {id:2,answers:['你好','我是老师'],final:'我也是老师。'},
  {id:2,answers:['你好','不是，我是学生'],final:'我是老师。'},
  {id:3,answers:['你好','我44岁'],final:'我三岁。'},
  {id:4,answers:['你好','今天星期一'],final:'明天星期二。'},
  {id:5,answers:['你好','今天是3月5号'],final:'明天三月六号。'},
  {id:6,answers:['你好','我有两个哥哥'],final:'我也有哥哥。'},
  {id:6,answers:['你好','我没有哥哥'],final:'我有一个哥哥。'},
  {id:7,answers:['你好','今天很冷','明天下雨'],final:'谢谢！'}
 ];
 for(const [index,scenario] of scenarios.entries()){
  await page.goto(BASE+'/panda-voice-pilot.html?lesson='+scenario.id,{waitUntil:'load'});
  await page.locator('html[data-panda-live-ready=true]').waitFor();
  assert.equal(await page.locator('#topic-count').textContent(),`${scenario.id} / 7`);
  assert((await page.locator('#pilot-note').textContent()).includes('единый голос'));
  for(const answer of scenario.answers){
   assert(await page.locator('#audio-note').isHidden());
   await page.locator('#hear').click();
   await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
   if(await page.locator('#typing').isHidden())await page.locator('#type-toggle').click();
   const previous=await page.locator('#phrase').textContent();
   await page.locator('#answer').fill(answer);await page.locator('#send').click();
   await page.waitForFunction(text=>document.getElementById('phrase').textContent!==text,previous);
  }
  assert.equal(await page.locator('#phrase').textContent(),scenario.final);
  assert(await page.locator('#completed').isVisible());assert(await page.locator('#audio-note').isHidden());
  await page.locator('#hear').click();await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  const size=await page.evaluate(()=>({viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(size.scrollWidth<=size.viewportWidth+2);
  await page.screenshot({path:DIR+'/lesson-'+scenario.id+'-'+index+'.png',fullPage:true,animations:'disabled'});
  report.push({lesson:scenario.id,final:scenario.final,...size,success:true});
 }
 // Training should rotate four voice greetings, independently of phone time.
 for(const hour of [8,12,15,20]){
  const timed=await browser.newContext({viewport:{width:320,height:825},isMobile:true,hasTouch:true});
  await timed.addInitScript(({hour})=>{const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[2026,10,11,hour]))}}},{hour});
  const greetingPage=await timed.newPage();greetingPage.on('pageerror',error=>errors.push(error.message));
  await greetingPage.goto(BASE+'/panda-voice-pilot.html');
  await greetingPage.locator('html[data-panda-live-ready=true]').waitFor();
  assert.equal(await greetingPage.locator('#phrase').textContent(),'早上好！');
  assert.equal(await greetingPage.locator('select').count(),0);
  await greetingPage.locator('#hear').click();
  await greetingPage.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  await greetingPage.locator('#type-toggle').click();
  await greetingPage.locator('#answer').fill('我很好');await greetingPage.locator('#send').click();
  assert.equal(await greetingPage.locator('#step').textContent(),'1 из 2');
  await greetingPage.locator('#answer').fill('早上好');await greetingPage.locator('#send').click();
  await greetingPage.waitForFunction(()=>document.querySelector('#phrase').textContent==='你好吗？');
  await greetingPage.locator('#topic-next').click();
  await greetingPage.waitForFunction(()=>document.querySelector('#topic-count').textContent==='2 / 7');
  assert.equal(await greetingPage.locator('#phrase').textContent(),'中午好！');
  await greetingPage.locator('#reset').click();
  assert.equal(await greetingPage.locator('#phrase').textContent(),'下午好！','Reset should rotate too');
  await greetingPage.locator('#topic-prev').click();
  await greetingPage.waitForFunction(()=>document.querySelector('#topic-count').textContent==='1 / 7');
  assert.equal(await greetingPage.locator('#phrase').textContent(),'晚上好！');
  await greetingPage.locator('#topic-prev').click();
  await greetingPage.waitForFunction(()=>document.querySelector('#topic-count').textContent==='7 / 7');
  assert.equal(await greetingPage.locator('#phrase').textContent(),'早上好！');
  await greetingPage.locator('#topic-next').click();
  await greetingPage.waitForFunction(()=>document.querySelector('#topic-count').textContent==='1 / 7');
  assert.equal(await greetingPage.locator('#phrase').textContent(),'中午好！');
  const size=await greetingPage.evaluate(()=>({viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(size.scrollWidth<=size.viewportWidth+2);
  await greetingPage.screenshot({path:DIR+'/greeting-'+hour+'.png',fullPage:true,animations:'disabled'});
  report.push({hour,rotation:['早上好','中午好','下午好','晚上好'],...size,success:true});await timed.close();
 }
 const sources=await page.evaluate(async()=>Object.values((await import('./assets/panda-live-audio.mjs')).PILOT_AUDIO));
 assert.equal(sources.length,23);
 for(const src of sources){const response=await page.request.get(new URL(src,BASE+'/').href);assert.equal(response.status(),200,src);assert((await response.body()).length>1000,src)}
 assert.deepEqual(errors,[]);await context.close();
 fs.writeFileSync(DIR+'/qa-report.json',JSON.stringify({
  note:'Mobile Chromium, simulated speech recognition only. All 23 MP3 sources checked; all seven conversation topics exercised, including new media playback. Spoken tone acoustics need human QA.',
  results:report
 },null,2)+'\n');
 console.log('Panda conversation mobile Chromium: PASS');
}finally{await browser.close()}
