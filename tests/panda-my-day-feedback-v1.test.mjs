import test from 'node:test';
import assert from 'node:assert/strict';
import {understandDayAnswer} from '../assets/panda-hsk2-day-understanding-v1.mjs';

const cases=[
 ['我起床八点',0,'correct','我八点起床。'],
 ['我睡觉十一点',4,'correct','我十一点睡觉。'],
 ['我每天起床七点半',0,'correct','我每天七点半起床。'],
 ['我晚上睡觉十点左右',4,'correct','我晚上十点左右睡觉。'],
 ['起床八点',0,'correct','我八点起床。'],
 ['八点',0,'accepted'],
 ['我八点起床',0,'accepted'],
 ['我喜欢猫',0,'clarify'],
 ['我起床二十五点',0,'clarify'],
 ['他起床八点',0,'clarify'],
 ['我起床八点去上班',0,'clarify'],
 ['我不吃早饭',2,'accepted'],
 ['你几点起床？',0,'user-question'],
 ['我八点去上班',3,'accepted'],
 ['我起床以后刷牙',1,'accepted'],
 ['',0,'clarify']
];
for(const [input,index,kind,correction] of cases){
 test('My Day: '+(input||'empty input'),()=>{
  const actual=understandDayAnswer(input,index);
  assert.equal(actual.kind,kind);
  if(correction)assert.equal(actual.correction,correction);
 });
}
