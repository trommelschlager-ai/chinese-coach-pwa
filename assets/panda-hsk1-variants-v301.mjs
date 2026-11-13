/* Panda Go HSK1 v301 — conservative, topic-scoped Mandarin question variants.
 * Only semantic equivalents of pre-reviewed canonical questions are rewritten.
 * Never infer real weather, locations, user identity, or an unrecorded audio clip.
 */
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';

const norm=value=>normalize(value).replace(/^请问/,'').replace(/^(?:熊猫|小熊猫)/,'');
const alias=new Map();
const add=(lesson,canonical,forms)=>{
 for(const form of forms){
  const key=norm(form);
  if(alias.has(key)&&alias.get(key).canonical!==canonical)throw Error('Conflicting question alias '+form);
  alias.set(key,{lesson,canonical});
 }
};
// 1 — Social greetings, no fabricated statements about a real person.
add(1,'你好吗',[
 '你好吗呀','你好吗呢','你还好吗','你今天好吗','你现在好吗',
 '你怎么样','你今天怎么样','最近好吗','你最近好吗'
]);
add(1,'你呢',['你怎么样呢','那你呢','你自己呢']);
// 2 — The established Panda role is a fictional language teacher.
add(2,'你叫什么名字',[
 '你叫什么名字呀','你叫什么名','你叫啥名字','你叫做什么',
 '你名字叫什么','你的名字是什么','你叫什么名字呢'
]);
add(2,'你是谁',['你到底是谁','你是谁呀','你是谁呢']);
add(2,'你是老师吗',['你是不是老师','你是老师吧','你是一位老师吗']);
add(2,'你是学生吗',['你是不是学生','你是一名学生吗']);
add(2,'你是老师吗',['你是老师还是学生']); // teacher is one of the two alternatives
// 3 — A question about the Panda character's fictional age.
add(3,'你几岁',['你几岁了','你今年几岁','你今年几岁了','你多大年纪','你多大了呀','你多大岁数']);
// 4 — Synonyms of weekday questions; retain local-calendar semantics.
for(const day of ['今天','明天','昨天']){
 add(4,day+'星期几',[
  day+'周几',day+'是周几',day+'礼拜几',day+'是礼拜几',
  day+'星期几呢',day+'是星期几呢',day+'星期几呀'
 ]);
 for(const [short,long] of Object.entries({一:'一',二:'二',三:'三',四:'四',五:'五',六:'六',日:'日',天:'天'})){
  add(4,day+'是星期'+long+'吗',[
   day+'是周'+short+'吗',day+'周'+short+'吗',
   day+'是礼拜'+short+'吗',day+'礼拜'+short+'吗'
  ]);
 }
}
add(4,'你星期几有空',['你周几有空','你礼拜几有空','你星期几有时间','你哪天有空']);
// 5 — Calendar questions, not real-time weather or speculative schedules.
for(const day of ['今天','明天','昨天']){
 add(5,day+'几月几号',[
  day+'是几月几号呀',day+'几月几日呢',day+'是几月几日呀',
  day+'日期是多少',day+'的日期是几月几号'
 ]);
 add(5,day+'几号',[day+'是几号呀',day+'几号了',day+'是几日']);
}
add(5,'今天几月',['这个月是几月','现在是几月份','现在几月份','这个月几月']);
// 6 — Only Panda's fixed fictional-family facts; do not infer a real family.
add(6,'你家有几口人',[
 '你家有几个人','你家里有几口人','你家里有几个人',
 '你家一共有几个人','你家多少人','你家有多少人'
]);
for(const r of ['妈妈','爸爸','哥哥','姐姐','弟弟','妹妹']){
 add(6,'你有'+r+'吗',[
  '你有没有'+r,'你有'+r+'没有','你有'+r+'吗呀','你有'+r+'吗呢'
 ]);
 add(6,'你'+r+'几岁',[
  '你'+r+'几岁了','你'+r+'今年几岁','你'+r+'多大了',
  '你'+r+'今年多大','你'+r+'的年龄是多少'
 ]);
 if(['哥哥','姐姐','弟弟','妹妹'].includes(r))
  add(6,'你有几个'+r,[
   '你有多少个'+r,'你有几位'+r,'你家有几个'+r
  ]);
}
// 7 — All responses remain clearly marked fictional study scenarios.
for(const day of ['今天','明天','昨天']){
 if(day!=='昨天')add(7,day+'天气怎么样',[
  day+'天气如何',day+'的天气如何',day+'的天气怎么样呢',
  day+'天气怎么样呀',day+'天气好不好',day+'的天气好不好'
 ]);
 for(const [zh,rewrite] of [['冷','冷吗'],['热','热吗'],['下雨','下雨吗'],['下雪','下雪吗']]){
  add(7,day+rewrite,[
   day+zh+'不'+zh,day+'是不是'+zh,
   day+(zh==='下雨'?'会不会下雨':zh==='下雪'?'会不会下雪':zh+'不'+zh)+'呢'
  ]);
 }
}
for(const season of ['春天','夏天','秋天','冬天'])
 add(7,season+'天气怎么样',[season+'的天气怎么样',season+'天气如何']);

// More structured variants are deliberately constrained to studied vocabulary.
const weekdayShort={一:'一',二:'二',三:'三',四:'四',五:'五',六:'六',日:'日',天:'天'};
const CHINESE_NUMBER='[零一二两三四五六七八九十百\\d]+';
export function questionVariant(input){
 const raw=String(input||'').trim(),key=norm(raw);
 if(!raw||raw.length>160||!key||!/[\u3400-\u9fff]/u.test(raw))return null;
 const listed=alias.get(key);
 if(listed)return {...listed,original:raw};
 let m=/^(今天|明天|昨天)(?:是)?(?:周|礼拜)([一二三四五六日天])吗$/.exec(key);
 if(m&&weekdayShort[m[2]])return {lesson:4,canonical:m[1]+'是星期'+weekdayShort[m[2]]+'吗',original:raw};
 m=/^([零一二两三四五六七八九十百\d]+)(后面|前面)(?:是)?(?:什么数字|什么数|多少|几)$/.exec(key);
 if(m)return {lesson:3,canonical:m[1]+m[2]+'是几',original:raw};
 m=/^你(哥哥|姐姐|弟弟|妹妹|妈妈|爸爸)(?:今年)?(?:多大|几岁)(?:了|呀)?$/.exec(key);
 if(m)return {lesson:6,canonical:'你'+m[1]+'几岁',original:raw};
 return null;
}
export function learnerAnswerVariant(input,prompt=null){
 const raw=String(input||'').trim(),key=norm(raw);
 if(!raw||raw.length>160||!key)return null;
 let match;
 if(prompt?.intent==='age'&&(match=/^我今年([零一二两三四五六七八九十百\d]+)岁$/.exec(key)))
  return '我'+match[1]+'岁';
 if(prompt?.intent==='name'&&(match=/^我(?:的)?名字(?:是|叫)([\u3400-\u9fffA-Za-z]{1,16})$/.exec(key)))
  return '我叫'+match[1];
 if(prompt?.lesson===6&&(match=/^我没有(哥哥|姐姐|弟弟|妹妹)(?:但是|可是|不过)我?有(哥哥|姐姐|弟弟|妹妹)$/.exec(key)))
  return '我没有'+match[1]+'我有'+match[2];
 if(prompt?.lesson===6&&(match=/^我家里有([零一二两三四五六七八九十百\d]+)口人$/.exec(key)))
  return '我家有'+match[1]+'口人';
 if(prompt&&/(?:吗|[?？])$/.test(String(prompt.hanzi||prompt.panda||''))){
  const short={'对':'是','对的':'是','是的':'是','没有啊':'没有','有的':'有'};
  if(Object.prototype.hasOwnProperty.call(short,key))return short[key];
 }
 return null;
}
export function listReviewedQuestionVariants(){return [...alias.entries()].map(([original,data])=>({original,...data}));}
export const VARIANT_TOPIC_COUNTS=Object.freeze(
 Array.from({length:7},(_,i)=>({lesson:i+1,aliases:[...alias.values()].filter(x=>x.lesson===i+1).length}))
);
