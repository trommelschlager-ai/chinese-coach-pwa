// v412: keep AUTOMATIC Non-Stop follow-ups audible without inventing MP3s.
// Free-form/manual prompts may remain text-only, with the existing warning.
const clean=value=>String(value??'').normalize('NFC').replace(/[。！？?!，,\s]/g,'');
export function chooseAudibleFollowup(proposed, groups=[],recent=[],lookup,learnerInput=''){
 if(!proposed||typeof lookup!=='function')return null;
 const audible=entry=>Boolean(entry&&(lookup(entry.hanzi)||lookup(entry.audioKey)));
 if(audible(proposed))return proposed;
 const lesson=Number(proposed.lesson);
 const group=(Array.isArray(groups)?groups:[]).find(g=>g.lesson===lesson);
 if(!group)return null;
 const heard=new Set((Array.isArray(recent)?recent:[]).map(clean));
 heard.add(clean(learnerInput));
 const candidates=(group.questions||[]).filter(q=>
   q&&Number(q.lesson)===lesson&&q.hanzi&&q.pinyin&&q.ru&&
   !heard.has(clean(q.hanzi))&&audible(q));
 // When the learner asks about free time, stay with that subject when possible.
 const preferAvailability=clean(learnerInput).includes('有空');
 const picked=(preferAvailability?candidates.find(q=>clean(q.hanzi)==='你今天有空吗'):null)
   ||candidates.find(q=>q.hasRecordedReply)||candidates[0];
 if(!picked)return null;
 return {
  hanzi:picked.hanzi,pinyin:picked.pinyin,ru:picked.ru,lesson,
  audioKey:picked.hanzi,accepted:[],isContextual:true,intent:'audible-followup'
 };
}
