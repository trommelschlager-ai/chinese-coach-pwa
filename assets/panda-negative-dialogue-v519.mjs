/* Panda Go v519 — reviewed negative answers and negative learner questions.
 * Preserve the original learner transcript. This is written-language matching,
 * never acoustic tone scoring. Do not generate audio; exact approved MP3 only. */
const norm=x=>String(x||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const spoken=(raw,py,ru)=>({hanzi:String(raw).trim(),pinyin:py,ru});
const panda=(zh,py,ru)=>({hanzi:zh,pinyin:py,ru,audioKey:zh});
const known=(raw,py,ru,ack='好的，我明白了。')=>{
 const responses={
  '好的，我明白了。':['Hǎo de, wǒ míngbai le.','Хорошо, я поняла.'],
  '怎么了？':['Zěnme le?','Что случилось?'],
  '没关系，我们慢慢学。':['Méi guānxi, wǒmen mànmàn xué.','Ничего страшного, будем учиться постепенно.'],
  '好，那我们换个话题。':['Hǎo, nà wǒmen huàn ge huàtí.','Хорошо, давай сменим тему.'],
  '好的，下次再聊。':['Hǎo de, xià cì zài liáo.','Хорошо, поговорим в другой раз.'],
  '不喝也没关系。':['Bù hē yě méi guānxi.','Не хочешь пить — ничего страшного.'],
  '那你喜欢什么？':['Nà nǐ xǐhuan shénme?','А что тебе нравится?'],
  '你想吃点什么？':['Nǐ xiǎng chī diǎn shénme?','Что бы ты хотел поесть?'],
  '很好，继续加油！':['Hěn hǎo, jìxù jiāyóu!','Здорово, продолжай в том же духе!']
 };
 return {kind:'social',spoken:spoken(raw,py,ru),line:panda(ack,...responses[ack]),context:{awaiting:null,lastClarification:null}};
};
const records=[
 // A present habit uses 不; a past action uses 没(有). Do not blur them.
 ['你早上吃早饭吗',[
  ['不吃','Bù chī.','Нет, не завтракаю.'],['我不吃早饭','Wǒ bù chī zǎofàn.','Я не завтракаю.'],['我早上不吃早饭','Wǒ zǎoshang bù chī zǎofàn.','Утром я не завтракаю.']]],
 ['你在学校学习吗',[
  ['不在','Bú zài.','Нет, не в школе.'],['我不在学校学习','Wǒ bú zài xuéxiào xuéxí.','Я не учусь в школе.']]],
 ['你会说中文吗',[
  ['不会','Bú huì.','Нет, не умею.'],['我不会说中文','Wǒ bú huì shuō Zhōngwén.','Я не умею говорить по-китайски.']]],
 ['你喜欢运动吗',[
  ['不喜欢','Bù xǐhuan.','Не нравится.'],['我不喜欢运动','Wǒ bù xǐhuan yùndòng.','Я не люблю спорт.']]],
 ['你明天下午有空吗',[
  ['没空','Méi kòng.','Нет свободного времени.'],['没有','Méiyǒu.','Нет, времени не будет.'],['我明天下午没空','Wǒ míngtiān xiàwǔ méi kòng.','Завтра после обеда я занят.'],['我明天下午没有时间','Wǒ míngtiān xiàwǔ méiyǒu shíjiān.','Завтра после обеда у меня нет времени.']]],
 ['你昨天运动了吗',[
  ['没有','Méiyǒu.','Нет, не занимался.'],['没运动','Méi yùndòng.','Не занимался спортом.'],['我昨天没运动','Wǒ zuótiān méi yùndòng.','Вчера я не занимался спортом.'],['我昨天没有运动','Wǒ zuótiān méiyǒu yùndòng.','Вчера я не занимался спортом.']]],
 ['你去过上海吗',[
  ['没有','Méiyǒu.','Нет, не бывал.'],['没去过','Méi qù guo.','Не бывал.'],['我没去过上海','Wǒ méi qù guo Shànghǎi.','Я не бывал в Шанхае.'],['我没有去过上海','Wǒ méiyǒu qù guo Shànghǎi.','Я не бывал в Шанхае.']]],
 ['你今天怎么样',[
  ['不好','Bù hǎo.','Плохо.'],['我不太好','Wǒ bú tài hǎo.','У меня дела не очень.'],['我不舒服','Wǒ bù shūfu.','Мне нездоровится.']]],
 ['周末要不要一起喝咖啡',[
  ['不了','Bù liǎo.','Нет, спасибо.'],['不想','Bù xiǎng.','Не хочу.'],['不喝','Bù hē.','Не хочу кофе.'],['我不想喝咖啡','Wǒ bù xiǎng hē kāfēi.','Я не хочу пить кофе.'],['不好意思我周末没空','Bù hǎoyìsi, wǒ zhōumò méi kòng.','Извини, на выходных я занят.']]],
 ['你在哪里工作',[
  ['我不工作','Wǒ bù gōngzuò.','Я не работаю.'],['我现在不工作','Wǒ xiànzài bù gōngzuò.','Сейчас я не работаю.']]],
 ['你有什么爱好',[
  ['我没有什么爱好','Wǒ méiyǒu shénme àihào.','У меня нет особых увлечений.'],['没有什么爱好','Méiyǒu shénme àihào.','Нет особых увлечений.']]],
 ['你现在想做什么',[
  ['我什么都不想做','Wǒ shénme dōu bù xiǎng zuò.','Мне ничего не хочется делать.']]],
 ['你明天打算做什么',[
  ['我明天什么都不打算做','Wǒ míngtiān shénme dōu bù dǎsuàn zuò.','Завтра я ничего не планирую делать.']]],
 ['你昨天做什么了',[
  ['我昨天没做什么','Wǒ zuótiān méi zuò shénme.','Вчера я почти ничего не делал.'],['我昨天什么都没做','Wǒ zuótiān shénme dōu méi zuò.','Вчера я ничего не делал.']]],
 ['你想买什么',[
  ['我什么都不想买','Wǒ shénme dōu bù xiǎng mǎi.','Я ничего не хочу покупать.']]],
 ['这件衣服怎么样',[
  ['不好看','Bù hǎokàn.','Некрасивая.'],['我不喜欢','Wǒ bù xǐhuan.','Мне не нравится.']]],
 ['你哪儿不舒服',[
  ['我没事','Wǒ méi shì.','Со мной всё хорошо.'],['我没有不舒服','Wǒ méiyǒu bù shūfu.','Я нормально себя чувствую.']]]
];
const bank=new Map(records.map(([q,a])=>[q,new Map(a.map(v=>[v[0],v]))]));
export function negativeAnswerForQuestion(raw,question){
 const s=norm(raw),q=norm(question),candidate=bank.get(q)?.get(s);
 if(candidate)return spoken(raw,candidate[1],candidate[2]);
 // HSK1 open-dialogue questions: infer only the topic stated in the question.
 if(/^你有(哥哥|姐姐|弟弟|妹妹|妈妈|爸爸)吗$|^你有没有(哥哥|姐姐|弟弟|妹妹|妈妈|爸爸)$/.test(q)&&s==='没有')
  return spoken(raw,'Méiyǒu.','Нет, у меня нет.');
 if(q==='你好吗'&&['不好','我不好'].includes(s))return spoken(raw,s==='不好'?'Bù hǎo.':'Wǒ bù hǎo.','У меня дела плохо.');
 if(/^你喜欢.+吗$/.test(q)&&s==='不喜欢')return spoken(raw,'Bù xǐhuan.','Нет, не нравится.');
 if(/^你想.+吗$/.test(q)&&s==='不想')return spoken(raw,'Bù xiǎng.','Не хочу.');
 if(/^你会.+吗$/.test(q)&&s==='不会')return spoken(raw,'Bú huì.','Не умею.');
 if(/^你有.+吗$/.test(q)&&s==='没有')return spoken(raw,'Méiyǒu.','Нет, нет.');
 if(/^你(?:吃|吃饭|吃早饭)了?吗$/.test(q)&&['没吃','还没吃','我还没吃'].includes(s))
  return spoken(raw,s==='我还没吃'?'Wǒ hái méi chī.':s==='还没吃'?'Hái méi chī.':'Méi chī.','Ещё не поел.');
 return null;
}
export function negativeFollowup(raw,context){
 const s=norm(raw),awaiting=context?.awaiting;
 if(!awaiting)return null;
 const match=(answers)=>answers.some(a=>norm(a[0])===s)?answers.find(a=>norm(a[0])===s):null;
 let m;
 if(awaiting==='offerTea'&&(m=match([['不喝','Bù hē.','Не буду пить.'],['不想喝茶','Bù xiǎng hē chá.','Не хочу чая.'],['不用了','Bú yòng le.','Не надо, спасибо.'],['不用','Bú yòng.','Не нужно.'],['不想','Bù xiǎng.','Не хочу.']])))
  return known(raw,m[1],m[2],'不喝也没关系。');
 if(awaiting==='offerRest'&&(m=match([['不想','Bù xiǎng.','Не хочу.'],['不用','Bú yòng.','Не нужно.'],['不用了','Bú yòng le.','Нет, спасибо.'],['我不想休息','Wǒ bù xiǎng xiūxi.','Я не хочу отдыхать.']])))
  return known(raw,m[1],m[2],'好，那我们换个话题。');
 if(awaiting==='conversation'&&(m=match([['不想','Bù xiǎng.','Не хочу.'],['不了','Bù liǎo.','Нет, спасибо.'],['不想聊天','Bù xiǎng liáotiān.','Не хочу болтать.'],['我不想聊天','Wǒ bù xiǎng liáotiān.','Я не хочу разговаривать.']])))
  return known(raw,m[1],m[2],'好的，下次再聊。');
 if(awaiting==='difficulty'&&(m=match([['不难','Bù nán.','Не трудно.'],['我觉得不难','Wǒ juéde bù nán.','Мне кажется, это несложно.']])))
  return known(raw,m[1],m[2],'很好，继续加油！');
 if(awaiting==='mood'&&(m=match([['不好','Bù hǎo.','Плохо.'],['我不好','Wǒ bù hǎo.','У меня дела не очень.'],['我不太好','Wǒ bú tài hǎo.','У меня дела не очень.']])))
  return known(raw,m[1],m[2],'怎么了？');
 if(awaiting==='likes'&&(m=match([['不喜欢','Bù xǐhuan.','Не нравится.'],['我不喜欢运动','Wǒ bù xǐhuan yùndòng.','Я не люблю спорт.'],['我不喜欢听音乐','Wǒ bù xǐhuan tīng yīnyuè.','Я не люблю слушать музыку.'],['我不喜欢跑步','Wǒ bù xǐhuan pǎobù.','Я не люблю бегать.']])))
  return known(raw,m[1],m[2],'那你喜欢什么？');
 return null;
}
export function negativeQuestionFromLearner(raw){
 const q=norm(raw);
 const data={
  '你不喜欢跑步吗':['Nǐ bù xǐhuan pǎobù ma?','Ты не любишь бегать?','喜欢，我喜欢跑步。','Xǐhuan, wǒ xǐhuan pǎobù.','Люблю, мне нравится бегать.'],
  '你不喜欢运动吗':['Nǐ bù xǐhuan yùndòng ma?','Ты не любишь спорт?','喜欢，我喜欢运动。','Xǐhuan, wǒ xǐhuan yùndòng.','Люблю, мне нравится спорт.'],
  '你不喝茶吗':['Nǐ bù hē chá ma?','Ты не пьёшь чай?','喝，我喜欢喝茶。','Hē, wǒ xǐhuan hē chá.','Пью, мне нравится чай.'],
  '你不会说中文吗':['Nǐ bú huì shuō Zhōngwén ma?','Ты не умеешь говорить по-китайски?','会，我会说中文。','Huì, wǒ huì shuō Zhōngwén.','Умею, я говорю по-китайски.'],
  '你不想聊天吗':['Nǐ bù xiǎng liáotiān ma?','Ты не хочешь поболтать?','想，我想和你聊天。','Xiǎng, wǒ xiǎng hé nǐ liáotiān.','Хочу, я хочу с тобой поболтать.']
 };
 const v=data[q];if(!v)return null;
 return {kind:'social',spoken:spoken(raw,v[0],v[1]),line:panda(...v.slice(2)),context:{awaiting:null,lastClarification:null}};
}
export function negativeAcknowledgement(raw,question){
 const q=norm(question),s=norm(raw);
 if(q==='你今天怎么样'||q==='你好吗')return panda('怎么了？','Zěnme le?','Что случилось?');
 if(q==='你会说中文吗')return panda('没关系，我们慢慢学。','Méi guānxi, wǒmen mànmàn xué.','Ничего страшного, будем учиться постепенно.');
 if(/喜欢/.test(q))return panda('那你喜欢什么？','Nà nǐ xǐhuan shénme?','А что тебе нравится?');
 if(/喝咖啡/.test(q))return panda('好的，下次再聊。','Hǎo de, xià cì zài liáo.','Хорошо, поговорим в другой раз.');
 if(/吃饭了吗/.test(q))return panda('你想吃点什么？','Nǐ xiǎng chī diǎn shénme?','Что бы ты хотел поесть?');
 return panda('好的，我明白了。','Hǎo de, wǒ míngbai le.','Хорошо, я поняла.');
}
