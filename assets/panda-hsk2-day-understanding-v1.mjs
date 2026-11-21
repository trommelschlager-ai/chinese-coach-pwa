/* Panda Go HSK2 "My Day": reviewed context-aware answers, not an LLM.
   Browser speech-to-text cannot measure Chinese tones. */
const norm=v=>String(v??'').normalize('NFC').replace(/[。？！，!?、,；;\s]/gu,'').trim();
const dot=v=>String(v).replace(/[。！？!?]+$/u,'')+'。';
const digits={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
function number(s){
 if(/^\d{1,2}$/.test(s))return Number(s);
 if(Object.hasOwn(digits,s))return digits[s];
 const m=/^([一二三四五六七八九]?)(十)([一二三四五六七八九]?)$/.exec(s);
 return m?(m[1]?digits[m[1]]:1)*10+(m[3]?digits[m[3]]:0):null;
}
function getTimes(s){
 const found=[];
 const p=/([零〇一二两三四五六七八九十\d]{1,3})点(半|一刻|三刻|[零〇一二两三四五六七八九十\d]{1,3}分?)?/gu;
 for(const m of s.matchAll(p)){
  const hour=number(m[1]),v=m[2],minute=!v?0:v==='半'?30:v==='一刻'?15:v==='三刻'?45:number(v.replace('分',''));
  if(hour===null||hour<0||hour>23||minute===null||minute<0||minute>59)return {invalid:true,matches:[]};
  found.push({text:m[0],index:m.index});
 }
 for(const m of s.matchAll(/([01]?\d|2[0-3])[:：]([0-5]\d)/gu)){
  if(m.index>0&&/[0-9]/.test(s[m.index-1]))continue;
  found.push({text:m[0],index:m.index});
 }
 found.sort((a,b)=>a.index-b.index);
 return {invalid:false,matches:found};
}
function question(s){
 if(!s.startsWith('你'))return null;
 if(/几点.*起床|什么时候.*起床|起床.*几点/.test(s))return 0;
 if(/起床以后做什么|早上做什么/.test(s))return 1;
 if(/(?:吃早饭|吃早餐).*吗|早上.*吃.*吗/.test(s))return 2;
 if(/几点.*上班|什么时候.*上班/.test(s))return 3;
 if(/几点.*睡觉|什么时候.*睡觉/.test(s))return 4;
 return -1;
}
const accept=(value,message='Поняла тебя. Китайские тоны по тексту не проверяются.')=>({kind:'accepted',value:dot(value),message});
const clarify=message=>({kind:'clarify',message});
const correct=(value,message)=>({kind:'correct',correction:dot(value),message});
const unknown=()=>({kind:'unconfirmed',message:'Я не могу уверенно подтвердить смысл. Попробуй уточнить, это не оценка произношения.'});
function timeAnswer(s,i){
 const t=getTimes(s);
 if(t.invalid)return clarify('Проверь часы: допустимо время от 0 до 23.');
 if(t.matches.length===2){
  const [first,last]=t.matches;
  const action=i===0?'起床':'睡觉';
  if(s==='不是'+first.text+'是'+last.text||s==='不是'+first.text+'是'+last.text+action)
   return timeAnswer(last.text,i);
  const routine=/^(?:我)?(?:平时|通常|一般|每天)/u.exec(s);
  if(routine&&s.startsWith(routine[0]+first.text+action+'今天')&&
     ['今天'+last.text+action,'今天'+last.text+'才'+action].includes(s.slice(s.indexOf('今天'))))
   return accept(s.replace('今天','，今天'));
 }
 if(t.matches.length>1)return clarify('Уточни одно обычное время: ты назвал больше одного.');
 const m=t.matches[0],action=i===0?'起床':'睡觉';
 if(!m){
  if(i===4&&/^(?:我)?(?:晚上)?(?:睡觉|睡了|睡)$/u.test(s))
   return clarify('Поняла: 睡觉 (shuìjiào) — «спать». А во сколько? Например: 我晚上十点睡觉。');
  if(i===0&&/^(?:我)?(?:每天)?(?:起床|起来)$/u.test(s))
   return clarify('Поняла: 起床 — «вставать». А во сколько? Например: 我每天七点起床。');
  return clarify(i===0?'你一般几点起床？ — Назови точное время подъёма.':'你晚上一般几点睡觉？ — Назови точное время сна.');
 }
 const before=s.slice(0,m.index),after=s.slice(m.index+m.text.length);
 if(!after||after==='左右'||after==='前后'){
  if(!/^(?:我)?(?:(?:每天|平时|一般|通常|大概|差不多|早上|晚上|凌晨|上午|下午|有时候|今天|周末))*$/.test(before))return unknown();
  return accept(i===0?'我每天'+m.text+'起床':'我晚上'+m.text+'睡觉');
 }
 if(!s.endsWith(action)&&!s.endsWith(i===0?'起来':'睡'))return clarify(i===0?'你几点起床？ — Назови время подъёма.':'你几点睡觉？ — Назови время сна.');
 if(m.index>s.indexOf(i===0?'起':'睡'))
  return correct((i===0?'我每天':'我晚上')+m.text+action,'Сначала время, затем действие: 我八点起床 / 我十一点睡觉.');
 if(/不睡觉|没睡觉|不起床|没起床/.test(s))return clarify('Уточни, когда это обычно происходит.');
 if(s.length>65)return unknown();
 return accept(s);
}
const activities=['刷牙','洗脸','洗澡','喝水','喝茶','喝咖啡','吃早饭','吃早餐','做早饭','做早餐','做饭','吃饭','跑步','运动','锻炼','看手机','看书','学习中文','学中文','上厕所','穿衣服','收拾房间','去上班','去上学','工作','休息','遛狗'];
function afterWake(s){
 // A short, perfectly intelligible activity answer: 睡觉 — to sleep.
 // It is unusual after getting up, but not a recognition error. Do not
 // invent the exact duration or claim the learner pronounced tones correctly.
 if(/^(?:我)?(?:起床(?:以后|之后|后))?(?:又|再|继续|还)?(?:睡觉|睡了|睡一会儿|睡个回笼觉)$/u.test(s)||
    /^(?:我)?(?:再|又)?睡(?:个)?回笼觉$/u.test(s)){
  const answer=/^(?:我)?(?:睡觉|睡了)$/u.test(s)?'我起床以后睡觉':s;
  return accept(answer,'Поняла: 睡觉 (shuìjiào) — «спать». Если снова ложишься после подъёма, естественнее: 我起床以后又睡了。');
 }
 if(/不知道|忘了/.test(s))return clarify('你起床以后做什么？ — Назови хотя бы одно действие.');
 if(/下班以后|下班之后|睡觉以后/.test(s))return clarify('Это действие после работы или сна. Что ты делаешь сразу после утреннего подъёма?');
 if(/(?:起床|起来)(?:以后|之后|后)?$/.test(s))return clarify('А что ты делаешь после того, как встанешь?');
 const found=activities.filter(v=>s.includes(v));
 if(!found.length)return clarify('你起床以后做什么？ — Например: 喝水, 刷牙, 洗脸.');
 if(/喜欢|想要|应该|打算|计划/.test(s))return clarify('А что ты делаешь обычно, а не только планируешь?');
 if(s.length>85)return unknown();
 return accept(s,found.length>1?'Поняла несколько действий после подъёма.':'Поняла твоё действие после подъёма.');
}
function breakfast(s){
 if(s==='吃'||s==='吃了'||s==='吃过')return accept('我早上吃早饭');
 if(s==='不吃')return accept('我早上不吃早饭');
 if(s==='没吃')return accept('我今天没吃早饭');
 if(/^(?:我)?(?:今天|每天|早上|上午|平时|一般|通常|有时候|偶尔|经常|从来|从不|现在|很少|还)?(?:不|没|没有|还没|从来不|很少|不怎么)?吃(?:了|过)?(?:早饭|早餐)?$/.test(s)){
  if(!/(?:早饭|早餐)/.test(s)&&s.length>8)return clarify('Уточни, речь именно о завтраке?');
  return accept(s);
 }
 if(/(?:早饭|早餐)/.test(s)&&/吃/.test(s)&&s.length<70)return accept(s);
 return clarify('你早上吃早饭吗？ — Можно сказать 吃 / 不吃 / 我有时候吃早饭.');
}
function work(s){
 if(/^(?:我)?(?:今天|现在|目前|每天|平时|周末|一般|通常)?(?:不|没|没有|不用)(?:去)?(?:上班|工作)$/.test(s)||
    /^(?:我)?(?:现在|目前)?(?:没有工作|没工作|退休了|是学生|在家工作|在家上班|今天休息|今天放假|不用上班)$/.test(s))
  return accept(s,'Поняла: ты не ходишь на работу в указанное время.');
 const t=getTimes(s);
 if(t.invalid)return clarify('Назови правильный час от 0 до 23.');
 if(t.matches.length===2){
  const [first,last]=t.matches;
  const action=i===0?'起床':'睡觉';
  if(s==='不是'+first.text+'是'+last.text||s==='不是'+first.text+'是'+last.text+action)
   return timeAnswer(last.text,i);
  const routine=/^(?:我)?(?:平时|通常|一般|每天)/u.exec(s);
  if(routine&&s.startsWith(routine[0]+first.text+action+'今天')&&
     ['今天'+last.text+action,'今天'+last.text+'才'+action].includes(s.slice(s.indexOf('今天'))))
   return accept(s.replace('今天','，今天'));
 }
 if(t.matches.length>1)return clarify('Уточни одно время работы.');
 const m=t.matches[0];
 if(!m)return clarify('你几点去上班？ — Если не работаешь, скажи 我不上班.');
 if(/^(?:我)?去[零〇一二两三四五六七八九十\d]+点/.test(s))
   return correct('我'+m.text+'去上班','Время в китайском ставится перед глаголом: 我八点去上班。');
 if(s===m.text||s==='我'+m.text)return accept('我'+m.text+'去上班');
 if(/^(?:我)?(?:每天|平时|一般|通常|早上|下午|晚上)?(?:大概|差不多)?/.test(s)&&
   /(?:去上班|上班|去上学|上学|开始工作|开始上班|工作)$/.test(s)&&s.indexOf(m.text)<s.lastIndexOf('上'))
  return accept(s);
 return clarify('你几点去上班？ — Скажи, например, 我九点去上班。');
}
export function understandDayAnswer(raw,index){
 const s=norm(raw);
 if(!Number.isInteger(index)||index<0||index>4)return unknown();
 if(!s)return clarify('Скажи или напиши ответ на китайском.');
 if(s.length>120)return unknown();
 if(/^(?:他|她|他们|她们|它|我哥哥|我弟弟|我姐姐|我妹妹|我爸爸|我妈妈|我朋友)/u.test(s))
  return clarify('Я спрашиваю именно о твоём дне. Ответь о себе: 我……');
 const q=question(s);
 if(q!==null)return q>=0?{kind:'user-question',questionIndex:q,message:'Панда ответит о своём дне и вернётся к твоему вопросу.'}:{kind:'other-question',message:'Сообщение получено, но этот тематический режим пока не умеет отвечать на произвольные вопросы. Попробуй вопрос о распорядке дня, например 你几点起床？'};
 if(/[?？]\s*$/.test(String(raw))||/^(?:什么|为什么|怎么|谁|哪里|哪儿|多少|几)/u.test(s))return {kind:'other-question',message:'Вопрос отправлен. В этом уроке я могу обсудить свой день, но пока не умею отвечать на любые темы.'};
 if(s.endsWith('吗')&&!s.startsWith('你'))return unknown();
 if(/想|打算|计划|应该|需要/u.test(s))return clarify('Ты рассказал о желании или плане. А что ты обычно делаешь на самом деле?');
 if(index===0||index===4)return timeAnswer(s,index);
 if(index===1)return afterWake(s);
 if(index===2)return breakfast(s);
 if(index===3)return work(s);
 return unknown();
}
