import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v542.mjs';
test('recognizes 我是老师 with tone-marked pinyin',()=>{
 const r=reply('我是老师。');
 assert.equal(r.spoken.pinyin,'Wǒ shì lǎoshī.');
 assert.equal(r.reply.hanzi,'你是老师！你在哪儿工作？');
 assert.equal(r.next,'work-place');
 assert.equal(r.spoken.toneVerified,false);
});
test('replies to a linked workplace answer',()=>{
 const r=reply('我在学校工作');
 assert.equal(r.spoken.pinyin,'Wǒ zài xuéxiào gōngzuò.');
 assert.equal(r.reply.pinyin,'Nǐ xǐhuan nǐ de gōngzuò ma?');
 assert.equal(reply('喜欢',{awaiting:r.next}).reply.hanzi,'太好了！你工作忙吗？');
});
test('negation uses correct 不 sandhi',()=>{
 const r=reply('我不是学生');
 assert.equal(r.spoken.pinyin,'Wǒ bú shì xuésheng.');
});
test('unknown Chinese names never get fabricated pinyin',()=>{
 const r=reply('我叫米沙');
 assert.equal(r.spoken.pinyin,null);
});
test('does not make unreviewed sentences into known speech',()=>{
 for(const s of ['你是老师吗？','我在外国语学院教书','我是老师你呢','我今天讲课了'])
 assert.equal(reply(s),null);
});
test('free hobby statements work as well as questions',()=>{
 assert.equal(reply('我喜欢跑步。').reply.hanzi,'你经常跑步吗？');
 assert.equal(reply('我不喜欢喝咖啡').spoken.pinyin,'Wǒ bù xǐhuan hē kāfēi.');
});
