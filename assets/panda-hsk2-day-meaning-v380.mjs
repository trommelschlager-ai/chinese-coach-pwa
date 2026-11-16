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
 看书:'читаю',休息:'отдыхаю',睡觉:'ложусь спать',吃晚饭:'ужинаю',
 听音乐:'слушаю музыку',看电视:'смотрю телевизор',学习中文:'учу китайский',
 学中文:'учу китайский',做饭:'готовлю',运动:'занимаюсь спортом'
});
export function translateReviewedDayAnswer(value,index){
 const s=norm(value);
 if(index===0){
  const m=/^(?:我)?(每天|今天)?(早上|上午)?([零〇一二两三四五六七八九十\d]{1,3})点(?:(半|一刻|三刻)|([零〇一二两三四五六七八九十\d]{1,3})(?:分)?)?起床$/.exec(s);
  if(!m)return null;
  const hour=number(m[3]),min=m[4]==='半'?30:m[4]==='一刻'?15:m[4]==='三刻'?45:m[5]?number(m[5]):0;
  if(hour===null||hour>23||min===null||min>59)return null;
  const clock=String(hour).padStart(2,'0')+':'+String(min).padStart(2,'0');
  if(m[1]==='今天')return 'Сегодня'+(m[2]?' утром':'')+' я встал(а) в '+clock+'.';
  if(m[1]==='每天')return 'Каждый день'+(m[2]?' утром':'')+' я встаю в '+clock+'.';
  return (m[2]?'Утром я встаю':'Я встаю')+' в '+clock+'.';
 }
 if(index===1||index===2){
  const verb=index===1?'洗脸':'吃早饭',russian=index===1?'умываюсь':'завтракаю';
  const short=Object.freeze({是:'Да',是的:'Да',对:'Да',不:'Нет'});
  if(Object.hasOwn(short,s))return s==='不'?'Нет, я не '+russian+'.':'Да, я '+russian+'.';
  const m=new RegExp('^(?:我)?(每天)?(早上)?(都)?(不)?'+verb+'$').exec(s);
  if(!m)return null;
  const neg=!!m[4],routine=!!m[1]||!!m[2];
  const clause=neg?'не '+russian:russian;
  return (routine?'По утрам я ':'Я ')+clause+'.';
 }
 if(index===3){
  const m=/^(?:我)?(?:早上)?先(刷牙|洗脸|吃早饭)(?:再(刷牙|洗脸|吃早饭|去上班))?$/.exec(s);
  if(!m||m[2]===m[1])return null;
  return 'Сначала я '+verbs[m[1]]+(m[2]?', потом '+verbs[m[2]]:'')+'.';
 }
 if(index===4){
  const m=/^(?:我)?(晚上)?(常常|经常|通常)?(看书|休息|睡觉|吃晚饭|听音乐|看电视|学习中文|学中文|做饭|运动)$/.exec(s);
  if(!m)return null;
  const frequency=m[2]==='通常'?'обычно ':m[2]?'часто ':'';
  return (m[1]?'По вечерам я ':'Я ')+frequency+verbs[m[3]]+'.';
 }
 return null;
}
