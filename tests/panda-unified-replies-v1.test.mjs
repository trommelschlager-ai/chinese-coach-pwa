import test from 'node:test';
import assert from 'node:assert/strict';
import {initialSemanticState,reduceSemanticContext} from '../assets/panda-unified-context-v1.mjs';
import {planSemanticConversationTurn} from '../assets/panda-unified-replies-v1.mjs';
const initial=initialSemanticState;
const prior=(s,hanzi,pinyin='fixture',ru='fixture',continuesLearnerTurn=false)=>reduceSemanticContext(s,{type:'panda',line:{hanzi,pinyin,ru},continuesLearnerTurn}).state;
const plan=(q,s=initial(),options={})=>planSemanticConversationTurn(s,q,options);
test('same short agreement generates different replies in real context',()=>{assert.equal(plan('对对',prior(initial(),'你今天休息吗？')).reply.line.hanzi,'那你休息一下吧。');assert.equal(plan('对对',prior(initial(),'你想喝茶吗？')).reply.line.hanzi,'你喜欢喝什么茶？');assert.equal(plan('对对').reply.kind,'clarification');assert.equal(plan('不是',prior(initial(),'你今天休息吗？')).reply.line.hanzi,'那你想做什么？');});
test('intent and negation determine response',()=>{for(const [q,want] of [['我想休息','那你休息一下吧。'],['我不想休息','为什么？'],['我觉得中文很难','你想练习什么？'],['我觉得中文不难','为什么？'],['因为我很累，所以我想休息','那你休息一下吧。'],['我一边喝茶一边看书','你经常这样做吗？'],['我先刷牙再吃早饭','然后呢？'],['你现在做什么','我在和你聊天。'],['你今天想做什么','我今天和你练习中文。']])assert.equal(plan(q).reply?.line.hanzi,want,q);});
test('reciprocal question must get a response, not a rest or generic prompt',()=>{assert.equal(plan('我想喝茶，你呢？').reply.line.hanzi,'我是虚拟熊猫，不能真的喝茶。');const s=plan('我想喝茶').state;assert.equal(plan('你呢',prior(s,'你喜欢喝什么茶？','fixture','fixture',true)).reply.line.hanzi,'我是虚拟熊猫，不能真的喝茶。');assert.equal(plan('你呢').reply.kind,'clarification');});
test('exact reference reply distinguishes meaning from repeat',()=>{const s=prior(initial(),'我喜欢听音乐。','Wǒ xǐhuan tīng yīnyuè.','Я люблю слушать музыку.');for(const [q,k] of [['什么','repeat-exact'],['什么意思','explain-exact']]){const x=plan(q,s);assert.equal(x.reply.kind,k);assert.equal(x.reply.line.hanzi,'我喜欢听音乐。');assert.equal(x.reply.line.ru,'Я люблю слушать музыку.');assert.equal(x.state.lastSpeaker,'learner');}});
test('audio only by supplied exact lookup; missing recording remains text-only',()=>{let looked=[];const lookupExact=q=>{looked.push(q);return q==='那你休息一下吧。'?{src:'./assets/fixture.mp3'}:null;};const yes=plan('我想休息',initial(),{lookupExact});const no=plan('我不想休息',initial(),{lookupExact});assert.equal(yes.reply.voiceStatus,'registered-exact');assert.equal(no.reply.voiceStatus,'text-only');assert.equal(no.reply.audio,null);assert.deepEqual(looked,['那你休息一下吧。','为什么？']);assert.equal(yes.reply.toneVerified,false);});
test('unhandled, unknown and ambiguous questions use established fallback; no invented experiences',()=>{for(const q of ['我想','我喜欢火星','你觉得这本书怎么样','你明天想做什么','你不会游泳吗']){const x=plan(q);assert.equal(x.handled,false,q);assert.equal(x.reply,null,q);}});

test('family context recognizes singular and counted relatives without treating one missing relative as no siblings',()=>{
 const s=prior(initial(),'你有兄弟姐妹吗？');
 const relations={哥哥:'older-brother',姐姐:'older-sister',弟弟:'younger-brother',妹妹:'younger-sister'};
 for(const subject of ['','我'])for(const count of ['','一个','两个','三个','四个'])for(const [relative,value] of Object.entries(relations)){
  const q=subject+'有'+count+relative,x=plan(q,s);
  assert.equal(x.semantic?.slot,'family-siblings',q);
  assert.equal(x.semantic.value,value,q);
  assert.equal(x.reply?.line.hanzi,'明白了。你家有几口人？',q);
  assert.equal(x.reply.toneVerified,false,q);
 }
 for(const q of ['没有兄弟姐妹','我没有哥哥姐姐弟弟妹妹','没有哥哥姐姐弟弟妹妹','我没有兄弟和姐妹','没有兄弟和姐妹']){
  assert.equal(plan(q,s).semantic?.value,'no',q);
 }
 for(const q of ['我没有姐姐','我没有哥哥','我没有弟弟','我没有妹妹'])assert.notEqual(plan(q,s).semantic?.value,'no',q);
 assert.equal(plan('我有两个哥哥',s).semantic.pinyin,'Wǒ yǒu liǎng ge gēge.');
 assert.equal(plan('我不想说',s).reply.line.hanzi,'好的。我们聊点别的吧！');
});
test('family size accepts reviewed numbers and keeps the answer scoped to the displayed question',()=>{
 const s=prior(initial(),'明白了。你家有几口人？');
 const numbers=['一','两','三','四','五','六','七','八','九','十'];
 for(const prefix of ['','我家有','我们家有','家里有','我家里有'])for(const [i,n] of numbers.entries()){
  const q=prefix+n+'口人',x=plan(q,s);
  assert.equal(x.semantic?.slot,'family-size',q);
  assert.equal(x.semantic.value,String(i+1),q);
  assert.equal(x.reply?.line.hanzi,'你接下来想做什么？',q);
 }
 assert.equal(plan('我家有一口人',s).semantic.pinyin,'Wǒ jiā yǒu yì kǒu rén.');
 assert.notEqual(plan('三口人').semantic?.slot,'family-size');
 assert.notEqual(plan('你家有三口人吗？',s).semantic?.slot,'family-size');
 assert.equal(plan('我不想说',s).reply.line.hanzi,'好的。我们聊点别的吧！');
});

test('days off do not trigger work-start questions and remain respected on topic return',()=>{
 const s=prior(initial(),'你今天忙吗？');
 for(const subject of ['','我'])for(const action of ['不上班','休息','不用上班']){
  const q=subject+'今天'+action,x=plan(q,s);
  assert.equal(x.semantic?.value,'off',q);
  assert.equal(x.reply?.line.hanzi,'你接下来想做什么？',q);
  const resumed=plan('聊聊工作吧',prior(x.state,x.reply.line.hanzi,x.reply.line.pinyin,x.reply.line.ru,true));
  assert.equal(resumed.reply?.line.hanzi,'你接下来想做什么？',q);
 }
 const w=prior(initial(),'你几点去上班？');
 for(const q of ['今天不上班','我今天休息','我不用上班','我没有工作','我现在没有工作']){
  assert.equal(plan(q,w).semantic?.value,'none',q);
  assert.equal(plan(q,w).reply?.line.hanzi,'你接下来想做什么？',q);
 }
 assert.equal(plan('我今天不用上班',s).semantic.pinyin,'Wǒ jīntiān bú yòng shàngbān.');
 assert.notEqual(plan('我今天不上班？',s).semantic?.slot,'work-busy');
 assert.notEqual(plan('忙？',s).semantic?.slot,'work-busy');
});
test('study motivation recognizes different reviewed reasons and keeps travel distinct from work',()=>{
 const s=prior(initial(),'你为什么想学中文？');
 for(const [reason,value] of [['想在中国工作','work'],['想去中国旅游','china-trip'],['想在中国学习','study'],['想和中国人聊天','communication'],['想和朋友说中文','friends'],['想看懂中文','reading'],['喜欢中国文化','culture'],['喜欢中文','interest'],['对中国文化感兴趣','culture']]){
  for(const prefix of ['','我','因为','因为我']){
   const q=prefix+reason,x=plan(q,s);
   assert.equal(x.semantic?.slot,'study-reason',q);
   assert.equal(x.semantic.value,value,q);
   assert.equal(x.reply?.line.hanzi,value==='china-trip'?'你打算什么时候去？':'你接下来想做什么？',q);
   assert.equal(x.reply.toneVerified,false);
  }
 }
 for(const q of ['工作需要','因为工作需要'])assert.equal(plan(q,s).semantic?.value,'work',q);
 assert.equal(plan('因为我想和中国人聊天',s).semantic.pinyin,'Yīnwèi wǒ xiǎng hé Zhōngguó rén liáotiān.');
 for(const q of ['因为我喜欢中文？','你想在中国工作吗？','他喜欢中文'])assert.notEqual(plan(q,s).semantic?.slot,'study-reason',q);
});
test('practice goals accept natural learning variants, with no claimed audio tone verification',()=>{
 const s=prior(initial(),'你想练习什么？');
 for(const subject of ['','我'])for(const verb of ['练习','学','学习'])for(const target of ['声调','发音','语法','汉字','听力','口语','中文','汉语']){
  const q=subject+'想'+verb+target,x=plan(q,s);
  assert.equal(x.semantic?.value,target,q);
  assert.equal(x.reply?.line.hanzi,'没关系，我们慢慢来。',q);
  assert.equal(x.reply.toneVerified,false,q);
 }
 for(const q of ['我想提高口语','想提高听力'])assert.equal(plan(q,s).semantic?.slot,'study-practice',q);
 assert.equal(plan('我想提高口语',s).semantic.pinyin,'Wǒ xiǎng tígāo kǒuyǔ.');
 assert.notEqual(plan('我想练习声调？',s).semantic?.slot,'study-practice');
});
