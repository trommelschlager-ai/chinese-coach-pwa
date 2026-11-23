import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {everydayMeaning,extractFriendlyLearnerName} from '../assets/panda-everyday-meaning-v515.mjs';

const love=everydayMeaning('我爱你！',1,{});
test('recognized 我爱你 is understood without generic clarification or tone grading',()=>{
 assert.equal(love.spoken[1],'Wǒ ài nǐ!');
 assert.equal(love.spoken[2],'Я тебя люблю!');
 assert.deepEqual(love.reply,[
  '谢谢你！我很开心！你叫什么名字？',
  'Xièxie nǐ! Wǒ hěn kāixīn! Nǐ jiào shénme míngzi?',
  'Спасибо! Мне очень приятно! Как тебя зовут?'
 ]);
 assert.equal(love.context.awaiting,'friendly-name');
 assert.ok(!/我没听懂/.test(love.reply[0]));
});
test('follow-up 我叫小明 and 我很好 are understood with accurate pinyin',()=>{
 const name=everydayMeaning('我叫小明。',1,love.context);
 assert.equal(name.spoken[1],'Wǒ jiào Xiǎomíng.');
 assert.equal(name.reply[0],'很高兴认识你！你今天怎么样？');
 assert.equal(name.context.awaiting,'friendly-mood');
 const good=everydayMeaning('我很好。',1,name.context);
 assert.equal(good.reply[0],'太好了！你想聊什么？');
 assert.equal(good.context.awaiting,'topic');
 assert.equal(everydayMeaning('我不好',1,name.context).reply[0],'怎么了？');
});
test('single name alone is accepted in Mandarin, Cyrillic and Latin after 你叫什么名字',()=>{
 const reply=love.context;
 for(const [name,py,ru] of [
  ['安东。','Āndōng.','Антон'],
  ['我叫安东。','Wǒ jiào Āndōng.','Антон'],
  ['Антон',null,'Антон'],
  ['Anton',null,'Anton'],
  ['小明', 'Xiǎomíng.','Сяомин'],
  ['张伟',null,'张伟']
 ]){
  const result=everydayMeaning(name,1,reply);
  assert.ok(result,'expected to recognize given name '+name);
  assert.equal(result.spoken[1],py,'known-name reading or intentionally absent: '+name);
  assert.ok(result.spoken[2].includes(ru),name);
  assert.equal(result.reply[0],'很高兴认识你！你今天怎么样？');
  assert.equal(result.context.awaiting,'friendly-mood');
 }
});
test('short non-name phrases must never be interpreted as a learner name',()=>{
 for(const value of ['你好','你好吗？','谢谢','我很好','我爱你','不知道','休息','привет','hello','yes','да','нет']){
  assert.equal(extractFriendlyLearnerName(value),null,'not a name: '+value);
 }
 assert.equal(everydayMeaning('安东',1,{}),null,'bare names only make sense after asking name');
 assert.equal(everydayMeaning('我很好',1,{}),null,'do not interpret mood as name');
});
test('unknown phrase remains unknown; recognized sentence is not ASR tone evidence',()=>{
 assert.equal(everydayMeaning('不存在的荒谬陈述',1,{}),null);
 assert.equal('toneVerified' in love,false);
});
test('Panda short and Non-Stop use the same reviewed social route before fallback',()=>{
 const core=fs.readFileSync('assets/panda-hsk2-preview-core-v1.mjs','utf8');
 const html=fs.readFileSync('panda-voice-pilot.html','utf8');
 const sw=fs.readFileSync('sw.js','utf8');
 const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
 assert.match(core,/const friendlyTurn=cleaned==='我爱你'/);
 assert.match(core,/state\.friendlyAwaiting==='friendly-name'&&!!extractFriendlyLearnerName\(input\)/);
 assert.match(core,/everydayMeaning\(input,lesson\(\),\{awaiting:state.friendlyAwaiting\}\)/);
 assert.match(core,/say\(\{hanzi:social.reply\[0\]/);
 assert.match(core,/Тоны речи не оценивались/);
 assert.match(html,/panda-hsk2-preview-core-v1\.mjs\?v=529/);
 assert.match(sw,/chinese-coach-pwa-v529-friendly-name/);
 assert.ok(pack.files.includes('./assets/panda-hsk2-preview-core-v1.mjs?v=529'));
});
