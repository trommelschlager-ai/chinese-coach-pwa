import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseRoutineQuestion,respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const groups=[
 {
  "answer": [
   "我没有固定的起床时间。你几点起床？",
   "Wǒ méiyǒu gùdìng de qǐchuáng shíjiān. Nǐ jǐ diǎn qǐchuáng?",
   "У меня нет фиксированного времени подъёма. А ты во сколько встаёшь?"
  ],
  "rows": [
   [
    "你早上几点起床",
    "Nǐ zǎoshang jǐ diǎn qǐchuáng?",
    "Во сколько ты встаёшь утром?"
   ],
   [
    "你一般几点起床",
    "Nǐ yìbān jǐ diǎn qǐchuáng?",
    "Во сколько ты обычно встаёшь?"
   ],
   [
    "你通常几点起床",
    "Nǐ tōngcháng jǐ diǎn qǐchuáng?",
    "Во сколько ты обычно встаёшь?"
   ],
   [
    "你什么时候起床",
    "Nǐ shénme shíhou qǐchuáng?",
    "Когда ты встаёшь?"
   ]
  ]
 },
 {
  "answer": [
   "我没有固定的睡觉时间。你呢？",
   "Wǒ méiyǒu gùdìng de shuìjiào shíjiān. Nǐ ne?",
   "У меня нет фиксированного времени сна. А у тебя?"
  ],
  "rows": [
   [
    "你一般几点睡觉",
    "Nǐ yìbān jǐ diǎn shuìjiào?",
    "Во сколько ты обычно ложишься спать?"
   ],
   [
    "你通常几点睡觉",
    "Nǐ tōngcháng jǐ diǎn shuìjiào?",
    "Во сколько ты обычно ложишься спать?"
   ],
   [
    "你每天几点睡觉",
    "Nǐ měitiān jǐ diǎn shuìjiào?",
    "Во сколько ты каждый день ложишься спать?"
   ],
   [
    "你什么时候睡觉",
    "Nǐ shénme shíhou shuìjiào?",
    "Когда ты ложишься спать?"
   ]
  ]
 },
 {
  "answer": [
   "我早上不吃早饭。",
   "Wǒ zǎoshang bù chī zǎofàn.",
   "Я не завтракаю утром."
  ],
  "rows": [
   [
    "你吃早饭了没有",
    "Nǐ chī zǎofàn le méiyǒu?",
    "Ты уже позавтракал(а)?"
   ],
   [
    "你吃没吃早饭",
    "Nǐ chī méi chī zǎofàn?",
    "Ты позавтракал(а)?"
   ],
   [
    "你今天吃早饭了吗",
    "Nǐ jīntiān chī zǎofàn le ma?",
    "Ты сегодня уже позавтракал(а)?"
   ],
   [
    "你吃早餐了吗",
    "Nǐ chī zǎocān le ma?",
    "Ты уже позавтракал(а)?"
   ]
  ]
 },
 {
  "answer": [
   "我今天和你练习中文。",
   "Wǒ jīntiān hé nǐ liànxí Zhōngwén.",
   "Сегодня я практикую китайский с тобой."
  ],
  "rows": [
   [
    "你今天干了什么",
    "Nǐ jīntiān gàn le shénme?",
    "Что ты сегодня делал(а)?"
   ],
   [
    "你今天都做了些什么",
    "Nǐ jīntiān dōu zuò le xiē shénme?",
    "Что ты сегодня делал(а)?"
   ],
   [
    "今天你做了什么",
    "Jīntiān nǐ zuò le shénme?",
    "Что ты сегодня делал(а)?"
   ]
  ]
 },
 {
  "answer": [
   "今天我有空，可以聊聊天。",
   "Jīntiān wǒ yǒu kòng, kěyǐ liáo liáotiān.",
   "Сегодня я свободна, можем поболтать."
  ],
  "rows": [
   [
    "你今天有没有空",
    "Nǐ jīntiān yǒu méiyǒu kòng?",
    "У тебя сегодня есть свободное время?"
   ],
   [
    "你今天有时间吗",
    "Nǐ jīntiān yǒu shíjiān ma?",
    "У тебя сегодня есть время?"
   ],
   [
    "今天你忙不忙",
    "Jīntiān nǐ máng bu máng?",
    "Ты сегодня занят(а)?"
   ]
  ]
 },
 {
  "answer": [
   "不用，谢谢你。",
   "Bú yòng, xièxie nǐ.",
   "Не нужно, спасибо."
  ],
  "rows": [
   [
    "你需要休息一下吗",
    "Nǐ xūyào xiūxi yíxià ma?",
    "Тебе нужно немного отдохнуть?"
   ],
   [
    "你要不要休息一下",
    "Nǐ yào bu yào xiūxi yíxià?",
    "Тебе не хочется немного отдохнуть?"
   ],
   [
    "你要休息吗",
    "Nǐ yào xiūxi ma?",
    "Тебе нужно отдохнуть?"
   ]
  ]
 }
];
test('reviewed routine paraphrases reuse exact virtual-character voice answers',()=>{
 for(const g of groups){
  assert(lookupApprovedPandaVoice(g.answer[0])?.src,g.answer[0]);
  for(const [q] of g.rows)for(const text of [q+'？','请问，'+q+'？']){
   const x=respondToCourseRoutineQuestion(text);
   assert.equal(x?.reply.hanzi,g.answer[0],text);
   assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
   assert(x.spoken.pinyin&&x.spoken.translation,text);
   assert.equal(respondToNaturalStatement(text)?.reply.hanzi,g.answer[0],text);
  }
 }
});
test('learner facts, incomplete phrases and canonical questions retain their existing handling',()=>{
 for(const q of ['我每天七点起床。','我今天没吃早饭。','我想睡觉。','我需要休息。','几点','早饭','你几点起床？','你几点睡觉？','你明天几点起床？','你妈妈几点起床？'])assert.equal(respondToCourseRoutineQuestion(q),null,q);
});