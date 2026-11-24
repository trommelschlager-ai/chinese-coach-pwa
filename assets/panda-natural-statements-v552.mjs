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
export function respondToNaturalStatement(raw,{awaiting=null}={}){
 const s=norm(raw);if(!s)return null;

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
