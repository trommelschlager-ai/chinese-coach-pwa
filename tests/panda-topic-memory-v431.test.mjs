import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {enrichTopics431} from '../assets/panda-topic-memory-v431.mjs';
import {availableAskGroups} from '../assets/panda-ask-catalog-v326.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const date=new Date(2026,10,17);
const unlocked=[1,2,3,4,5,6,7],catalog=availableAskGroups(unlocked,[],date);
function evaluate(input,question,topic,{known=true,fact={},kind='statement',answered=[],history=[],allowed=unlocked}={}){
 const raw={kind,reply:{hanzi:'谢谢！',pinyin:'Xièxie!',ru:'Спасибо!'},
   spoken:{hanzi:input,known,topic,fact}};
 return enrichTopics431({input,activePrompt:{hanzi:question,lesson:topic},result:raw,
  allowed,questions:[question,...answered],history,profile:{family:{}},
  catalog,lookupAudio:lookupPandaVoiceClip});
}
test('name from a known learner becomes a voiced, new, relevant introduction question',()=>{
 const x=evaluate('我叫小明。','你叫什么名字？',2,{fact:{name:'小明'}});
 assert.equal(x.kind,'answer');
 assert.equal(x.followup?.hanzi,'你是老师吗？');
 assert(lookupPandaVoiceClip(x.reply.hanzi)?.src.endsWith('/p125.mp3'));
 assert(lookupPandaVoiceClip(x.followup.hanzi)?.src);
});
test('role answer returns a non-repeated name question, but never presumes a job',()=>{
 const x=evaluate('我是学生。','你是老师吗？',2,{fact:{role:'学生',subject:'我',negative:false}});
 assert.equal(x.kind,'answer');
 assert.equal(x.followup?.hanzi,'你叫什么名字？');
 assert(!x.reply.hanzi.includes('老师'));
 const asked=evaluate('我是学生。','你是老师吗？',2,{fact:{role:'学生',subject:'我',negative:false},answered:['你叫什么名字？']});
 assert.equal(asked.followup,null);
});
test('name not claimed from an unrecognized voice transcript',()=>{
 const x=evaluate('我叫安东。','你叫什么名字？',2,{known:false,fact:{name:'安东'}});
 assert.equal(x.kind,'statement');assert.equal(x.reply.hanzi,'谢谢！');
 const wrong=evaluate('我叫小明。','你是老师吗？',2,{fact:{name:'小明'}});
 assert.equal(wrong.kind,'statement');
});
test('Saturday free-time answer stays on same topic using v411 recorded follow-up',()=>{
 const x=evaluate('我星期六有空。','你星期几有空？',4,{fact:{freeDay:'星期六'}});
 assert.equal(x.kind,'answer');
 assert.equal(x.followup?.hanzi,'你今天有空吗？');
 assert.equal(lookupPandaVoiceClip(x.followup.hanzi)?.src,'./assets/panda-voice-clips-v411/p164.mp3');
});
test('today free-time question continues to general weekday question only once',()=>{
 const x=evaluate('我今天有空。','你今天有空吗？',4,{fact:{freeDay:'今天'}});
 assert.equal(x.followup?.hanzi,'你星期几有空？');
 const noRepeat=evaluate('我今天有空。','你今天有空吗？',4,{
  fact:{freeDay:'今天'},answered:['你星期几有空？']});
 assert.equal(noRepeat.followup,null);
});
test('a vague today answer is not made into an answer for a weekday or Sunday',()=>{
 const today=evaluate('我今天有空。','你星期几有空？',4,{fact:{freeDay:'今天'}});
 assert.equal(today.kind,'statement');
 const sunday=evaluate('我星期六有空。','你星期天有空吗？',4,{fact:{freeDay:'星期六'}});
 assert.equal(sunday.kind,'statement');
});
test('today weather answer asks only the recorded tomorrow weather question',()=>{
 const x=evaluate('今天很冷。','今天天气怎么样？',7,{fact:{weather:'很冷',time:'今天'}});
 assert.equal(x.kind,'answer');assert.equal(x.followup?.hanzi,'明天天气怎么样？');
 assert.equal(lookupPandaVoiceClip(x.followup.hanzi)?.src,'./assets/panda-live-voice-v3/p14.mp3');
 assert(!x.reply.hanzi.includes('明天'));
});
test('tomorrow weather answer cannot be satisfied by report about today',()=>{
 const invalid=evaluate('今天很冷。','明天天气怎么样？',7,{fact:{weather:'很冷',time:'今天'}});
 assert.equal(invalid.kind,'statement');
 const correct=evaluate('明天下雨。','明天天气怎么样？',7,{fact:{weather:'下雨',time:'明天'}});
 assert.equal(correct.kind,'answer');
 assert.equal(correct.followup?.hanzi,'今天天气怎么样？');
});
test('day-of-week and dates only progress after existing calendar engine verification',()=>{
 const calendar=evaluate('今天星期二。','今天星期几？',4,{kind:'answer'});
 assert.equal(calendar.followup?.hanzi,'你星期几有空？');
 const unchecked=evaluate('今天星期二。','今天星期几？',4,{kind:'statement'});
 assert.equal(unchecked.followup,undefined);
 const day=evaluate('今天十一月十七号。','今天几月几号？',5,{kind:'answer'});
 assert.equal(day.kind,'answer');
 assert(!day.followup||lookupPandaVoiceClip(day.followup.hanzi));
});
test('locked topic and unvoiced follow-up cannot be exposed',()=>{
 const locked=evaluate('今天很冷。','今天天气怎么样？',7,{allowed:[1,2],fact:{weather:'很冷',time:'今天'}});
 assert.equal(locked.kind,'statement');
 const x=enrichTopics431({
  input:'我星期六有空',activePrompt:{hanzi:'你星期几有空'},
  result:{kind:'statement',reply:{hanzi:'谢谢'},spoken:{known:true,topic:4,fact:{freeDay:'星期六'}}},
  allowed:[4],questions:[],history:[],catalog,lookupAudio:()=>null});
 assert.equal(x.followup,null);
 assert.equal(x.reply.hanzi,'谢谢');
});
test('repeated acknowledgement alternates only real approved MP3 clips',()=>{
 const x=evaluate('我叫小明。','你叫什么名字？',2,{fact:{name:'小明'},
  history:[{who:'panda',hanzi:'好的，我明白了。'}]});
 assert.equal(x.reply.hanzi,'谢谢你告诉我。');
 assert.equal(lookupPandaVoiceClip(x.reply.hanzi)?.src,'./assets/panda-voice-clips-v365/p124.mp3');
});
test('approval boundaries: existing design, original MP3 and offline v431 unchanged',()=>{
 const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const screen=read('assets/panda-hsk2-preview-core-v1.mjs');
 assert(screen.includes('enrichTopics431({'));
 assert(read('assets/panda-hsk2-preview-ui-v1.mjs').includes('panda-character-clean-v349.webp'));
 assert(/panda-hsk2-preview-core-v1\.mjs\?v=\d+/.test(read('panda-voice-pilot.html')));
 const pack=JSON.parse(read('assets/offline-pack.json'));
 assert(pack.files.includes('./assets/panda-topic-memory-v431.mjs?v=431'));
});
test('Android-like voice lesson recognizes a name, acknowledges, then speaks the next verified question',async()=>{
 const f=await liveDOM(1,{completed:['pronouns','numbers','weekdays','weather']});
 try{
  const bridge=f.w.PandaApprovedBridge337;
  assert(bridge.chooseTopic(2));
  assert(bridge.startTopicQuestion(2,'你叫什么名字？'));
  f.send('我叫小明。');
  assert.equal(f.el('phrase').textContent,'好的，我明白了。');
  assert(f.clips.at(-1)?.src.includes('p125.mp3'));
  if(typeof f.clips.at(-1)?.onended==='function')f.clips.at(-1).onended();
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(f.el('phrase').textContent,'你是老师吗？');
  assert(f.clips.at(-1)?.src);
 }finally{f.close()}
});


test('real dialogue engine accepts menu questions with missing intent metadata',()=>{
 const name=answerLive('我叫小明。',{allowed:unlocked,topic:2,prompt:{hanzi:'你叫什么名字？',lesson:2},date});
 assert.equal(name.kind,'answer','Name should not be ignored when question came from All Topics');
 assert.equal(name.spoken.fact.name,'小明');
 const free=answerLive('我星期六有空。',{allowed:unlocked,topic:4,prompt:{hanzi:'你星期几有空？',lesson:4},date});
 assert.equal(free.kind,'answer','A named weekday answers the free-time question');
 assert.equal(free.spoken.fact.freeDay,'星期六');
 const today=answerLive('我今天有空。',{allowed:unlocked,topic:4,prompt:{hanzi:'你今天有空吗？',lesson:4},date});
 assert.equal(today.kind,'answer');
 const weather=answerLive('今天很冷。',{allowed:unlocked,topic:7,prompt:{hanzi:'今天天气怎么样？',lesson:7},date});
 assert.equal(weather.kind,'answer','Today weather should be accepted only for today');
 const wrongWeather=answerLive('今天很冷。',{allowed:unlocked,topic:7,prompt:{hanzi:'明天天气怎么样？',lesson:7},date});
 assert.notEqual(wrongWeather.kind,'answer','Today weather must never answer tomorrow');
 const wrongDay=answerLive('我今天有空。',{allowed:unlocked,topic:4,prompt:{hanzi:'你星期几有空？',lesson:4},date});
 assert.notEqual(wrongDay.kind,'answer','Today is not a named day of week');
});
