import test from 'node:test';
import assert from 'node:assert/strict';
import {
  eligibleLivePandaPair,saveLivePandaPair
} from '../assets/panda-memory-live-connector-v1.mjs';

const makePair=(trigger='我想看喜剧片。',answer='我喜欢喜剧片。',
 pinyin='Wǒ xǐhuan xǐjùpiàn.',ru='Я люблю комедии.')=>[
 {who:'you',hanzi:trigger,pinyin:'Wǒ xiǎng kàn xǐjùpiàn.',ru:'Я хочу посмотреть комедию.',confidence:null},
 {who:'panda',hanzi:answer,pinyin,ru}
];
test('Only actual learner->Panda pairs qualify (never a model example or unclear ASR)',()=>{
 const pair=eligibleLivePandaPair(makePair());
 assert.equal(pair.topic,'movies');
 assert.equal(pair.reviewed.id,'movie-comedy');
 assert.equal(pair.reviewed.voiceId,'voice-093');
 assert.equal(eligibleLivePandaPair([{who:'panda',hanzi:'你好！'},makePair()[0]]),null);
 assert.equal(eligibleLivePandaPair([{who:'example',hanzi:'你好！'},makePair()[1]]),null);
 const unclear=makePair();unclear[0].confidence=.4;
 assert.equal(eligibleLivePandaPair(unclear),null);
 const fallback=makePair();fallback[1].hanzi='我没听懂。你可以再说一遍吗？';
 assert.equal(eligibleLivePandaPair(fallback),null);
 const missing=makePair();missing[1].ru='';
 assert.equal(eligibleLivePandaPair(missing),null);
});
test('Unknown but coherent Mandarin replies stage as pending, NEVER gain MP3 automatically',async()=>{
 const pair=eligibleLivePandaPair(makePair('我想看电影。','你想看什么电影？','Nǐ xiǎng kàn shénme diànyǐng?','Какой фильм ты хочешь посмотреть?'));
 assert.equal(pair.reviewed,null);
 const writes=[],store={
  async recall(){return null},
  async stage(input){writes.push(input);return {status:'pending-review'}}
 };
 const r=await saveLivePandaPair(pair,{store,owner:'device-test-owner00001',baseUrl:'https://trommelschlager-ai.github.io/chinese-coach-pwa/',consent:true,fetcher:()=>{throw Error('No audio request allowed')}});
 assert.deepEqual(r,{status:'pending-review',offlineReady:false});
 assert.equal(writes.length,1);
 assert.equal(writes[0].topic,'conversation');
 assert.equal(writes[0].consent,true);
});
test('Never save a personal chat without explicit opt-in',async()=>{
 const pair=eligibleLivePandaPair(makePair());
 let calls=0;
 const store={recall:async()=>{calls++;return null},stage:async()=>{calls++}};
 await assert.rejects(saveLivePandaPair(pair,{store,owner:'device-test-owner00001',consent:false}),/CONSENT/);
 assert.equal(calls,0);
});
test('Reviewed reply uses only approved Xiaoxiao MP3 exact source, not arbitrary generated voice',async()=>{
 const pair=eligibleLivePandaPair(makePair());
 const stages=[],approvals=[];
 const store={
  async recall(){return null},
  async stage(input){stages.push(input);return {status:'pending-review'}},
  async approve(item){approvals.push(item)}
 };
 const result=await saveLivePandaPair(pair,{store,owner:'device-test-owner00001',
  consent:true,baseUrl:'https://trommelschlager-ai.github.io/chinese-coach-pwa/',
  fetcher:async(url)=>{
   assert.equal(url,'https://trommelschlager-ai.github.io/chinese-coach-pwa/assets/panda-context-voice-20261122/chat03.mp3');
   return {ok:true,type:'basic',blob:async()=>new Blob([Uint8Array.from([73,68,51,4,0,0,0,0,0,0,255,251,144,100])],{type:'audio/mpeg'})};
  }});
 assert.equal(result.status,'offline-ready');
 assert.equal(result.bytes,14);
 assert.equal(stages.length,1);
 assert.equal(approvals.length,1);
 assert.equal(approvals[0].voiceId,'voice-093');
 assert.equal(approvals[0].reviewRef,'reviewed:owner_context_nov22');
 assert.equal(approvals[0].source,'approved-course-audio');
});
test('Even if words match, wrong translation never silently inherits approved MP3',async()=>{
 const pair=eligibleLivePandaPair(makePair('我想看喜剧片。','我喜欢喜剧片。','Wǒ xǐhuan xǐjùpiàn.','Люблю ужасы.'));
 assert.ok(pair.reviewed);
 let media=0;
 const result=await saveLivePandaPair(pair,{
  store:{recall:async()=>null,stage:async()=>({status:'pending-review'})},
  owner:'device-test-owner00001',consent:true,baseUrl:'https://trommelschlager-ai.github.io/chinese-coach-pwa/',
  fetcher:async()=>{media++;return {ok:true}}
 });
 assert.equal(result.status,'pending-review');
 assert.equal(media,0);
});
