import assert from 'node:assert/strict';
import {dailyQuestions,checkDayAnswer,dailyFinal} from '../assets/panda-hsk2-day-coach-v1.mjs';
assert.equal(dailyQuestions(0).length,3,'First micro-lesson unlocks 3 reviewed prompts');
assert.equal(dailyQuestions(1).length,4,'Second micro-lesson unlocks 4');
assert.equal(dailyQuestions(2).length,5,'Third unlocks all day questions');
for(const mini of [0,1,2])for(const q of dailyQuestions(mini)){
 assert.equal(typeof q.hanzi,'string');
 assert.ok(q.pinyin&&q.ru&&q.hint&&q.pattern instanceof RegExp);
 assert.equal(q.audioKey,null,'Never pretend audio exists');
}
const good=[
 ['我每天七点起床。',0],['我早上六点起床。',0],['七点起床',0],
 ['我早上洗脸。',1],['我不洗脸',1],
 ['我早上吃早饭。',2],['不吃早饭',2],
 ['我先刷牙，再吃早饭。',3],
 ['我晚上常常看书。',4],
];
for(const [utterance,idx] of good){
 const x=checkDayAnswer(utterance,idx,2);
 assert.equal(x.ok,true,'should accept '+utterance+' at '+idx);
 assert.match(x.message,/不检查|не проверка|не оцен|не провер/i);
 assert.equal(x.spoken.pinyin,null,'Do not fabricate pinyin for variable learner replies');
}
const bad=[
 ['我每天刷牙。',0],
 ['我吃早饭',1],
 ['我洗脸',2],
 ['我每天七点起床',3],
 ['我昨天工作',4]
];
for(const [utterance,idx] of bad)assert.equal(checkDayAnswer(utterance,idx,2).ok,false,'reject off-topic '+utterance);
assert.equal(checkDayAnswer('我先刷牙，再吃早饭。',3,0).ok,false,'Do not ask locked content in the first mini-lesson');
assert.ok(dailyFinal.hanzi.includes('好'));
console.log('PASS: Panda AI daily coaching: 3/4/5 scoped prompts, valid answer variants, off-topic rejection, no acoustic tone scoring.');
