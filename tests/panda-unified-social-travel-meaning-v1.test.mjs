import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToCourseSocialTravel} from '../assets/panda-natural-statements-v552.mjs';
import {lookupApprovedPandaVoice} from '../assets/panda-approved-voice-registry-v516.mjs';
const groups=[
 {
  "domain": "relationships",
  "answer": [
   "有啊，我们可以做朋友。",
   "Yǒu a, wǒmen kěyǐ zuò péngyou.",
   "Да, мы можем дружить."
  ],
  "rows": [
   [
    "我们可以做朋友吗",
    "Wǒmen kěyǐ zuò péngyou ma?",
    "Мы можем подружиться?"
   ],
   [
    "你愿意和我做朋友吗",
    "Nǐ yuànyì hé wǒ zuò péngyou ma?",
    "Ты хочешь со мной дружить?"
   ],
   [
    "我可以和你做朋友吗",
    "Wǒ kěyǐ hé nǐ zuò péngyou ma?",
    "Можно с тобой подружиться?"
   ]
  ]
 },
 {
  "domain": "relationships",
  "answer": [
   "没有，我是虚拟熊猫。",
   "Méiyǒu, wǒ shì xūnǐ xióngmāo.",
   "Нет, я виртуальная панда."
  ],
  "rows": [
   [
    "你有男朋友吗",
    "Nǐ yǒu nánpéngyou ma?",
    "У тебя есть парень?"
   ],
   [
    "你有没有男朋友",
    "Nǐ yǒu méiyǒu nánpéngyou?",
    "У тебя есть парень?"
   ],
   [
    "你有女朋友吗",
    "Nǐ yǒu nǚpéngyou ma?",
    "У тебя есть девушка?"
   ],
   [
    "你有没有女朋友",
    "Nǐ yǒu méiyǒu nǚpéngyou?",
    "У тебя есть девушка?"
   ],
   [
    "你有对象吗",
    "Nǐ yǒu duìxiàng ma?",
    "У тебя есть партнёр?"
   ]
  ]
 },
 {
  "domain": "relationships",
  "scene": true,
  "answer": [
   "有空，我们见面吧。",
   "Yǒu kòng, wǒmen jiànmiàn ba.",
   "Есть время, давай встретимся."
  ],
  "rows": [
   [
    "你星期六有没有空",
    "Nǐ xīngqīliù yǒu méiyǒu kòng?",
    "Ты свободен в субботу?"
   ],
   [
    "星期六你有时间吗",
    "Xīngqīliù nǐ yǒu shíjiān ma?",
    "У тебя есть время в субботу?"
   ],
   [
    "你周六有空吗",
    "Nǐ zhōuliù yǒu kòng ma?",
    "Ты свободен в субботу?"
   ]
  ]
 },
 {
  "domain": "relationships",
  "scene": true,
  "answer": [
   "星期六下午三点。",
   "Xīngqīliù xiàwǔ sān diǎn.",
   "В субботу в три часа дня."
  ],
  "rows": [
   [
    "我们什么时候碰面",
    "Wǒmen shénme shíhou pèngmiàn?",
    "Когда мы встретимся?"
   ],
   [
    "我们约几点见面",
    "Wǒmen yuē jǐ diǎn jiànmiàn?",
    "На какое время договоримся о встрече?"
   ],
   [
    "我们什么时间见面",
    "Wǒmen shénme shíjiān jiànmiàn?",
    "Когда мы встретимся?"
   ]
  ]
 },
 {
  "domain": "relationships",
  "scene": true,
  "answer": [
   "好，我们一起去吧。",
   "Hǎo, wǒmen yìqǐ qù ba.",
   "Хорошо, пойдём вместе."
  ],
  "rows": [
   [
    "我们一起去公园好吗",
    "Wǒmen yìqǐ qù gōngyuán hǎo ma?",
    "Давай вместе пойдём в парк?"
   ],
   [
    "你愿意跟我一起去公园吗",
    "Nǐ yuànyì gēn wǒ yìqǐ qù gōngyuán ma?",
    "Хочешь пойти со мной в парк?"
   ],
   [
    "你想不想一起去公园",
    "Nǐ xiǎng bu xiǎng yìqǐ qù gōngyuán?",
    "Хочешь вместе пойти в парк?"
   ]
  ]
 },
 {
  "domain": "travel",
  "answer": [
   "我是虚拟熊猫，没有实际的旅行经历。",
   "Wǒ shì xūnǐ xióngmāo, méiyǒu shíjì de lǚxíng jīnglì.",
   "Я виртуальная панда, у меня нет реального опыта путешествий."
  ],
  "rows": [
   [
    "你喜欢旅游吗",
    "Nǐ xǐhuan lǚyóu ma?",
    "Ты любишь путешествовать?"
   ],
   [
    "你喜不喜欢旅行",
    "Nǐ xǐ bu xǐhuan lǚxíng?",
    "Ты любишь путешествовать?"
   ],
   [
    "你经常旅行吗",
    "Nǐ jīngcháng lǚxíng ma?",
    "Ты часто путешествуешь?"
   ],
   [
    "你以前去过北京吗",
    "Nǐ yǐqián qùguo Běijīng ma?",
    "Ты раньше бывал в Пекине?"
   ],
   [
    "你去过上海没有",
    "Nǐ qùguo Shànghǎi méiyǒu?",
    "Ты бывал в Шанхае?"
   ],
   [
    "你有没有去过中国",
    "Nǐ yǒu méiyǒu qùguo Zhōngguó?",
    "Ты бывал в Китае?"
   ]
  ]
 },
 {
  "domain": "travel",
  "answer": [
   "我还没有计划。",
   "Wǒ hái méiyǒu jìhuà.",
   "У меня пока нет планов."
  ],
  "rows": [
   [
    "你打算什么时候去北京",
    "Nǐ dǎsuàn shénme shíhou qù Běijīng?",
    "Когда ты собираешься поехать в Пекин?"
   ],
   [
    "你准备什么时候去北京",
    "Nǐ zhǔnbèi shénme shíhou qù Běijīng?",
    "Когда ты планируешь поехать в Пекин?"
   ],
   [
    "你最近有什么旅行计划",
    "Nǐ zuìjìn yǒu shénme lǚxíng jìhuà?",
    "Какие у тебя планы на путешествия в ближайшее время?"
   ]
  ]
 },
 {
  "domain": "travel",
  "answer": [
   "我是虚拟熊猫，不会真的坐飞机。",
   "Wǒ shì xūnǐ xióngmāo, bú huì zhēn de zuò fēijī.",
   "Я виртуальная панда и не летаю по-настоящему."
  ],
  "rows": [
   [
    "你要坐飞机吗",
    "Nǐ yào zuò fēijī ma?",
    "Ты собираешься лететь на самолёте?"
   ],
   [
    "你打算坐飞机吗",
    "Nǐ dǎsuàn zuò fēijī ma?",
    "Ты планируешь лететь на самолёте?"
   ],
   [
    "你以前坐过飞机吗",
    "Nǐ yǐqián zuòguo fēijī ma?",
    "Ты раньше летал на самолёте?"
   ],
   [
    "你坐没坐过飞机",
    "Nǐ zuò méi zuòguo fēijī?",
    "Ты когда-нибудь летал на самолёте?"
   ]
  ]
 }
];
test('reviewed social and travel paraphrases and polite forms reuse exact approved voice answers',()=>{
 for(const g of groups){
  assert(lookupApprovedPandaVoice(g.answer[0])?.src,g.answer[0]);
  for(const [q] of g.rows)for(const text of [q+'？','请问，'+q+'？']){
   const x=respondToCourseSocialTravel(text);assert.equal(x?.reply.hanzi,g.answer[0],text);
   assert.equal(x.kind,'question');assert.equal(x.spoken.toneVerified,false);
   assert(x.spoken.pinyin&&x.spoken.translation,text);
   if(g.scene)assert(x.message.includes('не настоящая встреча'));
  }
 }
});
test('meeting time clarification needs the immediately preceding matching fictional reply',()=>{
 for(const q of ['几点呢？','什么时候呢？']){
  assert.equal(respondToCourseSocialTravel(q,'有空，我们见面吧。')?.reply.hanzi,'星期六下午三点。');
  assert.equal(respondToCourseSocialTravel(q),null);
  assert.equal(respondToCourseSocialTravel(q,'我没有孩子。'),null);
 }
});
test('unrelated statements and canonical or romantic requests keep their existing handling',()=>{
 for(const q of ['我爱你。','我想你。','你爱我吗？','我们结婚吧。','我有女朋友。','我想去中国。','我打算坐飞机。','你喜欢旅行吗？','你什么时候去北京？','你星期六有空吗？','你有朋友吗？','我想见你。','旅行','请问'])assert.equal(respondToCourseSocialTravel(q),null,q);
});