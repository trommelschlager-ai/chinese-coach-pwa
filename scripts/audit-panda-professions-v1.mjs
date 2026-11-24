import {liveDOM} from '../tests/panda-live-dom-fixture.mjs';
import {writeFileSync} from 'node:fs';
const cases=[
 ['profession','我是老师',/老师.*工作/],['profession','我是医生',/医生.*工作/],['profession','我是工程师',/工程师.*工作/],['profession','我是司机',/司机.*工作/],['profession','我是厨师',/厨师.*工作/],['profession','我是护士',/护士.*工作/],['profession','我是学生',/学什么/],['profession','我不是老师',/什么工作/],['profession','我不是医生',/什么工作/],['profession','我也是老师',/老师|工作/],['profession','我是一个老师',/老师.*工作/],['profession','我以前是老师',/现在|以前|退休|工作/],['profession','我想当老师',/老师|为什么/],['workplace','我在医院工作',/工作.*吗|医院/],['workplace','我在学校工作',/工作.*吗|学校/],['workplace','我在公司工作',/工作.*吗|公司/],['employment','我不工作',/喜欢|做什么|休息/],['employment','我没有工作',/找工作|什么工作/],['employment','我今天不工作',/今天|休息/],['employment','我在找工作',/什么工作|找工作/],
 ['question','你是老师吗',/我是老师|是的/],['question','你是医生吗',/不是.*老师/],['question','你是不是老师',/我是老师|是的/],['question','你做什么工作',/老师|练习中文|教中文/],['question','你在哪儿工作',/这里|网上|教中文|练习中文/],['question','你在哪里工作',/这里|网上|教中文|练习中文/],['question','你喜欢你的工作吗',/喜欢|开心/],['question','你工作忙吗',/忙|随时|时间/],['question','你每天几点下班',/不下班|没有.*下班|随时|一直|时间/],['question','你工作多久了',/没有|时间|不知道|一直|随时/]
];
const chains=[
 {name:'teacher workplace satisfaction busy time',turns:[['我是老师',/老师.*工作/],['在学校',/工作.*吗|学校/],['很喜欢',/忙/],['很忙',/几点下班/],['六点',/六点|下班后/]]},
 {name:'doctor negative workplace change',turns:[['我不是医生',/什么工作/],['我是司机',/司机.*工作/],['在公司',/工作.*吗|公司/],['不喜欢',/换工作/],['不想',/明白|没关系|为什么|工作/]]},
 {name:'school and student distinction',turns:[['我是学生',/学什么/],['我学中文',/中文|多久|为什么/],['我不是老师',/什么工作|学生|学习/]]}
];
const results=[];
const fallback=/没听懂|说得简单|简单一点|再说一遍|换一种说法|不太明白|请再说/;
function submit(f,group,input,expect,mode){
 const before=f.clips.length;
 f.send(input);
 const h=f.w.PandaApprovedBridge337.snapshot().history;
 const student=h.at(-2),panda=h.at(-1);
 const reply=panda?.who==='panda'?panda.hanzi:null;
 const gotInput=student?.who==='you'&&student.hanzi===input;
 const logical=!!reply&&expect.test(reply)&&!fallback.test(reply);
 const pass=gotInput&&logical&&!!student?.pinyin&&!!student?.ru;
 const row={mode,group,input,reply,learnerPinyin:student?.pinyin??null,learnerRu:student?.ru??null,replyPinyin:panda?.pinyin??null,replyRu:panda?.ru??null,clips:f.clips.slice(before).map(x=>x.src),expected:expect.source,pass,reason:!gotInput?'missing learner turn':!reply?'missing reply':fallback.test(reply)?'generic clarification':!logical?'review reply meaning':!student?.pinyin?'missing learner pinyin':!student?.ru?'missing learner translation':'pass'};
 results.push(row);console.log('PROFESSION_AUDIT '+JSON.stringify(row));
}
for(const mode of ['short','nonstop']){
 for(const [group,input,expect] of cases){
  const f=await liveDOM(null,{active:true});
  try{if(mode==='nonstop')f.w.PandaApprovedBridge337.setMode(mode);submit(f,group,input,expect,mode)}finally{f.close()}
 }
 for(const chain of chains){
  const f=await liveDOM(null,{active:true});
  try{if(mode==='nonstop')f.w.PandaApprovedBridge337.setMode(mode);for(const [input,expect] of chain.turns)submit(f,chain.name,input,expect,mode)}finally{f.close()}
 }
}
const summary={total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,byMode:Object.fromEntries(['short','nonstop'].map(m=>[m,{passed:results.filter(x=>x.mode===m&&x.pass).length,total:results.filter(x=>x.mode===m).length}]))};
writeFileSync('panda-professions-audit.json',JSON.stringify({summary,results},null,2));console.log('PROFESSION_SUMMARY '+JSON.stringify(summary));
// Diagnostic baseline, not a release pass. A failure is an audit finding.
if(summary.failed)process.exitCode=1;
