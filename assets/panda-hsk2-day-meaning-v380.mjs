/* Panda AI v380: finite, reviewer-friendly translations for HSK2 "My Day".
 * Never translate an arbitrary sentence; pair only with the matching
 * teacher-reviewed question. This module does not grade acoustic tones.
 */
const norm=value=>String(value??'').normalize('NFC').replace(/[，。！？?!,.、\s]/g,'');
const digits=Object.freeze({零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9});
function number(value){
 const s=String(value||'');
 if(/^\d{1,2}$/.test(s))return Number(s);
 if(Object.hasOwn(digits,s))return digits[s];
 if(/^[零〇][一二三四五六七八九]$/.test(s))return digits[s[1]];
 const m=/^([一二三四五六七八九]?)[十]([一二三四五六七八九]?)$/.exec(s);
 if(m)return (m[1]?digits[m[1]]:1)*10+(m[2]?digits[m[2]]:0);
 return null;
}
const verbs=Object.freeze({
 刷牙:'чищу зубы',洗脸:'умываюсь',吃早饭:'завтракаю',去上班:'иду на работу',
 看书:'читаю',看电影:'смотрю фильмы',上班:'работаю',工作:'работаю',跑步:'бегаю',休息:'отдыхаю',睡觉:'ложусь спать',吃晚饭:'ужинаю',
 听音乐:'слушаю музыку',看电视:'смотрю телевизор',学习中文:'учу китайский',
 学中文:'учу китайский',做饭:'готовлю',运动:'занимаюсь спортом'
});

const morningVerbs=Object.freeze({
 洗脸:'умываюсь',刷牙:'чищу зубы',吃早饭:'завтракаю',上班:'работаю',看书:'читаю',
 学习中文:'учу китайский',跑步:'бегаю'
});
function translateMorningAction(s,index){
 const m=/^(?:我)?(每天|今天)?(早上|上午)?(起床(?:以后|之后|后))?(都|常常)?(不)?(洗脸|刷牙|吃早饭|跑步|学习中文|上班|看书)$/.exec(s);
 if(!m)return null;
 const [,period,time,afterWake,frequency,negated,action]=m;
 if(index===0&&!time)return null;
 if(index===1&&!['洗脸','刷牙','吃早饭'].includes(action))return null;
 if(index===2&&!['洗脸','刷牙','吃早饭','学习中文','上班','看书'].includes(action))return null;
 const intro=afterWake?(period==='今天'?'Сегодня после подъёма я ':'После того как я встаю, я '):
   time==='上午'?(period==='今天'?'Сегодня в первой половине дня я ':'В первой половине дня я '):
   time==='早上'?(period==='今天'?'Сегодня утром я ':'По утрам я '):
   period==='每天'?'Каждый день я ':period==='今天'?'Сегодня я ':'Я ';
 const verb=morningVerbs[action];
 if(!verb)return null;
 const frequencyRu=frequency==='常常'?'часто ':'';
 return intro+frequencyRu+(negated?'не ':'')+verb+'.';
}
export function translateReviewedDayAnswer(value,index){
 const s=norm(value);
 if(index===0){
  const m=/^(?:我)?(每天|今天)?(早上|上午)?([零〇一二两三四五六七八九十\d]{1,3})点(?:(半|一刻|三刻)|([零〇一二两三四五六七八九十\d]{1,3})(?:分)?)?起床$/.exec(s);
  if(m){
   const hour=number(m[3]),min=m[4]==='半'?30:m[4]==='一刻'?15:m[4]==='三刻'?45:m[5]?number(m[5]):0;
   if(hour===null||hour>23||min===null||min>59)return null;
   const clock=String(hour).padStart(2,'0')+':'+String(min).padStart(2,'0');
   if(m[1]==='今天')return 'Сегодня'+(m[2]?' утром':'')+' я встал(а) в '+clock+'.';
   if(m[1]==='每天')return 'Каждый день'+(m[2]?' утром':'')+' я встаю в '+clock+'.';
   return (m[2]?'Утром я встаю':'Я встаю')+' в '+clock+'.';
  }
  return translateMorningAction(s,0);
 }
 if(index===1||index===2)return translateMorningAction(s,index);
 if(index===3){
  const seq=/^(?:我)?(今天)?(早上)?先(刷牙|洗脸|吃早饭)(?:再(刷牙|洗脸|吃早饭|去上班))?$/.exec(s);
  if(seq){
   if(seq[4]===seq[3])return null;
   const prefix=seq[1]?'Сегодня я ':seq[2]?'Утром я ':'';
   return prefix+'сначала '+verbs[seq[3]]+(seq[4]?', потом '+verbs[seq[4]]:'')+'.';
  }
  const simple=/^(?:我)?(今天)?(早上)?(上班|休息|学习中文|看书|做饭)$/.exec(s);
  if(!simple)return null;
  return (simple[1]?'Сегодня я ':simple[2]?'Утром я ':'Я ')+verbs[simple[3]]+'.';
 }
 if(index===4){
  const m=/^(?:我)?(晚上)?(常常|经常|通常)?(看书|看电影|工作|上班|跑步|休息|睡觉|吃晚饭|听音乐|看电视|学习中文|学中文|做饭|运动)$/.exec(s);
  if(!m)return null;
  const frequency=m[2]==='通常'?'обычно ':m[2]?'часто ':'';
  return (m[1]?'По вечерам я ':'Я ')+frequency+verbs[m[3]]+'.';
 }
 return null;
}
