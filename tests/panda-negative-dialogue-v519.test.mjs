import test from 'node:test';
import assert from 'node:assert/strict';
import {replyHSK2,getTopic} from '../assets/panda-hsk2-brain-v1.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {negativeAnswerForQuestion,negativeFollowup,negativeQuestionFromLearner} from '../assets/panda-negative-dialogue-v519.mjs';

const examples=[
 [102,3,'不吃','Bù chī.'],
 [103,1,'不在','Bú zài.'],
 [103,2,'不会','Bú huì.'],
 [104,2,'不喜欢','Bù xǐhuan.'],
 [105,0,'我明天下午没空','Wǒ míngtiān xiàwǔ méi kòng.'],
 [106,1,'我昨天没运动','Wǒ zuótiān méi yùndòng.'],
 [106,2,'没去过','Méi qù guo.'],
 [109,0,'我不太好','Wǒ bú tài hǎo.'],
 [110,1,'不想','Bù xiǎng.'],
 [103,0,'我现在不工作','Wǒ xiànzài bù gōngzuò.'],
 [104,0,'我没有什么爱好','Wǒ méiyǒu shénme àihào.'],
 [109,2,'我什么都不想做','Wǒ shénme dōu bù xiǎng zuò.'],
 [107,0,'我明天什么都不打算做','Wǒ míngtiān shénme dōu bù dǎsuàn zuò.'],
 [106,0,'我昨天什么都没做','Wǒ zuótiān shénme dōu méi zuò.'],
 [108,0,'我什么都不想买','Wǒ shénme dōu bù xiǎng mǎi.'],
 [108,2,'不好看','Bù hǎokàn.'],
 [109,1,'我没事','Wǒ méi shì.']
];
// Verify this index list against the ACTUAL Panda lesson sequence.
test('17 real HSK2 Panda questions accept correct negatives and keep tone marks',()=>{
 for(const [topic,index,hanzi,pinyin] of examples){
  const current=getTopic(topic)?.questions[index];
  assert.ok(current,topic+'/'+index);
  const match=negativeAnswerForQuestion(hanzi,current.q);
  assert.ok(match,current.q+' should understand '+hanzi);
  assert.equal(match.pinyin,pinyin,hanzi);
  assert.ok(match.ru,hanzi+' must have Russian meaning');
  const result=replyHSK2(hanzi,topic,index,false,null);
  assert.ok(['accepted','variant','social','end'].includes(result.kind),current.q+' / '+hanzi+': '+result.kind);
  assert.ok(result.answer?.ru||result.spoken?.ru,hanzi+' must be translated');
  assert.notEqual(result.line?.hanzi,'我没听懂。你可以再说一遍，或者换一种说法吗？');
 }
});
test('Rejecting a meeting stops scheduling; a low mood is not assumed to mean illness',()=>{
  const busy=replyHSK2('没空',105,0,false);
  assert.equal(busy.kind,'end');
  assert.equal(busy.line.hanzi,'没关系，那我们改天再约吧。');
  assert.notEqual(busy.line.hanzi,'我们几点见面？');
  const declined=replyHSK2('不想',110,1,false);
  assert.equal(declined.kind,'end');
  assert.equal(declined.line.hanzi,'没关系，我们可以聊点别的。');
  assert.notEqual(declined.line.hanzi,'我们在哪儿见面？');
  const lowMood=replyHSK2('不好',109,0,false);
  assert.equal(lowMood.kind,'social');
  assert.equal(lowMood.line.hanzi,'怎么了？');
  assert.equal(lowMood.context.awaiting,'wellbeing-reason');
  const unwell=replyHSK2('我不舒服',109,0,false);
  assert.equal(unwell.kind,'variant','Physical illness may lead to a symptom question');
  const refusalOfSports=replyHSK2('不喜欢',104,2,false);
  assert.equal(refusalOfSports.line.hanzi,'那你喜欢什么？');
});
test('No is NOT accepted when incompatible with a Panda question',()=>{
 for(const [topic,index,hanzi] of [[101,0,'没有'],[103,2,'没去过'],[106,2,'不吃'],[104,2,'没有']]){
  const q=getTopic(topic).questions[index].q;
  assert.equal(negativeAnswerForQuestion(hanzi,q),null,q+' / '+hanzi);
  assert.notEqual(replyHSK2(hanzi,topic,index,false,null).kind,'variant',q+' / '+hanzi);
 }
});
test('Habitual 不 vs past 没 and A-not-A question negative are kept distinct',()=>{
 const habit=replyHSK2('我不吃早饭',102,3);
 const past=replyHSK2('我昨天没运动',106,1);
 const negInvite=replyHSK2('不了',110,1);
 const experience=replyHSK2('没有',106,2);
 assert.equal(habit.spoken.pinyin,'Wǒ bù chī zǎofàn.');
 assert.equal(past.spoken.pinyin,'Wǒ zuótiān méi yùndòng.');
 assert.equal(negInvite.spoken.pinyin,'Bù liǎo.');
 assert.equal(experience.spoken.pinyin,'Méiyǒu.');
 assert.equal(negativeAnswerForQuestion('我不去过上海','你去过上海吗？'),null);
 assert.equal(negativeAnswerForQuestion('没有','你早上吃早饭吗？'),null);
});
test('Follow-up after a refusal does not repeat the rejected offer',()=>{
 for(const [said,awaiting,expect] of [
  ['不想','offerRest','好，那我们换个话题。'],
  ['不了','conversation','好的，下次再聊。'],
  ['不想喝茶','offerTea','不喝也没关系。'],
  ['不难','difficulty','很好，继续加油！'],
  ['不喜欢','likes','那你喜欢什么？'],
  ['不好','mood','怎么了？']
 ]){
   const direct=negativeFollowup(said,{awaiting});
   assert.equal(direct.line.hanzi,expect,said+' ('+awaiting+')');
   assert.equal(direct.context.awaiting,null,said+' should clear the rejected offer');
   const result=replyHSK2(said,101,0,false,{awaiting});
   assert.equal(result.kind,'social',said+' / '+awaiting);
   assert.equal(result.line.hanzi,expect,said+' / '+awaiting);
   assert.ok(result.spoken.pinyin&&result.spoken.ru);
 }
 assert.equal(negativeFollowup('不想',null),null,'A bare rejection without context has no known meaning');
});
test('Learner negative questions get a real answer, not generic I do not understand',()=>{
 const cases=[
  ['你不喜欢跑步吗','喜欢，我喜欢跑步。'],
  ['你不喜欢运动吗','喜欢，我喜欢运动。'],
  ['你不喝茶吗','喝，我喜欢喝茶。'],
  ['你不会说中文吗','会，我会说中文。'],
  ['你不想聊天吗','想，我想和你聊天。']
 ];
 for(const [zh,answer] of cases){
  const direct=negativeQuestionFromLearner(zh);
  assert.ok(direct,zh);
  const r=replyHSK2(zh,101,0);
  assert.equal(r.kind,'social',zh);
  assert.equal(r.line.hanzi,answer,zh);
  assert.ok(r.spoken.pinyin.includes('ù')||r.spoken.pinyin.includes('ú'),zh+' tone marks required');
 }
});
test('HSK1 Non-Stop understands concise negative replies only for matching prompts',()=>{
 for(const [prompt,response,pinyin] of [
  ['你好吗','不好','Bù hǎo.'],
  ['你会说中文吗','不会','Bú huì.'],
  ['你喜欢跑步吗','不喜欢','Bù xǐhuan.'],
  ['你有哥哥吗','没有','Méiyǒu.'],
  ['你想休息吗','不想','Bù xiǎng.']
 ]){
  const r=answerLive(response,{allowed:[1,2,3,4,5,6,7],topic:1,prompt:{hanzi:prompt,lesson:1},turn:1});
  assert.equal(r.kind,'answer',prompt+' / '+response);
  assert.equal(r.spoken.pinyin,pinyin);
  assert.ok(r.reply.hanzi&&r.reply.ru, 'Panda replies meaningfully');
  assert.equal(r.followup,null,'Do not jump to unrelated followup');
 }
 const unprompted=answerLive('没有',{allowed:[1],topic:1});
 assert.notEqual(unprompted.kind,'answer','Unprompted "No" must not be taken as a complete answer');
});
