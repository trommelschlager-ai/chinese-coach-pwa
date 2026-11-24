// Panda AI v552. Reviewed Mandarin beginner statements and short contextual replies.
// All new replies are text-only until an exact, approved recorded MP3 is present.
// Typed or ASR-recognized words are NOT acoustic measurements of Mandarin tones.
const norm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');

const professions=Object.freeze({
  老师:['lǎoshī','учитель'],学生:['xuésheng','студент'],医生:['yīshēng','врач'],
  工程师:['gōngchéngshī','инженер'],护士:['hùshi','медсестра или медбрат'],
  老板:['lǎobǎn','руководитель'],经理:['jīnglǐ','менеджер'],
  司机:['sījī','водитель'],厨师:['chúshī','повар'],
  服务员:['fúwùyuán','официант'],警察:['jǐngchá','полицейский'],
  销售员:['xiāoshòuyuán','продавец'],工人:['gōngrén','рабочий'],
  翻译:['fānyì','переводчик'],演员:['yǎnyuán','актёр'],
  商人:['shāngrén','предприниматель'],程序员:['chéngxùyuán','программист'],
  设计师:['shèjìshī','дизайнер']
});
const workplaces=Object.freeze({
 学校:['xuéxiào','школе'],公司:['gōngsī','компании'],
 医院:['yīyuàn','больнице'],饭店:['fàndiàn','ресторане'],
 餐厅:['cāntīng','ресторане'],商店:['shāngdiàn','магазине'],
 工厂:['gōngchǎng','заводе'],办公室:['bàngōngshì','офисе'],
 银行:['yínháng','банке'],超市:['chāoshì','супермаркете'],
 家:['jiā','дома']
});
const hobbies={
 跑步:['pǎobù','бегать',['你经常跑步吗？','Nǐ jīngcháng pǎobù ma?','Ты часто бегаешь?']],
 游泳:['yóuyǒng','плавать',['你经常游泳吗？','Nǐ jīngcháng yóuyǒng ma?','Ты часто плаваешь?']],
 看书:['kàn shū','читать',['你喜欢看什么书？','Nǐ xǐhuan kàn shénme shū?','Какие книги ты любишь читать?']],
 听音乐:['tīng yīnyuè','слушать музыку',['你喜欢什么音乐？','Nǐ xǐhuan shénme yīnyuè?','Какая музыка тебе нравится?']],
 喝咖啡:['hē kāfēi','пить кофе',['你每天喝咖啡吗？','Nǐ měitiān hē kāfēi ma?','Ты каждый день пьёшь кофе?']]
};
const actions={
 看电影:['kàn diànyǐng','смотрю фильм',['你在看什么电影？','Nǐ zài kàn shénme diànyǐng?','Какой фильм ты смотришь?']],
 看书:['kàn shū','читаю книгу',['你在看什么书？','Nǐ zài kàn shénme shū?','Какую книгу ты читаешь?']],
 听音乐:['tīng yīnyuè','слушаю музыку',['你在听什么音乐？','Nǐ zài tīng shénme yīnyuè?','Какую музыку ты слушаешь?']],
 学习中文:['xuéxí Zhōngwén','изучаю китайский',['你学中文多久了？','Nǐ xué Zhōngwén duōjiǔ le?','Как давно ты изучаешь китайский?']],
 吃饭:['chīfàn','ем',['你在吃什么？','Nǐ zài chī shénme?','Что ты ешь?']],
 看电视:['kàn diànshì','смотрю телевизор',['你在看什么节目？','Nǐ zài kàn shénme jiémù?','Какую передачу ты смотришь?']],
 工作:['gōngzuò','работаю',['你今天忙吗？','Nǐ jīntiān máng ma?','Ты сегодня занят?']],
 休息:['xiūxi','отдыхаю',['你今天想做什么？','Nǐ jīntiān xiǎng zuò shénme?','Что ты хочешь сегодня делать?']]
};
const line=([hanzi,pinyin,ru])=>({hanzi,pinyin,ru});
const result=(raw,pinyin,translation,reply,next,topic=2)=>({
 kind:'statement',
 spoken:{known:true,hanzi:raw,pinyin,translation,topic,toneVerified:false},
 reply:line(reply),next,
 message:'Панда поняла смысл. Произношение и тоны голоса не оценивались.'
});
const workQuestion=['你在哪儿工作？','Nǐ zài nǎr gōngzuò?','Где ты работаешь?'];
const workLike=['你喜欢你的工作吗？','Nǐ xǐhuan nǐ de gōngzuò ma?','Тебе нравится твоя работа?'];
const foodItems={
 米饭:['mǐfàn','есть','рис','吃','chī'],
 面条:['miàntiáo','есть','лапшу','吃','chī'],
 鸡肉:['jīròu','есть','курицу','吃','chī'],
 牛肉:['niúròu','есть','говядину','吃','chī'],
 水果:['shuǐguǒ','есть','фрукты','吃','chī'],
 水:['shuǐ','пить','воду','喝','hē'],
 茶:['chá','пить','чай','喝','hē'],
 咖啡:['kāfēi','пить','кофе','喝','hē'],
 牛奶:['niúnǎi','пить','молоко','喝','hē'],
 果汁:['guǒzhī','пить','сок','喝','hē']
};
const foodIntents={
 想:['xiǎng','хочу'],
 不想:['bù xiǎng','не хочу'],
 爱:['ài','люблю'],
 不爱:['bú ài','не люблю']
};
const foodAlternatives={
 吃:['那你想吃什么？','Nà nǐ xiǎng chī shénme?','А что ты хочешь съесть?'],
 喝:['那你想喝什么？','Nà nǐ xiǎng hē shénme?','А что ты хочешь выпить?']
};
const foodFrequency={
 吃:['你经常吃吗？','Nǐ jīngcháng chī ma?','Ты часто это ешь?'],
 喝:['你经常喝吗？','Nǐ jīngcháng hē ma?','Ты часто это пьёшь?']
};

function respondToFood(raw,s,awaiting){
 const food=/^我(不想|想|不爱|爱)(吃|喝)([\p{Script=Han}]{1,2})$/u.exec(s);
 if(food){
  const [,intent,verb,item]=food;
  const entry=foodItems[item];
  if(!entry||verb!==entry[3])return null;
  const [itemPy,ruVerb,ruItem,,verbPy]=entry;
  const [intentPy,ruIntent]=foodIntents[intent];
  const negative=intent.startsWith('不');
  const response=result(raw,`Wǒ ${intentPy} ${verbPy} ${itemPy}.`,`Я ${ruIntent} ${ruVerb} ${ruItem}.`,
   negative?foodAlternatives[verb]:foodFrequency[verb],negative?null:'food-frequency',2);
  if(!negative)response.context={type:'food-frequency',verb};
  return response;
 }
 if(awaiting?.type!=='food-frequency')return null;
 const verb=awaiting.verb;
 const contextAnswer=new RegExp(`^(我)?(不)?经常(${verb})?$`,'u').exec(s);
 if(!contextAnswer)return null;
 const [,subject,negative,explicitVerb]=contextAnswer;
 const verbPy=verb==='吃'?'chī':'hē';
 const ruVerb=verb==='吃'?'ем':'пью';
 return result(raw,(subject?'Wǒ ':negative?'Bù ':'')+(subject&&negative?'bù ':'')+
  (subject||negative?'jīngcháng':'Jīngcháng')+(explicitVerb?' '+verbPy:'')+'.',
  `Я ${negative?'нечасто':'часто'} это ${ruVerb}.`,
  negative?foodAlternatives[verb]:['你还喜欢什么？','Nǐ hái xǐhuan shénme?','Что тебе ещё нравится?'],null,2);
}
const shoppingItems={
 衣服:['yīfu','одежду','件','jiàn'],衬衫:['chènshān','рубашку','件','jiàn'],
 裙子:['qúnzi','юбку','条','tiáo'],裤子:['kùzi','брюки','条','tiáo'],
 鞋:['xié','обувь','双','shuāng'],袜子:['wàzi','носки','双','shuāng'],
 书:['shū','книгу','本','běn'],手机:['shǒujī','телефон','部','bù']
};
const shoppingPrice=['你有多少预算？','Nǐ yǒu duōshao yùsuàn?','Какой у тебя бюджет?'];
const shoppingKinds={
 想:['xiǎng','хочу',shoppingPrice,'shopping-budget'],
 要:['yào','хочу',shoppingPrice,'shopping-budget'],
 打算:['dǎsuàn','собираюсь',shoppingPrice,'shopping-budget'],
 不想:['bù xiǎng','не хочу',['那你想买什么？','Nà nǐ xiǎng mǎi shénme?','А что ты хочешь купить?'],null],
 已经:['yǐjīng','уже', ['你花了多少钱？','Nǐ huā le duōshao qián?','Сколько ты потратил?'],'shopping-spent']
};
function respondToShopping(raw,s,awaiting){
 const purchase=/^我(想|要|打算|不想|已经)买(了)?(一[件条双本部])?([\p{Script=Han}]{1,2})$/u.exec(s);
 if(purchase){
  const [,kind,completed,quantity,item]=purchase;
  const entry=shoppingItems[item];
  if(!entry||Boolean(completed)!==(kind==='已经')||(quantity&&quantity!=='一'+entry[2]))return null;
  const [itemPy,itemRu,measure,measurePy]=entry;
  const [kindPy,kindRu,followUp,next]=shoppingKinds[kind];
  const measurePrefix=quantity?(measure==='部'||measure==='件'?'yí ':'yì ')+measurePy+' ':'';
  const ru=kind==='已经'?'Я уже купил / купила '+itemRu+'.':`Я ${kindRu} купить ${itemRu}.`;
  return result(raw,`Wǒ ${kindPy} mǎi ${completed?'le ':''}${measurePrefix}${itemPy}.`,ru,followUp,next,8);
 }
 if(awaiting!=='shopping-budget'&&awaiting!=='shopping-spent')return null;
 const budget=/^(一百|两百|三百|五百)(?:块|元)$/u.exec(s);
 if(!budget)return null;
 const numbers={一百:['yìbǎi',100],两百:['liǎngbǎi',200],三百:['sānbǎi',300],五百:['wǔbǎi',500]};
 const [py,value]=numbers[budget[1]];
 const unit=s.endsWith('块')?'kuài':'yuán';
 return result(raw,`${py[0].toUpperCase()+py.slice(1)} ${unit}.`,`${value} юаней.`,
  awaiting==='shopping-spent'?['你觉得贵吗？','Nǐ juéde guì ma?','Как думаешь, это дорого?']:
   ['你想去商店看看吗？','Nǐ xiǎng qù shāngdiàn kànkan ma?','Хочешь посмотреть в магазине?'],null,8);
}

const destinations={
 北京:['Běijīng','в Пекин','в Пекине'],上海:['Shànghǎi','в Шанхай','в Шанхае'],
 广州:['Guǎngzhōu','в Гуанчжоу','в Гуанчжоу'],深圳:['Shēnzhèn','в Шэньчжэнь','в Шэньчжэне'],
 成都:['Chéngdū','в Чэнду','в Чэнду'],杭州:['Hángzhōu','в Ханчжоу','в Ханчжоу'],
 西安:['Xī’ān','в Сиань','в Сиане'],南京:['Nánjīng','в Нанкин','в Нанкине']
};
const travelIntents={
 想去:['xiǎng qù','Я хочу поехать','travel-time'],
 打算去:['dǎsuàn qù','Я собираюсь поехать','travel-time'],
 明天去:['míngtiān qù','Завтра я еду','travel-transit'],
 去过:['qùguo','Я бывал / бывала','travel-past'],
 没去过:['méi qùguo','Я ещё не бывал / не бывала','travel-wish']
};
const travelQuestions={
 'travel-time':['你什么时候去？','Nǐ shénme shíhou qù?','Когда ты поедешь?'],
 'travel-transit':['你怎么去？','Nǐ zěnme qù?','Как ты туда поедешь?'],
 'travel-past':['你喜欢那里吗？','Nǐ xǐhuan nàli ma?','Тебе там понравилось?'],
 'travel-wish':['你想去那里吗？','Nǐ xiǎng qù nàli ma?','Хочешь туда поехать?']
};
function respondToTravel(raw,s,awaiting){
 const trip=/^我(想去|打算去|明天去|去过|没去过)([\p{Script=Han}]{2})$/u.exec(s);
 if(trip&&Object.hasOwn(destinations,trip[2])){
  const [py,to,at]=destinations[trip[2]];
  const [intentPy,ru,next]=travelIntents[trip[1]];
  return result(raw,`Wǒ ${intentPy} ${py}.`,`${ru} ${trip[1].endsWith('过')?at:to}.`,travelQuestions[next],next,7);
 }
 if(awaiting==='travel-transit'){
  const transport={坐飞机:['Zuò fēijī','На самолёте'],坐火车:['Zuò huǒchē','На поезде'],坐地铁:['Zuò dìtiě','На метро'],坐公共汽车:['Zuò gōnggòng qìchē','На автобусе']};
  if(Object.hasOwn(transport,s)){
   const [py,ru]=transport[s];
   return result(raw,py+'.',ru+'.',['祝你一路顺风！','Zhù nǐ yílù shùnfēng!','Счастливого пути!'],null,7);
  }
 }
 if(awaiting!=='travel-time')return null;
 const travelTime={明天:['Míngtiān','Завтра'],后天:['Hòutiān','Послезавтра'],下周:['Xià zhōu','На следующей неделе'],下个月:['Xià ge yuè','В следующем месяце']};
 if(!Object.hasOwn(travelTime,s))return null;
 const [py,ru]=travelTime[s];
 return result(raw,py+'.',ru+'.',travelQuestions['travel-transit'],'travel-transit',7);
}
const dayClock={
 五:['wǔ',5],六:['liù',6],七:['qī',7],八:['bā',8],九:['jiǔ',9],
 十:['shí',10],十一:['shíyī',11],十二:['shí’èr',12]
};
const dayRoutines={
 起床:['qǐchuáng','встаю',
  ['你起床以后做什么？','Nǐ qǐchuáng yǐhòu zuò shénme?','Что ты делаешь после подъёма?'],'day-after-wake'],
 吃早饭:['chī zǎofàn','завтракаю',
  ['你早饭吃什么？','Nǐ zǎofàn chī shénme?','Что ты ешь на завтрак?'],null],
 去上班:['qù shàngbān','иду на работу',
  ['你怎么去上班？','Nǐ zěnme qù shàngbān?','Как ты добираешься до работы?'],null],
 下班:['xiàbān','заканчиваю работу',
  ['你下班以后做什么？','Nǐ xiàbān yǐhòu zuò shénme?','Что ты делаешь после работы?'],null],
 睡觉:['shuìjiào','ложусь спать',
  ['你睡觉以前做什么？','Nǐ shuìjiào yǐqián zuò shénme?','Что ты делаешь перед сном?'],null]
};
const dayTime={早上:['zǎoshang','утра'],上午:['shàngwǔ','утра'],下午:['xiàwǔ','дня'],晚上:['wǎnshang','вечера']};
function respondToDay(raw,s,awaiting){
 const routine=/^我(每天)?(早上|上午|下午|晚上)?(十一|十二|[五六七八九十])点(半)?(起床|吃早饭|去上班|下班|睡觉)$/u.exec(s);
 if(routine){
  const [,daily,time,hour,half,action]=routine;
  const [hourPy,h]=dayClock[hour];
  const [timePy,timeRu]=time?dayTime[time]:['',''];
  const [actionPy,actionRu,followUp,next]=dayRoutines[action];
  const clock=half?h+':30':String(h);
  return result(raw,`Wǒ ${daily?'měitiān ':''}${timePy?timePy+' ':''}${hourPy} diǎn${half?' bàn':''} ${actionPy}.`,
   `Я ${daily?'каждый день ':''}${actionRu} в ${clock}${timeRu?' '+timeRu:''}.`,followUp,next,2);
 }
 if(awaiting!=='day-after-wake')return null;
 const wake=/^(我(?:先)?)?(刷牙|洗脸|喝水)$/u.exec(s);
 if(!wake)return null;
 const actions={刷牙:['shuāyá','чищу зубы'],洗脸:['xǐliǎn','умываюсь'],喝水:['hē shuǐ','пью воду']};
 const [py,ru]=actions[wake[2]];
 const subject=wake[1]==='我先'?'Wǒ xiān ':wake[1]?'Wǒ ':'';
 return result(raw,(subject?subject+py:py[0].toUpperCase()+py.slice(1))+'.',
  'Я '+(wake[1]==='我先'?'сначала ':'')+ru+'.',
  ['然后呢？','Ránhòu ne?','А потом?'],null,2);
}

const origins={
 俄罗斯:['Éluósī','России','русский / русская'],中国:['Zhōngguó','Китая','китаец / китаянка'],
 吉尔吉斯斯坦:['Jí’ěrjísīsītǎn','Кыргызстана','кыргыз / кыргызка'],
 法国:['Fǎguó','Франции','француз / француженка'],
 德国:['Déguó','Германии','немец / немка'],日本:['Rìběn','Японии','японец / японка']
};
const meetReplies={
 '很高兴认识你':['Hěn gāoxìng rènshi nǐ.','Рад / рада познакомиться.',
  ['我也很高兴认识你！','Wǒ yě hěn gāoxìng rènshi nǐ!','Я тоже рада познакомиться!']],
 '见到你很高兴':['Jiàndào nǐ hěn gāoxìng.','Очень приятно тебя видеть.',
  ['我也很高兴见到你！','Wǒ yě hěn gāoxìng jiàndào nǐ!','Я тоже рада тебя видеть!']],
 '可以认识一下吗':['Kěyǐ rènshi yíxià ma?','Можно познакомиться?',
  ['当然可以。你叫什么名字？','Dāngrán kěyǐ. Nǐ jiào shénme míngzi?','Конечно. Как тебя зовут?']],
 '我们认识一下吧':['Wǒmen rènshi yíxià ba.','Давай познакомимся.',
  ['好啊！你叫什么名字？','Hǎo a! Nǐ jiào shénme míngzi?','Давай! Как тебя зовут?']],
 '我先介绍一下自己':['Wǒ xiān jièshào yíxià zìjǐ.','Сначала я представлюсь.',
  ['好啊！你来自哪里？','Hǎo a! Nǐ láizì nǎlǐ?','Давай! Ты откуда?']],
 '请问你怎么称呼':['Qǐngwèn nǐ zěnme chēnghu?','Скажи, пожалуйста, как к тебе обращаться?',
  ['你可以叫我熊猫。','Nǐ kěyǐ jiào wǒ xióngmāo.','Можешь звать меня Пандой.']]
};
function respondToIntroduction(raw,s,awaiting){
 if(Object.hasOwn(meetReplies,s)){
  const [py,ru,followUp]=meetReplies[s];
  const response=result(raw,py,ru,followUp,s==='我先介绍一下自己'?'intro-origin':null,1);
  if(s.endsWith('吗')||s.startsWith('请问'))response.kind='question';
  return response;
 }
 const match=/^我(来自|从|是|的家乡是)([\p{Script=Han}]{2,6}?)(来|人)?$/u.exec(s);
 const shortOrigin=awaiting==='intro-origin'&&Object.hasOwn(origins,s);
 const place=shortOrigin?s:match?.[2];
 if(!Object.hasOwn(origins,place))return null;
 const [placePy,placeRu,nationality]=origins[place];
 const followUp=['你现在住在哪儿？','Nǐ xiànzài zhù zài nǎr?','Где ты сейчас живёшь?'];
 if(shortOrigin)return result(raw,placePy+'.','Я из '+placeRu+'.',followUp,null,1);
 const [,form,,suffix]=match;
 const opening={来自:'Wǒ láizì',从:'Wǒ cóng',是:'Wǒ shì',的家乡是:'Wǒ de jiāxiāng shì'};
 if(suffix!==({从:'来',是:'人'})[form])return null;
 const ending=suffix==='来'?' lái':suffix==='人'?' rén':'';
 const ru=form==='是'?'Я '+nationality:form==='的家乡是'?'Моя родина — '+({
  俄罗斯:'Россия',中国:'Китай',吉尔吉斯斯坦:'Кыргызстан',法国:'Франция',德国:'Германия',日本:'Япония'
 })[place]:'Я из '+placeRu;
 return result(raw,`${opening[form]} ${placePy}${ending}.`,ru+'.',followUp,null,1);
}
const freeTopics=[
 {
  type:'clarify',
  reply:['哪一句你没听懂？','Nǎ yí jù nǐ méi tīngdǒng?','Какую фразу ты не понял?'],
  phrases:[
   ['我没听懂','Wǒ méi tīngdǒng.','Я не понял / поняла на слух.'],
   ['我没有听懂','Wǒ méiyǒu tīngdǒng.','Я не понял / поняла на слух.'],
   ['我听不懂这句话','Wǒ tīngbudǒng zhè jù huà.','Я не понимаю эту фразу на слух.'],
   ['我不太明白','Wǒ bú tài míngbai.','Мне не совсем понятно.'],
   ['我没明白你的意思','Wǒ méi míngbai nǐ de yìsi.','Я не понял / поняла, что ты имеешь в виду.']
  ]
 },{
  type:'repeat',
  reply:['你想听哪一句？','Nǐ xiǎng tīng nǎ yí jù?','Какую фразу ты хочешь услышать?'],
  phrases:[
   ['能再说一遍吗','Néng zài shuō yí biàn ma?','Можешь повторить?'],
   ['你可以再说一遍吗','Nǐ kěyǐ zài shuō yí biàn ma?','Ты можешь сказать ещё раз?'],
   ['请再说一遍','Qǐng zài shuō yí biàn.','Повтори, пожалуйста.'],
   ['请重复一下','Qǐng chóngfù yíxià.','Пожалуйста, повтори.'],
   ['再说一次吧','Zài shuō yí cì ba.','Скажи ещё раз.']
  ]
 },{
  type:'pace',
  reply:['请用慢速按钮。你也可以看拼音。','Qǐng yòng mànsù ànniǔ. Nǐ yě kěyǐ kàn pīnyīn.','Нажми кнопку замедления. Можно также посмотреть пиньинь.'],
  phrases:[
   ['你说得太快了','Nǐ shuō de tài kuài le.','Ты говоришь слишком быстро.'],
   ['请说慢一点','Qǐng shuō màn yìdiǎn.','Говори помедленнее, пожалуйста.'],
   ['可以说慢一点吗','Kěyǐ shuō màn yìdiǎn ma?','Можешь говорить немного медленнее?'],
   ['麻烦你说慢一点','Máfan nǐ shuō màn yìdiǎn.','Пожалуйста, говори чуть медленнее.'],
   ['你能说得慢一点吗','Nǐ néng shuō de màn yìdiǎn ma?','Можешь говорить помедленнее?']
  ]
 },{
  type:'writing',
  reply:['请把那个词打出来。','Qǐng bǎ nàge cí dǎ chūlái.','Напечатай это слово, пожалуйста.'],
  phrases:[
   ['这个词怎么写','Zhège cí zěnme xiě?','Как пишется это слово?'],
   ['这个字怎么读','Zhège zì zěnme dú?','Как читается этот иероглиф?'],
   ['这个词是什么意思','Zhège cí shì shénme yìsi?','Что значит это слово?'],
   ['这个字我不认识','Zhège zì wǒ bú rènshi.','Я не знаю этот иероглиф.'],
   ['我不知道这个词怎么读','Wǒ bù zhīdào zhège cí zěnme dú.','Я не знаю, как читается это слово.']
  ]
 },{
  type:'thanks',
  reply:['不客气！还想练习吗？','Bú kèqi! Hái xiǎng liànxí ma?','Пожалуйста! Хочешь ещё попрактиковаться?'],
  phrases:[
   ['谢谢你的帮助','Xièxie nǐ de bāngzhù.','Спасибо за помощь.'],
   ['太谢谢你了','Tài xièxie nǐ le.','Большое тебе спасибо.'],
   ['谢谢你帮我','Xièxie nǐ bāng wǒ.','Спасибо, что помогаешь мне.'],
   ['非常感谢你','Fēicháng gǎnxiè nǐ.','Очень тебе благодарен / благодарна.'],
   ['多谢你的提醒','Duōxiè nǐ de tíxǐng.','Спасибо за напоминание.']
  ]
 },{
  type:'farewell',
  reply:['好，下次见！','Hǎo, xià cì jiàn!','Хорошо, до следующего раза!'],
  phrases:[
   ['我先走了','Wǒ xiān zǒu le.','Я пойду.'],
   ['我们下次再聊','Wǒmen xià cì zài liáo.','Поговорим в следующий раз.'],
   ['今天就聊到这里吧','Jīntiān jiù liáo dào zhèlǐ ba.','Давай на сегодня закончим.'],
   ['我得走了','Wǒ děi zǒu le.','Мне нужно идти.'],
   ['我一会儿再来','Wǒ yíhuìr zài lái.','Я вернусь чуть позже.']
  ]
 },{
  type:'wellbeing',
  reply:['辛苦了。你想休息一下吗？','Xīnkǔ le. Nǐ xiǎng xiūxi yíxià ma?','Тебе пришлось нелегко. Хочешь немного отдохнуть?'],
  phrases:[
   ['我有点儿累','Wǒ yǒudiǎnr lèi.','Я немного устал / устала.'],
   ['我今天很累','Wǒ jīntiān hěn lèi.','Я сегодня сильно устал / устала.'],
   ['今天过得不太好','Jīntiān guò de bú tài hǎo.','День прошёл не очень хорошо.'],
   ['我今天心情不好','Wǒ jīntiān xīnqíng bù hǎo.','У меня сегодня плохое настроение.'],
   ['我今天有点儿难过','Wǒ jīntiān yǒudiǎnr nánguò.','Мне сегодня немного грустно.']
  ]
 },{
  type:'practice',
  reply:['好啊！你想练什么？','Hǎo a! Nǐ xiǎng liàn shénme?','Давай! Что хочешь потренировать?'],
  phrases:[
   ['我想练习中文','Wǒ xiǎng liànxí Zhōngwén.','Я хочу попрактиковаться в китайском.'],
   ['我们继续练习吧','Wǒmen jìxù liànxí ba.','Давай продолжим практиковаться.'],
   ['我想多说一点中文','Wǒ xiǎng duō shuō yìdiǎn Zhōngwén.','Я хочу чуть больше говорить по-китайски.'],
   ['今天我想练口语','Jīntiān wǒ xiǎng liàn kǒuyǔ.','Сегодня я хочу потренировать разговорную речь.'],
   ['我想和你用中文聊天','Wǒ xiǎng hé nǐ yòng Zhōngwén liáotiān.','Я хочу поговорить с тобой по-китайски.']
  ]
 }
];
const freeByPhrase=new Map(freeTopics.flatMap(({type,reply,phrases})=>
 phrases.map(([hanzi,py,ru])=>[hanzi,{type,reply,py,ru}])));
function respondToFree(raw,s,awaiting,previous){
 const turn=freeByPhrase.get(s);
 if(!turn)return null;
 const canRepeat=turn.type==='repeat'&&previous?.hanzi&&previous?.pinyin&&previous?.ru;
 const followUp=canRepeat?[previous.hanzi,previous.pinyin,previous.ru]:turn.reply;
 return result(raw,turn.py,turn.ru,followUp,canRepeat?awaiting:null,1);
}
export function respondToNaturalStatement(raw,{awaiting=null,previous=null}={}){
 const s=norm(raw);if(!s)return null;
 const topicReply=respondToIntroduction(raw,s,awaiting)??respondToDay(raw,s,awaiting)??
  respondToFood(raw,s,awaiting)??respondToShopping(raw,s,awaiting)??respondToTravel(raw,s,awaiting)??
  respondToFree(raw,s,awaiting,previous);
 if(topicReply)return topicReply;

 // v552 Android screenshots (24 Nov): common compliments and conversational
 // reactions are complete, valid Chinese — never route them to the
 // "say it more simply" fallback. Exact phrases only, no guessed ASR tones.
 const socialTurns={
  '你很可爱':['Nǐ hěn kě\'ài.','Ты очень милая.',[
   '谢谢你！你喜欢熊猫吗？','Xièxie nǐ! Nǐ xǐhuan xióngmāo ma?','Спасибо! Ты любишь панд?']],
  '你真可爱':['Nǐ zhēn kě\'ài.','Ты такая милая.',[
   '谢谢你！你喜欢熊猫吗？','Xièxie nǐ! Nǐ xǐhuan xióngmāo ma?','Спасибо! Ты любишь панд?']],
  '你很漂亮':['Nǐ hěn piàoliang.','Ты очень красивая.',[
   '谢谢你！你喜欢这里的风景吗？','Xièxie nǐ! Nǐ xǐhuan zhèlǐ de fēngjǐng ma?','Спасибо! Тебе нравится здешний пейзаж?']],
  '你真漂亮':['Nǐ zhēn piàoliang.','Ты такая красивая.',[
   '谢谢你！你喜欢这里的风景吗？','Xièxie nǐ! Nǐ xǐhuan zhèlǐ de fēngjǐng ma?','Спасибо! Тебе нравится здешний пейзаж?']],
  '太好了':['Tài hǎo le!','Отлично!',[
   '太好了！我们继续聊吧！','Tài hǎo le! Wǒmen jìxù liáo ba!','Отлично! Давай продолжим разговор!']],
  '你很酷':['Nǐ hěn kù.','Ты очень крутая.',[
   '谢谢你！你喜欢我的耳机吗？','Xièxie nǐ! Nǐ xǐhuan wǒ de ěrjī ma?','Спасибо! Тебе нравятся мои наушники?']],
  '你真酷':['Nǐ zhēn kù.','Ты такая крутая.',[
   '谢谢你！你喜欢我的耳机吗？','Xièxie nǐ! Nǐ xǐhuan wǒ de ěrjī ma?','Спасибо! Тебе нравятся мои наушники?']],
  '你太厉害了':['Nǐ tài lìhai le.','Ты просто невероятная!',[
   '谢谢你！我们一起加油！','Xièxie nǐ! Wǒmen yìqǐ jiāyóu!','Спасибо! Давай стараться вместе!']],
  '你太棒了':['Nǐ tài bàng le.','Ты просто молодец!',[
   '谢谢你！我们一起加油！','Xièxie nǐ! Wǒmen yìqǐ jiāyóu!','Спасибо! Давай стараться вместе!']],
  '我不喜欢你':['Wǒ bù xǐhuan nǐ.','Ты мне не нравишься.',[
   '没关系。你想聊什么？','Méi guānxi. Nǐ xiǎng liáo shénme?','Ничего страшного. О чём хочешь поговорить?']]
 };
 if(Object.hasOwn(socialTurns,s)){
  const [py,ru,reply]=socialTurns[s];
  return result(raw,py,ru,reply,null,1);
 }
 const role=/^我(不)?是([\p{Script=Han}]{1,6})$/u.exec(s);
 if(role&&professions[role[2]]){
  const [py,ru]=professions[role[2]];
  if(role[1])return result(raw,'Wǒ bú shì '+py+'.','Я не '+ru+'.',
   ['明白了。你做什么工作？','Míngbai le. Nǐ zuò shénme gōngzuò?','Понятно. Кем ты работаешь?'],'job-role');
  if(role[2]==='学生')return result(raw,'Wǒ shì '+py+'.','Я '+ru+'.',
   ['你是学生！你学什么？','Nǐ shì xuésheng! Nǐ xué shénme?','Ты студент! Что ты изучаешь?'],'study');
  return result(raw,'Wǒ shì '+py+'.','Я '+ru+'.',
   ['你是'+role[2]+'！你在哪儿工作？','Nǐ shì '+py+'! '+workQuestion[1],'Ты '+ru+'! '+workQuestion[2]],'work-place');
 }
 const job=/^我在([\p{Script=Han}]{1,8})工作$/u.exec(s);
 if(job&&workplaces[job[1]]){
  const [py,ru]=workplaces[job[1]];
  return result(raw,'Wǒ zài '+py+' gōngzuò.',(job[1]==='家'?'Я работаю дома.':'Я работаю в '+ru+'.'),workLike,'job-liking');
 }
 if(s==='我不工作'||s==='我没有工作'||s==='我现在没有工作'||s==='我退休了'||s==='我在找工作'){
  const situations={
   我不工作:['Wǒ bù gōngzuò.','Я не работаю.'],
   我没有工作:['Wǒ méiyǒu gōngzuò.','У меня нет работы.'],
   我现在没有工作:['Wǒ xiànzài méiyǒu gōngzuò.','Сейчас я не работаю.'],
   我退休了:['Wǒ tuìxiū le.','Я на пенсии.'],
   我在找工作:['Wǒ zài zhǎo gōngzuò.','Я ищу работу.']
  };
  const next=s==='我退休了'?
   ['你退休后喜欢做什么？','Nǐ tuìxiū hòu xǐhuan zuò shénme?','Что ты любишь делать на пенсии?']:
   s==='我不工作'?
   ['你现在喜欢做什么？','Nǐ xiànzài xǐhuan zuò shénme?','Чем ты сейчас любишь заниматься?']:
   ['你想做什么工作？','Nǐ xiǎng zuò shénme gōngzuò?','Какую работу ты хотел бы найти?'];
  return result(raw,situations[s][0],situations[s][1],next,'job-role');
 }
 const interest=/^我(很)?(不)?喜欢([\p{Script=Han}]{2,6})$/u.exec(s);
 if(interest&&hobbies[interest[3]]){
  const [py,ru,followup]=hobbies[interest[3]];
  const p='Wǒ '+(interest[1]?'hěn ':'')+(interest[2]?'bù ':'')+'xǐhuan '+py+'.';
  if(interest[2])return result(raw,p,'Я не люблю '+ru+'.',
   ['你喜欢做什么？','Nǐ xǐhuan zuò shénme?','Чем ты любишь заниматься?'],'hobby');
  return result(raw,p,'Я '+(interest[1]?'очень ':'')+'люблю '+ru+'.',followup,'hobby');
 }
 const action=/^我在([\p{Script=Han}]{2,6})$/u.exec(s);
 if(action&&actions[action[1]]){
  const [py,ru,followup]=actions[action[1]];
  return result(raw,'Wǒ zài '+py+'.','Я '+ru+'.',followup,'daily-action');
 }
 if(s==='很无聊'||s==='我很无聊'){
  return result(raw,(s==='我很无聊'?'Wǒ hěn wúliáo.':'Hěn wúliáo.'),
   'Мне очень скучно.',['我们聊聊天吧！你喜欢看电影吗？','Wǒmen liáo liáotiān ba! Nǐ xǐhuan kàn diànyǐng ma?','Давай поболтаем! Ты любишь смотреть фильмы?'],'hobby');
 }
 if(s==='你知道吗'){
  return result(raw,'Nǐ zhīdào ma?','Ты знаешь?',
   ['你想告诉我什么？','Nǐ xiǎng gàosu wǒ shénme?','Что ты хочешь мне рассказать?'],'listening');
 }
 if(s==='我不知道'){
  return result(raw,'Wǒ bù zhīdào.','Я не знаю.',
   ['没关系。你想聊什么？','Méi guānxi. Nǐ xiǎng liáo shénme?','Ничего страшного. О чём хочешь поговорить?'],'conversation');
 }
 const workLiking={
  是的:'Shì de.',对:'Duì.',喜欢:'Xǐhuan.',我喜欢:'Wǒ xǐhuan.',我喜欢我的工作:'Wǒ xǐhuan wǒ de gōngzuò.'
 };
 const workDisliking={
  不喜欢:'Bù xǐhuan.',我不喜欢:'Wǒ bù xǐhuan.',不是:'Bú shì.',我不喜欢我的工作:'Wǒ bù xǐhuan wǒ de gōngzuò.'
 };
 const workBusy={忙:'Máng.',很忙:'Hěn máng.',我很忙:'Wǒ hěn máng.',工作很忙:'Gōngzuò hěn máng.',我的工作很忙:'Wǒ de gōngzuò hěn máng.'};
 const workQuiet={不忙:'Bù máng.',我不忙:'Wǒ bù máng.',工作不忙:'Gōngzuò bù máng.'};
 if((awaiting==='job-liking'||s==='我喜欢我的工作')&&Object.hasOwn(workLiking,s))
  return result(raw,workLiking[s],'Да, работа нравится.',
   ['太好了！你工作忙吗？','Tài hǎo le! Nǐ gōngzuò máng ma?','Здорово! У тебя много работы?'],'work-busy');
 if((awaiting==='job-liking'||s==='我不喜欢我的工作')&&Object.hasOwn(workDisliking,s))
  return result(raw,workDisliking[s],'Нет, работа не нравится.',
   ['明白了。你想换工作吗？','Míngbai le. Nǐ xiǎng huàn gōngzuò ma?','Понимаю. Ты хочешь сменить работу?'],'job-change');
 if((awaiting==='work-busy'||s.includes('工作'))&&Object.hasOwn(workBusy,s))
  return result(raw,workBusy[s],'На работе много дел.',
   ['辛苦了！你每天几点下班？','Xīnkǔ le! Nǐ měitiān jǐ diǎn xiàbān?','Нелегко! Во сколько ты обычно заканчиваешь работу?'],'after-work');
 if((awaiting==='work-busy'||s==='工作不忙')&&Object.hasOwn(workQuiet,s))
  return result(raw,workQuiet[s],'На работе немного дел.',
   ['那很好！你下班后喜欢做什么？','Nà hěn hǎo! Nǐ xiàbān hòu xǐhuan zuò shénme?','Хорошо! Чем ты любишь заниматься после работы?'],'after-work');
 if(awaiting==='job-change'&&/^(?:我)?想(?:换工作)?$/u.test(s))
  return result(raw,(s.startsWith('我')?'Wǒ xiǎng':'Xiǎng')+(s.endsWith('换工作')?' huàn gōngzuò.':'.'),'Я хочу сменить работу.',
   ['你想做什么工作？','Nǐ xiǎng zuò shénme gōngzuò?','Какую работу ты хотел бы найти?'],'job-role');
 if(awaiting==='job-change'&&/^(?:我)?不想(?:换工作)?$/u.test(s))
  return result(raw,(s.startsWith('我')?'Wǒ bù xiǎng':'Bù xiǎng')+(s.endsWith('换工作')?' huàn gōngzuò.':'.'),'Я не хочу менять работу.',
   ['明白了。你下班后喜欢做什么？','Míngbai le. Nǐ xiàbān hòu xǐhuan zuò shénme?','Понятно. Чем ты любишь заниматься после работы?'],'after-work');

 // v552: small, reviewed family conversation expansion. Keep Chinese tones
 // in pinyin only; ASR text is not evidence of spoken tone accuracy.
 const relatives={
  哥哥:['gēge','старший брат','старшего брата','старшему брату','他','Моему','один'],
  姐姐:['jiějie','старшая сестра','старшей сестры','старшей сестре','她','Моей','одна'],
  弟弟:['dìdi','младший брат','младшего брата','младшему брату','他','Моему','один'],
  妹妹:['mèimei','младшая сестра','младшей сестры','младшей сестре','她','Моей','одна']
 };
 const relativesWithParents={
  ...relatives,
  爸爸:['bàba',null,null,'папе','他','Моему'],
  妈妈:['māma',null,null,'маме','她','Моей'],
  爷爷:['yéye',null,null,'дедушке','他','Моему'],
  奶奶:['nǎinai',null,null,'бабушке','她','Моей']
 };
 const ageDigits='一二三四五六七八九';
 const digitPinyin=['','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
 const agePattern='([一二三四五六七八九]?十[一二三四五六七八九]?|[一二三四五六七八九]|[1-9][0-9]?)';
 const ageMatch=new RegExp(`^我(的)?(哥哥|姐姐|弟弟|妹妹|爸爸|妈妈|爷爷|奶奶)${agePattern}岁$`,'u').exec(s);
 const shortAge=awaiting?.type==='family-age'
  ?new RegExp(`^(?:他|她)?${agePattern}岁$`,'u').exec(s):null;
 if(shortAge&&((s.startsWith('他')&&relativesWithParents[awaiting.relation][4]==='她')||
  (s.startsWith('她')&&relativesWithParents[awaiting.relation][4]==='他')))return null;
 if(ageMatch||shortAge){
  const relation=ageMatch?.[2]??awaiting.relation;
  const [py,,,dat,person,poss]=relativesWithParents[relation];
  const ageText=ageMatch?.[3]??shortAge[1];
  const [before,after]=ageText.split('十');
  const digit=ch=>ch?ageDigits.indexOf(ch)+1:0;
  const num=/^[0-9]+$/.test(ageText)?Number(ageText):
   after===undefined?digit(before):(before?digit(before):1)*10+digit(after);
  const tens=Math.floor(num/10),ones=num%10;
  const numPy=tens?[tens>1?digitPinyin[tens]:'','shí',ones===2?'’èr':digitPinyin[ones]].filter(Boolean).join(''):
   num===1?'yí':digitPinyin[ones];
  const ageHanzi=tens?(tens>1?ageDigits[tens-1]:'')+'十'+(ones?ageDigits[ones-1]:''):ageDigits[ones-1];
  const years=num%100>=11&&num%100<=14?'лет':ones===1?'год':ones>=2&&ones<=4?'года':'лет';
  const subject=ageMatch?'Wǒ '+(ageMatch[1]?'de ':'')+py+' ':
   /^[他她]/u.test(s)?'Tā ':'';
  return result(raw,subject+numPy+' suì.',
   poss+' '+dat+' '+num+' '+years+'.',
   ['你'+relation+ageHanzi+'岁！'+person+'喜欢做什么？',
    'Nǐ '+py+' '+numPy+' suì! Tā xǐhuan zuò shénme?',
    (person==='她'?'Твоей ':'Твоему ')+dat+' '+num+' '+years+'! Что '+(person==='她'?'она':'он')+' любит делать?'],
   'family-hobby',6);
 }

 const familySize=/^我家(?:里)?有([一两二三四五六七八九十])口人$/u.exec(s);
 const shortSize=awaiting==='family-size'?/^([一两二三四五六七八九十])口人$/u.exec(s):null;
 if(familySize||shortSize){
  const count=(familySize??shortSize)[1];
  const num=count==='两'?2:count==='十'?10:ageDigits.indexOf(count)+1;
  const py=count==='两'?'liǎng':num===1?'yì':num===10?'shí':digitPinyin[num];
  return result(raw,(familySize?(s.startsWith('我家里')?'Wǒ jiālǐ yǒu ':'Wǒ jiā yǒu '):'')+py+' kǒu rén.',
   'В моей семье '+num+' '+(num>=2&&num<=4?'человека':'человек')+'.',
   ['你跟家人一起住吗？','Nǐ gēn jiārén yìqǐ zhù ma?','Ты живёшь вместе с семьёй?'],null,6);
 }

 // Extended family counts; existing single-relative replies retain their audio.
 const counted=/^我有(两|二|三|四|五|六|七|八|九|十)个(哥哥|姐姐|弟弟|妹妹|孩子)$/u.exec(s);
 if(counted){
  const nums={两:['liǎng',2],二:['èr',2],三:['sān',3],四:['sì',4],五:['wǔ',5],六:['liù',6],七:['qī',7],八:['bā',8],九:['jiǔ',9],十:['shí',10]};
  const [np,n]=nums[counted[1]];
  const rel=counted[2], py=rel==='孩子'?'háizi':relatives[rel][0];
  const plural={哥哥:['старших брата','старших братьев'],姐姐:['старшие сестры','старших сестёр'],弟弟:['младших брата','младших братьев'],妹妹:['младшие сестры','младших сестёр'],孩子:['ребёнка','детей']};
  const female=rel==='姐姐'||rel==='妹妹';
  return result(raw,'Wǒ yǒu '+np+' ge '+py+'.','У меня '+n+' '+plural[rel][n<=4?0:1]+'.',
   [(female?'她们':'他们')+'多大了？','Tāmen duō dà le?','Сколько им лет?'],'family-ages',6);
 }
 const familyExtra={
  '我没有孩子':['Wǒ méiyǒu háizi.','У меня нет детей.','你家有几口人？','Nǐ jiā yǒu jǐ kǒu rén?','Сколько человек в твоей семье?'],
  '我有孩子':['Wǒ yǒu háizi.','У меня есть дети.','你有几个孩子？','Nǐ yǒu jǐ ge háizi?','Сколько у тебя детей?'],
  '我结婚了':['Wǒ jiéhūn le.','Я в браке.','你们结婚多久了？','Nǐmen jiéhūn duōjiǔ le?','Как давно вы в браке?'],
  '我离婚了':['Wǒ líhūn le.','Я развёлся / развелась.','明白了。你想聊什么？','Míngbai le. Nǐ xiǎng liáo shénme?','Понятно. О чём хочешь поговорить?'],
  '我一个人住':['Wǒ yí ge rén zhù.','Я живу один / одна.','你住在哪里？','Nǐ zhù zài nǎlǐ?','Где ты живёшь?'],
  '我跟家人一起住':['Wǒ gēn jiārén yìqǐ zhù.','Я живу вместе с семьёй.','你们周末喜欢做什么？','Nǐmen zhōumò xǐhuan zuò shénme?','Что вы любите делать по выходным?']
 };
 if(Object.hasOwn(familyExtra,s)){
  const [py,ru,...follow]=familyExtra[s];
  return result(raw,py,ru,follow,s==='我没有孩子'?'family-size':null,6);
 }

 const familyQuestion=/^你有没有(哥哥|姐姐|弟弟|妹妹)$/u.exec(s);
 if(familyQuestion){
  const relation=familyQuestion[1],py=relatives[relation][0];
  const confirmations={
   哥哥:['我有一个哥哥。','Wǒ yǒu yí ge gēge.','Да, у меня есть старший брат.'],
   姐姐:['我没有姐姐。','Wǒ méiyǒu jiějie.','Нет, у меня нет старшей сестры.'],
   弟弟:['我没有弟弟。','Wǒ méiyǒu dìdi.','Нет, у меня нет младшего брата.'],
   妹妹:['我有一个妹妹。','Wǒ yǒu yí ge mèimei.','Да, у меня есть младшая сестра.']
  };
  const response=result(raw,'Nǐ yǒu méiyǒu '+py+'?',
   'У тебя есть '+relatives[relation][1]+'?',confirmations[relation],null,6);
  response.kind='question';
  response.message='Панда понимает 你有没有…？. Ранее работающие вопросы 你有…吗？ сохраняют исходную логику. Тоны по тексту не оценивались.';
  return response;
 }
 const familyHave=/^我(有一个|有|没有)(哥哥|姐姐|弟弟|妹妹)$/u.exec(s);
 if(familyHave){
  const [py,nom,gen,dat,person,,oneWord]=relatives[familyHave[2]];
  const no=familyHave[1]==='没有';
  const one=familyHave[1]==='有一个';
  const response=result(raw,no?'Wǒ méiyǒu '+py+'.':'Wǒ yǒu '+(one?'yí ge ':'')+py+'.',
   no?'У меня нет '+gen+'.':'У меня есть '+(one?oneWord+' ':'')+nom+'.',
   no?['明白了。你家有几口人？','Míngbai le. Nǐ jiā yǒu jǐ kǒu rén?','Понятно. Сколько человек в твоей семье?']:
   ['你'+familyHave[2]+'几岁？','Nǐ '+py+' jǐ suì?', 'Сколько лет '+(person==='她'?'твоей ':'твоему ')+dat+'?'],
   no?'family-size':'family-age',6);
  if(!no)response.context={type:'family-age',relation:familyHave[2]};
  return response;
 }
 // "你有没有" alone is unfinished. Clarify; never guess the missing object.
 if(s==='你有没有'){
  const clarification=result(raw,null,'Незаконченный вопрос «У тебя есть…?»',
   ['你想问什么？','Nǐ xiǎng wèn shénme?','Что ты хочешь спросить?'],'clarify',6);
  clarification.message='Вопрос не закончен. Например: 你有没有哥哥？ — Nǐ yǒu méiyǒu gēge? Тоны по тексту не проверяются.';
  return clarification;
 }
 // Unknown Chinese names: never invent pronunciation or acoustic tone evidence.
 const name=/^我叫([\p{Script=Han}]{1,6})$/u.exec(s);
 if(name)return result(raw,null,'Меня зовут '+name[1]+'.',
  ['很高兴认识你！你是老师还是学生？','Hěn gāoxìng rènshi nǐ! Nǐ shì lǎoshī háishi xuésheng?','Рад познакомиться! Ты учитель или студент?'],'job-role');
 return null;
}
