import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

test('Screenshot 39218: distinguish Chinese workplace homophones and do not score unmeasured tones',()=>{
 const a=respondToNaturalStatement('你在那工作');
 assert(a,'Do not tell an HSK learner to say a clear recognized sentence more simply');
 assert.equal(a.spoken.hanzi,'你在那工作');
 assert.equal(a.spoken.pinyin,'Nǐ zài nà gōngzuò.');
 assert.equal(a.spoken.toneVerified,false);
 assert.equal(a.reply.hanzi,'我在这里陪你练习中文。');
 assert.match(a.message,/那/);
 assert.match(a.message,/哪/);
 assert.match(a.message,/如果说|如果想|如果 хотел|Если хотел/);
 const src=lookupApprovedPandaVoice(a.reply.hanzi)?.src;
 assert(src?.endsWith('.mp3'),'Use a real approved Panda voice, not system TTS');
 assert(src.includes('panda-ai-voice-v557'),'Use existing Panda AI v557 MP3');
 const q=respondToNaturalStatement('你在哪工作');
 assert.equal(q.reply.hanzi,a.reply.hanzi);
 assert.equal(q.spoken.pinyin,'Nǐ zài nǎ gōngzuò?');
 assert.equal(respondToNaturalStatement('你在哪儿工作').reply.hanzi,a.reply.hanzi);
});

test('Real Panda AI Android ASR final transcript produces the approved voice, never the generic fallback',async()=>{
 const f=await liveDOM(1,{active:true});
 try{
  f.el('mic').click(); f.el('speech-allow').click();
  assert.equal(f.sessions.length,1);
  const before=f.w.PandaApprovedBridge337.snapshot().history.length;
  f.sessions[0].emit('你在那工作',.92);
  const h=f.w.PandaApprovedBridge337.snapshot().history;
  assert(h.length>=before+2,'Recognized Chinese + Panda reply should appear in real chat');
  assert.equal(h.at(-2).hanzi,'你在那工作');
  assert.equal(h.at(-1).hanzi,'我在这里陪你练习中文。');
  assert(f.clips.some(x=>x.src.endsWith('/PA-V556-007.mp3')),'Use existing exact recorded Panda voice');
  assert.equal(f.el('mic').getAttribute('aria-pressed'),'false','Mic must finish when recognition succeeds');
  assert.equal(f.el('speech-recovery').hidden,true,'Do not claim STT failure after success');
  assert(!/речь не распознана/i.test(f.el('status').textContent),'No false no-speech status after recognized result');
  assert.equal(f.w.PandaApprovedBridge337.snapshot().speechSignal.toneVerified,false);
 }finally{f.close()}
});

test('Android delayed watchdog, no-match and no-speech cannot overwrite a successful final transcript',async()=>{
 const actualSetTimeout=globalThis.setTimeout;
 let delayedWatchdog;
 const f=await liveDOM(1,{active:true});
 try{
  globalThis.setTimeout=(cb,ms,...args)=>{
   if(ms===16000){delayedWatchdog=cb;return actualSetTimeout(()=>{},700000)}
   return actualSetTimeout(cb,ms,...args);
  };
  f.el('mic').click();f.el('speech-allow').click();
  assert(delayedWatchdog,'Simulated Android 16s microphone deadline installed');
  const session=f.sessions[0];
  session.emit('你在那工作',.94);
  const prior=f.w.PandaApprovedBridge337.snapshot().history.length;
  delayedWatchdog();
  session.fail('no-speech');
  session.onnomatch?.();
  assert.equal(f.w.PandaApprovedBridge337.snapshot().history.length,prior);
  assert.equal(f.el('speech-recovery').hidden,true);
  assert(!/речь не распознана|не расслышала/i.test(f.el('status').textContent));
 }finally{globalThis.setTimeout=actualSetTimeout;f.close()}
});

test('ASR code clears 16s watchdog and ends the recognition session when transcript is final',()=>{
 const core=readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 const section=core.slice(core.indexOf('r.onresult=e=>'),core.indexOf('r.onerror=e=>'));
 assert(section.includes('heard=true;'));
 assert(section.includes('clearTimeout(watchdog);'));
 assert(section.includes('stopRecognition();'));
 assert.match(core,/watchdog=setTimeout\(\(\)=>\{if\(valid\(\)&&!heard&&!failed\)/);
});
