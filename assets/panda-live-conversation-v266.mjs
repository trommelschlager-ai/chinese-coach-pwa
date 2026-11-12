// Panda Live v266: deterministic conversation extensions, no paid API, no invented audio.
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
const DAYS=Object.freeze([
  {hanzi:'日',py:'rì',ru:'воскресенье'},
  {hanzi:'一',py:'yī',ru:'понедельник'},
  {hanzi:'二',py:'èr',ru:'вторник'},
  {hanzi:'三',py:'sān',ru:'среда'},
  {hanzi:'四',py:'sì',ru:'четверг'},
  {hanzi:'五',py:'wǔ',ru:'пятница'},
  {hanzi:'六',py:'liù',ru:'суббота'}
]);
const FAMILY=Object.freeze({
  哥哥:{py:'gēge',ru:'старший брат',no:'старшего брата',few:'старших брата',many:'старших братьев',gender:'m'},
  姐姐:{py:'jiějie',ru:'старшая сестра',no:'старшей сестры',few:'старшие сестры',many:'старших сестёр',gender:'f'},
  弟弟:{py:'dìdi',ru:'младший брат',no:'младшего брата',few:'младших брата',many:'младших братьев',gender:'m'},
  妹妹:{py:'mèimei',ru:'младшая сестра',no:'младшей сестры',few:'младшие сестры',many:'младших сестёр',gender:'f'}
});
const NUMS=Object.freeze({'一':{n:1,py:'yí'},'两':{n:2,py:'liǎng'},'二':{n:2,py:'liǎng'},'三':{n:3,py:'sān'},'四':{n:4,py:'sì'},'五':{n:5,py:'wǔ'}});
const GREETINGS=Object.freeze({
 '你好':{pinyin:'Nǐ hǎo!',ru:'Привет!'},
 '你好吗':{pinyin:'Nǐ hǎo ma?',ru:'Как дела?'},
 '你呢':{pinyin:'Nǐ ne?',ru:'А у тебя?'},
 '我很好':{pinyin:'Wǒ hěn hǎo.',ru:'У меня всё хорошо.'},
 '我很好你呢':{pinyin:'Wǒ hěn hǎo, nǐ ne?',ru:'У меня всё хорошо, а у тебя?'},
 '谢谢':{pinyin:'Xièxie!',ru:'Спасибо!'},
 '我也很好谢谢':{pinyin:'Wǒ yě hěn hǎo, xièxie!',ru:'У меня тоже всё хорошо, спасибо!'}
});
const normal=s=>normalize(s).replace(/[？。、，！？.!?,\s]/g,'');
const known=(hanzi,pinyin,translation)=>({known:true,hanzi,pinyin,translation});
export function weekdayForDate(date=new Date()){
 const i=date.getDay();
 if(!Number.isInteger(i)||i<0||i>6)throw new RangeError('Invalid day');
 return DAYS[i];
}
export function adaptToRealWeekday(conversation,date=new Date()){
 if(conversation.id!==4)return conversation;
 const today=weekdayForDate(date),tomorrow=DAYS[(date.getDay()+1)%7];
 const old=conversation.lines[1];
 const answer='今天星期'+today.hanzi;
 const accepted=[answer,'今天是星期'+today.hanzi,'星期'+today.hanzi];
 if(date.getDay()!==0)accepted.push('今天星期'+date.getDay(),'今天是星期'+date.getDay(),'星期'+date.getDay());
 // Sunday can also be called 星期天.
 if(today.hanzi==='日')accepted.push('星期天','今天星期天','今天是星期天');
 const changed={...old,
   instruction:'По календарю телефона сегодня '+today.ru+'. Ответь: '+answer+'。',
   accepted,options:accepted.map(match=>({match,branch:'tomorrow'}))
 };
 const monday=date.getDay()===1;
 const reply=monday?conversation.replies.tomorrow:{
   hanzi:'谢谢！',pinyin:'Xièxie!',ru:'Спасибо! Правильный ответ: '+answer+'。',audioKey:'谢谢'
 };
 return {...conversation,lines:[conversation.lines[0],changed],
   replies:{...conversation.replies,tomorrow:reply},
   context:'📅 Сегодня по часам твоего телефона — '+today.ru+'. Это настоящий день, а не условная сценка. Панда спрашивает: «Какой сегодня день недели?»',
   today, tomorrow
 };
}
function noun(n,item){
 const details=FAMILY[item];if(!details)return null;
 if(n===1)return details.ru;
 const numeral=n===2?(details.gender==='f'?'две':'два'):n===3?'три':n===4?'четыре':'пять';
 return numeral+' '+(n<=4?details.few:details.many);
}
function parseMember(s){
 const m=/^(?:(一|两|二|三|四|五)个)?(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
 if(!m)return null;
 const count=m[1]?NUMS[m[1]]:{n:1,py:''};
 return {name:m[2],count:count.n,py:(m[1]?count.py+' ge ':'')+FAMILY[m[2]].py,ru:noun(count.n,m[2])};
}
function parseMembers(s){
 const tokens=s.split(/和|还有|、/).filter(Boolean);
 if(!tokens.length||tokens.length>3)return null;
 const result=tokens.map(parseMember);
 if(result.some(x=>!x))return null;
 return result;
}
const familyList=members=>members.map(x=>x.ru).join(' и ');
export function interpretFamily(input){
 const s=normal(input),m=/^我(?:没有(哥哥|姐姐|弟弟|妹妹))?(?:我?有(.+))?$/.exec(s);
 if(!m||(!m[1]&&!m[2]))return null;
 const absent=m[1]||null,present=m[2]?parseMembers(m[2]):[];
 if(present===null)return null;
 const absentRu=absent?'У меня нет '+FAMILY[absent].no+'.':'';
 const presentRu=present.length?'У меня есть '+familyList(present)+'.':'';
 const translation=absentRu&&presentRu?absentRu.slice(0,-1)+', но есть '+familyList(present)+'.':absentRu||presentRu;
 const absentPy=absent?'Wǒ méiyǒu '+FAMILY[absent].py:'';
 const havePy=present.length?(absent?'wǒ yǒu ':'Wǒ yǒu ')+present.map(x=>x.py).join(' hé '):'';
 return known(input,absentPy&&havePy?absentPy+', '+havePy+'.':(absentPy||havePy)+'.',translation);
}
export function extendFamilyAnswers(conversation){
 if(conversation.id!==6)return conversation;
 const old=conversation.lines[1], accepted=[...old.accepted],options=[...old.options];
 for(const relative of ['弟弟','妹妹','姐姐']){
  for(const phrase of ['我没有哥哥我有'+relative,'我没有哥哥我有一个'+relative,'我没有哥哥我有两个'+relative,'我有哥哥和'+relative,'我有哥哥和一个'+relative,'我有哥哥和两个'+relative]){
   accepted.push(phrase);options.push({match:phrase,branch:'family-more'});
  }
 }
 const rest={
  ...old,accepted,options,
  instruction:'Панда спросила о СТАРШЕМ брате (哥哥). Можно ответить «我有哥哥» или «我没有哥哥，我有妹妹» — «Нет старшего брата, но есть младшая сестра».'
 };
 return {...conversation,lines:[conversation.lines[0],rest],
  replies:{...conversation.replies,'family-more':{hanzi:'谢谢！',pinyin:'Xièxie!',ru:'Спасибо! Можешь рассказать о других родственниках.',audioKey:'谢谢'}}
 };
}
export function prepareConversation(conversation,date=new Date()){
 return extendFamilyAnswers(adaptToRealWeekday(conversation,date));
}
const WEATHER={
 '今天天气很好':['Jīntiān tiānqì hěn hǎo.','Сегодня хорошая погода.'],
 '今天很冷':['Jīntiān hěn lěng.','Сегодня холодно.'],
 '今天很热':['Jīntiān hěn rè.','Сегодня жарко.'],
 '今天下雨':['Jīntiān xià yǔ.','Сегодня идёт дождь.'],
 '今天阴天':['Jīntiān yīn tiān.','Сегодня пасмурно.'],
 '今天晴天':['Jīntiān qíng tiān.','Сегодня ясно.'],
 '明天下雨':['Míngtiān xià yǔ.','Завтра будет дождь.'],
 '明天很冷':['Míngtiān hěn lěng.','Завтра будет холодно.'],
 '明天天气很好':['Míngtiān tiānqì hěn hǎo.','Завтра будет хорошая погода.']
};
export function interpretUtterance(input,lesson=1,curriculum=[]){
 const raw=String(input||'').trim(),s=normal(raw);
 if(!raw)return {known:false,hanzi:'',translation:null};
 if(GREETINGS[s])return known(raw,GREETINGS[s].pinyin,GREETINGS[s].ru);
 if(lesson===6){const f=interpretFamily(raw);if(f)return f;}
 if(lesson===7&&WEATHER[s])return known(raw,WEATHER[s][0],WEATHER[s][1]);
 const wd=/^(?:今天(?:是)?)?星期([一二三四五六日天])$/.exec(s);
 if(lesson===4&&wd){
  const day=DAYS.find(x=>x.hanzi===wd[1]||(wd[1]==='天'&&x.hanzi==='日'));
  if(day)return known(raw,(s.startsWith('今天')?'Jīntiān ':'')+'xīngqī '+day.py+'.','Сегодня '+day.ru+'.');
 }
 const word=(curriculum[lesson-1]?.words||[]).find(w=>w[0]===s);
 if(word)return known(raw,word[1],word[2]);
 const dialog=(curriculum[lesson-1]?.dialogue||[]).find(x=>normal(x[1])===s);
 if(dialog)return known(raw,dialog[2],dialog[3]);
 return {known:false,hanzi:raw,translation:null};
}
export function howAreYou(input){return ['你好吗','你呢'].includes(normal(input));}
const REPLIES=Object.freeze({
 good:{hanzi:'很好！',pinyin:'Hěn hǎo!',ru:'Хорошо!',audioKey:'很好'},
 meToo:{hanzi:'我也很好，谢谢！',pinyin:'Wǒ yě hěn hǎo, xièxie!',ru:'У меня тоже всё хорошо, спасибо!',audioKey:'我也很好谢谢'},
 hello:{hanzi:'你好！',pinyin:'Nǐ hǎo!',ru:'Привет!',audioKey:'你好'},
 thanks:{hanzi:'谢谢！',pinyin:'Xièxie!',ru:'Спасибо!',audioKey:'谢谢'}
});
export function replyToExtraSpeech(input,lesson=1,curriculum=[]){
 const s=normal(input),understood=interpretUtterance(input,lesson,curriculum);
 if(howAreYou(input))return {answer:REPLIES.good,understood};
 if(s==='我很好你呢')return {answer:REPLIES.meToo,understood};
 if(s==='你好')return {answer:REPLIES.hello,understood};
 if(s==='谢谢')return {answer:REPLIES.thanks,understood};
 if(understood.known)return {answer:REPLIES.thanks,understood};
 return {answer:null,understood,help:'Эту фразу я пока не умею проверять. Попробуй слова и предложения из этого урока или спроси 你好吗？'};
}
export function extraExamples(lesson){
 if(lesson===6)return ['我有弟弟','我有妹妹','我有弟弟和妹妹','我没有哥哥，我有妹妹','你好吗？'];
 if(lesson===7)return ['今天天气很好','明天下雨','你好吗？'];
 if(lesson===4)return ['你好吗？','谢谢！'];
 return ['你好吗？','我很好，你呢？','谢谢！'];
}
