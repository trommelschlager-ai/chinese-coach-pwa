import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseFamilyQuestion} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const groups=[
 ['我没有孩子。',['你有孩子吗？','你有没有孩子？','你有小孩吗？','你有没有小孩？','你有几个孩子？','你有几个小孩？']],
 ['我是虚拟熊猫。你爸爸呢？',['你爸爸做什么工作？','你的爸爸做什么工作？','你爸爸是做什么的？','你爸爸在哪儿工作？','你爸爸在哪里工作？']],
 ['我是虚拟熊猫。你妈妈呢？',['你妈妈多大了？','你的妈妈多大了？','你妈妈今年多大？','你妈妈今年多大了？','你妈妈几岁？','你妈妈多少岁？']],
 ['没有，我是虚拟熊猫。',['你结婚了吗？','你结婚了没有？','你有没有结婚？']],
 ['有啊，我们可以做朋友。',['你有朋友吗？','你有没有朋友？']]
];
test('22 family questions and polite variants resolve to five exact recorded answers',()=>{
 for(const [a,qs] of groups){
  assert(lookupApprovedPandaVoice(a)?.src,a);
  for(const q of qs)for(const text of [q,'请问，'+q]){
   const x=respondToCourseFamilyQuestion(text);assert.equal(x?.reply.hanzi,a,text);
   assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
   assert(x.spoken.pinyin&&x.spoken.translation,text);
  }
 }
});
test('parent followups require the immediately preceding matching reply',()=>{
 const father=groups[1][0],mother=groups[2][0];
 assert.equal(respondToCourseFamilyQuestion('那你妈妈呢？',father)?.reply.hanzi,mother);
 assert.equal(respondToCourseFamilyQuestion('那你爸爸呢？',mother)?.reply.hanzi,father);
 for(const q of ['你妈妈呢？','你爸爸呢？','他呢？','我有两个孩子。','我爸爸是医生。','你有哥哥吗？','你喜欢孩子吗？','你结婚了。','我没有朋友。'])assert.equal(respondToCourseFamilyQuestion(q),null,q);
 assert.equal(respondToCourseFamilyQuestion('那你妈妈呢？','银行在学校旁边。'),null);
});
