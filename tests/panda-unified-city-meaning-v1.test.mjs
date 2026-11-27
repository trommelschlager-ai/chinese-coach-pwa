import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseCityQuestion,respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const cases=[
 ['银行在哪儿？','银行在学校旁边。'],['银行在哪里？','银行在学校旁边。'],['银行在哪？','银行在学校旁边。'],['请问，银行在哪儿？','银行在学校旁边。'],['哪里有银行？','银行在学校旁边。'],['这附近有银行吗？','银行在学校旁边。'],['附近有银行吗？','银行在学校旁边。'],['怎么去银行？','银行在学校旁边。'],['银行怎么走？','银行在学校旁边。'],['银行离学校远吗？','不远，很近。'],
 ['公园在哪儿？','公园在医院后面。'],['公园在哪里？','公园在医院后面。'],['请问公园在哪？','公园在医院后面。'],['哪儿有公园？','公园在医院后面。'],['这里有公园吗？','公园在医院后面。'],['怎么去公园？','公园在医院后面。'],['公园怎么走？','公园在医院后面。'],['公园离医院远吗？','不远，很近。'],
 ['你怎么上班？','我坐地铁去上班。'],['你坐什么车去上班？','我坐地铁去上班。'],['你怎么从家到公司？','我坐公交车。'],['去机场要多久？','需要一个小时。'],['到机场要多长时间？','需要一个小时。'],['去机场需要多长时间？','需要一个小时。']
];
test('24 reviewed paraphrases preserve exact meaning and recorded answer',()=>{
 for(const [q,a] of cases){
  const x=respondToCourseCityQuestion(q);
  assert.equal(x?.reply.hanzi,a,q);assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
  assert(x.spoken.pinyin&&x.spoken.translation,q);assert(lookupApprovedPandaVoice(a)?.src,q);
  assert.equal(respondToNaturalStatement(q)?.reply.hanzi,a,q);
 }
});
test('bounded follow-ups only use known previous scene; unknown distance stays unknown',()=>{
 const prior='银行在学校旁边。';
 for(const [q,a] of [['那公园呢？','公园在医院后面。'],['怎么走？',prior],['离这儿远吗？','我不知道你在哪儿。']]){
  assert.equal(respondToCourseCityQuestion(q,prior)?.reply.hanzi,a);
  assert.equal(respondToCourseCityQuestion(q),null);
 }
 assert.equal(respondToCourseCityQuestion('银行离这儿远吗？')?.reply.hanzi,'我不知道你在哪儿。');
 assert.equal(respondToCourseCityQuestion('银行离医院远吗？')?.reply.hanzi,'我不知道。');
 for(const q of ['你在哪儿工作？','我在银行工作。','上海的银行在哪里？','银行','请问','你喜欢游泳吗？','我不想去银行。'])assert.equal(respondToCourseCityQuestion(q),null,q);
});
