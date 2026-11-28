import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseWellbeing,respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const groups=[
 {
  "answer": [
   "我很好，谢谢！你呢？",
   "Wǒ hěn hǎo, xièxie! Nǐ ne?",
   "Хорошо, спасибо! А ты?"
  ],
  "rows": [
   [
    "你今天感觉好吗",
    "Nǐ jīntiān gǎnjué hǎo ma?",
    "Ты сегодня хорошо себя чувствуешь?"
   ],
   [
    "你现在感觉怎么样",
    "Nǐ xiànzài gǎnjué zěnmeyàng?",
    "Как ты сейчас себя чувствуешь?"
   ],
   [
    "你最近感觉怎么样",
    "Nǐ zuìjìn gǎnjué zěnmeyàng?",
    "Как ты себя чувствуешь в последнее время?"
   ],
   [
    "你今天身体好吗",
    "Nǐ jīntiān shēntǐ hǎo ma?",
    "Как твоё здоровье сегодня?"
   ],
   [
    "你身体好不好",
    "Nǐ shēntǐ hǎo bu hǎo?",
    "У тебя хорошее самочувствие?"
   ],
   [
    "你最近身体还好吗",
    "Nǐ zuìjìn shēntǐ hái hǎo ma?",
    "Ты хорошо себя чувствуешь в последнее время?"
   ]
  ]
 },
 {
  "answer": [
   "没有，我是虚拟熊猫。",
   "Méiyǒu, wǒ shì xūnǐ xióngmāo.",
   "Нет, я виртуальная панда."
  ],
  "rows": [
   [
    "你生病了没有",
    "Nǐ shēngbìng le méiyǒu?",
    "Ты заболел(а)?"
   ],
   [
    "你有没有生病",
    "Nǐ yǒu méiyǒu shēngbìng?",
    "Ты заболел(а)?"
   ],
   [
    "你是不是生病了",
    "Nǐ shì bu shì shēngbìng le?",
    "Ты случайно не заболел(а)?"
   ],
   [
    "你今天生病了吗",
    "Nǐ jīntiān shēngbìng le ma?",
    "Ты сегодня заболел(а)?"
   ]
  ]
 },
 {
  "answer": [
   "不累。你呢？",
   "Bú lèi. Nǐ ne?",
   "Не устала. А ты?"
  ],
  "rows": [
   [
    "你今天累吗",
    "Nǐ jīntiān lèi ma?",
    "Ты сегодня устал(а)?"
   ],
   [
    "你现在累吗",
    "Nǐ xiànzài lèi ma?",
    "Ты сейчас устал(а)?"
   ],
   [
    "你今天累不累",
    "Nǐ jīntiān lèi bu lèi?",
    "Ты сегодня устал(а)?"
   ],
   [
    "你现在累不累",
    "Nǐ xiànzài lèi bu lèi?",
    "Ты сейчас устал(а)?"
   ]
  ]
 }
];
const statements=[
 [
  "我身体不舒服",
  "Wǒ shēntǐ bù shūfu.",
  "Я плохо себя чувствую."
 ],
 [
  "我感觉不舒服",
  "Wǒ gǎnjué bù shūfu.",
  "Я плохо себя чувствую."
 ],
 [
  "我今天感觉不舒服",
  "Wǒ jīntiān gǎnjué bù shūfu.",
  "Я сегодня плохо себя чувствую."
 ],
 [
  "我有点儿不舒服",
  "Wǒ yǒudiǎnr bù shūfu.",
  "Я немного плохо себя чувствую."
 ],
 [
  "我心情不好",
  "Wǒ xīnqíng bù hǎo.",
  "У меня плохое настроение."
 ],
 [
  "我今天心情不好",
  "Wǒ jīntiān xīnqíng bù hǎo.",
  "У меня сегодня плохое настроение."
 ],
 [
  "我今天不太开心",
  "Wǒ jīntiān bú tài kāixīn.",
  "Я сегодня не очень рад(а)."
 ],
 [
  "我有点儿难过",
  "Wǒ yǒudiǎnr nánguò.",
  "Мне немного грустно."
 ]
];
test('14 wellbeing questions and polite variants resolve to approved recordings',()=>{
 for(const g of groups){
  assert(lookupApprovedPandaVoice(g.answer[0])?.src,g.answer[0]);
  for(const [q] of g.rows)for(const text of [q+'？','请问，'+q+'？']){
   const x=respondToCourseWellbeing(text);assert.equal(x?.reply.hanzi,g.answer[0],text);
   assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
   assert(x.spoken.pinyin&&x.spoken.translation,text);
   assert.equal(respondToNaturalStatement(text)?.reply.hanzi,g.answer[0],text);
  }
 }
});
test('8 symptom or mood statements ask a neutral question, not a diagnosis',()=>{
 const answer="怎么了？你想说说吗？";
 assert(lookupApprovedPandaVoice(answer)?.src);
 for(const [q] of statements){
  const x=respondToCourseWellbeing(q+'。');assert.equal(x?.reply.hanzi,answer,q);
  assert.equal(x.kind,'statement');assert.equal(x.spoken.toneVerified,false);
  assert(x.message.includes('не медицинская оценка'));
 }
});
test('unrelated, ambiguous and existing canonical forms are not intercepted',()=>{
 for(const q of ['你身体怎么样？','你心情好吗？','你累不累？','我很累。','我头疼。','你妈妈生病了吗？','你想休息吗？','生病','请问','我身体很好。'])assert.equal(respondToCourseWellbeing(q),null,q);
});