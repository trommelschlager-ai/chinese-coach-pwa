import test from 'node:test';
import assert from 'node:assert/strict';
import {understandDayAnswer as understand} from '../assets/panda-hsk2-day-understanding-v1.mjs';

const cases=[
 ['我每天七点起床',0,'accepted'],['七点半',0,'accepted'],['我早上六点起床',0,'accepted'],
 ['我大概八点起床',0,'accepted'],['我起得很早',0,'clarify'],['我九点去上班',0,'clarify'],
 ['我二十五点起床',0,'clarify'],['24:00',0,'clarify'],['09:30',0,'accepted'],
 ['我起床以后刷牙',1,'accepted'],['我起床以后喝咖啡',1,'accepted'],
 ['我先刷牙再洗脸',1,'accepted'],['我起床以后上厕所',1,'accepted'],
 ['我想刷牙',1,'clarify'],['我下班以后刷牙',1,'clarify'],
 ['我早上吃早饭',2,'accepted'],['我不吃早饭',2,'accepted'],
 ['不吃',2,'accepted'],['我今天没吃早饭',2,'accepted'],
 ['我有时候吃早餐',2,'accepted'],['我喝水',2,'clarify'],
 ['我吃早饭吗',2,'unconfirmed'],['我不想吃早饭',2,'clarify'],
 ['我八点去上班',3,'accepted'],['九点',3,'accepted'],
 ['我不上班',3,'accepted'],['我在家工作',3,'accepted'],
 ['我周末不用上班',3,'accepted'],['我去八点上班',3,'correct'],
 ['我上夜班',3,'clarify'],['我早上二十五点去上班',3,'clarify'],
 ['我晚上十点睡觉',4,'accepted'],['十一点半',4,'accepted'],
 ['我凌晨一点睡觉',4,'accepted'],['我睡得很晚',4,'clarify'],
 ['我想十一点睡觉',4,'clarify'],
 ['你每天几点起床？',4,'user-question'],
 ['你早上吃早饭吗？',1,'user-question'],
 ['你几点去上班？',0,'user-question']
];

test('HSK2 My Day responds to known spoken variations and avoids fake correction',()=>{
 for(const [utterance,index,expected] of cases){
  const response=understand(utterance,index);
  assert.equal(response.kind,expected,JSON.stringify({utterance,index,response}));
  if(expected==='accepted')assert(response.value?.endsWith('。'),utterance);
  if(expected==='user-question')assert(Number.isInteger(response.questionIndex));
 }
});

test('No ASR text is misrepresented as measured pronunciation',()=>{
 for(const [utterance,index] of cases){
  const response=understand(utterance,index);
  assert(!('toneVerified' in response),'No tone verification claimed: '+utterance);
 }
});
