/* Panda Brain v430 — in-session, verified conversational memory.
 * No recording, saving, or fabricated audio. All follow-ups must belong
 * to a verified unlocked HSK lesson and have an exact approved Panda MP3.
 */
const norm=value=>String(value??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const SIBLINGS=Object.freeze(['哥哥','姐姐','弟弟','妹妹']);
const ACKS=Object.freeze([
 {hanzi:'好的，我明白了。',pinyin:'Hǎo de, wǒ míngbai le.',ru:'Хорошо, я поняла.'},
 {hanzi:'谢谢你告诉我。',pinyin:'Xièxie nǐ gàosu wǒ.',ru:'Спасибо, что рассказал.'}
]);
const QUESTION_ORDER=Object.freeze(['姐姐','妹妹','哥哥','弟弟']);
function lastPandaQuestion(history=[]){
 for(let i=history.length-1;i>=0;i--){
  const entry=history[i];
  if(entry?.who==='you')break;
  const text=norm(entry?.hanzi);
  if(entry?.who==='panda'&&/^(你有(哥哥|姐姐|弟弟|妹妹)吗|你(哥哥|姐姐|弟弟|妹妹)几岁|你家有几口人)$/.test(text))return text;
 }
 return '';
}
function verifiedPrompt(hanzi,relative,{allowed,catalog,lookupAudio}){
 const group=catalog.find(g=>g.lesson===6);
 const item=group?.questions?.find(q=>norm(q.hanzi)===norm(hanzi)&&q.lesson===6);
 if(!item?.pinyin||!item?.ru||!allowed.includes(6)||!lookupAudio?.(item.hanzi))return null;
 const age=norm(hanzi).endsWith('几岁');
 if(age&&!allowed.includes(3))return null;
 return {
  hanzi:/[？?]$/.test(item.hanzi)?item.hanzi:item.hanzi+'？',
  pinyin:item.pinyin,ru:item.ru,lesson:6,audioKey:item.hanzi,
  isContextual:true,accepted:[],
  ...(age?{intent:'relative-age',relative}:{}),
  ...(!age&&norm(hanzi)==='你家有几口人'?{intent:'family-size'}:{})
 };
}
export function enrichConversation430({
 input,activePrompt,result,profile={},allowed=[],questions=[],history=[],
 catalog=[],lookupAudio
}={}){
 if(!allowed.includes(6)||!result?.spoken?.known||!result.reply||
    !['answer','statement'].includes(result.kind)||result.spoken.topic!==6)return result;
 const spoken=result.spoken,text=norm(input);
 const last=lastPandaQuestion(history);
 const asked=norm(activePrompt?.hanzi||activePrompt?.panda)||last;
 const sibling=/^你有(哥哥|姐姐|弟弟|妹妹)吗$/.exec(asked);
 const age=/^你(哥哥|姐姐|弟弟|妹妹)几岁$/.exec(asked);
 const isSize=asked==='你家有几口人';
 const learnerSibling=/^我(有|没有)(哥哥|姐姐|弟弟|妹妹)$/.exec(text);
 const siblingAnswer=Boolean(sibling&&learnerSibling&&sibling[1]===learnerSibling[2]&&
  ((learnerSibling[1]==='有'&&spoken.family?.present?.includes(learnerSibling[2]))||
   (learnerSibling[1]==='没有'&&spoken.family?.absent===learnerSibling[2])));
 const ageAnswer=Boolean(age&&spoken.fact?.relative===age[1]&&
   Number.isInteger(spoken.fact?.relativeAge)&&spoken.fact.relativeAge>0);
 const countAnswer=Boolean(isSize&&Number.isInteger(spoken.fact?.familySize)&&spoken.fact.familySize>0);
 if(!siblingAnswer&&!ageAnswer&&!countAnswer)return result;
 const facts={...profile.family};
 if(spoken.family?.absent)facts[spoken.family.absent]=false;
 for(const member of spoken.family?.present||[])facts[member]=true;
 if(ageAnswer)facts[age[1]]=true;
 const knownAges={...profile.siblingAges};
 if(ageAnswer)knownAges[age[1]]=spoken.fact.relativeAge;
 const heard=new Set([
  ...questions.map(norm),
  ...history.filter(h=>h?.who==='panda').map(h=>norm(h.hanzi)),
  asked
 ]);
 const opts={allowed,catalog,lookupAudio};
 // Ask a specific age only if the learner says this sibling exists.
 // Earlier family facts are remembered within this open conversation.
 const latest=siblingAnswer&&learnerSibling[1]==='有'?learnerSibling[2]:null;
 const positives=[latest,...SIBLINGS.filter(s=>facts[s]===true)].filter((s,i,a)=>s&&a.indexOf(s)===i);
 let followup=null;
 for(const member of positives){
  if(knownAges[member]!=null)continue;
  const candidate='你'+member+'几岁';
  if(heard.has(norm(candidate)))continue;
  const reviewed=verifiedPrompt(candidate,member,opts);
  if(reviewed){followup=reviewed;break}
 }
 if(!followup){
  for(const member of QUESTION_ORDER){
   if(facts[member]!==undefined)continue;
   const candidate='你有'+member+'吗';
   if(heard.has(norm(candidate)))continue;
   const reviewed=verifiedPrompt(candidate,member,opts);
   if(reviewed){followup=reviewed;break}
  }
 }
 // The family-size question belongs near the end of the topic, not as a loop.
 if(!followup&&!isSize&&!heard.has('你家有几口人'))
  followup=verifiedPrompt('你家有几口人',null,opts);
 const confirmations=history.filter(h=>h?.who==='panda'&&ACKS.some(a=>norm(a.hanzi)===norm(h.hanzi))).length;
 const preferred=ACKS[confirmations%ACKS.length];
 const reply=lookupAudio?.(preferred.hanzi)?{...preferred}:result.reply;
 return {...result,kind:'answer',lesson:6,reply,followup,
  message:followup
   ?'Панда учла твои ответы о семье и задаст следующий проверенный вопрос.'
   :'Ответ принят. Новых озвученных вопросов по этой теме пока нет.'};
}
