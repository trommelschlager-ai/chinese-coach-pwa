// Panda AI v319: reviewed fragment → full-sentence coaching for unlocked HSK1
// and the four public bridge words. These short fragments are not grammatical errors.
// No AI generation, paid HSK2 unlock, speech synthesis or fabricated tone evaluation.
import {lookupPilotAudio} from './panda-live-audio.mjs?v=307';

const normalize=value=>String(value??'').normalize('NFC').trim().replace(/[\s\u3000，。！？!?.,;；:：'"«»\-–—]/g,'');
const courseExample=(fragment,full,pinyin,ru,lesson,baseMeaning,why)=>
 ({fragment,full,pinyin,ru,lesson,baseMeaning,why});

const REVIEWED=[
 courseExample('是学生','我是学生。','Wǒ shì xuésheng.','Я студент.',2,'быть студентом','Для знакомства добавь 我 — «я».'),
 courseExample('是老师','我是老师。','Wǒ shì lǎoshī.','Я учитель.',2,'быть учителем','Для знакомства добавь 我 — «я».'),
 courseExample('不是学生','我不是学生。','Wǒ bú shì xuésheng.','Я не студент.',2,'не быть студентом','Когда говоришь о себе, добавь 我. Перед 是 слово 不 читается bú.'),
 courseExample('不是老师','我不是老师。','Wǒ bú shì lǎoshī.','Я не учитель.',2,'не быть учителем','Когда говоришь о себе, добавь 我. Перед 是 слово 不 читается bú.'),
 courseExample('有哥哥','我有哥哥。','Wǒ yǒu gēge.','У меня есть старший брат.',6,'есть старший брат','Для рассказа о своей семье добавь 我. Не будем придумывать количество братьев.'),
 courseExample('有姐姐','我有姐姐。','Wǒ yǒu jiějie.','У меня есть старшая сестра.',6,'есть старшая сестра','Для рассказа о своей семье добавь 我.'),
 courseExample('有弟弟','我有弟弟。','Wǒ yǒu dìdi.','У меня есть младший брат.',6,'есть младший брат','Для рассказа о своей семье добавь 我.'),
 courseExample('有妹妹','我有妹妹。','Wǒ yǒu mèimei.','У меня есть младшая сестра.',6,'есть младшая сестра','Для рассказа о своей семье добавь 我.'),
 courseExample('没有哥哥','我没有哥哥。','Wǒ méiyǒu gēge.','У меня нет старшего брата.',6,'нет старшего брата','В полном ответе от своего лица добавь 我.'),
 courseExample('没有姐姐','我没有姐姐。','Wǒ méiyǒu jiějie.','У меня нет старшей сестры.',6,'нет старшей сестры','В полном ответе от своего лица добавь 我.'),
 courseExample('没有弟弟','我没有弟弟。','Wǒ méiyǒu dìdi.','У меня нет младшего брата.',6,'нет младшего брата','В полном ответе от своего лица добавь 我.'),
 courseExample('没有妹妹','我没有妹妹。','Wǒ méiyǒu mèimei.','У меня нет младшей сестры.',6,'нет младшей сестры','В полном ответе от своего лица добавь 我.'),
 courseExample('有一个哥哥','我有一个哥哥。','Wǒ yǒu yí ge gēge.','У меня один старший брат.',6,'есть один старший брат','Ты уже назвал число; добавь 我 и сохрани 一个 (yí ge).'),
 courseExample('有一个妹妹','我有一个妹妹。','Wǒ yǒu yí ge mèimei.','У меня одна младшая сестра.',6,'есть одна младшая сестра','Ты уже назвал число; добавь 我 и сохрани 一个 (yí ge).'),
 courseExample('很忙','我很忙。','Wǒ hěn máng.','Я занят.',1,'занят','Если говоришь о себе, добавь 我. Перед 忙 здесь не нужна связка 是.'),
 courseExample('不忙','我不忙。','Wǒ bù máng.','Я не занят.',1,'не занят','Если говоришь о себе, добавь 我. 不忙 — правильный краткий ответ.'),
 courseExample('喜欢中文','我喜欢中文。','Wǒ xǐhuan Zhōngwén.','Мне нравится китайский язык.',1,'нравится китайский язык','Для полного высказывания от первого лица добавь 我.')
];
const byFragment=new Map(REVIEWED.map(row=>[normalize(row.fragment),row]));
const WEATHER_ROWS=new Map([
 ['很冷',['今天很冷。','Jīntiān hěn lěng.','Сегодня холодно.','холодно']],
 ['很热',['今天很热。','Jīntiān hěn rè.','Сегодня жарко.','жарко']],
 ['下雨',['今天下雨。','Jīntiān xià yǔ.','Сегодня идёт дождь.','идёт дождь']],
 ['下雪',['今天下雪。','Jīntiān xià xuě.','Сегодня идёт снег.','идёт снег']]
]);

const isWeatherToday=prompt=>prompt?.lesson===7&&
 (prompt?.intent==='weather'||normalize(prompt?.hanzi)==='今天天气怎么样')&&
 (prompt?.time==='今天'||normalize(prompt?.hanzi)?.startsWith('今天'));

export const SENTENCE_COACH_FRAGMENTS=Object.freeze(REVIEWED.map(row=>row.fragment));
export function coachSentence(raw,{allowed=[1],prompt=null}={}){
 const input=String(raw??'').trim(),key=normalize(input);
 if(!key||key.length>80)return null;
 let row=byFragment.get(key),weather=false;
 if(!row&&allowed.includes(7)&&isWeatherToday(prompt)&&WEATHER_ROWS.has(key)){
  const [full,pinyin,ru,baseMeaning]=WEATHER_ROWS.get(key);
  row=courseExample(key,full,pinyin,ru,7,baseMeaning,'В ответе о погоде сегодня можно назвать день: 今天 — «сегодня». Это учебный пример, не прогноз.');weather=true;
 }
 if(!row||!allowed.includes(row.lesson))return null;
 // This is a positive, context-dependent expansion, not a correction or a tone score.
 const explanation=weather
  ?'«'+input+'» — понятный ответ («'+row.baseMeaning+'»). '+row.why
  :'«'+input+'» — правильная краткая фраза («'+row.baseMeaning+'»). '+row.why;
 const audioKey=lookupPilotAudio(row.full)?normalize(row.full):null;
 return {
  kind:'coaching',lesson:row.lesson,
  spoken:{known:true,hanzi:input,pinyin:null,translation:row.baseMeaning,topic:row.lesson},
  reply:{hanzi:row.full,pinyin:row.pinyin,ru:row.ru,audioKey},
  explanation,message:'Послушай и повтори полный образец: '+row.full,
  followup:null
 };
}
