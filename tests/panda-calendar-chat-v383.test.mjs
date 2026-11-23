import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeCalendarLiteral} from '../assets/panda-calendar-literal-v383.mjs';
import {analyzeLearner,answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {patternPrompts} from '../assets/panda-hsk1-patterns-v285.mjs';

const examples=[
 ['星期一','Xīngqīyī.','Понедельник.',4],
 ['星期日','Xīngqīrì.','Воскресенье.',4],
 ['星期天','Xīngqītiān.','Воскресенье.',4],
 ['今天是星期一','Jīntiān shì xīngqīyī.','Сегодня понедельник.',4],
 ['十一月十六号','Shí yī yuè shí liù hào.','16.11.',5],
 ['11月16号','Shí yī yuè shí liù hào.','16.11.',5],
 ['今天是十一月十六号','Jīntiān shì shí yī yuè shí liù hào.','Сегодня 16.11.',5],
 ['明天12月31日','Míngtiān shí èr yuè sān shí yī rì.','Завтра 31.12.',5]
];
test('short Mandarin calendar entries receive exact tone-marked pinyin and meaning',()=>{
 for(const [raw,pinyin,translation,topic] of examples){
  const x=analyzeCalendarLiteral(raw);
  assert(x?.known,'Known literal '+raw);
  assert.equal(x.hanzi,raw);
  assert.equal(x.pinyin,pinyin);
  assert.equal(x.translation,translation);
  assert.equal(x.topic,topic);
  assert.equal(x.calendarLiteral,true);
 }
});

test('free and short chat can translate known calendar text without unlocking lessons',()=>{
 for(const [raw,pinyin,translation,topic] of examples){
  const short=analyzeLearner(raw,[1],null,[]);
  assert.equal(short.known,true,'Short-mode learner translation '+raw);
  assert.equal(short.pinyin,pinyin);
  assert.equal(short.translation,translation);
  const free=answerLive(raw,{allowed:[1],topic:1,curriculum:[],prompt:null});
  assert.equal(free.kind,'statement');
  assert.equal(free.spoken?.pinyin,pinyin);
  assert.equal(free.spoken?.translation,translation);
  assert.equal(free.lesson,1,'Free translation must not unlock HSK1 chapter '+topic);
  assert.equal(free.reply?.hanzi,'你说：“'+raw+'。”','Panda acknowledges the exact learner utterance');
  assert.equal(free.followup,null,'Do not ask locked questions');
 }
});
test('invalid or unrelated date text remains unknown',()=>{
 for(const input of ['星期七','13月1号','2月30号','4月31号','11月32号',
  '11月0号','今天十一月三十二号','下个月几号','我是工程师']){
  assert.equal(analyzeCalendarLiteral(input),null,input);
 }
});
test('an active HSK1 calendar exercise still uses context-aware answer validation',()=>{
 const date=new Date(2026,10,15,12);
 const allowed=[1,2,3,4,5,6,7];
 const prompt=patternPrompts(4,date,allowed).find(x=>x.hanzi==='今天星期几？');
 assert(prompt,'Missing weekday practice');
 const r=answerLive('星期天',{allowed,topic:4,prompt,curriculum:[],date});
 assert.equal(r.kind,'answer');
 assert.equal(r.spoken.pinyin,'Xīngqītiān.','Never insert unsaid 今天');
 const wrong=answerLive('星期一',{allowed,topic:4,prompt,curriculum:[],date});
 assert.notEqual(wrong.kind,'answer','Wrong weekday must not count as correct');
});
test('the duplicate unknown-meaning bubble is absent but reviewed grammar corrections remain',()=>{
 const ui=fs.readFileSync(new URL('../assets/panda-hsk2-preview-ui-v1.mjs',import.meta.url),'utf8');
 assert(ui.includes("const root=$('#pg346-feedback'),active=!!wrong;"),'Only a reviewed correction opens the feedback card');
 assert(!ui.includes('const unknown=last&&!last.ru'),'No duplicate generic meaning bubble');
 assert(ui.includes("'pg445-after'"),'Preserve visible grammar corrections');
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 assert.match(html,/panda-hsk2-preview-ui-v1\.mjs\?v=\d+/,'Current approved UI module must be versioned');
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=\d+/,'Current Panda conversation core must be versioned');
});
