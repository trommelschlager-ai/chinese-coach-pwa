'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
 const env={window:{}};vm.runInNewContext(fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8'),env);
 const curriculum=env.window.PANDA_HSK1_FOUNDATIONS;
 const {brainLexicon,brainCoverage,brainQuestion,interpretBrainSentence}=await import('../assets/panda-brain-hsk1-v302.mjs?v=302');
 const {answerLive,analyzeLearner}=await import('../assets/panda-live-dialogue-v272.mjs?v=302');
 const {answerCurriculumQuestion}=await import('../assets/panda-curriculum-tutor.mjs?v=302');
 const {lookupPilotAudio}=await import('../assets/panda-live-audio.mjs?v=live6');
 const allowed=[1,2,3,4,5,6,7],date=new Date(2026,10,13,12,0,0);
 const lex=brainLexicon(curriculum),cov=brainCoverage(curriculum);
 assert.equal(cov.entries,86,'Every original lesson vocabulary entry must be retained');
 assert.equal(cov.unique,80,'There are 80 distinct HSK1 words in 86 entries');
 assert.equal(cov.categories,21,'Each entry needs a grammatical category');
 assert.equal(cov.examples,80,'Every distinct word needs a curated example');
 assert.deepEqual(Array.from(cov.byLesson),[9,12,12,12,18,11,12]);
 assert.deepEqual(Array.from(lex.get('学生').sourceLessons),[1,2]);
 const toneWords={
  '你好':[3,3],'一个':[2,0],'学生':[2,0],'妹妹':[4,0],'吗':[0],
  '妈妈':[1,0],'我的':[3,0],'星期一':[1,1,1],
  '二月':[4,4],'没有':[2,3]
 };
 for(const [word,tones] of Object.entries(toneWords))
  assert.deepEqual(lex.get(word).tones,tones,'Incorrect syllable tones: '+word);
 assert(lex.get('你好').toneNote.includes('ní hǎo'),'Third-tone sandhi must be explained');
 assert(lex.get('一个').toneNote.includes('yí ge'),'One + classifier sandhi must be explained');
 assert(lex.get('一').toneNote.includes('yì'),'One + third-tone before hundred must be explained');
 assert(lex.get('是').toneNote.includes('bú'),'Negative 不 changes tone before 是');
 let allWords=0,examples=0,oldAudio=0;
 for(const [word,entry] of lex){
  assert(entry.word===word,'Lexicon word key mismatch '+word);
  assert(entry.pinyin&&(/[\u00e0-\u01dc]/.test(entry.pinyin)||word==='吗'&&entry.pinyin==='ma'),'Source pinyin missing tones: '+word);
  assert(entry.translation&&entry.category&&entry.tones.length,'Incomplete word metadata '+word);
  assert(entry.example.hanzi.includes(word),'Example does not use target word '+word);
  assert(entry.example.pinyin&&entry.example.ru,'Example lacks tone pinyin or Russian '+word);
  const source=curriculum.flatMap(t=>t.words||[]).find(w=>w[0]===word);
  assert.equal(entry.pinyin,source[1],'Must preserve original reviewed pinyin for '+word);
  assert.equal(entry.translation,source[2],'Must preserve original word meanings '+word);
  assert(entry.sourceLessons.length>=1&&entry.sourceLessons.every(n=>n>=1&&n<=7));
  if(entry.audioKey){oldAudio++;assert(lookupPilotAudio(entry.audioKey),'Do not invent audio for '+word)}
  if(entry.example.audioKey)assert(lookupPilotAudio(entry.example.audioKey),'No synthesized sample MP3 '+word);
  const r=brainQuestion(word+'是什么意思？',allowed,curriculum);
  assert.equal(r?.kind,'explanation',word+' cannot answer a basic meaning question');
  assert.equal(r.lesson,entry.sourceLessons[0]);
  assert.equal(r.reply.hanzi,word);
  assert.equal(r.reply.pinyin,entry.pinyin);
  assert(r.explanation.includes(entry.category)&&r.explanation.includes(entry.example.hanzi));
  const example=brainQuestion('用'+word+'造句',allowed,curriculum);
  assert.equal(example?.kind,'explanation','Cannot make reviewed example for '+word);
  assert.equal(example.reply.hanzi,entry.example.hanzi);
  assert.equal(example.reply.pinyin,entry.example.pinyin);
  examples++;allWords++;
 }
 assert.equal(allWords,80);
 assert.equal(examples,80);
 const chinese=[
  ['妹妹是什么意思？',6,'妹妹','младшая сестра'],
  ['请问一个怎么读？',6,'一个','один'],
  ['学生的声调是什么？',1,'学生','студент'],
  ['你好是什么词？',1,'你好','привет'],
  ['你是第几课的词？',1,'你','ты'],
  ['用春天造句',7,'春天天气很好。','хорошая'],
  ['用木造句',1,'木','Дерево'],
  ['二月怎么用？',5,'二月五号','февраля']
 ];
 const russian=[
  ['Что значит 妈妈?',6,'妈妈'],['Какие тоны у 一个?',6,'一个'],
  ['Составь предложение с 老师',2,'我是老师。'],
  ['Как читается 天气?',7,'天气'],['Часть речи 星期三?',4,'星期三']
 ];
 for(const [q,lesson,zh,ru] of chinese){
  const r=answerLive(q,{allowed,topic:lesson,curriculum,date,profile:{recentQuestions:[]}});
  assert.equal(r.kind,'explanation','Panda failed direct Chinese word question '+q);
  assert.equal(r.lesson,lesson,'Incorrect lesson '+q);
  assert.equal(r.reply.hanzi,zh,'Incorrect Panda answer '+q);
  assert(r.explanation.includes(ru),'Missing meaning/explanation '+q);
  assert(r.followup?.lesson===lesson,'Missing same-topic prompt '+q);
  assert(r.spoken?.known&&r.spoken.hanzi===q,'Original learner question lost '+q);
  if(r.reply.audioKey)assert(lookupPilotAudio(r.reply.audioKey));
 }
 for(const [q,lesson,zh] of russian){
  const r=answerLive(q,{allowed,topic:lesson,curriculum,date,profile:{}});
  assert.equal(r.kind,'explanation',q);
  assert.equal(r.reply.hanzi,zh,q);
 }
 const locked=answerLive('妹妹是什么意思？',{allowed:[1,2],topic:1,curriculum,date,profile:{}});
 assert.equal(locked.kind,'clarify','Cannot leak locked lesson family meaning');
 assert(!locked.reply,'No answer from locked chapter');
 const unknown=answerLive('水是什么意思？',{allowed,topic:7,curriculum,date,profile:{}});
 assert.equal(unknown.kind,'clarify','Do not invent words absent from user curriculum');
 assert(!unknown.reply);
 const teacher=answerCurriculumQuestion('Как читается 老师?',2,curriculum);
 assert(teacher.includes('lǎoshī')&&teacher.includes('существительное'));
 assert(answerCurriculumQuestion('Как читается 妈妈?',2,curriculum).includes('нет проверенного ответа'));
 const compositions=[
  ['他有姐姐',6,'Tā yǒu jiějie','У него есть старшая сестра'],
  ['我有两个妹妹',6,'Wǒ yǒu liǎng ge mèimei','У меня'],
  ['我的妈妈是老师',6,'Wǒ de māma shì lǎoshī','Моя мама'],
  ['今天是晴天',7,'Jīntiān shì qíngtiān','учебное описание']
 ];
 for(const [q,lesson,pinyin,translation] of compositions){
  const studied=interpretBrainSentence(q,allowed,curriculum);
  assert(studied?.known&&studied.topic===lesson,'Missing basic compositional HSK1 grammar: '+q);
  assert(studied.pinyin.startsWith(pinyin),'Incorrect composed tones: '+q+' -> '+studied.pinyin);
  assert(studied.translation.includes(translation),q+' wrong translation: '+studied.translation);
  const understood=analyzeLearner(q,allowed,null,curriculum);
  assert(understood.known&&understood.translation,'Panda fails composed student phrase '+q);
  const answered=answerLive(q,{allowed,topic:lesson,curriculum,date,profile:{}});
  assert(['statement','answer','question'].includes(answered.kind),q+' not processed');
  assert(answered.reply||answered.message,'Panda has no response '+q);
 }
 assert.equal(interpretBrainSentence('我有二个妹妹',allowed,curriculum),null,'Reject ungrammatical 二个');
 assert.equal(interpretBrainSentence('我不有妹妹',allowed,curriculum),null,'Do not validate 不有');
 assert.equal(interpretBrainSentence('我有两个妹妹',[1,2,6],curriculum),null,'Lesson 3 numbers must be unlocked');
 assert.equal(interpretBrainSentence('我有两个妹妹',[1,2,3],curriculum),null,'Lesson 6 family must be unlocked');
 assert.equal(interpretBrainSentence('今天是晴天',[1,2,3,4,5],curriculum),null,'Lesson 7 weather locked');
 const correction=answerLive('我不有妹妹',{allowed,topic:6,curriculum,date,profile:{}});
 assert.equal(correction.kind,'correction','Keep trusted v301 correction behaviour');
 const forecast=answerLive('北京现在天气怎么样',{allowed,topic:7,curriculum,date,profile:{}});
 assert(!forecast.reply,'Do not fake realtime weather');
 const html=fs.readFileSync('panda-voice-pilot.html','utf8');
 assert(/panda-live-screen-v270\.mjs\?v=(?:30[24567]|318|319|323)/.test(html),'Live screen must use v302');
 for(const sel of ['id="mode-short"','id="mode-nonstop"','id="mic"','id="history-dialog"','id="speech-dialog"'])
  assert(html.includes(sel),'Do not break existing layout and controls: '+sel);
 const media=fs.readFileSync('assets/panda-live-audio.mjs','utf8');
 assert(media.includes('lookupHsk1Voice'),'Keep existing approved voices');
 const brain=fs.readFileSync('assets/panda-brain-hsk1-v302.mjs','utf8');
 assert(!/\bfetch\s*\(|speechSynthesis|new Audio\s*\(|openai|api[_-]?key/i.test(brain),'Brain must not invent audio or use external APIs');
 console.log('PASS Panda Brain v302: '+cov.entries+' source vocabulary entries / '+cov.unique+' unique words, '+
 cov.categories+' grammatical categories, '+examples+' reviewed examples, '+oldAudio+' existing word audio links, '+
 (chinese.length+russian.length)+' question styles, '+compositions.length+' composed sentences, lesson locks, tone sandhi, audio & UI preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
