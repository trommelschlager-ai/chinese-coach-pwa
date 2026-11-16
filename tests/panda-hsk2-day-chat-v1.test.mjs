import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
import {dailyQuestions,checkDayAnswer,dailyFinal} from '../assets/panda-hsk2-day-coach-v1.mjs';
assert.equal(dailyQuestions(0).length,3,'First micro-lesson unlocks 3 reviewed prompts');
assert.equal(dailyQuestions(1).length,4,'Second micro-lesson unlocks 4');
assert.equal(dailyQuestions(2).length,5,'Third unlocks all day questions');
const pandaCutRegistry=fs.readFileSync(new URL('../assets/panda-voice-clips-v365.mjs',import.meta.url),'utf8');
const recordedHanzi=new Set([...pandaCutRegistry.matchAll(/"zh": "([^"]+)"/g)].map(m=>m[1].replace(/[。？！，、,.!?\s]/g,'')));
for(const mini of [0,1,2])for(const q of dailyQuestions(mini)){
 assert.equal(typeof q.hanzi,'string');
 assert.ok(q.pinyin&&q.ru&&q.hint&&q.pattern instanceof RegExp);
 assert.ok(['你早上做什么？','你起床以后做什么？','你上午做什么？','你今天做什么？','你晚上做什么？'].includes(q.hanzi),'Every guided question has an exact recorded MP3');
 assert.ok(recordedHanzi.has(q.hanzi.replace(/[。？！，、,.!?\s]/g,'')),'The displayed question must be recorded: '+q.hanzi);
}
const good=[
 ['我每天七点十分起床。',0],['我每天早上七点半起床。',0],['我每天7点30分起床',0],['我每天两点起床',0],
 ['我每天早上洗脸。',1],['我每天早上不洗脸',1],
 ['我每天早上吃早饭。',2],['我每天早上不吃早饭。',2],
 ['我晚上听音乐。',4],['我晚上经常看电视。',4],['我晚上学习中文',4],
 ['我每天七点起床。',0],['我早上六点起床。',0],['七点起床',0],
 ['我早上洗脸。',1],['我不洗脸',1],
 ['我早上吃早饭。',2],['不吃早饭',2],
 ['我先刷牙，再吃早饭。',3],
 ['我晚上常常看书。',4],
 ['我早上刷牙',0],['我起床以后洗脸',1],['我起床后刷牙',1],
 ['我起床以后吃早饭',1],['我今天刷牙',1],['我吃早饭',1],['我洗脸',2],
 ['我上午学习中文',2],['我今天上班',3],['我今天先刷牙再吃早饭',3],
 ['我晚上看电影',4],['我晚上工作',4],['我晚上跑步',4],
];
for(const [utterance,idx] of good){
 const x=checkDayAnswer(utterance,idx,2);
 assert.equal(x.ok,true,'should accept '+utterance+' at '+idx);
 assert.match(x.message,/不检查|не проверка|не оцен|не провер/i);
 assert.equal(x.spoken.pinyin,null,'Do not fabricate pinyin for variable learner replies');
}
const bad=[
 ['我每天25点起床',0],['我今天二十五点起床',0],['我早上七点六十分起床',0],
 ['是的',1],['是的',2],['我晚上听音乐',0],
 ['我每天刷牙。',0],
 ['我下午吃早饭',1],
 ['我昨天洗脸',2],
 ['我每天七点起床',3],
 ['我昨天工作',4]
];
for(const [utterance,idx] of bad)assert.equal(checkDayAnswer(utterance,idx,2).ok,false,'reject off-topic '+utterance);
assert.equal(checkDayAnswer('我先刷牙，再吃早饭。',3,0).ok,false,'Do not ask locked content in the first mini-lesson');
const translated=[
 ['我每天七点十分起床',0,'07:10'],
 ['我今天早上八点半起床',0,'08:30'],
 ['我每天早上都洗脸',1,'умываюсь'],
 ['我每天早上不洗脸',1,'не умываюсь'],
 ['我起床以后洗脸',1,'После того как я встаю'],
 ['我起床以后吃早饭',1,'завтракаю'],
 ['我今天刷牙',1,'Сегодня я чищу зубы'],
 ['我每天早上吃早饭',2,'завтракаю'],
 ['我早上不吃早饭',2,'не завтракаю'],
 ['我上午学习中文',2,'учу китайский'],
 ['我先刷牙，再吃早饭',3,'потом завтракаю'],
 ['我今天上班',3,'Сегодня я работаю'],
 ['我晚上听音乐',4,'слушаю музыку'],
 ['我晚上看电影',4,'смотрю фильмы'],['我晚上工作',4,'работаю'],
 ['我晚上经常看电视',4,'часто смотрю телевизор']
];
for(const [utterance,idx,meaning] of translated){
 const r=checkDayAnswer(utterance,idx,2);
 assert.equal(r.ok,true,'Should accept reviewed phrase: '+utterance);
 assert.equal(r.spoken.known,true,'Recognized phrase has verified translation');
 assert(r.spoken.translation.includes(meaning),'Correct Russian translation for '+utterance);
 assert.equal(r.spoken.probable,null,'Technical status text is not a translation');
 assert.equal(r.spoken.pinyin,null,'Cannot fabricate pinyin for variable speech');
}
for(const [utterance,idx] of [
 ['我每天二十五点起床',0],['没有',1],['我先刷牙再刷牙',3],
 ['我晚上常常听音乐了',4],['我晚上工作了',4]
]){
 const r=checkDayAnswer(utterance,idx,2);
 assert.equal(r.ok,false,'Do not mark malformed or unsupported phrase correct: '+utterance);
 assert.equal(r.spoken.translation,null);
}

assert.ok(dailyFinal.hanzi.includes('好'));
console.log('PASS: Panda AI daily coaching: 3/4/5 scoped prompts, valid answer variants, off-topic rejection, no acoustic tone scoring.');


const dom=await liveDOM(1,{params:'practice=day&mini=2'});
try{
 const {w,el,send,clips}=dom;
 w.eval(fs.readFileSync(new URL('../assets/hsk2-user-voice/phrase-index-v332.js',import.meta.url),'utf8'));
 assert.equal(el('phrase').textContent,'你早上做什么？');
 assert.match(el('step').textContent,/1 из 5/);
 send('我不有钱。');
 assert.match(el('recent').textContent,/我没有钱/,'Guided lesson shows the approved grammar correction');
 assert.match(el('step').textContent,/1 из 5/,'Grammar correction must not skip the question');
 send('你早上做什么？');
 assert.equal(el('phrase').textContent,'我早上吃早饭。','Panda replies to HSK2 My Day question');
 assert.match(el('step').textContent,/1 из 5/,'Asking Panda must not advance the lesson');
 assert(clips.at(-1),'Recorded MP3 must be scheduled for HSK2 answer');
 clips.at(-1).onended();
 assert.equal(el('phrase').textContent,'你早上做什么？','Previous practice prompt must return when Panda finishes talking');
 assert.match(el('step').textContent,/1 из 5/);
 send('我每天七点十分起床');
 assert.equal(el('phrase').textContent,'你起床以后做什么？','Answer after an HSK2 question advances only the current lesson');
 assert.match(el('recent').textContent,/07:10/,'Student answer gets a genuine Russian meaning');
}finally{dom.close()}
console.log('PASS: HSK2 My Day in-chat learner question uses recorded audio, restores the original question and preserves progress.');
