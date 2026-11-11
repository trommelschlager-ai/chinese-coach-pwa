import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {SCENES,validateTurn,normalizeSpoken} from '../assets/panda-conversation-v1.mjs';

test('Dialogues stay in the approved content or explicitly preteach new phrases',()=>{
 assert.deepEqual(SCENES.map(s=>s.lesson),[1,1,2,3,4,5,6,7]);
 assert.equal(SCENES.find(s=>s.id==='hello').introduce.length,0);
 const extra=SCENES.find(s=>s.id==='howareyou');
 assert(extra.bonus&&extra.introduce.length>=4);
 for(const part of ['你好吗','我很好','你呢','也','谢谢'])assert(extra.introduce.some(x=>x.hanzi.includes(part)));
 for(const s of SCENES){
  assert(s.turns.length>=1);
  for(const t of s.turns){
   assert(t.panda&&t.pinyin&&t.meaning&&t.expected&&t.explanation);
   for(const a of t.accept)assert.equal(validateTurn(s.id,s.turns.indexOf(t),a).ok,true,s.id+': '+a);
  }
 }
});
test('Panda checks Chinese responses, pinyin tones and rejects arbitrary or misleading replies',()=>{
 assert(validateTurn('hello',0,'你好！').ok);
 assert(validateTurn('hello',0,'ni3 hao3').ok);
 assert(!validateTurn('hello',0,'ni hao').ok);
 assert(!validateTurn('hello',0,'我很好').ok);
 assert(validateTurn('howareyou',1,'我很好，你呢？').ok);
 assert(validateTurn('howareyou',1,'wo3 hen3 hao3 ni3 ne5').ok);
 assert(!validateTurn('howareyou',1,'我很好').ok);
 assert(!validateTurn('howareyou',1,'ni3 hao3').ok);
 assert(validateTurn('introduce',0,'我不是学生').ok);
 assert(validateTurn('introduce',1,'我不是老师').ok);
 assert(validateTurn('family',0,'这是我妈妈').ok);
 assert(validateTurn('family',1,'我没有妹妹').ok);
 assert(validateTurn('numbers',0,'我有两个').ok);
 assert(validateTurn('weekdays',0,'今天是星期五').ok);
 assert(validateTurn('weekdays',1,'明天星期六').ok);
 assert(validateTurn('dates',0,'今天十一月六号').ok);
 assert(!validateTurn('dates',0,'今天十月六号').ok);
 assert(validateTurn('weather',0,'今天下雨').ok);
 assert(!validateTurn('weather',0,'今天是下雨').ok);
 assert(!validateTurn('hello',5,'你好').ok);
 assert.equal(normalizeSpoken('我很好，你呢？'),'我很好你呢');
});
test('Interface is safe and new mode keeps previously approved screens unchanged',()=>{
 const page=readFileSync(new URL('../panda-talk.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../panda-lesson1.html',import.meta.url),'utf8');
 const lesson=readFileSync(new URL('../hsk1-first-v189.html',import.meta.url),'utf8');
 assert(page.includes('panda-conversation-ui-v1.mjs'));
 assert(main.includes('panda-lesson1-ui.mjs'));
 assert(lesson.includes('hsk1-first-v189.js?v=242'));
 const files=['../assets/panda-conversation-ui-v1.mjs','../assets/panda-conversation-v1.mjs'];
 for(const file of files){const src=readFileSync(new URL(file,import.meta.url),'utf8');
  for(const forbidden of ['api.openai.com','OPENAI_API_KEY','workers.dev','speechSynthesis'])assert(!src.includes(forbidden),file+' must not introduce paid services or unapproved TTS');
 }
});
test('Conversation UI switches scenes and checks student replies in a DOM',async()=>{
 const page=readFileSync(new URL('../panda-talk.html',import.meta.url),'utf8');
 const dom=new JSDOM(page,{url:'https://example.test/chinese-coach-pwa/panda-talk.html',pretendToBeVisual:true});
 globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;
 globalThis.Audio=class {constructor(src){this.src=src}play(){return Promise.resolve()}pause(){}};
 const d=dom.window.document;
 dom.window.localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns','numbers','weekdays','dates','family','weather']));
 dom.window.PandaOwnerAudio={lookup:key=>key==='你好'?'./assets/owner-clean-v237/hello.mp3':null};
 try{
  await import('../assets/panda-conversation-ui-v1.mjs');
  assert.equal(d.querySelectorAll('[data-scene]').length,8);
  assert(!d.querySelector('[data-scene="family"]').disabled);
  assert(!d.querySelector('[data-scene="dates"]').disabled);
  assert(d.getElementById('chat').textContent.includes('你好'));
  assert(!d.getElementById('hear').disabled);
  d.getElementById('reply').value='你好！';
  d.getElementById('reply-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('chat').textContent.includes('我是学生'));
  d.getElementById('reply').value='我是学生';
  d.getElementById('reply-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('chat').textContent.includes('Диалог завершён'));
  assert(JSON.parse(dom.window.localStorage.getItem('pg-panda-conversation-v1-completed')).hello);
  d.querySelector('[data-scene="howareyou"]').click();
  assert(!d.getElementById('intro').classList.contains('hidden'));
  assert(d.getElementById('intro').textContent.includes('我很好'));
  assert(d.getElementById('send').disabled);
  d.getElementById('intro').querySelector('button').click();
  d.getElementById('reply').value='你好';
  d.getElementById('reply-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  d.getElementById('reply').value='我很好，你呢？';
  d.getElementById('reply-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('chat').textContent.includes('我也很好，谢谢'));
 }finally{
  dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;delete globalThis.Audio;
 }
});

test('Android-style microphone capture: recognize, review transcript, stop stale sessions and retry after denied permission',async()=>{
 const markup=readFileSync(new URL('../panda-talk.html',import.meta.url),'utf8');
 const dom=new JSDOM(markup,{url:'https://example.test/chinese-coach-pwa/panda-talk.html',pretendToBeVisual:true});
 const d=dom.window.document;
 const seen=[];
 class MockRecognition{
  constructor(){seen.push(this);this.started=false}
  start(){this.started=true}
  stop(){this.stopped=true;this.onend?.()}
  abort(){this.aborted=true;this.onend?.()}
  emit(text){this.onresult?.({results:[[{transcript:text}]]})}
  fail(code){this.onerror?.({error:code});this.onend?.()}
 }
 dom.window.webkitSpeechRecognition=MockRecognition;
 dom.window.PandaOwnerAudio={lookup:key=>key==='你好'||key==='我是学生'?'./assets/owner-clean-v237/'+key+'.mp3':null};
 globalThis.window=dom.window;globalThis.document=d;globalThis.localStorage=dom.window.localStorage;
 globalThis.Audio=class{constructor(src){this.src=src}pause(){}play(){return Promise.resolve()}};
 try{
  await import('../assets/panda-conversation-ui-v1.mjs?android-voice-test=1');
  const mic=d.getElementById('mic'),answer=d.getElementById('reply'),form=d.getElementById('reply-form'),status=d.getElementById('status');
  assert(!mic.disabled,'speech recognizer should be available');
  assert(!d.getElementById('hear').disabled,'hello must use licensed native source');
  mic.click();
  assert.equal(mic.getAttribute('aria-pressed'),'true');
  assert.equal(seen[0].lang,'zh-CN');
  assert(seen[0].started);
  seen[0].emit('你好！');
  assert.equal(answer.value,'你好！');
  assert(status.textContent.includes('Тоны по голосу не проверялись'));
  assert(d.getElementById('chat').textContent.includes('你好！'));
  seen[0].onend();
  assert.equal(mic.getAttribute('aria-pressed'),'false');
  form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('chat').textContent.includes('我是学生'));
  assert(!d.getElementById('hear').disabled,'second native sentence should be audible');
  assert.equal(answer.value,'');
  seen[0].emit('не тот ответ');
  assert.equal(answer.value,'','old recognizer result must never affect next prompt');
  mic.click();
  assert.equal(seen.length,2);
  seen[1].fail('not-allowed');
  assert(status.textContent.includes('Доступ к микрофону запрещён'));
  assert(!mic.disabled,'recovery from permission failure should permit reattempt');
  answer.value='我是学生';
  form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('chat').textContent.includes('Диалог завершён'));
  d.getElementById('repeat').click();
  mic.click();
  assert.equal(seen.length,3);
  const stale=seen[2].onresult;
  d.querySelector('[data-scene="howareyou"]').click();
  assert(seen[2].aborted,'changing scene must cancel recording');
  stale?.({results:[[{transcript:'неподходящая запись'}]]});
  assert(!answer.value.includes('неподходящая'),'cancelled recording must not overwrite reply');
  assert(d.getElementById('mic').disabled,'cannot record while reviewing new phrases');
 }finally{
  dom.window.close();
  delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;delete globalThis.Audio;
 }
});
