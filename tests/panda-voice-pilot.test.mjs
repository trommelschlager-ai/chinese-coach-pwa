import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {PILOT_LINES,REPLIES,NEW_WORDS,verifyPilotAnswer} from '../assets/panda-voice-pilot-engine.mjs';

test('lesson 1 dialog greets and then asks a genuine question, with explicit supplementary vocabulary',()=>{
 assert.equal(PILOT_LINES.length,2);
 assert.deepEqual(PILOT_LINES.map(x=>x.panda),['你好！','你好吗？']);
 assert.equal(PILOT_LINES[0].audioKey,'你好');
 assert.equal(PILOT_LINES[1].audioKey,'','Never silently mismatch a different recording');
 assert.equal(REPLIES['asked-back'].hanzi,'我也很好，谢谢！');
 assert(NEW_WORDS.some(x=>x.hanzi==='吗'));
 assert(NEW_WORDS.some(x=>x.hanzi==='很'));
 assert(NEW_WORDS.some(x=>x.hanzi==='呢'));
 const owner=fs.readFileSync(new URL('../assets/owner-audio-v237.js',import.meta.url),'utf8');
 assert(owner.includes('"你好": "./assets/owner-clean-v237/'));
 assert(!owner.includes('"你好吗"'));
});
test('Panda accepts natural how-are-you response and branches when student asks back',()=>{
 for(const answer of ['你好','nǐ hǎo','ni3 hao3'])assert(verifyPilotAnswer(0,answer).ok,answer);
 assert(!verifyPilotAnswer(0,'我很好').ok,'Greeting is not a question: keep language accurate');
 for(const answer of ['我很好','wǒ hěn hǎo','wo3 hen3 hao3']){
  const r=verifyPilotAnswer(1,answer);
  assert(r.ok&&r.branch==='short',answer);
 }
 for(const answer of ['我很好，你呢？','我很好你呢','wǒ hěn hǎo nǐ ne','wo3 hen3 hao3 ni3 ne5']){
  const r=verifyPilotAnswer(1,answer);
  assert(r.ok&&r.branch==='asked-back',answer);
 }
 assert(!verifyPilotAnswer(1,'ni hao').ok);
 assert(!verifyPilotAnswer(1,'我很好吗').ok);
 assert(!verifyPilotAnswer(1,'你好').ok);
 assert(!verifyPilotAnswer(2,'你好').ok);
});
test('panda illustration, speech bubble and hidden keyboard; no unauthorized voices or paid API',()=>{
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../assets/panda-voice-pilot-ui.mjs',import.meta.url),'utf8');
 assert(html.includes('panda-go-panda-only-v173.webp'));
 assert(html.includes('id="phrase"'));
 assert(html.includes('id="mic"'));
 assert(html.includes('id="typing" class="typing" hidden'));
 assert(html.includes('Тоны голоса Панда пока не оценивает'));
 assert(html.includes('id="audio-note"'));
 assert(!html.includes('id="log"'));
 for(const forbidden of ['api.openai.com','OPENAI_API_KEY','workers.dev','speechSynthesis']){
  assert(!html.includes(forbidden));assert(!js.includes(forbidden));
 }
});
test('speech auto-advances to 你好吗; full answer gets meaningful panda response and no phantom voice',async()=>{
 const markup=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 const dom=new JSDOM(markup,{url:'https://example.test/panda-voice-pilot.html',pretendToBeVisual:true});
 const d=dom.window.document;const instances=[];
 class FakeSpeech{
  constructor(){instances.push(this)}
  start(){this.started=true}
  stop(){this.stopped=true;this.onend?.()}
  abort(){this.aborted=true;this.onend?.()}
  emit(text){this.onresult?.({results:[[{transcript:text}]]})}
  fail(error){this.onerror?.({error});this.onend?.()}
 }
 dom.window.webkitSpeechRecognition=FakeSpeech;
 dom.window.PandaOwnerAudio={lookup:key=>key==='你好'?'./assets/owner-clean-v237/hello.mp3':null};
 globalThis.window=dom.window;globalThis.document=d;globalThis.localStorage=dom.window.localStorage;
 globalThis.Audio=class{
  constructor(src){this.src=src;this.currentTime=0}
  play(){this.onplay?.();return Promise.resolve()}
  pause(){}
 };
 try{
  await import('../assets/panda-voice-pilot-ui.mjs?test=panda-chat-2026');
  const mic=d.getElementById('mic');
  assert.equal(d.getElementById('phrase').textContent,'你好！');
  assert(!d.getElementById('hear').disabled);
  assert(d.getElementById('typing').hidden);
  assert(d.getElementById('character').querySelector('img'));
  d.getElementById('hear').click();
  assert(d.getElementById('character').classList.contains('speaking'));
  mic.click();instances[0].emit('你好！');
  assert.equal(d.getElementById('phrase').textContent,'你好吗？');
  assert.equal(d.getElementById('step').textContent,'2 из 2');
  assert(d.getElementById('hear').disabled,'No native recording of question yet');
  assert(!d.getElementById('audio-note').hidden,'Missing voice must be disclosed');
  instances[0].emit('неподходящая запись');
  assert.equal(d.getElementById('heard').textContent,'','Late speech event must be ignored');
  mic.click();instances[1].emit('你好');
  assert(d.getElementById('status').textContent.includes('Попробуй ещё раз'));
  mic.click();instances[2].emit('我很好，你呢？');
  assert(!d.getElementById('completed').hidden);
  assert(d.getElementById('conversation').hidden);
  assert.equal(d.getElementById('phrase').textContent,'我也很好，谢谢！');
  assert.equal(d.getElementById('pinyin').textContent,'Wǒ yě hěn hǎo, xièxie!');
  assert(!d.getElementById('audio-note').hidden);
  d.getElementById('again').click();
  assert(d.getElementById('completed').hidden);
  d.getElementById('type-toggle').click();
  assert(!d.getElementById('typing').hidden);
  d.getElementById('answer').value='你好！';
  d.getElementById('typing').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(d.getElementById('phrase').textContent,'你好吗？');
  d.getElementById('answer').value='我很好';
  d.getElementById('typing').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(d.getElementById('phrase').textContent,'很好！');
  assert(!d.getElementById('completed').hidden);
 }finally{
  dom.window.close();delete globalThis.window;delete globalThis.document;delete globalThis.localStorage;delete globalThis.Audio;
 }
});
