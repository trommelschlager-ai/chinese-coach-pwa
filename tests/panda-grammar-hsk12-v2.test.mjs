import assert from 'node:assert/strict';
import test from 'node:test';
import {PANDA_GRAMMAR_CASES_V1,correctPandaGrammarV1} from '../assets/panda-grammar-hsk12-v1.mjs';
import {PANDA_GRAMMAR_TEMPLATES_V2,PANDA_GRAMMAR_VARIANT_COUNT_V2,correctPandaGrammarV2} from '../assets/panda-grammar-hsk12-v2.mjs';

test('previous 50 verified example corrections remain intact',()=>{
 assert.equal(PANDA_GRAMMAR_CASES_V1.length,50);
 for(const row of PANDA_GRAMMAR_CASES_V1){
  const result=correctPandaGrammarV2(row.wrong+'。');
  assert.equal(result?.spoken?.correction?.hanzi,row.hanzi,row.id);
  assert.equal(result?.spoken?.correction?.ruleId,row.id,row.id);
  assert.deepEqual(result,correctPandaGrammarV1(row.wrong+'。'));
 }
});

test('45 reviewed templates expand to hundreds of whitelisted variants',()=>{
 assert.equal(PANDA_GRAMMAR_TEMPLATES_V2.length,45);
 assert.equal(new Set(PANDA_GRAMMAR_TEMPLATES_V2.map(r=>r.id)).size,45);
 assert.ok(PANDA_GRAMMAR_VARIANT_COUNT_V2>400,'Expected >400 safe generated variants');
});

const examples=[
 ['她叫什么名字吗','她叫什么名字？','P01'],
 ['他是谁吗','他是谁？','P02'],
 ['她几岁吗','她几岁？','P03'],
 ['我住在哪里吗','我住在哪里？','P05'],
 ['他喜欢什么吗','他喜欢什么？','P07'],
 ['你有几个姐姐吗','你有几个姐姐？','P11'],
 ['她做什么工作吗','她做什么工作？','P12'],
 ['她是不是医生吗','她是不是医生？','P13'],
 ['他有没有弟弟吗','他有没有弟弟？','P14'],
 ['你会不会游泳吗','你会不会游泳？','P15'],
 ['她去不去学校吗','她去不去学校？','P16'],
 ['他想不想学中文吗','他想不想学中文？','P17'],
 ['她没是医生','她不是医生。','P18'],
 ['他不有时间','他没有时间。','P19'],
 ['你叫是安娜','你叫安娜。','P20'],
 ['她姓是李','她姓李。','P21'],
 ['他有二个妹妹','他有两个妹妹。','P22'],
 ['你有二本书','你有两本书。','P23'],
 ['她有一个书','她有一本书。','P24'],
 ['他有一个猫','他有一只猫。','P25'],
 ['这里有三个狗','这里有三只狗。','P26'],
 ['他喝了二杯咖啡','他喝了两杯咖啡。','P27'],
 ['她住广州在','她住在广州。','P28'],
 ['他上海想去','他想去上海。','P29'],
 ['你会中文说','你会说中文。','P30'],
 ['她想中文学','她想学中文。','P31'],
 ['他每天中文学','他每天学中文。','P32'],
 ['她学习在公司中文','她在公司学中文。','P33'],
 ['你吃在家饭','你在家吃饭。','P34'],
 ['她起床八点','她八点起床。','P35'],
 ['你睡觉晚上九点','你晚上九点睡觉。','P36'],
 ['他去上班七点','他七点去上班。','P37'],
 ['她吃早饭早上','她早上吃早饭。','P38'],
 ['你每天起床六点','你每天六点起床。','P39'],
 ['他比她很高','他比她高。','P40'],
 ['我比矮他','我比他矮。','P41'],
 ['她喜欢很看电影','她很喜欢看电影。','P42'],
 ['你喜欢非常牛肉面','你非常喜欢牛肉面。','P43'],
 ['他和一起妈妈去','他和妈妈一起去。','P44'],
 ['她跟一起爸爸吃饭','她跟爸爸一起吃饭。','P45']
];
test('all ten grammar groups and new slot values produce deterministic output',()=>{
 for(const [input,expected,id] of examples){
  const result=correctPandaGrammarV2(' '+input+'。 ');
  assert.equal(result?.spoken?.correction?.hanzi,expected,input);
  assert.equal(result?.spoken?.correction?.ruleId,id,input);
  const c=result.spoken.correction;
  assert.ok(c.pinyin?.length>3,input);
  assert.ok(c.ru?.length>3,input);
  assert.ok(c.why?.length>12,input);
  assert.doesNotMatch(c.pinyin+c.ru,/\{[A-Za-z]/,input);
 }
});
test('no false flags for valid phrases, unsupported words or numbers',()=>{
 for(const input of [
  '你叫什么名字？','我叫小明','她叫安娜','他是医生','他不是医生',
  '她没有时间','我有两个哥哥','他有三个朋友','他有两本书',
  '我有二十个朋友','现在几点？','今天星期几？','你住在哪里？',
  '她是不是医生？','他有没有弟弟？','你会不会游泳？',
  '你想不想喝茶？','你会说中文吗？','我比你高','她比我矮',
  '我在上海住','我七点起床','我每天学中文','你和妈妈一起去',
  '你吃饭了吗？','我早上吃饭','我有两只猫','我想学德语',
  '我喜欢咖啡','你好','谢谢','我二十岁'
 ]){
  assert.equal(correctPandaGrammarV2(input),null,'False flag: '+input);
 }
});
test('low confidence is explicitly uncertain, and no acoustic tone claim',()=>{
 const low=correctPandaGrammarV2('她住广州在',{confidence:.6,prompt:{lesson:2}});
 assert.equal(low.lesson,2);
 assert.equal(low.spoken.correction.uncertain,true);
 assert.match(low.spoken.correction.why,/браузер мог ослышаться/);
 const high=correctPandaGrammarV2('她住广州在',{confidence:.95});
 assert.equal(high.spoken.correction.uncertain,undefined);
 assert.equal(correctPandaGrammarV2('你好',{confidence:.2}),null);
});
