import test from 'node:test';
import assert from 'node:assert/strict';
import {liveDOM} from './panda-live-dom-fixture.mjs';

test('silent embedded-browser recognition exits Connecting state and restores text entry',async()=>{
 const {w,el,close}=await liveDOM(1);
 const originalSetTimeout=globalThis.setTimeout;
 let fireStartupTimeout=null;
 try{
  w.SpeechRecognition=class {start(){}stop(){}abort(){}};
  globalThis.setTimeout=(fn,ms,...args)=>{
   if(ms===7000){fireStartupTimeout=fn;return originalSetTimeout(()=>{},700000)}
   return originalSetTimeout(fn,ms,...args);
  };
  el('mic').click();
  assert(el('speech-dialog').open,'Permission consent dialog should open first');
  el('speech-allow').click();
  assert.equal(el('mic').getAttribute('aria-pressed'),'true');
  assert.match(el('status').textContent,/Подключаю микрофон/);
  assert(fireStartupTimeout,'Seven-second startup watchdog should be installed');
  fireStartupTimeout();
  assert.equal(el('mic').getAttribute('aria-pressed'),'false','Broken WebView session should stop');
  assert.equal(el('speech-recovery').hidden,false);
  assert.match(el('speech-recovery-message').textContent,/7 секунд/);
  assert.match(el('speech-recovery').textContent,/Chrome/);
  assert.equal(el('message').disabled,false,'Text fallback must remain enabled');
 }finally{
  globalThis.setTimeout=originalSetTimeout;
  close();
 }
});

test('permission-denied speech error explains Chrome and microphone settings',async()=>{
 const {el,sessions,close}=await liveDOM(1);
 try{
  el('mic').click();el('speech-allow').click();
  assert.equal(sessions.length,1);
  sessions[0].fail('not-allowed');
  assert.equal(el('speech-recovery').hidden,false);
  assert.match(el('speech-recovery-message').textContent,/запрещён/);
  assert.equal(el('mic').getAttribute('aria-pressed'),'false');
  assert.match(el('speech-recovery').textContent,/WhatsApp/);
  assert.equal(el('speech-chrome').href.startsWith('https://'),true);
 }finally{close()}
});

test('microphone diagnostic stops all live tracks and identifies browser STT separately',async()=>{
 const {w,el,close}=await liveDOM(1);
 let stopped=0,copied='';
 try{
  Object.defineProperty(w.navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){stopped++}},{stop(){stopped++}}]})}});
  Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}});
  el('mic').click();el('speech-allow').click();
  sessionsAssert();
  el('speech-check').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stopped,2,'Permission check must release microphone immediately');
  assert.match(el('speech-check-result').textContent,/Микрофон разрешён/);
  el('speech-copy').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert(copied.includes('/panda-voice-pilot.html'),'Direct link must be copied');
  assert.match(el('speech-check-result').textContent,/Ссылка скопирована/);
 }finally{close()}
 function sessionsAssert(){
  assert.equal(el('speech-recovery').hidden,true,'Recovery should stay hidden on successful recognition start');
 }
});
