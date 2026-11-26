import test from 'node:test';
import assert from 'node:assert/strict';
import {createSemanticPilot} from '../assets/panda-unified-pilot-adapter-v1.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
import {pilotLearnerMetadata} from '../assets/panda-unified-pilot-metadata-v1.mjs';
const api={createSemanticPilot},registry={lookupApprovedPandaVoice};
test("disabled does not override",()=>assert.equal((()=>api.createSemanticPilot({lookupExact:registry.lookupApprovedPandaVoice}).plan("我想休息",{mode:"free-chat"})===null)(),true));
test("graded remains untouched",()=>assert.equal((()=>api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice}).plan("我想休息",{mode:"graded"})===null)(),true));
test("real exact audio",()=>assert.equal((()=>{const x=api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice}).plan("我想休息",{mode:"free-chat"});return x?.line.hanzi==="那你休息一下吧。"&&x.audio.src==="./assets/panda-ai-voice-v557/PA-V556-059.mp3"})(),true));
test("missing audio falls back",()=>assert.equal((()=>api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice}).plan("我不想休息",{mode:"free-chat"})===null)(),true));
test("unknown falls back",()=>assert.equal((()=>api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice}).plan("我想",{mode:"free-chat"})===null)(),true));
test("no audio resolver falls back",()=>assert.equal((()=>api.createSemanticPilot({enabled:true}).plan("我想休息",{mode:"free-chat"})===null)(),true));
test("observed question drives agreement",()=>assert.equal((()=>{const x=api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice});x.observePanda({hanzi:"你今天休息吗？",pinyin:"Nǐ jīntiān xiūxi ma?",ru:"Ты сегодня отдыхаешь?"});return x.plan("对对",{mode:"free-chat"})?.line.hanzi==="那你休息一下吧。"})(),true));
test("reset clears agreement",()=>assert.equal((()=>{const x=api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice});x.observePanda({hanzi:"你今天休息吗？",pinyin:"Nǐ jīntiān xiūxi ma?",ru:"Ты сегодня отдыхаешь?"});x.reset();return x.plan("对对",{mode:"free-chat"})===null})(),true));
test("repeat actual spoken line",()=>assert.equal((()=>{const x=api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice});x.observePanda({hanzi:"我在和你聊天。",pinyin:"Wǒ zài hé nǐ liáotiān.",ru:"Я разговариваю с тобой."});return x.plan("什么",{mode:"free-chat"})?.kind==="repeat-exact"})(),true));
test("planned line not recorded until displayed",()=>assert.equal((()=>{const x=api.createSemanticPilot({enabled:true,lookupExact:registry.lookupApprovedPandaVoice});x.plan("我想休息",{mode:"free-chat"});return x.snapshot().lastSpeaker==="learner"&&x.snapshot().lastPandaTurn===null})(),true));


test('reviewed study motivation branches into an explicitly linked trip conversation',()=>{
 const expected=['你为什么想学中文？','你打算什么时候去？','你打算怎么去？','祝你旅途愉快！'];
 let chains=0;
 for(const reason of ['因为我想去中国','我想去中国','想去中国'])
 for(const time of ['明天','下周','下个月','明年'])
 for(const method of ['坐飞机','坐火车','坐高铁']){
  const p=createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice});
  for(const [i,raw] of ['我想学中文',reason,time,method].entries()){
   const x=p.plan(raw,{mode:'free-chat'});
   assert.equal(x?.line.hanzi,expected[i],raw);
   assert.equal(x.voiceStatus,'registered-exact');
   assert(x.audio.src);
   assert.equal(x.toneVerified,false);
   assert(pilotLearnerMetadata(raw,x.semantic)?.translation,raw);
   p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
  }
  chains++;
 }
 assert.equal(chains,36);
});
test('open answers cannot be attached to unrelated questions or stale context',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice});
 for(const raw of ['明天','坐飞机','因为我想去中国','想去中国'])assert.equal(make().plan(raw,{mode:'free-chat'}),null,raw);
 for(const [q,a] of [['你打算什么时候去？','明天'],['你打算怎么去？','坐飞机'],['你为什么想学中文？','因为我不想去中国']]){
  const p=make();p.observePanda({hanzi:q});assert.equal(p.plan(a,{mode:'free-chat'}),null,a);
 }
 for(const end of ['reset','unrelated','unknown','graded']){
  const p=make();
  for(const raw of ['我想学中文','因为我想去中国']){
   const r=p.plan(raw,{mode:'free-chat'});assert(r);
   p.observePanda(r.line,{continuesLearnerTurn:r.continuesLearnerTurn});
  }
  if(end==='reset')p.reset();
  else if(end==='unrelated')p.observePanda({hanzi:'你好！'});
  else if(end==='unknown')p.plan('火星',{mode:'free-chat'});
  else p.plan('明天',{mode:'graded'});
  assert.equal(p.plan('明天',{mode:'free-chat'}),null,end);
 }
});


test('clarification replays exact question without losing its pending answer; topic switch clears travel context',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice});
 const turn=(p,raw,want)=>{
  const x=p.plan(raw,{mode:'free-chat'});
  assert.equal(x?.line.hanzi,want,raw);
  assert.equal(x.voiceStatus,'registered-exact');
  assert.equal(x.toneVerified,false);
  assert(pilotLearnerMetadata(raw,x.semantic)?.translation,raw);
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
  return x;
 };
 const travel=p=>{turn(p,'我想学中文','你为什么想学中文？');turn(p,'因为我想去中国','你打算什么时候去？');};
 for(const ask of ['什么','什么意思','请再说一遍','我没听懂'])for(const stage of [0,1,2]){
  const p=make();turn(p,'我想学中文','你为什么想学中文？');
  if(stage===0)turn(p,ask,'你为什么想学中文？');
  turn(p,'因为我想去中国','你打算什么时候去？');
  if(stage===1)turn(p,ask,'你打算什么时候去？');
  turn(p,'明天','你打算怎么去？');
  if(stage===2)turn(p,ask,'你打算怎么去？');
  turn(p,'坐飞机','祝你旅途愉快！');
 }
 for(const [request,answers,question,follow] of [
  ['聊聊爱好吧',['跑步','我喜欢看书','听音乐','游泳'],'你有什么爱好？','你经常做这件事吗？'],
  ['我们聊聊吃的吧',['面条','我想吃米饭','饺子'],'你想吃什么？','还要别的吗？']
 ])for(const answer of answers){
  const p=make();travel(p);turn(p,request,question);turn(p,answer,follow);
  assert.equal(p.plan('明天',{mode:'free-chat'}),null);
 }
 for(const change of ['换个话题吧','我们聊点别的吧']){
  const p=make();travel(p);turn(p,change,'好的。我们聊点别的吧！');
  assert.equal(p.plan('明天',{mode:'free-chat'}),null);
 }
 for(const alt of ['reset','unrelated','unknown']){
  const p=make();travel(p);const x=p.plan('什么意思',{mode:'free-chat'});assert(x);
  if(alt==='reset')p.reset();
  if(alt==='unrelated')p.observePanda({hanzi:'你好。'});
  if(alt==='unknown')p.plan('火星',{mode:'free-chat'});
  p.observePanda(x.line);
  assert.equal(p.plan('明天',{mode:'free-chat'}),null,alt);
 }
});
