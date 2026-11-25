import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PANDA_USER_V563_BATCH as batch} from '../assets/panda-approved-voice-registry-v516.mjs';
const base=process.env.QA_BASE||'http://127.0.0.1:4173';
const cases=[{"input":"我早上先洗脸再刷牙","reply":"然后呢？","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-01.mp3"},{"input":"我想去但是没时间","reply":"你接下来想做什么？","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-02.mp3"},{"input":"我先刷牙然后吃早饭","reply":"你早上吃什么？","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-03.mp3"},{"input":"你早上先做什么？","reply":"我先刷牙，再吃早饭。","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-04.mp3"},{"input":"你每天几点起床？","reply":"我每天七点起床。","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-05.mp3"},{"input":"你现在在做什么","reply":"我在和你聊天。","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-06.mp3"},{"input":"你今天做了什么","reply":"我今天和你练习中文。","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-07.mp3"},{"input":"我周末常常跑步。","reply":"你周末做什么？","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-08.mp3"},{"input":"我今天很忙。","reply":"你今天忙吗？","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-09.mp3"},{"input":"你怎么了","reply":"我没事，谢谢你。","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-10.mp3"},{"input":"我想要一碗面条。","reply":"你想吃什么？","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-12.mp3"},{"input":"我爱你","reply":"谢谢你！我很开心！","src":"./assets/panda-ai-voice-batch01-v563/PA-V563-11.mp3","intro":true}];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{for(const mode of ['short','nonstop']){
 const context=await browser.newContext({viewport:{width:393,height:800},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.addInitScript(()=>{
   window.__voiceTrace=[];
   const NativeAudio=window.Audio;
   const instrument=a=>{
    const original=a.play.bind(a);
    a.play=function(...args){
     const item={src:a.currentSrc||a.src,event:'play'};
     window.__voiceTrace.push(item);
     try{const promise=original(...args);promise?.then(()=>{item.event='resolved'},e=>{item.event='rejected';item.error=String(e)});return promise;}
     catch(e){item.event='threw';item.error=String(e);throw e;}
    };
    a.addEventListener('playing',()=>window.__voiceTrace.push({src:a.currentSrc||a.src,event:'playing'}));
    a.addEventListener('error',()=>window.__voiceTrace.push({src:a.currentSrc||a.src,event:'error',code:a.error?.code}));
    return a;
   };
   window.Audio=new Proxy(NativeAudio,{construct(target,args){return instrument(Reflect.construct(target,args));},apply(target,that,args){return instrument(Reflect.apply(target,that,args));}});
  });
  await page.goto(base+'/panda-voice-pilot.html',{waitUntil:'domcontentloaded'});
  await page.locator('#pg346').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.pandaUiReady==='true');
  if(mode==='nonstop')await page.locator('#pg346-nonstop').click();
  const decoded=await page.evaluate(async entries=>{const ac=new AudioContext();try{return await Promise.all(entries.map(async x=>{const r=await fetch(x.src);if(!r.ok)throw Error(x.id+' HTTP '+r.status);const b=await r.arrayBuffer(),size=b.byteLength;const d=await ac.decodeAudioData(b);return {id:x.id,size,duration:d.duration};}));}finally{await ac.close();}},batch);
  for(const [i,x] of decoded.entries()){assert.equal(x.size,batch[i].bytes,x.id);assert(x.duration>0,x.id);}
  console.log('PASS new batch exact audio decode 12/12 '+mode);
  const send=async input=>{const composer=page.locator('#pg346-input'),button=page.locator('#pg346-send');if(!await composer.isVisible())await button.click();await composer.fill(input);await button.click();};
  for(const c of cases){
   try{
    if(c.intro){await send('我叫安东');await page.waitForFunction(()=>window.PandaApprovedBridge337?.snapshot().history.some(t=>t.who==='you'&&t.hanzi==='我叫安东'));}
    await page.evaluate(()=>window.__voiceTrace.length=0);
    await send(c.input);
    await page.waitForFunction(({input,reply})=>{const h=window.PandaApprovedBridge337?.snapshot().history;return h?.at(-2)?.hanzi===input&&h.at(-1)?.hanzi===reply;},c,{timeout:5000});
    assert((await page.evaluate(()=>window.PandaApprovedBridge337.snapshot())).audioAvailable,c.reply);
    const expected=new URL(c.src,page.url()).href;
    await page.waitForFunction(expected=>window.__voiceTrace.some(t=>t.src===expected&&['playing','resolved'].includes(t.event)),expected,{timeout:10000});
    console.log('PASS exact autoplay '+mode+' '+c.input+' -> '+c.reply);
   }catch(e){
    const snapshot=await page.evaluate(()=>({trace:window.__voiceTrace,status:window.PandaApprovedBridge337?.snapshot().status,history:window.PandaApprovedBridge337?.snapshot().history.slice(-4),audioAvailable:window.PandaApprovedBridge337?.snapshot().audioAvailable})).catch(()=>null);
    const failure={mode,...c,error:String(e),snapshot,pageErrors};
    failures.push(failure);console.error('NEW_AUDIO_FAILURE '+JSON.stringify(failure));
   }
  }
 }finally{await context.close();}
}}finally{await browser.close();}
assert.equal(failures.length,0,JSON.stringify(failures));
