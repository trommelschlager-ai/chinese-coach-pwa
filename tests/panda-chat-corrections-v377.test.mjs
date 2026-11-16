import assert from 'node:assert/strict';
import {correctCommonPhrase} from '../assets/panda-chat-corrections-v377.mjs';

const good=[
 ['我不有钱。','我没有钱。','Wǒ méiyǒu qián.','У меня нет денег.'],
 ['我不有时间','我没有时间。','Wǒ méiyǒu shíjiān.','У меня нет времени.'],
 ['他不有朋友','他没有朋友。','Tā méiyǒu péngyou.','У него нет друзей.'],
 ['她不有工作','她没有工作。','Tā méiyǒu gōngzuò.','У неё нет работы.'],
 ['你不有车','你没有车。','Nǐ méiyǒu chē.','У тебя нет машины.']
];
for(const [input,hanzi,pinyin,ru] of good){
 const result=correctCommonPhrase(input);
 assert.equal(result?.kind,'correction',input);
 assert.equal(result?.spoken?.probable,ru,input);
 assert.equal(result?.spoken?.correction?.hanzi,hanzi,input);
 assert.equal(result?.spoken?.correction?.pinyin,pinyin,input);
 assert.equal(result?.spoken?.correction?.ru,ru,input);
}
for(const input of ['我没有钱','我不有手机','我有钱','你叫什么名字','我不有钱吗','他很忙']){
 assert.equal(correctCommonPhrase(input),null,'Unknown/correct phrase should not be fabricated: '+input);
}
console.log('Panda AI grammar correction tests passed: '+(good.length+6));
