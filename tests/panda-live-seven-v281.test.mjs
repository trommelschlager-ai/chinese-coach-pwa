import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {coursePromptBank,pickCoursePrompt,courseCoverage} from '../assets/panda-hsk1-questions-v281.mjs';
import {recordedCoursePhrases,lookupPilotAudio,lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {answerLive,analyzeLearner} from '../assets/panda-live-dialogue-v272.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const c={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'),c);
const curriculum=c.window.PANDA_HSK1_FOUNDATIONS,date=new Date(2026,10,12,12),allowed=[1,2,3,4,5,6,7];
const strip=x=>String(x).replace(/[。！？?!，,\s]/g,'');

test('Panda has only its approved recordings; lesson audio remains separate',()=>{
 const phrases=recordedCoursePhrases();
 assert(phrases.length>=200,'The lesson voice corpus must not be lost');
 for(const x of ['你好','谢谢','你是老师吗','你几岁','今天星期几','今天几月几号','你有哥哥吗','今天天气怎么样']){
  const sound=lookupPilotAudio(x);
  assert(sound?.startsWith('./assets/')&&sound.endsWith('.mp3'),'Approved Panda clip missing: '+x);
  assert(fs.existsSync(new URL('../'+sound,import.meta.url)),x+' actual asset');
 }
 for(const word of ['我','你','天气','宇宙飞船']){
  assert.equal(lookupPilotAudio(word),null,'Never switch Panda to a separate HSK1 lesson narrator: '+word);
 }
 // New v411 clip p163 is user-provided Panda speech, NOT the lesson 4 Xiaoxiao narrator.
 const verified=lookupPandaVoiceClip('你星期几有空？');
 assert.equal(verified?.src,'./assets/panda-voice-clips-v411/p163.mp3');
 assert.equal(verified?.source,'user-luvvoice-nov16-cut');
 assert(fs.existsSync(new URL('../'+verified.src,import.meta.url)),'New Panda voice clip is missing');
 assert(!verified.src.includes('lesson4-xiaoxiao'),'Panda cannot borrow separate lesson audio');
});
test('all taught dialogue questions become actual Panda prompts from the curriculum',()=>{
 const coverage=courseCoverage(curriculum);
 assert.equal(coverage.length,7);
 for(const [i,topic] of curriculum.entries()){
  const pool=coursePromptBank(i+1,curriculum,date,{hasNumbers:true,family:{妹妹:true}});
  assert(pool.length>=1,'Topic '+(i+1)+' has no reviewed prompts');
  const normalized=new Set(pool.map(p=>strip(p.hanzi)));
  for(const line of topic.dialogue.filter(x=>/[?？]$/.test(x[1]))){
   assert(normalized.has(strip(line[1])),'Missing lesson question '+(i+1)+' '+line[1]);
  }
  assert(pool.every(p=>p.lesson===i+1));
  assert(pool.every(p=>!p.audioKey||!!lookupPilotAudio(p.audioKey)),'A prompt claims a non-existent Panda voice recording for '+(i+1));
 }
 assert(coverage.reduce((total,x)=>total+x.prompts,0)>0,'The lesson bank must include real reviewed prompts');
 assert(coverage.every(x=>x.recorded<=x.prompts),'Recording coverage cannot exceed the real question bank');
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
 assert.equal(lookupPilotAudio('你星期几有空'),'./assets/panda-voice-clips-v411/p163.mp3','Use the exact newly approved Panda clip, not the HSK1 narrator');
 assert.equal(answerLive('你星期几有空',{allowed,curriculum,date}).reply.hanzi,'我星期六有空。');
});
test('learner can repeat taught vocabulary and new questions cannot claim fabricated audio',()=>{
 const weather=coursePromptBank(7,curriculum,date);
 assert(weather.length>0,'Weather still offers reviewed dialogue prompts');
 assert(!weather.some(p=>p.intent==='repeat'&&!lookupPilotAudio(p.audioKey)),'No invented standalone word voice in repeat prompts');
 assert.equal(lookupPilotAudio('天气'),null,'A standalone lesson word cannot claim the Panda narrator');
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
