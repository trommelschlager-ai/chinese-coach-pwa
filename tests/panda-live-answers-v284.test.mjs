import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {extendedQuestions,extensionPrompts,extensionAnswer} from '../assets/panda-hsk1-extensions-v282.mjs';
import {VERIFIED_EXTENSION_RESPONSES,recognizeApprovedPhrase,checkedExtensionReply} from '../assets/panda-hsk1-answerbank-v284.mjs';
import {answerLive,analyzeLearner} from '../assets/panda-live-dialogue-v272.mjs';
import {coursePromptBank} from '../assets/panda-hsk1-questions-v281.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'),sandbox);
const curriculum=sandbox.window.PANDA_HSK1_FOUNDATIONS,allowed=[1,2,3,4,5,6,7],date=new Date(2026,10,12,12);
const norm=s=>String(s).replace(/[。！？，?!\s]/g,'');
test('29 known Panda questions have student answers, each accepted sample is recognized and translated',()=>{
 let covered=0;
 for(const q of extendedQuestions()){
  if(!q.accepted.length)continue;
  const prompt={hanzi:q.hanzi,lesson:q.lesson,intent:'extension',accepted:q.accepted,
   options:[],instruction:'Ответь по теме'};
  prompt.verifiedLines=[{},prompt];
  for(const candidate of q.accepted){
   const result=answerLive(candidate,{allowed,topic:q.lesson,prompt,curriculum,date,turn:1,profile:{family:{}}});
   assert.equal(result.kind,'answer',q.hanzi+' => '+candidate+' is '+result.kind);
   assert(result.spoken?.known,q.hanzi+' => '+candidate);
   assert(result.spoken?.translation,q.hanzi+' => '+candidate+' untranslated');
   assert(result.spoken?.pinyin,q.hanzi+' => '+candidate+' lacks tones');
   assert.equal(result.reply?.hanzi,'很好！',q.hanzi+' => '+candidate);
   covered++;
  }
 }
 assert(covered>=33,'Fewer than 33 approved answer variants tested: '+covered);
});
test('new automatic Panda questions can be answered, including actual month on the device',()=>{
 const qs=extendedQuestions();
 for(let lesson=1;lesson<=7;lesson++){
  const exercises=extensionPrompts(lesson,date);
  assert(exercises.length>0,lesson+' has no practice prompts');
  for(const prompt of exercises){
   assert(prompt.accepted.length>0,prompt.hanzi+' missing an approved answer');
   assert(coursePromptBank(lesson,curriculum,date).find(p=>norm(p.hanzi)===norm(prompt.hanzi)),prompt.hanzi+' missing from actual course');
   const sample=prompt.accepted[0],r=answerLive(sample,{allowed,topic:lesson,prompt,curriculum,date});
   assert.equal(r.kind,'answer',prompt.hanzi+': '+sample+' -> '+r.kind);
   assert(r.spoken?.pinyin&&r.spoken?.translation,prompt.hanzi+' no Chinese/Russian translation');
   if(r.reply.audioKey)assert(lookupPilotAudio(r.reply.audioKey));
  }
 }
 const other=extensionPrompts(5,new Date(2026,11,31)).find(p=>p.hanzi==='现在是几月？');
 assert.equal(answerLive('现在是十二月',{allowed,topic:5,prompt:other,curriculum,date:new Date(2027,0,1)}).kind,'answer',
  'Date must be anchored to the question, not current clock at answer time');
 assert.notEqual(answerLive('现在是十一月',{allowed,topic:5,prompt:other,curriculum,date:new Date(2026,11,31)}).kind,'answer');
});
test('freely spoken reviewed sentences have Russian translation and toned pinyin',()=>{
 for(const [sentence,meaning] of [
  ['晚上好，我很好','Добрый вечер! У меня всё хорошо.'],
  ['不是，她是学生','Нет, она студентка.'],
  ['现在不下雨','Сейчас дождь не идёт.'],
  ['今天没有风','Сегодня нет ветра.'],
  ['我星期六去看电影','В субботу я пойду в кино.'],
  ['有，我有爷爷','Да, у меня есть дедушка по отцу.']
 ]){
  const a=analyzeLearner(sentence,allowed,null,curriculum);
  assert(a.known&&a.translation===meaning,sentence+' meaning '+a.translation);
  assert(a.pinyin&&/[àáǎāèéěēìíǐīòóǒōùúǔū]/.test(a.pinyin),sentence+' missing tone marks');
 }
});
test('guard against unstudied topics, arbitrary hallucinated translations and incorrect answers',()=>{
 assert.equal(recognizeApprovedPhrase('现在不下雨',[1]),null);
 assert.equal(checkedExtensionReply('不是她是学生',{hanzi:'她是老师吗？',intent:'extension',lesson:2,accepted:['不是她是学生']},[1],date),null);
 const p=extensionPrompts(2,date).find(p=>p.hanzi==='她是老师吗？');
 assert.notEqual(answerLive('我有两个',{allowed,topic:2,prompt:p,curriculum,date}).kind,'answer');
 assert(!analyzeLearner('宇宙飞船在哪里',allowed,null,curriculum).known);
 assert.equal(lookupPilotAudio('你叫什么名字'),null);
 assert(VERIFIED_EXTENSION_RESPONSES.length>=35);
});
test('every new question asked by student still has grounded reply, no manufactured MP3',()=>{
 for(const q of extendedQuestions()){
  const r=answerLive(q.hanzi,{allowed,topic:q.lesson,curriculum,date});
  assert.equal(r.kind,'question',q.hanzi);
  assert(r.spoken.known&&r.spoken.translation&&r.spoken.pinyin);
  assert(r.reply.hanzi&&r.reply.ru&&r.reply.pinyin);
  if(r.reply.audioKey)assert(lookupPilotAudio(r.reply.audioKey),q.hanzi);
 }
});
