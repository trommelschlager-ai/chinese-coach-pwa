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

function morningSend(p,raw){
 const x=answer(p,raw);assert(x,raw);p.observePanda(x.line);return x;
}
test('explicit morning opener and fact-only story with negative coffee',()=>{
 const p=make();for(const raw of ['聊聊我的早上吧','八个小时','七点','吃了','鸡蛋','没喝','我想休息'])morningSend(p,raw);
 const x=morningSend(p,'说说我的一天');assert.equal(x.kind,'living-summary');
 assert.equal(x.line.hanzi,'你睡了八个小时。你七点起床。你早饭吃了鸡蛋。你今天没喝咖啡。接下来你想休息。');
 assert.match(x.line.pinyin,/méi hē kāfēi/);assert.match(x.line.ru,/не пил/);assert.equal(x.voiceStatus,'text-only');assert.equal(x.toneVerified,false);
});
test('partial story omits unanswered slots, negative breakfast and refusal are respected',()=>{
 const p=make();for(const raw of ['聊聊我的早上吧','八个小时','七点','没吃'])morningSend(p,raw);
 const x=morningSend(p,'请说说我的一天');assert.match(x.line.hanzi,/没吃早饭/);assert.doesNotMatch(x.line.hanzi,/鸡蛋|咖啡|休息/);
 const q=make();morningSend(q,'聊聊我的早上吧');morningSend(q,'八个小时');morningSend(q,'我不想说');assert.match(morningSend(q,'说说我的一天').line.hanzi,/还不知道/);
});
test('summary cannot leak across reset or unrelated turn; empty summary invents nothing',()=>{
 for(const mode of ['reset','unrelated','empty']){
  const p=make();if(mode!=='empty'){morningSend(p,'聊聊我的早上吧');morningSend(p,'八个小时');if(mode==='reset')p.reset();else observe(p,'你几岁？');}
  const x=morningSend(p,'说说我的一天');assert.match(x.line.hanzi,/还不知道/);assert.doesNotMatch(x.line.hanzi,/八个小时/);
 }
});

import {setSharedPandaMemoryEnabled,readSharedPandaProfile} from '../assets/panda-cross-character-memory-v1.mjs';
function preferenceStorage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
test('opt-in shared preference survives new character and can be recalled and corrected',()=>{
 const storage=preferenceStorage();setSharedPandaMemoryEnabled(storage,true);
 const p=make({storage});assert.equal(morningSend(p,'我喜欢跑步').kind,'living-memory');assert.equal(morningSend(p,'我想练习声调').kind,'living-memory');
 const q=make({storage});assert.match(morningSend(q,'你还记得我的爱好吗').line.hanzi,/喜欢跑步/);
 assert.match(morningSend(q,'你记得我想练习什么吗').line.hanzi,/练习声调/);
 morningSend(q,'我不喜欢跑步了');assert.equal(readSharedPandaProfile(storage).hobby,undefined);
 assert.match(morningSend(make({storage}),'你还记得我的爱好吗').line.hanzi,/还不知道/);
 setSharedPandaMemoryEnabled(storage,false);assert.match(morningSend(make({storage}),'你记得我想练习什么吗').line.hanzi,/还不知道/);
});
test('memory disabled, uncertain speech or unverified Street speech does not persist preferences',()=>{
 const storage=preferenceStorage();const p=make({storage});answer(p,'我喜欢跑步');assert.equal(readSharedPandaProfile(storage).hobby,undefined);
 setSharedPandaMemoryEnabled(storage,true);answer(p,'我喜欢跑步',{confidence:.6});answer(p,'我想练习声调',{allowMemoryWrite:false});
 assert.equal(readSharedPandaProfile(storage).hobby,undefined);assert.equal(readSharedPandaProfile(storage).studyFocus,undefined);
 for(const raw of ['我今天很累','我想休息','我今天很开心'])answer(p,raw);
 assert.deepEqual(readSharedPandaProfile(storage),{family:{},siblingAges:{}});
});

test('adaptive exercise progresses after two understood answers and accepts negative daily answer',()=>{
 const p=make();let x=morningSend(p,'我们练习对话吧');assert.equal(x.kind,'living-adaptive');assert.equal(x.semantic.level,'basic');
 x=morningSend(p,'喜欢');assert.match(x.line.hanzi,/每天/);
 x=morningSend(p,'不是');assert.equal(x.semantic.level,'extended');assert.match(x.line.hanzi,/为什么/);
 x=morningSend(p,'因为我想去中国');assert.match(x.line.hanzi,/练习什么/);
 x=morningSend(p,'声调');assert.equal(x.semantic.slot,'end');assert.equal(p.adaptiveSnapshot(),null);assert.equal(x.toneVerified,false);
});
test('adaptive explicit help lowers complexity, negative preference avoids assumed motivation',()=>{
 const p=make();for(const raw of ['我们练习对话吧','喜欢','每天'])morningSend(p,raw);
 const x=morningSend(p,'太难了');assert.equal(x.semantic.level,'basic');assert.equal(x.semantic.help,true);assert.match(x.line.hanzi,/练习什么/);
 const q=make();morningSend(q,'我们练习对话吧');assert.match(morningSend(q,'不喜欢').line.hanzi,/练习什么/);
 const stop=morningSend(q,'我不想练习了');assert.equal(stop.semantic.slot,'stop');assert.equal(q.adaptiveSnapshot(),null);
});
test('adaptive practice stays opt-in, not graded, and uncertainty does not increase difficulty',()=>{
 const p=make();assert.notEqual(answer(p,'喜欢')?.kind,'living-adaptive');
 assert.equal(answer(p,'我们练习对话吧',{mode:'graded'}),null);
 morningSend(p,'我们练习对话吧');assert.notEqual(answer(p,'喜欢',{confidence:.7})?.kind,'living-adaptive');assert.equal(p.adaptiveSnapshot(),null);
 morningSend(p,'我们练习对话吧');p.reset();assert.equal(p.adaptiveSnapshot(),null);
});
