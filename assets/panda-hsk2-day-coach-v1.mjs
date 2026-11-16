/* Panda Go, HSK2 My Day: finite, reviewed, topic-scoped guided practice.
   Answers are verified by Chinese text patterns, NOT pronunciation/tone acoustics.
   Existing open-ended HSK1 Panda conversations remain unchanged. */
import {translateReviewedDayAnswer} from './panda-hsk2-day-meaning-v380.mjs?v=380';
const norm=s=>String(s||'').trim().replace(/[，。？！?!,.、\s]/g,'');
const at=(zh,py,ru,pattern,hint)=>Object.freeze({
 hanzi:zh,pinyin:py,ru,lesson:1,audioKey:null,pattern,hint
});
// A regex alone can match impossible clock times (such as 二十五点).
// Validate hours/minutes after matching the reviewed My Day sentence pattern.
const CN_NUM=Object.freeze({零:0,〇:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,两:2});
function clockNumber(text){
 const s=String(text||'');
 if(/^\d{1,2}$/.test(s))return Number(s);
 if(s in CN_NUM)return CN_NUM[s];
 if(/^[零〇][一二三四五六七八九]$/.test(s))return CN_NUM[s[1]];
 const m=/^([一二三四五六七八九]?)[十]([一二三四五六七八九]?)$/.exec(s);
 if(m)return (m[1]?CN_NUM[m[1]]:1)*10+(m[2]?CN_NUM[m[2]]:0);
 return null;
}
function validWakeClock(s){
 const m=/([零〇一二两三四五六七八九十\d]{1,3})点(?:半|一刻|三刻|([零〇一二两三四五六七八九十\d]{1,3})(?:分)?)?起床$/.exec(s);
 if(!m)return false;
 const hours=clockNumber(m[1]),minutes=m[2]?clockNumber(m[2]):0;
 return hours!==null&&hours>=0&&hours<=23&&minutes!==null&&minutes>=0&&minutes<=59;
}
const ALL=Object.freeze([
 at('你每天几点起床？','Nǐ měitiān jǐ diǎn qǐchuáng?','Во сколько ты каждый день встаёшь?',
  /^(?:我)?(?:每天|今天)?(?:早上|上午)?[零〇一二两三四五六七八九十\d]{1,3}点(?:半|一刻|三刻|[零〇一二两三四五六七八九十\d]{1,3}(?:分)?)?起床$/u,
  'Попробуй: 我每天七点起床。'),
 at('你早上洗脸吗？','Nǐ zǎoshang xǐliǎn ma?','Ты умываешься по утрам?',
  /^(?:是的|是|对|不|(?:我)?(?:每天)?(?:早上)?(?:都)?(?:不)?洗脸)$/u,
  'Попробуй: 我早上洗脸。'),
 at('你早上吃早饭吗？','Nǐ zǎoshang chī zǎofàn ma?','Ты завтракаешь утром?',
  /^(?:是的|是|对|不|(?:我)?(?:每天)?(?:早上)?(?:都)?(?:不)?吃早饭)$/u,
  'Попробуй: 我早上吃早饭。'),
 at('你早上先做什么？','Nǐ zǎoshang xiān zuò shénme?','Что ты делаешь сначала утром?',
  /^(?:我)?(?:早上)?先(?:刷牙|洗脸|吃早饭)(?:再(?:刷牙|洗脸|吃早饭|去上班))?$/u,
  'Попробуй: 我先刷牙，再吃早饭。'),
 at('你晚上常常做什么？','Nǐ wǎnshang chángcháng zuò shénme?','Что ты часто делаешь вечером?',
  /^(?:我)?(?:晚上)?(?:常常|经常|通常)?(?:看书|休息|睡觉|吃晚饭|听音乐|看电视|学习中文|学中文|做饭|运动)$/u,
  'Попробуй: 我晚上常常看书。')
]);
export function dailyQuestions(mini=0){
 const level=Math.min(2,Math.max(0,Number(mini)||0));
 return ALL.slice(0,level===0?3:level===1?4:5);
}
export function checkDayAnswer(input,idx,mini=0){
 const question=dailyQuestions(mini)[idx],said=norm(input);
 if(!question)return {ok:false,message:'Вопрос не найден.'};
 if(!said)return {ok:false,message:'Скажи или напиши ответ на китайском.'};
 const patternMatches=question.pattern.test(said)&&(idx!==0||validWakeClock(said));
 const translation=patternMatches?translateReviewedDayAnswer(said,idx):null;
 const ok=!!translation;
 return {
  ok,
  spoken:{known:ok,hanzi:String(input),pinyin:null,translation,topic:1,
    probable:null},
  message:ok?'Ответ подходит по смыслу! Это не проверка тонов.':'Пока не подходит. '+question.hint,
  hint:question.hint
 };
}
export const dailyFinal=Object.freeze({
 hanzi:'做得好！',pinyin:'Zuò de hǎo!',ru:'Молодец! Тренировка «Мой день» завершена.',lesson:1,audioKey:null
});
