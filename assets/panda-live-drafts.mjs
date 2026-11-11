// Six-course expansion: topics 3–7 are explicit, audio-gated drafts.
import {PILOT_LINES} from './panda-voice-pilot-engine.mjs?v=live5';
const freeze=Object.freeze;
function question(panda,pinyin,ru,audioKey,instruction,accepted,defaultBranch,options=[]){
 return freeze({panda,pinyin,ru,audioKey,instruction,accepted:freeze(accepted),defaultBranch,options:freeze(options)});
}
const reply=(hanzi,pinyin,ru,audioKey)=>freeze({hanzi,pinyin,ru,audioKey});
function draft(id,theme,lines,replies,vocabulary=[],extra={}){
 return freeze({id,theme,requiresLesson:id,status:'pilot-audio-complete-device-test-pending',lines:freeze([PILOT_LINES[0],...lines]),replies:freeze(replies),newWords:freeze([]),vocabulary:freeze(vocabulary),...extra});
}
export function chineseNumber(n){
 if(!Number.isInteger(n)||n<1||n>100)return null;
 const digits='零一二三四五六七八九';
 if(n===100)return '一百';if(n<10)return digits[n];
 const tens=Math.floor(n/10),units=n%10;
 return (tens===1?'':digits[tens])+'十'+(units?digits[units]:'');
}
const ages=Array.from({length:100},(_,i)=>i+1).flatMap(n=>[`我${chineseNumber(n)}岁`,`我${n}岁`,`${chineseNumber(n)}岁`,`${n}岁`]).concat(['我两岁','两岁']);
const familyYes=['我有哥哥','有，我有哥哥',...Array.from({length:10},(_,i)=>i+1).flatMap(n=>[`我有${n===2?'两':chineseNumber(n)}个哥哥`,`我有${n}个哥哥`])];
const familyNo=['我没有哥哥','没有，我没有哥哥'];
function weatherAnswers(day){
 return ['很冷','很热'].flatMap(state=>[day+state,day+'天气'+state,'天气'+state,state]).concat(
  [day+'下雨',day+'在下雨','下雨','在下雨',day+'天气很好','天气很好'],
  ['晴天','阴天'].flatMap(state=>[day+state,day+'是'+state,state])
 );
}
export const DRAFT_CONVERSATIONS=freeze([
 draft(3,'Числа',[
  question('你几岁？','Nǐ jǐ suì?','Сколько тебе лет?','你几岁','Назови возраст от 1 до 100: «我…岁».',ages,'age')
 ],{age:reply('我三岁。','Wǒ sān suì.','Мне три года.','我三岁')},[
  {hanzi:'几',pinyin:'jǐ',ru:'сколько — вопрос о числе'},
  {hanzi:'岁',pinyin:'suì',ru:'лет — для возраста'},
  {hanzi:'我…岁',pinyin:'wǒ … suì',ru:'мне … лет'}
 ],{context:'Назови любой возраст от 1 до 100 — можно играть роль.',newWords:freeze([{hanzi:'岁',pinyin:'suì',ru:'лет — для возраста'}]),examples:freeze([{hanzi:'我二十五岁。',pinyin:'Wǒ èrshíwǔ suì.',ru:'Мне двадцать пять лет.'}])}),
 draft(4,'Дни недели',[
  question('今天星期几？','Jīntiān xīngqī jǐ?','Какой сегодня день недели?','今天星期几','В этом диалоге сегодня понедельник. Ответь по-китайски.',
   ['星期一','今天星期一','今天是星期一','星期1','今天星期1','今天是星期1'],'tomorrow')
 ],{tomorrow:reply('明天星期二。','Míngtiān xīngqī èr.','Завтра вторник.','明天星期二')},[
  {hanzi:'今天',pinyin:'jīntiān',ru:'сегодня'}, {hanzi:'明天',pinyin:'míngtiān',ru:'завтра'},
  {hanzi:'星期一',pinyin:'xīngqī yī',ru:'понедельник'}, {hanzi:'星期二',pinyin:'xīngqī èr',ru:'вторник'}
 ],{context:'Ситуация для тренировки: сегодня понедельник. Это условие диалога.',examples:freeze([{hanzi:'今天星期一。',pinyin:'Jīntiān xīngqī yī.',ru:'Сегодня понедельник.'}])}),
 draft(5,'Даты и месяцы',[
  question('今天几月几号？','Jīntiān jǐ yuè jǐ hào?','Какое сегодня число и месяц?','今天几月几号','В этом диалоге сегодня 5 марта. Назови дату по-китайски.',
   ['三月五号','今天三月五号','今天是三月五号','三月五日','今天是三月五日','3月5号','今天3月5号','今天是3月5号','3月5日','今天是3月5日'],'tomorrow')
 ],{tomorrow:reply('明天三月六号。','Míngtiān sān yuè liù hào.','Завтра шестое марта.','明天三月六号')},[
  {hanzi:'月',pinyin:'yuè',ru:'месяц'}, {hanzi:'号',pinyin:'hào',ru:'число месяца'},
  {hanzi:'三月',pinyin:'sān yuè',ru:'март'}, {hanzi:'五号',pinyin:'wǔ hào',ru:'пятое число'}
 ],{context:'Ситуация для тренировки: сегодня 5 марта. Это условие диалога.',examples:freeze([{hanzi:'今天三月五号。',pinyin:'Jīntiān sān yuè wǔ hào.',ru:'Сегодня пятое марта.'}])}),
 draft(6,'Семья',[
  question('你有哥哥吗？','Nǐ yǒu gēge ma?','У тебя есть старший брат?','你有哥哥吗','Ответь «У меня есть старший брат» или «У меня нет старшего брата».',
   [...familyYes,...familyNo],'has-brother',[
    ...familyYes.map(match=>freeze({match,branch:'has-brother'})),...familyNo.map(match=>freeze({match,branch:'no-brother'}))])
 ],{
  'has-brother':reply('我也有哥哥。','Wǒ yě yǒu gēge.','У меня тоже есть старший брат.','我也有哥哥'),
  'no-brother':reply('我有一个哥哥。','Wǒ yǒu yí ge gēge.','У меня есть один старший брат.','我有一个哥哥')
 },[
  {hanzi:'哥哥',pinyin:'gēge',ru:'старший брат'}, {hanzi:'有',pinyin:'yǒu',ru:'иметь; есть'},
  {hanzi:'没有',pinyin:'méiyǒu',ru:'не иметь; нет'}, {hanzi:'也',pinyin:'yě',ru:'тоже'}
 ],{examples:freeze([{hanzi:'我有哥哥。',pinyin:'Wǒ yǒu gēge.',ru:'У меня есть старший брат.'},{hanzi:'我没有哥哥。',pinyin:'Wǒ méiyǒu gēge.',ru:'У меня нет старшего брата.'}])}),
 draft(7,'Погода',[
  question('今天天气怎么样？','Jīntiān tiānqì zěnmeyàng?','Какая сегодня погода?','今天天气怎么样','Расскажи: холодно, жарко, дождь, ясно или пасмурно.',weatherAnswers('今天'),'weather'),
  question('明天天气怎么样？','Míngtiān tiānqì zěnmeyàng?','Какая завтра погода?','明天天气怎么样','Расскажи, какая погода завтра.',weatherAnswers('明天'),'weather')
 ],{weather:reply('谢谢！','Xièxie!','Спасибо!','谢谢')},[
  {hanzi:'天气',pinyin:'tiānqì',ru:'погода'}, {hanzi:'怎么样',pinyin:'zěnmeyàng',ru:'какой / как'},
  {hanzi:'冷',pinyin:'lěng',ru:'холодно'}, {hanzi:'热',pinyin:'rè',ru:'жарко'},
  {hanzi:'下雨',pinyin:'xià yǔ',ru:'идёт дождь'}, {hanzi:'晴天',pinyin:'qíngtiān',ru:'ясная погода'}, {hanzi:'阴天',pinyin:'yīntiān',ru:'пасмурная погода'}
 ],{examples:freeze([{hanzi:'今天很冷。',pinyin:'Jīntiān hěn lěng.',ru:'Сегодня холодно.'},{hanzi:'明天下雨。',pinyin:'Míngtiān xià yǔ.',ru:'Завтра дождь.'}])})
]);
