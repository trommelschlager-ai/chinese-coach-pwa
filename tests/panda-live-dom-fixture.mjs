import fs from 'node:fs';
import {JSDOM} from 'jsdom';
let sequence=0;
export async function liveDOM(lesson=1,{speech=true,completed=[],params='',active=false}={}){
 const query=new URLSearchParams(params);
 if(lesson!==null)query.set('lesson',lesson);
 const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:`https://example.test/panda-voice-pilot.html?${query}`,pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
 if(completed.length)w.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(completed));
 w.eval(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'));
 for(const key of ['window','document','location','history','localStorage'])globalThis[key]=key==='window'?w:w[key];
 globalThis.requestAnimationFrame=w.requestAnimationFrame.bind(w);globalThis.cancelAnimationFrame=w.cancelAnimationFrame.bind(w);Object.defineProperty(globalThis,'navigator',{configurable:true,value:w.navigator});Object.defineProperty(w,'isSecureContext',{value:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const clips=[],sessions=[];
 globalThis.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.paused=true;clips.push(this)}play(){return Promise.resolve()}pause(){this.paused=true;this.onpause?.()}playing(){this.paused=false;this.onplaying?.()}};
 if(speech)w.SpeechRecognition=class{constructor(){sessions.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}emit(text,confidence=1){this.onresult?.({results:[[{transcript:text,confidence}]]})}fail(error){this.onerror?.({error})}};
 const module=active
  ?dom.window.document.querySelector('script[src*="panda-hsk2-preview-core-v1.mjs"]').getAttribute('src')
  :'./assets/panda-live-screen-v270.mjs';
 const moduleURL=new URL('../'+module.slice(2),import.meta.url);
 moduleURL.searchParams.set('fixture',String(sequence++));
 await import(moduleURL.href);
 const el=id=>w.document.getElementById(id),send=text=>{el('message').value=text;el('message-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}))};
 return {dom,w,el,send,clips,sessions,close(){w.dispatchEvent(new w.Event('pagehide'));w.close()}};
}
