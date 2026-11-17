import assert from 'node:assert/strict';
import {PANDA_GRAMMAR_CASES_V1,correctPandaGrammarV1} from '../assets/panda-grammar-hsk12-v1.mjs';
assert.equal(PANDA_GRAMMAR_CASES_V1.length,50);
for(const row of PANDA_GRAMMAR_CASES_V1){
 const c=correctPandaGrammarV1(' '+row.wrong+'。 ');
 assert.equal(c?.spoken?.correction?.hanzi,row.hanzi,row.id);
 assert.equal(c?.spoken?.correction?.ruleId,row.id,row.id);
 assert.ok(c?.spoken?.correction?.why,row.id);
}
for(const valid of ['我有两个哥哥','你叫什么名字','你是不是老师','我在北京住','我七点起床','我很喜欢喝茶','我没有去过中国','你有没有哥哥','你好','我叫小明']){
 assert.equal(correctPandaGrammarV1(valid),null,'must not flag '+valid);
}
assert.equal(correctPandaGrammarV1('你几岁吗',{confidence:.72}).spoken.correction.uncertain,true);
assert.equal(correctPandaGrammarV1('你几岁吗',{confidence:.94}).spoken.correction.uncertain,undefined);
console.log('Panda grammar: 50 positive + 10 negative + confidence tests passed');
