import test from 'node:test';
import assert from 'node:assert/strict';
import {respondToNaturalStatement as reply} from '../assets/panda-natural-statements-v552.mjs';
import {liveDOM} from './panda-live-dom-fixture.mjs';
const matrix={
  "assertions": [
    "我是老师",
    "我是医生",
    "我是工程师",
    "我是司机",
    "我是厨师",
    "我是护士",
    "我是学生",
    "我不是老师",
    "我不是医生",
    "我也是老师",
    "我是一个老师",
    "我以前是老师",
    "我想当老师",
    "我在医院工作",
    "我在学校工作",
    "我在公司工作",
    "我不工作",
    "我没有工作",
    "我今天不工作",
    "我在找工作"
  ],
  "questions": [
    "你是老师吗",
    "你是医生吗",
    "你是不是老师",
    "你做什么工作",
    "你在哪儿工作",
    "你在哪里工作",
    "你喜欢你的工作吗",
    "你工作忙吗",
    "你每天几点下班",
    "你工作多久了"
  ],
  "context": [
    [
      "学校",
      "work-place"
    ],
    [
      "在学校",
      "work-place"
    ],
    [
      "在医院工作",
      "work-place"
    ],
    [
      "喜欢",
      "job-liking"
    ],
    [
      "不喜欢",
      "job-liking"
    ],
    [
      "很喜欢",
      "job-liking"
    ],
    [
      "很忙",
      "work-busy"
    ],
    [
      "不忙",
      "work-busy"
    ],
    [
      "六点",
      "after-work"
    ],
    [
      "我六点下班",
      "after-work"
    ],
    [
      "想",
      "job-change"
    ],
    [
      "不想",
      "job-change"
    ]
  ]
};
const chains=[
  [
    [
      "我是老师",
      "你是老师！你在哪儿工作？"
    ],
    [
      "在学校",
      "你喜欢你的工作吗？"
    ],
    [
      "很喜欢",
      "太好了！你工作忙吗？"
    ],
    [
      "很忙",
      "辛苦了！你每天几点下班？"
    ],
    [
      "六点",
      "你下班后喜欢做什么？"
    ],
    [
      "我喜欢跑步",
      "你经常跑步吗？"
    ]
  ],
  [
    [
      "我不是老师",
      "明白了。你做什么工作？"
    ],
    [
      "医生",
      "你是医生！你在哪儿工作？"
    ],
    [
      "在医院工作",
      "你喜欢你的工作吗？"
    ],
    [
      "不喜欢",
      "明白了。你想换工作吗？"
    ],
    [
      "想",
      "你想做什么工作？"
    ],
    [
      "我想当工程师",
      "你为什么想做这个工作？"
    ]
  ],
  [
    [
      "你是医生吗",
      "不是，我是老师。"
    ],
    [
      "你是不是老师",
      "我是老师。"
    ],
    [
      "你做什么工作",
      "我是老师。"
    ],
    [
      "你在哪里工作",
      "我在这里陪你练习中文。"
    ]
  ]
];
for(const [group,items] of Object.entries(matrix))test('Work coverage: '+group+' ('+items.length+' phrases)',()=>{
 for(const item of items){const [zh,awaiting]=Array.isArray(item)?item:[item,null];const r=reply(zh,{awaiting});assert(r?.spoken?.pinyin,zh);assert(r.spoken.translation&&r.reply.hanzi&&r.reply.pinyin&&r.reply.ru,zh);assert.equal(r.spoken.toneVerified,false,zh);}
});
for(const [i,chain] of chains.entries())test('Work semantic chain '+i,()=>{let awaiting=null;for(const [zh,expected] of chain){const r=reply(zh,{awaiting});assert.equal(r?.reply?.hanzi,expected,zh);awaiting=r.next;}});
test('Context fragments cannot invent job facts',()=>{for(const s of ['学校','六点','想','我是宇航员','我在火星工作'])assert.equal(reply(s),null,s);assert.equal(reply('我不是老师').spoken.pinyin,'Wǒ bú shì lǎoshī.');assert.equal(reply('我六点下班').spoken.pinyin,'Wǒ liù diǎn xiàbān.');assert.equal(reply('我没有工作').reply.hanzi,'你想做什么工作？');});
for(const [mode,lesson,params] of [['short',null,''],['nonstop',null,''],['short',1,''],['short',null,'topic=1']]){
 test('Active UI work conversation '+mode+' '+(lesson??params),async()=>{
  const f=await liveDOM(lesson,{params,active:true});
  try{if(mode==='nonstop')f.w.PandaApprovedBridge337.setMode(mode);for(const chain of chains)for(const [zh,expected] of chain){f.send(zh);const h=f.w.PandaApprovedBridge337.snapshot().history;assert.equal(h.at(-2).hanzi,zh,zh);assert(h.at(-2).pinyin,zh+' missing pinyin');assert.equal(h.at(-1).hanzi,expected,zh);}}finally{f.close()}
 });
}
