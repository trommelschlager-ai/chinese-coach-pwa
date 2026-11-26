import test from 'node:test';
import assert from 'node:assert/strict';
import {createSemanticPilot} from '../assets/panda-unified-pilot-adapter-v1.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {lookupApprovedPandaVoice,PANDA_TRAVEL_VOICE_20261126} from '../assets/panda-approved-voice-registry-v516.mjs';
import {correctPandaGrammarV2} from '../assets/panda-grammar-hsk12-v2.mjs';
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


test('bounded follow-up conversations connect hobbies, frequency, weekend, food and next activity',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice});
 const turn=(p,raw,want)=>{
  const x=p.plan(raw,{mode:'free-chat'});
  assert.equal(x?.line.hanzi,want,raw);
  assert.equal(x.voiceStatus,'registered-exact');
  assert(x.audio.src,raw);
  assert(pilotLearnerMetadata(raw,x.semantic)?.translation,raw);
  assert.equal(x.toneVerified,false);
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
 };
 let chains=0,turns=0;
 for(const h of ['跑步','看书','听音乐','游泳'])
 for(const f of ['经常','不经常','每天','有时候','是的','对'])
 for(const weekend of ['我周末喜欢看书','我周末喜欢游泳','休息']){
  const p=make();turn(p,'聊聊爱好吧','你有什么爱好？');turn(p,h,'你经常做这件事吗？');
  turn(p,f,'你周末喜欢做什么？');turn(p,weekend,'你接下来想做什么？');
  turn(p,'休息','那你休息一下吧。');chains++;turns+=5;
 }
 for(const food of ['面条','米饭','饺子'])
 for(const more of ['不要了','不用了','还要米饭','还要饺子','还要']){
  const p=make();turn(p,'聊聊吃的吧','你想吃什么？');turn(p,food,'还要别的吗？');
  if(more==='还要'){turn(p,more,'你还喜欢吃什么？');turn(p,'我喜欢吃饺子','你接下来想做什么？');turns++;}
  else turn(p,more,'你接下来想做什么？');
  turn(p,'学习中文','你为什么想学中文？');turn(p,'因为我想去中国','你打算什么时候去？');
  turn(p,'明天','你打算怎么去？');turn(p,'坐飞机','祝你旅途愉快！');chains++;turns+=7;
 }
 assert.equal(chains,87);assert.equal(turns,468);
 for(const [q,a] of [['你经常做这件事吗？','每天'],['你周末喜欢做什么？','看书'],['还要别的吗？','不用了'],['你接下来想做什么？','休息']]){
  const p=make();p.observePanda({hanzi:q});assert.equal(p.plan(a,{mode:'free-chat'}),null,a);
 }
 for(const a of ['经常','还要','每天'])assert.equal(make().plan(a,{mode:'free-chat'}),null,a);
 const p=make();turn(p,'聊聊爱好吧','你有什么爱好？');turn(p,'跑步','你经常做这件事吗？');
 turn(p,'什么意思','你经常做这件事吗？');turn(p,'每天','你周末喜欢做什么？');
 turn(p,'聊聊吃的吧','你想吃什么？');assert.equal(p.plan('每天',{mode:'free-chat'}),null);
});


test('session memory resumes hobbies without asking the same answered question and honors corrections',()=>{
 const make=(missing=null)=>createSemanticPilot({enabled:true,lookupExact:q=>q===missing?null:lookupApprovedPandaVoice(q)});
 const turn=(p,raw,want)=>{
  const x=p.plan(raw,{mode:'free-chat'});assert.equal(x?.line.hanzi,want,raw);
  assert.equal(x.voiceStatus,'registered-exact');assert(x.audio.src,raw);
  assert(pilotLearnerMetadata(raw,x.semantic)?.translation,raw);assert.equal(x.toneVerified,false);
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
 };
 for(const hobby of ['跑步','看书','听音乐','游泳']){
  const p=make();turn(p,'聊聊爱好吧','你有什么爱好？');
  turn(p,hobby,'你经常做这件事吗？');turn(p,'聊聊吃的吧','你想吃什么？');
  turn(p,'聊聊爱好吧','你周末喜欢做什么？');turn(p,'看书','你接下来想做什么？');
  turn(p,'聊聊爱好吧','你周末有什么计划？');turn(p,'我打算休息','你接下来想做什么？');
  turn(p,'聊聊爱好吧','你接下来想做什么？');
  assert.equal(p.snapshot().hobbyMemory.hobby,hobby);
  turn(p,'我不喜欢'+hobby+'了','你有什么爱好？');
  assert.equal(p.snapshot().hobbyMemory.hobby,null);
 }
 for(const mode of ['reset','graded','expiry','missing']){
  const p=make(mode==='missing'?'你经常做这件事吗？':null);
  turn(p,'聊聊爱好吧','你有什么爱好？');
  if(mode==='missing')assert.equal(p.plan('跑步',{mode:'free-chat'}),null);
  else turn(p,'跑步','你经常做这件事吗？');
  if(mode==='reset')p.reset();
  if(mode==='graded')p.plan('明天',{mode:'graded'});
  if(mode==='expiry')for(let i=0;i<26;i++)p.observePanda({hanzi:'你好。'});
  turn(p,'聊聊爱好吧','你有什么爱好？');
 }
});


test('separate daily, work and study facts resume across spoken topic changes',()=>{
 const make=(missing=null)=>createSemanticPilot({enabled:true,lookupExact:q=>q===missing?null:lookupApprovedPandaVoice(q)});
 const turn=(p,raw,want)=>{
  const x=p.plan(raw,{mode:'free-chat'});assert.equal(x?.line.hanzi,want,raw);
  assert.equal(x.voiceStatus,'registered-exact');assert(x.audio.src,raw);
  assert(pilotLearnerMetadata(raw,x.semantic)?.translation,raw);assert.equal(x.toneVerified,false);
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
 };
 for(const b of ['吃','不吃','我吃早饭','我不吃早饭'])for(const sleep of ['十点','十一点','十二点']){
  const p=make();turn(p,'聊聊我的一天吧','你早上吃早饭吗？');
  turn(p,b,'你晚上几点睡觉？');turn(p,'聊聊工作吧','你今天忙吗？');
  turn(p,'聊聊我的一天吧','你晚上几点睡觉？');turn(p,sleep,'你接下来想做什么？');
  turn(p,'聊聊我的一天吧','你接下来想做什么？');turn(p,'休息','那你休息一下吧。');
 }
 for(const busy of ['忙','不忙','我今天很忙'])for(const t of ['八点','九点','我不上班']){
  const p=make();turn(p,'聊聊工作吧','你今天忙吗？');turn(p,busy,'你几点去上班？');
  turn(p,'聊聊我的一天吧','你早上吃早饭吗？');turn(p,'聊聊工作吧','你几点去上班？');
  turn(p,t,'你接下来想做什么？');turn(p,'聊聊工作吧','你接下来想做什么？');
 }
 for(const reason of ['因为我喜欢中文','因为我想和朋友说中文']){
  const p=make();turn(p,'聊聊学习中文吧','你为什么想学中文？');
  turn(p,reason,'你接下来想做什么？');turn(p,'聊聊工作吧','你今天忙吗？');
  turn(p,'聊聊学习中文吧','你接下来想做什么？');
 }
 for(const kind of ['reset','expiry','missing']){
  const p=make(kind==='missing'?'你晚上几点睡觉？':null);
  turn(p,'聊聊我的一天吧','你早上吃早饭吗？');
  if(kind==='missing')assert.equal(p.plan('吃',{mode:'free-chat'}),null);
  else turn(p,'吃','你晚上几点睡觉？');
  if(kind==='reset')p.reset();
  if(kind==='expiry')for(let i=0;i<26;i++)p.observePanda({hanzi:'你好。'});
  turn(p,'聊聊我的一天吧','你早上吃早饭吗？');
 }
});


test('family context respects explicit refusal and auto-topic choice avoids answered personal questions',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice});
 const turn=(p,raw,want)=>{
  const x=p.plan(raw,{mode:'free-chat'});assert.equal(x?.line.hanzi,want,raw);
  assert.equal(x.voiceStatus,'registered-exact');assert(x.audio.src,raw);
  assert(pilotLearnerMetadata(raw,x.semantic)?.translation,raw);assert.equal(x.toneVerified,false);
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
 };
 for(const s of ['有','没有','我有一个哥哥','我有一个姐姐','我没有兄弟姐妹'])for(const n of ['两口人','三口人','四口人']){
  const p=make();turn(p,'聊聊家庭吧','你有兄弟姐妹吗？');turn(p,s,'明白了。你家有几口人？');
  turn(p,'聊聊吃的吧','你想吃什么？');turn(p,'聊聊家庭吧','明白了。你家有几口人？');
  turn(p,n,'你接下来想做什么？');turn(p,'聊聊家庭吧','你接下来想做什么？');
 }
 for(const refusal of ['不想说','我不想说']){
  const p=make();turn(p,'聊聊家庭吧','你有兄弟姐妹吗？');turn(p,refusal,'好的。我们聊点别的吧！');
  turn(p,'聊聊家庭吧','好的。我们聊点别的吧！');turn(p,'你来选话题吧','你有什么爱好？');
 }
 for(const pick of ['你来选话题吧','你选吧']){
  const p=make();turn(p,pick,'你有什么爱好？');turn(p,'跑步','你经常做这件事吗？');
  turn(p,pick,'你早上吃早饭吗？');turn(p,'不吃','你晚上几点睡觉？');turn(p,'十点','你接下来想做什么？');
  turn(p,pick,'你为什么想学中文？');turn(p,'因为我喜欢中文','你接下来想做什么？');
  turn(p,pick,'你今天忙吗？');turn(p,'不忙','你几点去上班？');turn(p,'八点','你接下来想做什么？');
  turn(p,pick,'你接下来想做什么？');
 }
 for(const raw of ['有','没有','三口人'])assert.equal(make().plan(raw,{mode:'free-chat'}),null,raw);
});


test('reviewed grammar correction keeps the conversation going without pretending to assess tones',()=>{
 const make=(missing=null)=>createSemanticPilot({enabled:true,lookupExact:q=>q===missing?null:lookupApprovedPandaVoice(q),correctGrammar:correctPandaGrammarV2,metadata:pilotLearnerMetadata});
 const send=(p,raw,want,confidence=null,corrected=null)=>{
  const x=p.plan(raw,{mode:'free-chat',confidence});
  assert.equal(x?.line.hanzi,want,raw);assert.equal(x.voiceStatus,'registered-exact',raw);
  assert(x.spoken,raw);assert.equal(x.toneVerified,false);
  assert.equal(x.inlineCorrection,!!corrected,raw);
  if(corrected){assert.equal(x.spoken.correction.hanzi,corrected);assert.equal(x.spoken.correction.inlineConversation,true);assert.equal(x.spoken.known,false);assert.equal(x.spoken.hanzi,raw);}
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});
 };
 for(const confidence of [null,.85,.93]){
  const p=make();send(p,'我想中文学','你为什么想学中文？',confidence,'我想学中文。');
  send(p,'因为我想去中国','你打算什么时候去？');send(p,'明天','你打算怎么去？');send(p,'坐飞机','祝你旅途愉快！');
 }
 for(const confidence of [null,.93]){
  const p=make();send(p,'聊聊我的一天吧','你早上吃早饭吗？');
  send(p,'我吃早饭早上','你晚上几点睡觉？',confidence,'我早上吃早饭。');
  send(p,'我睡觉晚上十点','你接下来想做什么？',confidence,'我晚上十点睡觉。');send(p,'休息','那你休息一下吧。');
 }
 for(const n of ['八','九','十']){
  const p=make();send(p,'聊聊工作吧','你今天忙吗？');send(p,'忙','你几点去上班？');
  send(p,'我去上班'+n+'点','你接下来想做什么？',null,'我'+n+'点去上班。');
 }
 for(const confidence of [.4,.72,.84])assert.equal(make().plan('我想中文学',{mode:'free-chat',confidence}),null);
 for(const raw of ['我想火星','我比你很高'])assert.equal(make().plan(raw,{mode:'free-chat'}),null,raw);
 assert.equal(make('你为什么想学中文？').plan('我想中文学',{mode:'free-chat'}),null);
 assert.equal(make().plan('我想中文学',{mode:'graded'}),null);
});


test('phone-reported travel paraphrase restores the pending question and accepts full answers',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice,metadata:pilotLearnerMetadata});
 const turn=(p,raw,want)=>{
  const x=p.plan(raw,{mode:'free-chat'});assert.equal(x?.line.hanzi,want,raw);
  assert.equal(x.voiceStatus,'registered-exact');assert(x.spoken.translation);assert.equal(x.toneVerified,false);
  p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});return x;
 };
 for(const q of ['什么时候去中国','什么时候去'])for(const answer of ['明天','我明天去中国','我下个月去中国','下个月我想去中国','我下个月想去中国']){
  const p=make();turn(p,'我想学中文','你为什么想学中文？');turn(p,'因为我想去中国','你打算什么时候去？');
  turn(p,'什么意思','你打算什么时候去？');
  assert.equal(turn(p,q,'你打算什么时候去？').kind,'explain-exact');
  turn(p,answer,'你打算怎么去？');turn(p,'我打算坐飞机','祝你旅途愉快！');
 }
 for(const q of ['什么时候去中国','你什么时候去中国','你打算什么时候去中国'])turn(make(),q,'我是虚拟熊猫，没有实际的旅行经历。');
 const p=make();turn(p,'我想学中文','你为什么想学中文？');turn(p,'因为我想去中国','你打算什么时候去？');turn(p,'我还没想好','好的。我们聊点别的吧！');
});


test('full transport plans work in a fresh conversation, while unrelated fragments remain unbound',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice,metadata:pilotLearnerMetadata});
 for(const verb of ['打算','想','准备','要'])for(const mode of ['飞机','火车','高铁'])for(const dest of ['','去中国']){
  const p=make();p.observePanda({hanzi:'你好吗？',pinyin:'Nǐ hǎo ma?',ru:'Как дела?'});
  const raw='我'+verb+'坐'+mode+dest,x=p.plan(raw,{mode:'free-chat'});
  assert.equal(x?.line.hanzi,'祝你旅途愉快！',raw);
  assert.equal(x.voiceStatus,'registered-exact');
  assert.equal(x.audio.src,'./assets/panda-ai-voice-v557/PA-V556-058.mp3');
  assert(x.spoken.pinyin&&x.spoken.translation,raw);assert.equal(x.toneVerified,false);
 }
 for(const raw of ['坐飞机','坐火车','坐高铁','我不打算坐飞机','你打算坐飞机吗']){
  const x=make().plan(raw,{mode:'free-chat'});assert.notEqual(x?.line.hanzi,'祝你旅途愉快！',raw);
 }
 assert.equal(make().plan('我打算坐飞机',{mode:'graded'}),null);
});
test('reviewed fallback uses exact recorded clarification, not the unrecorded paraphrase',()=>{
 assert.equal(lookupApprovedPandaVoice('你可以用简单一点的中文说吗？')?.src,'./assets/panda-clarification-voice-20261122/clarify07.mp3');
 assert.equal(lookupApprovedPandaVoice('你还想聊什么？')?.src,'./assets/panda-clarification-voice-20261122/clarify10.mp3');
});


test('all five uploaded learner travel recordings resolve exactly and match verified audio hashes',()=>{
 const clips=PANDA_TRAVEL_VOICE_20261126;assert.equal(clips.length,5);
 const pack=JSON.parse(readFileSync(new URL('../assets/offline-pack.json',import.meta.url),'utf8'));
 for(const c of clips){
  const actual=lookupApprovedPandaVoice(c.zh);assert.equal(actual?.src,c.src,c.zh);
  assert.equal(lookupApprovedPandaVoice(c.zh.replace(/[。？！]/g,''))?.src,c.src);
  const data=readFileSync(new URL('../'+c.src.slice(2),import.meta.url));assert.equal(data.length,c.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),c.sha256);
  assert(pack.files.includes(c.src),c.src);
 }
 assert.equal(lookupApprovedPandaVoice('我打算坐飞机去北京'),null);
});


test('composed contextual answers cover clock, frequency, work and travel without guessing unrelated facts',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice,metadata:pilotLearnerMetadata});
 const turn=(p,q,w)=>{const x=p.plan(q,{mode:'free-chat'});assert.equal(x?.line.hanzi,w,q);assert.equal(x.voiceStatus,'registered-exact');assert(x.spoken?.translation&&x.spoken?.pinyin,q);assert.equal(x.toneVerified,false);p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});};
 const groups=[
 {start:['聊聊我的一天吧','你早上吃早饭吗？'],answers:['我每天吃早饭','我早上一般不吃早饭','我有时候吃早饭','我从来不吃早饭','我早上通常吃早饭'],next:'你晚上几点睡觉？'},
 {start:['聊聊工作吧','你今天忙吗？'],answers:['我今天不忙','我今天非常忙','今天有点忙','我今天不太忙','我一点也不忙'],next:'你几点去上班？'},
 {start:['聊聊爱好吧','你有什么爱好？'],pre:['我喜欢跑步','你经常做这件事吗？'],answers:['我每天跑步','我偶尔跑步','我很少跑步','我经常跑步','有时候跑步'],next:'你周末喜欢做什么？'},
 {start:['我想学中文','你为什么想学中文？'],pre:['因为我想去中国','你打算什么时候去？'],answers:['后天','我后天打算去中国','我明年准备去中国','下周我想去中国','我下个月要去中国'],next:'你打算怎么去？'}
 ];
 let count=0;for(const g of groups)for(const answer of g.answers){const p=make();turn(p,...g.start);if(g.pre)turn(p,...g.pre);turn(p,answer,g.next);count++;}
 for(const hour of ['一','两','三','四','五','六','七','八','九','十','十一','十二'])for(const suffix of ['','半','一刻','十五分','三十分','四十五分']){
  const p=make();turn(p,'聊聊工作吧','你今天忙吗？');turn(p,'忙','你几点去上班？');turn(p,'我早上'+hour+'点'+suffix+'去上班','你接下来想做什么？');count++;
  const q=make();turn(q,'聊聊我的一天吧','你早上吃早饭吗？');turn(q,'吃','你晚上几点睡觉？');turn(q,'我晚上'+hour+'点'+suffix+'睡觉','你接下来想做什么？');count++;
 }
 assert.equal(count,164);
 for(const a of ['他早上七点去上班','我不想七点去上班','我早上七点去上班吗？','我早上十三点去上班','我早上七点去上班。你呢？']){
  const p=make();turn(p,'聊聊工作吧','你今天忙吗？');turn(p,'忙','你几点去上班？');assert.notEqual(p.plan(a,{mode:'free-chat'})?.semantic?.slot,'work-time',a);
 }
 for(const a of ['后天','七点半','偶尔'])assert.equal(make().plan(a,{mode:'free-chat'}),null,a);
});


test('learning difficulty uses a recorded question and supportive response, without tone claims',()=>{
 const make=()=>createSemanticPilot({enabled:true,lookupExact:lookupApprovedPandaVoice,metadata:pilotLearnerMetadata});
 const turn=(p,q,w)=>{const x=p.plan(q,{mode:'free-chat'});assert.equal(x?.line.hanzi,w,q);assert.equal(x.voiceStatus,'registered-exact');assert(x.spoken?.translation&&x.spoken?.pinyin,q);assert.equal(x.toneVerified,false);p.observePanda(x.line,{continuesLearnerTurn:x.continuesLearnerTurn});};
 for(const topic of ['中文','汉语','声调','发音','语法','汉字','听力','口语'])for(const degree of ['','很','非常','有点','太']){
  const p=make();turn(p,'我觉得'+topic+degree+'难','你想练习什么？');turn(p,'我想练习声调','没关系，我们慢慢来。');
 }
 for(const item of ['声调','发音','语法','汉字','听力','口语'])for(const raw of [item,'我想学'+item,'我想练习'+item,'我想学习'+item]){
  const p=make();turn(p,'中文很难','你想练习什么？');turn(p,raw,'没关系，我们慢慢来。');
 }
 for(const [raw,w] of [['我不想练习','好的。我们聊点别的吧！'],['不知道','你想学什么？'],['还没想好','你想学什么？']]){
  const p=make();turn(p,'语法很难','你想练习什么？');turn(p,raw,w);
 }
 for(const q of ['中文不难','你觉得中文很难吗？','中文很难吗？','他觉得中文很难','声调'])assert.notEqual(make().plan(q,{mode:'free-chat'})?.semantic?.intent,'express-study-difficulty',q);
});
