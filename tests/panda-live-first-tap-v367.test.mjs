import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

test('fast second microphone tap does not cancel first Mandarin recognition',async()=>{
 const {w,el,sessions,close}=await liveDOM(1);
 try{
  el('mic').click();el('speech-allow').click();
  assert.equal(sessions.length,1);
  const session=sessions[0],originalHandler=session.onresult;
  assert.equal(el('mic').getAttribute('aria-pressed'),'true');
  el('mic').click();
  assert.equal(el('mic').getAttribute('aria-pressed'),'true','Second accidental tap must not abort');
  assert.equal(sessions.length,1);
  assert.equal(session.onresult,originalHandler,'Microphone recognition must remain live');
  assert.match(el('status').textContent,/Микрофон уже включён/);
  session.emit('你好',.94);
  assert.equal(el('phrase').textContent,'你好吗？','First attempt should complete normally');
  assert.equal(w.PandaApprovedBridge337.snapshot().active,false);
 }finally{close()}
});

test('intentional stop remains available after short startup guard',async()=>{
 const {el,sessions,close}=await liveDOM(1);
 const clock=Date.now;
 try{
  el('mic').click();el('speech-allow').click();
  const session=sessions[0],start=clock();
  Date.now=()=>start+3500;
  el('mic').click();
  assert.equal(el('mic').getAttribute('aria-pressed'),'false');
  assert.match(el('status').textContent,/остановлен по нажатию/);
  assert.equal(session.onresult,null,'Closed session must not produce answers');
  Date.now=clock;
  el('mic').click();
  assert.equal(sessions.length,2,'Mic starts again without page reload');
 }finally{Date.now=clock;close()}
});

test('visible Panda speech UX separates instruction from translation and shows uncertain transcript',()=>{
 const layer=fs.readFileSync(new URL('../assets/panda-live-v346.mjs',import.meta.url),'utf8');
 const style=fs.readFileSync(new URL('../assets/panda-live-scenic-v350.css',import.meta.url),'utf8');
 assert.match(layer,/class="pg346-main-ru">Привет!<\/span><aside class="pg350-welcome" role="note"/);
 assert.match(layer,/visibleInput\.value=signal\.text/,'Recognized but uncertain Chinese must appear in actual UI');
 assert.match(layer,/visibleInput\.focus\(\)/,'Learner should be able to correct it');
 assert.match(layer,/Слушаю китайскую речь/);
 assert.match(style,/v367: keep translation literal/);
});
