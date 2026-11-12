/* Panda GO v285 · deterministic HSK1 slot-based dialogue engine.
 * Extends, does not replace, teacher-approved phrases and local MP3.
 * Generated written prompts are not treated as audio or real forecasts.
 * No model calls, network calls, personal-data uploads, or persistent secrets.
 */
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=285';

const cn=normalize;
const d=['零','一','二','三','四','五','六','七','八','九'];
const py=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
const NUM_BY_ZH=new Map();
function zhNum(n){if(n===100)return '一百';if(n<10)return d[n];if(n<20)return '十'+(n%10?d[n%10]:'');return d[Math.floor(n/10)]+'十'+(n%10?d[n%10]:'')}
function pyNum(n){if(n===100)return 'yì bǎi';if(n<10)return py[n];if(n<20)return 'shí'+(n%10?' '+py[n%10]:'');return py[Math.floor(n/10)]+' shí'+(n%10?' '+py[n%10]:'')}
for(let n=0;n<=100;n++)NUM_BY_ZH.set(zhNum(n),n);
const dayNames=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const weekdays=[
 {zh:'星期天',py:'xīngqītiān',ru:'воскресенье',value:0},
 {zh:'星期一',py:'xīngqīyī',ru:'понедельник',value:1},
 {zh:'星期二',py:'xīngqīèr',ru:'вторник',value:2},
 {zh:'星期三',py:'xīngqīsān',ru:'среда',value:3},
 {zh:'星期四',py:'xīngqīsì',ru:'четверг',value:4},
 {zh:'星期五',py:'xīngqīwǔ',ru:'пятница',value:5},
 {zh:'星期六',py:'xīngqīliù',ru:'суббота',value:6}
];
const relativeList=[
 {zh:'哥哥',py:'gēge',ru:'старший брат',acc:'старший брат',present:true},
 {zh:'姐姐',py:'jiějie',ru:'старшая сестра',acc:'старшую сестру',present:false},
 {zh:'弟弟',py:'dìdi',ru:'младший брат',acc:'младшего брата',present:false},
 {zh:'妹妹',py:'mèimei',ru:'младшая сестра',acc:'младшую сестру',present:true}
];
const timeList=[
 {zh:'今天',py:'Jīntiān',ru:'сегодня',shift:0},
 {zh:'明天',py:'Míngtiān',ru:'завтра',shift:1},
 {zh:'昨天',py:'Zuótiān',ru:'вчера',shift:-1}
];
const weatherList=[
 {zh:'冷',py:'lěng',ru:'холодно'},
 {zh:'热',py:'rè',ru:'жарко'},
 {zh:'下雨',py:'xià yǔ',ru:'идёт дождь'},
 {zh:'下雪',py:'xià xuě',ru:'идёт снег'}
];
const weekdayDate=(date,shift=0)=>{const v=new Date(date);v.setDate(v.getDate()+shift);return v};
const statement=(hanzi,pinyin,ru,context='')=>({hanzi,pinyin,ru,context,audioKey:lookupPilotAudio(hanzi)?hanzi:null});
const say=(hanzi,pinyin,ru,lesson,answer,accepted,options={})=>({
 hanzi,pinyin,ru,lesson,
 answer,accepted,requires:options.requires||[],family:options.family||'general',
 context:options.context||'',intent:'pattern',isContextual:!!options.contextual,
 lessonName:options.lessonName||'',
 audioKey:lookupPilotAudio(hanzi)?hanzi:null,
 instruction:options.instruction||('Ответь по изученному материалу. Например: '+(accepted?.[0]||'')),
 options:[],
 calendarDate:options.calendarDate||null
});
const makeAnswer=(p,date=new Date())=>typeof p.answer==='function'?p.answer(date):p.answer;
const greetLesson='Персонаж Панды — условный учитель; её семья и события являются учебной сценкой.';
const lessonWeather='Учебная ситуация, а не настоящий прогноз погоды.';
const slots={relatives:relativeList,weekdays,time:timeList,weather:weatherList};
function createBank(date=new Date()){
 const bank=[],unique=new Set();
 const add=(q)=>{const key=cn(q.hanzi);if(!unique.has(key)){unique.add(key);bank.push(q)}};
 // Topic 2: school role, no invented identities for off-screen people.
 for(const [name,pyRole,ruRole,yes] of [['老师','lǎoshī','учитель',true],['学生','xuésheng','студент',false]]){
  const answer=yes?statement('是，我是老师。','Shì, wǒ shì lǎoshī.','Да, я учитель.',greetLesson):
   statement('不是，我是老师。','Bú shì, wǒ shì lǎoshī.','Нет, я учитель.',greetLesson);
  add(say('你是'+name+'吗？','Nǐ shì '+pyRole+' ma?','Ты '+ruRole+'?',2,answer,
   ['是','不是','我是'+name,'我不是'+name],{family:'role',context:greetLesson}));
 }
 // Topic 3: numbers. These are extension prompts after the number lesson.
 const ns=[0,1,2,3,4,5,6,7,8,9,10,11,12,15,18,19,20,21,24,29,30,38,40,49,50,60,70,80,90,99,100];
 for(const n of ns){
  if(n<100){
   const next=n+1;add(say(zhNum(n)+'后面是几？',pyNum(n)+' hòumiàn shì jǐ?','Какое число после '+n+'?',3,
    statement(zhNum(next)+'。',pyNum(next)+'.',String(next)),
    [zhNum(next),String(next)],{family:'next-number'}));
  }
  if(n>0){
   const prev=n-1;add(say(zhNum(n)+'前面是几？',pyNum(n)+' qiánmiàn shì jǐ?','Какое число перед '+n+'?',3,
    statement(zhNum(prev)+'。',pyNum(prev)+'.',String(prev)),
    [zhNum(prev),String(prev)],{family:'previous-number'}));
  }
 }
 // Topic 4: real calendar determined by device locale, never a fixed weekday.
 for(const t of timeList){
  const actual=weekdays.find(x=>x.value===weekdayDate(date,t.shift).getDay());
  const base=t.zh+actual.zh+'。';
  const correct=statement(base,t.py+' '+actual.py+'.',t.ru[0].toUpperCase()+t.ru.slice(1)+': '+actual.ru+'.','По календарю устройства.');
  add(say(t.zh+'是星期几？',t.py+' shì xīngqī jǐ?','Какой день недели '+t.ru+'?',4,correct,[t.zh+actual.zh,t.zh+'是'+actual.zh,actual.zh],
   {family:'weekday-wh',context:'По календарю устройства.',calendarDate:date.toISOString()}));
  add(say(t.zh+'星期几？',t.py+' xīngqī jǐ?','Какой день недели '+t.ru+'?',4,correct,[t.zh+actual.zh,t.zh+'是'+actual.zh,actual.zh],
   {family:'weekday-wh',context:'По календарю устройства.',calendarDate:date.toISOString()}));
  for(const day of weekdays){
   const yes=day.value===actual.value;
   const answer=statement(yes?'是，'+base:'不是，'+base,
     (yes?'Shì, ':'Bú shì, ')+t.py.toLowerCase()+' '+actual.py+'.',
     (yes?'Да. ':'Нет. ')+t.ru[0].toUpperCase()+t.ru.slice(1)+' '+actual.ru+'.','По календарю устройства.');
   add(say(t.zh+'是'+day.zh+'吗？',t.py+' shì '+day.py+' ma?',t.ru+' '+day.ru+'?',4,answer,
     [yes?'是':'不是',yes?t.zh+actual.zh:'不是'+t.zh+day.zh],
     {family:'weekday-yesno',context:'По календарю устройства.',calendarDate:date.toISOString()}));
  }
 }
 // Topic 5: weekdays and dates are distinct in Mandarin.
 for(const t of timeList){
  const actual=weekdayDate(date,t.shift),month=actual.getMonth()+1,day=actual.getDate();
  const result=statement(t.zh+zhNum(month)+'月'+zhNum(day)+'号。',t.py+' '+pyNum(month)+' yuè '+pyNum(day)+' hào.',
   t.ru[0].toUpperCase()+t.ru.slice(1)+': '+day+'.'+month+'.','По календарю устройства.');
  for(const b of [
   [t.zh+'几月几号？',t.py+' jǐ yuè jǐ hào?'],
   [t.zh+'是几月几号？',t.py+' shì jǐ yuè jǐ hào?']
  ])add(say(b[0],b[1],'Какая дата '+t.ru+'?',5,result,
   [result.hanzi,t.zh+'是'+zhNum(month)+'月'+zhNum(day)+'号',zhNum(month)+'月'+zhNum(day)+'号'],
   {family:'date-wh',context:'По календарю устройства.',calendarDate:date.toISOString()}));
 }
 // Topic 6: ask about the student's family (both yes and no are legitimate).
 for(const r of relativeList){
  const accept=['有','没有','我有'+r.zh,'我没有'+r.zh,'有我有'+r.zh,'没有我没有'+r.zh];
  const answer=statement(r.present?'有，我有'+r.zh+'。':'没有，我没有'+r.zh+'。',
    r.present?'Yǒu, wǒ yǒu '+r.py+'.':'Méiyǒu, wǒ méiyǒu '+r.py+'.',
    r.present?'В учебной семье Панды есть '+r.ru+'.':'В учебной семье Панды нет: '+r.ru+'.',greetLesson);
  add(say('你有'+r.zh+'吗？','Nǐ yǒu '+r.py+' ma?','У тебя есть '+r.ru+'?',6,answer,accept,
   {family:'relative-exists',context:greetLesson,lessonName:r.zh}));
  // Further patterns contain only grammar from studied material plus guided optional vocabulary.
  add(say('你有几个'+r.zh+'？','Nǐ yǒu jǐ ge '+r.py+'?','Сколько у тебя '+r.ru+'?',6,
   statement('我有一个'+r.zh+'。','Wǒ yǒu yí ge '+r.py+'.','Учебный пример: у меня один '+r.ru+'.',greetLesson),
   ['我有一个'+r.zh,'我有两个'+r.zh,'我没有'+r.zh],{family:'relative-count',requires:[3],context:greetLesson}));
  add(say('你'+r.zh+'几岁？','Nǐ '+r.py+' jǐ suì?','Сколько лет твоему родственнику: '+r.ru+'?',6,
   statement((r.present?(r.zh==='哥哥'?'他五岁。':'她一岁。'):'我没有'+r.zh+'。'),
     r.present?(r.zh==='哥哥'?'Tā wǔ suì.':'Tā yí suì.'):'Wǒ méiyǒu '+r.py+'.',
     r.present?(r.zh==='哥哥'?'Моему старшему брату пять лет.':'Моей младшей сестре один год.'):'В учебной семье такого родственника нет.',greetLesson),
   ['我'+r.zh+'八岁','他八岁','她八岁','我没有'+r.zh],{family:'relative-age',requires:[3],context:greetLesson}));
 }
 // Topic 7: answers to weather questions are fixed teaching scenarios, not actual data.
 const fictional={
  今天:{weather:'很冷',py:'hěn lěng',ru:'холодно',rain:false,snow:false},
  明天:{weather:'下雨',py:'xià yǔ',ru:'дождь',rain:true,snow:false},
  昨天:{weather:'很热',py:'hěn rè',ru:'жарко',rain:false,snow:false}
 };
 for(const t of timeList){
  const w=fictional[t.zh];
  const base=statement(t.zh+w.weather+'。',t.py+' '+w.py+'.',t.ru[0].toUpperCase()+t.ru.slice(1)+': '+w.ru+'.',lessonWeather);
  add(say(t.zh+'天气怎么样？',t.py+' tiānqì zěnmeyàng?','Какая погода '+t.ru+'?',7,base,
   [t.zh+'很冷',t.zh+'很热',t.zh+'下雨',t.zh+'下雪'],{family:'weather-wh',context:lessonWeather}));
  for(const condition of ['rain','snow']){
   const z=condition==='rain'?'下雨':'下雪',pyC=condition==='rain'?'xià yǔ':'xià xuě',yes=w[condition];
   const rep=statement((yes?t.zh+z:t.zh+'不'+z)+'。',
     t.py+' '+(yes?'':'bú ')+pyC+'.',(yes?'В учебной сценке '+t.ru+' идёт ': 'В учебной сценке '+t.ru+' нет ')+(condition==='rain'?'дождя.':'снега.'),lessonWeather);
   add(say(t.zh+z+'吗？',t.py+' '+pyC+' ma?',t.ru+' '+(condition==='rain'?'дождь':'снег')+'?',7,rep,
    yes?[t.zh+z,'有','是']:[t.zh+'不'+z,'没有','不是'],{family:'weather-yesno',context:lessonWeather}));
  }
  for(const c of weatherList.slice(0,2)){
   const yes=w.weather==='很'+c.zh;
   const rep=statement(t.zh+(yes?'很':'不')+c.zh+'。',
    t.py+' '+(yes?'hěn ':'bù ')+c.py+'.',yes?'Да, по учебной ситуации '+t.ru+' '+c.ru+'.':'Нет, по учебной ситуации '+t.ru+' не '+c.ru+'.',lessonWeather);
   add(say(t.zh+c.zh+'吗？',t.py+' '+c.py+' ma?',t.ru+' '+c.ru+'?',7,rep,
    yes?['很'+c.zh,t.zh+'很'+c.zh,'是']:['不'+c.zh,t.zh+'不'+c.zh,'不是'],{family:'weather-temperature',context:lessonWeather}));
  }
 }
 const seasons=[['春天','chūntiān','весной','很好','hěn hǎo','хорошая'],
 ['夏天','xiàtiān','летом','很热','hěn rè','жарко'],
 ['秋天','qiūtiān','осенью','很好','hěn hǎo','хорошая'],
 ['冬天','dōngtiān','зимой','很冷','hěn lěng','холодно']];
 for(const [z,pyS,ruS,example,pyW,ruW] of seasons){
  add(say(z+'天气怎么样？',pyS+' tiānqì zěnmeyàng?','Какая погода '+ruS+'?',7,
   statement(z+example+'。',pyS+' '+pyW+'.','Учебный пример: '+ruS+' '+ruW+'.','Пример: зависит от местности.'),
   [z+'很冷',z+'很热',z+'很好'],{family:'season-weather',context:'Пример, погода зависит от местности.'}));
 }
 return bank;
}
export const PATTERN_FAMILIES=['role','next-number','previous-number','weekday-wh','weekday-yesno','date-wh','relative-exists','relative-count','relative-age','weather-wh','weather-yesno','weather-temperature','season-weather'];
export function patternPrompts(lesson,date=new Date(),allowed=[1,2,3,4,5,6,7]){
 if(!allowed.includes(lesson))return [];
 return createBank(date).filter(p=>p.lesson===lesson&&p.requires.every(n=>allowed.includes(n)))
 .map(p=>({...p,verifiedLines:[{},p]}));
}
export function patternQuestion(input,allowed=[1],date=new Date()){
 const key=cn(input);
 const p=createBank(date).find(x=>cn(x.hanzi)===key);
 if(!p)return null;
 if(!allowed.includes(p.lesson)||p.requires.some(n=>!allowed.includes(n)))
  return {kind:'locked',lesson:p.lesson,message:'Сначала пройди урок '+[p.lesson,...p.requires].find(n=>!allowed.includes(n))+'.'};
 return {kind:'question',lesson:p.lesson,
  spoken:{known:true,hanzi:String(input).trim(),pinyin:p.pinyin,translation:p.ru,topic:p.lesson},
  reply:makeAnswer(p,date)};
}
const parseRole=(value)=>{const m=/^(我)(?:是|不是)(老师|学生)$/.exec(value);return m?m[2]:null};
export function patternStudentAnswer(input,prompt,allowed=[1],date=new Date()){
 if(!prompt||prompt.intent!=='pattern'||!allowed.includes(prompt.lesson)||prompt.requires?.some(n=>!allowed.includes(n)))return null;
 const target=createBank(new Date(prompt.calendarDate||date)).find(p=>cn(p.hanzi)===cn(prompt.hanzi));
 if(!target)return null;
 const s=cn(input),accepted=prompt.accepted?.some(x=>cn(x)===s)||false;
 if(!accepted)return null;
 // The accepted answer's meaning belongs to the question context; never
 // blindly claim that a lone "是/没有" is a full free-standing translation.
 const short=s==='是'||s==='不是'||s==='有'||s==='没有';
 if(short){
  const words={是:['Shì.','Да.'],不是:['Bú shì.','Нет.'],有:['Yǒu.','Есть.'],没有:['Méiyǒu.','Нет.']};
  const [pinyin,translation]=words[s];
  return {known:true,hanzi:String(input).trim(),pinyin,translation,topic:prompt.lesson,matchedPrompt:true,
   family:prompt.family==='relative-exists'?{present:s==='有'?[prompt.lessonName]:[],absent:s==='没有'?prompt.lessonName:null}:undefined};
 }
 const matching=target;
 if(prompt.family==='weekday-yesno'||prompt.family==='weekday-wh'||prompt.family==='date-wh')
  return {known:true,hanzi:String(input).trim(),pinyin:matching.answer.pinyin,translation:matching.answer.ru,topic:prompt.lesson,matchedPrompt:true};
 if(prompt.family==='next-number'||prompt.family==='previous-number'){
  const n=NUM_BY_ZH.get(s)??(/^\d+$/.test(s)?Number(s):null);
  return Number.isInteger(n)?{known:true,hanzi:String(input).trim(),pinyin:pyNum(n)+'.',translation:String(n),topic:3,matchedPrompt:true}:null;
 }
 if(prompt.family==='relative-exists'){
  const neg=/没有/.test(s),rel=prompt.lessonName;
  const relation=relativeList.find(x=>x.zh===rel);
  return {known:true,hanzi:String(input).trim(),pinyin:(neg?'Wǒ méiyǒu ':'Wǒ yǒu ')+relation.py+'.',
   translation:neg?'У меня нет: '+relation.ru+'.':'У меня есть '+relation.ru+'.',topic:6,
   family:{present:neg?[]:[rel],absent:neg?rel:null},matchedPrompt:true};
 }
 if(prompt.family==='role'){
  const role=parseRole(s);
  return role?{known:true,hanzi:String(input).trim(),pinyin:'Wǒ '+(s.includes('不是')?'bú shì ':'shì ')+(role==='老师'?'lǎoshī.':'xuésheng.'),
   translation:s.includes('不是')?'Я не '+(role==='老师'?'учитель.':'студент.'):'Я '+(role==='老师'?'учитель.':'студент.'),topic:2,matchedPrompt:true}:null;
 }
 if(prompt.family==='relative-count'||prompt.family==='relative-age'){
  const rel=relativeList.find(r=>prompt.hanzi.includes(r.zh));
  if(!rel)return null;
  if(s==='我没有'+rel.zh)return {known:true,hanzi:String(input).trim(),pinyin:'Wǒ méiyǒu '+rel.py+'.',
   translation:'У меня нет: '+rel.ru+'.',topic:6,
   family:{present:[],absent:rel.zh},matchedPrompt:true};
  if(prompt.family==='relative-count'){
   const match=/^我有(一个|两个)(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
   if(match&&match[2]===rel.zh)return {known:true,hanzi:String(input).trim(),
    pinyin:'Wǒ yǒu '+(match[1]==='一个'?'yí ge':'liǎng ge')+' '+rel.py+'.',
    translation:'У меня '+(match[1]==='一个'?'один родственник: ':'два родственника: ')+rel.ru+'.',
    family:{present:[rel.zh],absent:null},topic:6,matchedPrompt:true};
  }
  if(prompt.family==='relative-age'){
   const match=/^(我(哥哥|姐姐|弟弟|妹妹)|他|她)([零一二三四五六七八九十百]+)岁$/.exec(s);
   const n=match?NUM_BY_ZH.get(match[3]):null;
   if(match&&Number.isInteger(n)&&n>0&&n<=100){
    const prefix=match[1]==='他'?'Tā':match[1]==='她'?'Tā':'Wǒ '+rel.py;
    return {known:true,hanzi:String(input).trim(),pinyin:prefix+' '+pyNum(n)+' suì.',
     translation:'Возраст родственника: '+n+' лет.',topic:6,matchedPrompt:true,
     fact:{relative:rel.zh,relativeAge:n},family:{present:[rel.zh],absent:null}};
   }
  }
 }
 if(prompt.family==='weather-wh'||prompt.family==='weather-yesno'||prompt.family==='weather-temperature'||prompt.family==='season-weather'){
  const time=timeList.find(x=>s.startsWith(x.zh)),season=['春天','夏天','秋天','冬天'].find(x=>s.startsWith(x));
  const weatherSuffix=s.slice((time?.zh||season||'').length);
  const dictionary={
   '很冷':['hěn lěng','холодно'],'很热':['hěn rè','жарко'],
   '下雨':['xià yǔ','идёт дождь'],'下雪':['xià xuě','идёт снег'],
   '不下雨':['bú xià yǔ','дождь не идёт'],'不下雪':['bú xià xuě','снег не идёт'],
   '不冷':['bù lěng','не холодно'],'不热':['bú rè','не жарко'],
   '很好':['hěn hǎo','хорошая']
  };
  const spoken=dictionary[weatherSuffix];
  if(spoken)return {known:true,hanzi:String(input).trim(),pinyin:(time?.py||({春天:'Chūntiān',夏天:'Xiàtiān',秋天:'Qiūtiān',冬天:'Dōngtiān'})[season]||'')+' '+spoken[0]+'.',
   translation:'Учебная сцена: '+(time?.ru||season||'')+' '+spoken[1]+'.',topic:7,matchedPrompt:true,
   fact:{weather:weatherSuffix,time:time?.zh||null}};
 }
 return null;
}
export function conversationalFollowup(spoken,allowed=[1],profile={},recent=[],date=new Date()){
 if(!spoken?.known||!allowed.includes(spoken.topic))return null;
 const choices=patternPrompts(spoken.topic,date,allowed).filter(p=>{
  if(recent.some(x=>cn(x)===cn(p.hanzi)))return false;
  if(spoken.topic===6&&spoken.family?.present?.length)return p.family==='relative-age'&&spoken.family.present.some(x=>p.hanzi.includes(x)&&profile.siblingAges?.[x]==null);
  if(spoken.topic===3)return p.family==='next-number';
  if(spoken.topic===4)return p.family==='weekday-wh';
  if(spoken.topic===5)return p.family==='date-wh';
  if(spoken.topic===7)return p.family==='weather-wh';
  return p.family==='relative-exists'||p.family==='role';
 });
 if(!choices.length)return null;
 // Avoid repeating the same first item: shift by remembered recent answers.
 return {...choices[(profile.followupOffset||0)%choices.length],isContextual:true};
}
export function patternCoverage(date=new Date()){
 const bank=createBank(date);
 return {total:bank.length,families:PATTERN_FAMILIES.length,byLesson:[1,2,3,4,5,6,7].map(i=>bank.filter(p=>p.lesson===i).length),
  exactRecordings:bank.filter(p=>p.audioKey).length};
}
