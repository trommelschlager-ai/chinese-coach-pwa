import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {understandDayAnswer,getDayCorrectionLine,readDayReview,saveDayReview,masterDayReview,clearDayReview,DAY_REVIEW_KEY,dueDayReview,dayReviewStats,practiceDayReview} from '../assets/panda-hsk2-day-understanding-v1.mjs';

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
 const answers=Array(5).fill(null),notes=[],errors=[],missingAudio=new Set(),messages=[],statuses=[],lines=[],audio=[],timers=[],next=[],saved=[],resolved=[];
 const storeReviewCorrection=zh=>saved.push(zh),resolveReviewCorrection=(expected,answer)=>resolved.push([expected,answer]);
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
 return {answer,countdown,field,button,answers,notes,errors,missingAudio,messages,statuses,lines,audio,timers,next,saved,resolved,pending:()=>pendingCorrection};`)(understandDayAnswer,getDayCorrectionLine,hasAudio);
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
 assert.deepEqual(h.saved,['我八点起床。']);
 assert.equal(h.field.value,'');
 assert.match(h.button.textContent,/Попробовать ещё раз/);
 assert.equal(h.audio.length,0);
 assert.match(h.statuses.at(-1),/Точной MP3 пока нет/);
 assert.match(h.messages.at(-1)[1],/Wǒ bā diǎn qǐchuáng/);
 h.countdown();
 assert.equal(h.timers.length,0,'Correction must not schedule automatic skip');
 await h.answer('我八点起床');
 assert.equal(h.pending(),null);
 assert.deepEqual(h.resolved,[['我八点起床。','我八点起床。']]);
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

function memoryStorage(){
 const m=new Map();
 return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
}
test('review requires opt-in and stores no raw learner text or audio',()=>{
 const st=memoryStorage();
 assert.equal(saveDayReview(st,'我八点起床。',false),false);
 assert.equal(st.getItem(DAY_REVIEW_KEY),null);
 assert.equal(saveDayReview(st,'我八点起床。',true),true);
 assert.deepEqual(JSON.parse(st.getItem(DAY_REVIEW_KEY)),[{zh:'我八点起床。',count:1,mastered:false,stage:0,due:0}]);
 assert.equal(saveDayReview(st,'unknown answer',true),false);
});
test('review deduplicates, checks exact retry, and reopens recurring mistakes',()=>{
 const st=memoryStorage();
 saveDayReview(st,'我八点起床。',true);
 saveDayReview(st,'我八点起床。',true);
 assert.equal(readDayReview(st)[0].count,2);
 assert.equal(masterDayReview(st,'我八点起床。','我九点起床。',true),false);
 assert.equal(masterDayReview(st,'我八点起床。','我八点起床',false),false);
 assert.equal(masterDayReview(st,'我八点起床。','我八点起床',true),true);
 assert.equal(readDayReview(st)[0].mastered,true);
 saveDayReview(st,'我八点起床。',true);
 assert.equal(readDayReview(st)[0].mastered,false);
 assert.equal(readDayReview(st)[0].count,3);
});
test('review handles corrupt and unavailable storage and allows deletion',()=>{
 const st=memoryStorage();
 st.setItem(DAY_REVIEW_KEY,'broken json');
 assert.deepEqual(readDayReview(st),[]);
 assert.equal(saveDayReview(null,'我八点起床。',true),false);
 saveDayReview(st,'我八点起床。',true);
 assert.equal(clearDayReview(st),true);
 assert.deepEqual(readDayReview(st),[]);
});

const DAY=86400000,START=1000000000,PHRASE='我八点起床。';
test('independent recall schedules one, three and seven days, not guided repetition',()=>{
 const st=memoryStorage();saveDayReview(st,PHRASE,true);
 masterDayReview(st,PHRASE,PHRASE,true);
 assert.equal(dueDayReview(st,START).length,1);
 let now=START;
 for(const days of [1,3,7]){
  const result=practiceDayReview(st,PHRASE,PHRASE,true,now);
  assert.equal(result.kind,'matched');assert.equal(result.due,now+days*DAY);
  assert.equal(dueDayReview(st,result.due-1).length,0);
  assert.equal(practiceDayReview(st,PHRASE,PHRASE,true,now).kind,'unavailable');
  now=result.due;assert.equal(dueDayReview(st,now).length,1);
 }
 assert.equal(practiceDayReview(st,PHRASE,PHRASE,true,now).stage,4);
 assert.deepEqual(dayReviewStats(st,now),{total:1,due:0,scheduled:0,completed:1});
});
test('different translation resets intervals, but empty answer and disabled consent never change storage',()=>{
 const st=memoryStorage();saveDayReview(st,PHRASE,true);
 const initial=st.getItem(DAY_REVIEW_KEY);
 assert.equal(practiceDayReview(st,PHRASE,'',true,START).kind,'empty');
 assert.equal(practiceDayReview(st,PHRASE,PHRASE,false,START).kind,'consent');
 assert.equal(st.getItem(DAY_REVIEW_KEY),initial);
 practiceDayReview(st,PHRASE,PHRASE,true,START);
 assert.equal(practiceDayReview(st,PHRASE,'我九点起床',true,START+DAY).kind,'different');
 assert.equal(readDayReview(st)[0].stage,0);
 assert.equal(dueDayReview(st,START+DAY).length,1);
 assert.equal(readDayReview(st)[0].count,2);
});
test('legacy cards retain counts but enter initial independent recall; no repeat after deletion',()=>{
 const st=memoryStorage();st.setItem(DAY_REVIEW_KEY,JSON.stringify([{zh:PHRASE,count:3,mastered:true}]));
 assert.equal(dueDayReview(st,START)[0].count,3);
 assert.equal(dueDayReview(st,START)[0].stage,0);
 clearDayReview(st);
 assert.equal(practiceDayReview(st,PHRASE,PHRASE,true,START).kind,'unavailable');
});
test('new conversation mistake reopens a completed recall cycle',()=>{
 const st=memoryStorage();saveDayReview(st,PHRASE,true);
 let now=START;
 for(let i=0;i<4;i++){const r=practiceDayReview(st,PHRASE,PHRASE,true,now);now=r.due??now}
 assert.equal(dayReviewStats(st,now).completed,1);
 saveDayReview(st,PHRASE,true);
 assert.equal(dayReviewStats(st,now).due,1);
});
