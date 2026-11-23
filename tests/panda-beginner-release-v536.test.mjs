import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {everydayMeaning,friendlyIntroduction} from '../assets/panda-everyday-meaning-v515.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';

const examples=[
 ['不好','Bù hǎo.','怎么了？'],
 ['我不好','Wǒ bù hǎo.','怎么了？'],
 ['非常好','Fēicháng hǎo.','太好了！'],
 ['我非常好','Wǒ fēicháng hǎo.','太好了！'],
 ['很不错，你呢？','Hěn búcuò, nǐ ne?','我也很好，谢谢！'],
 ['我很不错，你呢？','Wǒ hěn búcuò, nǐ ne?','我也很好，谢谢！'],
 ['休息','Xiūxi.','你今天休息吗？'],
 ['你可以说中文','Nǐ kěyǐ shuō Zhōngwén.','可以！我们说中文吧！'],
 ['跑步这么样','Pǎobù zhème yàng?','我喜欢跑步。']
];
test('nine common ASR transcripts have reviewed meaning and a natural Panda reply',()=>{
 for(const [input,pinyin,reply] of examples){
  const r=everydayMeaning(input,1,null);
  assert(r,'Missing beginner meaning: '+input);
  assert.equal(r.spoken[1],pinyin);
  assert.equal(r.reply[0],reply);
  assert.equal(r.context.awaiting!==undefined,true);
  assert(!r.reply.join(' ').includes('我没听懂'));
 }
});
test('nonstop HSK1 answers are available without HSK2 unlock',()=>{
 for(const [input,pinyin,reply] of examples){
  const r=answerLive(input,{allowed:[1],topic:1,curriculum:[]});
  assert.equal(r.kind,'statement');
  assert.equal(r.spoken.pinyin,pinyin);
  assert.equal(r.reply.hanzi,reply);
 }
});
test('uncertain recognition is not labelled a pronunciation error',()=>{
 const r=answerLive('跑步这么样',{allowed:[1],topic:1});
 assert.match(r.message,/可能|Возможно/);
 assert.match(r.message,/怎么样/);
 assert.doesNotMatch(r.message,/ошибка произношения|неправильный тон/);
});
test('published friendly introduction remains intact',()=>{
 const first=friendlyIntroduction('我爱你！',null);
 assert.equal(first.reply[0],'谢谢你！我很开心！你叫什么名字？');
 const second=friendlyIntroduction('我叫小明',first.next);
 assert.equal(second.reply[0],'很高兴认识你！你今天怎么样？');
});
test('worker and offline download include exact updated versions',()=>{
 const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
 const worker=fs.readFileSync('sw.js','utf8');
 const html=fs.readFileSync('panda-voice-pilot.html','utf8');
 assert.equal(pack.version,536);
 assert.match(worker,/chinese-coach-pwa-v536-panda-beginner-dialogue/);
 assert(html.includes('panda-hsk2-preview-core-v1.mjs?v=536'));
 for(const p of ['./assets/panda-hsk2-preview-core-v1.mjs?v=536','./assets/panda-everyday-meaning-v515.mjs?v=536','./assets/panda-live-dialogue-v272.mjs?v=536']){
  assert(pack.files.includes(p),'Offline missing '+p);
  assert(worker.includes(p),'Worker missing '+p);
 }
});
