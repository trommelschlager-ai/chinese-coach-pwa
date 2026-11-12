// Panda Go v282 — reviewed supplementary HSK1 conversations.
// A fixed study partner, not generative AI or a real weather/identity service.
// Chinese answers are available as text; audioKey only exists for actual recorded clips.
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=282';

const N=['零','一','二','三','四','五','六','七','八','九'];
const P=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
const c=s=>normalize(s);
const num=n=>n<10?N[n]:n===10?'十':n<20?'十'+(n%10?N[n%10]:''):n<100?N[Math.floor(n/10)]+'十'+(n%10?N[n%10]:''):n===100?'一百':String(n);
const pyNum=n=>n<10?P[n]:n===10?'shí':n<20?'shí'+(n%10?' '+P[n%10]:''):n<100?P[Math.floor(n/10)]+' shí'+(n%10?' '+P[n%10]:''):n===100?'yì bǎi':null;
const months=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const monthsNext=months;
const readNum=s=>{if(/^\d+$/.test(s))return Number(s);for(let i=0;i<=100;i++)if(num(i)===s)return i;return null};
const scen='Учебная сценка о погоде. Панда не получает реальный прогноз.';
const role='Учебная роль Панды. Это вымышленный персонаж, не сведения о реальном человеке.';
const reply=(hanzi,pinyin,ru,context='')=>({hanzi,pinyin,ru,audioKey:lookupPilotAudio(hanzi)?hanzi:null,context});
const Q=[];
function add(lesson,keys,zh,py,ru,response,accepted=[],options={}){
 Q.push({lesson,keys:[...new Set(keys.map(c))],hanzi:zh,pinyin:py,ru,response,accepted,auto:options.auto!==false,
   context:options.context||'',intent:options.intent||'',requires:options.requires||[]});
}
const constant=(zh,py,ru,ctx='')=>()=>reply(zh,py,ru,ctx);
// Lesson 1 — variations and two simple clauses.
add(1,['你今天怎么样','你今天好吗'],'你今天怎么样？','Nǐ jīntiān zěnmeyàng?','Как у тебя дела сегодня?',
 constant('我今天很好，谢谢！','Wǒ jīntiān hěn hǎo, xièxie!','Сегодня всё хорошо, спасибо!'),['我今天很好','我很好']);
add(1,['晚上好你好吗','晚上好呀你好吗'],'晚上好！你好吗？','Wǎnshang hǎo! Nǐ hǎo ma?','Добрый вечер! Как дела?',
 constant('晚上好！我很好，谢谢！','Wǎnshang hǎo! Wǒ hěn hǎo, xièxie!','Добрый вечер! Всё хорошо, спасибо!'),['晚上好我很好','晚上好']);
add(1,['你好我是学生你呢','你好我是学生你是谁'],'你好！我是学生。你呢？','Nǐ hǎo! Wǒ shì xuésheng. Nǐ ne?','Привет! Я студент. А ты?',
 constant('你好！我是老师。','Nǐ hǎo! Wǒ shì lǎoshī.','Привет! Я учитель.',role),['你好我是学生'],{auto:false});
// Lesson 2 — actors in the same educational classroom scene.
add(2,['他是学生吗'],'他是学生吗？','Tā shì xuésheng ma?','Он студент?',
 constant('是，他是学生。','Shì, tā shì xuésheng.','Да, он студент.','Учебная сценка.'),['他是学生','是他是学生']);
add(2,['她是老师吗'],'她是老师吗？','Tā shì lǎoshī ma?','Она учитель?',
 constant('不是，她是学生。','Bú shì, tā shì xuésheng.','Нет, она студентка.','Учебная сценка.'),['不是她是学生','她是学生']);
add(2,['他们是学生吗'],'他们是学生吗？','Tāmen shì xuésheng ma?','Они студенты?',
 constant('是，他们是学生。','Shì, tāmen shì xuésheng.','Да, они студенты.','Учебная сценка.'),['他们是学生','是他们是学生']);
add(2,['她是谁'],'她是谁？','Tā shì shéi?','Кто она?',
 constant('她是老师。','Tā shì lǎoshī.','Она учитель.','Учебная сценка.'),['她是老师']);
// Lesson 3 — number and optional arithmetic extensions.
add(3,['你有三个吗'],'你有三个吗？','Nǐ yǒu sān ge ma?','У тебя три штуки?',
 constant('我有两个。','Wǒ yǒu liǎng ge.','У меня две штуки.','Учебная сценка: считаем предметы.'),['我有两个']);
add(3,['十后面是几'],'十后面是几？','Shí hòumiàn shì jǐ?','Какое число после десяти?',
 constant('十一。','Shí yī.','Одиннадцать.'),['十一'],{auto:false});
add(3,['三十加二是多少'],'三十加二是多少？','Sānshí jiā èr shì duōshao?','Сколько будет тридцать плюс два?',
 constant('三十二。','Sānshí èr.','Тридцать два.'),['三十二'],{auto:false});
add(3,['两个和三个一共几个'],'两个和三个一共几个？','Liǎng ge hé sān ge yígòng jǐ ge?','Два и три — сколько всего?',
 constant('五个。','Wǔ ge.','Пять штук.'),['五个'],{auto:false});
// Lesson 4 — calendar and a fictional personal schedule.
add(4,['你今天有空吗'],'你今天有空吗？','Nǐ jīntiān yǒu kòng ma?','Ты сегодня свободен?',
 constant('有，我今天有空。','Yǒu, wǒ jīntiān yǒu kòng.','Да, сегодня свободен.',role),['我今天有空','有我今天有空']);
add(4,['你星期天有空吗','你星期日有空吗'],'你星期天有空吗？','Nǐ xīngqītiān yǒu kòng ma?','Ты свободен в воскресенье?',
 constant('我星期天有空。','Wǒ xīngqītiān yǒu kòng.','В воскресенье я свободен.',role),['我星期天有空','我星期日有空']);
add(4,['星期一后面是星期几'],'星期一后面是星期几？','Xīngqīyī hòumiàn shì xīngqī jǐ?','Какой день после понедельника?',
 constant('星期二。','Xīngqīèr.','Вторник.'),['星期二'],{auto:false});
add(4,['你星期几去看电影'],'你星期几去看电影？','Nǐ xīngqī jǐ qù kàn diànyǐng?','В какой день идёшь в кино?',
 constant('我星期六去看电影。','Wǒ xīngqīliù qù kàn diànyǐng.','В субботу иду в кино.',role),['我星期六去看电影'],{auto:false});
// Lesson 5 — correct real calendar, fictitious birthday explicitly marked.
add(5,['现在是几月'],'现在是几月？','Xiànzài shì jǐ yuè?','Какой сейчас месяц?',
 ({date})=>{const m=date.getMonth()+1;return reply('现在是'+num(m)+'月。','Xiànzài shì '+pyNum(m)+' yuè.','Сейчас '+months[m-1]+'.','По календарю устройства.')},
 [],{auto:true});
add(5,['你的生日是几月几号','你生日是几月几号'],'你的生日是几月几号？','Nǐ de shēngrì shì jǐ yuè jǐ hào?','Когда твой день рождения?',
 constant('我的生日是三月六号。','Wǒ de shēngrì shì sān yuè liù hào.','День рождения учебной Панды — 6 марта.',role),['我的生日是三月六号'],{auto:false});
add(5,['这个月有多少天'],'这个月有多少天？','Zhège yuè yǒu duōshao tiān?','Сколько дней в этом месяце?',
 ({date})=>{const d=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();return reply('这个月有'+num(d)+'天。','Zhège yuè yǒu '+pyNum(d)+' tiān.','В этом месяце '+d+' дней.','По календарю устройства.')},
 [],{auto:false});
add(5,['下个月是几月'],'下个月是几月？','Xià ge yuè shì jǐ yuè?','Какой следующий месяц?',
 ({date})=>{const m=(date.getMonth()+1)%12+1;return reply('下个月是'+num(m)+'月。','Xià ge yuè shì '+pyNum(m)+' yuè.','Следующий месяц — '+monthsNext[m-1]+'.','По календарю устройства.')},
 [],{auto:false});
// Lesson 6 — relatives in a fictional Panda family; do not imply photo recognition.
add(6,['你有爷爷吗'],'你有爷爷吗？','Nǐ yǒu yéye ma?','У тебя есть дедушка по отцу?',
 constant('有，我有爷爷。','Yǒu, wǒ yǒu yéye.','Да, у меня есть дедушка по отцу.',role),['我有爷爷','有我有爷爷']);
add(6,['你有奶奶吗'],'你有奶奶吗？','Nǐ yǒu nǎinai ma?','У тебя есть бабушка по отцу?',
 constant('有，我有奶奶。','Yǒu, wǒ yǒu nǎinai.','Да, у меня есть бабушка по отцу.',role),['我有奶奶']);
add(6,['你有外婆吗'],'你有外婆吗？','Nǐ yǒu wàipó ma?','У тебя есть бабушка по матери?',
 constant('有，我有外婆。','Yǒu, wǒ yǒu wàipó.','Да, у меня есть бабушка по матери.',role),['我有外婆']);
add(6,['这是你爷爷吗'],'这是你爷爷吗？','Zhè shì nǐ yéye ma?','Это твой дедушка?',
 constant('是，这是我爷爷。','Shì, zhè shì wǒ yéye.','Да, в учебной сценке это мой дедушка.','Учебная сценка. Панда не видит реальное фото.'),['这是我爷爷','是这是我爷爷'],{auto:false});
add(6,['你有弟弟和妹妹吗'],'你有弟弟和妹妹吗？','Nǐ yǒu dìdi hé mèimei ma?','У тебя есть младший брат и младшая сестра?',
 constant('我有妹妹，没有弟弟。','Wǒ yǒu mèimei, méiyǒu dìdi.','У меня есть младшая сестра, но нет младшего брата.',role),['我有妹妹没有弟弟','我有弟弟和妹妹']);
// Lesson 7 — all present conditions are fictional, not realtime forecasts.
add(7,['今天下雪吗'],'今天下雪吗？','Jīntiān xià xuě ma?','Сегодня идёт снег?',
 constant('今天不下雪。','Jīntiān bú xià xuě.','Сегодня снег не идёт.',scen),['今天不下雪','今天下雪'],{context:scen});
add(7,['现在下雨吗'],'现在下雨吗？','Xiànzài xià yǔ ma?','Сейчас идёт дождь?',
 constant('没有，现在不下雨。','Méiyǒu, xiànzài bú xià yǔ.','Нет, сейчас дождя нет.',scen),['现在不下雨','现在下雨'],{context:scen});
add(7,['冬天天气怎么样'],'冬天天气怎么样？','Dōngtiān tiānqì zěnmeyàng?','Какая погода зимой?',
 constant('冬天很冷。','Dōngtiān hěn lěng.','Зимой холодно.','Пример, погода зависит от местности.'),['冬天很冷']);
add(7,['今天有风吗'],'今天有风吗？','Jīntiān yǒu fēng ma?','Сегодня ветрено?',
 constant('今天有风。','Jīntiān yǒu fēng.','Сегодня ветрено.',scen),['今天有风','今天没有风'],{context:scen});
add(7,['夏天天气怎么样'],'夏天天气怎么样？','Xiàtiān tiānqì zěnmeyàng?','Какая погода летом?',
 constant('夏天很热。','Xiàtiān hěn rè.','Летом жарко.','Пример, погода зависит от местности.'),['夏天很热']);

export const EXTENDED_QUESTION_COUNT=Q.length;
export function extendedQuestions(){return Q.map(({response,...rest})=>({...rest}))}
export function lookupExtendedQuestion(input){
 const s=c(input);return Q.find(q=>q.keys.includes(s))||null;
}
export function extensionAnswer(input,allowed=[1],date=new Date(),profile={}){
 const found=lookupExtendedQuestion(input);if(!found)return null;
 if(!allowed.includes(found.lesson)||found.requires.some(n=>!allowed.includes(n)))
  return {kind:'locked',lesson:found.lesson,message:'Эта тема пока не пройдена. Открой урок '+found.lesson+' или продолжи изученные темы.'};
 const spoken={known:true,hanzi:String(input).trim(),pinyin:found.pinyin,translation:found.ru,topic:found.lesson};
 const answer=found.response({date,profile});
 return {kind:'question',lesson:found.lesson,spoken,reply:answer};
}
export function extensionPrompts(lesson,date=new Date()){
 return Q.filter(x=>x.lesson===lesson&&x.auto).map(x=>{
  const modelAnswer=x.response({date}).hanzi;
  const monthQuestion=lesson===5&&c(x.hanzi)===c('现在是几月');
  const choices=monthQuestion?[modelAnswer,modelAnswer.replace('现在是','现在'),modelAnswer.replace('现在是','')]:x.accepted;
  const sample=choices[0]||modelAnswer;
  const result={hanzi:x.hanzi,pinyin:x.pinyin,ru:x.ru,lesson:x.lesson,accepted:choices,
    instruction:'Ответь по теме. Пример: '+sample+(x.context?' '+x.context:''),
    intent:x.intent||'extension',context:x.context,calendarDate:date.toISOString(),
    audioKey:lookupPilotAudio(x.hanzi)?x.hanzi:null,options:[]};
  return {...result,verifiedLines:[{},result]};
 });
}
export function extensionStatement(input,allowed=[1],context=null){
 const s=c(input),ctx=context?.lesson??context?.topic,ageReg='([零一二两三四五六七八九十百\\d]+)';
 let m;
 if(allowed.includes(6)){
  m=/^我有(哥哥|姐姐|弟弟|妹妹|爷爷|奶奶|外公|外婆)(?:我)?没有(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
  if(m&&m[1]!==m[2]){const have={哥哥:'старший брат',姐姐:'старшая сестра',弟弟:'младший брат',妹妹:'младшая сестра'};
   const no={哥哥:'старшего брата',姐姐:'старшей сестры',弟弟:'младшего брата',妹妹:'младшей сестры'};
   return {known:true,hanzi:input,pinyin:'Wǒ yǒu '+({哥哥:'gēge',姐姐:'jiějie',弟弟:'dìdi',妹妹:'mèimei'})[m[1]]+', méiyǒu '+({哥哥:'gēge',姐姐:'jiějie',弟弟:'dìdi',妹妹:'mèimei'})[m[2]]+'.',translation:'У меня есть '+have[m[1]]+', но нет '+no[m[2]]+'.',topic:6,family:{present:[m[1]],absent:m[2]},fact:{familyPresent:m[1],familyAbsent:m[2]}};
  }
  m=/^我(?:有|没有)(爷爷|奶奶|外公|外婆)$/.exec(s);
  if(m){const has=s.startsWith('我有');const terms={爷爷:['дедушка по отцу','дедушки по отцу'],奶奶:['бабушка по отцу','бабушки по отцу'],外公:['дедушка по матери','дедушки по матери'],外婆:['бабушка по матери','бабушки по матери']};
   return {known:true,hanzi:input,pinyin:'Wǒ '+(has?'yǒu ':'méiyǒu ')+({爷爷:'yéye',奶奶:'nǎinai',外公:'wàigōng',外婆:'wàipó'})[m[1]]+'.',translation:'У меня '+(has?'есть ':'нет ')+terms[m[1]][has?0:1]+'.',topic:6,family:{present:has?[m[1]]:[],absent:has?null:m[1]}};
  }
  m=new RegExp('^(她|他)'+ageReg+'岁$').exec(s);
  if(m&&context?.intent==='relative-age'&&context.relative){
   const d=readNum(m[2]);const v=Number.isInteger(d)&&d>0&&d<=100?d:null;
   if(v!==null)return {known:true,hanzi:input,pinyin:(m[1]==='她'?'Tā':'Tā')+' '+pyNum(v)+' suì.',translation:(m[1]==='她'?'Ей ':'Ему ')+v+' лет.',topic:6,fact:{relative:context.relative,relativeAge:v},family:{present:[context.relative],absent:null}};
  }
 }
 if(allowed.includes(5)){
  m=/^我的生日是([一二三四五六七八九十\d]+)月([一二三四五六七八九十\d]+)号$/.exec(s);
  if(m){const mo=readNum(m[1]),d=readNum(m[2]);if(Number.isInteger(mo)&&mo>0&&mo<=12&&d>0&&d<=31)return {known:true,hanzi:input,pinyin:'Wǒ de shēngrì shì '+pyNum(mo)+' yuè '+pyNum(d)+' hào.',translation:'Мой день рождения — '+d+'.'+mo+'.',topic:5,fact:{birthdayMonth:mo,birthdayDay:d}};}
 }
 if(allowed.includes(4)){
  m=/^我(今天|星期[一二三四五六日天])有空$/.exec(s);
  if(m){const days={星期一:['xīngqīyī','понедельник'],星期二:['xīngqīèr','вторник'],星期三:['xīngqīsān','среду'],星期四:['xīngqīsì','четверг'],星期五:['xīngqīwǔ','пятницу'],星期六:['xīngqīliù','субботу'],星期日:['xīngqīrì','воскресенье'],星期天:['xīngqītiān','воскресенье']};
   return {known:true,hanzi:input,pinyin:'Wǒ '+(m[1]==='今天'?'jīntiān':days[m[1]][0])+' yǒu kòng.',translation:m[1]==='今天'?'Я сегодня свободен.':'Я свободен в '+days[m[1]][1]+'.',topic:4,fact:{freeDay:m[1]}};
  }
 }
 if(allowed.includes(2)){
  m=/^(是|不是)(他|她|他们)(是)(老师|学生)$/.exec(s);
  if(m)return {known:true,hanzi:input,pinyin:(m[1]==='是'?'Shì':'Bú shì')+', '+(m[2]==='他们'?'tāmen':'tā')+' shì '+(m[4]==='老师'?'lǎoshī':'xuésheng')+'.',translation:(m[1]==='是'?'Да. ':'Нет. ')+(m[2]==='他'?'Он':m[2]==='她'?'Она':'Они')+' '+(m[1]==='不是'?'не ':'')+(m[4]==='老师'?'учитель.':'студент.'),topic:2};
 }
 return null;
}
const relatives={哥哥:['gēge','старший брат'],姐姐:['jiějie','старшая сестра'],弟弟:['dìdi','младший брат'],妹妹:['mèimei','младшая сестра']};
export function rememberedFamilyFollowup(profile={},allowed=[],recent=[]){
 if(!allowed.includes(6)||!allowed.includes(3))return null;
 for(const [relative,info] of Object.entries(relatives)){
  if(profile.family?.[relative]!==true||profile.siblingAges?.[relative]!=null)continue;
  const hanzi='你'+relative+'几岁？';
  if(recent.some(q=>c(q)===c(hanzi)))continue;
  const p={hanzi,pinyin:'Nǐ '+info[0]+' jǐ suì?',ru:'Сколько лет твоему родственнику: '+info[1]+'?',
    lesson:6,relative,intent:'relative-age',accepted:[],
    instruction:'Ответь: 我'+relative+'八岁。 / '+(relative==='妹妹'||relative==='姐姐'?'她':'他')+'八岁。',
    audioKey:lookupPilotAudio(hanzi)?hanzi:null,context:'Ты рассказал о родственнике ранее.'};
  return {...p,verifiedLines:[{},p]};
 }
 return null;
}
