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
// v556: contextual work interview. Do not invent a physical job or schedule for Panda.
function workConversation(raw,s,awaiting){
 const r=(py,ru,a,next=null,kind='statement')=>({...result(raw,py,ru,a,next),kind,domain:'work'});
 const teacher=['我是老师。','Wǒ shì lǎoshī.','Я учитель.'];
 const roleAsk=['明白了。你做什么工作？','Míngbai le. Nǐ zuò shénme gōngzuò?','Понятно. Кем ты работаешь?'];
 const hobby=['你下班后喜欢做什么？','Nǐ xiàbān hòu xǐhuan zuò shénme?','Что любишь делать после работы?'];
 const newJob=['你想做什么工作？','Nǐ xiǎng zuò shénme gōngzuò?','Кем хочешь работать?'];
 const workplaceAnswer=['我在这里陪你练习中文。','Wǒ zài zhèlǐ péi nǐ liànxí Zhōngwén.','Я здесь помогаю тебе практиковать китайский.'];
 const q={
 '你做什么工作':['Nǐ zuò shénme gōngzuò?','Кем ты работаешь?',teacher],
 '你的工作是什么':['Nǐ de gōngzuò shì shénme?','Какая у тебя работа?',teacher],
 '你在哪儿工作':['Nǐ zài nǎr gōngzuò?','Где ты работаешь?',workplaceAnswer],
 '你在哪工作':['Nǐ zài nǎ gōngzuò?','Где ты работаешь?',workplaceAnswer],
 '你在哪里工作':['Nǐ zài nǎlǐ gōngzuò?','Где ты работаешь?',workplaceAnswer],
 '你喜欢你的工作吗':['Nǐ xǐhuan nǐ de gōngzuò ma?','Тебе нравится твоя работа?',['我喜欢帮你学中文。','Wǒ xǐhuan bāng nǐ xué Zhōngwén.','Мне нравится помогать тебе учить китайский.']],
 '你工作忙吗':['Nǐ gōngzuò máng ma?','У тебя много работы?',['我现在有空，可以陪你练习。','Wǒ xiànzài yǒu kòng, kěyǐ péi nǐ liànxí.','Сейчас я могу заниматься с тобой.']],
 '你每天几点下班':['Nǐ měitiān jǐ diǎn xiàbān?','Во сколько ты заканчиваешь работу?',['我没有固定的下班时间。','Wǒ méiyǒu gùdìng de xiàbān shíjiān.','У меня нет фиксированного времени окончания работы.']],
 '你工作多久了':['Nǐ gōngzuò duōjiǔ le?','Как давно ты работаешь?',['我是虚拟中文老师，没有实际的工作年限。','Wǒ shì xūnǐ Zhōngwén lǎoshī, méiyǒu shíjì de gōngzuò niánxiàn.','Я виртуальный преподаватель китайского; реального трудового стажа у меня нет.']]
 };
 if(Object.hasOwn(q,s)){const [py,ru,a]=q[s];return r(py,ru,a,null,'question')}
 // Android ASR can confuse 那 (nà, there) with 哪 (nǎ, where).
 // Preserve the recognized words; explain uncertainty without grading tones.
 // The response reuses the existing exact approved Panda AI voice.
 if(s==='你在那工作'){
  const recognized=r('Nǐ zài nà gōngzuò.','Ты работаешь там. (Так распознал браузер.)',workplaceAnswer,null,'question');
  recognized.message='Chrome распознал 那 (nà — там). Если хотел спросить «Где ты работаешь?», нужно 哪 (nǎ): 你在哪儿工作？ Если сказал другую фразу, повтори через микрофон. Тоны по тексту не проверяются.';
  return recognized;
 }
 // v561: Android ASR often drops 吗 and punctuation from 你是医生？.
 // This asks about Panda, NOT the learner's separate 我是医生 statement.
 const roleQ=/^你(?:是不是([\p{Script=Han}]{1,6})|是([\p{Script=Han}]{1,6}?)(?:吗)?)$/u.exec(s);
 if(roleQ&&Object.hasOwn(professions,roleQ[1]||roleQ[2])){
  const job=roleQ[1]||roleQ[2],[py,ru]=professions[job];
  // Exact approved recordings are already in Panda's voice catalog: v3/p03 and v365/p085.
  const teacherYes=['我是老师。','Wǒ shì lǎoshī.','Я учитель.'];
  const teacherNo=['不是，我是老师。','Bú shì, wǒ shì lǎoshī.','Нет, я учитель.'];
  const questionPinyin=roleQ[1]?'shì bú shì '+py+'?':'shì '+py+(s.endsWith('吗')?' ma?':'?');
  return r('Nǐ '+questionPinyin,'Ты '+ru+'?',job==='老师'?teacherYes:teacherNo,null,'question');
 }
 const roleReply=job=>job==='学生'?['你是学生！你学什么？','Nǐ shì xuésheng! Nǐ xué shénme?','Ты студент! Что изучаешь?']:['你是'+job+'！你在哪儿工作？','Nǐ shì '+professions[job][0]+'! '+workQuestion[1],'Ты '+professions[job][1]+'! '+workQuestion[2]];
 const extra=/^我(也是|是一个|以前是|想当|想做)([\p{Script=Han}]{1,6})$/u.exec(s);
 if(extra&&Object.hasOwn(professions,extra[2])){
  const [py,ru]=professions[extra[2]],k=extra[1];
  if(k==='以前是')return r('Wǒ yǐqián shì '+py+'.','Раньше я работал(а) по профессии: '+ru+'.',roleAsk,'job-role');
  if(k==='想当'||k==='想做')return r('Wǒ xiǎng '+(k==='想当'?'dāng ':'zuò ')+py+'.','Хочу работать по профессии: '+ru+'.',['你为什么想做这个工作？','Nǐ wèishénme xiǎng zuò zhège gōngzuò?','Почему хочешь заниматься этой работой?'],'job-reason');
  return r('Wǒ '+(k==='也是'?'yě shì ':'shì yí ge ')+py+'.','Я '+(k==='也是'?'тоже ':'')+ru+'.',roleReply(extra[2]),extra[2]==='学生'?'study':'work-place');
 }
 if(awaiting==='job-role'&&Object.hasOwn(professions,s))return r(professions[s][0],'Я '+professions[s][1]+'.',roleReply(s),s==='学生'?'study':'work-place');
 if(awaiting==='work-place'){
  const place=/^(我)?(在)?([\p{Script=Han}]{1,8}?)(工作)?$/u.exec(s);
  if(place&&Object.hasOwn(workplaces,place[3])&&(!place[1]||place[2])&&(!place[4]||place[2])){
   const [py,ru]=workplaces[place[3]];const p=(place[1]?'wǒ ':'')+(place[2]?'zài ':'')+py+(place[4]?' gōngzuò':'');
   return r(p[0].toUpperCase()+p.slice(1)+'.',place[3]==='家'?'Работаю дома.':'Работаю в '+ru+'.',workLike,'job-liking');
  }
 }
 if(s==='我今天不工作')return r('Wǒ jīntiān bù gōngzuò.','Сегодня я не работаю.',['那你今天想做什么？','Nà nǐ jīntiān xiǎng zuò shénme?','Тогда что хочешь сегодня делать?'],'plans');
 const contextual={
 'job-liking':[
  [{'是的':'Shì de.','对':'Duì.','喜欢':'Xǐhuan.','我喜欢':'Wǒ xǐhuan.','很喜欢':'Hěn xǐhuan.','我很喜欢':'Wǒ hěn xǐhuan.','我喜欢我的工作':'Wǒ xǐhuan wǒ de gōngzuò.','我很喜欢我的工作':'Wǒ hěn xǐhuan wǒ de gōngzuò.'},'Да, работа нравится.',['太好了！你工作忙吗？','Tài hǎo le! Nǐ gōngzuò máng ma?','Здорово! У тебя много работы?'],'work-busy'],
  [{'不喜欢':'Bù xǐhuan.','我不喜欢':'Wǒ bù xǐhuan.','不是':'Bú shì.','我不喜欢我的工作':'Wǒ bù xǐhuan wǒ de gōngzuò.','不太喜欢':'Bú tài xǐhuan.','我不太喜欢':'Wǒ bú tài xǐhuan.'},'Работа не нравится.',['明白了。你想换工作吗？','Míngbai le. Nǐ xiǎng huàn gōngzuò ma?','Понимаю. Хочешь сменить работу?'],'job-change']],
 'work-busy':[
  [{'忙':'Máng.','很忙':'Hěn máng.','我很忙':'Wǒ hěn máng.','工作很忙':'Gōngzuò hěn máng.','我的工作很忙':'Wǒ de gōngzuò hěn máng.'},'На работе много дел.',['辛苦了！你每天几点下班？','Xīnkǔ le! Nǐ měitiān jǐ diǎn xiàbān?','Нелегко! Во сколько заканчиваешь работу?'],'after-work'],
  [{'不忙':'Bù máng.','我不忙':'Wǒ bù máng.','工作不忙':'Gōngzuò bù máng.'},'На работе не очень занят(а).',['那很好！'+hobby[0],'Nà hěn hǎo! '+hobby[1],'Хорошо! '+hobby[2]],'after-work-hobby']],
 'job-change':[
  [{'想':'Xiǎng.','我想':'Wǒ xiǎng.','我想换工作':'Wǒ xiǎng huàn gōngzuò.'},'Хочу сменить работу.',newJob,'job-role'],
  [{'不想':'Bù xiǎng.','我不想':'Wǒ bù xiǎng.','我不想换工作':'Wǒ bù xiǎng huàn gōngzuò.'},'Не хочу менять работу.',['明白了。你工作忙吗？','Míngbai le. Nǐ gōngzuò máng ma?','Понимаю. На работе много дел?'],'work-busy']]
 };
 for(const [map,ru,a,next] of contextual[awaiting]||[])if(Object.hasOwn(map,s))return r(map[s],s.includes('不太喜欢')?'Работа не очень нравится.':ru,a,next);
 const clock=/^(我)?(每天)?(早上|上午|下午|晚上)?(一|二|两|三|四|五|六|七|八|九|十|十一|十二)点(半)?(下班)?$/u.exec(s);
 if(clock&&(awaiting==='after-work'||clock[6])){
  const nums={一:['yī',1],二:['èr',2],两:['liǎng',2],三:['sān',3],四:['sì',4],五:['wǔ',5],六:['liù',6],七:['qī',7],八:['bā',8],九:['jiǔ',9],十:['shí',10],十一:['shíyī',11],十二:["shí'èr",12]};
  const periods={早上:['zǎoshang','утра'],上午:['shàngwǔ','утра'],下午:['xiàwǔ','дня'],晚上:['wǎnshang','вечера']};
  const [py,num]=nums[clock[4]],period=periods[clock[3]]||[];
  const p=[clock[1]?'wǒ':'',clock[2]?'měitiān':'',period[0]||'',py,'diǎn',clock[5]?'bàn':'',clock[6]?'xiàbān':''].filter(Boolean).join(' ');
  return r(p[0].toUpperCase()+p.slice(1)+'.','Заканчиваю работу в '+num+':'+(clock[5]?'30':'00')+(period[1]?' '+period[1]:'')+'.',hobby,'after-work-hobby');
 }
 return null;
}
// v556: introductions and personal facts. Short fragments require the matching question.
// The character has no real human age or nationality; do not invent a citizenship.
const introCountries={俄罗斯:['Éluósī','Россия','русский/русская','России'],中国:['Zhōngguó','Китай','китаец/китаянка','Китае'],德国:['Déguó','Германия','немец/немка','Германии'],法国:['Fǎguó','Франция','француз/француженка','Франции'],美国:['Měiguó','США','американец/американка','США'],英国:['Yīngguó','Великобритания','британец/британка','Великобритании'],吉尔吉斯斯坦:["Jí'ěrjísīsītǎn",'Кыргызстан','гражданин/гражданка Кыргызстана','Кыргызстане'],荷兰:['Hélán','Нидерланды','нидерландец/нидерландка','Нидерландах'],日本:['Rìběn','Япония','японец/японка','Японии'],韩国:['Hánguó','Южная Корея','кореец/кореянка','Южной Корее']};
const introCities={莫斯科:['Mòsīkē','Москва','Москве'],北京:['Běijīng','Пекин','Пекине'],上海:['Shànghǎi','Шанхай','Шанхае'],广州:['Guǎngzhōu','Гуанчжоу','Гуанчжоу'],深圳:['Shēnzhèn','Шэньчжэнь','Шэньчжэне'],阿姆斯特丹:['Āmǔsītèdān','Амстердам','Амстердаме']};
const introNames={安东:['Āndōng','Антон'],小明:['Xiǎomíng','Сяомин'],小红:['Xiǎohóng','Сяохун'],米沙:['Mǐshā','Миша'],王明:['Wáng Míng','Ван Мин'],李华:['Lǐ Huá','Ли Хуа']};
const introSurnames={王:['Wáng','Ван'],李:['Lǐ','Ли'],张:['Zhāng','Чжан'],刘:['Liú','Лю'],陈:['Chén','Чэнь']};
function introAge(s){
 const digits='零一二三四五六七八九',py=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
 let n;
 if(/^[0-9]{1,2}$/.test(s))n=Number(s);
 else if(/^[一二三四五六七八九]$/.test(s))n=digits.indexOf(s);
 else if(/^[二三四五六七八九]?十[一二三四五六七八九]?$/.test(s)){
  const [a,b]=s.split('十');n=(a?digits.indexOf(a):1)*10+(b?digits.indexOf(b):0);
 }else return null;
 if(n<1||n>99)return null;
 return [n,n<10?py[n]:(n<20?'shí':py[Math.floor(n/10)]+'shí')+(n%10?py[n%10]:'')];
}
function introductionConversation(raw,s,awaiting){
 const r=(py,ru,a,next=null,kind='statement')=>({...result(raw,py,ru,a,next,2),kind,domain:'identity'});
 const nameQ=['你叫什么名字？','Nǐ jiào shénme míngzi?','Как тебя зовут?'];
 const ageQ=['你今年多大？','Nǐ jīnnián duō dà?','Сколько тебе лет?'];
 const originQ=['你来自哪里？','Nǐ láizì nǎlǐ?','Откуда ты родом?'];
 const cityQ=['你现在住在哪里？','Nǐ xiànzài zhù zài nǎlǐ?','Где ты сейчас живёшь?'];
 const jobQ=['你做什么工作？','Nǐ zuò shénme gōngzuò?','Кем ты работаешь?'];
 const greet=['我也很高兴认识你！','Wǒ yě hěn gāoxìng rènshi nǐ!','Я тоже рад(а) познакомиться!'];
 const pandaName=['我叫熊猫。','Wǒ jiào Xióngmāo.','Меня зовут Панда.'];
 const pandaAge=['我是虚拟熊猫，没有实际年龄。','Wǒ shì xūnǐ xióngmāo, méiyǒu shíjì niánlíng.','Я виртуальная панда, у меня нет реального возраста.'];
 const pandaOrigin=['我是虚拟熊猫，没有国籍。','Wǒ shì xūnǐ xióngmāo, méiyǒu guójí.','Я виртуальная панда, у меня нет гражданства.'];
 const pandaCity=['我住在山里。','Wǒ zhù zài shānlǐ.','Я живу в горах (в учебном мире).'];
 const q={
 '你叫什么名字':[nameQ[1],nameQ[2],pandaName],
 '你叫什么':['Nǐ jiào shénme?',nameQ[2],pandaName],
 '你的名字是什么':['Nǐ de míngzi shì shénme?',nameQ[2],pandaName],
 '你姓什么':['Nǐ xìng shénme?','Какая у тебя фамилия?',['我没有姓，我叫熊猫。','Wǒ méiyǒu xìng, wǒ jiào Xióngmāo.','У меня нет фамилии, меня зовут Панда.']],
 '你几岁':['Nǐ jǐ suì?',ageQ[2],pandaAge],
 '你多大':['Nǐ duō dà?',ageQ[2],pandaAge],
 '你多大了':['Nǐ duō dà le?',ageQ[2],pandaAge],
 '你今年多大':[ageQ[1],ageQ[2],pandaAge],
 '你是哪国人':['Nǐ shì nǎ guó rén?','Из какой ты страны?',pandaOrigin],
 '你来自哪里':[originQ[1],originQ[2],pandaOrigin],
 '你从哪里来':['Nǐ cóng nǎlǐ lái?',originQ[2],pandaOrigin],
 '你住在哪里':['Nǐ zhù zài nǎlǐ?','Где ты живёшь?',pandaCity],
 '你现在住在哪儿':['Nǐ xiànzài zhù zài nǎr?',cityQ[2],pandaCity]
 };
 if(Object.hasOwn(q,s)){const [py,ru,a]=q[s];return r(py,ru,a,null,'question')}
 const nationalityQ=/^你(?:是不是(.+?)人|是(.+?)人吗)$/u.exec(s);
 if(nationalityQ&&Object.hasOwn(introCountries,nationalityQ[1]||nationalityQ[2])){
  const [py,,ru]=introCountries[nationalityQ[1]||nationalityQ[2]];
  return r('Nǐ '+(nationalityQ[1]?'shì bu shì ':'shì ')+py+' rén'+(nationalityQ[2]?' ma?':'?'),'Ты '+ru+'?',pandaOrigin,null,'question');
 }
 if(s==='很高兴认识你'||s==='我也很高兴认识你'){
  return r(s.startsWith('我也')?'Wǒ yě hěn gāoxìng rènshi nǐ.':'Hěn gāoxìng rènshi nǐ.','Рад(а) познакомиться.',[greet[0]+ageQ[0],greet[1]+' '+ageQ[1],greet[2]+' '+ageQ[2]],'intro-age');
 }
 const name=/^(我叫|我的名字叫|我的名字是)([\p{Script=Han}]{1,8})$/u.exec(s);
 const shortName=awaiting==='intro-name'&&Object.hasOwn(introNames,s)?s:null;
 if(name||shortName){
  const n=name?.[2]||shortName,v=introNames[n];
  const prefix=name?{'我叫':'Wǒ jiào ','我的名字叫':'Wǒ de míngzi jiào ','我的名字是':'Wǒ de míngzi shì '}[name[1]]:'';
  return r(v?prefix+v[0]+'.':null,'Меня зовут '+(v?v[1]:n)+'.',['很高兴认识你！'+ageQ[0],'Hěn gāoxìng rènshi nǐ! '+ageQ[1],'Рад(а) познакомиться! '+ageQ[2]],'intro-age');
 }
 const surname=/^我姓([\p{Script=Han}])$/u.exec(s);
 if(surname&&Object.hasOwn(introSurnames,surname[1])){
  const [py,ru]=introSurnames[surname[1]];return r('Wǒ xìng '+py+'.','Моя фамилия '+ru+'.',nameQ,'intro-name');
 }
 const age=/^(我)?(今年)?([一二三四五六七八九十0-9]{1,3})岁$/u.exec(s);
 if(age&&(age[1]||awaiting==='intro-age')){
  const a=introAge(age[3]);if(!a)return null;
  const [n,py]=a,ending=n%100>=11&&n%100<=14?'лет':n%10===1?'год':n%10>=2&&n%10<=4?'года':'лет';
  const p=[age[1]?'wǒ':'',age[2]?'jīnnián':'',py,'suì'].filter(Boolean).join(' ');
  return r(p[0].toUpperCase()+p.slice(1)+'.','Мне '+n+' '+ending+'.',originQ,'intro-origin');
 }
 const nationality=/^我(不是|也是|是)(.+)人$/u.exec(s);
 if(nationality&&Object.hasOwn(introCountries,nationality[2])){
  const [py,,ru]=introCountries[nationality[2]],negative=nationality[1]==='不是';
  return r('Wǒ '+(negative?'bú shì ':nationality[1]==='也是'?'yě shì ':'shì ')+py+' rén.','Я '+(negative?'не ':nationality[1]==='也是'?'тоже ':'')+ru+'.',negative?originQ:cityQ,negative?'intro-origin':'intro-city');
 }
 const origin=/^我(?:来自(.+)|从(.+)来)$/u.exec(s);
 const country=origin?.[1]||origin?.[2]||(awaiting==='intro-origin'&&Object.hasOwn(introCountries,s)?s:null);
 if(country&&Object.hasOwn(introCountries,country)){
  const [py,ru]=introCountries[country];return r(origin?(origin[1]?'Wǒ láizì '+py+'.':'Wǒ cóng '+py+' lái.'):py+'.','Я родом из страны: '+ru+'.',cityQ,'intro-city');
 }
 const home=/^我(现在)?住在(.+)$/u.exec(s),shortHome=awaiting==='intro-city'?s.replace(/^在/,''):null,place=home?.[2]||shortHome;
 if(place&&(Object.hasOwn(introCities,place)||Object.hasOwn(introCountries,place))){
  const city=introCities[place],countryData=introCountries[place],py=(city||countryData)[0],ru=city?city[2]:countryData[3];
  return r(home?'Wǒ '+(home[1]?'xiànzài ':'')+'zhù zài '+py+'.':(s.startsWith('在')?'Zài ':'')+py+'.','Я живу в '+ru+'.',jobQ,'job-role');
 }
 return null;
}
// Family dialogue: remember the subject of the immediately preceding question.
// Do not infer a relative's age or existence from an unrelated short answer.
const familyMembers={
 哥哥:['gēge','старший брат','старшего брата','старшему брату','他','старших братьев'],
 姐姐:['jiějie','старшая сестра','старшей сестры','старшей сестре','她','старших сестёр'],
 弟弟:['dìdi','младший брат','младшего брата','младшему брату','他','младших братьев'],
 妹妹:['mèimei','младшая сестра','младшей сестры','младшей сестре','她','младших сестёр'],
 爸爸:['bàba','папа','папы','папе','他','отцов'],
 妈妈:['māma','мама','мамы','маме','她','матерей'],
 儿子:['érzi','сын','сына','сыну','他','сыновей'],
 女儿:["nǚ'ér",'дочь','дочери','дочери','她','дочерей']
};
function familyConversation(raw,s,awaiting){
 const r=(py,ru,a,next=null,kind='statement')=>({...result(raw,py,ru,a,next,6),kind,domain:'family'});
 const sizeQ=['明白了。你家有几口人？','Míngbai le. Nǐ jiā yǒu jǐ kǒu rén?','Понятно. Сколько человек в твоей семье?'];
 const familyQ=['你有兄弟姐妹吗？','Nǐ yǒu xiōngdì jiěmèi ma?','У тебя есть братья или сёстры?'];
 const nextTopic=['谢谢你告诉我。你喜欢做什么？','Xièxie nǐ gàosu wǒ. Nǐ xǐhuan zuò shénme?','Спасибо, что рассказал(а). Чем любишь заниматься?'];
 const ageQ=m=>['你'+m+'几岁？','Nǐ '+familyMembers[m][0]+' jǐ suì?','Сколько лет твоему родственнику: '+familyMembers[m][1]+'?'];
 const hobbyQ=m=>[familyMembers[m][4]+'喜欢做什么？','Tā xǐhuan zuò shénme?','Что '+(familyMembers[m][4]==='她'?'она':'он')+' любит делать?'];
 const num=x=>x==='两'?[2,'liǎng']:introAge(x);
 const years=n=>n%100>=11&&n%100<=14?'лет':n%10===1?'год':n%10>=2&&n%10<=4?'года':'лет';
 const counted=(x,measure)=>{const a=num(x);if(!a)return null;return [a[0],a[0]===1?'yì':a[0]===2?'liǎng':a[1]]};
 const age=/^我(的)?(哥哥|姐姐|弟弟|妹妹|爸爸|妈妈|儿子|女儿)(今年)?([一二三四五六七八九十0-9]+)岁$/u.exec(s);
 const ctxMember=typeof awaiting==='string'&&awaiting.startsWith('family-age:')?awaiting.slice(11):null;
 const bareAge=ctxMember&&Object.hasOwn(familyMembers,ctxMember)?/^([一二三四五六七八九十0-9]+)岁$/u.exec(s):null;
 if(age||bareAge){
  const m=age?age[2]:ctxMember,a=num(age?age[4]:bareAge[1]);if(!a)return null;
  const [n,p0]=a,p=n===1?'yí':p0,[mp,, ,dat,gender]=familyMembers[m];
  const spoken=age?'Wǒ '+(age[1]?'de ':'')+mp+' '+(age[3]?'jīnnián ':'')+p+' suì.':p[0].toUpperCase()+p.slice(1)+' suì.';
  const aZh=age?age[4]:bareAge[1],h=hobbyQ(m),poss=gender==='她'?'Моей':'Моему';
  return r(spoken,poss+' '+dat+' '+n+' '+years(n)+'.',['你'+m+aZh+'岁！'+h[0],'Nǐ '+mp+' '+p+' suì! '+h[1],(gender==='她'?'Твоей ':'Твоему ')+dat+' '+n+' '+years(n)+'! '+h[2]],'family-hobby:'+m);
 }
 const have=/^我(没有|有)(?:([一二两三四五六七八九十]+)个)?(哥哥|姐姐|弟弟|妹妹|儿子|女儿|爸爸|妈妈|孩子|兄弟姐妹)$/u.exec(s);
 if(have){
  const [,verb,count,m]=have,negative=verb==='没有';if(negative&&count)return null;
  const mem=familyMembers[m]|| (m==='孩子'?['háizi','ребёнок','детей']:['xiōngdì jiěmèi','братья и сёстры','братьев и сестёр']);
  const qty=count?counted(count,'个'):null;if(count&&!qty)return null;
  const cp=qty?(qty[0]===1?'yí':qty[1])+' ge ':'';
  const oneRu=mem[4]==='她'?'одна ':'один ';
  const few={哥哥:'старших брата',姐姐:'старшие сестры',弟弟:'младших брата',妹妹:'младшие сестры',儿子:'сына',女儿:'дочери',爸爸:'папы',妈妈:'мамы',孩子:'ребёнка',兄弟姐妹:'брата или сестры'};
  const plural=qty&&qty[0]%100>=11&&qty[0]%100<=14?mem[5]||mem[2]:qty&&qty[0]%10>=2&&qty[0]%10<=4?few[m]:mem[5]||mem[2];
  const ru=negative?'У меня нет '+mem[2]+'.':qty&&qty[0]>1?'У меня '+qty[0]+' '+plural+'.':'У меня есть '+(qty?oneRu:'')+(m==='孩子'?'ребёнок':mem[1])+'.';
  const singular=Object.hasOwn(familyMembers,m)&&(!qty||qty[0]===1);
  const noSiblings=negative&&m==='兄弟姐妹';
  if(noSiblings&&awaiting==='family-siblings')return r('Wǒ méiyǒu '+mem[0]+'.',ru,nextTopic,'hobby');
  return r('Wǒ '+(negative?'méiyǒu ': 'yǒu ')+cp+mem[0]+'.',ru,negative||!singular?sizeQ:ageQ(m),noSiblings?'family-size:no-siblings':negative||!singular?'family-size':'family-age:'+m);
 }
 const pair=/^我有一个(哥哥|姐姐|弟弟|妹妹)和一个(哥哥|姐姐|弟弟|妹妹)$/u.exec(s);
 if(pair&&pair[1]!==pair[2])return r('Wǒ yǒu yí ge '+familyMembers[pair[1]][0]+' hé yí ge '+familyMembers[pair[2]][0]+'.','У меня есть '+familyMembers[pair[1]][1]+' и '+familyMembers[pair[2]][1]+'.',sizeQ,'family-size');
 const size=/^(我家有)?([一二两三四五六七八九十0-9]+)(口|个)人$/u.exec(s);
 if(size&&(size[1]||awaiting==='family-size'||awaiting==='family-size:no-siblings')){
  const a=counted(size[2],size[3]);if(!a||a[0]>30)return null;
  const p=a[0]===1?(size[3]==='口'?'yì':'yí'):a[1],mp=size[3]==='口'?'kǒu':'ge';
  return r((size[1]?'Wǒ jiā yǒu ':p[0].toUpperCase()+p.slice(1)+' ')+(size[1]?p+' ':'')+mp+' rén.','В моей семье '+a[0]+' человек.',awaiting==='family-size:no-siblings'?nextTopic:familyQ,awaiting==='family-size:no-siblings'?'hobby':'family-siblings');
 }
 if(s==='我和父母住在一起')return r('Wǒ hé fùmǔ zhù zài yìqǐ.','Я живу вместе с родителями.',familyQ,'family-siblings');
 const q=/^你(?:有没有(哥哥|姐姐|弟弟|妹妹|爸爸|妈妈|孩子|兄弟姐妹)|有(哥哥|姐姐|弟弟|妹妹|爸爸|妈妈|孩子|兄弟姐妹)吗|有几个(哥哥|姐姐|弟弟|妹妹))$/u.exec(s);
 if(q){
  const m=q[1]||q[2]||q[3],mem=familyMembers[m]||(m==='孩子'?['háizi','дети','детей']:['xiōngdì jiěmèi','братья и сёстры','братьев и сестёр']);
  const has=['哥哥','妹妹','爸爸','妈妈','兄弟姐妹'].includes(m);
  const ans=m==='兄弟姐妹'?['我有一个哥哥和一个妹妹。','Wǒ yǒu yí ge gēge hé yí ge mèimei.','У меня есть старший брат и младшая сестра.']:has?['我有'+(['爸爸','妈妈'].includes(m)?'':'一个')+m+'。','Wǒ yǒu '+(['爸爸','妈妈'].includes(m)?'':'yí ge ')+mem[0]+'.','У меня есть '+mem[1]+'.']:['我没有'+m+'。','Wǒ méiyǒu '+mem[0]+'.','У меня нет '+mem[2]+'.'];
  return r('Nǐ '+(q[1]?'yǒu méiyǒu ':q[3]?'yǒu jǐ ge ':'yǒu ')+mem[0]+(q[2]?' ma?':'?'),q[3]?'Сколько у тебя '+mem[5]+'?':'У тебя есть '+mem[1]+'?',ans,null,'question');
 }
 if(s==='你家有几口人')return r('Nǐ jiā yǒu jǐ kǒu rén?','Сколько человек в твоей семье?',['我家有五口人。','Wǒ jiā yǒu wǔ kǒu rén.','В моей семье пять человек.'],null,'question');
 if(typeof awaiting==='string'&&awaiting.startsWith('family-hobby:')){
  const m=awaiting.slice(13),h=/^(他|她)喜欢(跑步|游泳|看书|听音乐|喝咖啡)$/u.exec(s);
  if(h&&Object.hasOwn(familyMembers,m)&&h[1]===familyMembers[m][4]){
   const v=hobbies[h[2]];
   return r('Tā xǐhuan '+v[0]+'.',(h[1]==='她'?'Она':'Он')+' любит '+v[1]+'.',nextTopic,'hobby');
  }
 }
 return null;
}
// Reviewed everyday dialogue bank. Context-dependent fragments require the matching question.
const everydayReplies556={"freq":["你经常做这件事吗？","Nǐ jīngcháng zuò zhè jiàn shì ma?","Ты часто этим занимаешься?"],"weekend":["你周末喜欢做什么？","Nǐ zhōumò xǐhuan zuò shénme?","Что любишь делать по выходным?"],"hobby":["我喜欢跑步。你呢？","Wǒ xǐhuan pǎobù. Nǐ ne?","Я люблю бегать. А ты?"],"food":["你还喜欢吃什么？","Nǐ hái xǐhuan chī shénme?","Что ещё любишь есть?"],"drink":["你喜欢喝什么？","Nǐ xǐhuan hē shénme?","Что любишь пить?"],"more":["还要别的吗？","Hái yào bié de ma?","Что-нибудь ещё?"],"eat":["那你现在想吃什么？","Nà nǐ xiànzài xiǎng chī shénme?","Тогда что сейчас хочешь съесть?"],"done":["好的。我们聊点别的吧！","Hǎo de. Wǒmen liáo diǎn bié de ba!","Хорошо. Давай поговорим о другом!"],"bamboo":["我喜欢吃竹子。你呢？","Wǒ xǐhuan chī zhúzi. Nǐ ne?","Я люблю бамбук. А ты?"],"tea":["我喜欢喝茶。你呢？","Wǒ xǐhuan hē chá. Nǐ ne?","Я люблю чай. А ты?"],"morning":["你起床以后做什么？","Nǐ qǐchuáng yǐhòu zuò shénme?","Что делаешь после подъёма?"],"breakfast":["你早上吃早饭吗？","Nǐ zǎoshang chī zǎofàn ma?","Ты завтракаешь?"],"work":["你几点去上班？","Nǐ jǐ diǎn qù shàngbān?","Во сколько идёшь на работу?"],"sleep":["你晚上几点睡觉？","Nǐ wǎnshang jǐ diǎn shuìjiào?","Во сколько ложишься спать?"],"dayDone":["谢谢你介绍你的一天。","Xièxie nǐ jièshào nǐ de yì tiān.","Спасибо, что рассказал(а) о своём дне."],"wake":["我没有固定的起床时间。你几点起床？","Wǒ méiyǒu gùdìng de qǐchuáng shíjiān. Nǐ jǐ diǎn qǐchuáng?","У меня нет фиксированного времени подъёма. А ты во сколько встаёшь?"],"pSleep":["我没有固定的睡觉时间。你呢？","Wǒ méiyǒu gùdìng de shuìjiào shíjiān. Nǐ ne?","У меня нет фиксированного времени сна. А у тебя?"],"weather":["我不知道你那里的天气。你能告诉我吗？","Wǒ bù zhīdào nǐ nàli de tiānqì. Nǐ néng gàosu wǒ ma?","Я не знаю, какая у тебя погода. Расскажешь?"],"tomorrow":["我不知道明天的实际天气。","Wǒ bù zhīdào míngtiān de shíjì tiānqì.","Я не знаю реального прогноза на завтра."],"out":["你今天想出去吗？","Nǐ jīntiān xiǎng chūqu ma?","Хочешь сегодня выйти на улицу?"],"warm":["注意保暖！你今天想做什么？","Zhùyì bǎonuǎn! Nǐ jīntiān xiǎng zuò shénme?","Одевайся теплее! Что хочешь сегодня делать?"],"hot":["记得喝水。","Jìde hē shuǐ.","Не забывай пить воду."],"rain":["出门别忘了带伞。","Chūmén bié wàng le dài sǎn.","Не забудь зонт, если выходишь."],"color":["你喜欢什么颜色？","Nǐ xǐhuan shénme yánsè?","Какой цвет тебе нравится?"],"qty":["你想买几件？","Nǐ xiǎng mǎi jǐ jiàn?","Сколько штук хочешь купить?"],"price":["练习对话：五十块钱。","Liànxí duìhuà: wǔshí kuài qián.","Учебный диалог: 50 юаней."],"discount":["练习对话：四十块钱，可以吗？","Liànxí duìhuà: sìshí kuài qián, kěyǐ ma?","Учебный диалог: 40 юаней, подойдёт?"],"card":["练习对话：可以刷卡。","Liànxí duìhuà: kěyǐ shuākǎ.","Учебный диалог: можно оплатить картой."],"shopDone":["好的，还需要别的吗？","Hǎo de, hái xūyào bié de ma?","Хорошо. Нужно что-нибудь ещё?"],"shopNo":["没关系，我们看看别的吧。","Méi guānxi, wǒmen kànkan bié de ba.","Ничего страшного, посмотрим что-нибудь другое."],"when":["你打算什么时候去？","Nǐ dǎsuàn shénme shíhou qù?","Когда собираешься поехать?"],"mode":["你打算怎么去？","Nǐ dǎsuàn zěnme qù?","Как собираешься добраться?"],"plan":["你到了那里想做什么？","Nǐ dào le nàli xiǎng zuò shénme?","Что хочешь делать, когда приедешь?"],"past":["你在那里做了什么？","Nǐ zài nàli zuò le shénme?","Что ты там делал(а)?"],"wish":["你以后想去吗？","Nǐ yǐhòu xiǎng qù ma?","Хочешь поехать туда в будущем?"],"pTravel":["我是虚拟熊猫，没有实际的旅行经历。","Wǒ shì xūnǐ xióngmāo, méiyǒu shíjì de lǚxíng jīnglì.","Я виртуальная панда, у меня нет реального опыта путешествий."],"rest":["那你休息一下吧。","Nà nǐ xiūxi yíxià ba.","Тогда немного отдохни."],"happy":["太好了！为什么这么开心？","Tài hǎo le! Wèishénme zhème kāixīn?","Здорово! Почему так рад(а)?"],"wrong":["怎么了？你想说说吗？","Zěnme le? Nǐ xiǎng shuōshuo ma?","Что случилось? Хочешь рассказать?"],"care":["如果不舒服，请考虑看医生。","Rúguǒ bù shūfu, qǐng kǎolǜ kàn yīshēng.","Если плохо себя чувствуешь, подумай об обращении к врачу."],"well":["我很好，谢谢！你呢？","Wǒ hěn hǎo, xièxie! Nǐ ne?","У меня всё хорошо, спасибо! А у тебя?"],"better":["那就好！请照顾好自己。","Nà jiù hǎo! Qǐng zhàogù hǎo zìjǐ.","Вот и хорошо! Береги себя."],"travelEnjoy":["祝你旅途愉快！","Zhù nǐ lǚtú yúkuài!","Желаю приятного путешествия!"]};
const everydayRows556={"hobby":[["我喜欢看电影","Wǒ xǐhuan kàn diànyǐng.","Я люблю смотреть фильмы.","freq","hobby-frequency:看电影"],["我喜欢唱歌","Wǒ xǐhuan chànggē.","Я люблю петь.","freq","hobby-frequency:唱歌"],["我的爱好是画画","Wǒ de àihào shì huàhuà.","Моё хобби — рисовать.","freq","hobby-frequency:画画"],["我周末喜欢看书","Wǒ zhōumò xǐhuan kàn shū.","По выходным я люблю читать.","freq","hobby-frequency:看书"],["你有什么爱好","Nǐ yǒu shénme àihào?","Какие у тебя увлечения?","hobby","hobby","","q"],["你喜欢运动吗","Nǐ xǐhuan yùndòng ma?","Ты любишь спорт?","hobby","hobby","","q"],["每天","Měitiān.","Каждый день.","weekend","hobby","hobby-frequency:*"],["不经常","Bù jīngcháng.","Не часто.","weekend","hobby","hobby-frequency:*"],["经常","Jīngcháng.","Часто.","weekend","hobby","hobby-frequency:*"],["有时候","Yǒushíhou.","Иногда.","weekend","hobby","hobby-frequency:*"]],"food":[["我喜欢吃牛肉","Wǒ xǐhuan chī niúròu.","Я люблю есть говядину.","food","food-choice"],["我不吃肉","Wǒ bù chī ròu.","Я не ем мясо.","food","food-choice"],["我想喝咖啡","Wǒ xiǎng hē kāfēi.","Я хочу кофе.","more","food-more"],["我想喝水","Wǒ xiǎng hē shuǐ.","Я хочу воды.","more","food-more"],["我还没吃早饭","Wǒ hái méi chī zǎofàn.","Я ещё не завтракал(а).","eat","food-choice"],["我已经吃了","Wǒ yǐjīng chī le.","Я уже поел(а).","drink","food-drink"],["你喜欢吃什么","Nǐ xǐhuan chī shénme?","Что ты любишь есть?","bamboo","food-choice","","q"],["你想喝什么","Nǐ xiǎng hē shénme?","Что хочешь пить?","tea","food-drink","","q"],["米饭","Mǐfàn.","Рис.","more","food-more","food-choice"],["不要","Bú yào.","Не нужно.","done","","food-more"],["茶","Chá.","Чай.","more","food-more","food-drink"]],"day":[["我每天七点起床","Wǒ měitiān qī diǎn qǐchuáng.","Я каждый день встаю в семь.","morning","routine-morning"],["我八点起床","Wǒ bā diǎn qǐchuáng.","Я встаю в восемь.","morning","routine-morning"],["我早上刷牙","Wǒ zǎoshang shuāyá.","Утром я чищу зубы.","breakfast","routine-breakfast"],["我每天学习中文","Wǒ měitiān xuéxí Zhōngwén.","Я каждый день учу китайский.","sleep","routine-sleep"],["我晚上十一点睡觉","Wǒ wǎnshang shíyī diǎn shuìjiào.","Я ложусь спать в одиннадцать вечера.","dayDone",""],["你几点起床","Nǐ jǐ diǎn qǐchuáng?","Во сколько встаёшь?","wake","routine-wake","","q"],["你几点睡觉","Nǐ jǐ diǎn shuìjiào?","Во сколько ложишься спать?","pSleep","routine-sleep","","q"],["七点","Qī diǎn.","В семь.","morning","routine-morning","routine-wake"],["吃早饭","Chī zǎofàn.","Завтракаю.","work","routine-work","routine-morning"],["十一点","Shíyī diǎn.","В одиннадцать.","dayDone","","routine-sleep"],["我不吃早饭","Wǒ bù chī zǎofàn.","Я не завтракаю.","work","routine-work","routine-breakfast"],["九点","Jiǔ diǎn.","В девять.","sleep","routine-sleep","routine-work"]],"weather":[["今天天气很好","Jīntiān tiānqì hěn hǎo.","Сегодня хорошая погода.","out","weather-out"],["今天很冷","Jīntiān hěn lěng.","Сегодня холодно.","warm","plans"],["今天很热","Jīntiān hěn rè.","Сегодня жарко.","hot",""],["今天下雨了","Jīntiān xiàyǔ le.","Сегодня идёт дождь.","rain",""],["今天下雪了","Jīntiān xiàxuě le.","Сегодня идёт снег.","warm","plans"],["我喜欢晴天","Wǒ xǐhuan qíngtiān.","Я люблю солнечные дни.","out","weather-out"],["今天天气怎么样","Jīntiān tiānqì zěnmeyàng?","Какая сегодня погода?","weather","weather-local","","q"],["明天天气怎么样","Míngtiān tiānqì zěnmeyàng?","Какая завтра погода?","tomorrow","","","q"],["很冷","Hěn lěng.","Холодно.","warm","plans","weather-local"],["下雨","Xiàyǔ.","Идёт дождь.","rain","","weather-local"]],"shopping":[["我想买衣服","Wǒ xiǎng mǎi yīfu.","Хочу купить одежду.","color","shop-color"],["我想买这本书","Wǒ xiǎng mǎi zhè běn shū.","Хочу купить эту книгу.","shopDone","shop-more"],["这件衣服多少钱","Zhè jiàn yīfu duōshao qián?","Сколько стоит эта одежда?","price","shop-price","","q"],["太贵了","Tài guì le.","Слишком дорого.","discount","shop-price","shop-price"],["便宜一点可以吗","Piányi yìdiǎn kěyǐ ma?","Можно немного дешевле?","discount","shop-price","","q"],["我不要了","Wǒ bú yào le.","Я передумал(а) покупать.","shopNo",""],["可以刷卡吗","Kěyǐ shuākǎ ma?","Можно платить картой?","card","","","q"],["我要两件","Wǒ yào liǎng jiàn.","Мне две штуки.","shopDone","shop-more"],["红色","Hóngsè.","Красный.","qty","shop-quantity","shop-color"],["两件","Liǎng jiàn.","Две штуки.","shopDone","shop-more","shop-quantity"]],"travel":[["我想去中国","Wǒ xiǎng qù Zhōngguó.","Я хочу поехать в Китай.","when","travel-when"],["我下个月想去北京","Wǒ xià ge yuè xiǎng qù Běijīng.","В следующем месяце хочу поехать в Пекин.","mode","travel-mode"],["我去过上海","Wǒ qùguo Shànghǎi.","Я бывал(а) в Шанхае.","past","travel-past"],["我没去过中国","Wǒ méi qùguo Zhōngguó.","Я не бывал(а) в Китае.","wish","travel-wish"],["我想坐火车","Wǒ xiǎng zuò huǒchē.","Я хочу поехать на поезде.","plan","travel-plan"],["我坐飞机去北京","Wǒ zuò fēijī qù Běijīng.","Я еду в Пекин на самолёте.","plan","travel-plan"],["你去过中国吗","Nǐ qùguo Zhōngguó ma?","Ты бывал(а) в Китае?","pTravel","","","q"],["你怎么去北京","Nǐ zěnme qù Běijīng?","Как ты добираешься до Пекина?","pTravel","","","q"],["坐火车","Zuò huǒchē.","На поезде.","plan","travel-plan","travel-mode"],["下个月","Xià ge yuè.","В следующем месяце.","mode","travel-mode","travel-when"],["我想参观长城","Wǒ xiǎng cānguān Chángchéng.","Хочу посетить Великую Китайскую стену.","travelEnjoy","","travel-plan"]],"health":[["我很累","Wǒ hěn lèi.","Я очень устал(а).","rest","health-followup"],["我很开心","Wǒ hěn kāixīn.","Я очень рад(а).","happy","health-reason"],["我不开心","Wǒ bù kāixīn.","Я расстроен(а).","wrong","health-reason"],["我今天不舒服","Wǒ jīntiān bù shūfu.","Сегодня плохо себя чувствую.","wrong","health-symptom"],["我头疼","Wǒ tóuténg.","У меня болит голова.","care","health-followup"],["我发烧了","Wǒ fāshāo le.","У меня температура.","care","health-followup"],["我想休息","Wǒ xiǎng xiūxi.","Я хочу отдохнуть.","rest","health-followup"],["你好吗","Nǐ hǎo ma?","Как у тебя дела?","well","health-mood","","q"],["你身体怎么样","Nǐ shēntǐ zěnmeyàng?","Как твоё здоровье?","well","health-mood","","q"],["好多了","Hǎoduō le.","Гораздо лучше.","better","","health-followup"],["我还是不舒服","Wǒ háishi bù shūfu.","Мне всё ещё нехорошо.","care","health-followup","health-followup"]]};
function everydayConversation556(raw,s,awaiting){
 for(const rows of Object.values(everydayRows556)){
  const row=rows.find(([zh,py,ru,key,next,required])=>zh===s&&(!required||required==='hobby-frequency:*'&&String(awaiting||'').startsWith('hobby-frequency:')||required===awaiting));
  if(!row)continue;
  const [,py,ru,key,next,,question]=row;
  return {...result(raw,py,ru,everydayReplies556[key],next||null,1),domain:'everyday',kind:question?'question':'statement'};
 }
 return null;
}
function routineQuestion563(s){
 const m=/^你(今天|明天|每天)?(早上|上午|中午|下午|晚上)?(今天|明天|每天)?(想|要|打算|准备|会)?做什么(?:呢)?$/u.exec(s);
 if(!m||m[1]&&m[3])return null;
 const day=m[1]||m[3]||'',period=m[2]||'',verb=m[4]||'';
 const dates={今天:['jīntiān','сегодня'],明天:['míngtiān','завтра'],每天:['měitiān','каждый день']};
 const periods={早上:['zǎoshang','утром'],上午:['shàngwǔ','до обеда'],中午:['zhōngwǔ','в полдень'],下午:['xiàwǔ','после обеда'],晚上:['wǎnshang','вечером']};
 const verbs={想:['xiǎng','хочешь'],要:['yào','собираешься'],打算:['dǎsuàn','планируешь'],准备:['zhǔnbèi','собираешься'],会:['huì','будешь']};
 const pinyin=['Nǐ',m[1]&&dates[m[1]][0],period&&periods[period][0],m[3]&&dates[m[3]][0],verb&&verbs[verb][0],'zuò shénme'+(s.endsWith('呢')?' ne':'')].filter(Boolean).join(' ')+'?';
 const translation=['Что ты',verb==='会'?'будешь делать':verb?verbs[verb][1]+' делать':day==='明天'?'будешь делать':'делаешь',day&&dates[day][1],period&&periods[period][1]].filter(Boolean).join(' ')+'?';
 // Choose exact approved course recordings instead of fabricating a recording.
 const reply=day==='明天'?['我明天学中文。','Wǒ míngtiān xué Zhōngwén.','Завтра я буду учить китайский.']:
 period==='早上'||period==='上午'?['我早上刷牙。','Wǒ zǎoshang shuāyá.','Утром я чищу зубы.']:
 period==='晚上'?['我每天晚上看书。','Wǒ měitiān wǎnshang kàn shū.','Каждый вечер я читаю книги.']:
 day==='每天'?['我每天学习中文。','Wǒ měitiān xuéxí Zhōngwén.','Я каждый день учу китайский.']:
 ['我打算学中文。','Wǒ dǎsuàn xué Zhōngwén.','Я планирую учить китайский.'];
 return {pinyin,translation,reply};
}

// v563: reviewed course dialogue and linked clauses; no automatic TTS or tone scoring.
const courseGapQuestions563=[["你住在哪儿","Nǐ zhù zài nǎr?","Где ты живёшь?","我住在熊猫的世界里。","Wǒ zhù zài xióngmāo de shìjiè lǐ.","Я живу в мире панд."],["你会说中文吗","Nǐ huì shuō Zhōngwén ma?","Ты умеешь говорить по-китайски?","会，我会说中文。","Huì, wǒ huì shuō Zhōngwén.","Да, умею."],["你会说俄语吗","Nǐ huì shuō Éyǔ ma?","Ты умеешь говорить по-русски?","我可以用俄语解释中文。","Wǒ kěyǐ yòng Éyǔ jiěshì Zhōngwén.","Я могу объяснять китайский по-русски."],["你爸爸做什么工作","Nǐ bàba zuò shénme gōngzuò?","Кем работает твой папа?","我是虚拟熊猫。你爸爸呢？","Wǒ shì xūnǐ xióngmāo. Nǐ bàba ne?","Я виртуальная панда. А твой папа?"],["你妈妈多大了","Nǐ māma duō dà le?","Сколько лет твоей маме?","我是虚拟熊猫。你妈妈呢？","Wǒ shì xūnǐ xióngmāo. Nǐ māma ne?","Я виртуальная панда. А твоей маме?"],["你结婚了吗","Nǐ jiéhūn le ma?","Ты в браке?","没有，我是虚拟熊猫。","Méiyǒu, wǒ shì xūnǐ xióngmāo.","Нет, я виртуальная панда."],["你有朋友吗","Nǐ yǒu péngyou ma?","У тебя есть друзья?","有啊，我们可以做朋友。","Yǒu a, wǒmen kěyǐ zuò péngyou.","Да, мы можем дружить."],["你每天几点上班","Nǐ měitiān jǐ diǎn shàngbān?","Во сколько ты каждый день начинаешь работу?","我九点去上班。","Wǒ jiǔ diǎn qù shàngbān.","В учебном диалоге: я иду на работу в девять."],["你今天忙不忙","Nǐ jīntiān máng bu máng?","Ты сегодня занят(а)?","今天我有空，可以聊聊天。","Jīntiān wǒ yǒu kòng, kěyǐ liáo liáotiān.","Сегодня я свободна, можем поболтать."],["你什么时候下班","Nǐ shénme shíhou xiàbān?","Когда ты заканчиваешь работу?","我没有固定的下班时间。","Wǒ méiyǒu gùdìng de xiàbān shíjiān.","У меня нет фиксированного времени окончания работы."],["你想吃什么","Nǐ xiǎng chī shénme?","Что хочешь съесть?","我想吃竹子。","Wǒ xiǎng chī zhúzi.","Хочу бамбук."],["你喜欢喝咖啡吗","Nǐ xǐhuan hē kāfēi ma?","Ты любишь кофе?","我喜欢喝茶。","Wǒ xǐhuan hē chá.","Я люблю пить чай."],["你吃早饭了吗","Nǐ chī zǎofàn le ma?","Ты уже позавтракал(а)?","我早上不吃早饭。","Wǒ zǎoshang bù chī zǎofàn.","Я не завтракаю утром."],["你饿了吗","Nǐ è le ma?","Ты проголодался(-ась)?","不饿。你呢？","Bú è. Nǐ ne?","Нет. А ты?"],["你会做饭吗","Nǐ huì zuò fàn ma?","Ты умеешь готовить?","我不会真的做饭，但可以陪你练习。","Wǒ bú huì zhēn de zuò fàn, dàn kěyǐ péi nǐ liànxí.","Я не могу готовить по-настоящему, но могу заниматься с тобой."],["你喜欢中国菜吗","Nǐ xǐhuan Zhōngguó cài ma?","Ты любишь китайскую кухню?","你最喜欢什么中国菜？","Nǐ zuì xǐhuan shénme Zhōngguó cài?","Какое китайское блюдо ты любишь больше всего?"],["你昨天做了什么","Nǐ zuótiān zuò le shénme?","Что ты делал(а) вчера?","我昨天看了电影。","Wǒ zuótiān kàn le diànyǐng.","В учебном диалоге: вчера я смотрела фильм."],["你今天做了什么","Nǐ jīntiān zuò le shénme?","Что ты делал(а) сегодня?","我今天和你练习中文。","Wǒ jīntiān hé nǐ liànxí Zhōngwén.","Сегодня я практикую китайский с тобой."],["你周末做什么","Nǐ zhōumò zuò shénme?","Что ты делаешь по выходным?","我周末喜欢看书。","Wǒ zhōumò xǐhuan kàn shū.","По выходным я люблю читать."],["你现在在做什么","Nǐ xiànzài zài zuò shénme?","Что ты сейчас делаешь?","我在和你聊天。","Wǒ zài hé nǐ liáotiān.","Я разговариваю с тобой."],["你什么时候有空","Nǐ shénme shíhou yǒu kòng?","Когда ты свободен(-на)?","今天我有空，可以聊聊天。","Jīntiān wǒ yǒu kòng, kěyǐ liáo liáotiān.","Сегодня я свободна, можем поболтать."],["你喜欢看书吗","Nǐ xǐhuan kàn shū ma?","Ты любишь читать?","我喜欢看书。","Wǒ xǐhuan kàn shū.","Я люблю читать."],["你喜欢听什么音乐","Nǐ xǐhuan tīng shénme yīnyuè?","Какую музыку любишь слушать?","我喜欢轻音乐。","Wǒ xǐhuan qīng yīnyuè.","Я люблю лёгкую музыку."],["你喜欢跑步吗","Nǐ xǐhuan pǎobù ma?","Ты любишь бегать?","我喜欢跑步。","Wǒ xǐhuan pǎobù.","В учебном диалоге: я люблю бегать."],["你喜欢看电影吗","Nǐ xǐhuan kàn diànyǐng ma?","Ты любишь смотреть фильмы?","我喜欢喜剧片。","Wǒ xǐhuan xǐjùpiàn.","Я люблю комедии."],["你会游泳吗","Nǐ huì yóuyǒng ma?","Ты умеешь плавать?","我是虚拟熊猫，不会真的游泳。","Wǒ shì xūnǐ xióngmāo, bú huì zhēn de yóuyǒng.","Я виртуальная панда и не могу плавать по-настоящему."],["你周末喜欢做什么","Nǐ zhōumò xǐhuan zuò shénme?","Что любишь делать на выходных?","我周末喜欢看书。","Wǒ zhōumò xǐhuan kàn shū.","На выходных я люблю читать."],["你那里冷吗","Nǐ nàli lěng ma?","У тебя там холодно?","我不知道实际天气。","Wǒ bù zhīdào shíjì tiānqì.","Я не знаю реальной погоды."],["今天下雨吗","Jīntiān xià yǔ ma?","Сегодня идёт дождь?","我不知道你那里的天气。你能告诉我吗？","Wǒ bù zhīdào nǐ nàli de tiānqì. Nǐ néng gàosu wǒ ma?","Я не знаю погоду у тебя. Расскажешь?"],["你喜欢冬天吗","Nǐ xǐhuan dōngtiān ma?","Ты любишь зиму?","我喜欢雪。","Wǒ xǐhuan xuě.","Я люблю снег."],["你觉得今天热吗","Nǐ juéde jīntiān rè ma?","Как думаешь, сегодня жарко?","我不知道实际天气。","Wǒ bù zhīdào shíjì tiānqì.","Я не знаю реальной погоды."],["这个多少钱","Zhège duōshao qián?","Сколько это стоит?","你想买什么？","Nǐ xiǎng mǎi shénme?","Что ты хочешь купить?"],["可以便宜一点吗","Kěyǐ piányi yìdiǎn ma?","Можно немного дешевле?","练习对话：四十块钱，可以吗？","Liànxí duìhuà: sìshí kuài qián, kěyǐ ma?","Учебный диалог: сорок юаней, подойдёт?"],["你想买什么","Nǐ xiǎng mǎi shénme?","Что хочешь купить?","我想买衣服。","Wǒ xiǎng mǎi yīfu.","Хочу купить одежду."],["有别的颜色吗","Yǒu bié de yánsè ma?","Есть другие цвета?","你喜欢什么颜色？","Nǐ xǐhuan shénme yánsè?","Какой цвет тебе нравится?"],["你喜欢什么颜色","Nǐ xǐhuan shénme yánsè?","Какой цвет любишь?","我喜欢紫色。","Wǒ xǐhuan zǐsè.","Я люблю фиолетовый."],["你想去哪儿","Nǐ xiǎng qù nǎr?","Куда хочешь поехать?","我想去北京。","Wǒ xiǎng qù Běijīng.","Хочу поехать в Пекин."],["你怎么去上班","Nǐ zěnme qù shàngbān?","Как добираешься на работу?","我坐地铁去上班。","Wǒ zuò dìtiě qù shàngbān.","Учебный диалог: я еду на работу на метро."],["你喜欢旅行吗","Nǐ xǐhuan lǚxíng ma?","Ты любишь путешествовать?","我是虚拟熊猫，没有实际的旅行经历。","Wǒ shì xūnǐ xióngmāo, méiyǒu shíjì de lǚxíng jīnglì.","Я виртуальная панда, у меня нет реального опыта путешествий."],["你什么时候去北京","Nǐ shénme shíhou qù Běijīng?","Когда поедешь в Пекин?","我还没有计划。","Wǒ hái méiyǒu jìhuà.","Пока нет планов."],["你坐飞机吗","Nǐ zuò fēijī ma?","Ты летишь на самолёте?","我是虚拟熊猫，不会真的坐飞机。","Wǒ shì xūnǐ xióngmāo, bú huì zhēn de zuò fēijī.","Я виртуальная панда и не летаю по-настоящему."],["你身体好吗","Nǐ shēntǐ hǎo ma?","Как твоё здоровье?","我很好，谢谢！你呢？","Wǒ hěn hǎo, xièxie! Nǐ ne?","Хорошо, спасибо! А ты?"],["你怎么了","Nǐ zěnme le?","Что с тобой?","我没事，谢谢你。","Wǒ méi shì, xièxie nǐ.","Всё хорошо, спасибо."],["你生病了吗","Nǐ shēngbìng le ma?","Ты заболел(а)?","没有，我是虚拟熊猫。","Méiyǒu, wǒ shì xūnǐ xióngmāo.","Нет, я виртуальная панда."],["你累不累","Nǐ lèi bu lèi?","Ты устал(а)?","不累。你呢？","Bú lèi. Nǐ ne?","Не устала. А ты?"],["你今天感觉怎么样","Nǐ jīntiān gǎnjué zěnmeyàng?","Как ты себя сегодня чувствуешь?","我很好，谢谢！你呢？","Wǒ hěn hǎo, xièxie! Nǐ ne?","Хорошо, спасибо! А ты?"],["你需要休息吗","Nǐ xūyào xiūxi ma?","Тебе нужно отдохнуть?","不用，谢谢你。","Bú yòng, xièxie nǐ.","Не нужно, спасибо."]];
const courseScenes563=[{"topic":"Мой распорядок дня","grammar":"Время перед действием","statement":["我每天七点起床。","Wǒ měitiān qī diǎn qǐchuáng.","Я встаю каждый день в семь."],"question":["你每天几点起床？","Nǐ měitiān jǐ diǎn qǐchuáng?","Во сколько ты встаёшь каждый день?"],"answer":["我每天七点起床。","Wǒ měitiān qī diǎn qǐchuáng.","Я встаю каждый день в семь."]},{"topic":"Мой распорядок дня","grammar":"先…再…","statement":["我先吃早饭，再去上班。","Wǒ xiān chī zǎofàn, zài qù shàngbān.","Сначала я завтракаю, потом иду на работу."],"question":["你早上先做什么？","Nǐ zǎoshang xiān zuò shénme?","Что ты делаешь утром сначала?"],"answer":["我先刷牙，再吃早饭。","Wǒ xiān shuāyá, zài chī zǎofàn.","Сначала чищу зубы, затем завтракаю."]},{"topic":"Мой распорядок дня","grammar":"常常 и время дня","statement":["我晚上常常看书。","Wǒ wǎnshang chángcháng kàn shū.","Вечерами я часто читаю."],"question":["你晚上常常做什么？","Nǐ wǎnshang chángcháng zuò shénme?","Что ты часто делаешь вечером?"],"answer":["我晚上常常看书。","Wǒ wǎnshang chángcháng kàn shū.","Вечерами я часто читаю."]},{"topic":"Моя работа и учёба","grammar":"在 + место + глагол","statement":["我在公司工作。","Wǒ zài gōngsī gōngzuò.","Я работаю в компании."],"question":["你在哪儿工作？","Nǐ zài nǎr gōngzuò?","Где ты работаешь?"],"answer":["我在公司工作。","Wǒ zài gōngsī gōngzuò.","Я работаю в компании."]},{"topic":"Моя работа и учёба","grammar":"会 / 不会","statement":["我会用电脑。","Wǒ huì yòng diànnǎo.","Я умею пользоваться компьютером."],"question":["你会用电脑吗？","Nǐ huì yòng diànnǎo ma?","Ты умеешь пользоваться компьютером?"],"answer":["会，我会用电脑。","Huì, wǒ huì yòng diànnǎo.","Да, умею."]},{"topic":"Моя работа и учёба","grammar":"工作 + 现在","statement":["我今天很忙。","Wǒ jīntiān hěn máng.","Я сегодня очень занят."],"question":["你今天忙吗？","Nǐ jīntiān máng ma?","Ты сегодня занят?"],"answer":["我今天很忙。","Wǒ jīntiān hěn máng.","Я сегодня очень занят."]},{"topic":"Моё хобби","grammar":"喜欢 + глагол","statement":["我喜欢听音乐。","Wǒ xǐhuan tīng yīnyuè.","Мне нравится слушать музыку."],"question":["你喜欢做什么？","Nǐ xǐhuan zuò shénme?","Что тебе нравится делать?"],"answer":["我喜欢听音乐。","Wǒ xǐhuan tīng yīnyuè.","Я люблю слушать музыку."]},{"topic":"Моё хобби","grammar":"周末 + действие","statement":["我周末常常跑步。","Wǒ zhōumò chángcháng pǎobù.","По выходным я часто бегаю."],"question":["你周末做什么？","Nǐ zhōumò zuò shénme?","Что ты делаешь в выходные?"],"answer":["我周末常常跑步。","Wǒ zhōumò chángcháng pǎobù.","По выходным я часто бегаю."]},{"topic":"Моё хобби","grammar":"觉得 + оценка","statement":["我觉得这个电影很有意思。","Wǒ juéde zhège diànyǐng hěn yǒu yìsi.","Я считаю этот фильм интересным."],"question":["你觉得这个电影怎么样？","Nǐ juéde zhège diànyǐng zěnmeyàng?","Как тебе этот фильм?"],"answer":["我觉得很有意思。","Wǒ juéde hěn yǒu yìsi.","Мне кажется, он интересный."]},{"topic":"Мой город","grammar":"在 + место","statement":["银行在学校旁边。","Yínháng zài xuéxiào pángbiān.","Банк рядом со школой."],"question":["银行在哪儿？","Yínháng zài nǎr?","Где банк?"],"answer":["银行在学校旁边。","Yínháng zài xuéxiào pángbiān.","Банк рядом со школой."]},{"topic":"Мой город","grammar":"前面 / 后面","statement":["公园在医院后面。","Gōngyuán zài yīyuàn hòumiàn.","Парк позади больницы."],"question":["公园在哪儿？","Gōngyuán zài nǎr?","Где находится парк?"],"answer":["公园在医院后面。","Gōngyuán zài yīyuàn hòumiàn.","Парк позади больницы."]},{"topic":"Мой город","grammar":"离 + близко / далеко","statement":["我家离学校很近。","Wǒ jiā lí xuéxiào hěn jìn.","Мой дом близко от школы."],"question":["你家离学校远吗？","Nǐ jiā lí xuéxiào yuǎn ma?","Твой дом далеко от школы?"],"answer":["不远，很近。","Bù yuǎn, hěn jìn.","Не далеко, близко."]},{"topic":"Транспорт и дорога","grammar":"坐 + транспорт","statement":["我坐地铁去上班。","Wǒ zuò dìtiě qù shàngbān.","Я еду на работу на метро."],"question":["你怎么去上班？","Nǐ zěnme qù shàngbān?","Как ты добираешься до работы?"],"answer":["我坐地铁去上班。","Wǒ zuò dìtiě qù shàngbān.","Еду на метро."]},{"topic":"Транспорт и дорога","grammar":"从…到…","statement":["我从家到公司坐公交车。","Wǒ cóng jiā dào gōngsī zuò gōngjiāochē.","От дома до компании я еду на автобусе."],"question":["你从家到公司怎么去？","Nǐ cóng jiā dào gōngsī zěnme qù?","Как ты добираешься от дома до компании?"],"answer":["我坐公交车。","Wǒ zuò gōngjiāochē.","Я еду на автобусе."]},{"topic":"Транспорт и дорога","grammar":"需要 + время","statement":["到机场需要一个小时。","Dào jīchǎng xūyào yí ge xiǎoshí.","До аэропорта нужен час."],"question":["到机场需要多久？","Dào jīchǎng xūyào duōjiǔ?","Сколько времени нужно до аэропорта?"],"answer":["需要一个小时。","Xūyào yí ge xiǎoshí.","Нужен один час."]},{"topic":"В кафе и ресторане","grammar":"想 / 要 + блюдо","statement":["我想要一碗面条。","Wǒ xiǎng yào yì wǎn miàntiáo.","Я хочу миску лапши."],"question":["你想吃什么？","Nǐ xiǎng chī shénme?","Что ты хочешь съесть?"],"answer":["我想要一碗面条。","Wǒ xiǎng yào yì wǎn miàntiáo.","Я хочу миску лапши."]},{"topic":"В кафе и ресторане","grammar":"Счётные слова 杯 / 碗","statement":["请给我一杯茶。","Qǐng gěi wǒ yì bēi chá.","Дайте, пожалуйста, чашку чая."],"question":["你想喝什么？","Nǐ xiǎng hē shénme?","Что ты хочешь пить?"],"answer":["请给我一杯茶。","Qǐng gěi wǒ yì bēi chá.","Дайте мне чашку чая, пожалуйста."]},{"topic":"В кафе и ресторане","grammar":"还要 / 买单","statement":["我还要一碗汤。","Wǒ hái yào yì wǎn tāng.","Я хочу ещё миску супа."],"question":["还要什么？","Hái yào shénme?","Что-нибудь ещё?"],"answer":["我还要一碗汤。","Wǒ hái yào yì wǎn tāng.","Ещё миску супа."]},{"topic":"Покупки и цены","grammar":"多少钱？","statement":["这件衣服多少钱？","Zhè jiàn yīfu duōshao qián?","Сколько стоит эта вещь?"],"question":["这件衣服多少钱？","Zhè jiàn yīfu duōshao qián?","Сколько стоит эта вещь?"],"answer":["一百块。","Yì bǎi kuài.","Сто юаней."]},{"topic":"Покупки и цены","grammar":"太…了","statement":["这件衣服太贵了。","Zhè jiàn yīfu tài guì le.","Эта одежда слишком дорогая."],"question":["你喜欢这件衣服吗？","Nǐ xǐhuan zhè jiàn yīfu ma?","Тебе нравится эта вещь?"],"answer":["喜欢，但是太贵了。","Xǐhuan, dànshì tài guì le.","Нравится, но слишком дорого."]},{"topic":"Покупки и цены","grammar":"A 比 B + прилагательное","statement":["这个比那个便宜。","Zhège bǐ nàge piányi.","Этот дешевле того."],"question":["哪个更便宜？","Nǎ ge gèng piányi?","Какой дешевле?"],"answer":["这个比那个便宜。","Zhège bǐ nàge piányi.","Этот дешевле."]},{"topic":"Друзья и встречи","grammar":"星期 + день","statement":["我们星期六见面吧。","Wǒmen xīngqīliù jiànmiàn ba.","Давай встретимся в субботу."],"question":["你星期六有空吗？","Nǐ xīngqīliù yǒu kòng ma?","Ты свободен в субботу?"],"answer":["有空，我们见面吧。","Yǒu kòng, wǒmen jiànmiàn ba.","Свободен, давай встретимся."]},{"topic":"Друзья и встречи","grammar":"什么时候 / 几点","statement":["我们几点见面？","Wǒmen jǐ diǎn jiànmiàn?","Во сколько встретимся?"],"question":["我们什么时候见面？","Wǒmen shénme shíhou jiànmiàn?","Когда мы встретимся?"],"answer":["星期六下午三点。","Xīngqīliù xiàwǔ sān diǎn.","В субботу в три дня."]},{"topic":"Друзья и встречи","grammar":"吧 + предложение","statement":["我们一起去公园吧。","Wǒmen yìqǐ qù gōngyuán ba.","Давай вместе пойдём в парк."],"question":["你想去公园吗？","Nǐ xiǎng qù gōngyuán ma?","Хочешь пойти в парк?"],"answer":["好，我们一起去吧。","Hǎo, wǒmen yìqǐ qù ba.","Хорошо, пойдём вместе."]},{"topic":"Вчера и мой опыт","grammar":"了 и завершённое действие","statement":["我昨天看了电影。","Wǒ zuótiān kàn le diànyǐng.","Я вчера посмотрел фильм."],"question":["你昨天做什么了？","Nǐ zuótiān zuò shénme le?","Что ты вчера делал?"],"answer":["我昨天看了电影。","Wǒ zuótiān kàn le diànyǐng.","Вчера смотрел фильм."]},{"topic":"Вчера и мой опыт","grammar":"没 / 没有 + глагол","statement":["我昨天没有上班。","Wǒ zuótiān méiyǒu shàngbān.","Я вчера не работал."],"question":["你昨天上班了吗？","Nǐ zuótiān shàngbān le ma?","Ты вчера работал?"],"answer":["没有，我昨天没有上班。","Méiyǒu, wǒ zuótiān méiyǒu shàngbān.","Нет, вчера не работал."]},{"topic":"Вчера и мой опыт","grammar":"Глагол + 过","statement":["我去过上海。","Wǒ qù guo Shànghǎi.","Я бывал в Шанхае."],"question":["你去过上海吗？","Nǐ qù guo Shànghǎi ma?","Ты когда-нибудь бывал в Шанхае?"],"answer":["去过，我去过上海。","Qù guo, wǒ qù guo Shànghǎi.","Да, бывал."]},{"topic":"Планы и будущее","grammar":"打算 + действие","statement":["我打算下个月去上海。","Wǒ dǎsuàn xià ge yuè qù Shànghǎi.","Я собираюсь в Шанхай в следующем месяце."],"question":["你下个月打算做什么？","Nǐ xià ge yuè dǎsuàn zuò shénme?","Что ты собираешься делать в следующем месяце?"],"answer":["我打算去上海。","Wǒ dǎsuàn qù Shànghǎi.","Собираюсь в Шанхай."]},{"topic":"Планы и будущее","grammar":"因为…所以…","statement":["因为我喜欢中文，所以我每天学习。","Yīnwèi wǒ xǐhuan Zhōngwén, suǒyǐ wǒ měitiān xuéxí.","Поскольку мне нравится китайский, я занимаюсь каждый день."],"question":["你为什么学习中文？","Nǐ wèishénme xuéxí Zhōngwén?","Почему ты учишь китайский?"],"answer":["因为我喜欢中文。","Yīnwèi wǒ xǐhuan Zhōngwén.","Потому что мне нравится китайский."]},{"topic":"Планы и будущее","grammar":"如果…就…","statement":["如果明天有空，我就去公园。","Rúguǒ míngtiān yǒu kòng, wǒ jiù qù gōngyuán.","Если завтра будет время, я пойду в парк."],"question":["如果明天有空，你做什么？","Rúguǒ míngtiān yǒu kòng, nǐ zuò shénme?","Если завтра будет свободное время, что ты сделаешь?"],"answer":["我就去公园。","Wǒ jiù qù gōngyuán.","Тогда пойду в парк."]}];
const courseLinkedExamples563=[["先吃饭，然后休息。","Xiān chīfàn, ránhòu xiūxi.","Сначала поедим, потом отдохнём.",["你想吃什么？","Nǐ xiǎng chī shénme?","Что хочешь съесть?"]],["吃饭以后去散步。","Chīfàn yǐhòu qù sànbù.","После еды пойдём гулять.",["你喜欢散步吗？","Nǐ xǐhuan sànbù ma?","Ты любишь гулять?"]],["因为下雨，我不出去。","Yīnwèi xià yǔ, wǒ bù chūqù.","Поскольку идёт дождь, я не выхожу.",["你在家做什么？","Nǐ zài jiā zuò shénme?","Что делаешь дома?"]],["我很累，所以想休息。","Wǒ hěn lèi, suǒyǐ xiǎng xiūxi.","Я устал, поэтому хочу отдохнуть.",["那你休息一下吧。","Nà nǐ xiūxi yíxià ba.","Тогда немного отдохни."]],["我想去，但是没时间。","Wǒ xiǎng qù, dànshì méi shíjiān.","Хочу пойти, но нет времени.",["你什么时候有空？","Nǐ shénme shíhou yǒu kòng?","Когда ты свободен?"]],["如果下雨，我们就不去。","Rúguǒ xià yǔ, wǒmen jiù bú qù.","Если пойдёт дождь, мы не пойдём.",["那我们在家做什么？","Nà wǒmen zài jiā zuò shénme?","Тогда что мы будем делать дома?"]],["我已经吃过了。","Wǒ yǐjīng chī guo le.","Я уже поел.",["你吃了什么？","Nǐ chī le shénme?","Что ты ел?"]],["我还想喝茶。","Wǒ hái xiǎng hē chá.","Я ещё хочу чаю.",["你喜欢喝茶吗？","Nǐ xǐhuan hē chá ma?","Ты любишь чай?"]],["他又迟到了。","Tā yòu chídào le.","Он снова опоздал.",["他为什么迟到？","Tā wèishénme chídào?","Почему он опоздал?"]]];
function linkedCourseTurn564(s){
 // Finite reviewed slots: require all clauses to match, not just a keyword.
 const actions={
 起床:['qǐchuáng','встаю'],洗脸:['xǐliǎn','умываюсь'],刷牙:['shuāyá','чищу зубы'],吃早饭:['chī zǎofàn','завтракаю'],吃饭:['chīfàn','ем'],喝咖啡:['hē kāfēi','пью кофе'],喝茶:['hē chá','пью чай'],去上班:['qù shàngbān','иду на работу'],上班:['shàngbān','иду на работу'],下班:['xiàbān','заканчиваю работу'],工作:['gōngzuò','работаю'],学习中文:['xuéxí Zhōngwén','учу китайский'],学中文:['xué Zhōngwén','учу китайский'],看书:['kàn shū','читаю'],听音乐:['tīng yīnyuè','слушаю музыку'],跑步:['pǎobù','бегаю'],去散步:['qù sànbù','иду гулять'],散步:['sànbù','гуляю'],休息:['xiūxi','отдыхаю'],睡觉:['shuìjiào','ложусь спать'],看电影:['kàn diànyǐng','смотрю фильм'],洗澡:['xǐzǎo','принимаю душ']
 };
 const clocks={早上:['zǎoshang','утром'],晚上:['wǎnshang','вечером'],每天:['měitiān','каждый день'],今天:['jīntiān','сегодня'],明天:['míngtiān','завтра']};
 // Three or four actions, including a reviewed clock expression before the first action.
 const multi=/^(我)?(每天早上|每天晚上|早上|晚上|每天|今天|明天)?([六七八九十]点(?:半)?)?(先)?(.+)$/u.exec(s);
 if(multi){
  const [,who,when,time,first,tail]=multi,parts=tail.split(/(然后|再)/u);
  if(parts.length>=3&&parts.length<=7&&parts.length%2===1&&(parts.length>3||time||when?.startsWith('每天')&&when.length>2)){
   const picked=parts.filter((_,i)=>i%2===0).map(k=>actions[k.replace(/^我/u,'')]);
   if(picked.every(Boolean)){
    const timePy=time?({'六':'liù','七':'qī','八':'bā','九':'jiǔ','十':'shí'}[time[0]]+' diǎn'+(time.endsWith('半')?' bàn':'')):'';
    const timeRu=time?('в '+({'六':'6','七':'7','八':'8','九':'9','十':'10'}[time[0]])+(time.endsWith('半')?':30':':00')):'';
    const period=when==='每天早上'?['měitiān zǎoshang','каждое утро']:when==='每天晚上'?['měitiān wǎnshang','каждый вечер']:when?clocks[when]:[];
    const p=[who?'wǒ':'',period[0],timePy,first?'xiān':'',picked[0][0]].filter(Boolean).join(' ');
    const ru=[period[1],timeRu,first?'сначала':'',picked[0][1]].filter(Boolean).join(' ');
    const py=p+parts.filter((_,i)=>i%2===1).map((j,i)=>', '+(j==='然后'?'ránhòu':'zài')+' '+picked[i+1][0]).join('');
    const translation=ru+picked.slice(1).map(x=>', затем '+x[1]).join('');
    return {pinyin:py[0].toUpperCase()+py.slice(1)+'.',translation:translation[0].toUpperCase()+translation.slice(1)+'.',reply:['然后呢？','Ránhòu ne?','А потом?'],grammar:'sequence'};
   }
  }
 }
 const m=/^(我)?(早上|晚上|每天|今天|明天)?(先)?(.+?)(然后|再|以后|之后)(?:我)?(.+)$/u.exec(s);
 if(m){
  const [,who,when,first,left,join,right]=m, a=actions[left],b=actions[right];
  if(a&&b&&!(first&&['以后','之后'].includes(join))){
   const j={然后:['ránhòu','потом'],再:['zài','затем'],以后:['yǐhòu','после этого'],之后:['zhīhòu','после этого']}[join];
   const whenParts=when?clocks[when]:[];
   const py=[who?'wǒ':'',whenParts[0],first?'xiān':'',a[0]+',',j[0],b[0]].filter(Boolean).join(' ');
   const ru=[whenParts[1],first?'сначала':'',a[1]+',',j[1],b[1]].filter(Boolean).join(' ');
   const follow=right==='睡觉'?['你几点睡觉？','Nǐ jǐ diǎn shuìjiào?','Во сколько ложишься спать?']:right==='去上班'||right==='上班'?['你几点去上班？','Nǐ jǐ diǎn qù shàngbān?','Во сколько идёшь на работу?']:right==='吃早饭'?['你早上吃什么？','Nǐ zǎoshang chī shénme?','Что ешь утром?']:['然后呢？','Ránhòu ne?','А потом?'];
   return {pinyin:py[0].toUpperCase()+py.slice(1)+'.',translation:ru[0].toUpperCase()+ru.slice(1)+'.',reply:follow,grammar:'sequence'};
  }
 }
 const clauses={我喜欢中文:['wǒ xǐhuan Zhōngwén','мне нравится китайский'],我每天学习:['wǒ měitiān xuéxí','я занимаюсь каждый день'],我每天学中文:['wǒ měitiān xué Zhōngwén','я каждый день учу китайский'],我很累:['wǒ hěn lèi','я устал(а)'],我很忙:['wǒ hěn máng','я занят(а)'],下雨:['xià yǔ','идёт дождь'],明天有空:['míngtiān yǒu kòng','завтра будет время'],我有空:['wǒ yǒu kòng','у меня есть время'],我想去:['wǒ xiǎng qù','я хочу пойти'],我没时间:['wǒ méi shíjiān','у меня нет времени'],没时间:['méi shíjiān','нет времени'],我不出去:['wǒ bù chūqù','я не выхожу'],想休息:['xiǎng xiūxi','хочу отдохнуть'],我想休息:['wǒ xiǎng xiūxi','я хочу отдохнуть'],我就去公园:['wǒ jiù qù gōngyuán','я пойду в парк'],我们就不去:['wǒmen jiù bú qù','мы не пойдём'],我就学中文:['wǒ jiù xué Zhōngwén','я буду учить китайский'],我就休息:['wǒ jiù xiūxi','я отдохну']};
 const forms=[[/^因为(.+?)所以(.+)$/u,'Yīnwèi','suǒyǐ','Поскольку','поэтому','cause'],[/^(.+?)所以(.+)$/u,'','suǒyǐ','','поэтому','cause'],[/^如果(.+?)(我就.+|我们就.+)$/u,'Rúguǒ','','Если','','condition'],[/^(.+?)但是(.+)$/u,'','dànshì','','но','contrast']];
 for(const [re,prefix,connector,ruPrefix,ruConnector,grammar] of forms){const match=re.exec(s);if(!match||!clauses[match[1]]||!clauses[match[2]])continue;const a=clauses[match[1]],b=clauses[match[2]];const py=[prefix,a[0]+',',connector,b[0]].filter(Boolean).join(' ');const ru=[ruPrefix,a[1]+',',ruConnector,b[1]].filter(Boolean).join(' ');const reply=match[2].endsWith('休息')?['那你休息一下吧。','Nà nǐ xiūxi yíxià ba.','Тогда немного отдохни.']:match[2].includes('中文')||match[2].includes('学习')?['你学中文多久了？','Nǐ xué Zhōngwén duōjiǔ le?','Как давно учишь китайский?']:match[2].includes('公园')?['你喜欢去公园吗？','Nǐ xǐhuan qù gōngyuán ma?','Ты любишь ходить в парк?']:['你接下来想做什么？','Nǐ jiēxiàlái xiǎng zuò shénme?','Что хочешь делать дальше?'];return {pinyin:py[0].toUpperCase()+py.slice(1)+'.',translation:ru[0].toUpperCase()+ru.slice(1)+'.',reply,grammar};}
 return null;
}
function courseConversation563(raw,s){
 const row=courseGapQuestions563.find(x=>x[0]===s);
 if(row)return {...result(raw,row[1],row[2],row.slice(3),null,1),kind:'question',domain:'everyday'};
 const linked=linkedCourseTurn564(s);
 if(linked)return {...result(raw,linked.pinyin,linked.translation,linked.reply,null,1),domain:'everyday',grammar:linked.grammar};
 for(const [zh,py,ru,reply] of courseLinkedExamples563)if(norm(zh)===s)return {...result(raw,py,ru,reply,null,1),domain:'everyday',grammar:'course-example'};
 for(const item of courseScenes563){
  if(norm(item.question[0])===s){const out={...result(raw,item.question[1],item.question[2],item.answer,null,1),kind:'question',domain:'everyday',grammar:item.grammar};out.message='Учебный диалог по курсу. Тоны не оценивались.';return out;}
  if(norm(item.statement[0])===s){const isQuestion=/[？?]$/.test(item.statement[0]);const out={...result(raw,item.statement[1],item.statement[2],isQuestion?item.answer:item.question,null,1),kind:isQuestion?'question':'statement',domain:'everyday',grammar:item.grammar};if(isQuestion)out.message='Учебный диалог по курсу. Тоны не оценивались.';return out;}
 }
 return null;
}
export function respondToNaturalStatement(raw,{awaiting=null,introduced=false}={}){
 const s=norm(raw);if(!s)return null;
 // Live Android report: accept complete health/mood variants, not just one memorized phrase.
 const wellbeing=[["你的健康怎么样","Nǐ de jiànkāng zěnmeyàng?","Как твоё здоровье?","health"],["你健康怎么样","Nǐ jiànkāng zěnmeyàng?","Как твоё здоровье?","health"],["你的身体怎么样","Nǐ de shēntǐ zěnmeyàng?","Как твоё самочувствие?","health"],["你身体怎么样","Nǐ shēntǐ zěnmeyàng?","Как твоё самочувствие?","health"],["你身体还好吗","Nǐ shēntǐ hái hǎo ma?","Ты хорошо себя чувствуешь?","health"],["你最近身体怎么样","Nǐ zuìjìn shēntǐ zěnmeyàng?","Как ты себя чувствуешь в последнее время?","health"],["你的心情怎么样","Nǐ de xīnqíng zěnmeyàng?","Как твоё настроение?","mood"],["你心情怎么样","Nǐ xīnqíng zěnmeyàng?","Как твоё настроение?","mood"],["你今天心情怎么样","Nǐ jīntiān xīnqíng zěnmeyàng?","Как у тебя сегодня настроение?","mood"],["你今天的心情怎么样","Nǐ jīntiān de xīnqíng zěnmeyàng?","Как у тебя сегодня настроение?","mood"],["你现在心情怎么样","Nǐ xiànzài xīnqíng zěnmeyàng?","Какое у тебя сейчас настроение?","mood"],["你心情好吗","Nǐ xīnqíng hǎo ma?","У тебя хорошее настроение?","mood"]].find(x=>x[0]===s);
 if(wellbeing){const reply=wellbeing[3]==='health'?['我身体很好。','Wǒ shēntǐ hěn hǎo.','У меня хорошее самочувствие.']:['我很开心。','Wǒ hěn kāixīn.','У меня хорошее настроение.'];return {...result(raw,wellbeing[1],wellbeing[2],reply,null,1),kind:'question',domain:'everyday'};}
 // Answer the explicit reciprocal question before context-specific drills.
 const reciprocal565=[["我很好你呢","Wǒ hěn hǎo, nǐ ne?","У меня всё хорошо, а у тебя?"],["很好你呢","Hěn hǎo, nǐ ne?","Хорошо, а у тебя?"],["我很好谢谢你呢","Wǒ hěn hǎo, xièxie, nǐ ne?","У меня всё хорошо, спасибо, а у тебя?"],["我也很好你呢","Wǒ yě hěn hǎo, nǐ ne?","У меня тоже всё хорошо, а у тебя?"],["我很不错你呢","Wǒ hěn búcuò, nǐ ne?","У меня всё довольно хорошо, а у тебя?"],["很不错你呢","Hěn búcuò, nǐ ne?","Довольно хорошо, а у тебя?"],["我非常好你呢","Wǒ fēicháng hǎo, nǐ ne?","У меня всё отлично, а у тебя?"],["我还好你呢","Wǒ hái hǎo, nǐ ne?","У меня нормально, а у тебя?"]].find(x=>x[0]===s);
 if(reciprocal565)return {...result(raw,reciprocal565[1],reciprocal565[2],['我也很好，谢谢！','Wǒ yě hěn hǎo, xièxie!','У меня тоже всё хорошо, спасибо!'],null,1),kind:'question',domain:'everyday'};
 const live565=[["身体不好","Shēntǐ bù hǎo.","Самочувствие плохое.","rest"],["我的身体不好","Wǒ de shēntǐ bù hǎo.","У меня плохое здоровье.","rest"],["我身体不好","Wǒ shēntǐ bù hǎo.","У меня плохое самочувствие.","rest"],["我今天身体不好","Wǒ jīntiān shēntǐ bù hǎo.","Сегодня я плохо себя чувствую.","rest"],["我身体不太好","Wǒ shēntǐ bú tài hǎo.","Я не очень хорошо себя чувствую.","rest"],["我觉得不好","Wǒ juéde bù hǎo.","Мне кажется, что это плохо.","ask"],["我觉得不太好","Wǒ juéde bú tài hǎo.","Мне кажется, что не очень хорошо.","ask"],["我感觉不好","Wǒ gǎnjué bù hǎo.","Я чувствую себя нехорошо.","ask"],["我感觉不舒服","Wǒ gǎnjué bù shūfu.","Я чувствую себя нехорошо.","rest"],["我头痛","Wǒ tóutòng.","У меня болит голова.","rest"],["我头疼","Wǒ tóuténg.","У меня болит голова.","rest"],["今天我头痛","Jīntiān wǒ tóutòng.","Сегодня у меня болит голова.","rest"],["今天我头疼","Jīntiān wǒ tóuténg.","Сегодня у меня болит голова.","rest"],["我今天头痛","Wǒ jīntiān tóutòng.","Сегодня у меня болит голова.","rest"],["我今天头疼","Wǒ jīntiān tóuténg.","Сегодня у меня болит голова.","rest"],["今天我要头痛","Jīntiān wǒ yào tóutòng.","Распознано буквально: сегодня я собираюсь испытывать головную боль.","correction"],["你什么时候","Nǐ shénme shíhou…?","Ты когда…?","when"],["什么时候","Shénme shíhou?","Когда?","when"]].find(x=>x[0]===s);
 if(live565){const kind=live565[3];const reply=kind==='ask'?['怎么了？你想说说吗？','Zěnme le? Nǐ xiǎng shuōshuo ma?','Что случилось? Хочешь рассказать?']:kind==='when'?['你想问我什么时候做什么？','Nǐ xiǎng wèn wǒ shénme shíhou zuò shénme?','Ты хочешь спросить, когда я что-то делаю? Уточни действие.']:['你应该多休息。','Nǐ yīnggāi duō xiūxi.','Тебе стоит больше отдыхать.'];const x={...result(raw,live565[1],live565[2],reply,null,1),domain:'everyday',kind:kind==='when'?'question':'statement'};if(kind==='correction')x.message='Распознано 今天我要头痛. Если речь о головной боли сегодня, естественно: 今天我头痛。 Jīntiān wǒ tóutòng. 要 не нужно. Причина ошибки и тоны по тексту не определяются.';if(kind==='when')x.message='Вопрос не закончен без контекста. Уточни действие: например, 你什么时候起床？';return x;}
 const work=workConversation(raw,s,awaiting);if(work)return work;
 const intro=introductionConversation(raw,s,awaiting);if(intro)return intro;
 const family=familyConversation(raw,s,awaiting);if(family)return family;
 const routine=routineQuestion563(s);if(routine)return {...result(raw,routine.pinyin,routine.translation,routine.reply,null,1),kind:'question',domain:'everyday'};

 // v552 Android screenshots (24 Nov): common compliments and conversational
 // reactions are complete, valid Chinese — never route them to the
 // "say it more simply" fallback. Exact phrases only, no guessed ASR tones.
 if(s==='我爱你'&&introduced)return result(raw,'Wǒ ài nǐ!','Я тебя люблю!',['谢谢你！我很开心！','Xièxie nǐ! Wǒ hěn kāixīn!','Спасибо! Мне очень приятно!'],null,1);
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
 if(awaiting==='job-liking'){
  if(/^(是的|对|喜欢|我喜欢|我喜欢我的工作)$/.test(s))
   return result(raw,null,'Да, работа нравится.',
    ['太好了！你工作忙吗？','Tài hǎo le! Nǐ gōngzuò máng ma?','Здорово! У тебя много работы?'],'work-busy');
  if(/^(不喜欢|我不喜欢|不是|我不喜欢我的工作)$/.test(s))
   return result(raw,null,'Нет, работа не нравится.',
    ['明白了。你想换工作吗？','Míngbai le. Nǐ xiǎng huàn gōngzuò ma?','Понимаю. Ты хочешь сменить работу?'],'job-change');
 }
 if(awaiting==='work-busy'){
  if(/^(忙|很忙|我很忙|工作很忙|我的工作很忙)$/.test(s))
   return result(raw,null,'На работе много дел.',
    ['辛苦了！你每天几点下班？','Xīnkǔ le! Nǐ měitiān jǐ diǎn xiàbān?','Нелегко! Во сколько ты обычно заканчиваешь работу?'],'after-work');
  if(/^(不忙|我不忙|工作不忙)$/.test(s))
   return result(raw,null,'На работе не очень занят.',
    ['那很好！你下班后喜欢做什么？','Nà hěn hǎo! Nǐ xiàbān hòu xǐhuan zuò shénme?','Хорошо! Чем ты любишь заниматься после работы?'],'after-work');
 }

 // v552: small, reviewed family conversation expansion. Keep Chinese tones
 // in pinyin only; ASR text is not evidence of spoken tone accuracy.
 const relatives={
  哥哥:['gēge','старший брат','старшего брата','старшему брату','他','Моему','один'],
  姐姐:['jiějie','старшая сестра','старшей сестры','старшей сестре','她','Моей','одна'],
  弟弟:['dìdi','младший брат','младшего брата','младшему брату','他','Моему','один'],
  妹妹:['mèimei','младшая сестра','младшей сестры','младшей сестре','她','Моей','одна']
 };
 const smallAges={一:['yí',1],二:['èr',2],三:['sān',3],四:['sì',4],五:['wǔ',5],
  六:['liù',6],七:['qī',7],八:['bā',8],九:['jiǔ',9],十:['shí',10]};
 const ageMatch=/^我(的)?(哥哥|姐姐|弟弟|妹妹)(一|二|三|四|五|六|七|八|九|十)岁$/u.exec(s);
 if(ageMatch){
  const [py,,,dat,person,poss]=relatives[ageMatch[2]];
  const [numPy,num]=smallAges[ageMatch[3]];
  const years=num===1?'год':num>=2&&num<=4?'года':'лет';
  return result(raw,'Wǒ '+(ageMatch[1]?'de ':'')+py+' '+numPy+' suì.',
   poss+' '+dat+' '+num+' '+years+'.',
   ['你'+ageMatch[2]+ageMatch[3]+'岁！'+person+'喜欢做什么？',
    'Nǐ '+py+' '+numPy+' suì! Tā xǐhuan zuò shénme?',
    (person==='她'?'Твоей ':'Твоему ')+dat+' '+num+' '+years+'! Что '+(person==='她'?'она':'он')+' любит делать?'],
   'family-hobby',6);
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
  return result(raw,no?'Wǒ méiyǒu '+py+'.':'Wǒ yǒu '+(one?'yí ge ':'')+py+'.',
   no?'У меня нет '+gen+'.':'У меня есть '+(one?oneWord+' ':'')+nom+'.',
   no?['明白了。你家有几口人？','Míngbai le. Nǐ jiā yǒu jǐ kǒu rén?','Понятно. Сколько человек в твоей семье?']:
   ['你'+familyHave[2]+'几岁？','Nǐ '+py+' jǐ suì?', 'Сколько лет '+(person==='她'?'твоей ':'твоему ')+dat+'?'],
   no?'family-size':'family-age',6);
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
 return everydayConversation556(raw,s,awaiting)||courseConversation563(raw,s);
}
