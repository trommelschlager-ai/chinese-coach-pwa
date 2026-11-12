import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {extendedQuestions,lookupExtendedQuestion,extensionAnswer,extensionStatement,extensionPrompts,rememberedFamilyFollowup,EXTENDED_QUESTION_COUNT} from '../assets/panda-hsk1-extensions-v282.mjs';
import {answerLive,analyzeLearner} from '../assets/panda-live-dialogue-v272.mjs';
import {coursePromptBank} from '../assets/panda-hsk1-questions-v281.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'),sandbox);
const curriculum=sandbox.window.PANDA_HSK1_FOUNDATIONS;
const allowed=[1,2,3,4,5,6,7],date=new Date(2026,10,12,12);
const strip=s=>String(s||'').replace(/[。！？?!，,\s]/g,'');
test('29 extra question-response pairs span every HSK1 lesson',()=>{
 const entries=extendedQuestions();
 assert.equal(EXTENDED_QUESTION_COUNT,29);assert.equal(entries.length,29);
 const byTopic=[3,4,4,4,4,5,5];
 for(let i=1;i<=7;i++){
  assert.equal(entries.filter(x=>x.lesson===i).length,byTopic[i-1]);
  assert(extensionPrompts(i,date).length>0,'No new prompt for '+i);
  const bank=coursePromptBank(i,curriculum,date);
  for(const p of extensionPrompts(i,date))assert(bank.find(b=>strip(b.hanzi)===strip(p.hanzi)),p.hanzi);
 }
});
test('Panda understands all 29 student questions and returns checked Chinese, Russian and context',()=>{
 for(const entry of extendedQuestions()){
  const result=answerLive(entry.hanzi,{allowed,topic:entry.lesson,curriculum,date,profile:{family:{}}});
  assert.equal(result.kind,'question',entry.hanzi);
  assert.equal(result.lesson,entry.lesson,entry.hanzi);
  assert(result.spoken?.known&&result.spoken.translation&&result.spoken.pinyin,entry.hanzi);
  assert(result.reply?.hanzi&&result.reply.pinyin&&result.reply.ru,entry.hanzi);
  if(result.reply.audioKey)assert(lookupPilotAudio(result.reply.audioKey),'Faked audio '+entry.hanzi);
  if(entry.lesson===7&&/今天下雪|现在下雨|今天有风/.test(entry.hanzi))
   assert(result.reply.context.includes('Учебная сценка'),entry.hanzi);
  if(entry.lesson>1)assert.equal(answerLive(entry.hanzi,{allowed:[1],topic:1,curriculum,date}).kind,'locked',entry.hanzi);
  for(const variant of entry.keys){
   const response=extensionAnswer(variant,allowed,date,{family:{}});
   assert.equal(response?.kind,'question',variant);
  }
 }
});
test('additional statements translate correctly with tone-marked pinyin and family facts',()=>{
 for(const [chinese,ru] of [
  ['我有妹妹，没有弟弟','У меня есть младшая сестра, но нет младшего брата.'],
  ['我有爷爷','У меня есть дедушка по отцу.'],
  ['我没有奶奶','У меня нет бабушки по отцу.'],
  ['我有外婆','У меня есть бабушка по матери.'],
  ['我星期天有空','Я свободен в воскресенье.'],
  ['我今天有空','Я сегодня свободен.'],
  ['我的生日是三月六号','Мой день рождения — 6.3.']
 ]){
  const r=analyzeLearner(chinese,allowed,{lesson:6},curriculum);
  assert.equal(r.known,true,chinese);assert.equal(r.translation,ru,chinese);
  assert(r.pinyin&&/[āáǎàēéěèīíǐìōóǒòūúǔù]/.test(r.pinyin),chinese);
 }
 assert.equal(extensionStatement('我有妹妹没有妹妹',allowed),null,'Contradiction must not be accepted');
 assert(!analyzeLearner('我有外婆',[1],null,curriculum).known,'No unstudied family');
});
test('real calendar replies handle month boundaries and leap years, without fake weather forecasts',()=>{
 const feb=extensionAnswer('这个月有多少天',allowed,new Date(2028,1,12));
 assert.equal(feb.reply.hanzi,'这个月有二十九天。');
 const nov=extensionAnswer('下个月是几月',allowed,new Date(2026,10,12));
 assert.equal(nov.reply.hanzi,'下个月是十二月。');
 const december=extensionAnswer('下个月是几月',allowed,new Date(2026,11,12));
 assert.equal(december.reply.hanzi,'下个月是一月。');
 const today=extensionAnswer('现在是几月',allowed,new Date(2026,10,12));
 assert.equal(today.reply.hanzi,'现在是十一月。');
});
test('memory: student mentioning a younger sister causes an age follow-up, not just 谢谢',()=>{
 const original=coursePromptBank(6,curriculum,date).find(p=>strip(p.hanzi)==='你有哥哥吗');
 const r=answerLive('我有妹妹',{allowed,topic:6,prompt:original,curriculum,date,profile:{family:{},hasNumbers:true}});
 assert.equal(r.kind,'statement');
 assert.equal(r.spoken.translation,'У меня есть младшая сестра.');
 assert.equal(r.followup?.hanzi,'你妹妹几岁？');
 assert(r.reply,'Must respond to off-topic but meaningful family information');
 const context=r.followup;
 const age=answerLive('她八岁',{allowed,topic:6,prompt:context,curriculum,date,profile:{family:{妹妹:true},hasNumbers:true}});
 assert.equal(age.kind,'answer');
 assert.equal(age.spoken?.fact?.relativeAge,8);
 assert(age.spoken?.pinyin?.includes('bā suì'));
 assert.equal(rememberedFamilyFollowup({family:{妹妹:true},siblingAges:{妹妹:8}},allowed,[]),null);
 assert.equal(rememberedFamilyFollowup({family:{妹妹:true}},[1,6],[]),null,'Do not ask age without lesson 3');
});
test('a 20-turn multi-topic conversation stays coherent and never invents voice clips',()=>{
 const talk=[
  '你今天怎么样','晚上好你好吗','你好我是学生你呢',
  '他是学生吗','她是老师吗','他们是学生吗','她是谁',
  '你有三个吗','十后面是几','三十加二是多少',
  '你今天有空吗','你星期天有空吗','星期一后面是星期几',
  '现在是几月','这个月有多少天','下个月是几月',
  '你有爷爷吗','你有奶奶吗','你有弟弟和妹妹吗',
  '冬天天气怎么样','夏天天气怎么样'
 ];
 const answers=[],profile={family:{}};
 for(const [i,question] of talk.entries()){
  const result=answerLive(question,{allowed,topic:lookupExtendedQuestion(question).lesson,curriculum,date,turn:i,profile});
  assert.equal(result.kind,'question',question);
  assert(result.reply.ru&&result.reply.hanzi);
  if(result.reply.audioKey)assert(lookupPilotAudio(result.reply.audioKey));
  answers.push(result.reply.hanzi);
 }
 assert.equal(answers.length,21);
 assert(answers.some(x=>x.includes('十二月'))&&answers.some(x=>x.includes('二十九')===false));
 assert(answers.at(-1).includes('夏天'));
});
test('existing short mode intact and Non-Stop recognizes expanded family/weather questions',async()=>{
 const fixture=await liveDOM(6,{completed:['foundations','pronouns','numbers','weekdays','dates','family','weather']});
 try{
  const {el,send}=fixture;
  assert.equal(el('mode-short').getAttribute('aria-pressed'),'true');
  const panda=el('character').querySelector('img').src;
  el('mode-nonstop').click();assert.equal(el('mode-nonstop').getAttribute('aria-pressed'),'true');
  send('我有妹妹');
  assert(el('status').textContent.includes('запомнила'));
  send('你有爷爷吗？');
  assert.equal(el('phrase').textContent,'有，我有爷爷。');
  send('今天天气怎么样？');
  assert(el('phrase').textContent.includes('今天'));
  send('宇宙飞船在哪里');
  assert(el('status').textContent.includes('смысл')||el('status').textContent.includes('Точный'));
  assert.equal(el('character').querySelector('img').src,panda);
  el('mode-short').click();
  assert.equal(el('mode-short').getAttribute('aria-pressed'),'true');
  assert(el('phrase').textContent);
 }finally{fixture.close()}
});
