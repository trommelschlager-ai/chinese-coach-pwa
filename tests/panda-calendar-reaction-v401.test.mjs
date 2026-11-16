import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeCalendarLiteral,calendarAcknowledgement} from '../assets/panda-calendar-literal-v383.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';
import {lookupPandaVoiceClip} from '../assets/panda-live-audio.mjs';
import {patternPrompts} from '../assets/panda-hsk1-patterns-v285.mjs';

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
 assert.equal(offTopic.followup,null,'Do not replace the pending greeting question');
});

test('An active weekday lesson still grades correct and wrong answers instead of acknowledging blindly',()=>{
 const prompt=patternPrompts(4,date,all).find(q=>q.hanzi==='今天星期几？');
 assert(prompt);
 const correct=free('星期一',all,prompt);
 assert.equal(correct.kind,'answer');
 const wrong=free('星期二',all,prompt);
 assert.notEqual(wrong.kind,'answer','False weekday should not pass');
});

test('Short and Non-Stop screen paths retain progress and skip unavailable acknowledgement audio',()=>{
 const source=fs.readFileSync(new URL('../assets/panda-live-screen-v270.mjs',import.meta.url),'utf8');
 assert(source.includes("const playReply=!result.spoken?.calendarLiteral||!!lookupPandaVoiceClip(result.reply.hanzi)"));
 assert(source.includes("if(question.spoken?.calendarLiteral&&question.reply)"));
 assert(source.includes("const result=verifyAnswerFor(conversation.lines,state.step,input)"));
 assert(source.indexOf("if(question.spoken?.calendarLiteral&&question.reply)") >
   source.indexOf("const result=verifyAnswerFor(conversation.lines,state.step,input)"));
 const html=fs.readFileSync(new URL('../panda-voice-pilot.html',import.meta.url),'utf8');
 assert(html.includes('panda-live-screen-v270.mjs?v=402'));
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
