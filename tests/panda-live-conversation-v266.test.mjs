import test from 'node:test';
import assert from 'node:assert/strict';
import {CONVERSATIONS} from '../assets/panda-live-lessons.mjs';
import {verifyAnswerFor} from '../assets/panda-voice-pilot-engine.mjs';
import {lookupPilotAudio} from '../assets/panda-live-audio.mjs';
import {prepareConversation,weekdayForDate,interpretFamily,interpretUtterance,howAreYou,replyToExtraSpeech,extraExamples} from '../assets/panda-live-conversation-v266.mjs';
import {validatedVariants} from '../assets/panda-live-practice.mjs';

test('lesson 4 uses phone actual weekday and not hard-coded Monday',()=>{
 const thursday=new Date(2026,10,12,16),base=CONVERSATIONS[3];
 const actual=prepareConversation(base,thursday);
 assert.equal(weekdayForDate(thursday).ru,'четверг');
 assert(actual.context.includes('четверг')&&actual.context.includes('твоего телефона'));
 assert(verifyAnswerFor(actual.lines,1,'今天星期四').ok);
 assert(verifyAnswerFor(actual.lines,1,'今天是星期四').ok);
 assert(!verifyAnswerFor(actual.lines,1,'今天星期一').ok);
 assert.equal(actual.replies.tomorrow.audioKey,'谢谢');
 assert.equal(actual.replies.tomorrow.ru.includes('星期四'),true);
 assert(validatedVariants(4,1,actual.lines).includes('今天星期四'));
 const monday=prepareConversation(base,new Date(2026,10,9,16));
 assert(verifyAnswerFor(monday.lines,1,'今天星期一').ok);
 assert.equal(monday.replies.tomorrow.audioKey,'明天星期二');
 assert.equal(base.lines[1].instruction.includes('понедельник'),true,'Raw lesson must stay immutable');
 const sunday=prepareConversation(base,new Date(2026,10,15,16));
 assert(verifyAnswerFor(sunday.lines,1,'今天星期天').ok);
 assert(!verifyAnswerFor(sunday.lines,1,'星期0').ok);
});
test('family answers can mention younger or elder siblings with accurate Russian and toned pinyin',()=>{
 const variants=[
  ['我有妹妹','У меня есть младшая сестра.','Wǒ yǒu mèimei.'],
  ['我有弟弟和妹妹','У меня есть младший брат и младшая сестра.','Wǒ yǒu dìdi hé mèimei.'],
  ['我没有哥哥，我有妹妹','У меня нет старшего брата, но есть младшая сестра.','Wǒ méiyǒu gēge, wǒ yǒu mèimei.'],
  ['我有两个妹妹','У меня есть две младшие сестры.','Wǒ yǒu liǎng ge mèimei.']
 ];
 for(const [zh,ru,py] of variants){
  const result=interpretFamily(zh);assert.equal(result.translation,ru,zh);assert.equal(result.pinyin,py,zh);
 }
 assert.equal(interpretFamily('我妹妹很好'),null,'Do not pretend to translate unknown family expressions');
 const family=prepareConversation(CONVERSATIONS[5]);
 assert.equal(verifyAnswerFor(family.lines,1,'我没有哥哥，我有妹妹').branch,'family-more');
 assert.equal(verifyAnswerFor(family.lines,1,'我有哥哥和弟弟').branch,'family-more');
 assert.equal(verifyAnswerFor(family.lines,1,'我有妹妹').ok,false,'A question about an older brother needs an explicit answer about him');
 assert.equal(family.replies['family-more'].audioKey,'谢谢');
 assert(lookupPilotAudio(family.replies['family-more'].audioKey));
 assert(validatedVariants(6,1,family.lines).includes('我没有哥哥我有妹妹'));
});
test('panda can answer how are you, continue after thanks and acknowledge only known words',()=>{
 const example=replyToExtraSpeech('你好吗？',7);
 assert.equal(example.answer.hanzi,'很好！');
 assert.equal(example.answer.audioKey,'很好');
 assert(lookupPilotAudio(example.answer.audioKey));
 assert.equal(example.understood.translation,'Как дела?');
 const story=replyToExtraSpeech('我有弟弟和妹妹',6);
 assert.equal(story.understood.translation,'У меня есть младший брат и младшая сестра.');
 assert.equal(story.answer.audioKey,'谢谢');
 assert(replyToExtraSpeech('今天天气很好',7).understood.known);
 assert(replyToExtraSpeech('明天下雨',7).understood.translation.includes('Завтра'));
 assert.equal(replyToExtraSpeech('我有妹妹',7).answer,null,'Topic guard prevents family question leaking into weather');
 assert.equal(replyToExtraSpeech('宇宙飞船在哪里',7).answer,null);
 assert(howAreYou('你好吗？')&&howAreYou('你呢？')&&!howAreYou('你很好'));
 assert(extraExamples(6).includes('我有弟弟和妹妹'));
 assert.equal(interpretUtterance('星期四',4).translation,'Сегодня четверг.');
});
