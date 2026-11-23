import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeCalendarLiteral,calendarAcknowledgement,isCalendarRoundFinished} from '../assets/panda-calendar-literal-v383.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {patternPrompts} from '../assets/panda-hsk1-patterns-v285.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';

const date=new Date(2026,10,16,12,0,0);
const all=[1,2,3,4,5,6,7];
const free=(text,allowed=all,prompt=null)=>answerLive(text,{allowed,topic:1,curriculum:[],date,prompt,turn:1});

test('Panda acknowledges the exact reviewed date/weekday and cannot invent its MP3',()=>{
 for(const [input,pinyin] of [
  ['星期一','Nǐ shuō: Xīngqīyī.'],
  ['十一月十六号','Nǐ shuō: Shí yī yuè shí liù hào.'],
  ['11月16号','Nǐ shuō: Shí yī yuè shí liù hào.'],
  ['今天是星期一','Nǐ shuō: Jīntiān shì xīngqīyī.']
 ]){
  const spoken=analyzeCalendarLiteral(input),ack=calendarAcknowledgement(spoken);
  assert(ack,'Acknowledgement exists: '+input);
  assert.equal(ack.hanzi,'你说：“'+input+'。”');
  assert.equal(ack.pinyin,pinyin);
  assert.equal(ack.audioKey,null);
  assert.equal(lookupPandaVoiceClip(ack.hanzi),null,'Never substitute unrelated audio');
  const answered=free(input);
  assert.equal(answered.kind,'statement');
  assert.equal(answered.reply.hanzi,ack.hanzi);
  assert.equal(answered.reply.pinyin,ack.pinyin);
  assert.equal(answered.spoken.pinyin,spoken.pinyin);
 }
});

test('Non-Stop asks another, already-unlocked calendar question with an existing MP3',()=>{
 const monday=free('星期一',[1,4,5]);
 assert.equal(monday.followup?.hanzi,'今天几月几号？');
 assert.equal(monday.followup.lesson,5);
 assert(lookupPandaVoiceClip(monday.followup.hanzi),'Today-date question must have a real MP3');
 const november=free('十一月十六号',[1,4,5]);
 assert.equal(november.followup?.hanzi,'今天星期几？');
 assert.equal(november.followup.lesson,4);
 assert(lookupPandaVoiceClip(november.followup.hanzi),'Today-weekday question must have a real MP3');
 for(const result of [monday,november]){
  assert.equal(result.followup?.isContextual,true,'Calendar follow-up must bypass generic course prompt replacement');
  assert(['weekday','date'].includes(result.followup?.intent),'Preserve original calendar validation intent');
  assert.equal(result.followup?.audioKey,result.followup?.hanzi);
 }

});

test('Locked and unrelated topics do not trigger calendar questions',()=>{
 const locked=free('十一月十六号',[1]);
 assert.equal(locked.lesson,1,'Translation cannot unlock the date lesson');
 assert.equal(locked.followup,null,'No question from a locked lesson');
 const limited=free('星期一',[1,4]);
 assert.equal(limited.followup,null,'Must not ask unavailable lesson 5');
 const pending={lesson:1,hanzi:'你好吗？',intent:'intro',accepted:['我很好']};
 const offTopic=free('星期一',[1,4,5],pending);
 assert.equal(offTopic.followup?.hanzi,'今天几月几号？',
  'In Non-Stop a deliberate calendar statement may change an unrelated greeting topic');
 assert.equal(offTopic.followup?.isContextual,true);
 const interruptedDate=free('11月16号',[1,4,5],pending);
 assert.equal(interruptedDate.followup?.hanzi,'今天星期几？');
 const notUnlocked=free('11月16号',[1],pending);
 assert.equal(notUnlocked.followup,null,'A calendar switch must not unlock lessons');
 assert.match(notUnlocked.message,/«Дни недели»/,'Explain why the requested calendar flow cannot continue');
});

test('An active weekday lesson still grades correct and wrong answers instead of acknowledging blindly',()=>{
 const prompt=patternPrompts(4,date,all).find(q=>q.hanzi==='今天星期几？');
 assert(prompt);
 const correct=free('星期一',all,prompt);
 assert.equal(correct.kind,'answer');
 const wrong=free('星期二',all,prompt);
 assert.notEqual(wrong.kind,'answer','False weekday should not pass');
});


test('accepted active date completes calendar round even without spoken.calendarLiteral',()=>{
 const datePrompt=patternPrompts(5,date,all).find(x=>x.hanzi==='今天几月几号？');
 assert(datePrompt,'Prompted date check is available');
 const validDate=answerLive('今天是十一月十六号。',{
  allowed:all,topic:5,prompt:datePrompt,curriculum:[],date,turn:2
 });
 assert.equal(validDate.kind,'answer','Correct date is an accepted answer to current prompt');
 assert.notEqual(validDate.spoken?.calendarLiteral,true,
  'Actual prompted responses use a different answer engine than standalone calendar lookups');
 const questionHistory=['你好吗？','今天星期几？','今天几月几号？'];
 assert.equal(isCalendarRoundFinished({
  input:'今天是十一月十六号。',resultKind:validDate.kind,
  spoken:validDate.spoken,prompt:datePrompt,questions:questionHistory
 }),true,'End the loop even if the separate answer engine omitted calendarLiteral');
 assert.equal(isCalendarRoundFinished({
  input:'今天是十一月十六号。',resultKind:'statement',
  spoken:validDate.spoken,prompt:datePrompt,questions:questionHistory
 }),false,'A non-answer must not automatically complete the lesson');
 assert.equal(isCalendarRoundFinished({
  input:'今天是十一月十六号。',resultKind:'answer',
  spoken:validDate.spoken,prompt:datePrompt,questions:['今天几月几号？']
 }),false,'The other calendar question was never asked');
 assert.equal(isCalendarRoundFinished({
  input:'今天是十一月十六号。',resultKind:'answer',
  spoken:validDate.spoken,prompt:null,questions:questionHistory
 }),false,'Free vocabulary lookups cannot complete an active two-question round');
 const wrongDate=answerLive('今天是十一月十五号。',{
  allowed:all,topic:5,prompt:datePrompt,curriculum:[],date,turn:2
 });
 assert.notEqual(wrongDate.kind,'answer','Incorrect current date must not pass');
 assert.equal(isCalendarRoundFinished({
  input:'今天是十一月十五号。',resultKind:wrongDate.kind,
  spoken:wrongDate.spoken,prompt:datePrompt,questions:questionHistory
 }),false);
});

test('Short and Non-Stop screen paths retain progress and skip unavailable acknowledgement audio',()=>{
 const source=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(source.includes("const playReply=completedCalendarRound?false:"),'Completion is text-first without forcing a different recorded voice');
 assert(source.includes("lookupPandaVoiceClip(closingReply.hanzi)"),'Other answers still use only verified exact audio');
 assert(source.includes("if(question.spoken?.calendarLiteral&&question.reply)"));
 assert(source.includes("const result=verifyAnswerFor(conversation.lines,state.step,input)"));
 assert(source.indexOf("if(question.spoken?.calendarLiteral&&question.reply)") >
   source.indexOf("const result=verifyAnswerFor(conversation.lines,state.step,input)"));
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=\d+/,'Active Panda engine uses a cache-busted module URL');
 const activeCore=fs.readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 assert.ok(activeCore.includes('const playReply=completedCalendarRound?false:'),'Active calendar completion never plays an unrelated MP3');
});

test('the approved panda chat visibly renders the calendar-completion message',()=>{
 const ui=fs.readFileSync(new URL('../assets/panda-live-v346.mjs',import.meta.url),'utf8');
 assert(ui.includes("e.analysis?.kind==='calendar-complete'"),'A chat-row completion is visible without covering the Panda');
 assert(ui.includes("translation.append(el('div','pg406-finish',e.analysis.summary))"));
});

test('the UI does not overwrite the reviewed calendar follow-up with an unrelated greeting',()=>{
 const source=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(source.includes("else if(followup&&followup.intent!=='relative-age'&&!followup.isContextual)"));
 const november=free('11月16号',[1,4,5]);
 const followup=november.followup;
 assert(followup?.isContextual,'The calendar question is explicitly contextual');
 // This is the exact condition used by the existing on-screen follow-up router.
 const replacesWithGeneric=followup.intent!=='relative-age'&&!followup.isContextual;
 assert.equal(replacesWithGeneric,false,'Never replace 今天星期几？ with 你今天怎么样？');
 assert.equal(followup.hanzi,'今天星期几？');
});

test('Non-Stop screenshot regression: a new date interrupts unfinished 你好吗 when calendar topic is open',async()=>{
 const dom=await liveDOM(1,{completed:['weekdays','dates']});
 try{
  const {el,send,w}=dom;
  el('mode-nonstop').click();
  assert.equal(w.PandaApprovedBridge337.snapshot().mode,'nonstop');
  assert(w.PandaApprovedBridge337.snapshot().allowed.includes(4));
  assert(w.PandaApprovedBridge337.snapshot().allowed.includes(5));
  send('11月16号');
  assert.match(el('recent').textContent,/16\.11/,'Learner date is translated');
  assert.match(el('status').textContent,/продолжит вопросом/,'Panda scheduled a relevant calendar follow-up');
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(el('phrase').textContent,'今天星期几？',
   'Calendar question replaces stale greeting prompt in Non-Stop');
  assert.match(el('translation').textContent,/день недели/);
  assert.equal(el('hear').disabled,false,'Approved question MP3 is available');
  // Then answer the weekday and date, as on the user's Android screenshots.
  // No third repeat of the same two-question loop is permitted.
  const clipsBeforeAnswer=dom.clips.length;
  const now=new Date();
  const weekday=['日','一','二','三','四','五','六'][now.getDay()];
  const zhNum=n=>n<10?'零一二三四五六七八九'[n]:n===10?'十':n<20?'十'+'零一二三四五六七八九'[n-10]:n%10===0?'零一二三四五六七八九'[Math.floor(n/10)]+'十':'零一二三四五六七八九'[Math.floor(n/10)]+'十'+'零一二三四五六七八九'[n%10];
  send('今天星期'+weekday+'。');
  // Mock Audio does not end automatically. Real recorded replies may be voiced;
  // fire its completion event so the scheduled next question is not blocked.
  const latestClip=dom.clips.at(-1);
  if(dom.clips.length>clipsBeforeAnswer&&typeof latestClip?.onended==='function')latestClip.onended();
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(el('phrase').textContent,'今天几月几号？',
   'After weekday answer, Panda should ask for the date once');
  send('今天是'+zhNum(now.getMonth()+1)+'月'+zhNum(now.getDate())+'号。');
  assert.equal(el('phrase').textContent,'很好！',
   'The Panda should visibly close the lesson instead of echoing the date');
  assert.match(el('status').textContent,/Мы повторили день недели и дату/,
   'End the finished calendar mini-dialogue instead of looping');
  assert.match(el('recent').textContent,/Мы повторили день недели и дату/,
   'The completed-round message must appear in conversation history, not just hidden status');
  const ending=dom.w.PandaApprovedBridge337.snapshot().history.at(-1);
  assert.equal(ending?.analysis?.kind,'calendar-complete');
  assert.equal(ending?.hanzi,'很好！');
  const finalPhrase=el('phrase').textContent;
  await new Promise(resolve=>setTimeout(resolve,4950));
  assert.equal(el('phrase').textContent,finalPhrase,
   'Do not automatically ask 今天星期几？ again');
 }finally{dom.close()}
});
