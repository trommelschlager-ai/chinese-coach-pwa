import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {PILOT_LINES,REPLIES,NEW_WORDS,verifyPilotAnswer} from '../assets/panda-voice-pilot-engine.mjs';
import {PILOT_AUDIO,lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {ENVELOPES} from '../assets/panda-live-envelope.mjs';
import {CONVERSATIONS,missingConversationAudio} from '../assets/panda-live-lessons.mjs';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('Chinese sentence checking, punctuation and branch selection',()=>{
 for(const text of ['你好！','nǐ hǎo','ní hǎo','ni3hao3'])assert(verifyPilotAnswer(0,text).ok,text);
 for(const text of ['我很好','wǒ hěn hǎo','wo3hen3hao3'])assert.equal(verifyPilotAnswer(1,text).branch,'short');
 for(const text of ['我很好，你呢？','wǒ hěn hǎo nǐ ne','wo3hen3hao3ni3ne5'])assert.equal(verifyPilotAnswer(1,text).branch,'asked-back');
 for(const text of ['你好','我很好吗','我也你好','我很','你好我很好','很好'])assert(!verifyPilotAnswer(1,text).ok,text);
 assert(!verifyPilotAnswer(0,'我很好').ok);assert(!verifyPilotAnswer(0,'').ok);assert(!verifyPilotAnswer(9,'你好').ok);
 assert.equal(NEW_WORDS.length,5);
 assert.equal(CONVERSATIONS.length,7);
 assert.deepEqual(missingConversationAudio(CONVERSATIONS[0],key=>key==='你好'?'hello.mp3':null),['你好吗？','我也很好，谢谢！','很好！']);
 assert.deepEqual(missingConversationAudio(CONVERSATIONS[0],lookupPilotAudio),[]);
 assert.equal(Object.keys(PILOT_AUDIO).length,23);
 for(const [phrase,file] of Object.entries(PILOT_AUDIO)){
  assert(fs.statSync(new URL('../'+file,import.meta.url)).size>1000,phrase);
  assert(ENVELOPES[file]?.levels.length>10,phrase);
 }
 assert.equal(lookupPilotAudio('你好！'),PILOT_AUDIO['你好']);
 assert.equal(lookupPilotAudio('未知'),null);
 assert(CONVERSATIONS.slice(1).every(x=>x.status==='pilot-audio-complete-device-test-pending'));
});
test('microphone events, audio lifecycle, retries, cancellation and both branches',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:'https://example.test/panda-voice-pilot.html',pretendToBeVisual:true});
 const d=dom.window.document,instances=[],clips=[];
 class Speech{
  constructor(){instances.push(this)}start(){this.onstart?.()}stop(){this.onend?.()}abort(){this.onend?.()}
  emit(text){this.onresult?.({results:[[{transcript:text}]]})}
  fail(error){this.onerror?.({error})}
 }
 class Clip{
  constructor(src){this.src=src;this.currentTime=0;this.paused=true;clips.push(this)}
  play(){return Promise.resolve()}pause(){this.paused=true;this.onpause?.()}
  playing(){this.paused=false;this.onplaying?.()}
 }
 Object.assign(globalThis,{window:dom.window,document:d,localStorage:dom.window.localStorage,Audio:Clip});
 dom.window.webkitSpeechRecognition=Speech;
 const el=id=>d.getElementById(id),pose=()=>el('character').dataset.state;
 try{
  await import('../assets/panda-voice-pilot-ui.mjs?live-tests');
  el('hear').click();assert.equal(pose(),'idle','play promise alone must not animate');
  clips.at(-1).playing();assert.equal(pose(),'talking');
  clips.at(-1).onwaiting();assert.equal(pose(),'idle','buffering must stop speech animation');
  clips.at(-1).playing();clips.at(-1).onended();assert.equal(pose(),'idle');
  el('mic').click();assert.equal(instances.at(-1).lang,'zh-CN');assert.equal(pose(),'listening');
  const stale=instances.at(-1).onresult;
  instances.at(-1).emit('我很好');assert.equal(pose(),'retry');assert(['早上好！','中午好！','下午好！','晚上好！'].includes(el('phrase').textContent));
  el('reset').click();await sleep(1450);assert.equal(pose(),'idle','reset cancels delayed question playback');
  stale({results:[[{transcript:'你好'}]]});assert.equal(el('step').textContent,'1 из 2');
  el('mic').click();instances.at(-1).emit('你好');assert.equal(pose(),'happy');
  el('type-toggle').click();await sleep(950);assert.equal(el('phrase').textContent,'你好吗？','actions cannot cancel successful progression');
  assert(!el('hear').hidden);assert(el('audio-note').hidden);assert(clips.at(-1).src.endsWith('how-are-you.mp3'));
  el('mic').click();instances.at(-1).emit('你好');assert.equal(el('phrase').textContent,'你好吗？');
  el('mic').click();instances.at(-1).emit('我很好，你呢？');await sleep(950);
  assert.equal(el('phrase').textContent,REPLIES['asked-back'].hanzi);assert(!el('completed').hidden);assert(clips.at(-1).src.endsWith('me-too-thanks.mp3'));
  clips.at(-1).onerror();assert(el('status').textContent.includes('MP3'));assert(!el('status').closest('[hidden]'),'Final playback errors remain visible');
  el('again').click();
  for(const error of ['not-allowed','network','audio-capture','service-not-allowed','language-not-supported','no-speech']){
   el('mic').click();instances.at(-1).fail(error);assert.equal(pose(),'idle');assert(!el('voice-recovery').hidden);assert.equal(el('mic').getAttribute('aria-pressed'),'false');
  }
  el('type-toggle').click();el('answer').value='你好';el('send').click();await sleep(950);
  el('answer').value='我很好';el('send').click();await sleep(950);assert.equal(el('phrase').textContent,'很好！');assert(clips.at(-1).src.endsWith('good.mp3'));
  el('again').click();el('mic').click();const prior=instances.at(-1);el('type-toggle').click();prior.emit('你好');await sleep(950);assert.equal(el('step').textContent,'1 из 2');
 }finally{
  dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();for(const k of ['window','document','localStorage','Audio'])delete globalThis[k];
 }
});
test('unsupported speech engine keeps keyboard usable',async()=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8'),{url:'https://example.test',pretendToBeVisual:true});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document});
 try{await import('../assets/panda-voice-pilot-ui.mjs?no-speech');assert(document.getElementById('mic').disabled);document.getElementById('type-toggle').click();assert(!document.getElementById('typing').hidden)}
 finally{dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();delete globalThis.window;delete globalThis.document}
});
