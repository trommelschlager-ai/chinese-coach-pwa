import test from 'node:test';
import assert from 'node:assert/strict';
import {patternPrompts,patternStudentAnswer} from '../assets/panda-hsk1-patterns-v285.mjs';

const allowed=[1,2,3,4,5,6,7];
const sunday=new Date(2026,10,15,12);
const day=new Date(2026,10,12,12);
const prompt=(topic,datetime,hanzi)=>{
 const result=patternPrompts(topic,datetime,allowed).find(p=>p.hanzi===hanzi);
 assert(result,'Missing verified question: '+hanzi);
 return result;
};

test('literal weekday pinyin and Russian meaning match only the words written',()=>{
 const p=prompt(4,sunday,'今天星期几？');
 for(const [zh,py,ru] of [
  ['星期天','Xīngqītiān.','Воскресенье.'],
  ['今天星期天','Jīntiān xīngqītiān.','Сегодня воскресенье.'],
  ['今天是星期天','Jīntiān shì xīngqītiān.','Сегодня воскресенье.']
 ]){
  const r=patternStudentAnswer(zh,p,allowed,sunday);
  assert.equal(r?.pinyin,py,zh);
  assert.equal(r?.translation,ru,zh);
  assert.equal(r?.hanzi,zh);
 }
 assert.equal(patternStudentAnswer('星期一',p,allowed,sunday),null,
  'A wrong day cannot be accepted as the current date');
 assert.equal(patternStudentAnswer('星期天',p,[1,2,3],sunday),null,
  'Do not unlock weekday practice without the HSK1 weekday lesson');
});

test('short and full date answers do not inherit unspoken 今天 or 是',()=>{
 const today=prompt(5,sunday,'今天几月几号？');
 for(const [zh,py,ru] of [
  ['十一月十五号','Shí yī yuè shí wǔ hào.','15.11.'],
  ['今天十一月十五号','Jīntiān shí yī yuè shí wǔ hào.','Сегодня 15.11.'],
  ['今天是十一月十五号','Jīntiān shì shí yī yuè shí wǔ hào.','Сегодня 15.11.']
 ]){
  const r=patternStudentAnswer(zh,today,allowed,sunday);
  assert.equal(r?.pinyin,py,zh);
  assert.equal(r?.translation,ru,zh);
 }
 const next=prompt(5,sunday,'明天几月几号？');
 const tomorrow=patternStudentAnswer('十一月十六号',next,allowed,sunday);
 assert.equal(tomorrow?.pinyin,'Shí yī yuè shí liù hào.');
 assert.equal(tomorrow?.translation,'16.11.');
});

test('yes/no calendar practice does not add 对 or 不是 to the literal full reply',()=>{
 const falseQuestion=prompt(4,day,'今天是星期一吗？');
 const reported=patternStudentAnswer('今天星期四',falseQuestion,allowed,day);
 assert.equal(reported?.pinyin,'Jīntiān xīngqīsì.');
 assert.equal(reported?.translation,'Сегодня четверг.');
 assert(!reported.pinyin.includes('shì,'));
 assert(!falseQuestion.accepted.some(x=>x.includes('不是今天')),
  'Do not accept unnatural concatenation 不是今天... as a reviewed answer');
 const no=patternStudentAnswer('不是',falseQuestion,allowed,day);
 assert.equal(no?.pinyin,'Bú shì.');
 assert.equal(no?.translation,'Нет.');
});

test('all 126 generated pattern prompts still accept a reviewed sample',()=>{
 let checked=0;
 for(const topic of [2,3,4,5,6,7]){
  for(const p of patternPrompts(topic,sunday,allowed)){
   const sample=p.accepted[0],r=patternStudentAnswer(sample,p,allowed,sunday);
   assert(r?.known&&r?.pinyin&&r?.translation,p.hanzi+' / '+sample);
   assert.equal(r.hanzi,sample);
   checked++;
  }
 }
 assert(checked>=126);
});
