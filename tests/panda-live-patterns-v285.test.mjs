import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
 PATTERN_FAMILIES,patternCoverage,patternPrompts,patternQuestion,patternStudentAnswer,conversationalFollowup
} from '../assets/panda-hsk1-patterns-v285.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {coursePromptBank} from '../assets/panda-hsk1-questions-v281.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
const c={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'),c);
const course=c.window.PANDA_HSK1_FOUNDATIONS,allowed=[1,2,3,4,5,6,7],date=new Date(2026,10,12,12);
const key=s=>String(s).replace(/[。！？?!，,\s]/g,'');
test('v285 creates 100+ distinct HSK1 questions through 13 reusable families',()=>{
 const cov=patternCoverage(date);
 assert.equal(cov.families,13);
 assert.equal(PATTERN_FAMILIES.length,13);
 assert(cov.total>=110,'Too few question variants '+cov.total);
 assert(cov.byLesson[2]>=55,'Number family too small');
 assert(cov.byLesson[3]>=24,'Weekday family too small');
 assert(cov.byLesson[5]>=12,'Family grammar too small');
 assert(cov.byLesson[6]>=18,'Weather grammar too small');
 const q=[2,3,4,5,6,7].flatMap(n=>patternPrompts(n,date,allowed));
 assert.equal(q.length,cov.total);
 assert.equal(new Set(q.map(p=>key(p.hanzi))).size,q.length,'Duplicate generated questions');
 for(const item of q){
  assert(item.pinyin&&item.ru&&item.lesson,'Question missing translation '+item.hanzi);
  assert(item.audioKey===null||lookupPilotAudio(item.audioKey),'Fabricated audio '+item.hanzi);
  assert(item.accepted.length,'No acceptable spoken response for '+item.hanzi);
  assert(item.verifiedLines?.length===2,'Missing prompt feedback form');
 }
});
test('learner can ask every generated question, but not a locked lesson',()=>{
 for(const chapter of [2,3,4,5,6,7]){
  for(const q of patternPrompts(chapter,date,allowed)){
   const ans=patternQuestion(q.hanzi,allowed,date);
   assert.equal(ans?.kind,'question',q.hanzi);
   assert(ans.spoken?.known&&ans.spoken?.pinyin&&ans.spoken?.translation,q.hanzi);
   assert(ans.reply?.hanzi&&ans.reply?.pinyin&&ans.reply?.ru,q.hanzi);
   if(ans.reply.audioKey)assert(lookupPilotAudio(ans.reply.audioKey));
  }
 }
 assert.equal(patternQuestion('你有姐姐吗？',[1,6],date).kind,'question');
 assert.equal(patternQuestion('你有几个姐姐？',[1,6],date).kind,'locked','Count requires lesson 3');
 assert.equal(patternQuestion('今天是星期二吗？',[1],date).kind,'locked');
 assert.equal(patternQuestion('宇宙飞船在哪里？',allowed,date),null);
});
test('every generated prompt has an intelligible accepted answer and keeps lesson context',()=>{
 let count=0;
 for(const chap of [2,3,4,5,6,7])for(const prompt of patternPrompts(chap,date,allowed)){
  const sample=prompt.accepted[0],reply=patternStudentAnswer(sample,prompt,allowed,date);
  assert(reply?.known,'Cannot understand '+prompt.hanzi+' -> '+sample);
  assert(reply?.pinyin&&reply.translation,'No tone marked pinyin or meaning for '+prompt.hanzi+' -> '+sample);
  assert.equal(reply.topic,chap,prompt.hanzi);
  assert.equal(reply.matchedPrompt,true,prompt.hanzi);
  count++;
 }
 assert(count>=110);
});
test('actual Panda engine understands novel questions and validates their specific answers',()=>{
 const scenarios=[
 ['三十九后面是几？','四十。','四十','三十九'],
 ['二十一前面是几？','二十。','二十','二十二'],
 ['今天是星期四吗？','是，今天星期四。','是','不是'],
 ['今天是星期一吗？','不是，今天星期四。','不是','是'],
 ['明天是星期五吗？','是，明天星期五。','是','不是'],
 ['你有几个妹妹？','我有一个妹妹。','我有一个妹妹','我有两个哥哥'],
 ['你是学生吗？','不是，我是老师。','我是学生','我有两个'],
 ['今天冷吗？','今天很冷。','今天很冷','今天很热'],
 ['明天下雪吗？','明天不下雪。','明天不下雪','明天下雪'],
 ['冬天天气怎么样？','冬天很冷。','冬天很冷','夏天很热']
 ];
 for(const [question,answer,good,bad] of scenarios){
  const r=answerLive(question,{allowed,curriculum:course,date});
  assert.equal(r.kind,'question','Missing '+question+' '+r.kind);
  assert.equal(r.reply.hanzi,answer,question);
  const q=patternPrompts(r.lesson,date,allowed).find(x=>key(x.hanzi)===key(question));
  assert(q,'not generated '+question);
  const checked=answerLive(good,{allowed,topic:r.lesson,prompt:q,curriculum:course,date,turn:1,profile:{family:{}}});
  assert.equal(checked.kind,'answer',question+' correct '+good+': '+checked.kind);
  assert(checked.spoken?.known&&checked.spoken?.pinyin&&checked.spoken?.translation,question);
  const wrong=answerLive(bad,{allowed,topic:r.lesson,prompt:q,curriculum:course,date,turn:1,profile:{family:{}}});
  assert.notEqual(wrong.kind,'answer',question+' falsely accepts '+bad);
 }
});
test('Panda uses the real calendar, not hard-coded November dates',()=>{
 const d1=new Date(2026,10,12,12),d2=new Date(2028,1,29,12),d3=new Date(2027,0,1,12);
 assert.equal(patternQuestion('今天是星期四吗？',allowed,d1).reply.hanzi,'是，今天星期四。');
 assert.equal(patternQuestion('今天是星期一吗？',allowed,d1).reply.hanzi,'不是，今天星期四。');
 assert.equal(patternQuestion('明天是几月几号？',allowed,d1).reply.hanzi,'明天十一月十三号。');
 assert.equal(patternQuestion('昨天是几月几号？',allowed,d3).reply.hanzi,'昨天十二月三十一号。');
 assert.equal(patternQuestion('今天是几月几号？',allowed,d2).reply.hanzi,'今天二月二十九号。');
});
test('contextual memory asks about a mentioned relative only if age lessons unlocked',()=>{
 const family={known:true,topic:6,family:{present:['妹妹'],absent:null}};
 const a=conversationalFollowup(family,allowed,{family:{妹妹:true},siblingAges:{}},[],date);
 assert.equal(a.hanzi,'你妹妹几岁？');
 assert.equal(a.isContextual,true);
 assert.equal(conversationalFollowup(family,[1,6],{family:{妹妹:true}},[],date),null);
 const noRepeat=conversationalFollowup(family,allowed,{family:{妹妹:true},siblingAges:{}},['你妹妹几岁？'],date);
 assert.equal(noRepeat,null);
 const alreadyKnown=conversationalFollowup(family,allowed,{family:{妹妹:true},siblingAges:{妹妹:8}},[],date);
 assert.equal(alreadyKnown,null);
});
test('question bank includes new templates but cannot ask number questions in a family-only course',()=>{
 const full=coursePromptBank(6,course,date,{unlocked:allowed});
 const partial=coursePromptBank(6,course,date,{unlocked:[1,6]});
 assert(full.some(x=>x.family==='relative-count'));
 assert(!partial.some(x=>x.family==='relative-count'));
 assert(!partial.some(x=>x.family==='relative-age'));
 assert(partial.some(x=>key(x.hanzi)===key('你有哥哥吗？')),'Existing lesson question must remain available');
 const week=coursePromptBank(4,course,date,{unlocked:allowed});
 assert(week.some(x=>x.family==='weekday-yesno'));
});
