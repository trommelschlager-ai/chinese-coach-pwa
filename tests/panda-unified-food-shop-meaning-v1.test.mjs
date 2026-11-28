import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseFoodShopQuestion,respondToNaturalStatement} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const groups=[
 {
  "answer": [
   "我想吃竹子。",
   "Wǒ xiǎng chī zhúzi.",
   "Я хочу бамбук."
  ],
  "rows": [
   [
    "你想吃点什么",
    "Nǐ xiǎng chī diǎn shénme?",
    "Что ты хочешь съесть?"
   ],
   [
    "你想要吃什么",
    "Nǐ xiǎng yào chī shénme?",
    "Что ты хочешь съесть?"
   ],
   [
    "你要吃什么",
    "Nǐ yào chī shénme?",
    "Что будешь есть?"
   ]
  ]
 },
 {
  "answer": [
   "不饿。你呢？",
   "Bú è. Nǐ ne?",
   "Не голодна. А ты?"
  ],
  "rows": [
   [
    "你现在饿吗",
    "Nǐ xiànzài è ma?",
    "Ты сейчас голоден?"
   ],
   [
    "你饿不饿",
    "Nǐ è bu è?",
    "Ты голоден?"
   ],
   [
    "你现在饿不饿",
    "Nǐ xiànzài è bu è?",
    "Ты сейчас голоден?"
   ]
  ]
 },
 {
  "answer": [
   "我还要一碗汤。",
   "Wǒ hái yào yì wǎn tāng.",
   "Я хочу ещё миску супа."
  ],
  "rows": [
   [
    "你还要什么",
    "Nǐ hái yào shénme?",
    "Что ещё хочешь?"
   ],
   [
    "你还想要什么",
    "Nǐ hái xiǎng yào shénme?",
    "Что ещё хочешь?"
   ],
   [
    "你还想吃什么",
    "Nǐ hái xiǎng chī shénme?",
    "Что ещё хочешь съесть?"
   ]
  ]
 },
 {
  "answer": [
   "我喜欢紫色。",
   "Wǒ xǐhuan zǐsè.",
   "Я люблю фиолетовый цвет."
  ],
  "rows": [
   [
    "你最喜欢什么颜色",
    "Nǐ zuì xǐhuan shénme yánsè?",
    "Какой цвет тебе нравится больше всего?"
   ],
   [
    "你喜欢哪种颜色",
    "Nǐ xǐhuan nǎ zhǒng yánsè?",
    "Какой цвет ты любишь?"
   ],
   [
    "你喜欢哪个颜色",
    "Nǐ xǐhuan nǎ ge yánsè?",
    "Какой цвет ты любишь?"
   ]
  ]
 },
 {
  "answer": [
   "喜欢，但是太贵了。",
   "Xǐhuan, dànshì tài guì le.",
   "Нравится, но слишком дорого."
  ],
  "rows": [
   [
    "你喜不喜欢这件衣服",
    "Nǐ xǐ bu xǐhuan zhè jiàn yīfu?",
    "Тебе нравится эта вещь?"
   ],
   [
    "这件衣服你喜欢吗",
    "Zhè jiàn yīfu nǐ xǐhuan ma?",
    "Тебе нравится эта вещь?"
   ],
   [
    "你喜欢不喜欢这件衣服",
    "Nǐ xǐhuan bu xǐhuan zhè jiàn yīfu?",
    "Тебе нравится эта вещь?"
   ]
  ]
 },
 {
  "answer": [
   "这个比那个便宜。",
   "Zhège bǐ nàge piányi.",
   "Этот дешевле того."
  ],
  "rows": [
   [
    "哪一个更便宜",
    "Nǎ yí ge gèng piányi?",
    "Какой из них дешевле?"
   ],
   [
    "哪个比较便宜",
    "Nǎ ge bǐjiào piányi?",
    "Какой из них дешевле?"
   ],
   [
    "这两个哪个更便宜",
    "Zhè liǎng ge nǎ ge gèng piányi?",
    "Какой из этих двух дешевле?"
   ]
  ]
 },
 {
  "answer": [
   "练习对话：四十块钱，可以吗？",
   "Liànxí duìhuà: sìshí kuài qián, kěyǐ ma?",
   "Учебный диалог: сорок юаней, подойдёт?"
  ],
  "rows": [
   [
    "能便宜一点吗",
    "Néng piányi yìdiǎn ma?",
    "Можно немного дешевле?"
   ],
   [
    "能不能便宜一点",
    "Néng bu néng piányi yìdiǎn?",
    "Можно немного дешевле?"
   ],
   [
    "可以再便宜一点吗",
    "Kěyǐ zài piányi yìdiǎn ma?",
    "Можно ещё немного дешевле?"
   ]
  ]
 },
 {
  "answer": [
   "练习对话：可以刷卡。",
   "Liànxí duìhuà: kěyǐ shuākǎ.",
   "Учебный диалог: можно оплатить картой."
  ],
  "rows": [
   [
    "能刷卡吗",
    "Néng shuākǎ ma?",
    "Можно оплатить картой?"
   ],
   [
    "能不能刷卡",
    "Néng bu néng shuākǎ?",
    "Можно оплатить картой?"
   ],
   [
    "可以用银行卡付款吗",
    "Kěyǐ yòng yínhángkǎ fùkuǎn ma?",
    "Можно оплатить банковской картой?"
   ]
  ]
 }
];
test('reviewed food and shopping paraphrases reuse exact recorded dialogue replies',()=>{
 for(const g of groups){
  assert(lookupApprovedPandaVoice(g.answer[0])?.src,g.answer[0]);
  for(const [q] of g.rows)for(const text of [q+'？','请问，'+q+'？']){
   const x=respondToCourseFoodShopQuestion(text);
   assert.equal(x?.reply.hanzi,g.answer[0],text);
   assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
   assert(x.spoken.pinyin&&x.spoken.translation,text);
   assert.equal(respondToNaturalStatement(text)?.reply.hanzi,g.answer[0],text);
  }
 }
});
test('unrelated statements and incomplete requests are not mistaken for reviewed questions',()=>{
 for(const q of ['我想吃面条。','我不饿。','我喜欢紫色。','太贵了。','我想刷卡。','多少钱','这个','你想吃什么？','你喜欢什么颜色？','可以刷卡吗？','这家餐厅可以刷卡吗？','你妈妈喜欢什么颜色？'])assert.equal(respondToCourseFoodShopQuestion(q),null,q);
});