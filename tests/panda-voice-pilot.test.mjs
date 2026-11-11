import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {PILOT_LINES,verifyPilotAnswer} from '../assets/panda-voice-pilot-engine.mjs';

test('pilot includes exactly the two Lesson 1 human-voiced prompts',()=>{
 assert.equal(PILOT_LINES.length,2);
 assert.deepEqual(PILOT_LINES.map(x=>x.audioKey),['你好','我是学生']);
 const owner=fs.readFileSync(new URL('../assets/owner-audio-v237.js',import.meta.url),'utf8');
 for(const word of ['你好','我是学生'])assert(owner.includes('"'+word+'": "./assets/owner-clean-v237/'));
});
test('pilot validates Chinese and marked pinyin; does not mistake a wrong phrase as correct',()=>{
 assert(verifyPilotAnswer(0,'你好！').ok);
 assert(verifyPilotAnswer(0,'ni2 hao3').ok);
 assert(verifyPilotAnswer(0,'nǐ hǎo').ok);
 assert(!verifyPilotAnswer(0,'ni hao').ok);
 assert(!verifyPilotAnswer(0,'我很好').ok);
 assert(verifyPilotAnswer(1,'我是学生。').ok);
 assert(verifyPilotAnswer(1,'wo3 shi4 xue2 sheng5').ok);
 assert(!verifyPilotAnswer(1,'学生').ok);
 assert(!verifyPilotAnswer(1,'我是老师').ok);
 assert(!verifyPilotAnswer(2,'你好').ok);
});
test('standalone pilot uses no OpenAI backend and no replacement TTS',()=>{
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../assets/panda-voice-pilot-ui.mjs',import.meta.url),'utf8');
 assert(html.includes('owner-audio-v237.js'));
 assert(html.includes('panda-voice-pilot-ui.mjs'));
 for(const forbidden of ['api.openai.com','OPENAI_API_KEY','workers.dev','speechSynthesis']){
  assert(!html.includes(forbidden));assert(!js.includes(forbidden));
 }
});
test('mobile speech recognizer must show transcript to learner before sending',async()=>{
 const markup=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const dom=new JSDOM(markup,{url:'https://example.test/panda-voice-pilot.html',pretendToBeVisual:true});
 const d=dom.window.document;
 const instances=[];
 class FakeSpeech{
  constructor(){instances.push(this)}
  start(){this.started=true}
  stop(){this.stopped=true;this.onend?.()}
  abort(){this.aborted=true;this.onend?.()}
  emit(text){this.onresult?.({results:[[{transcript:text}]]})}
  fail(code){this.onerror?.({error:code});this.onend?.()}
 }
 dom.window.webkitSpeechRecognition=FakeSpeech;
 dom.window.PandaOwnerAudio={lookup:key=>['你好','我是学生'].includes(key)?'./assets/owner-clean-v237/fake.mp3':null};
 globalThis.window=dom.window;globalThis.document=d;globalThis.localStorage=dom.window.localStorage;
 globalThis.Audio=class {constructor(src){this.src=src}pause(){}play(){return Promise.resolve()}};
 try{
  await import('../assets/panda-voice-pilot-ui.mjs?test=android');
  const form=d.getElementById('form'),mic=d.getElementById('mic'),reply=d.getElementById('answer');
  assert(d.getElementById('log').textContent.includes('你好'));
  assert(!d.getElementById('hear').disabled);
  mic.click();assert.equal(mic.getAttribute('aria-pressed'),'true');
  instances[0].emit('你好！');
  assert.equal(reply.value,'你好！');
  assert(!d.getElementById('log').textContent.includes('✅ Верно!'),'never grade speech without user confirmation');
  assert(d.getElementById('status').textContent.includes('Правильность тонов по голосу не оценена'));
  instances[0].onend?.();
  form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('log').textContent.includes('我是学生'));
  assert(!d.getElementById('hear').disabled);
  assert.equal(reply.value,'');
  instances[0].emit('неподходящий текст');
  assert.equal(reply.value,'');
  mic.click();
  instances[1].fail('not-allowed');
  assert(d.getElementById('status').textContent.includes('Доступ к микрофону запрещён'));
  assert(!mic.disabled);
  reply.value='我是学生';
  form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('log').textContent.includes('Обе фразы верные'));
  assert(d.getElementById('send').disabled);
  assert(dom.window.localStorage.getItem('pg-panda-voice-pilot-v1-last'));
  d.getElementById('reset').click();
  assert(!d.getElementById('send').disabled);
  assert(d.getElementById('log').textContent.includes('你好'));
 }finally{
  dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;delete globalThis.Audio;
 }
});
