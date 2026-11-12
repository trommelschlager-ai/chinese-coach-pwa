import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {answerLive,analyzeLearner,topicPrompts,calendarReply,nextTopicPrompt} from '../assets/panda-live-dialogue-v272.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const c={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../assets/hsk1-foundations-data-v152.js',import.meta.url),'utf8'),c);const curriculum=c.window.PANDA_HSK1_FOUNDATIONS;
const date=new Date(2026,10,12,12),allowed=[1,2,3,4,5,6,7],options={allowed,curriculum,date};
test('questions in seven topics have actual replies and stay inside curriculum scope',()=>{
 for(const [q,zh,topic] of [['你好','你好！',1],['你叫什么名字','我叫Panda。',2],['你是老师吗','我是老师。',2],['你几岁','我三岁。',3],['今天星期几','今天星期四。',4],['明天星期几','明天星期五。',4],['昨天星期几','昨天星期三。',4],['今天几月几号','今天十一月十二号。',5],['你有妹妹吗','我有一个妹妹。',6],['你家有几口人','我家有五口人。',6],['今天天气怎么样','今天很冷。',7],['明天下雨吗','明天下雨。',7]]){
  const r=answerLive(q,options);assert.equal(r.kind,'question',q);assert.equal(r.reply.hanzi,zh,q);assert.equal(r.lesson,topic);assert(r.spoken.known);assert(r.spoken.translation);
  if(topic>1){const locked=answerLive(q,{...options,allowed:[1]});assert.equal(locked.kind,'locked',q);assert(!locked.reply)}
 }
 for(const q of ['今天天气怎么样','明天下雨吗'])assert(answerLive(q,options).reply.context.includes('не настоящий прогноз'));
 assert.equal(answerLive('你多大了',options).spoken.pinyin,'Nǐ duō dà le?');
 assert.equal(answerLive('今天的天气怎么样',options).spoken.pinyin,'Jīntiān de tiānqì zěnmeyàng?');
 assert.equal(answerLive('今天是几月几日',options).spoken.pinyin,'Jīntiān shì jǐ yuè jǐ rì?');
 assert.equal(answerLive('Погода в Москве сейчас',options).kind,'clarify');
});
test('all curriculum words, dialogue lines and rule examples can be translated',()=>{
 for(const [i,topic] of curriculum.entries())for(const [zh,py,ru] of [...topic.words,...topic.dialogue.map(x=>[x[1],x[2],x[3]]),...topic.rules.map(x=>[x[2],x[3],x[4]])]){const r=analyzeLearner(zh,allowed,{lesson:i+1},curriculum);assert(r.known||r.correction,zh);assert(r.translation||r.probable,zh);assert(r.pinyin||r.correction?.pinyin,zh)}
});
test('word, number and grammar explanations use studied course material',()=>{
 for(const q of ['妹妹是什么意思','23怎么说','Объясни грамматику','Что означает 下雨?']){const r=answerLive(q,{...options,topic:6});assert.equal(r.kind,'explanation',q);assert(r.explanation);assert(r.reply)}
 assert.equal(answerLive('妹妹是什么意思',{...options,allowed:[1],topic:1}).kind,'clarify');
});
test('grammar translations handle age, roles, family, dates and weather without inventing unknown text',()=>{
 for(const zh of ['我四十四岁','我44岁','我们是学生','她不是老师','我有妹妹','我有弟弟和妹妹','我没有哥哥，我有妹妹','我家有三口人','明天星期五','今天是十一月十二号','今天下雪','冬天很冷']){const r=analyzeLearner(zh,allowed,null,curriculum);assert(r.known,zh);assert(r.translation,zh);assert(r.pinyin,zh)}
 const unknown=analyzeLearner('我妹妹有',allowed,null,curriculum);assert(!unknown.known);assert.equal(unknown.translation,null);assert(unknown.words.some(w=>w[0]==='妹妹'));
 assert(!analyzeLearner('宇宙飞船在哪里',allowed,null,curriculum).known);
 assert(!analyzeLearner('我44岁',[1],null,curriculum).known);
});
test('short calendar questions and family counts have verified answers',()=>{
 for(const [q,answer] of [['今天几号','今天十一月十二号。'],['今天星期五吗','今天星期四。'],['现在几月','现在十一月。'],['今年几几年','今年二零二六年。'],['你有几个妹妹','我有一个妹妹。']]){assert.equal(answerLive(q,options).reply.hanzi,answer,q)}
 assert.equal(answerLive('你妹妹几岁',options).reply.hanzi,'我妹妹一岁。');
 assert.equal(answerLive('你妹妹几岁',{...options,allowed:[1,6]}).kind,'locked');
 assert(analyzeLearner('2026年11月12日',allowed,null,curriculum).known);assert(!analyzeLearner('2026年2月29日',allowed,null,curriculum).known);
 assert(analyzeLearner('今天不下雨',allowed,null,curriculum).known);
});
test('errors retain the original and label probable meaning, correction and written tone issues',()=>{
 for(const [raw,fixed] of [['我不有妹妹','我没有妹妹。'],['今天是很冷','今天很冷。'],['我是二十五岁','我二十五岁。'],['今天星期七','今天星期天。'],['我是忙','我很忙。']]){const r=answerLive(raw,options);assert.equal(r.kind,'correction',raw);assert.equal(r.spoken.hanzi,raw);assert.equal(r.spoken.translation,null);assert(r.spoken.probable);assert.equal(r.spoken.correction.hanzi,fixed);assert(r.spoken.correction.pinyin);assert(!r.followup)}
 const py=analyzeLearner('wo shi laoshi',allowed,null,curriculum);assert(py.correction);assert(py.correction.why.includes('написанном пиньине'));
 assert(!analyzeLearner('我妹妹不',allowed,null,curriculum).correction);
});
test('follow-up prompts are contextual, valid and calendar-aware across rollover',()=>{
 for(const topic of allowed){const prompts=topicPrompts(topic,date,{hasNumbers:true,family:{妹妹:true}});assert(prompts.length);const p=prompts[0];const sample=p.accepted[0];const r=answerLive(sample,{...options,topic,prompt:p});assert(r.reply||r.kind==='question',topic+': '+sample);if(r.kind!=='question')assert(r.followup,topic+': '+sample)}
 const teacher=topicPrompts(2,date)[0];assert(!answerLive('他是老师',{...options,prompt:teacher,topic:2}).reply);assert.equal(answerLive('我没有哥哥，我有哥哥',options).kind,'clarify');
 const p=topicPrompts(6,date)[0];assert(!answerLive('我有妹妹',{...options,topic:6,prompt:p}).reply);
 const reply=answerLive('我有妹妹',{...options,topic:6,profile:{hasNumbers:true}});assert.equal(reply.followup.hanzi,'你妹妹几岁？');
 const first=nextTopicPrompt(7,[],date);assert.notEqual(nextTopicPrompt(7,[first.hanzi],date).hanzi,first.hanzi);
 assert.equal(calendarReply('明天','date',new Date(2026,11,31)).hanzi,'明天一月一号。');
 assert.equal(calendarReply('昨天','weekday',new Date(2026,10,9)).hanzi,'昨天星期日。');
});
test('DOM shows weather answer, scenario, translation of errors and an automatic question',async()=>{
 const f=await liveDOM(1,{completed:['weather']}),{el,send,clips,w}=f;try{
  el('mode-nonstop').click();send('今天天气怎么样');assert.equal(el('phrase').textContent,'今天很冷。');assert(el('exercise-banner').textContent.includes('не настоящий прогноз'));assert(el('audio-note').hidden===false);assert(el('recent').textContent.includes('какая погода'));
  send('今天是很冷');assert(el('learner-feedback').textContent.includes('Возможный смысл'));assert(el('learner-feedback').textContent.includes('今天很冷'));assert(el('recent').textContent.includes('今天是很冷'));
  send('今天天气怎么样');send('今天天气怎么样');
  // Existing spoken acknowledgements complete before a follow-up; no acoustic scoring.
  if(clips.at(-1)?.onended)clips.at(-1).onended();
  await new Promise(resolve=>setTimeout(resolve,4800));assert(['今天天气怎么样？','明天天气怎么样？'].includes(el('phrase').textContent));
  send('谢谢');assert.equal(el('mode-nonstop').getAttribute('aria-pressed'),'true');
  el('finish').click();const before=el('phrase').textContent;await new Promise(resolve=>setTimeout(resolve,1400));assert.equal(el('phrase').textContent,before);
 }finally{f.close()}
});
