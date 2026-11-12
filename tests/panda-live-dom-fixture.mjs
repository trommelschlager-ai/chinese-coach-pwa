import fs from 'node:fs';
import {JSDOM} from 'jsdom';
let sequence=0;
export async function liveDOM(lesson=1,{speech=true}={}){
 const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:`https://example.test/panda-voice-pilot.html?lesson=${lesson}`,pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
 w.eval(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'));
 for(const key of ['window','document','location','history','localStorage'])globalThis[key]=key==='window'?w:w[key];
 globalThis.requestAnimationFrame=w.requestAnimationFrame.bind(w);globalThis.cancelAnimationFrame=w.cancelAnimationFrame.bind(w);Object.defineProperty(globalThis,'navigator',{configurable:true,value:w.navigator});Object.defineProperty(w,'isSecureContext',{value:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const clips=[],sessions=[];
 globalThis.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.paused=true;clips.push(this)}play(){return Promise.resolve()}pause(){this.paused=true;this.onpause?.()}playing(){this.paused=false;this.onplaying?.()}};
 if(speech)w.SpeechRecognition=class{constructor(){sessions.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}emit(text,confidence=1){this.onresult?.({results:[[{transcript:text,confidence}]]})}fail(error){this.onerror?.({error})}};
 await import('../assets/panda-live-screen-v270.mjs?fixture='+sequence++);
 const el=id=>w.document.getElementById(id),send=text=>{el('message').value=text;el('message-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}))};
 return {dom,w,el,send,clips,sessions,close(){w.dispatchEvent(new w.Event('pagehide'));w.close()}};
}
