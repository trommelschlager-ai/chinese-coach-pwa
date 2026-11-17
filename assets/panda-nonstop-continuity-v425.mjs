/* Panda AI v425 — safe Non-Stop continuation for two newly voiced v411 dialogues.
 * Never repeat the learner's own question, jump from free-time to calendar,
 * invent an MP3, or ask a question from a locked lesson.
 * The selected follow-up is validated by the existing answer catalog.
 */
const clean=value=>String(value??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const SUGGESTIONS=Object.freeze({
 '你有妹妹吗':{lesson:6,questions:['你有哥哥吗']},
 '你星期几有空':{lesson:4,questions:['你今天有空吗']}
});
export function coherentPandaFollowup({input,result,followup=null,allowed=[],questions=[],catalog=[],lookupAudio}={}){
 const said=clean(input),reply=result?.reply;
 const suggestion=SUGGESTIONS[said];
 if(suggestion&&result?.kind==='question'&&reply){
  if(!allowed.includes(suggestion.lesson))return null;
  const seen=new Set([said,...questions.map(clean)]);
  const pool=catalog.find(group=>group.lesson===suggestion.lesson)?.questions||[];
  for(const candidate of suggestion.questions){
   if(seen.has(candidate))continue;
   const reviewed=pool.find(item=>clean(item.hanzi)===candidate&&item.lesson===suggestion.lesson);
   if(!reviewed?.pinyin||!reviewed?.ru||!lookupAudio?.(reviewed.hanzi))continue;
   return {
    hanzi:reviewed.hanzi,pinyin:reviewed.pinyin,ru:reviewed.ru,
    lesson:suggestion.lesson,audioKey:reviewed.hanzi,
    isContextual:true,accepted:[]
   };
  }
  // No verified, recorded same-topic continuation. Stay silent rather than
  // repeat the same question or switch to an unrelated topic.
  return null;
 }
 // Generic safety guard for the remaining dialogue types.
 if(followup&&clean(followup.hanzi||followup.panda)===said)return null;
 return followup;
}
