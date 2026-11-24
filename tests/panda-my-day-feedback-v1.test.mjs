import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {understandDayAnswer,getDayCorrectionLine} from '../assets/panda-hsk2-day-understanding-v1.mjs';

const cases=[
 ['我起床八点',0,'correct','我八点起床。'],
 ['我睡觉十一点',4,'correct','我十一点睡觉。'],
 ['我每天起床七点半',0,'correct','我每天七点半起床。'],
 ['我晚上睡觉十点左右',4,'correct','我晚上十点左右睡觉。'],
 ['起床八点',0,'correct','我八点起床。'],
 ['八点',0,'accepted'],
 ['我八点起床',0,'accepted'],
 ['我喜欢猫',0,'clarify'],
 ['我起床二十五点',0,'clarify'],
 ['他起床八点',0,'clarify'],
 ['我起床八点去上班',0,'clarify'],
 ['我不吃早饭',2,'accepted'],
 ['你几点起床？',0,'user-question'],
 ['我八点去上班',3,'accepted'],
 ['我起床以后刷牙',1,'accepted'],
 ['',0,'clarify']
];
for(const [input,index,kind,correction] of cases){
 test('My Day: '+(input||'empty input'),()=>{
  const actual=understandDayAnswer(input,index);
  assert.equal(actual.kind,kind);
  if(correction)assert.equal(actual.correction,correction);
 });
}


const source=fs.readFileSync(new URL('../assets/panda-hsk2-my-day-scenario-v1.mjs',import.meta.url),'utf8');
function feedbackHarness(hasAudio=false){
 const answerSource=source.slice(source.indexOf('async function answer(raw){'),source.indexOf('async function finishQuestions()'));
 const countdownSource=source.slice(source.indexOf('function countdown(){'),source.indexOf('async function ask(idx)'));
 assert(answerSource.startsWith('async function answer')&&countdownSource.startsWith('function countdown'));
 return new Function('understandDayAnswer','getDayCorrectionLine','hasAudio',`
 let phase='questions',i=0,sequence=0,recognizer=null,silence=null,attempt=0,pendingCorrection=null;
 const answers=Array(5).fill(null),notes=[],errors=[],missingAudio=new Set(),messages=[],statuses=[],lines=[],audio=[],timers=[],next=[];
 const field={value:'我起床八点'},button={textContent:''};
 const $=id=>id==='day-input'?field:button;
 const norm=s=>s.replace(/。/g,'');
 const approvedClips=()=>hasAudio?['approved.mp3']:[];
 const speak=a=>{audio.push(a);return Promise.resolve()};
 const line=a=>lines.push(a),status=s=>statuses.push(s),addChatMessage=(role,text)=>messages.push([role,text]);
 const syncRetry=()=>button.textContent=pendingCorrection?'↻ Попробовать ещё раз':'✓ Ответить';
 const setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length};
 const clearTimeout=()=>{};
 const stop=()=>{sequence++;clearTimeout(silence)};
 const ask=idx=>next.push(idx);
 const Q=[['你每天几点起床？','Nǐ měitiān jǐ diǎn qǐchuáng?','Когда ты встаёшь?','подсказка','пример']];
 const document={activeElement:null};
 ${countdownSource}
 ${answerSource}
 return {answer,countdown,field,button,answers,notes,errors,missingAudio,messages,statuses,lines,audio,timers,next,pending:()=>pendingCorrection};`)(understandDayAnswer,getDayCorrectionLine,hasAudio);
}
test('reviewed correction includes tonal pinyin and exact learner time',()=>{
 assert.deepEqual(getDayCorrectionLine('我八点起床。'),['我八点起床。','Wǒ bā diǎn qǐchuáng.','Я встаю в 8:00.']);
 assert.deepEqual(getDayCorrectionLine('我晚上十一点睡觉。'),['我晚上十一点睡觉。','Wǒ wǎnshang shíyī diǎn shuìjiào.','Я вечером ложусь спать в 23:00.']);
 assert.equal(getDayCorrectionLine('我每天七点半起床。')[1],'Wǒ měitiān qī diǎn bàn qǐchuáng.');
 assert.equal(getDayCorrectionLine('我两点一刻起床。')[1],'Wǒ liǎng diǎn yí kè qǐchuáng.');
 assert.equal(getDayCorrectionLine('我8点05分起床。')[1],'Wǒ bā diǎn líng wǔ fēn qǐchuáng.');
});
test('actual scenario displays correction and waits for retry without MP3',async()=>{
 const h=feedbackHarness();
 await h.answer('我起床八点');
 assert.deepEqual(h.lines.at(-1),['我八点起床。','Wǒ bā diǎn qǐchuáng.','Я встаю в 8:00.']);
 assert.equal(h.answers[0],null);
 assert.equal(h.field.value,'');
 assert.match(h.button.textContent,/Попробовать ещё раз/);
 assert.equal(h.audio.length,0);
 assert.match(h.statuses.at(-1),/Точной MP3 пока нет/);
 assert.match(h.messages.at(-1)[1],/Wǒ bā diǎn qǐchuáng/);
 h.countdown();
 assert.equal(h.timers.length,0,'Correction must not schedule automatic skip');
 await h.answer('我八点起床');
 assert.equal(h.pending(),null);
 assert.equal(h.answers[0],'我八点起床。');
 assert.equal(h.timers.length,1);
 h.timers[0].fn();
 assert.deepEqual(h.next,[1]);
});
test('actual scenario uses approved recording only when available',async()=>{
 const h=feedbackHarness(true);
 await h.answer('我起床八点');
 assert.equal(h.audio.length,1);
 assert.equal(h.audio[0][0],'我八点起床。');
 assert.equal(h.pending().index,0);
});
