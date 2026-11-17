/* Panda Brain v431 — grounded, in-session continuity for introduction,
 * free time / weekdays, and weather.
 * Does not persist personal facts, invent speech, evaluate microphone tones,
 * or claim the fictional Panda knows live weather conditions.
 */
const norm=v=>String(v??'').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g,'');
const confirmations=Object.freeze([
 {hanzi:'好的，我明白了。',pinyin:'Hǎo de, wǒ míngbai le.',ru:'Хорошо, я поняла.'},
 {hanzi:'谢谢你告诉我。',pinyin:'Xièxie nǐ gàosu wǒ.',ru:'Спасибо, что рассказал.'}
]);
const supportedQuestions=new Set([
 '你叫什么名字','你是老师吗',
 '你星期几有空','你今天有空吗',
 '今天天气怎么样','明天天气怎么样',
 '今天星期几','明天星期几',
 '今天几月几号','明天几月几号'
]);
function latestQuestion(history=[]){
 for(let i=history.length-1;i>=0;i--){
  const item=history[i];
  if(item?.who==='you')break;
  const q=norm(item?.hanzi);
  if(item?.who==='panda'&&supportedQuestions.has(q))return q;
 }
 return '';
}
function reviewed(hanzi,lesson,{allowed,catalog,lookupAudio,seen}){
 if(!allowed.includes(lesson)||seen.has(norm(hanzi)))return null;
 const group=catalog.find(g=>g.lesson===lesson);
 const q=group?.questions?.find(item=>item.lesson===lesson&&norm(item.hanzi)===norm(hanzi));
 if(!q?.pinyin||!q?.ru||!lookupAudio?.(q.hanzi))return null;
 return {hanzi:/[？?]$/.test(q.hanzi)?q.hanzi:q.hanzi+'？',
  pinyin:q.pinyin,ru:q.ru,lesson,audioKey:q.hanzi,
  isContextual:true,accepted:[]};
}
export function enrichTopics431({
 input,activePrompt,result,profile={},allowed=[],questions=[],history=[],
 catalog=[],lookupAudio
}={}){
 const spoken=result?.spoken;
 if(!spoken?.known||spoken.correction||!result.reply||
    !['answer','statement'].includes(result.kind))return result;
 const utterance=norm(input),active=norm(activePrompt?.hanzi||activePrompt?.panda)||latestQuestion(history);
 const topic=spoken.topic;
 if(!allowed.includes(topic))return result;
 const heard=new Set([...questions.map(norm),
  ...history.filter(x=>x?.who==='panda').map(x=>norm(x.hanzi)),active]);
 const context={allowed,catalog,lookupAudio,seen:heard};
 let followup=null,matched=false;
 if(topic===2){
  const name=/^我叫([\u3400-\u9fffA-Za-z]{1,16})$/.exec(utterance);
  if(active==='你叫什么名字'&&name&&spoken.fact?.name===name[1]){
   matched=true;
   followup=reviewed('你是老师吗',2,context);
  }
  const role=/^我(是|不是)(老师|学生)$/.exec(utterance);
  if(active==='你是老师吗'&&role&&spoken.fact?.subject==='我'&&
     spoken.fact.role===role[2]&&spoken.fact.negative===(role[1]==='不是')){
   matched=true;
   followup=reviewed('你叫什么名字',2,context);
  }
 }
 if(topic===4){
  const free=/^我(今天|星期[一二三四五六日天])有空$/.exec(utterance);
  if(free&&spoken.fact?.freeDay===free[1]){
   const day=free[1];
   matched=(active==='你星期几有空'&&day!=='今天')||
    (active==='你今天有空吗'&&day==='今天')||
    (active==='你星期天有空吗'&&(day==='星期天'||day==='星期日'));
   if(matched){
    followup=reviewed(active==='你星期几有空'?'你今天有空吗':'你星期几有空',4,context);
   }
  }
  // Calendar answers are checked by the core engine against the device date.
  // Do not convert an unchecked weekday sentence into a 'correct' answer.
  if(!matched&&result.kind==='answer'&&
     /^(今天|明天)星期几$/.test(active)&&
     /^(今天|明天)(是)?星期[一二三四五六日天]$/.test(utterance)&&
     utterance.startsWith(active.slice(0,2))){
    matched=true;
    followup=reviewed('你星期几有空',4,context);
  }
 }
 if(topic===5&&result.kind==='answer'&&active==='今天几月几号'&&
    /^今天(是)?[零一二三四五六七八九十\d]+月[零一二三四五六七八九十\d]+(号|日)$/.test(utterance)){
  matched=true;
  followup=reviewed('明天几月几号',5,context);
 }
 if(topic===7&&spoken.fact?.weather&&
    /^(今天|明天)天气怎么样$/.test(active)){
  const time=active.slice(0,2);
  const textTime=/^(今天|明天|昨天)/.exec(utterance)?.[1]||'今天';
  // A description of TODAY is not an answer to TOMORROW's forecast.
  if(textTime===time&&spoken.fact.time===time&&
     /^(今天|明天)?(?:天气)?(?:不(?:冷|热|下雨|下雪)|很冷|很热|很好|下雨|在下雨|下雪|晴天|阴天|有风)$/.test(utterance)){
   matched=true;
   followup=reviewed(time==='今天'?'明天天气怎么样':'今天天气怎么样',7,context);
  }
 }
 if(!matched)return result;
 const previous=history.filter(x=>x?.who==='panda'&&confirmations.some(a=>norm(a.hanzi)===norm(x.hanzi))).length;
 const ack=confirmations[previous%confirmations.length];
 // If a sound clip disappears, never fabricate a reading or mark it 'spoken'.
 const reply=lookupAudio?.(ack.hanzi)?{...ack}:result.reply;
 return {...result,kind:'answer',lesson:topic,reply,followup,
  message:followup?'Панда учла ответ и выбрала следующий озвученный вопрос по теме.':
   'Панда поняла ответ. Других новых озвученных вопросов по теме пока нет.'};
}
