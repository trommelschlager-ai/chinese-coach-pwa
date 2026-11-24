import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v552.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const matrix={
  "name": [
    "你叫什么名字",
    "你叫什么",
    "我叫安东",
    "我叫小明",
    "我的名字叫安东",
    "很高兴认识你",
    "我也很高兴认识你",
    "你姓什么",
    "我姓王"
  ],
  "age": [
    "你几岁",
    "你多大",
    "你多大了",
    "你今年多大",
    "我二十岁",
    "我今年四十四岁",
    "我44岁",
    "我十八岁",
    "我今年三十岁",
    "我今年五岁"
  ],
  "origin": [
    "你是哪国人",
    "你是中国人吗",
    "你是不是中国人",
    "你来自哪里",
    "你从哪里来",
    "我是俄罗斯人",
    "我不是中国人",
    "我来自俄罗斯",
    "我从中国来",
    "我也是德国人",
    "我住在莫斯科",
    "我现在住在北京",
    "我住在俄罗斯",
    "你住在哪里",
    "你现在住在哪儿"
  ]
};
const chains=[
  [
    [
      "我姓王",
      "你叫什么名字？"
    ],
    [
      "王明",
      "很高兴认识你！你今年多大？"
    ],
    [
      "四十四岁",
      "你来自哪里？"
    ],
    [
      "俄罗斯",
      "你现在住在哪里？"
    ],
    [
      "莫斯科",
      "你做什么工作？"
    ],
    [
      "工程师",
      "你是工程师！你在哪儿工作？"
    ]
  ],
  [
    [
      "我叫安东",
      "很高兴认识你！你今年多大？"
    ],
    [
      "我今年四十四岁",
      "你来自哪里？"
    ],
    [
      "我不是中国人",
      "你来自哪里？"
    ],
    [
      "我来自俄罗斯",
      "你现在住在哪里？"
    ],
    [
      "我住在北京",
      "你做什么工作？"
    ],
    [
      "医生",
      "你是医生！你在哪儿工作？"
    ]
  ]
];
for(const [group,items] of Object.entries(matrix))test('Identity coverage '+group,()=>{for(const zh of items){const r=reply(zh);assert(r?.spoken.pinyin&&r.reply.hanzi&&r.reply.pinyin&&r.reply.ru,zh);assert.equal(r.spoken.toneVerified,false,zh);}});
for(const [i,chain] of chains.entries())test('Identity context chain '+i,()=>{let awaiting=null;for(const [zh,expected] of chain){const r=reply(zh,{awaiting});assert.equal(r?.reply?.hanzi,expected,zh);awaiting=r.next;}});
test('No fabricated readings, ages or context',()=>{assert.equal(reply('我叫龘龘').spoken.pinyin,null);for(const zh of ['俄罗斯','四十四岁','莫斯科','我零岁','我100岁'])assert.equal(reply(zh),null,zh);assert.match(reply('我今年四十四岁').spoken.translation,/44/);assert.match(reply('我不是中国人').spoken.translation,/не/);});
for(const mode of ['short','nonstop'])test('Active default UI introduction '+mode,async()=>{const f=await liveDOM(null,{active:true});try{if(mode==='nonstop')f.w.PandaApprovedBridge337.setMode(mode);for(const chain of chains)for(const [zh,expected] of chain){f.send(zh);const h=f.w.PandaApprovedBridge337.snapshot().history;assert.equal(h.at(-2).hanzi,zh);assert(h.at(-2).pinyin,zh);assert.equal(h.at(-1).hanzi,expected,zh);}}finally{f.close()}});
