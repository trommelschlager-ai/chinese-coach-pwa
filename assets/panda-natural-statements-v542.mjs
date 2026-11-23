// v542. Bounded, reviewed beginner statements. Never infer acoustic tones from text.
const norm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const roles={
 老师:['lǎoshī','учитель',['你是老师！你在哪儿工作？','Nǐ shì lǎoshī! Nǐ zài nǎr gōngzuò?','Ты учитель! Где ты работаешь?'],'work-place'],
 学生:['xuésheng','студент',['你是学生！你学什么？','Nǐ shì xuésheng! Nǐ xué shénme?','Ты студент! Что ты изучаешь?'],'study'],
 医生:['yīshēng','врач',['你是医生！你在哪儿工作？','Nǐ shì yīshēng! Nǐ zài nǎr gōngzuò?','Ты врач! Где ты работаешь?'],'work-place'],
 工程师:['gōngchéngshī','инженер',['你是工程师！你在哪儿工作？','Nǐ shì gōngchéngshī! Nǐ zài nǎr gōngzuò?','Ты инженер! Где ты работаешь?'],'work-place']
};
const workplaces={学校:['xuéxiào','школе'],公司:['gōngsī','компании'],医院:['yīyuàn','больнице']};
const hobbies={
 跑步:['pǎobù','бегать',['你经常跑步吗？','Nǐ jīngcháng pǎobù ma?','Ты часто бегаешь?']],
 游泳:['yóuyǒng','плавать',['你经常游泳吗？','Nǐ jīngcháng yóuyǒng ma?','Ты часто плаваешь?']],
 看书:['kàn shū','читать',['你喜欢看什么书？','Nǐ xǐhuan kàn shénme shū?','Какие книги ты любишь читать?']],
 听音乐:['tīng yīnyuè','слушать музыку',['你喜欢什么音乐？','Nǐ xǐhuan shénme yīnyuè?','Какая музыка тебе нравится?']],
 喝咖啡:['hē kāfēi','пить кофе',['你每天喝咖啡吗？','Nǐ měitiān hē kāfēi ma?','Ты каждый день пьёшь кофе?']]
};
const line=([hanzi,pinyin,ru])=>({hanzi,pinyin,ru});
const result=(raw,pinyin,translation,reply,next,topic=2)=>({
 kind:'statement',
 spoken:{known:true,hanzi:raw,pinyin,translation,topic,toneVerified:false},
 reply:line(reply),next,
 message:'Панда поняла смысл. Произношение и тоны голоса не оценивались.'
});
export function respondToNaturalStatement(raw,{awaiting=null}={}){
 const s=norm(raw);if(!s)return null;
 const role=/^我(不)?是(老师|学生|医生|工程师)$/.exec(s);
 if(role){
  const [py,ru,positive,next]=roles[role[2]];
  if(role[1])return result(raw,`Wǒ bú shì ${py}.`,`Я не ${ru}.`,['明白了。你做什么工作？','Míngbai le. Nǐ zuò shénme gōngzuò?','Понятно. Кем ты работаешь?'],'job-role');
  return result(raw,`Wǒ shì ${py}.`,`Я ${ru}.`,positive,next);
 }
 const job=/^我在(学校|公司|医院)工作$/.exec(s);
 if(job){
  const [py,ru]=workplaces[job[1]];
  return result(raw,`Wǒ zài ${py} gōngzuò.`,`Я работаю в ${ru}.`,['你喜欢你的工作吗？','Nǐ xǐhuan nǐ de gōngzuò ma?','Тебе нравится твоя работа?'],'job-liking');
 }
 const interest=/^我(很)?(不)?喜欢(跑步|游泳|看书|听音乐|喝咖啡)$/.exec(s);
 if(interest){
  const [py,ru,followup]=hobbies[interest[3]];
  const p=`Wǒ ${interest[1]?'hěn ':''}${interest[2]?'bù ':''}xǐhuan ${py}.`;
  if(interest[2])return result(raw,p,`Я не люблю ${ru}.`,['你喜欢做什么？','Nǐ xǐhuan zuò shénme?','Чем ты любишь заниматься?'],'hobby',2);
  return result(raw,p,`Я ${interest[1]?'очень ':''}люблю ${ru}.`,followup,'hobby',2);
 }
 // Unknown Chinese names: never invent pronunciation or acoustic tone evidence.
 const name=/^我叫([\p{Script=Han}]{1,6})$/u.exec(s);
 if(name)return result(raw,null,`Меня зовут ${name[1]}.`,['很高兴认识你！你是老师还是学生？','Hěn gāoxìng rènshi nǐ! Nǐ shì lǎoshī háishi xuésheng?','Рад познакомиться! Ты учитель или студент?'],'job-role');
 if(awaiting==='job-liking'){
  if(/^(是的|对|喜欢|我喜欢)$/.test(s))return result(raw,null,'Да, нравится.',['太好了！你工作忙吗？','Tài hǎo le! Nǐ gōngzuò máng ma?','Здорово! У тебя много работы?'],'work-busy');
  if(/^(不喜欢|我不喜欢|不是)$/.test(s))return result(raw,null,'Нет, не нравится.',['明白了。你想换工作吗？','Míngbai le. Nǐ xiǎng huàn gōngzuò ma?','Понимаю. Ты хочешь сменить работу?'],'job-change');
 }
 return null;
}
