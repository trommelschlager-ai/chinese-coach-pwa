'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
 const env={window:{}};vm.runInNewContext(fs.readFileSync('assets/hsk1-foundations-data-v152.js','utf8'),env);
 const curriculum=env.window.PANDA_HSK1_FOUNDATIONS;
 const {answerLive,analyzeLearner}=await import('../assets/panda-live-dialogue-v272.mjs?v=301');
 const {questionVariant,learnerAnswerVariant,VARIANT_TOPIC_COUNTS}=await import('../assets/panda-hsk1-variants-v301.mjs?v=301');
 const {lookupPilotAudio}=await import('../assets/panda-live-audio.mjs?v=live6');
 const allowed=[1,2,3,4,5,6,7],date=new Date(2026,10,13,12,0,0);
 assert.equal(curriculum.length,7);
 const samples=[
  [1,'你怎么样','很好！'],
  [1,'你今天好吗','很好！'],
  [1,'最近好吗','很好！'],
  [1,'那你呢','很好！'],
  [2,'你叫啥名字','我叫Panda。'],
  [2,'你的名字是什么','我叫Panda。'],
  [2,'你到底是谁','我是老师。'],
  [2,'你是老师还是学生','我是老师。'],
  [2,'你是不是学生','不是，我是老师。'],
  [3,'你今年几岁','我三岁。'],
  [3,'你多大年纪','我三岁。'],
  [3,'十后面是什么数字','十一。'],
  [3,'二十前面是什么数','十九。'],
  [4,'今天周几','今天星期五。'],
  [4,'明天礼拜几','明天星期六。'],
  [4,'昨天是周几','昨天星期四。'],
  [4,'今天是周五吗','是，今天星期五。'],
  [4,'今天礼拜六吗','不是，今天星期五。'],
  [4,'你礼拜几有空','我星期六有空。'],
  [5,'今天日期是多少','今天十一月十三号。'],
  [5,'今天是几月几号呀','今天十一月十三号。'],
  [5,'明天几月几日呢','明天十一月十四号。'],
  [5,'现在是几月份','现在十一月。'],
  [6,'你有没有哥哥','我有一个哥哥。'],
  [6,'你有没有姐姐','我没有姐姐。'],
  [6,'你家有多少人','我家有五口人。'],
  [6,'你家里有几个人','我家有五口人。'],
  [6,'你妹妹今年几岁','我妹妹一岁。'],
  [6,'你有多少个弟弟','我没有弟弟。'],
  [7,'今天的天气如何','今天很冷。'],
  [7,'今天天气怎么样呀','今天很冷。'],
  [7,'今天冷不冷','今天很冷。'],
  [7,'明天会不会下雨呢','明天下雨。'],
  [7,'冬天的天气怎么样','冬天很冷。']
 ];
 let passed=0;
 const checks={byLesson:Object.fromEntries(allowed.map(n=>[n,0])),noFakeAudio:0,followups:0};
 for(const [lesson,input,expected] of samples){
  const r=answerLive(input,{allowed,topic:lesson,curriculum,date,profile:{recentQuestions:[]}});
  assert.equal(r.kind,'question',input+' should be a question, got '+r.kind+' '+(r.message||''));
  assert.equal(r.lesson,lesson,input+' mapped to wrong lesson');
  assert.equal(r.reply?.hanzi,expected,input+' wrong reply '+r.reply?.hanzi);
  assert.equal(r.spoken?.hanzi,input,'Original learner utterance must remain visible '+input);
  assert(r.followup&&r.followup.lesson===lesson,input+' must generate a related same-topic follow-up');
  assert(r.followup?.verifiedLines?.[1]?.accepted,'Follow-up must have tested accepted answers: '+input);
  if(!lookupPilotAudio(r.reply.hanzi))assert.equal(r.reply.audioKey,null,'Unrecorded reply must not claim sound: '+input);
  passed++;checks.byLesson[lesson]++;checks.followups++;
 }
 assert(samples.length>=35);
 const locked=answerLive('你有没有妹妹',{allowed:[1,2],topic:1,curriculum,date,profile:{}});
 assert.equal(locked.kind,'locked','Learner must not obtain locked-lesson answers via alias');
 assert(!locked.reply,'Locked topic must have no panda reply');
 const realWeather=answerLive('北京现在天气怎么样',{allowed,topic:7,curriculum,date,profile:{}});
 assert.notEqual(realWeather.kind,'question','Must not fabricate realtime forecast');
 assert(!realWeather.reply,'Must not fabricate a weather reply for real location');
 const typo=answerLive('我不有妹妹',{allowed,topic:6,curriculum,date,profile:{}});
 assert.equal(typo.kind,'correction','Keep correction of 不有 to 没有');
 assert(typo.spoken?.correction?.hanzi.includes('我没有妹妹'));
 const agePrompt={intent:'age',lesson:3,hanzi:'你几岁？',accepted:['我四十四岁']};
 const age=answerLive('我今年四十四岁',{allowed,topic:3,prompt:agePrompt,curriculum,date,profile:{}});
 assert(['answer','statement'].includes(age.kind)&&age.spoken?.known,'Current-year age variant must be understood');
 assert.equal(age.spoken.hanzi,'我今年四十四岁');
 assert.equal(age.spoken.translation,'Мне 44 года.');
 const namePrompt={intent:'name',lesson:2,hanzi:'你叫什么名字？',accepted:['我叫小明']};
 const name=answerLive('我的名字叫小明',{allowed,topic:2,prompt:namePrompt,curriculum,date,profile:{}});
 assert(['answer','statement'].includes(name.kind)&&name.spoken?.known,'Name variant must be understood');
 assert.equal(name.spoken.hanzi,'我的名字叫小明');
 assert(name.spoken.translation.includes('Сяомин'));
 const weather=answerLive('今天天气是很冷',{allowed,topic:7,curriculum,date,profile:{}});
 assert.equal(weather.kind,'correction','Do not silently normalize malformed Chinese weather sentence');
 assert(questionVariant('你有妹妹')===null,'Plain statement must not be rewritten as a question');
 assert(learnerAnswerVariant('我今年四十四岁',null)===null,'Do not normalize student sentences without a relevant prompt');
 const mediaBefore=fs.readFileSync('assets/panda-live-audio.mjs','utf8');
 assert(mediaBefore.includes('lookupHsk1Voice'));
 assert(!/fetch\(/.test(fs.readFileSync('assets/panda-hsk1-variants-v301.mjs','utf8')),'Variant expansion must remain local/offline');
 const html=fs.readFileSync('panda-voice-pilot.html','utf8');
 assert(html.includes('panda-live-screen-v270.mjs?v=301'),'Panda conversation page must load new version');
 assert(html.includes('id="mode-short"')&&html.includes('id="mode-nonstop"')&&html.includes('id="mic"'));
 assert(html.includes('id="history-dialog"')&&html.includes('id="speech-dialog"'));
 console.log('PASS Panda HSK1 v301 '+passed+'/'+samples.length+' checked question variants across all 7 lessons; '
  +checks.followups+' contextual follow-ups, locked lessons, real weather caution, grammar corrections, original transcript and MP3 mapping preserved; '
  +JSON.stringify({samples:checks.byLesson,aliasCounts:VARIANT_TOPIC_COUNTS}));
})().catch(error=>{console.error(error);process.exitCode=1});
