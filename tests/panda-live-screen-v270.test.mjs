import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {CONVERSATIONS} from '../assets/panda-live-lessons.mjs';
import {PILOT_AUDIO,lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {answerNonStop,promptFor} from '../assets/panda-nonstop-v267.mjs';
import {interpretUtterance,replyToExtraSpeech} from '../assets/panda-live-conversation-v266.mjs';
import {choosePracticePrompt} from '../assets/panda-live-prompts-v270.mjs';
import {verifyAnswerFor} from '../assets/panda-voice-pilot-engine.mjs';
test('greetings, punctuation, written tones and existing audio',()=>{
 for(const [input,zh] of [['你好！','你好！'],['你好呀。','你好！'],['你好啊','你好！'],['早上好！','早上好！'],['中午好','中午好！'],['下午好','下午好！'],['晚上好！','晚上好！'],[' 晚 上 好 呀！','晚上好！']]){const r=answerNonStop(input,[1],promptFor(CONVERSATIONS,1));assert.equal(r.kind,'question',input);assert.equal(r.reply.hanzi,zh);assert(lookupPilotAudio(r.reply.audioKey));assert(r.spoken.known)}
 assert.equal(replyToExtraSpeech('你好吗？').answer.hanzi,'很好！');assert.equal(answerNonStop('谢谢！',[1]).reply.hanzi,'不客气！');assert.equal(answerNonStop('谢谢',[1]).reply.audioKey,null);
 const lines=CONVERSATIONS[0].lines;assert(verifyAnswerFor(lines,1,'wǒ hěn hǎo').ok);assert(!verifyAnswerFor(lines,1,'wó hén hào').ok);
 for(const src of Object.values(PILOT_AUDIO))assert(fs.statSync(new URL('../'+src,import.meta.url)).size>1000,src);
});
test('prompt memory varies questions without unlocking chapters',()=>{
 const recent=[],date=new Date(2026,10,12);for(let i=0;i<6;i++){const p=choosePracticePrompt(CONVERSATIONS,[1,6],recent,date,i===0?6:null);assert([1,6].includes(p.line.lesson));assert(!recent.includes(p.line.hanzi));recent.push(p.line.hanzi)}
 const q=choosePracticePrompt(CONVERSATIONS,[1,6],[],date,6).line;assert.equal(answerNonStop('我有妹妹',[1,6],q).kind,'statement');assert.equal(answerNonStop('我没有哥哥，我有妹妹',[1,6],q).kind,'answer');
 const sister=choosePracticePrompt(CONVERSATIONS,[6],['你有哥哥吗？','你有弟弟吗？','你有姐姐吗？'],date).line;assert.equal(sister.hanzi,'你有妹妹吗？');assert.equal(answerNonStop('我有妹妹',[6],sister).kind,'answer');assert.equal(answerNonStop('我有弟弟',[6],sister).kind,'statement');assert.equal(answerNonStop('我有弟弟和妹妹',[6],sister).kind,'answer');assert.notEqual(answerNonStop('我没有妹妹，我有妹妹',[6],sister).kind,'answer');assert.equal(answerNonStop('你有哥哥吗',[1]).kind,'unknown');assert.equal(interpretUtterance('我有弟弟和妹妹',6).pinyin,'Wǒ yǒu dìdi hé mèimei.');
});
test('DOM flow, progress, modes, family context, hint, history, speech consent',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:'https://example.test/panda-voice-pilot.html',pretendToBeVisual:true,runScripts:'outside-only'}),w=dom.window;
 w.eval(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'));
 for(const key of ['window','document','location','history','localStorage'])globalThis[key]=key==='window'?w:w[key];
 globalThis.requestAnimationFrame=w.requestAnimationFrame.bind(w);globalThis.cancelAnimationFrame=w.cancelAnimationFrame.bind(w);Object.defineProperty(globalThis,'navigator',{configurable:true,value:w.navigator});Object.defineProperty(w,'isSecureContext',{value:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};globalThis.Audio=class{play(){this.onplaying?.();return Promise.resolve()}pause(){this.onpause?.()}};
 const sessions=[];w.SpeechRecognition=class{constructor(){sessions.push(this)}start(){this.onstart?.()}abort(){}stop(){this.onend?.()}};
 const $=id=>w.document.getElementById(id),click=id=>$(id).click(),send=text=>{$('message').value=text;$('message-form').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}))};
 try{
  localStorage.setItem('pg-hsk1-v3-complete',JSON.stringify(['foundations','pronouns']));const progress=localStorage.getItem('pg-hsk1-v3-complete');await import('../assets/panda-live-screen-v270.mjs?test='+Date.now());assert.equal(w.document.documentElement.dataset.pandaLiveReady,'true');assert.equal($('lesson-select').options.length,7);
  send('你好');assert.equal($('phrase').textContent,'你好吗？');send('我很好');assert.equal($('step').textContent,'Диалог завершён');assert(localStorage.getItem('pg-panda-voice-pilot-v1-last'));
  click('mode-nonstop');send('晚上好！');assert.equal($('phrase').textContent,'晚上好！');send('你好吗？');assert.equal($('phrase').textContent,'很好！');send('谢谢');assert.equal($('mode-nonstop').getAttribute('aria-pressed'),'true');assert.equal($('phrase').textContent,'不客气！');assert.equal($('audio-note').hidden,false);send('你好吗');assert.equal($('phrase').textContent,'很好！');
  for(let i=0;i<50;i++)send('你好吗？');assert.equal($('recent').children.length,2);assert($('history').children.length<=100);click('history-open');assert($('history-dialog').open);$('history-dialog').close();click('hint');assert(!$('hint-text').hidden);click('hint');assert($('hint-text').hidden);
  click('mode-short');assert.equal($('step').textContent,'Диалог завершён');click('mode-nonstop');assert.equal($('phrase').textContent,'很好！');
  $('lesson-select').value='6';$('lesson-select').dispatchEvent(new w.Event('change'));assert.equal($('phrase').textContent,'你有哥哥吗？');send('我有妹妹');assert($('status').textContent.includes('не ответ'));assert.equal($('phrase').textContent,'你有哥哥吗？');send('我没有哥哥，我有妹妹');assert($('status').textContent.includes('Теперь задай'));assert($('recent').textContent.includes('младшая сестра'));assert($('recent').textContent.includes('mèimei'));send('你有哥哥吗');assert.equal($('phrase').textContent,'我有一个哥哥。');
  click('mic');assert($('speech-dialog').open);assert.equal(sessions.length,0);click('speech-allow');assert.equal(sessions.length,1);sessions[0].onresult({results:[[{transcript:'晚上好',confidence:.4}]]});assert.equal($('phrase').textContent,'晚上好！');assert($('status').textContent.includes('неуверенно'));
  assert.equal(localStorage.getItem('pg-hsk1-v3-complete'),progress);assert(!Object.values(localStorage).join().includes('我有妹妹'));click('finish');assert.equal($('mode-short').getAttribute('aria-pressed'),'true');
 }finally{w.dispatchEvent(new w.Event('pagehide'));dom.window.close()}
});
