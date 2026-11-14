'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {coachSentence,SENTENCE_COACH_FRAGMENTS}=await import('../assets/panda-sentence-coach-v319.mjs?v=319');
 const {answerLive}=await import('../assets/panda-live-dialogue-v272.mjs?v=319');
 const {lookupPilotAudio}=await import('../assets/panda-live-audio.mjs?v=307');
 const base={allowed:[1,2,3,4,5,6,7],topic:1,curriculum:[],profile:{},date:new Date(2026,10,13)};
 const pairs=[
 ['是学生','我是学生。','Wǒ shì xuésheng.',2],
 ['是老师','我是老师。','Wǒ shì lǎoshī.',2],
 ['不是学生','我不是学生。','Wǒ bú shì xuésheng.',2],
 ['不是老师','我不是老师。','Wǒ bú shì lǎoshī.',2],
 ['有哥哥','我有哥哥。','Wǒ yǒu gēge.',6],
 ['有姐姐','我有姐姐。','Wǒ yǒu jiějie.',6],
 ['有弟弟','我有弟弟。','Wǒ yǒu dìdi.',6],
 ['有妹妹','我有妹妹。','Wǒ yǒu mèimei.',6],
 ['没有哥哥','我没有哥哥。','Wǒ méiyǒu gēge.',6],
 ['没有姐姐','我没有姐姐。','Wǒ méiyǒu jiějie.',6],
 ['没有弟弟','我没有弟弟。','Wǒ méiyǒu dìdi.',6],
 ['没有妹妹','我没有妹妹。','Wǒ méiyǒu mèimei.',6],
 ['有一个哥哥','我有一个哥哥。','Wǒ yǒu yí ge gēge.',6],
 ['有一个妹妹','我有一个妹妹。','Wǒ yǒu yí ge mèimei.',6],
 ['很忙','我很忙。','Wǒ hěn máng.',1],
 ['不忙','我不忙。','Wǒ bù máng.',1],
 ['喜欢中文','我喜欢中文。','Wǒ xǐhuan Zhōngwén.',1]
 ];
 assert.equal(SENTENCE_COACH_FRAGMENTS.length,pairs.length);
 assert.equal(new Set(SENTENCE_COACH_FRAGMENTS).size,pairs.length);
 for(const [raw,full,py,lesson] of pairs){
  const r=answerLive(raw,{...base,topic:lesson});
  assert.equal(r.kind,'coaching',raw);
  assert.equal(r.lesson,lesson,raw);
  assert.equal(r.spoken.known,true,raw);
  assert.equal(r.spoken.hanzi,raw,raw);
  assert.equal(r.spoken.correction,undefined,'Valid phrase wrongly flagged '+raw);
  assert.equal(r.reply.hanzi,full,raw);
  assert.equal(r.reply.pinyin,py,raw);
  assert(r.reply.ru&&r.explanation.includes('правильная краткая фраза'),raw);
  assert(r.explanation.includes('我'),raw);
  assert.equal(r.followup,null);
  assert.equal(coachSentence(raw,{allowed:[1,2,3,4,5,6,7]}).reply.hanzi,full);
  assert.equal(coachSentence(raw,{allowed:[1,2,3,4,5,6,7]}).reply.audioKey,r.reply.audioKey);
  if(r.reply.audioKey){
   const file=lookupPilotAudio(r.reply.audioKey);
   assert(file,'Unknown MP3 was invented for '+raw);
   assert(fs.statSync(file.replace(/^\.\//,'')).size>1000,'Missing audio for '+raw);
  }
  assert.equal(coachSentence(raw,{allowed:[1]})?.kind||null,lesson===1?'coaching':null,'Unlocked topic leak '+raw);
 }
 assert.equal(answerLive('很忙',{...base,topic:1}).reply.audioKey,'我很忙');
 assert(lookupPilotAudio('我很忙').endsWith('/B04.mp3'));
 assert.equal(answerLive('不忙',{...base,topic:1}).reply.audioKey,'我不忙');
 assert(lookupPilotAudio('我不忙').endsWith('/B05.mp3'));
 assert.equal(answerLive('学习中文',{...base,topic:1}).reply.hanzi,'我学习中文。','Existing B02 teaching was overwritten');
 assert(lookupPilotAudio(answerLive('学习中文',{...base}).reply.audioKey).endsWith('/B02.mp3'));
 assert.equal(answerLive('我是忙',{...base}).kind,'correction','Existing true grammar error must still be corrected');
 assert.equal(answerLive('我不有妹妹',{...base}).kind,'correction','Do not break the earlier family error correction');
 assert.equal(coachSentence('我有妹妹',{allowed:base.allowed}),null,'Complete statement should not be simplified');
 assert.equal(coachSentence('我很忙',{allowed:base.allowed}),null,'Complete statement should not be simplified');
 assert.equal(coachSentence('学生',{allowed:base.allowed}),null,'Single word is not necessarily incomplete');
 assert.equal(coachSentence('爱好',{allowed:base.allowed}),null,'Draft HSK2 terms are not unlocked');
 assert.equal(coachSentence('因为我喜欢中文',{allowed:base.allowed}),null,'Do not normalize an already complete explanation');
 assert.equal(coachSentence('很冷',{allowed:base.allowed}),null,'Weather needs an explicit context');
 assert.equal(coachSentence('下雨',{allowed:base.allowed}),null,'Never invent the weather without context');
 const weatherPrompt={lesson:7,intent:'weather',time:'今天',hanzi:'今天天气怎么样？'};
 for(const [source,full,py] of [
  ['很冷','今天很冷。','Jīntiān hěn lěng.'],
  ['很热','今天很热。','Jīntiān hěn rè.'],
  ['下雨','今天下雨。','Jīntiān xià yǔ.'],
  ['下雪','今天下雪。','Jīntiān xià xuě.']
 ]){
  const r=coachSentence(source,{allowed:base.allowed,prompt:weatherPrompt});
  assert.equal(r.kind,'coaching');assert.equal(r.reply.hanzi,full);assert.equal(r.reply.pinyin,py);
  assert(r.explanation.includes('учебный пример, не прогноз'));
  assert.equal(coachSentence(source,{allowed:[1,2,6],prompt:weatherPrompt}),null);
 }
 assert.equal(coachSentence('下雨',{allowed:base.allowed,prompt:{...weatherPrompt,time:'明天',hanzi:'明天天气怎么样？'}}),null);
 for(const p of [
  './assets/panda-sentence-coach-v319.mjs?v=319',
  './assets/panda-live-dialogue-v272.mjs?v=323',
  './assets/panda-live-screen-v270.mjs?v=326',
  './assets/panda-hsk1-questions-v281.mjs?v=319',
  './panda-voice-pilot.html?v=323'
 ]) assert(JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8')).files.includes(p),p);
 assert(fs.readFileSync('panda-voice-pilot.html','utf8').includes('<span class="release">v326</span>'));
 console.log('PASS Panda sentence coach v319: 17 safe phrase expansions + 4 contextual weather prompts, audio B02/B04/B05 and old HSK1 preserved.');
})().catch(err=>{console.error(err);process.exitCode=1});
