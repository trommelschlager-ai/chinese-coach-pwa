/* Panda Brain v435 — consistency and non-repetition for verified in-session facts.
 * This is NOT persistent, generative AI, a tone grader, or a real-world forecast.
 * Reuse only authored, unlocked questions with an exact approved Panda MP3.
 */
const clean=value=>String(value??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const SIBLINGS=['哥哥','姐姐','弟弟','妹妹'];

/** Copy only facts verified by the existing HSK dialogue parser. */
export function mergePandaFacts435(profile={},spoken=null){
 if(!spoken?.known||spoken.correction)return profile;
 const merged={...profile,family:{...(profile.family||{})},
  siblingAges:{...(profile.siblingAges||{})}};
 const fact=spoken.fact;
 if(fact&&typeof fact==='object')Object.assign(merged,fact);
 if(spoken.family){
  for(const member of spoken.family.present||[]){
   if(SIBLINGS.includes(member))merged.family[member]=true;
   else if(member==='妈妈'||member==='爸爸')merged.family[member]=true;
  }
  const absent=spoken.family.absent;
  if(absent&&[...SIBLINGS,'妈妈','爸爸'].includes(absent)){
   merged.family[absent]=false;
   // Correct previously stored age if the learner explicitly corrects a
   // formerly positive sibling statement. Do not remember contradictions.
   delete merged.siblingAges[absent];
  }
 }
 if(SIBLINGS.includes(fact?.relative)&&Number.isInteger(fact.relativeAge)&&
    fact.relativeAge>0&&fact.relativeAge<=120){
  merged.family[fact.relative]=true;
  merged.siblingAges[fact.relative]=fact.relativeAge;
 }
 return merged;
}

export function knowsAnswer435(hanzi,profile={}){
 const q=clean(hanzi),family=profile.family||{},ages=profile.siblingAges||{};
 if(q==='你叫什么名字')return typeof profile.name==='string'&&profile.name.trim().length>0;
 if(q==='你是老师吗'||q==='你是学生吗')return !!profile.role&&profile.subject==='我';
 if(q==='你做什么工作')return !!profile.profession;
 let m=/^你有(哥哥|姐姐|弟弟|妹妹)吗$/.exec(q);
 if(m)return typeof family[m[1]]==='boolean';
 m=/^你(哥哥|姐姐|弟弟|妹妹)几岁$/.exec(q);
 if(m)return family[m[1]]===false||(Number.isInteger(ages[m[1]])&&ages[m[1]]>0);
 if(q==='你家有几口人')return Number.isInteger(profile.familySize)&&profile.familySize>0;
 if(q==='你星期几有空')return /^星期[一二三四五六日天]$/.test(profile.freeDay||'');
 if(q==='你今天有空吗')return profile.freeDay==='今天';
 return false;
}

/** Keep a useful current follow-up, but replace an already-answered one. */
export function refineFollowup435({
 followup=null,profile={},allowed=[],questions=[],history=[],catalog=[],lookupAudio
}={}){
 if(!followup)return null;
 const target=clean(followup.hanzi||followup.panda);
 if(!knowsAnswer435(target,profile))return followup;
 const lesson=followup.lesson;
 if(!allowed.includes(lesson))return null;
 const group=catalog.find(g=>g.lesson===lesson);
 if(!group)return null;
 const seen=new Set([
  ...questions.map(clean),
  ...history.filter(x=>x?.who==='panda').map(x=>clean(x.hanzi)),
  target
 ]);
 // Conversation-first priorities: after a sibling exists, ask its recorded age;
 // after an introduction, ask a different verified learner question.
 const priority=lesson===6?[
  ...SIBLINGS.filter(member=>profile.family?.[member]===true&&
   !Number.isInteger(profile.siblingAges?.[member])).map(member=>'你'+member+'几岁'),
  ...SIBLINGS.filter(member=>profile.family?.[member]===undefined).map(member=>'你有'+member+'吗'),
  '你家有几口人'
 ]:lesson===2?[
  '你叫什么名字','你是老师吗','你是学生吗','你做什么工作','你住在哪里','你住在哪儿'
 ]:lesson===4?['你今天有空吗','你星期几有空']:[];

 const options=Array.isArray(group.questions)?group.questions:[];
 const ordered=[...priority.map(p=>options.find(q=>clean(q.hanzi)===p)),...options].filter(Boolean);
 for(const q of ordered){
  const phrase=clean(q.hanzi);
  if(!phrase||seen.has(phrase)||knowsAnswer435(phrase,profile))continue;
  if(q.lesson!==lesson||!q.pinyin||!q.ru||!lookupAudio?.(q.hanzi))continue;
  const age=/^你(哥哥|姐姐|弟弟|妹妹)几岁$/.exec(phrase);
  if(age&&(!allowed.includes(3)||profile.family?.[age[1]]!==true))continue;
  const member=/^你有(哥哥|姐姐|弟弟|妹妹)吗$/.exec(phrase);
  if(member&&profile.family?.[member[1]]!==undefined)continue;
  // Questions about unknown subjects are not promoted just to fill silence;
  // the regular course engine decides broad new topic changes.
  if(lesson===6&&!age&&!member&&phrase!=='你家有几口人')continue;
  if(lesson===2&&!priority.includes(phrase))continue;
  if(lesson===4&&!priority.includes(phrase))continue;
  return {
   hanzi:/[？?]$/.test(q.hanzi)?q.hanzi:q.hanzi+'？',
   pinyin:q.pinyin,ru:q.ru,lesson,audioKey:q.hanzi,
   isContextual:true,accepted:[],
   ...(age?{intent:'relative-age',relative:age[1]}:{}),
   ...(phrase==='你家有几口人'?{intent:'family-size'}:{})
  };
 }
 // Do not ask another person's known facts again, nor invent sound.
 return null;
}
