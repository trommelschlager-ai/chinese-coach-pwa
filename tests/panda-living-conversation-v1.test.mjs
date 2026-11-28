import test from 'node:test';
import assert from 'node:assert/strict';
import {createSemanticPilot} from '../assets/panda-unified-pilot-adapter-v1.mjs';
const make=(opts={})=>createSemanticPilot({enabled:true,livingConversation:true,...opts});
const observe=(p,hanzi)=>p.observePanda({hanzi});
const answer=(p,raw='非常好',opts={})=>p.plan(raw,{mode:'free-chat',...opts});
test('same evaluation gets different contextually appropriate responses',()=>{
 for(const [q,pattern] of [['你今天怎么样？',/开心|今天/],['你昨晚睡得怎么样？',/睡|起床/],['你觉得今天的课怎么样？',/学/],['你工作怎么样？',/工作|今天/],['这道菜怎么样？',/吃/]]){
  const p=make();observe(p,q);const x=answer(p);assert.equal(x.kind,'living-reaction');assert.match(x.line.hanzi,pattern);assert.equal(x.spoken.pinyin,'Fēicháng hǎo.');assert.equal(x.toneVerified,false);
 }
});
test('repeated evaluations rotate actually displayed replies',()=>{
 const p=make();const seen=new Set();
 for(let i=0;i<3;i++){observe(p,'哈喽！最近怎么样？');const x=answer(p);assert(!seen.has(x.line.hanzi));seen.add(x.line.hanzi);p.observePanda(x.line);}
 assert.equal(seen.size,3);
});
test('negative and neutral evaluations are not praised',()=>{
 for(const q of ['你今天怎么样？','你昨晚睡得怎么样？','你觉得今天的课怎么样？']){
  const p=make();observe(p,q);const x=answer(p,'不太好');assert.equal(x.kind,'living-reaction');assert.doesNotMatch(x.line.hanzi,/太好了|真不错/);
 }
});
test('exact audio only, missing audio stays text-only',()=>{
 const p=make({lookupExact:q=>q==='太好了！为什么这么开心？'?{src:'approved.mp3'}:null});
 observe(p,'你好吗？');const x=answer(p);assert.equal(x.voiceStatus,'registered-exact');assert.equal(x.audio.src,'approved.mp3');
 p.observePanda(x.line);observe(p,'你好吗？');const y=answer(p);assert.equal(y.voiceStatus,'text-only');assert.equal(y.audio,null);
});
test('explicit tiredness and happiness work without a prior question',()=>{
 for(const [raw,pattern] of [['我今天很累',/休息|忙/],['我今天很开心',/开心|今天/],['我不开心',/怎么了|慢慢来/]]){
  const x=answer(make(),raw);assert.equal(x.kind,'living-reaction');assert.match(x.line.hanzi,pattern);assert.equal(x.toneVerified,false);
 }
});
test('ambiguous stale, unrelated, low-confidence, disabled and graded turns never use living route',()=>{
 for(const q of [null,'你几岁？','你有哥哥吗？','你喜欢跑步吗？']){
  const p=make();if(q)observe(p,q);assert.notEqual(answer(p)?.kind,'living-reaction');
 }
 const p=make();observe(p,'你好吗？');assert.notEqual(answer(p,'非常好',{confidence:.6})?.kind,'living-reaction');
 observe(p,'你好吗？');assert.equal(answer(p,'非常好',{mode:'graded'}),null);
 observe(p,'你好吗？');p.reset();assert.notEqual(answer(p)?.kind,'living-reaction');
 const disabled=make({livingConversation:false});observe(disabled,'你好吗？');assert.notEqual(answer(disabled)?.kind,'living-reaction');
});

test('priority probe does not consume unrelated turns and handles explicit self reports',()=>{
 const p=make();observe(p,'你好吗？');const before=p.snapshot();assert.equal(p.planLiving('我想学中文',{mode:'free-chat'}),null);assert.deepEqual(p.snapshot(),before);
 const x=p.planLiving('非常好',{mode:'free-chat'});assert.equal(x.kind,'living-reaction');assert.equal(p.snapshot().lastSpeaker,'learner');
 const y=make().planLiving('我非常好',{mode:'free-chat'});assert.equal(y.kind,'living-reaction');
});

test('morning chain maintains six linked learner turns, exact facts and no tone claims',()=>{
 const p=make();observe(p,'你昨晚睡得怎么样？');
 const exchanges=[['非常好',/睡了几个小时/],['我睡了八个小时',/几点起床/],['七点',/吃早饭/],['吃了',/吃了什么/],['鸡蛋',/喝咖啡/],['没喝',/接下来/],['我想休息',/休息一下/]];
 for(const [raw,want] of exchanges){const x=answer(p,raw);assert.equal(x?.kind,'living-reaction',raw);assert.match(x.line.hanzi,want);assert.equal(x.toneVerified,false);p.observePanda(x.line);}
 assert.deepEqual(p.morningSnapshot(),{hours:8,wake:7,breakfast:true,food:'鸡蛋',drink:false,next:'休息'});
});
test('negative breakfast skips food question and respects learner refusal',()=>{
 const p=make();observe(p,'你昨晚睡得怎么样？');for(const raw of ['非常好','八个小时','七点']){const x=answer(p,raw);p.observePanda(x.line);}
 const x=answer(p,'没吃');assert.match(x.line.hanzi,/喝咖啡/);p.observePanda(x.line);assert.equal(p.morningSnapshot().breakfast,false);assert.equal(p.morningSnapshot().food,undefined);
 const refusal=answer(p,'我不想说');assert.match(refusal.line.hanzi,/别的/);assert.equal(p.morningSnapshot(),null);
});
test('reset, unrelated line or unrelated answer cannot preserve stale morning chain',()=>{
 for(const action of ['reset','line','answer','low-confidence','graded']){
  const p=make();observe(p,'你昨晚睡得怎么样？');const x=answer(p);p.observePanda(x.line);
  if(action==='reset')p.reset();
  else if(action==='line')observe(p,'你几岁？');
  else if(action==='answer')answer(p,'火星');
  else if(action==='low-confidence')answer(p,'八个小时',{confidence:.6});
  else answer(p,'八个小时',{mode:'graded'});
  assert.equal(p.morningSnapshot(),null,action);assert.notEqual(answer(p,'八个小时')?.kind,'living-reaction',action);
 }
});
