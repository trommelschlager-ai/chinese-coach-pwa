import test from 'node:test';
import assert from 'node:assert/strict';
import {answerBasicConversation} from '../assets/panda-basic-conversation-v323.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';

const all=[1,2,3,4,5,6,7];
const opts={allowed:all,topic:1,date:new Date('2026-11-14T11:00:00'),profile:{family:{}}};

test('screenshot: 你姐姐怎么样？ is a valid and accurately translated question',()=>{
 const r=answerLive('你姐姐怎么样？',opts);
 assert.equal(r.kind,'question');
 assert.equal(r.spoken.hanzi,'你姐姐怎么样？');
 assert.equal(r.spoken.pinyin,'Nǐ jiějie zěnmeyàng?');
 assert.equal(r.spoken.translation,'Как поживает твоя старшая сестра?');
 assert.equal(r.reply.hanzi,'我没有姐姐。');
 assert.equal(r.reply.pinyin,'Wǒ méiyǒu jiějie.');
 assert.equal(r.reply.audioKey,null,'Never claim an unrecorded MP3 exists');
 assert.equal(r.followup.hanzi,'你有姐姐吗？');
});

test('elementary family small talk answers even if lesson 6 is not unlocked',()=>{
 const r=answerLive('你姐姐怎么样',{...opts,allowed:[1]});
 assert.equal(r.kind,'question');
 assert.equal(r.lesson,1);
 assert.equal(r.reply.hanzi,'我没有姐姐。');
 assert.equal(r.followup,null,'No locked family follow-up');
});

test('family member wellbeing stays consistent with fictional Panda family and third-person pronoun',()=>{
 const examples=[
  ['你哥哥怎么样','他很好，谢谢！','Tā hěn hǎo, xièxie!','Nǐ gēge zěnmeyàng?'],
  ['你妹妹还好吗','她很好，谢谢！','Tā hěn hǎo, xièxie!','Nǐ mèimei hái hǎo ma?'],
  ['你弟弟好吗','我没有弟弟。','Wǒ méiyǒu dìdi.','Nǐ dìdi hǎo ma?'],
  ['你的妈妈今天怎么样','她很好，谢谢！','Tā hěn hǎo, xièxie!','Nǐ de māma jīntiān zěnmeyàng?'],
  ['你爸爸现在怎么样了','他很好，谢谢！','Tā hěn hǎo, xièxie!','Nǐ bàba xiànzài zěnmeyàng le?'],
  ['你姐姐好不好','我没有姐姐。','Wǒ méiyǒu jiějie.','Nǐ jiějie hǎo bù hǎo?']
 ];
 for(const [input,hanzi,pinyin,studentPy] of examples){
  const r=answerLive(input,opts);
  assert.equal(r.kind,'question',input);assert.equal(r.reply.hanzi,hanzi,input);
  assert.equal(r.reply.pinyin,pinyin,input);assert.equal(r.spoken.pinyin,studentPy,input);
  assert(r.spoken.translation?.includes('тво'),input);
  assert(!r.reply.audioKey||typeof r.reply.audioKey==='string');
 }
});

test('screenshot: duplicated 今天 is an explicit text correction, not unknown meaning or a tone grade',()=>{
 for(const input of ['今天今天怎么样','你今天今天怎么样']){
  const r=answerLive(input,opts);
  assert.equal(r.kind,'correction',input);
  assert.equal(r.spoken.known,false);
  assert.equal(r.spoken.hanzi,input);
  assert.equal(r.spoken.translation,null);
  assert.equal(r.spoken.correction.hanzi,'你今天怎么样？');
  assert.equal(r.spoken.correction.pinyin,'Nǐ jīntiān zěnmeyàng?');
  assert.match(r.message,/повторено/i);
  assert.match(r.message,/погоде/);
  assert.equal(r.reply,undefined);
 }
 const weather=answerLive('今天今天天气怎么样',opts);
 assert.equal(weather.spoken.correction.hanzi,'今天天气怎么样？');
});

test('do not intercept the valid weather question or natural greeting already checked in older engines',()=>{
 assert.equal(answerBasicConversation('今天天气怎么样',all),null);
 assert.equal(answerBasicConversation('你今天怎么样',all),null);
 assert.equal(answerBasicConversation('你姐姐是老师吗',all),null);
 assert.equal(answerBasicConversation('我有三个哥哥',all),null);
 const weather=answerLive('今天天气怎么样',opts);
 assert.equal(weather.kind,'question');
 assert.equal(answerLive('你今天怎么样',opts).kind,'question');
});

test('no HTML injection in correction or unbounded user text',()=>{
 assert.equal(answerBasicConversation('你姐姐怎么样'.repeat(100),all),null);
 assert.equal(answerBasicConversation('你姐姐怎么样<script>',all),null);
});
