import test from 'node:test';
import assert from 'node:assert/strict';
import {everydayMeaning} from '../assets/panda-everyday-meaning-v515.mjs';
import {replyHSK2} from '../assets/panda-hsk2-brain-v1.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';

test('我爱你 receives warm, teacher-safe answer and a name question',()=>{
 const turn=everydayMeaning('我爱你！',1,null);
 assert.equal(turn.spoken[1],'Wǒ ài nǐ!');
 assert.equal(turn.spoken[2],'Я тебя люблю!');
 assert.equal(turn.reply[0],'谢谢你！我很开心！你叫什么名字？');
 assert.match(turn.reply[1],/Xièxie nǐ!.*Nǐ jiào shénme míngzi/);
 assert.equal(turn.context.awaiting,'friendly-name');
 assert.doesNotMatch(turn.reply[0],/我也爱你|没听懂/);
});

test('Name follows love naturally, without inventing pinyin for unknown names',()=>{
 const name=everydayMeaning('我叫小明。',1,{awaiting:'friendly-name'});
 assert.equal(name.spoken[1],'Wǒ jiào Xiǎomíng.');
 assert.equal(name.reply[0],'很高兴认识你！你今天怎么样？');
 assert.equal(name.context.awaiting,'friendly-mood');
 const unknown=everydayMeaning('我叫阿乐',1,{awaiting:'friendly-name'});
 assert.equal(unknown.spoken[1],null);
 assert.equal(unknown.spoken[2],'Меня зовут 阿乐.');
 assert.equal(unknown.reply[0],'很高兴认识你！你今天怎么样？');
 assert.equal(everydayMeaning('我叫阿乐',1,{awaiting:'other'}),null);
});

test('A greeting can continue through wellbeing and on to a new topic',()=>{
 const fine=everydayMeaning('我很好。',1,{awaiting:'friendly-mood'});
 assert.equal(fine.reply[0],'太好了！你想聊什么？');
 assert.equal(fine.context.awaiting,'topic');
 const low=everydayMeaning('我不好。',1,{awaiting:'friendly-mood'});
 assert.equal(low.reply[0],'怎么了？');
 assert.equal(low.context.awaiting,'wellbeing');
});

test('HSK1 standalone and name followup work without unlocking lesson 2',()=>{
 const first=answerLive('我爱你',{allowed:[1],topic:1});
 assert.equal(first.reply.hanzi,'谢谢你！我很开心！你叫什么名字？');
 assert.equal(first.friendlyAwaiting,'friendly-name');
 const second=answerLive('我叫小明',{allowed:[1],topic:1,friendlyAwaiting:first.friendlyAwaiting});
 assert.equal(second.reply.hanzi,'很高兴认识你！你今天怎么样？');
 assert.equal(second.spoken.pinyin,'Wǒ jiào Xiǎomíng.');
});

test('HSK2 preserves friendly-name and friendly-mood context',()=>{
 const first=replyHSK2('我爱你',101,0,false,null);
 assert.equal(first.kind,'social');
 assert.equal(first.line.hanzi,'谢谢你！我很开心！你叫什么名字？');
 assert.equal(first.context.awaiting,'friendly-name');
 const second=replyHSK2('我叫小明',101,0,false,first.context);
 assert.equal(second.line.hanzi,'很高兴认识你！你今天怎么样？');
 assert.equal(second.context.awaiting,'friendly-mood');
 const third=replyHSK2('我很好',101,0,false,second.context);
 assert.equal(third.line.hanzi,'太好了！你想聊什么？');
 assert.equal(third.context.awaiting,'topic');
});

test('Unrelated unfamiliar inputs remain outside the friendly introduction',()=>{
 assert.equal(everydayMeaning('我不是小明',1,{awaiting:'friendly-name'}),null);
 const unrelated=answerLive('一只看不见的麒麟在哪里',{allowed:[1],topic:1});
 assert.notEqual(unrelated.reply?.hanzi,'谢谢你！我很开心！你叫什么名字？');
});
