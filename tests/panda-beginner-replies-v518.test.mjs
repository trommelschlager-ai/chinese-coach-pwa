import test from 'node:test';
import assert from 'node:assert/strict';
import {replyHSK2,knownHSK2} from '../assets/panda-hsk2-brain-v1.mjs';
import {answerLive} from '../assets/panda-live-dialogue-v272.mjs';

// Real Android screenshots, 23 Nov 2026. Mandarin text is examined;
// microphone tone accuracy cannot be inferred from a transcript.
const cases=[
 ['不好','Bù hǎo.','Плохо.','怎么了？'],
 ['非常好','Fēicháng hǎo.','Очень хорошо.','太好了！'],
 ['很不错你呢','Hěn búcuò, nǐ ne?','Довольно хорошо, а у тебя?','我也很好，谢谢！'],
 ['休息','Xiūxi.','Отдыхать.','你今天休息吗？'],
 ['跑步这么样','Pǎobù zhème yàng?','Вероятно: «Как насчёт бега?»','我喜欢跑步。'],
 ['你可以说中文','Nǐ kěyǐ shuō Zhōngwén.','Ты можешь говорить по-китайски','可以！我们说中文吧！']
];
test('HSK2 understands six Android phrases instead of generic misunderstandings',()=>{
 for(const [hanzi,pinyin,translation,answer] of cases){
  const result=replyHSK2(hanzi,101,0,false,{awaiting:'origin'});
  assert.equal(result.kind,'social',hanzi);
  assert.equal(result.spoken.hanzi,hanzi,hanzi+' original transcription must remain');
  assert.equal(result.spoken.pinyin,pinyin,hanzi);
  assert.ok(result.spoken.ru.includes(translation),hanzi);
  assert.equal(result.line.hanzi,answer,hanzi);
  assert.ok(result.line.pinyin,hanzi+' Panda reply has pinyin');
  assert.ok(result.line.ru,hanzi+' Panda reply has Russian');
  assert.ok(!/我没听懂|你可以用简单一点/.test(result.line.hanzi),hanzi);
  assert.equal(knownHSK2(hanzi)?.pinyin,pinyin,hanzi);
 }
});
test('HSK1 non-stop applies the same responses without unlocking lessons',()=>{
 for(const [hanzi,pinyin,translation,answer] of cases){
  const result=answerLive(hanzi,{allowed:[1],topic:1,turn:1});
  assert.equal(result.kind,'statement',hanzi);
  assert.equal(result.spoken.hanzi,hanzi);
  assert.equal(result.spoken.known,true,hanzi);
  assert.equal(result.spoken.pinyin,pinyin,hanzi);
  assert.ok(result.spoken.translation.includes(translation),hanzi);
  assert.equal(result.reply.hanzi,answer,hanzi);
  assert.equal(result.followup,null,hanzi+' must not jump to an unrelated lesson');
  assert.equal('toneVerified' in result.spoken,false);
 }
});
test('Question with possible Android recognition error remains explicitly uncertain',()=>{
 for(const f of [()=>replyHSK2('跑步这么样',101,0),()=>answerLive('跑步这么样',{allowed:[1],topic:1})]){
  const reply=f();
  assert.match(reply.coachNote||reply.explanation,/可能|Возможно|распознавание/i);
  assert.match(reply.coachNote||reply.explanation,/跑步怎么样/);
 }
});
test('Unknown words are not reclassified as understood',()=>{
 const result=answerLive('一只看不见的麒麟在哪里',{allowed:[1],topic:1});
 assert.notEqual(result.kind,'statement');
 const hsk2=replyHSK2('一只看不见的麒麟在哪里',101,0);
 assert.equal(hsk2.kind,'unknown');
});
