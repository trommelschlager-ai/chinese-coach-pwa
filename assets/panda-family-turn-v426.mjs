/* Panda AI v426 — continue a family conversation after the learner answers.
 * Only for a verified reply to the ACTIVE sibling yes/no question.
 * Retain the approved voice and character; do not invent unrecorded speech.
 */
const key=value=>String(value??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const SIBLINGS=Object.freeze(['哥哥','姐姐','弟弟','妹妹']);
const NEXT=Object.freeze([
  '你有姐姐吗','你有弟弟吗','你有妹妹吗','你有哥哥吗','你家有几口人'
]);
const ACK=Object.freeze({
 hanzi:'好的，我明白了。',
 pinyin:'Hǎo de, wǒ míngbai le.',
 ru:'Хорошо, я поняла.'
});
export function continueFamilyAfterAnswer({input,activePrompt,result,allowed=[],questions=[],history=[],catalog=[],lookupAudio}={}){
 if(!allowed.includes(6)||!result?.spoken?.known||result.spoken.topic!==6)return result;
 const utterance=key(input),asked=key(activePrompt?.hanzi||activePrompt?.panda);
 const m=/^我(没有|有)(哥哥|姐姐|弟弟|妹妹)$/.exec(utterance);
 if(!m||!SIBLINGS.includes(m[2])||asked!=='你有'+m[2]+'吗')return result;
 // Never interpret a correction/uncertain recognition as a correct reply.
 if(result.kind==='correction'||result.kind==='clarify'||!result.reply)return result;
 // This is an answer to the exact question, not a fresh unrelated statement.
 const spoken=result.spoken;
 if(spoken.family?.absent&&spoken.family.absent!==m[2])return result;
 const heard=new Set([asked,...questions.map(key),...history.map(entry=>key(entry.hanzi))]);
 const recorded=lookupAudio?.(ACK.hanzi);
 const reply=recorded?{...ACK}:result.reply;
 const familyPool=catalog.find(group=>group.lesson===6)?.questions||[];
 let followup=null;
 for(const candidate of NEXT){
  if(heard.has(candidate))continue;
  const item=familyPool.find(q=>key(q.hanzi)===candidate&&q.lesson===6);
  if(!item?.pinyin||!item?.ru||!lookupAudio?.(item.hanzi))continue;
  followup={hanzi:item.hanzi,pinyin:item.pinyin,ru:item.ru,lesson:6,
   audioKey:item.hanzi,isContextual:true,accepted:[]};
  break;
 }
 return {...result,kind:'answer',reply,followup,
  message:followup
   ?'Ответ о семье понят. Панда продолжит другим записанным вопросом по семье.'
   :'Ответ понят. Новых записанных вопросов по семье пока нет; можно задать свой.'};
}
