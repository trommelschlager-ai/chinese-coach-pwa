import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseWorkStudyQuestion,respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const groups=[
 {
  "canonical": "你做什么工作",
  "answer": "我是老师。",
  "rows": [
   [
    "你是做什么工作的",
    "Nǐ shì zuò shénme gōngzuò de?",
    "Кем ты работаешь?"
   ],
   [
    "你做什么的",
    "Nǐ zuò shénme de?",
    "Чем ты занимаешься?"
   ],
   [
    "你的职业是什么",
    "Nǐ de zhíyè shì shénme?",
    "Какая у тебя профессия?"
   ],
   [
    "你现在做什么工作",
    "Nǐ xiànzài zuò shénme gōngzuò?",
    "Кем ты сейчас работаешь?"
   ]
  ]
 },
 {
  "canonical": "你在哪儿工作",
  "answer": "我在这里陪你练习中文。",
  "rows": [
   [
    "你在什么地方工作",
    "Nǐ zài shénme dìfang gōngzuò?",
    "Где ты работаешь?"
   ],
   [
    "你工作的地方在哪儿",
    "Nǐ gōngzuò de dìfang zài nǎr?",
    "Где находится место твоей работы?"
   ],
   [
    "你现在在哪儿工作",
    "Nǐ xiànzài zài nǎr gōngzuò?",
    "Где ты сейчас работаешь?"
   ],
   [
    "你现在在哪里工作",
    "Nǐ xiànzài zài nǎlǐ gōngzuò?",
    "Где ты сейчас работаешь?"
   ]
  ]
 },
 {
  "canonical": "你喜欢你的工作吗",
  "answer": "我喜欢帮你学中文。",
  "rows": [
   [
    "你喜欢自己的工作吗",
    "Nǐ xǐhuan zìjǐ de gōngzuò ma?",
    "Тебе нравится твоя работа?"
   ],
   [
    "你喜不喜欢你的工作",
    "Nǐ xǐ bu xǐhuan nǐ de gōngzuò?",
    "Тебе нравится твоя работа?"
   ],
   [
    "你的工作你喜欢吗",
    "Nǐ de gōngzuò nǐ xǐhuan ma?",
    "Тебе нравится твоя работа?"
   ]
  ]
 },
 {
  "canonical": "你工作忙吗",
  "answer": "我现在有空，可以陪你练习。",
  "rows": [
   [
    "你的工作忙吗",
    "Nǐ de gōngzuò máng ma?",
    "У тебя много работы?"
   ],
   [
    "你工作忙不忙",
    "Nǐ gōngzuò máng bu máng?",
    "У тебя много работы?"
   ],
   [
    "你今天工作忙吗",
    "Nǐ jīntiān gōngzuò máng ma?",
    "У тебя сегодня много работы?"
   ]
  ]
 },
 {
  "canonical": "你每天几点下班",
  "answer": "我没有固定的下班时间。",
  "rows": [
   [
    "你几点下班",
    "Nǐ jǐ diǎn xiàbān?",
    "Во сколько ты заканчиваешь работу?"
   ],
   [
    "你一般几点下班",
    "Nǐ yìbān jǐ diǎn xiàbān?",
    "Во сколько обычно заканчиваешь работу?"
   ],
   [
    "你通常几点下班",
    "Nǐ tōngcháng jǐ diǎn xiàbān?",
    "Во сколько обычно заканчиваешь работу?"
   ]
  ]
 },
 {
  "canonical": "你工作多久了",
  "answer": "我是虚拟中文老师，没有实际的工作年限。",
  "rows": [
   [
    "你工作多长时间了",
    "Nǐ gōngzuò duō cháng shíjiān le?",
    "Как давно ты работаешь?"
   ],
   [
    "你工作几年了",
    "Nǐ gōngzuò jǐ nián le?",
    "Сколько лет ты работаешь?"
   ]
  ]
 },
 {
  "canonical": "你会说俄语吗",
  "answer": "我可以用俄语解释中文。",
  "course": true,
  "rows": [
   [
    "你会不会说俄语",
    "Nǐ huì bu huì shuō Éyǔ?",
    "Ты умеешь говорить по-русски?"
   ],
   [
    "你能说俄语吗",
    "Nǐ néng shuō Éyǔ ma?",
    "Ты можешь говорить по-русски?"
   ]
  ]
 },
 {
  "canonical": "你会用电脑吗",
  "answer": "会，我会用电脑。",
  "course": true,
  "rows": [
   [
    "你会不会用电脑",
    "Nǐ huì bu huì yòng diànnǎo?",
    "Ты умеешь пользоваться компьютером?"
   ],
   [
    "你能用电脑吗",
    "Nǐ néng yòng diànnǎo ma?",
    "Ты можешь пользоваться компьютером?"
   ]
  ]
 }
];
test('reviewed work/study variants and polite forms reuse the existing exact answer',()=>{
 for(const g of groups){
  assert(lookupApprovedPandaVoice(g.answer)?.src,g.answer);
  for(const [q] of g.rows)for(const text of [q+'？','请问，'+q+'？']){
   const x=respondToCourseWorkStudyQuestion(text);
   assert.equal(x?.reply.hanzi,g.answer,text);
   assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
   assert(x.spoken.pinyin&&x.spoken.translation,text);
   assert.equal(respondToNaturalStatement(text)?.reply.hanzi,g.answer,text);
  }
 }
});
test('unrelated statements, ambiguous fragments and already-supported canonical questions are not captured',()=>{
 for(const q of ['我在银行工作。','我喜欢我的工作。','你爸爸做什么工作？','工作','请问','你在那工作','你做什么工作？','你在哪儿工作？','你会说俄语吗？','你什么时候上班？','你能帮我找工作吗？'])assert.equal(respondToCourseWorkStudyQuestion(q),null,q);
});