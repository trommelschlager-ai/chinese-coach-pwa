import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {coursePromptBank,pickCoursePrompt,courseCoverage} from '../assets/panda-hsk1-questions-v281.mjs';
import {recordedCoursePhrases,lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {answerLive,analyzeLearner} from '../assets/panda-live-dialogue-v272.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const c={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'),c);
const curriculum=c.window.PANDA_HSK1_FOUNDATIONS,date=new Date(2026,10,12,12),allowed=[1,2,3,4,5,6,7];
const strip=x=>String(x).replace(/[。！？?!，,\s]/g,'');

test('full course has playable recorded audio for all seven topics without a paid model',()=>{
 const phrases=recordedCoursePhrases();
 assert(phrases.length>=200);
 for(const x of ['我','你','我是老师','十','四十四','一百','星期五','今天','十一月','妈妈','妹妹','爷爷','天气','今天天气怎么样','明天下雨']){
  const sound=lookupPilotAudio(x);assert(sound?.startsWith('./assets/')&&sound.endsWith('.mp3'),x);
  assert(fs.existsSync(new URL('../'+sound,import.meta.url)),x+' actual asset');
 }
 assert.equal(lookupPilotAudio('宇宙飞船'),null);
});
test('all taught dialogue questions become actual Panda prompts from the curriculum',()=>{
 const coverage=courseCoverage(curriculum);
 assert.equal(coverage.length,7);
 for(const [i,topic] of curriculum.entries()){
  const pool=coursePromptBank(i+1,curriculum,date,{hasNumbers:true,family:{妹妹:true}});
  assert(pool.length>=6,'Topic '+(i+1)+' has too few distinct prompts');
  const normalized=new Set(pool.map(p=>strip(p.hanzi)));
  for(const line of topic.dialogue.filter(x=>/[?？]$/.test(x[1]))){
   assert(normalized.has(strip(line[1])),'Missing lesson question '+(i+1)+' '+line[1]);
  }
  assert(pool.every(p=>p.lesson===i+1));
  assert(pool.some(p=>p.audioKey&&lookupPilotAudio(p.audioKey)),'No real recorded voice for '+(i+1));
 }
 assert(coverage.reduce((total,x)=>total+x.prompts,0)>=65);
 assert(coverage.reduce((total,x)=>total+x.recorded,0)>=45);
});
test('Panda can ask, understand answers and respond across lessons with topic guard',()=>{
 for(const [lesson,question,answer] of [
 [1,'你好吗？','我很好'],[2,'你是老师吗？','我是学生'],
 [3,'你有几个？','我有两个'],[4,'今天星期几？','今天星期四'],
 [5,'今天几月几号？','今天十一月十二号'],
 [6,'你有妹妹吗？','我有妹妹'],[7,'明天下雨吗？','明天下雨']
 ]){
  const p=coursePromptBank(lesson,curriculum,date).find(x=>strip(x.hanzi)===strip(question));
  assert(p,'No prompt '+question);
  const result=answerLive(answer,{allowed,topic:lesson,prompt:p,curriculum,date,profile:{family:{}}});
  assert(['answer','question','statement'].includes(result.kind),question+': '+result.kind);
  assert(result.spoken?.known,'Translation unavailable for '+answer);
  assert(result.reply||result.kind==='statement','Panda cannot answer '+answer);
 }
 for(const [lesson,question] of [[2,'你是老师吗'],[3,'你几岁'],[4,'今天星期几'],[5,'今天几月几号'],[6,'你有妹妹吗'],[7,'今天天气怎么样']]){
  const r=answerLive(question,{allowed:[1],topic:1,curriculum,date});
  assert.equal(r.kind,'locked','Lesson '+lesson+' must not leak before study');
 }
 assert.equal(lookupPilotAudio('你星期几有空'),'./assets/lesson4-xiaoxiao-v265/022.mp3');
 assert.equal(answerLive('你星期几有空',{allowed,curriculum,date}).reply.hanzi,'我星期六有空。');
});
test('learner can repeat taught vocabulary and new questions cannot claim fabricated audio',()=>{
 const weather=coursePromptBank(7,curriculum,date),prompt=weather.find(p=>strip(p.hanzi)==='天气');
 assert(prompt&&prompt.intent==='repeat'&&prompt.audioKey);
 const answer=answerLive('天气',{allowed,topic:7,prompt,curriculum,date});
 assert.equal(answer.kind,'answer');
 assert(answer.spoken.known);
 const question=coursePromptBank(2,curriculum,date).find(p=>strip(p.hanzi)==='你叫什么名字');
 assert(question&&!question.audioKey,'Unrecorded question must be text-only');
});
test('mobile Panda changes topics after three prompts, while keeping same mascot and replay',async()=>{
 const f=await liveDOM(7,{completed:['foundations','pronouns','numbers','weekdays','dates','family','weather']});
 try{
  const {el,send}=f;
  assert(el('character').querySelector('img').src.includes('panda-live-original.webp'));
  el('mode-nonstop').click();
  assert(el('recent').textContent.includes('Панда'));
  const first=el('phrase').textContent;assert(first.length);
  for(let i=0;i<3;i++)el('next').click();
  assert(el('status').textContent.includes('Урок 1'),'After 3 prompts must use next completed chapter');
  send('晚上好');
  assert(el('recent').textContent.includes('晚上好'));
  assert.equal(el('mode-nonstop').getAttribute('aria-pressed'),'true');
 }finally{f.close()}
});
