/* Panda Go, HSK2 My Day: finite, reviewed, topic-scoped guided practice.
   Answers are verified by Chinese text patterns, NOT pronunciation/tone acoustics.
   Existing open-ended HSK1 Panda conversations remain unchanged. */
const norm=s=>String(s||'').trim().replace(/[，。？！?!,.、\s]/g,'');
const at=(zh,py,ru,pattern,hint)=>Object.freeze({
 hanzi:zh,pinyin:py,ru,lesson:1,audioKey:null,pattern,hint
});
const ALL=Object.freeze([
 at('你每天几点起床？','Nǐ měitiān jǐ diǎn qǐchuáng?','Во сколько ты каждый день встаёшь?',
  /^(?:我)?(?:每天|早上|今天)?(?:早上)?(?:[一二三四五六七八九十两\d]{1,4}点(?:半)?)(?:起床)$/u,
  'Попробуй: 我每天七点起床。'),
 at('你早上洗脸吗？','Nǐ zǎoshang xǐliǎn ma?','Ты умываешься по утрам?',
  /^(?:(?:是的|会|是|对)|(?:我)?(?:早上|每天)?(?:不)?洗脸|(?:不|没有))$/u,
  'Попробуй: 我早上洗脸。'),
 at('你早上吃早饭吗？','Nǐ zǎoshang chī zǎofàn ma?','Ты завтракаешь утром?',
  /^(?:(?:是的|是|对)|(?:我)?(?:早上|每天)?(?:不)?吃早饭|(?:不|没有))$/u,
  'Попробуй: 我早上吃早饭。'),
 at('你早上先做什么？','Nǐ zǎoshang xiān zuò shénme?','Что ты делаешь сначала утром?',
  /^(?:我)?(?:早上)?先(?:刷牙|洗脸|吃早饭)(?:再(?:刷牙|洗脸|吃早饭|去上班))?$/u,
  'Попробуй: 我先刷牙，再吃早饭。'),
 at('你晚上常常做什么？','Nǐ wǎnshang chángcháng zuò shénme?','Что ты часто делаешь вечером?',
  /^(?:我)?(?:晚上)?(?:常常)?(?:看书|休息|睡觉|吃晚饭)(?:了)?$/u,
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
 const ok=question.pattern.test(said);
 return {
  ok,
  spoken:{known:false,hanzi:String(input),pinyin:null,translation:null,topic:1,
    probable:ok?'Ответ по теме. Тоны не проверялись.':'Это не ответ на вопрос о распорядке дня.'},
  message:ok?'Ответ подходит по смыслу! Это не проверка тонов.':'Пока не подходит. '+question.hint,
  hint:question.hint
 };
}
export const dailyFinal=Object.freeze({
 hanzi:'做得好！',pinyin:'Zuò de hǎo!',ru:'Молодец! Тренировка «Мой день» завершена.',lesson:1,audioKey:null
});
