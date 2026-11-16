/* Panda Go v383 — exact, text-only Chinese calendar expressions in chat.
 * Translate only a validated, self-contained weekday or month/day expression.
 * This does not unlock lessons, judge acoustic tones or invent audio.
 */
const normalize = value => String(value ?? '').normalize('NFC')
  .replace(/[。，！？?!、,.\s\u3000]/gu, '');
const dayNames = Object.freeze({
  一:['xīngqīyī','понедельник'],二:['xīngqīèr','вторник'],
  三:['xīngqīsān','среда'],四:['xīngqīsì','четверг'],
  五:['xīngqīwǔ','пятница'],六:['xīngqīliù','суббота'],
  日:['xīngqīrì','воскресенье'],天:['xīngqītiān','воскресенье']
});
const relative = Object.freeze({
  今天:['jīntiān','Сегодня'],明天:['míngtiān','Завтра'],
  昨天:['zuótiān','Вчера']
});
const digits = Object.freeze({
  一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9
});
function numberFromChinese(raw){
  if(/^\d{1,2}$/u.test(raw))return Number(raw);
  if(Object.hasOwn(digits,raw))return digits[raw];
  const match=/^([一二三四五六七八九]?)(十)([一二三四五六七八九]?)$/u.exec(raw);
  if(!match)return null;
  return 10*(match[1]?digits[match[1]]:1)+(match[3]?digits[match[3]]:0);
}
function pinyinForNumber(n){
  const py=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
  if(!Number.isInteger(n)||n<1||n>31)return null;
  if(n<10)return py[n];
  if(n===10)return 'shí';
  if(n<20)return 'shí '+py[n-10];
  return py[Math.floor(n/10)]+' shí'+(n%10?' '+py[n%10]:'');
}
const capital = t => t ? t[0].toUpperCase()+t.slice(1) : t;
export function analyzeCalendarLiteral(raw){
  const value=String(raw??'').trim(),s=normalize(value);
  if(!s||s.length>26)return null;
  const w=/^(今天|明天|昨天)?(是)?星期([一二三四五六日天])$/u.exec(s);
  if(w && (!w[2] || w[1])){
    const [dayPy,dayRu]=dayNames[w[3]];
    const relativeValue=w[1]?relative[w[1]]:null;
    const py=capital([relativeValue?.[0],w[2]?'shì':null,dayPy].filter(Boolean).join(' '))+'.';
    const ru=relativeValue?relativeValue[1]+' '+dayRu+'.':capital(dayRu)+'.';
    return {known:true,hanzi:value,pinyin:py,translation:ru,topic:4,
      calendarLiteral:true};
  }
  const date=/^(今天|明天|昨天)?(是)?([一二三四五六七八九十\d]{1,3})月([一二三四五六七八九十\d]{1,3})(号|日)$/u.exec(s);
  if(!date||date[2]&&!date[1])return null;
  const month=numberFromChinese(date[3]),day=numberFromChinese(date[4]);
  if(!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1)return null;
  // No year was given. Accept Feb 29 (possible in a leap year), never Feb 30.
  const monthMax=[31,29,31,30,31,30,31,31,30,31,30,31][month-1];
  if(day>monthMax)return null;
  const rel=date[1]?relative[date[1]]:null;
  const py=capital([rel?.[0],date[2]?'shì':null,pinyinForNumber(month),'yuè',
    pinyinForNumber(day),date[5]==='号'?'hào':'rì'].filter(Boolean).join(' '))+'.';
  const ru=(rel?rel[1]+' ':'')+day+'.'+String(month).padStart(2,'0')+'.';
  return {known:true,hanzi:value,pinyin:py,translation:ru,topic:5,
    calendarLiteral:true};
}

/* Mirror the learner's own words rather than declaring a possibly incorrect
 * calendar fact true. This is text feedback; audio requires an exact MP3.
 */
export function calendarAcknowledgement(spoken){
 if(!spoken?.calendarLiteral||!spoken?.known||!spoken?.pinyin)return null;
 const raw=normalize(spoken.hanzi);
 const saidPinyin=String(spoken.pinyin).replace(/[.。!?]+$/u,'');
 const meaning=String(spoken.translation||'').replace(/[.。]+$/u,'');
 if(!raw||!saidPinyin||!meaning)return null;
 return {
  hanzi:'你说：“'+raw+'。”',
  pinyin:'Nǐ shuō: '+saidPinyin+'.',
  ru:'Ты сказал(а): «'+meaning+'».',
  audioKey:null
 };
}

/**
 * Completion of the two fixed HSK1 calendar questions. A correctly answered
 * active date/weekday prompt can be parsed by the pattern engine, whose spoken
 * record intentionally does NOT have calendarLiteral=true. Do not use that
 * flag alone to decide whether the round is finished.
 *
 * Only end after an accepted response to the currently displayed calendar
 * question and both questions have appeared in the recent question history.
 * An unrelated standalone vocabulary lookup never ends a training round.
 */
export function isCalendarRoundFinished({input,resultKind,spoken,prompt,questions=[]}={}){
 const literal=analyzeCalendarLiteral(input);
 if(!literal||!prompt||literal.topic!==Number(prompt.lesson))return false;
 if(resultKind!=='answer')return false;
 const current=normalize(prompt.hanzi||prompt.panda);
 if(current!=='今天几月几号'&&current!=='今天星期几')return false;
 const seen=new Set(questions.slice(-12).map(normalize));
 return seen.has('今天几月几号')&&seen.has('今天星期几');
}
