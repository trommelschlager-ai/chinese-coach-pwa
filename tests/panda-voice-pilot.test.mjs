import {liveDOM} from './panda-live-dom-fixture.mjs';
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
test('microphone consent, audio lifecycle, retries, cancellation and branches',async()=>{
 const f=await liveDOM(),{el,sessions,clips,send}=f,pose=()=>el('character').dataset.state;
 try{
  el('hear').click();assert.equal(pose(),'idle');clips.at(-1).playing();assert.equal(pose(),'talking');clips.at(-1).onwaiting();assert.equal(pose(),'idle');clips.at(-1).playing();clips.at(-1).onended();assert.equal(pose(),'idle');
  el('mic').click();assert(el('speech-dialog').open);assert.equal(sessions.length,0);el('speech-allow').click();assert.equal(sessions.at(-1).lang,'zh-CN');assert.equal(pose(),'listening');
  const stale=sessions.at(-1).onresult;sessions.at(-1).emit('我很好');assert.equal(pose(),'retry');el('reset').click();assert.equal(el('phrase').textContent,'中午好！');stale({results:[[{transcript:'你好'}]]});assert.equal(el('step').textContent,'1 из 2');
  el('mic').click();sessions.at(-1).emit('你好');assert.equal(el('phrase').textContent,'你好吗？');el('mic').click();sessions.at(-1).emit('我很好，你呢？');assert.equal(el('phrase').textContent,REPLIES['asked-back'].hanzi);assert(clips.at(-1).src.endsWith('me-too-thanks.mp3'));
  clips.at(-1).onerror();assert(el('status').textContent.includes('Запись'));el('reset').click();
  for(const error of ['not-allowed','network','audio-capture','service-not-allowed','language-not-supported','no-speech']){el('mic').click();sessions.at(-1).fail(error);assert.equal(pose(),'idle');assert.equal(el('mic').getAttribute('aria-pressed'),'false');assert(el('status').textContent)}
  send('你好');send('我很好');assert.equal(el('phrase').textContent,'很好！');assert(clips.at(-1).src.endsWith('good.mp3'));
  el('reset').click();el('mic').click();const prior=sessions.at(-1);el('reset').click();prior.emit('你好');assert.equal(el('step').textContent,'1 из 2');
 }finally{f.close()}
});
test('unsupported speech engine leaves the text field immediately usable',async()=>{
 const f=await liveDOM(1,{speech:false});try{f.el('mic').click();assert(f.el('status').textContent.includes('недоступно'));assert(!f.el('message').disabled);f.send('你好');assert.equal(f.el('phrase').textContent,'你好吗？')}finally{f.close()}
});
