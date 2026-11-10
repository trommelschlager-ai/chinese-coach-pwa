'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom');
(async()=>{
const cases=[/* Lesson 4 deliberately replaced complex microphone controls with a short one-button dialogue. */['hsk1-first-v189.html','pg-hsk1-v189-lesson1',12,'#record-start','#record-stop','#record-listen','#pg-next','#pg-back'],['hsk1-second-v203.html','pg-hsk1-v203-pronouns',10,'[data-record-start]','[data-record-stop]','[data-record-play]','#pg-next','#pg-back'],['hsk1-fifth-v227.html','pg-hsk1-l5-v227',12,'[data-record-start]','[data-record-stop]','[data-record-play]','#pg5-next','#pg5-prev'],['hsk1-family-v231.html','pg-hsk1-l6-v231',12,'[data-record]','[data-stop]','[data-replay]','#pg5-next','#pg5-prev'],['hsk1-weather-v231.html','pg-hsk1-l7-v231',12,'[data-record]','[data-stop]','[data-replay]','#pg5-next','#pg5-prev']];
for(const [page,key,step,start,stop,replay,next,prev] of cases){
 const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'https://panda.test/'+page,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()}),w=dom.window,d=w.document;let urls=0;const played=[];
 w.localStorage.setItem(key,JSON.stringify({step,lessonVersion:237,heard:true,spoken:false,written:['日']}));
 w.URL.createObjectURL=()=> 'blob:take-'+(++urls);w.URL.revokeObjectURL=()=>{};
 Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
 w.MediaRecorder=class{static isTypeSupported(){return true}constructor(){this.state='inactive';this.mimeType='audio/webm'}start(){this.state='recording'}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new w.Blob(['valid recording payload'])});this.onstop?.()})}};
 w.Audio=function(path){played.push(path);this.pause=()=>{};this.play=()=>{queueMicrotask(()=>this.onended?.());return Promise.resolve()}};
 for(const s of d.querySelectorAll('script[src]')){
  const p=s.getAttribute('src').split('?')[0].replace(/^\.\//,'');if(p.includes('/vendor/'))continue;w.eval(fs.readFileSync(p,'utf8'));
 }
 const tick=()=>new Promise(r=>setTimeout(r,5));
 if(page.includes('second')){d.querySelector('[data-audio]')?.click();await tick()}
 d.querySelector(start).click();await tick();d.querySelector(stop).click();await tick();
 const before=d.querySelector(replay);assert(before&&!before.hidden&&!before.disabled,page+' must expose the captured take');
 if(page.includes('second')){d.querySelector('[data-spoken]')?.click()}
 if(page.includes('fourth')){d.querySelector(prev).click();await tick();d.querySelector(next).click();await tick()}else{const forward=d.querySelector(next);assert(!forward.disabled,page+' speaking should allow navigation');forward.click();await tick();d.querySelector(prev).click();await tick()}
 const after=d.querySelector(replay);assert(after&&!after.hidden&&!after.disabled,page+' lost recording after moving between screens');after.click();assert(played.some(x=>String(x).startsWith('blob:take-')),page+' cannot replay recorded take');
 w.close();console.log('PASS '+page+': recording survives screen navigation and remains playable (mock microphone).');
}
})();
