import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v552.mjs';

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
  assert.match(r.spoken.translation,/^Моему |^Моей /,input);
  assert(!r.reply.ru.includes('哥哥'),input);
  assert.equal(r.reply.hanzi,hanzi,input);
  assert.equal(r.spoken.toneVerified,false,input);
  assert(r.reply.pinyin&&r.reply.ru,input);
 }
});
test('having and not having a relative must never be confused',()=>{
 const yes=reply('我有一个哥哥');
 assert.equal(yes.spoken.pinyin,'Wǒ yǒu yí ge gēge.');
 assert.equal(yes.reply.hanzi,'你哥哥几岁？');
 assert.equal(yes.spoken.translation,'У меня есть один старший брат.');
 assert.equal(reply('我有一个姐姐').spoken.translation,'У меня есть одна старшая сестра.');
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
test('40 reviewed family turns carry pinyin and translations',()=>{
 const cases=[
  ['我哥哥二十岁','你哥哥二十岁！他喜欢做什么？','Wǒ gēge èrshí suì.'],
  ['我姐姐21岁','你姐姐二十一岁！她喜欢做什么？','Wǒ jiějie èrshíyī suì.'],
  ['我妈妈四十四岁','你妈妈四十四岁！她喜欢做什么？','Wǒ māma sìshísì suì.'],
  ['我的爸爸六十岁','你爸爸六十岁！他喜欢做什么？','Wǒ de bàba liùshí suì.'],
  ['我爷爷七十岁','你爷爷七十岁！他喜欢做什么？','Wǒ yéye qīshí suì.'],
  ['我奶奶99岁','你奶奶九十九岁！她喜欢做什么？','Wǒ nǎinai jiǔshíjiǔ suì.'],
  ['我弟弟十一岁','你弟弟十一岁！他喜欢做什么？','Wǒ dìdi shíyī suì.'],
  ['我妹妹三岁','你妹妹三岁！她喜欢做什么？','Wǒ mèimei sān suì.'],
  ['我有两个哥哥','他们多大了？','Wǒ yǒu liǎng ge gēge.'],
  ['我有三个姐姐','她们多大了？','Wǒ yǒu sān ge jiějie.'],
  ['我有四个弟弟','他们多大了？','Wǒ yǒu sì ge dìdi.'],
  ['我有五个妹妹','她们多大了？','Wǒ yǒu wǔ ge mèimei.'],
  ['我有两个孩子','他们多大了？','Wǒ yǒu liǎng ge háizi.'],
  ['我有三个孩子','他们多大了？','Wǒ yǒu sān ge háizi.'],
  ['我有孩子','你有几个孩子？','Wǒ yǒu háizi.'],
  ['我没有孩子','你家有几口人？','Wǒ méiyǒu háizi.'],
  ['我结婚了','你们结婚多久了？','Wǒ jiéhūn le.'],
  ['我离婚了','明白了。你想聊什么？','Wǒ líhūn le.'],
  ['我一个人住','你住在哪里？','Wǒ yí ge rén zhù.'],
  ['我跟家人一起住','你们周末喜欢做什么？','Wǒ gēn jiārén yìqǐ zhù.'],
  ['我家有一口人','你跟家人一起住吗？','Wǒ jiā yǒu yì kǒu rén.'],
  ['我家有两口人','你跟家人一起住吗？','Wǒ jiā yǒu liǎng kǒu rén.'],
  ['我家里有三口人','你跟家人一起住吗？','Wǒ jiālǐ yǒu sān kǒu rén.'],
  ['我家有四口人','你跟家人一起住吗？','Wǒ jiā yǒu sì kǒu rén.'],
  ['我家有五口人','你跟家人一起住吗？','Wǒ jiā yǒu wǔ kǒu rén.'],
  ['我家有十口人','你跟家人一起住吗？','Wǒ jiā yǒu shí kǒu rén.'],
  ['我有一个哥哥','你哥哥几岁？','Wǒ yǒu yí ge gēge.'],
  ['我有一个姐姐','你姐姐几岁？','Wǒ yǒu yí ge jiějie.'],
  ['我有弟弟','你弟弟几岁？','Wǒ yǒu dìdi.'],
  ['我有妹妹','你妹妹几岁？','Wǒ yǒu mèimei.'],
  ['我没有哥哥','明白了。你家有几口人？','Wǒ méiyǒu gēge.'],
  ['我没有姐姐','明白了。你家有几口人？','Wǒ méiyǒu jiějie.'],
  ['我没有弟弟','明白了。你家有几口人？','Wǒ méiyǒu dìdi.'],
  ['我没有妹妹','明白了。你家有几口人？','Wǒ méiyǒu mèimei.'],
  ['你有没有哥哥','我有一个哥哥。','Nǐ yǒu méiyǒu gēge?'],
  ['你有没有姐姐','我没有姐姐。','Nǐ yǒu méiyǒu jiějie?'],
  ['你有没有弟弟','我没有弟弟。','Nǐ yǒu méiyǒu dìdi?'],
  ['你有没有妹妹','我有一个妹妹。','Nǐ yǒu méiyǒu mèimei?'],
  ['她二十二岁','你姐姐二十二岁！她喜欢做什么？','Tā èrshí’èr suì.',reply('我有一个姐姐').context],
  ['三口人','你跟家人一起住吗？','sān kǒu rén.',reply('我没有孩子').next]
 ];
 assert.equal(cases.length,40);
 for(const [input,hanzi,pinyin,awaiting] of cases){
  const response=reply(input,{awaiting});
  assert(response,input);
  assert.equal(response.reply.hanzi,hanzi,input);
  assert.equal(response.spoken.pinyin,pinyin,input);
  assert(response.spoken.translation&&response.reply.pinyin&&response.reply.ru,input);
  assert.equal(response.spoken.toneVerified,false,input);
 }
 assert.equal(reply('我有两个哥哥').spoken.translation,'У меня 2 старших брата.');
 assert.equal(reply('我姐姐21岁').spoken.translation,'Моей старшей сестре 21 год.');
 assert.equal(reply('我弟弟十一岁').spoken.translation,'Моему младшему брату 11 лет.');
 assert.equal(reply('我家有四口人').spoken.translation,'В моей семье 4 человека.');
 assert.equal(reply('二十二岁'),null);
 assert.equal(reply('三口人'),null);
 assert.equal(reply('你有没有火箭'),null);
});

test('有没有 has reviewed consistent Panda family facts without intercepting 你有…吗',()=>{
 for(const [relative,answer] of [['哥哥','我有一个哥哥。'],['姐姐','我没有姐姐。'],['弟弟','我没有弟弟。'],['妹妹','我有一个妹妹。']]){
  const a=reply('你有没有'+relative+'？');
  assert(a,'unrecognized '+relative);
  assert.equal(a.kind,'question');
  assert.equal(a.reply.hanzi,answer);
  assert.equal(a.spoken.toneVerified,false);
  assert(a.spoken.pinyin.includes('yǒu méiyǒu'));
  assert.equal(reply('你有'+relative+'吗？'),null,'Legacy lesson question must not be hijacked');
 }
});
test('main conversation defers legacy family answers to existing HSK1 Non-Stop audio',()=>{
 const core=readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 assert(core.includes("const legacyFamilyAnswer=!hsk2&&state.mode==='nonstop'"));
 assert(core.includes("const natural=legacyFamilyAnswer?null:respondToNaturalStatement"));
 assert(core.includes('state.naturalAwaiting=natural.context??natural.next'));
});

test('children count and ages continue naturally without inventing gender',()=>{
 const start=reply('我有孩子');
 const count=reply('一个',{awaiting:start.next});
 assert.equal(count.spoken.translation,'У меня один ребёнок.');
 assert.equal(count.reply.hanzi,'你的孩子多大了？');
 assert.equal(reply('七岁',{awaiting:count.context}).reply.hanzi,'你的孩子喜欢做什么？');
 const two=reply('我有两个孩子');
 const ages=reply('一个五岁，一个七岁',{awaiting:two.context});
 assert.equal(ages.spoken.pinyin,'Yí ge wǔ suì, yí ge qī suì.');
 assert.equal(ages.spoken.translation,'Одному 5 лет, другому 7 лет.');
 assert.equal(reply('一个五岁',{awaiting:two.context}),null);
 assert.equal(reply('我有一个孩子').reply.hanzi,count.reply.hanzi);
 assert.equal(reply('一个'),null);
});
