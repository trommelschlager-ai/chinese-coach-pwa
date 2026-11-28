import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try {
 const context=await browser.newContext({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto(base+'/panda-voice-pilot.html');
 const decoded=await page.evaluate(async()=>{
  const manifest=await fetch('./assets/panda-ai-voice-20261128/manifest.json').then(r=>r.json());
  const ctx=new AudioContext(),out=[];
  try {
   for(const clip of manifest.clips){
    const res=await fetch(clip.src);if(!res.ok)throw Error(clip.src+' HTTP '+res.status);
    const bytes=await res.arrayBuffer();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==clip.sha256)throw Error('Hash mismatch '+clip.id);
    const audio=await ctx.decodeAudioData(bytes);
    out.push(audio.duration);
   }
   return out;
  }finally{await ctx.close();}
 });
 assert.equal(decoded.length,86);assert(decoded.every(x=>Number.isFinite(x)&&x>0));
 await context.close();
 console.log('PASS all 86 new female MP3s served, SHA-256 checked and decoded in Chromium');
 for(const [q,reply,id] of [
  ['你很漂亮','谢谢你！你喜欢这里的风景吗？','001'],
  ['你很可爱','谢谢你！你喜欢熊猫吗？','002'],
  ['我爱你','谢谢你！我很开心！你叫什么名字？','003']
 ]){
  const c=await browser.newContext({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
  const p=await c.newPage();
  await p.addInitScript(()=>{window.__playing=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){this.addEventListener('playing',()=>window.__playing.push(this.currentSrc||this.src),{once:true});return play.apply(this,args);};});
  await p.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true'&&document.documentElement.dataset.pandaSemanticPilot==='ready');
  await p.locator('#pg346-nonstop').click();
  await p.evaluate(q=>window.PandaApprovedBridge337.send(q),q);
  await p.waitForFunction(q=>{const h=window.PandaApprovedBridge337.snapshot().history;return h.at(-2)?.hanzi===q&&h.at(-1)?.who==='panda'},q);
  const s=await p.evaluate(()=>window.PandaApprovedBridge337.snapshot());
  assert.equal(s.history.at(-1).hanzi,reply,q);assert.equal(s.audioAvailable,true,q);
  await p.waitForFunction(id=>window.__playing.some(src=>src.endsWith('/PA-20261128-'+id+'.mp3')),id,{timeout:10000});
  console.log('PASS actual automatic audio reply: '+q+' -> '+reply);
  await c.close();
 }
}finally{await browser.close();}
