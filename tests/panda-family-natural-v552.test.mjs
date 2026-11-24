import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v544.mjs';

test('family age facts remain truthful with exact Mandarin tones and gender',()=>{
 const cases=[
  ['我哥哥五岁。','Wǒ gēge wǔ suì.','你哥哥五岁！他喜欢做什么？'],
  ['我的姐姐十岁','Wǒ de jiějie shí suì.','你姐姐十岁！她喜欢做什么？'],
  ['我的妹妹一岁','Wǒ de mèimei yí suì.','你妹妹一岁！她喜欢做什么？'],
  ['我弟弟三岁','Wǒ dìdi sān suì.','你弟弟三岁！他喜欢做什么？']
 ];
 for(const [input,pinyin,hanzi] of cases){
  const r=reply(input);
  assert(r,'Unrecognized family age: '+input);
  assert.equal(r.spoken.pinyin,pinyin,input);
  assert.equal(r.reply.hanzi,hanzi,input);
  assert.equal(r.spoken.toneVerified,false,input);
  assert(r.reply.pinyin&&r.reply.ru,input);
 }
});
test('having and not having a relative must never be confused',()=>{
 const yes=reply('我有一个哥哥');
 assert.equal(yes.spoken.pinyin,'Wǒ yǒu yí ge gēge.');
 assert.equal(yes.reply.hanzi,'你哥哥几岁？');
 assert.equal(yes.next,'family-age');
 const no=reply('我没有哥哥');
 assert.equal(no.spoken.pinyin,'Wǒ méiyǒu gēge.');
 assert.equal(no.reply.hanzi,'明白了。你家有几口人？');
 assert.equal(no.next,'family-size');
 assert(!no.reply.hanzi.includes('你哥哥几岁'));
 assert.equal(reply('我有妹妹').reply.hanzi,'你妹妹几岁？');
});
test('incomplete 有没有 prompts a clarification, not made-up comprehension',()=>{
 const r=reply('你有没有？');
 assert(r);
 assert.equal(r.spoken.pinyin,null);
 assert.match(r.message,/Вопрос не закончен/);
 assert.match(r.message,/你有没有哥哥/);
 assert.equal(r.reply.hanzi,'你想问什么？');
 assert.equal(r.spoken.toneVerified,false);
});
test('unreviewed ages and relationships stay unknown instead of invented',()=>{
 assert.equal(reply('我哥哥二十岁'),null);
 assert.equal(reply('我有两个哥哥'),null);
 assert.equal(reply('你有没有火箭'),null);
});
