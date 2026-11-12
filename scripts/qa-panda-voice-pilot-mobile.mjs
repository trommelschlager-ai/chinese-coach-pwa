// Chromium regression tests. Reduced viewports simulate keyboard space;
// FakeSpeech exercises lifecycle events, not a physical Android microphone/IME.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.QA_BASE||'http://127.0.0.1:4173';
const DIR='qa/panda-voice-pilot';fs.mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[],errors=[];
async function ready(page){await page.locator('html[data-panda-live-ready=true]').waitFor()}
async function send(page,text){await page.locator('#message').fill(text);await page.locator('#send').click()}
async function geometry(page){
 await page.waitForFunction(()=>Math.abs(document.querySelector('main').getBoundingClientRect().height-(visualViewport?.height||innerHeight))<2);
 return await page.evaluate(()=>{
  const card=document.querySelector('.card').getBoundingClientRect();
  return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
   cardOverflow:document.querySelector('.card').scrollHeight-document.querySelector('.card').clientHeight,
   controls:['mic','message','send','hint','mode-short','mode-nonstop'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,visible:r.width>0&&r.height>0&&r.x>=0&&r.right<=innerWidth+1&&r.y>=0&&r.bottom<=innerHeight+1&&(id.startsWith('mode-')||r.bottom<=card.bottom+1)}})};
 });
}
try{
 for(const width of [360,393,412,430]){
  const context=await browser.newContext({viewport:{width,height:825},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   window.__speech=[];window.SpeechRecognition=class{constructor(){window.__speech.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}};
   localStorage.setItem('qa-sentinel','keep');
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/panda-voice-pilot.html');await ready(page);
  assert(await page.locator('.panda-picture').evaluate(img=>img.naturalWidth>0));
  await page.locator('#hear').click();await page.waitForFunction(()=>document.querySelector('#character').dataset.state==='talking');
  for(const mode of ['short','nonstop']){
   await page.locator('#mode-'+mode).click();
   if(mode==='nonstop'){
    for(const [text,reply] of [['你好','你好！'],['你好呀','你好！'],['你好啊','你好！'],['早上好','早上好！'],['中午好','中午好！'],['下午好','下午好！'],['晚上好！','晚上好！'],['你好吗？','很好！']]){await send(page,text);assert.equal(await page.locator('#phrase').textContent(),reply)}
    await send(page,'谢谢');assert.equal(await page.locator('#mode-nonstop').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#phrase').textContent(),'不客气！');assert(await page.locator('#audio-note').isVisible());
    await send(page,'你好吗？');
   }
   for(const hint of [false,true]){
    if((await page.locator('#hint').getAttribute('aria-expanded'))!==String(hint))await page.locator('#hint').click();
    for(const height of [568,640,740,825,915,400,320]){
     await page.setViewportSize({width,height});const m=await geometry(page);
     assert(m.scrollWidth<=width+1&&m.scrollHeight<=height+1,JSON.stringify(m));assert(m.cardOverflow<2,JSON.stringify(m));assert(m.controls.every(c=>c.visible),JSON.stringify(m));report.push({mode,hint,...m});
    }
   }
   await page.setViewportSize({width,height:825});await page.locator('#hint').click();
   if(mode==='nonstop')await send(page,'你好吗？');
   await page.screenshot({path:DIR+'/'+mode+'-'+width+'.png',fullPage:false,animations:'disabled'});
  }
  await page.locator('#speed-toggle').click();assert.equal(await page.locator('#speed-toggle').getAttribute('aria-pressed'),'true');await page.locator('#speed-toggle').click();
  await page.locator('#mic').click();assert(await page.locator('#speech-dialog').isVisible());assert.equal(await page.evaluate(()=>window.__speech.length),0);await page.locator('#speech-allow').click();
  await page.evaluate(()=>window.__speech.at(-1).onresult({results:[[{transcript:'晚上好',confidence:.4}]]}));assert.equal(await page.locator('#phrase').textContent(),'晚上好！');assert((await page.locator('#status').textContent()).includes('неуверенно'));
  await page.locator('#mode-short').click();await page.locator('#reset').click();await send(page,'你好');await send(page,'我很好');assert.equal(await page.locator('#step').textContent(),'Диалог завершён');
  assert(await page.evaluate(()=>localStorage.getItem('pg-panda-voice-pilot-v1-last')));assert.equal(await page.evaluate(()=>localStorage.getItem('qa-sentinel')),'keep');
  const dayNames=['日','一','二','三','四','五','六'];const day=await page.evaluate(()=>new Date().getDay());
  for(const {id,answers,final} of [
   {id:2,answers:['你好','我是老师'],final:'我也是老师。'},
   {id:2,answers:['你好','不是，我是学生'],final:'我是老师。'},
   {id:3,answers:['你好','我44岁'],final:'我三岁。'},
   {id:4,answers:['你好','今天星期'+dayNames[day]],final:day===1?'明天星期二。':'谢谢！'},
   {id:5,answers:['你好','今天是3月5号'],final:'明天三月六号。'},
   {id:6,answers:['你好','我没有哥哥，我有妹妹'],final:'谢谢！'},
   {id:7,answers:['你好','今天很冷','明天下雨'],final:'谢谢！'}
  ]){
   await page.locator('#lesson-select').selectOption(String(id));
   for(const answer of answers)await send(page,answer);
   assert.equal(await page.locator('#phrase').textContent(),final);assert.equal(await page.locator('#step').textContent(),'Диалог завершён');
   if(id===4)assert((await page.locator('#exercise-banner').textContent()).includes('твоего телефона'));
   if(id===5)assert((await page.locator('#exercise-banner').textContent()).includes('Учебная сценка'));
  }
  await page.locator('#lesson-select').selectOption('6');await page.locator('#mode-nonstop').click();await send(page,'我有妹妹');assert.equal(await page.locator('#phrase').textContent(),'你有哥哥吗？');assert((await page.locator('#status').textContent()).includes('не ответ'));
  await send(page,'我没有哥哥，我有妹妹');assert((await page.locator('#recent').textContent()).includes('Wǒ méiyǒu gēge, wǒ yǒu mèimei.'));await send(page,'你有哥哥吗');assert.equal(await page.locator('#phrase').textContent(),'我有一个哥哥。');
  await send(page,'今天天气怎么样');assert((await page.locator('#status').textContent()).includes('пока не знаю'));
  for(let i=0;i<12;i++)await send(page,'你好吗？');assert.equal(await page.locator('#recent article').count(),2);await page.locator('#history-open').click();assert(await page.locator('#history-dialog').isVisible());assert((await page.locator('#history article').count())>12);await page.locator('[data-close="history-dialog"]').click();
  await page.locator('#finish').click();assert.equal(await page.locator('#mode-short').getAttribute('aria-pressed'),'true');
  const sources=await page.evaluate(async()=>Object.values((await import('./assets/panda-live-audio.mjs')).PILOT_AUDIO));
  for(const src of sources){const response=await page.request.get(new URL(src,BASE+'/').href);assert.equal(response.status(),200,src);assert((await response.body()).length>1000,src)}
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(DIR+'/qa-report.json',JSON.stringify({note:'Chromium mobile viewports, simulated SpeechRecognition, reduced-height keyboard-space checks. Physical Android microphone and keyboard not tested.',results:report,errors},null,2)+'\n');
 console.log('Panda Live v270: '+report.length+' layout checks, all dialogue scenarios and 23 MP3 URLs PASS');
}finally{await browser.close()}
