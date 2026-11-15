import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const dir='qa/panda-v365';fs.mkdirSync(dir,{recursive:true});
const inventory=JSON.parse(fs.readFileSync(dir+'/inventory.json'));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],report={physicalAndroid:false,inventory:inventory.length,files:new Set(inventory.map(e=>e.src)).size,playback:[],layouts:[],unrecordedResponses:[]};
try{
 const p=await browser.newPage({viewport:{width:393,height:825},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  const Native=window.Audio;window.__audio=[];window.Audio=class extends Native{constructor(src){super(src);window.__audio.push(this)}};
  localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers','weekdays','dates','family','weather']));
 });
 await p.goto(base+'/panda-voice-pilot.html');await p.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
 await p.locator('#pg346-hear').click(); // Real gesture grants page media activation.
 // All files must load and decode into real non-silent PCM, not just return HTTP 200.
 report.decoded=await p.evaluate(async entries=>{
  const ctx=new AudioContext();let cursor=0,count=0;
  const work=async()=>{while(cursor<entries.length){const {src}=entries[cursor++];const r=await fetch(src);if(!r.ok)throw Error(src+' HTTP '+r.status);const buf=await ctx.decodeAudioData(await r.arrayBuffer());const x=buf.getChannelData(0);let power=0;for(const v of x)power+=v*v;if(Math.sqrt(power/x.length)<.001)throw Error(src+' silent');count++;}};
  await Promise.all(Array.from({length:8},work));await ctx.close();return count;
 },[...new Map(inventory.map(e=>[e.src,e])).values()]);
 // Actual HTMLMediaElement playback at both speeds, complete to ended. Bounded
 // parallel isolated elements keep this full-corpus test practical in CI.
 for(const speed of [.8,1]){
  const results=await p.evaluate(async ({entries,speed})=>{
   let cursor=0;const results=[];
   const work=async()=>{while(cursor<entries.length){const {src}=entries[cursor++];await new Promise((resolve,reject)=>{
    const a=new Audio(src);a.playbackRate=speed;a.muted=false;a.volume=1;let advanced=false;
    const timer=setTimeout(()=>{a.pause();reject(Error(src+' stalled'))},30000);
    a.ontimeupdate=()=>{if(a.currentTime>0)advanced=true};a.onerror=()=>{clearTimeout(timer);reject(Error(src+' media error '+a.error?.code))};
    a.onended=()=>{clearTimeout(timer);if(!advanced||a.muted)reject(Error(src+' failed advancement'));else{results.push({src,speed,duration:a.duration});resolve()}};
    a.play().catch(e=>{clearTimeout(timer);reject(e)});
   });}};await Promise.all(Array.from({length:16},work));return results;
  },{entries:[...new Map(inventory.map(e=>[e.src,e])).values()],speed});report.playback.push(...results);
 }
 fs.writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2));
 await p.screenshot({path:dir+'/initial-seated.png'});
 // Exercise the application player repeatedly after cancellation, history and modes.
 await p.evaluate(()=>{window.__audio=[]});
 for(const mode of ['short','nonstop']){
  await p.locator(mode==='short'?'#pg346-short':'#pg346-nonstop').click();
  for(const q of ['你好','你好吗','谢谢','你做什么工作','你为什么学习中文','你有哥哥吗']){
   await p.locator('#pg346-input').fill(q);await p.locator('#pg346-send').click();
   const playable=await p.locator('#pg346-hear').isEnabled();
   if(playable){await p.locator('#pg346-hear').click();await p.waitForTimeout(180)}
   else{assert(await p.locator('#pg357-audio-note').isVisible(),'Missing recording must be explicit');report.unrecordedResponses.push({mode,q,response:await p.locator('.pg346-main-zh').textContent()})}
   const row=p.locator('.pg346-row-audio:not([disabled])').last();if(await row.count())await row.click();
   await p.locator('#pg346-speed').click();if(playable){await p.locator('#pg346-play').click();await p.waitForTimeout(180)}
   assert(await p.evaluate(()=>window.__audio.filter(a=>!a.paused&&!a.ended).length<=1),'No overlapping players');
   assert(await p.evaluate(()=>window.__audio.every(a=>!a.muted)),'No audio left muted');
  }
 }
 await p.locator('#pg346-short').click();
 // Simulate lifecycle cancellation separately; physical Android lock remains untested.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 await p.locator('.pg346-row-audio:not([disabled])').last().click();await p.waitForFunction(()=>window.PandaApprovedBridge337.snapshot().pose==='talking');
 for(const width of [360,393,412,430]){
  await p.setViewportSize({width,height:825});await p.waitForTimeout(250);
  const before=await p.locator('.pg352-mascot').boundingBox();await p.waitForTimeout(400);const after=await p.locator('.pg352-mascot').boundingBox();assert.deepEqual(before,after,'Body must be fixed');
  const geometry=await p.evaluate(()=>{const m=document.querySelector('.pg352-mascot'),s=document.querySelector('.pg346-scene');const mr=m.getBoundingClientRect(),sr=s.getBoundingClientRect(),st=getComputedStyle(s,'::before'),shadow=getComputedStyle(m,'::before');return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,animation:getComputedStyle(m).animationName,feet:sr.bottom-mr.bottom,stoneTop:parseFloat(st.height)*.162*600/207+parseFloat(st.bottom),shadow:shadow.backgroundImage}});
  assert(!geometry.overflow);assert.equal(geometry.animation,'none');assert(geometry.shadow.includes('radial-gradient'));assert(Math.abs(geometry.feet-geometry.stoneTop)<3,JSON.stringify(geometry));report.layouts.push(geometry);
  await p.screenshot({path:dir+`/seated-${width}.png`});
 }
 assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({decoded:report.decoded,playbacks:report.playback.length,layouts:report.layouts.length,errors}));
}finally{await browser.close()}
