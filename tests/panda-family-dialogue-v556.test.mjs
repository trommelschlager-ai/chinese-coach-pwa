import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v552.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const matrix={
  "have": [
    "我有哥哥",
    "我有一个妹妹",
    "我没有姐姐",
    "我有两个哥哥",
    "我有三个妹妹",
    "我没有兄弟姐妹",
    "我有一个弟弟和一个妹妹",
    "我有孩子",
    "我没有孩子",
    "我有一个儿子",
    "我有两个女儿",
    "我家有三口人",
    "我家有五口人",
    "我和父母住在一起"
  ],
  "age": [
    "我哥哥五岁",
    "我姐姐十岁",
    "我哥哥二十岁",
    "我妹妹十八岁",
    "我爸爸六十岁",
    "我妈妈55岁",
    "我儿子三岁",
    "我女儿十二岁"
  ],
  "questions": [
    "你有没有哥哥",
    "你有没有姐姐",
    "你有哥哥吗",
    "你有妹妹吗",
    "你有弟弟吗",
    "你有姐姐吗",
    "你有兄弟姐妹吗",
    "你家有几口人",
    "你有几个哥哥",
    "你有几个妹妹"
  ],
  "context": [
    [
      "三口人",
      "family-size"
    ],
    [
      "四个人",
      "family-size"
    ],
    [
      "二十岁",
      "family-age:哥哥"
    ],
    [
      "十八岁",
      "family-age:妹妹"
    ],
    [
      "他喜欢跑步",
      "family-hobby:哥哥"
    ],
    [
      "她喜欢看书",
      "family-hobby:妹妹"
    ]
  ]
};
const chains=[
  [
    [
      "我有一个哥哥",
      "你哥哥几岁？"
    ],
    [
      "二十岁",
      "你哥哥二十岁！他喜欢做什么？"
    ],
    [
      "他喜欢跑步",
      "谢谢你告诉我。你喜欢做什么？"
    ]
  ],
  [
    [
      "我没有姐姐",
      "明白了。你家有几口人？"
    ],
    [
      "三口人",
      "你有兄弟姐妹吗？"
    ],
    [
      "我没有兄弟姐妹",
      "谢谢你告诉我。你喜欢做什么？"
    ]
  ],
  [
    [
      "你有哥哥吗",
      "我有一个哥哥。"
    ],
    [
      "你有几个妹妹",
      "我有一个妹妹。"
    ],
    [
      "你有没有姐姐",
      "我没有姐姐。"
    ],
    [
      "你家有几口人",
      "我家有五口人。"
    ]
  ]
];
for(const [group,items] of Object.entries(matrix))test('Family coverage '+group,()=>{for(const item of items){const [zh,awaiting]=Array.isArray(item)?item:[item,null];const r=reply(zh,{awaiting});assert(r?.spoken.pinyin&&r.reply.hanzi&&r.reply.pinyin&&r.reply.ru,zh);assert.equal(r.spoken.toneVerified,false,zh);}});
for(const [i,chain] of chains.entries())test('Family context chain '+i,()=>{let awaiting=null;for(const [zh,expected] of chain){const r=reply(zh,{awaiting});assert.equal(r?.reply?.hanzi,expected,zh);awaiting=r.next;}});
test('Context is required and pronouns stay truthful',()=>{for(const zh of ['二十岁','三口人','她喜欢看书','你有没有火箭'])assert.equal(reply(zh),null,zh);assert.equal(reply('她喜欢看书',{awaiting:'family-hobby:哥哥'}),null);assert.equal(reply('我有一个哥哥').next,'family-age:哥哥');});
for(const mode of ['short','nonstop'])test('Active default family dialogue '+mode,async()=>{const f=await liveDOM(null,{active:true});try{if(mode==='nonstop')f.w.PandaApprovedBridge337.setMode(mode);for(const chain of chains)for(const [zh,expected] of chain){f.send(zh);const h=f.w.PandaApprovedBridge337.snapshot().history;assert.equal(h.at(-2).hanzi,zh);assert(h.at(-2).pinyin,zh);assert.equal(h.at(-1).hanzi,expected,zh);}}finally{f.close()}});

test('Negative sibling fact does not cause repeated questions',()=>{const a=reply('我没有兄弟姐妹');const b=reply('三口人',{awaiting:a.next});assert.equal(b.next,'hobby');assert.equal(reply('我没有兄弟姐妹',{awaiting:'family-siblings'}).next,'hobby');});
