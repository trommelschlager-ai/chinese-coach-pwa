import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {PILOT_LINES,verifyPilotAnswer} from '../assets/panda-voice-pilot-engine.mjs';

test('pilot keeps two approved Lesson 1 native audio prompts',()=>{
 assert.equal(PILOT_LINES.length,2);
 assert.deepEqual(PILOT_LINES.map(x=>x.audioKey),['你好','我是学生']);
 const owner=fs.readFileSync(new URL('../assets/owner-audio-v237.js',import.meta.url),'utf8');
 for(const word of ['你好','我是学生'])assert(owner.includes('"'+word+'": "./assets/owner-clean-v237/'));
});
test('only matching Chinese or tone-marked pinyin is accepted',()=>{
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
test('compact interface hides keyboard, does not claim acoustic tone evaluation or use paid LLM',()=>{
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../assets/panda-voice-pilot-ui.mjs',import.meta.url),'utf8');
 assert(html.includes('owner-audio-v237.js'));
 assert(html.includes('panda-voice-pilot-ui.mjs'));
 assert(html.includes('id="typing" class="typing" hidden'));
 assert(html.includes('id="mic"'));
 assert(html.includes('id="completed" hidden'));
 assert(!html.includes('id="log"'));
 assert(html.includes('Панда проверяет распознанные слова, а не точность тонов.'));
 for(const forbidden of ['api.openai.com','OPENAI_API_KEY','workers.dev','speechSynthesis']){
  assert(!html.includes(forbidden));assert(!js.includes(forbidden));
 }
});
test('single-mic recognition auto-advances with no submit, wrong answers retry, optional typing works',async()=>{
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
  await import('../assets/panda-voice-pilot-ui.mjs?test=minimal');
  const mic=d.getElementById('mic'),type=d.getElementById('type-toggle'),text=d.getElementById('answer');
  assert.equal(d.getElementById('phrase').textContent,'你好！');
  assert(d.getElementById('typing').hidden);
  assert(!d.getElementById('hear').disabled);
  assert.equal(d.getElementById('step').textContent,'1 из 2');
  mic.click();assert.equal(mic.getAttribute('aria-pressed'),'true');
  instances[0].emit('непонятно');
  assert.equal(d.getElementById('phrase').textContent,'你好！');
  assert(d.getElementById('status').textContent.includes('Не совсем'));
  assert(d.getElementById('heard').textContent.includes('непонятно'));
  mic.click();instances[1].emit('你好！');
  assert.equal(d.getElementById('phrase').textContent,'我是学生。');
  assert.equal(d.getElementById('step').textContent,'2 из 2');
  assert(d.getElementById('heard').textContent.includes('✅ 你好'));
  instances[1].emit('не должно попадать');
  assert(!d.getElementById('heard').textContent.includes('не должно'));
  mic.click();instances[2].fail('not-allowed');
  assert(d.getElementById('status').textContent.includes('Разреши доступ'));
  assert(!mic.disabled);
  type.click();
  assert(!d.getElementById('typing').hidden);
  text.value='我是学生';
  d.getElementById('typing').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(!d.getElementById('completed').hidden);
  assert(d.getElementById('conversation').hidden);
  assert.equal(d.getElementById('step').textContent,'Готово');
  assert(dom.window.localStorage.getItem('pg-panda-voice-pilot-v1-last'));
  d.getElementById('again').click();
  assert(d.getElementById('completed').hidden);
  assert(d.getElementById('typing').hidden);
  assert.equal(d.getElementById('phrase').textContent,'你好！');
 }finally{
  dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;delete globalThis.Audio;
 }
});
