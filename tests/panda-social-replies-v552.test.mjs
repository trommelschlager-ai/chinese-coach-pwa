import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';

const screenshots=[
  ['你很可爱','Nǐ hěn kě\'ài.','Ты очень милая.','谢谢你！你喜欢熊猫吗？'],
  ['你很漂亮','Nǐ hěn piàoliang.','Ты очень красивая.','谢谢你！你喜欢这里的风景吗？'],
  ['太好了','Tài hǎo le!','Отлично!','太好了！我们继续聊吧！'],
  ['你很酷','Nǐ hěn kù.','Ты очень крутая.','谢谢你！你喜欢我的耳机吗？'],
  ['你太厉害了','Nǐ tài lìhai le.','Ты просто невероятная!','谢谢你！我们一起加油！'],
  ['我不喜欢你','Wǒ bù xǐhuan nǐ.','Ты мне не нравишься.','没关系。你想聊什么？']
];

test('the six Android screenshot inputs are understood instead of the repeating generic fallback',()=>{
 const answers=new Set();
 for(const [input,pinyin,ru,answer] of screenshots){
  const result=respondToNaturalStatement(input);
  assert(result,'Not understood: '+input);
  assert.equal(result.spoken.hanzi,input);
  assert.equal(result.spoken.pinyin,pinyin,input);
  assert.equal(result.spoken.translation,ru,input);
  assert.equal(result.reply.hanzi,answer,input);
  assert(result.reply.pinyin&&result.reply.ru,'No learner-facing explanation: '+input);
  assert.equal(result.spoken.toneVerified,false,'ASR text does not validate tones: '+input);
  assert.notEqual(result.reply.hanzi,'你能说得简单一点吗？',input);
  assert.equal(result.next,null,'Do not lock conversation into an unrelated topic: '+input);
  answers.add(answer);
 }
 assert.equal(answers.size,6,'Different intents must not receive the same canned reply');
});

test('punctuation, natural compliment variants and prior follow-up context are handled',()=>{
 for(const input of ['你很可爱！','你真可爱。','你真漂亮！','你真酷！','你太棒了！','太好了！']){
  const reply=respondToNaturalStatement(input,{awaiting:'job-liking'});
  assert(reply?.reply?.hanzi,'Not understood: '+input);
  assert(reply.spoken.pinyin,'No pinyin: '+input);
 }
});

test('unreviewed language is not misclassified as a compliment',()=>{
 for(const input of ['你很危险','你很难','太难了','你有很多钱']){
  assert.equal(respondToNaturalStatement(input),null,input);
 }
});

test('approved 我爱你 introduction is still routed to its existing reviewed response',()=>{
 assert.equal(respondToNaturalStatement('我爱你'),null);
 assert.equal(respondToNaturalStatement('我爱你',{introduced:true}).reply.hanzi,'谢谢你！我很开心！');
 const intro=readFileSync(new URL('../assets/panda-everyday-meaning-v515.mjs',import.meta.url),'utf8');
 assert(intro.includes("if(text==='我爱你')"),'Do not overwrite approved introductory audio/dialogue');
});

test('Android Panda AI conversation routes natural replies before the generic HSK2 fallback',()=>{
 const core=readFileSync(new URL('../assets/panda-hsk2-preview-core-v1.mjs',import.meta.url),'utf8');
 const natural=core.indexOf('respondToNaturalStatement(input,{awaiting:state.naturalAwaiting})');
 const fallback=core.indexOf('if(hsk2){submitHSK2(input);return;}');
 assert(natural>=0&&fallback>natural,'Natural answer route must precede HSK2 unknown fallback');
 assert(core.includes('say(natural.reply,!!lookupPandaVoiceClip(natural.reply.hanzi))'),
  'Exact approved voice only; no TTS for new compliments');
});
