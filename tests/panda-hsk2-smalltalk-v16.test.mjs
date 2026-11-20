import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToPandaChat as respond} from '../assets/panda-hsk2-smalltalk-v16.mjs';

const cases=[
 ['你喜欢什么？',true,'我喜欢学中文'],
 ['你喜欢做什么?',true,'我喜欢学中文'],
 ['你喜欢吃什么？',true,'我喜欢吃竹子'],
 ['你叫什么名字？',true,'我叫熊猫'],
 ['你住在哪里？',true,'我住在山里'],
 ['你在做什么？',true,'我在跟你聊天'],
 ['你会说中文吗？',true,'我会说中文'],
 ['你好吗？',true,'我很好'],
 ['你今天怎么样？',true,'我很好'],
 ['你那里天气怎么样？',true,'我不知道'],
 ['你好',true,'你好'],
 ['我喜欢音乐',true,'真好'],
 ['我不喜欢咖啡',true,'我知道了'],
 ['我叫安东',true,'你好'],
 ['我早上不吃早饭',true,'明白了'],
 ['音乐',true,'真好'],
 ['你喜欢什么音乐？',true,'我喜欢学中文'],
 ['你几岁？',true,'我的年龄'],
 ['谢谢',true,'不客气'],
 ['谁是秦始皇？',false,'这个问题'],
 ['今天天气怎么样？',false,'这个问题']
];

test('Panda answers 19 beginner conversation intents and rejects unsupported facts',()=>{
 for(const [sentence,supported,expectedHanZi] of cases){
  const result=respond(sentence);
  assert.equal(result.supported,supported,sentence);
  assert.match(result.line[0],new RegExp(expectedHanZi),sentence);
  assert.equal(result.line.length,3,sentence);
  assert.ok(result.line[1].length>3,sentence+' lacks pinyin');
  assert.ok(result.line[2].length>3,sentence+' lacks Russian');
 }
});

test('Simple conversation follows up without a backend, invented weather or voice claims',()=>{
 const first=respond('你喜欢什么？');
 assert.equal(first.context.awaiting,'likes');
 const next=respond('音乐',first.context);
 assert.equal(next.context.awaiting,'likes');
 assert.ok(next.context.turn>first.context.turn);
 const unknown=respond('明天阿姆斯特丹下雨吗？',next.context);
 assert.equal(unknown.supported,false);
 assert.ok(!unknown.line[0].includes('会下雨'));
 assert.ok(!('toneVerified' in first));
 assert.ok(!('voiceSource' in first));
});
