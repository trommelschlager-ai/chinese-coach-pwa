/* Isolated shared dialogue dispatcher and ephemeral context. No UI integration, network or persistence. */
import {interpretContextualTurn,interpretLinkedTurn,interpretOpinion,interpretAction} from './panda-unified-semantics-v1.mjs';

// Reviewed open-question answers: only bind to the immediately preceding
// question. Travel time/method are carried only through an explicitly linked
// China-trip chain, never inferred from an unrelated short answer.
const cleanOpen=s=>String(s??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const OPEN_ANSWERS=Object.freeze({
 "daily-breakfast":{"吃":["Chī.","Да, завтракаю.","yes"],"吃早饭":["Chī zǎofàn.","Завтракаю.","yes"],"我吃早饭":["Wǒ chī zǎofàn.","Я завтракаю.","yes"],"我早上吃早饭":["Wǒ zǎoshang chī zǎofàn.","Я завтракаю утром.","yes"],"不吃":["Bù chī.","Нет, не завтракаю.","no"],"我不吃早饭":["Wǒ bù chī zǎofàn.","Я не завтракаю.","no"]},
 "daily-sleep":{"九点":["Jiǔ diǎn.","В девять вечера.","21"],"十点":["Shí diǎn.","В десять вечера.","22"],"十一点":["Shíyī diǎn.","В одиннадцать вечера.","23"],"十二点":["Shí'èr diǎn.","В полночь.","00"],"我晚上十点睡觉":["Wǒ wǎnshang shí diǎn shuìjiào.","Я ложусь спать в десять вечера.","22"]},
 "work-busy":{"忙":["Máng.","Занят(а).","yes"],"很忙":["Hěn máng.","Очень занят(а).","yes"],"我今天很忙":["Wǒ jīntiān hěn máng.","Я сегодня очень занят(а).","yes"],"不忙":["Bù máng.","Не занят(а).","no"]},
 "work-time":{"我八点去上班":["Wǒ bā diǎn qù shàngbān.","Я иду на работу в восемь.","8"],"我九点去上班":["Wǒ jiǔ diǎn qù shàngbān.","Я иду на работу в девять.","9"],"我十点去上班":["Wǒ shí diǎn qù shàngbān.","Я иду на работу в десять.","10"],"八点":["Bā diǎn.","В восемь.","8"],"九点":["Jiǔ diǎn.","В девять.","9"],"十点":["Shí diǎn.","В десять.","10"],"我不上班":["Wǒ bú shàngbān.","Я не хожу на работу.","none"]},
 "family-siblings":{"有":["Yǒu.","Есть.","yes"],"没有":["Méiyǒu.","Нет.","no"],"我没有兄弟姐妹":["Wǒ méiyǒu xiōngdì jiěmèi.","У меня нет братьев и сестёр.","no"],"我有一个哥哥":["Wǒ yǒu yí ge gēge.","У меня есть старший брат.","older-brother"],"我有一个姐姐":["Wǒ yǒu yí ge jiějie.","У меня есть старшая сестра.","older-sister"],"我有一个弟弟":["Wǒ yǒu yí ge dìdi.","У меня есть младший брат.","younger-brother"],"我有一个妹妹":["Wǒ yǒu yí ge mèimei.","У меня есть младшая сестра.","younger-sister"],"不想说":["Bù xiǎng shuō.","Не хочу говорить.","skip"],"我不想说":["Wǒ bù xiǎng shuō.","Я не хочу говорить.","skip"]},
 "family-size":{"两口人":["Liǎng kǒu rén.","Два человека.","2"],"三口人":["Sān kǒu rén.","Три человека.","3"],"四口人":["Sì kǒu rén.","Четыре человека.","4"],"五口人":["Wǔ kǒu rén.","Пять человек.","5"],"我家有三口人":["Wǒ jiā yǒu sān kǒu rén.","В моей семье три человека.","3"],"我家有四口人":["Wǒ jiā yǒu sì kǒu rén.","В моей семье четыре человека.","4"],"不想说":["Bù xiǎng shuō.","Не хочу говорить.","skip"],"我不想说":["Wǒ bù xiǎng shuō.","Я не хочу говорить.","skip"]},
 'study-practice':{"声调":["Shēngdiào.","Тоны.","声调"],"我想练习声调":["Wǒ xiǎng liànxí shēngdiào.","Я хочу практиковать тоны.","声调"],"我想学声调":["Wǒ xiǎng xué shēngdiào.","Я хочу изучать тоны.","声调"],"我想学习声调":["Wǒ xiǎng xuéxí shēngdiào.","Я хочу изучать тоны.","声调"],"发音":["Fāyīn.","Произношение.","发音"],"我想练习发音":["Wǒ xiǎng liànxí fāyīn.","Я хочу практиковать произношение.","发音"],"我想学发音":["Wǒ xiǎng xué fāyīn.","Я хочу изучать произношение.","发音"],"我想学习发音":["Wǒ xiǎng xuéxí fāyīn.","Я хочу изучать произношение.","发音"],"语法":["Yǔfǎ.","Грамматику.","语法"],"我想练习语法":["Wǒ xiǎng liànxí yǔfǎ.","Я хочу практиковать грамматику.","语法"],"我想学语法":["Wǒ xiǎng xué yǔfǎ.","Я хочу изучать грамматику.","语法"],"我想学习语法":["Wǒ xiǎng xuéxí yǔfǎ.","Я хочу изучать грамматику.","语法"],"汉字":["Hànzì.","Иероглифы.","汉字"],"我想练习汉字":["Wǒ xiǎng liànxí Hànzì.","Я хочу практиковать иероглифы.","汉字"],"我想学汉字":["Wǒ xiǎng xué Hànzì.","Я хочу изучать иероглифы.","汉字"],"我想学习汉字":["Wǒ xiǎng xuéxí Hànzì.","Я хочу изучать иероглифы.","汉字"],"听力":["Tīnglì.","Понимание на слух.","听力"],"我想练习听力":["Wǒ xiǎng liànxí tīnglì.","Я хочу практиковать понимание на слух.","听力"],"我想学听力":["Wǒ xiǎng xué tīnglì.","Я хочу изучать понимание на слух.","听力"],"我想学习听力":["Wǒ xiǎng xuéxí tīnglì.","Я хочу изучать понимание на слух.","听力"],"口语":["Kǒuyǔ.","Разговорную речь.","口语"],"我想练习口语":["Wǒ xiǎng liànxí kǒuyǔ.","Я хочу практиковать разговорную речь.","口语"],"我想学口语":["Wǒ xiǎng xué kǒuyǔ.","Я хочу изучать разговорную речь.","口语"],"我想学习口语":["Wǒ xiǎng xuéxí kǒuyǔ.","Я хочу изучать разговорную речь.","口语"],"我不想练习":["Wǒ bù xiǎng liànxí.","Я не хочу тренироваться.","skip"],"不知道":["Bù zhīdào.","Не знаю.","unknown"],"还没想好":["Hái méi xiǎng hǎo.","Ещё не решил(а).","unknown"]},
 'study-reason':{
  '因为我想去中国':['Yīnwèi wǒ xiǎng qù Zhōngguó.','Потому что я хочу поехать в Китай.','china-trip'],
  '我想去中国':['Wǒ xiǎng qù Zhōngguó.','Я хочу поехать в Китай.','china-trip'],
  '想去中国':['Xiǎng qù Zhōngguó.','Хочу поехать в Китай.','china-trip'],
  '因为我想和朋友说中文':['Yīnwèi wǒ xiǎng hé péngyou shuō Zhōngwén.','Потому что хочу говорить по-китайски с друзьями.','friends'],
  '因为我喜欢中文':['Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский.','interest']
 },
 'travel-time':{
  '明天':['Míngtiān.','Завтра.','明天'],
  '下周':['Xià zhōu.','На следующей неделе.','下周'],
  '下个月':['Xià ge yuè.','В следующем месяце.','下个月'],
  '明年':['Míngnián.','В следующем году.','明年'],
  '我明天去中国':['Wǒ míngtiān qù Zhōngguó.','Я завтра поеду в Китай.','明天'],
  '我下个月去中国':['Wǒ xià ge yuè qù Zhōngguó.','Я поеду в Китай в следующем месяце.','下个月'],
  '下个月我想去中国':['Xià ge yuè wǒ xiǎng qù Zhōngguó.','В следующем месяце я хочу поехать в Китай.','下个月'],
  '我下个月想去中国':['Wǒ xià ge yuè xiǎng qù Zhōngguó.','Я хочу поехать в Китай в следующем месяце.','下个月'],
  '我还没想好':['Wǒ hái méi xiǎng hǎo.','Я ещё не решил(а).','undecided']
 },
 'hobby':{
  '跑步':['Pǎobù.','Бегать.','跑步'],
  '我喜欢跑步':['Wǒ xǐhuan pǎobù.','Я люблю бегать.','跑步'],
  '看书':['Kàn shū.','Читать книги.','看书'],
  '我喜欢看书':['Wǒ xǐhuan kàn shū.','Я люблю читать книги.','看书'],
  '听音乐':['Tīng yīnyuè.','Слушать музыку.','听音乐'],
  '我喜欢听音乐':['Wǒ xǐhuan tīng yīnyuè.','Я люблю слушать музыку.','听音乐'],
  '游泳':['Yóuyǒng.','Плавать.','游泳'],
  '我喜欢游泳':['Wǒ xǐhuan yóuyǒng.','Я люблю плавать.','游泳']
 },
 'food':{
  '面条':['Miàntiáo.','Лапшу.','面条'],
  '我想吃面条':['Wǒ xiǎng chī miàntiáo.','Я хочу поесть лапши.','面条'],
  '米饭':['Mǐfàn.','Рис.','米饭'],
  '我想吃米饭':['Wǒ xiǎng chī mǐfàn.','Я хочу поесть риса.','米饭'],
  '饺子':['Jiǎozi.','Пельмени.','饺子'],
  '我想吃饺子':['Wǒ xiǎng chī jiǎozi.','Я хочу поесть пельменей.','饺子']
 },
 'hobby-frequency':{
  '经常':['Jīngcháng.','Часто.','often'],
  '不经常':['Bù jīngcháng.','Не часто.','rarely'],
  '每天':['Měitiān.','Каждый день.','daily'],
  '有时候':['Yǒu shíhou.','Иногда.','sometimes'],
  '是的':['Shì de.','Да.','often'],
  '对':['Duì.','Да, верно.','often']
 },
 'hobby-weekend':{
  '跑步':['Pǎobù.','Бегать.','跑步'],
  '看书':['Kàn shū.','Читать книги.','看书'],
  '听音乐':['Tīng yīnyuè.','Слушать музыку.','听音乐'],
  '游泳':['Yóuyǒng.','Плавать.','游泳'],
  '我周末常常跑步':['Wǒ zhōumò chángcháng pǎobù.','По выходным я часто бегаю.','跑步'],
  '我周末喜欢看书':['Wǒ zhōumò xǐhuan kàn shū.','По выходным я люблю читать.','看书'],
  '我周末喜欢游泳':['Wǒ zhōumò xǐhuan yóuyǒng.','По выходным я люблю плавать.','游泳'],
  '休息':['Xiūxi.','Отдыхать.','休息']
 },
 'hobby-plan':{
  '跑步':['Pǎobù.','Бегать.','跑步'],
  '看书':['Kàn shū.','Читать книги.','看书'],
  '游泳':['Yóuyǒng.','Плавать.','游泳'],
  '休息':['Xiūxi.','Отдыхать.','休息'],
  '我打算跑步':['Wǒ dǎsuàn pǎobù.','Я собираюсь бегать.','跑步'],
  '我打算看书':['Wǒ dǎsuàn kàn shū.','Я собираюсь читать.','看书'],
  '我打算休息':['Wǒ dǎsuàn xiūxi.','Я собираюсь отдыхать.','休息'],
  '还没想好':['Hái méi xiǎng hǎo.','Ещё не решил(а).','undecided']
 },
 'food-more':{
  '不要了':['Bú yào le.','Больше не нужно.','no'],
  '不用了':['Bú yòng le.','Больше не нужно.','no'],
  '没有了':['Méiyǒu le.','Больше ничего.','no'],
  '还要':['Hái yào.','Хочу ещё.','yes'],
  '还要米饭':['Hái yào mǐfàn.','Ещё риса.','米饭'],
  '还要面条':['Hái yào miàntiáo.','Ещё лапши.','面条'],
  '还要饺子':['Hái yào jiǎozi.','Ещё пельменей.','饺子']
 },
 'food-preference':{
  '米饭':['Mǐfàn.','Рис.','米饭'],
  '面条':['Miàntiáo.','Лапшу.','面条'],
  '饺子':['Jiǎozi.','Пельмени.','饺子'],
  '我喜欢吃米饭':['Wǒ xǐhuan chī mǐfàn.','Я люблю есть рис.','米饭'],
  '我喜欢吃面条':['Wǒ xǐhuan chī miàntiáo.','Я люблю есть лапшу.','面条'],
  '我喜欢吃饺子':['Wǒ xǐhuan chī jiǎozi.','Я люблю есть пельмени.','饺子']
 },
 'next-action':{
  '休息':['Xiūxi.','Отдыхать.','rest'],
  '我想休息':['Wǒ xiǎng xiūxi.','Я хочу отдохнуть.','rest'],
  '学习中文':['Xuéxí Zhōngwén.','Изучать китайский.','study'],
  '我想学中文':['Wǒ xiǎng xué Zhōngwén.','Я хочу учить китайский.','study'],
  '学中文':['Xué Zhōngwén.','Учить китайский.','study']
 },
 'travel-method':{
  '坐飞机':['Zuò fēijī.','На самолёте.','坐飞机'],
  '坐火车':['Zuò huǒchē.','На поезде.','坐火车'],
  '坐高铁':['Zuò gāotiě.','На скоростном поезде.','坐高铁'],
  '我打算坐飞机':['Wǒ dǎsuàn zuò fēijī.','Я планирую лететь на самолёте.','坐飞机'],
  '我想坐火车':['Wǒ xiǎng zuò huǒchē.','Я хочу поехать на поезде.','坐火车']
 }
});

// Compose reviewed answers rather than enumerating every full sentence.
// Anchored patterns are limited to the currently displayed question. Never
// treat negation, a question, another person's action or an unknown word as an answer.
const CLOCK_HOURS=Object.freeze({'一':[1,'yī'],'两':[2,'liǎng'],'三':[3,'sān'],'四':[4,'sì'],'五':[5,'wǔ'],'六':[6,'liù'],'七':[7,'qī'],'八':[8,'bā'],'九':[9,'jiǔ'],'十':[10,'shí'],'十一':[11,'shíyī'],'十二':[12,"shí'èr"]});
const CLOCK_SUFFIXES=Object.freeze({'':[0,''],'半':[30,' bàn'],'一刻':[15,' yí kè'],'十五分':[15,' shíwǔ fēn'],'三十分':[30,' sānshí fēn'],'四十五分':[45,' sìshíwǔ fēn']});
const reviewedSentence=parts=>{const s=parts.filter(Boolean).join(' ');return s.charAt(0).toUpperCase()+s.slice(1)+'.';};
function composeClockAnswer(slot,key){
 const sleep=slot==='daily-sleep',work=slot==='work-time';
 if(!sleep&&!work)return null;
 const pattern=sleep?/^(我)?(晚上)?(十二|十一|十|一|两|三|四|五|六|七|八|九)点(半|一刻|十五分|三十分|四十五分)?(睡觉)?$/u:/^(我)?(早上|上午)?(十二|十一|十|一|两|三|四|五|六|七|八|九)点(半|一刻|十五分|三十分|四十五分)?(去上班|上班)?$/u;
 const m=pattern.exec(key);if(!m)return null;
 const [,subject,period,hour,suffix='',action]=m;
 // A subject alone ("我七点") is a natural contextual answer, but
 // do not infer a 24h time for ambiguous late-night one-to-six.
 const [h,hpy]=CLOCK_HOURS[hour],[min,mpy]=CLOCK_SUFFIXES[suffix];
 const clockPy=hpy+' diǎn'+mpy;
 const time=h+(min?':'+String(min).padStart(2,'0')+ '':'');
 const clockRu='в '+time;
 const timeRu=period==='晚上'?' '+(h>=7&&h<=11?'вечера':h===12?'ночи':'ночи'):period?' утра':'';
 const ru=action?(sleep?'Я ложусь спать ':'Я иду на работу ')+clockRu+timeRu:clockRu.charAt(0).toUpperCase()+clockRu.slice(1)+timeRu;
 const py=reviewedSentence([subject?'wǒ':'',period?({晚上:'wǎnshang',早上:'zǎoshang',上午:'shàngwǔ'}[period]):'',clockPy,action?({睡觉:'shuìjiào',去上班:'qù shàngbān',上班:'shàngbān'}[action]):'']);
 return [py,ru+'.',time+(period?':'+period:'')];
}
function composeReviewedAnswer(slot,key){
 const clock=composeClockAnswer(slot,key);if(clock)return clock;
 if(slot==='work-busy'||slot==='work-time'){
  const off=/^(我)?(今天)?(不上班|休息|不用上班)$/u.exec(key);
  if(off){
   const [,subject,day,action]=off;
   const a={不上班:['bú shàngbān','не работаю'],休息:['xiūxi','отдыхаю'],不用上班:['bú yòng shàngbān','не нужно идти на работу']}[action];
   // Without a day marker, only an explicit work-time answer is safe.
   if(day||slot==='work-time')return [reviewedSentence([subject?'wǒ':'',day?'jīntiān':'',a[0]]),(action==='不用上班'?'Мне ':'Я ')+(day?'сегодня ':'')+a[1]+'.',slot==='work-busy'?'off':'none'];
  }
  if(slot==='work-time'&&['我没有工作','没有工作','我现在没有工作','现在没有工作'].includes(key)){
   return [reviewedSentence([key.startsWith('我')?'wǒ':'',key.includes('现在')?'xiànzài':'','méiyǒu gōngzuò']),'У меня '+(key.includes('现在')?'сейчас ':'')+'нет работы.','none'];
  }
 }
 if(slot==='study-reason'){
  const m=/^(因为)?(我)?(想在中国工作|想去中国旅游|想在中国学习|想和中国人聊天|想和朋友说中文|想看懂中文|喜欢中国文化|喜欢中文|对中国文化感兴趣|工作需要)$/u.exec(key);
  if(m){
   const [,cause,subject,reason]=m;
   const reasons={
    想在中国工作:['xiǎng zài Zhōngguó gōngzuò','хочу работать в Китае','work'],
    想去中国旅游:['xiǎng qù Zhōngguó lǚyóu','хочу путешествовать по Китаю','china-trip'],
    想在中国学习:['xiǎng zài Zhōngguó xuéxí','хочу учиться в Китае','study'],
    想和中国人聊天:['xiǎng hé Zhōngguó rén liáotiān','хочу общаться с китайцами','communication'],
    想和朋友说中文:['xiǎng hé péngyou shuō Zhōngwén','хочу говорить по-китайски с друзьями','friends'],
    想看懂中文:['xiǎng kàndǒng Zhōngwén','хочу понимать китайский текст','reading'],
    喜欢中国文化:['xǐhuan Zhōngguó wénhuà','люблю китайскую культуру','culture'],
    喜欢中文:['xǐhuan Zhōngwén','люблю китайский язык','interest'],
    对中国文化感兴趣:['duì Zhōngguó wénhuà gǎn xìngqù','интересуюсь китайской культурой','culture'],
    工作需要:['gōngzuò xūyào','мне это нужно для работы','work']
   };
   if(subject&&reason==='工作需要')return null;
   const [py,ru,value]=reasons[reason];
   const sentence=(cause?'Потому что ':'')+(reason==='工作需要'?'':'я ')+ru;
   return [reviewedSentence([cause?'yīnwèi':'',subject?'wǒ':'',py]),sentence.charAt(0).toUpperCase()+sentence.slice(1)+'.',value];
  }
 }
 if(slot==='study-practice'){
  const m=/^(我)?想(练习|学|学习|提高)(声调|发音|语法|汉字|听力|口语|中文|汉语)$/u.exec(key);
  if(m){
   const [,subject,verb,target]=m;
   if(verb==='提高'&&!['听力','口语','中文','汉语'].includes(target))return null;
   const v={练习:['liànxí','практиковать'],学:['xué','изучать'],学习:['xuéxí','изучать'],提高:['tígāo','улучшить']}[verb];
   const t={声调:['shēngdiào','тоны'],发音:['fāyīn','произношение'],语法:['yǔfǎ','грамматику'],汉字:['Hànzì','иероглифы'],听力:['tīnglì','понимание на слух'],口语:['kǒuyǔ','разговорную речь'],中文:['Zhōngwén','китайский язык'],汉语:['Hànyǔ','китайский язык']}[target];
   if(verb==='提高'&&['中文','汉语'].includes(target))return null;
   return [reviewedSentence([subject?'wǒ':'','xiǎng',v[0],t[0]]),'Я хочу '+v[1]+' '+t[1]+'.',target];
  }
 }
 if(slot==='family-siblings'){
  // Specific relatives are not equivalent to having no siblings at all.
  const positive=/^(我)?有(一个|两个|三个|四个)?(哥哥|姐姐|弟弟|妹妹)$/u.exec(key);
  if(positive){
   const [,subject,count='',relative]=positive;
   const numbers={'':['',''],一个:['yí ge','1'],两个:['liǎng ge','2'],三个:['sān ge','3'],四个:['sì ge','4']};
   const relatives={哥哥:['gēge','старший брат','старших брата','older-brother'],姐姐:['jiějie','старшая сестра','старшие сестры','older-sister'],弟弟:['dìdi','младший брат','младших брата','younger-brother'],妹妹:['mèimei','младшая сестра','младшие сестры','younger-sister']};
   const [npy,n]=numbers[count],[rpy,singular,plural,value]=relatives[relative];
   return [reviewedSentence([subject?'wǒ':'','yǒu',npy,rpy]),'У меня есть '+(n&&n!=='1'?n+' '+plural:singular)+'.',value];
  }
  if(['没有兄弟姐妹','我没有哥哥姐姐弟弟妹妹','没有哥哥姐姐弟弟妹妹','我没有兄弟和姐妹','没有兄弟和姐妹'].includes(key)){
   const subject=key.startsWith('我'),phrase=key.includes('哥哥')?'gēge jiějie dìdi mèimei':key.includes('和')?'xiōngdì hé jiěmèi':'xiōngdì jiěmèi';
   return [reviewedSentence([subject?'wǒ':'','méiyǒu',phrase]),'У меня нет братьев и сестёр.','no'];
  }
 }
 if(slot==='family-size'){
  const m=/^(我家有|我们家有|家里有|我家里有)?(一|两|二|三|四|五|六|七|八|九|十)口人$/u.exec(key);
  if(m){
   const [,prefix='',number]=m;
   const n={一:[1,'yì'],两:[2,'liǎng'],二:[2,'èr'],三:[3,'sān'],四:[4,'sì'],五:[5,'wǔ'],六:[6,'liù'],七:[7,'qī'],八:[8,'bā'],九:[9,'jiǔ'],十:[10,'shí']}[number];
   // In this classifier construction 两口人 is the idiomatic form.
   if(number==='二')return null;
   const p={'':'',我家有:'wǒ jiā yǒu',我们家有:'wǒmen jiā yǒu',家里有:'jiā lǐ yǒu',我家里有:'wǒ jiā lǐ yǒu'}[prefix];
   const ru=n[0]===1?'1 человек':n[0]<=4?n[0]+' человека':n[0]+' человек';
   return [reviewedSentence([p,n[1],'kǒu rén']),(prefix?'В семье ':'')+ru+'.',String(n[0])];
  }
 }
 if(slot==='daily-breakfast'){
  const m=/^(我)?(早上|每天)?(不|一般不|有时候不|有时候|通常|一般|每天|从来不)?吃早饭$/u.exec(key);
  if(m){
   const [,subject,period,frequency='']=m;
   const f={不:['bù','не завтракаю','no'],一般不:['yìbān bù','обычно не завтракаю','no'],有时候不:['yǒu shíhou bù','иногда не завтракаю','sometimes'],有时候:['yǒu shíhou','иногда завтракаю','sometimes'],通常:['tōngcháng','обычно завтракаю','yes'],一般:['yìbān','обычно завтракаю','yes'],每天:['měitiān','завтракаю каждый день','yes'],从来不:['cónglái bù','никогда не завтракаю','no'],'':['','завтракаю','yes']}[frequency];
   // Reject conflicting doubled time/frequency ("每天每天").
   if(period==='每天'&&frequency&&!['不',''].includes(frequency))return null;
   const ru='Я '+f[1]+(period==='早上'?' утром':period==='每天'?' каждый день':'')+'.';
   return [reviewedSentence([subject?'wǒ':'',period?({早上:'zǎoshang',每天:'měitiān'}[period]):'',f[0],'chī zǎofàn']),ru,f[2]];
  }
 }
 if(slot==='work-busy'){
  const m=/^(我)?(今天)?(很|非常|特别|有点|不太|不|一点也不)?忙$/u.exec(key);
  if(m){const [,subject,day,degree='']=m;const f={很:['hěn','очень','yes'],非常:['fēicháng','очень','yes'],特别:['tèbié','особенно','yes'],有点:['yǒudiǎn','немного','yes'],不太:['bú tài','не очень','no'],不:['bù','не','no'],一点也不:['yìdiǎn yě bù','совсем не','no'],'':['','','yes']}[degree];return [reviewedSentence([subject?'wǒ':'',day?'jīntiān':'',f[0],'máng']),['Я',day?'сегодня':'',f[1],'занят(а).'].filter(Boolean).join(' '),f[2]];}
 }
 if(slot==='hobby-frequency'){
  const m=/^(我)?(不经常|经常|每天|有时候|偶尔|很少)(跑步|看书|听音乐|游泳)?$/u.exec(key);
  if(m){
   const [,subject,freq,activity]=m;
   const f={不经常:['bù jīngcháng','не часто','rarely'],经常:['jīngcháng','часто','often'],每天:['měitiān','каждый день','daily'],有时候:['yǒu shíhou','иногда','sometimes'],偶尔:['ǒu'+"’"+'ěr','изредка','sometimes'],很少:['hěn shǎo','редко','rarely']}[freq];
   const a=activity?{跑步:['pǎobù','бегаю'],看书:['kàn shū','читаю книги'],听音乐:['tīng yīnyuè','слушаю музыку'],游泳:['yóuyǒng','плаваю']}[activity]:null;
   return [reviewedSentence([subject?'wǒ':'',f[0],a?.[0]]),(a?'Я '+f[1]+' '+a[1]:f[1])+'.',f[2]];
  }
 }
 if(slot==='travel-time'){
  const dates={今天:['jīntiān','сегодня'],明天:['míngtiān','завтра'],后天:['hòutiān','послезавтра'],下周:['xià zhōu','на следующей неделе'],下个月:['xià ge yuè','в следующем месяце'],明年:['míngnián','в следующем году']};
  const m=/^(我)?(今天|明天|后天|下周|下个月|明年)(我)?(打算|想|准备|要)?(去中国)?$/u.exec(key);
  if(m){const [,first,date,second,verb,dest]=m;if(first&&second||verb&&!dest||second&&!dest)return null;const [dpy,dru]=dates[date];const verbs={打算:['dǎsuàn','планирую'],想:['xiǎng','хочу'],准备:['zhǔnbèi','собираюсь'],要:['yào','собираюсь']};const v=verb?verbs[verb]:null;return [reviewedSentence([first?'wǒ':'',dpy,second?'wǒ':'',v?.[0],dest?'qù Zhōngguó':'']),dest?'Я '+(v?v[1]+' поехать':'поеду')+' в Китай '+dru+'.':dru+'.',date];}
 }
 return null;
}

function interpretOpenAnswer(raw,context){
 const pending=context.pendingQuestion;
 if(pending?.intent!=='ask-open-reviewed'||!Object.hasOwn(OPEN_ANSWERS,pending.slot))return null;
 // A learner question must not be interpreted as a statement, even if its punctuation is stripped.
 if(/[？?]/u.test(String(raw)))return null;
 const answers=OPEN_ANSWERS[pending.slot],key=cleanOpen(raw);
 // Keep exact reviewed translations first. Reject internal sentence/question punctuation for composed answers.
 const item=Object.hasOwn(answers,key)?answers[key]:/[？?！!。；;，,]/u.test(String(raw).trim().replace(/[。！!]$/u,''))?null:composeReviewedAnswer(pending.slot,key);
 if(!item)return null;
 const [pinyin,translation,value]=item;
 return {raw:String(raw),intent:'answer-open-reviewed',construction:'contextual-open-answer',slot:pending.slot,value,topic:pending.slot.startsWith('hobby')?'leisure':pending.slot.startsWith('food')?'food':pending.slot==='next-action'||pending.slot.startsWith('daily')?'daily':pending.slot.startsWith('work')?'work':pending.slot.startsWith('family')?'family':pending.slot.startsWith('study')?'study':'travel',reference:pending.raw,pinyin,translation,toneVerified:false};
}
function reviewedOpenQuestion(hanzi,previous,linked,memory){
 const s=cleanOpen(hanzi);
 let slot=null;
 if(s==='你为什么想学中文')slot='study-reason';
 else if(s==='你想练习什么'||s==='你想学什么')slot='study-practice';
 else if(s==='你有什么爱好')slot='hobby';
 else if(s==='你想吃什么')slot='food';
 else if(s==='你早上吃早饭吗')slot='daily-breakfast';
 else if(s==='你今天忙吗')slot='work-busy';
 else if(s==='你晚上几点睡觉')slot='daily-sleep';
 else if(s==='你几点去上班')slot='work-time';
 else if(s==='你有兄弟姐妹吗')slot='family-siblings';
 else if(s==='明白了你家有几口人')slot='family-size';
 else if(linked&&previous?.intent==='request-topic-change'&&['daily','work','study','family','auto'].includes(previous.value)&&s==='你接下来想做什么')slot='next-action';
 else if(linked&&previous?.intent==='request-topic-change'&&previous.value==='hobby'&&memory?.hobby){
  if(s==='你周末喜欢做什么'&&!memory.weekend)slot='hobby-weekend';
  else if(s==='你周末有什么计划'&&memory.weekend&&!memory.plan)slot='hobby-plan';
  else if(s==='你接下来想做什么'&&memory.plan)slot='next-action';
 }
 else if(linked&&previous?.intent==='answer-open-reviewed'&&previous.slot==='study-reason'&&previous.value==='china-trip'&&s==='你打算什么时候去')slot='travel-time';
 else if(linked&&previous?.intent==='answer-open-reviewed'&&previous.slot==='travel-time'&&s==='你打算怎么去')slot='travel-method';
 else if(linked&&previous?.intent==='answer-open-reviewed'){
  if(previous.slot==='hobby'&&s==='你经常做这件事吗')slot='hobby-frequency';
  else if(previous.slot==='hobby-frequency'&&s==='你周末喜欢做什么')slot='hobby-weekend';
  else if(previous.slot==='food'&&s==='还要别的吗')slot='food-more';
  else if(previous.slot==='food-more'&&previous.value==='yes'&&s==='你还喜欢吃什么')slot='food-preference';
  else if(['hobby-weekend','hobby-plan','food-more','food-preference','daily-sleep','daily-breakfast','work-busy','work-time','study-reason','family-siblings','family-size'].includes(previous.slot)&&s==='你接下来想做什么')slot='next-action';
 }
 return slot?{intent:'ask-open-reviewed',subject:'你',slot,raw:hanzi}:null;
}


const TOPIC_REQUESTS=Object.freeze({
 "我们换个话题吧":["Wǒmen huàn ge huàtí ba.","Давай сменим тему.","other"],
 "换一个话题吧":["Huàn yí ge huàtí ba.","Давай сменим тему.","other"],
 "聊点别的吧":["Liáo diǎn bié de ba.","Давай поговорим о другом.","other"],
 "你决定吧":["Nǐ juédìng ba.","Решай ты.","auto"],
 "你来决定吧":["Nǐ lái juédìng ba.","Решай ты.","auto"],
 "我们聊聊工作吧":["Wǒmen liáoliao gōngzuò ba.","Давай поговорим о работе.","work"],
 "我们聊聊家庭吧":["Wǒmen liáoliao jiātíng ba.","Давай поговорим о семье.","family"],
 "我们聊聊我的一天吧":["Wǒmen liáoliao wǒ de yì tiān ba.","Давай поговорим о моём дне.","daily"],
 "聊聊中文吧":["Liáoliao Zhōngwén ba.","Давай поговорим о китайском языке.","study"],
 "聊聊中文吗":["Liáoliao Zhōngwén ma?","Поговорим о китайском языке?","study"],
 "我们聊聊中文吗":["Wǒmen liáoliao Zhōngwén ma?","Поговорим о китайском языке?","study"],
 "聊聊工作吗":["Liáoliao gōngzuò ma?","Поговорим о работе?","work"],
 "我们聊聊中文吧":["Wǒmen liáoliao Zhōngwén ba.","Давай поговорим о китайском языке.","study"],
 "聊聊美食吧":["Liáoliao měishí ba.","Давай поговорим о вкусной еде.","food"],
 '换个话题吧':['Huàn ge huàtí ba.','Давай сменим тему.','other'],
 '我们聊点别的吧':['Wǒmen liáo diǎn bié de ba.','Давай поговорим о другом.','other'],
 '聊聊爱好吧':['Liáoliao àihào ba.','Давай поговорим об увлечениях.','hobby'],
 '我们聊聊爱好吧':['Wǒmen liáoliao àihào ba.','Давай поговорим об увлечениях.','hobby'],
 '聊聊我的一天吧':['Liáoliao wǒ de yì tiān ba.','Давай поговорим о моём дне.','daily'],
 '聊聊工作吧':['Liáoliao gōngzuò ba.','Давай поговорим о работе.','work'],
 '聊聊家庭吧':['Liáoliao jiātíng ba.','Давай поговорим о семье.','family'],
 '你来选话题吧':['Nǐ lái xuǎn huàtí ba.','Выбери тему разговора.','auto'],
 '你选吧':['Nǐ xuǎn ba.','Выбирай ты.','auto'],
 '聊聊学习中文吧':['Liáoliao xuéxí Zhōngwén ba.','Давай поговорим об изучении китайского.','study'],
 '聊聊吃的吧':['Liáoliao chī de ba.','Давай поговорим о еде.','food'],
 '我们聊聊吃的吧':['Wǒmen liáoliao chī de ba.','Давай поговорим о еде.','food']
});
function interpretTopicRequest(raw){
 const key=cleanOpen(raw);
 if(!Object.hasOwn(TOPIC_REQUESTS,key))return null;
 const [pinyin,translation,value]=TOPIC_REQUESTS[key];
 return {raw:String(raw),intent:'request-topic-change',value,pinyin,translation,toneVerified:false};
}


// A bounded, session-only record of answered hobby questions. Not a user profile.
// Keep no raw transcript, names, addresses, travel dates or inferred preferences.
// Facts expire together after 24 turns; resets and explicit corrections clear them.
const emptyHobbyMemory=()=>({hobby:null,weekend:null,plan:null,at:0});
function recentHobbyMemory(state){
 const m=state?.hobbyMemory;
 return m&&Number.isFinite(m.at)&&state.turn-m.at<=24?m:emptyHobbyMemory();
}
function interpretHobbyCorrection(raw,context){
 const key=cleanOpen(raw),m=/^我不喜欢(跑步|看书|听音乐|游泳)了$/u.exec(key);
 if(!m||context.hobbyMemory?.hobby!==m[1])return null;
 const py={跑步:'pǎobù',看书:'kàn shū',听音乐:'tīng yīnyuè',游泳:'yóuyǒng'}[m[1]];
 const ru={跑步:'бегать',看书:'читать книги',听音乐:'слушать музыку',游泳:'плавать'}[m[1]];
 return {raw:String(raw),intent:'correct-hobby-memory',value:m[1],pinyin:'Wǒ bù xǐhuan '+py+' le.',translation:'Я больше не люблю '+ru+'.',toneVerified:false};
}
function updateHobbyMemory(state,semantic){
 const current=recentHobbyMemory(state),at=state.turn+1;
 if(semantic?.intent==='correct-hobby-memory')return emptyHobbyMemory();
 if(semantic?.intent!=='answer-open-reviewed')return current;
 if(semantic.slot==='hobby')return {...emptyHobbyMemory(),hobby:semantic.value,at};
 if(semantic.slot==='hobby-weekend'&&current.hobby)return {...current,weekend:semantic.value,at};
 if(semantic.slot==='hobby-plan'&&current.hobby)return {...current,plan:semantic.value,at};
 return current;
}

// Separate, short-lived, reviewed session facts. No persistence.
const TOPIC_FACTS=['daily-breakfast','daily-sleep','work-busy','work-time','study-reason','family-siblings','family-size'];
function recentTopicMemory(state){
 const entries=state?.topicMemory||{};
 return Object.fromEntries(TOPIC_FACTS.filter(k=>entries[k]&&Number.isFinite(entries[k].at)&&state.turn-entries[k].at<=24).map(k=>[k,entries[k]]));
}
function updateTopicMemory(state,semantic){
 const m=recentTopicMemory(state);
 if(semantic?.intent==='answer-open-reviewed'&&TOPIC_FACTS.includes(semantic.slot))m[semantic.slot]={value:semantic.value,at:state.turn+1};
 return m;
}

function interpretTravelQuestion(raw,context){
 const key=cleanOpen(raw);
 const questions={
  '什么时候去中国':['Shénme shíhou qù Zhōngguó?','Когда ехать в Китай?'],
  '什么时候去':['Shénme shíhou qù?','Когда ехать?'],
  '你什么时候去中国':['Nǐ shénme shíhou qù Zhōngguó?','Когда ты поедешь в Китай?'],
  '你打算什么时候去中国':['Nǐ dǎsuàn shénme shíhou qù Zhōngguó?','Когда ты собираешься поехать в Китай?']
 };
 if(!Object.hasOwn(questions,key))return null;
 const [pinyin,translation]=questions[key];
 if(!key.startsWith('你')&&context.pendingQuestion?.slot==='travel-time'&&context.lastPandaTurn?.hanzi){
  return {raw:String(raw),intent:'request-meaning',reference:context.lastPandaTurn.hanzi,travelQuestion:true,pinyin,translation,toneVerified:false};
 }
 if(key==='什么时候去')return null;
 return {raw:String(raw),intent:'ask-panda-travel-time',pinyin,translation,toneVerified:false};
}

// A complete first-person transport plan is meaningful even in a fresh chat.
// Bare transport fragments still require a matching pending question.
function interpretIndependentTransport(raw){
 const m=/^我(打算|想|准备|要)坐(飞机|火车|高铁)(去中国)?$/u.exec(cleanOpen(raw));
 if(!m)return null;
 const verbs={打算:['dǎsuàn','планирую'],想:['xiǎng','хочу'],准备:['zhǔnbèi','собираюсь'],要:['yào','собираюсь']};
 const modes={飞机:['fēijī','лететь на самолёте'],火车:['huǒchē','поехать на поезде'],高铁:['gāotiě','поехать на скоростном поезде']};
 const [verbPy,verbRu]=verbs[m[1]],[modePy,modeRu]=modes[m[2]];
 return {raw:String(raw),intent:'express-transport-plan',topic:'travel',value:'坐'+m[2],pinyin:'Wǒ '+verbPy+' zuò '+modePy+(m[3]?' qù Zhōngguó':'')+'.',translation:'Я '+verbRu+' '+modeRu+(m[3]?' в Китай':'')+'.',toneVerified:false};
}
// Reviewed learning difficulty statements, with exact metadata.
function interpretStudyDifficulty(raw){
 const s=String(raw).trim();
 if(/[？?。；;，,]/u.test(s.replace(/。$/u,'')))return null;
 const m=/^(我觉得)?(中文|汉语|声调|发音|语法|汉字|听力|口语)(很|非常|有点|太)?难(了)?$/u.exec(cleanOpen(s));
 if(!m)return null;
 const [,subject,topic,degree='',particle]=m;
 const names={中文:['Zhōngwén','китайский язык'],汉语:['Hànyǔ','китайский язык'],声调:['shēngdiào','тоны'],发音:['fāyīn','произношение'],语法:['yǔfǎ','грамматика'],汉字:['Hànzì','иероглифы'],听力:['tīnglì','понимание на слух'],口语:['kǒuyǔ','разговорная речь']};
 const [py,ru]=names[topic],d={很:['hěn','очень'],非常:['fēicháng','очень'],有点:['yǒudiǎn','немного'],太:['tài','слишком'],'':['','']}[degree];
 const translated=(subject?'Мне кажется, что ':'')+ru+' — '+[d[1],'трудно'].filter(Boolean).join(' ')+'.';
 const opinion=interpretOpinion(raw);
 return {...opinion,raw:String(raw),intent:opinion?.intent==='express-opinion'?'express-opinion':'express-study-difficulty',studyDifficulty:true,topic:'study',value:topic,pinyin:reviewedSentence([subject?'wǒ juéde':'',py,d[0],'nán',particle?'le':'']),translation:translated.charAt(0).toUpperCase()+translated.slice(1),toneVerified:false};
}
// Reviewed repair expressions refer only to the actual preceding Panda line.
const CONVERSATION_REPAIR=Object.freeze({
 "我没听清":["Wǒ méi tīng qīng.","Я не расслышал(а).","request-repeat"],
 "我没听清楚":["Wǒ méi tīng qīngchu.","Я не расслышал(а).","request-repeat"],
 "可以再说一遍吗":["Kěyǐ zài shuō yí biàn ma?","Можно повторить?","request-repeat"],
 "能再说一遍吗":["Néng zài shuō yí biàn ma?","Можешь повторить?","request-repeat"],
 "你能再说一遍吗":["Nǐ néng zài shuō yí biàn ma?","Ты можешь повторить?","request-repeat"],
 "请你再说一遍":["Qǐng nǐ zài shuō yí biàn.","Повтори, пожалуйста.","request-repeat"],
 "再说一次":["Zài shuō yí cì.","Скажи ещё раз.","request-repeat"],
 "这是什么意思":["Zhè shì shénme yìsi?","Что это означает?","request-meaning"],
 "这句话是什么意思":["Zhè jù huà shì shénme yìsi?","Что означает эта фраза?","request-meaning"],
 "我不太明白":["Wǒ bú tài míngbai.","Я не совсем понимаю.","request-meaning"],
 "我不明白你的意思":["Wǒ bù míngbai nǐ de yìsi.","Я не понимаю, что ты имеешь в виду.","request-meaning"],
});
function interpretConversationRepair(raw,context){
 const key=cleanOpen(raw),prior=context.lastPandaTurn;
 if(!Object.hasOwn(CONVERSATION_REPAIR,key)||!prior?.hanzi||!prior.pinyin||!prior.ru)return null;
 const [pinyin,translation,intent]=CONVERSATION_REPAIR[key];
 return {raw:String(raw),intent,pinyin,translation,reviewedRepair:true,reference:prior.hanzi,needsClarification:false,toneVerified:false};
}
// Complete first-person goals are meaningful even without a pending question.
function interpretIndependentStudyGoal(raw){
 const s=String(raw).trim();
 if(/[？?。；;，,]/u.test(s.replace(/。$/u,'')))return null;
 const key=cleanOpen(s);
 if(!key.startsWith('我想'))return null;
 const practice=composeReviewedAnswer('study-practice',key);
 if(practice)return {raw:String(raw),intent:'express-study-goal',topic:'study',value:practice[2],pinyin:practice[0],translation:practice[1],toneVerified:false};
 if(key==='我想在中国工作')return {raw:String(raw),intent:'express-work-goal',topic:'work',value:'china-work',pinyin:'Wǒ xiǎng zài Zhōngguó gōngzuò.',translation:'Я хочу работать в Китае.',toneVerified:false};
 return null;
}
function dispatchSemantic(raw,context={},parsers){
 const source=String(raw??'').trim();
 if(!source)return null;
 const normalized=source.normalize('NFC').replace(/[\p{P}\s]/gu,'');
 if(!normalized||normalized.length>160)return null;
 return interpretTopicRequest(source)||interpretConversationRepair(source,context)||interpretHobbyCorrection(source,context)||interpretTravelQuestion(source,context)||interpretOpenAnswer(source,context)||interpretIndependentStudyGoal(source)||interpretIndependentTransport(source)||interpretStudyDifficulty(source)||parsers.contextual(source,context)||parsers.linked(source)||parsers.opinion(source)||parsers.action(source)||null;
}
export const interpretSemanticTurn=(raw,context={})=>dispatchSemantic(raw,context,{contextual:interpretContextualTurn,linked:interpretLinkedTurn,opinion:interpretOpinion,action:interpretAction});
export function initialSemanticState(){
 return {version:1,turn:0,lastSpeaker:null,lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:null,resumeQuestion:null,hobbyMemory:emptyHobbyMemory(),topicMemory:{}};
}
function advanceSemanticState(state,event,interpret){
 const current=state?.version===1?state:initialSemanticState();
 if(event?.type==='reset'||event?.type==='topic-change')return {state:initialSemanticState(),semantic:null};
 if(event?.type==='panda'){
  const line=event.line;
  if(typeof line?.hanzi!=='string'||!line.hanzi.trim())return {state:current,semantic:null};
  const understood=interpret(line.hanzi,{});
  const previous=current.lastSpeaker==='learner'?current.lastLearnerSemantic:null;
  // Re-open the exact previously displayed question only after an explicit repeat/meaning request.
  const resumed=previous&&['request-repeat','request-meaning'].includes(previous.intent)&&current.resumeQuestion?.hanzi===line.hanzi?current.resumeQuestion.pending:null;
  const reviewed=reviewedOpenQuestion(line.hanzi,previous,event.continuesLearnerTurn===true,recentHobbyMemory(current));
  // Legacy family and daily-routine chains own these follow-ups. The legacyFamily flag denotes a legacy-owned displayed line; explicitly shared questions keep their own slots.
  const pending=resumed||(event.legacyFamily&&['family-siblings','family-size','work-time','daily-sleep'].includes(reviewed?.slot)?null:reviewed)||(understood?.intent==='ask-yes-no'&&understood.subject==='你'?understood:null);
  // The caller must explicitly link Panda's reply to the immediately preceding learner action.
  // A topic label alone is not evidence that the utterance refers to that action.
  const linked=event.continuesLearnerTurn===true&&previous?.intent==='express-action'&&previous.subject==='我'&&(!pending||pending.action===previous.action)?previous:null;
  const lastPandaTurn={hanzi:line.hanzi,pinyin:typeof line.pinyin==='string'?line.pinyin:null,ru:typeof line.ru==='string'?line.ru:null};
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'panda',lastPandaTurn,pendingQuestion:pending,lastLearnerAction:linked,lastLearnerSemantic:null,resumeQuestion:null,hobbyMemory:recentHobbyMemory(current),topicMemory:recentTopicMemory(current)},semantic:understood};
 }
 if(event?.type==='learner'){
  const raw=String(event.raw??'').trim();
  if(!raw)return {state:current,semantic:null};
  // A pending question is consumed once; consecutive learner messages cannot reuse it.
  const context=current.lastSpeaker==='panda'?{lastPandaTurn:current.lastPandaTurn,pendingQuestion:current.pendingQuestion,lastLearnerAction:current.lastLearnerAction,hobbyMemory:recentHobbyMemory(current)}:{hobbyMemory:recentHobbyMemory(current)};
  const semantic=interpret(raw,context);
  const resumeQuestion=semantic&&['request-repeat','request-meaning'].includes(semantic.intent)&&semantic.reference===context.lastPandaTurn?.hanzi&&context.pendingQuestion?{hanzi:semantic.reference,pending:context.pendingQuestion}:null;
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'learner',lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:semantic,resumeQuestion,hobbyMemory:updateHobbyMemory(current,semantic),topicMemory:updateTopicMemory(current,semantic)},semantic};
 }
 return {state:current,semantic:null};
}
export const reduceSemanticContext=(state,event)=>advanceSemanticState(state,event,interpretSemanticTurn);
export function planReferenceReply(state,semantic){
 // Only repeat/explain the actual referenced Panda utterance, never synthesize audio.
 if(!semantic||!['request-repeat','request-meaning'].includes(semantic.intent)||semantic.needsClarification)return null;
 const line=state?.lastSpeaker==='panda'?state.lastPandaTurn:null;
 if(!line||line.hanzi!==semantic.reference||!line.pinyin||!line.ru)return null;
 return {kind:semantic.intent==='request-repeat'?'repeat-exact':'explain-exact',line:{hanzi:line.hanzi,pinyin:line.pinyin,ru:line.ru},lookupExactAudio:true,toneVerified:false};
}
