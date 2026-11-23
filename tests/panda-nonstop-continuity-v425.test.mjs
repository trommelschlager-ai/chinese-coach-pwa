import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {coherentPandaFollowup} from '../assets/panda-nonstop-continuity-v425.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const catalog=availableAskGroups([1,4,6],[],new Date(2026,10,17));
const options=(input,questions=[])=>({
 input,result:{kind:'question',reply:{hanzi:'我有一个妹妹。'}},
 followup:{hanzi:'今天星期几？',lesson:4},allowed:[1,4,6],questions,
 catalog,lookupAudio:lookupPandaVoiceClip
});

test('family question gets different, voiced, verified family follow-up',()=>{
 const next=coherentPandaFollowup(options('你有妹妹吗？'));
 assert.equal(next?.lesson,6);
 assert.equal(next?.hanzi,'你有哥哥吗？');
 assert.equal(next?.audioKey,next.hanzi);
 assert(lookupPandaVoiceClip(next.hanzi)?.src.endsWith('.mp3'));
 assert.notEqual(next.hanzi,'你有妹妹吗？');
});
test('availability answer stays on available-time topic and uses p164, not weekday quiz',()=>{
 const next=coherentPandaFollowup(options('你星期几有空？'));
 assert.equal(next?.hanzi,'你今天有空吗？');
 assert.equal(next.lesson,4);
 assert.equal(lookupPandaVoiceClip(next.hanzi)?.src,'./assets/panda-voice-clips-v411/p164.mp3');
 assert.notEqual(next.hanzi,'今天星期几？');
});
test('no repeat, locked question, silent recording or unseen invented topic',()=>{
 assert.equal(coherentPandaFollowup(options('你有妹妹吗？',['你有哥哥吗？'])),null);
 assert.equal(coherentPandaFollowup({...options('你星期几有空？'),allowed:[1,6]}),null);
 assert.equal(coherentPandaFollowup({...options('你有妹妹吗？'),lookupAudio:()=>null}),null);
 assert.equal(coherentPandaFollowup({...options('你星期几有空？'),catalog:[]}),null);
 assert.equal(coherentPandaFollowup({...options('谢谢'),followup:{hanzi:'谢谢！'}}),null);
 assert.equal(coherentPandaFollowup({...options('你好'),followup:{hanzi:'你好吗？'}}).hanzi,'你好吗？');
});
test('current Panda engine, history, and HTML load v425 with unchanged approved character',()=>{
 const screen=fs.readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 assert(screen.includes('followup=coherentPandaFollowup({input,result,followup,'));
 assert(/panda-hsk2-preview-core-v1\.mjs\?v=\d+/.test(html));
 assert(/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/.test(html));
 const offline=JSON.parse(fs.readFileSync(new URL('../assets/offline-pack.json',import.meta.url),'utf8'));
 assert(offline.files.includes('./assets/panda-nonstop-continuity-v425.mjs?v=425'));
 assert(offline.files.includes('./'+html.match(/assets\/panda-hsk2-preview-core-v1\.mjs\?v=\d+/)?.[0]));
});
for(const [input,expected,topic] of [
 ['你有妹妹吗？','你有哥哥吗？',6],
 ['你星期几有空？','你今天有空吗？',4]
]){
 test('Android-like Non-Stop asks the exact right follow-up after '+input,async()=>{
  const f=await liveDOM(1,{completed:['family','weekdays']});
  try{
   f.el('mode-nonstop').click();
   assert(f.w.PandaApprovedBridge337.snapshot().allowed.includes(topic));
   f.send(input);
   const reply=f.w.PandaApprovedBridge337.snapshot().current;
   assert(reply.hanzi==='我有一个妹妹。'||reply.hanzi==='我星期六有空。',reply.hanzi);
   const latest=f.clips.at(-1);
   if(typeof latest?.onended==='function')latest.onended();
   await new Promise(resolve=>setTimeout(resolve,4950));
   const actual=f.el('phrase').textContent;
   assert.equal(actual,expected,'Follow-up should not echo user or switch topic');
   const current=f.w.PandaApprovedBridge337.snapshot();
   assert.equal(current.audioAvailable,true);
   assert.equal(current.topic,topic);
  }finally{f.close()}
 });
}
