// Panda AI v544. Reviewed Mandarin beginner statements and short contextual replies.
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
 // Unknown Chinese names: never invent pronunciation or acoustic tone evidence.
 const name=/^我叫([\p{Script=Han}]{1,6})$/u.exec(s);
 if(name)return result(raw,null,'Меня зовут '+name[1]+'.',
  ['很高兴认识你！你是老师还是学生？','Hěn gāoxìng rènshi nǐ! Nǐ shì lǎoshī háishi xuésheng?','Рад познакомиться! Ты учитель или студент?'],'job-role');
 return null;
}
