import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {coursePromptBank,pickCoursePrompt,courseCoverage} from '../assets/panda-hsk1-questions-v281.mjs';
import {recordedCoursePhrases,lookupPilotAudio,lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {answerLive,analyzeLearner,topicPrompts} from '../assets/panda-live-dialogue-v272.mjs';
import {patternPrompts} from '../assets/panda-hsk1-patterns-v285.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
import {reviewedYouYouMeiyou} from '../assets/panda-youyoumeiyou-v416.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
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

test('Panda understands 你有没有 with real HSK1 family grammar and tone-marked pinyin',()=>{
 const questions=[
  ['你有没有妹妹？','Nǐ yǒu méiyǒu mèimei?','有，我有一个妹妹。'],
  ['你有没有哥哥？','Nǐ yǒu méiyǒu gēge?','有，我有一个哥哥。'],
  ['你有没有姐姐？','Nǐ yǒu méiyǒu jiějie?','没有，我没有姐姐。'],
  ['你有没有弟弟？','Nǐ yǒu méiyǒu dìdi?','没有，我没有弟弟。']
 ];
 for(const [question,pinyin,reply] of questions){
  const r=answerLive(question,{allowed:[1,4,6],topic:6,curriculum,date});
  assert.equal(r.kind,'question',question);
  assert.equal(r.lesson,6);
  assert.equal(r.spoken.pinyin,pinyin);
  assert.equal(r.reply.hanzi,reply);
  assert.equal(r.reply.audioKey,null,'No fabricated MP3 for new Panda reply');
  assert.equal(lookupPandaVoiceClip(question),null,'No invented question audio');
 }
});

test('Panda understands 有/没有 for time and corrects the extra 吗',()=>{
 for(const [input,expected] of [
  ['你有没有空？','有，我有空。'],
  ['你今天有没有空？','有，我今天有空。'],
  ['你明天有没有空？','有，我明天有空。'],
  ['你有没有时间？','有，我有时间。']
 ]){
  const r=answerLive(input,{allowed:[1,4],topic:4,curriculum,date});
  assert.equal(r.kind,'question');
  assert.equal(r.lesson,4);
  assert.equal(r.reply.hanzi,expected,input);
  assert.equal(r.reply.audioKey,null,'New phrase has no matching MP3');
 }
 const wrong=answerLive('你有没有妹妹吗？',{allowed:[1,6],topic:6,curriculum,date});
 assert.equal(wrong.kind,'correction');
 assert.equal(wrong.spoken.correction.hanzi,'你有没有妹妹？');
 assert.match(wrong.spoken.correction.why,/吗/);
 const incomplete=answerLive('你有没有',{allowed:[1],topic:1,curriculum,date});
 assert.equal(incomplete.kind,'clarify');
 assert.match(incomplete.message,/添加|добавь/i);
});

test('Panda accepts brief 有/没有 after 你有没有; unlocked lessons are respected',()=>{
 const prompt={hanzi:'你有没有妹妹？',lesson:6,intent:'have-or-not'};
 for(const [raw,pinyin] of [['有','Yǒu.'],['没有','Méiyǒu.']]){
  const result=answerLive(raw,{allowed:[1,6],topic:6,prompt,curriculum,date});
  assert.equal(result.kind,'answer');
  assert.equal(result.spoken.pinyin,pinyin);
  assert.equal(result.followup,null);
 }
 assert.equal(answerLive('你有没有妹妹？',{allowed:[1],topic:1,curriculum,date}).kind,'locked');
 assert.equal(answerLive('你今天有没有空？',{allowed:[1],topic:1,curriculum,date}).kind,'locked');
});

test('你有没有 questions appear as optional text-only prompts, never as recorded audio',()=>{
 const groups=availableAskGroups([1,4,6],curriculum,date);
 const family=groups.find(g=>g.lesson===6)?.questions||[];
 const days=groups.find(g=>g.lesson===4)?.questions||[];
 const hasFamily=family.find(q=>q.hanzi==='你有没有妹妹？');
 const hasTime=days.find(q=>q.hanzi==='你今天有没有空？');
 assert(hasFamily&&hasTime,'New reviewed questions must appear in the topic catalogue');
 assert.equal(hasFamily.pinyin,'Nǐ yǒu méiyǒu mèimei?');
 assert.equal(hasFamily.hasReplyAudio,false);
 assert.equal(hasTime.hasReplyAudio,false);
 assert(!availableAskGroups([1],curriculum,date).some(g=>g.lesson===4||g.lesson===6));
});

test('Panda understands full learner family statements with exact Russian translation',()=>{
 const question={hanzi:'你有没有妹妹？',lesson:6};
 const yes=answerLive('有，我有一个妹妹。',{allowed:[1,6],topic:6,prompt:question,curriculum,date});
 assert.equal(yes.kind,'answer');
 assert.equal(yes.spoken.translation,'Да, у меня одна младшая сестра.');
 assert.equal(yes.spoken.pinyin,'Yǒu, wǒ yǒu yí ge mèimei.');
 assert.equal(yes.reply.hanzi,'明白了。','Panda should acknowledge naturally, not say 谢谢');
 assert.equal(yes.reply.audioKey,null,'No invented MP3 for the new acknowledgement');
 const no=answerLive('没有，我没有妹妹。',{allowed:[1,6],topic:6,prompt:question,curriculum,date});
 assert.equal(no.kind,'answer');
 assert.equal(no.spoken.known,true);
 assert.equal(no.spoken.pinyin,'Méiyǒu, wǒ méiyǒu mèimei.');
 assert.equal(no.spoken.translation,'Нет, у меня нет младшей сестры.');
 assert.equal(no.reply.hanzi,'明白了。');
 const other=answerLive('没有，我没有妹妹',{allowed:[1,6],topic:6,prompt:{hanzi:'你有弟弟吗？',lesson:6},curriculum,date});
 assert.equal(other.kind,'clarify','Sister statement is not an answer about younger brother');
 assert.equal(other.spoken.translation,'Нет, у меня нет младшей сестры.');
 assert.match(other.message,/弟弟/);
 assert.equal(other.reply,undefined,'Do not thank or silently change the question');
 const bro=answerLive('有，我有一个哥哥。',{allowed:[1,6],topic:6,prompt:{hanzi:'你有没有哥哥？',lesson:6},curriculum,date});
 assert.equal(bro.spoken.pinyin,'Yǒu, wǒ yǒu yí ge gēge.');
 assert.equal(bro.spoken.translation,'Да, у меня один старший брат.');
 assert.equal(answerLive('没有，我没有妹妹。',{allowed:[1],topic:1,curriculum,date}).kind,'locked');
});

test('Family relative-age prompt rejects an answer about a different sibling',()=>{
 const prompt={hanzi:'你哥哥几岁？',pinyin:'Nǐ gēge jǐ suì?',ru:'Сколько лет твоему старшему брату?',lesson:6,intent:'relative-age',relative:'哥哥'};
 const options={allowed:[1,2,3,4,5,6],topic:6,prompt,curriculum,date};
 const other=answerLive('没有，我没有妹妹。',options);
 assert.equal(other.kind,'clarify','No age response because the learner refers to younger sister');
 assert.equal(other.spoken.translation,'Нет, у меня нет младшей сестры.');
 assert.match(other.message,/Панда спрашивала о возрасте старшего брата/);
 assert.equal(other.reply,undefined,'Do not generate 明白了 for an unrelated sibling answer');
 const notAge=answerLive('有，我有一个哥哥。',options);
 assert.equal(notAge.kind,'clarify','Existence alone does not answer how old the brother is');
 assert.match(notAge.message,/о возрасте старшего брата/);
 const absent=answerLive('没有，我没有哥哥。',options);
 assert.equal(absent.kind,'answer','No brother is a coherent answer to a mistaken age presupposition');
 assert.equal(absent.spoken.translation,'Нет, у меня нет старшего брата.');
 const contextual=topicPrompts(6,date,{family:{哥哥:true},hasNumbers:true});
 assert.equal(contextual.find(q=>q.hanzi==='你哥哥几岁？')?.ru,'Сколько лет твоему старшему брату?');
 const direct=answerLive('你哥哥几岁？',{allowed:[1,2,3,4,5,6],topic:6,curriculum,date});
 assert.equal(direct.spoken.translation,'Сколько лет твоему старшему брату?');
 const pattern=patternPrompts(6,date,[1,2,3,4,5,6]).find(q=>q.hanzi==='你哥哥几岁？');
 assert.equal(pattern?.ru,'Сколько лет твоему старшему брату?');
});

test('Panda does not echo a learner\'s sibling age question immediately after answering',()=>{
 const options={allowed:[1,2,3,4,5,6],topic:6,curriculum,date,turn:0,profile:{family:{哥哥:true},hasNumbers:true,recentQuestions:[]}};
 const r=answerLive('你哥哥几岁？',options);
 assert.equal(r.kind,'question');
 assert.equal(r.reply.hanzi,'我哥哥五岁。');
 assert.equal(r.reply.ru,'Моему старшему брату 5 лет.');
 assert.equal(r.followup,null,'No automatic identical question back to learner');
 const alternative=answerLive('你妹妹几岁？',options);
 assert.equal(alternative.followup,null,'Same anti-echo rule for younger sister');
 assert.equal(alternative.reply.ru,'Моей младшей сестре 1 год.');
 const noRepeated=answerLive('你有哥哥吗？',options);
 assert(!noRepeated.followup||noRepeated.followup.hanzi!=='你有哥哥吗？','No verbatim echo of a family question');
});
