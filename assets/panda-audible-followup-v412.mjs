// v412: keep AUTOMATIC Non-Stop follow-ups audible without inventing MP3s.
// Free-form/manual prompts may remain text-only, with the existing warning.
const clean=value=>String(value??'').normalize('NFC').replace(/[。！？?!，,\s]/g,'');
export function chooseAudibleFollowup(proposed, groups=[],recent=[],lookup,learnerInput=''){
 if(!proposed||typeof lookup!=='function')return null;
 const audible=entry=>Boolean(entry&&(lookup(entry.hanzi)||lookup(entry.audioKey)));
 const availabilityAsked=/^你(?:星期几|今天)有空(?:吗)?$/.test(clean(learnerInput));
 // An unrelated recorded question is not a good follow-up either.
 if(audible(proposed)&&(!availabilityAsked||clean(proposed.hanzi).includes('有空')))return proposed;
 const lesson=Number(proposed.lesson);
 const group=(Array.isArray(groups)?groups:[]).find(g=>g.lesson===lesson);
 if(!group)return null;
 const heard=new Set((Array.isArray(recent)?recent:[]).map(clean));
 heard.add(clean(learnerInput));
 const candidates=(group.questions||[]).filter(q=>
   q&&Number(q.lesson)===lesson&&q.hanzi&&q.pinyin&&q.ru&&
   !heard.has(clean(q.hanzi))&&audible(q));
 // When the learner asks about availability, do NOT jump to an unrelated
 // weekday question merely because it has MP3. End the automatic chain if
 // there are no new, recorded availability prompts.
 const availabilityCandidates=availabilityAsked?
   candidates.filter(q=>clean(q.hanzi).includes('有空')):candidates;
 const picked=(availabilityAsked?availabilityCandidates.find(q=>clean(q.hanzi)==='你今天有空吗'):null)
   ||availabilityCandidates.find(q=>q.hasRecordedReply)
   ||availabilityCandidates[0];
 if(!picked)return null;
 return {
  hanzi:picked.hanzi,pinyin:picked.pinyin,ru:picked.ru,lesson,
  audioKey:picked.hanzi,accepted:[],isContextual:true,intent:'audible-followup'
 };
}
