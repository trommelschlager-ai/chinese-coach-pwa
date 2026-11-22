/* Panda Go · bounded Chinese conversation v16 (no external AI service).
   Speak only with an approved exact MP3 match; all other answers remain text.
   A session-local context permits short follow-ups; it stores no personal data. */
const tidy=x=>String(x??'').normalize('NFC').replace(/[。！!，,？?\s]/gu,'').trim();
const response=(zh,py,ru,awaiting=null)=>({kind:'reply',line:[zh,py,ru],awaiting,supported:true});
const unknown=()=>({
 kind:'unsupported',
 line:[
  '这个问题我还不会回答。我们可以聊名字、爱好、吃饭和学习中文。',
  'Zhège wèntí wǒ hái bú huì huídá. Wǒmen kěyǐ liáo míngzi, àihào, chīfàn hé xuéxí Zhōngwén.',
  'На этот вопрос я пока не умею ответить. Можем поговорить об имени, увлечениях, еде и изучении китайского.'
 ],
 awaiting:null,supported:false
});
const LIKES=/音乐|唱歌|跳舞|跑步|运动|看书|读书|汉语|中文|学习|学中文|打篮球|踢足球|做饭|做菜|旅游|旅行|电影|咖啡|茶|游戏|睡觉|熊猫|画画|游泳|逛街|米饭|面条|苹果|饺子|竹子/u;
function nextContext(context,awaiting){
 const x=context&&typeof context==='object'?context:{};
 return {awaiting:awaiting||null,turn:Math.min(100,(Number(x.turn)||0)+1)};
}
// Resolve elliptical turns against the last conversational subject.
const pandaPreferences = {
 water: ['是，我每天喝水。','Shì, wǒ měitiān hē shuǐ.','Да, я каждый день пью воду.'],
 drink: ['我喜欢喝茶。','Wǒ xǐhuan hē chá.','Я люблю пить чай.'],
 food: ['我喜欢吃竹子。','Wǒ xǐhuan chī zhúzi.','Я люблю есть бамбук.'],
 mood: ['我很开心。','Wǒ hěn kāixīn.','Я очень рада.']
};
const teaAmount=['我喝了两杯茶。','Wǒ hē le liǎng bēi chá.','Я выпила две чашки чая.'];
export function breakfastReply(s,context){
 const awaiting=context?.awaiting;
 if(s==='早上好')return response('你吃饭了吗？','Nǐ chīfàn le ma?','Ты уже поел?','breakfastToday');
 if(/^(?:我)?(?:今天|早上|今天早上)?(?:没(?:有)?吃(?:早餐|早饭)?|没吃饭)?只喝(?:了)?茶$/u.test(s))
  return response('你喝的是什么茶？','Nǐ hē de shì shénme chá?','Какой чай ты пил?','teaType');
 if(awaiting==='teaType'&&/^(?:我喝的?是?|是)?(?:绿茶|红茶|花茶|乌龙茶)$/u.test(s))
  return response(...teaAmount,'teaAmount');
 if(/^(?:那)?你(?:今天|早上|今天早上)?喝(?:了什么|了几杯茶|什么了)$/u.test(s)||
   (awaiting==='teaAmount'&&s==='你呢'))return response(...teaAmount,'teaAmount');
 if(/^你(?:在(?:哪儿|哪里)|在哪)吃(?:早饭|早餐|饭)$/u.test(s))
  return response('我在家吃饭。','Wǒ zài jiā chīfàn.','Я ем дома.','place');
 if(/^你(?:跟|和)谁(?:一起)?吃(?:早饭|早餐|饭)$/u.test(s))
  return response('我跟朋友一起吃饭。','Wǒ gēn péngyou yìqǐ chīfàn.','Я ем вместе с друзьями.','company');
 if(awaiting==='breakfastToday'){
  if(/^(?:我)?(?:已经)?吃(?:过|了)(?:(?:早饭|早餐|饭)了?)?你呢$|^你呢$/u.test(s))
   return response('吃了，谢谢。','Chī le, xièxie.','Да, уже поела, спасибо.','breakfastToday');
  if(/^(?:我)?(?:还)?没(?:有)?(?:吃(?:早餐|早饭|饭)?)?$/u.test(s))
   return response('你想不想喝茶？','Nǐ xiǎng bu xiǎng hē chá?','Хочешь чаю?','offerTea');
 }
 if(awaiting==='offerTea'&&/^(?:想|想喝|好|不想|不喝|不用了)(?:谢谢)?$/u.test(s))
  return response('好的，我明白了。','Hǎo de, wǒ míngbai le.','Хорошо, я поняла.','breakfastToday');
 if(s==='我喝茶了两杯')return {...response(...teaAmount,'teaAmount'),review:'两杯 стоит перед 茶. Попробуй сказать ещё раз.'};
 if(s==='明天见')return response('明天见！','Míngtiān jiàn!','До завтра!');
 return null;
}
function everydayReply(s,context){
 if(s==='你早上做什么')return response('我早上吃早饭。','Wǒ zǎoshang chī zǎofàn.','Утром я завтракаю.','breakfast');
 if(/^(?:我)?(?:早上)?(?:只)?喝水$/u.test(s))return response('你每天喝水吗？','Nǐ měitiān hē shuǐ ma?','Ты каждый день пьёшь воду?','water');
 if(s==='你上午做什么')return response('我上午学习中文。','Wǒ shàngwǔ xuéxí Zhōngwén.','До полудня я учу китайский.','study');
 if(s==='你下午做什么')return response('我下午看书。','Wǒ xiàwǔ kàn shū.','Днём я читаю.','activity');
 if(s==='你晚上做什么')return response('我晚上听音乐。','Wǒ wǎnshang tīng yīnyuè.','Вечером я слушаю музыку.','likes');
 if(context?.awaiting==='study'&&/^(?:我)?也(?:学|学习)(?:中文|汉语)$/u.test(s))
  return response('你觉得中文难吗？','Nǐ juéde Zhōngwén nán ma?','Тебе китайский кажется трудным?','difficulty');
 if(context?.awaiting==='difficulty'&&/^(?:有点难|有一点难|很难|太难了)$/u.test(s))
  return response('没关系，我们慢慢来。','Méi guānxi, wǒmen mànmàn lái.','Ничего, давай потихоньку.','study');
 const reciprocal=s.endsWith('你呢');
 const statement=reciprocal?s.slice(0,-2):s;
 const drink=/^(?:我)?(?:早上|今天)?(?:没有只|只|也|最|很|不)?(?:喜欢|爱)?(?:喝了?)?(?:绿茶|红茶|茶|咖啡|水|牛奶)$/u.test(statement);
 const food=/^(?:我)?(?:也|最|很|不)?(?:喜欢|爱)?(?:吃)?(?:饺子|米饭|面条|苹果|香蕉|蛋糕|竹子)$/u.test(statement);
 const mood=/^(?:我)?(?:今天|现在)?(?:很|非常|特别|有点)?(?:开心|高兴|累)$/u.test(statement);
 const topic=drink?'drink':food?'food':mood?'mood':context?.awaiting;
 if(reciprocal&&(!statement||drink||food||mood)&&Object.hasOwn(pandaPreferences,topic))
  return response(...pandaPreferences[topic],topic);
 if(/^你(?:平时|最|也)?(?:喜欢喝什么|爱喝什么|喜欢喝茶吗)$/u.test(s))
  return response(...pandaPreferences.drink,'drink');
 if(s==='为什么'&&context?.reason==='tea')
  return response('因为茶很好喝。','Yīnwèi chá hěn hǎohē.','Потому что чай вкусный.','drink');
 if(s==='为什么'&&context?.reason==='bamboo')
  return response('因为竹子很好吃。','Yīnwèi zhúzi hěn hǎochī.','Потому что бамбук вкусный.','food');
 if(drink&&!statement.endsWith('水'))return response('你每天都喝吗？','Nǐ měitiān dōu hē ma?','Ты пьёшь это каждый день?','drink');
 if(drink)return response('你每天喝水吗？','Nǐ měitiān hē shuǐ ma?','Ты каждый день пьёшь воду?','water');
 if(['drink','water'].includes(context?.awaiting)&&/^(?:是|对|不|不是|每天|(?:我)?(?:不|每天)?喝(?:水)?)$/u.test(s))
  return response(...pandaPreferences[context.awaiting],context.awaiting);
 if(food)return response('你常吃吗？','Nǐ cháng chī ma?','Ты часто это ешь?','food');
 if(context?.awaiting==='food'&&/^(?:常吃|经常吃|不常吃|有时候吃)$/u.test(s))
  return response(...pandaPreferences.food,'food');
 if(mood&&/(开心|高兴)$/u.test(s))return response('今天有什么好事？','Jīntiān yǒu shénme hǎoshì?','Что хорошего сегодня произошло?','mood');
 if(mood)return response('你想休息吗？','Nǐ xiǎng xiūxi ma?','Хочешь отдохнуть?','mood');
 if(/^(?:我)?(?:现在)?(?:没有工作|没工作|不上班)$/u.test(s))
  return response('那你最近忙什么？','Nà nǐ zuìjìn máng shénme?','А чем ты сейчас занят?','activity');
 return null;
}
/** Supports simple, adult-sounding beginner dialogue; not open-ended LLM output. */
export function respondToPandaChat(input,context=null){
 const s=tidy(input);
 let result=breakfastReply(s,context)||everydayReply(s,context);
 if(result)return withContext(result,context);
 if(!s||s.length>140)result=unknown();
 // Question-first precedence means "你喜欢什么" is never mistaken for "我喜欢..."
 else if(/^(?:你|熊猫|你们)(?:平时|最|也|都)?喜欢(?:做|吃|喝|看|听)?什么/u.test(s)||
         /^你喜欢做什么/u.test(s)){
  if(/喜欢吃什么/u.test(s))result=response('我喜欢吃竹子。你喜欢吃什么？','Wǒ xǐhuan chī zhúzi. Nǐ xǐhuan chī shénme?','Я люблю есть бамбук. А что любишь есть ты?','food');
  else result=response('我喜欢学中文，也喜欢听音乐。你呢？','Wǒ xǐhuan xué Zhōngwén, yě xǐhuan tīng yīnyuè. Nǐ ne?','Мне нравится изучать китайский и слушать музыку. А тебе?','likes');
 }
 else if(/^(?:你|熊猫)(?:叫|的名字是什么|叫什么|叫什么名字)/u.test(s))result=response('我叫熊猫。你叫什么名字？','Wǒ jiào Xióngmāo. Nǐ jiào shénme míngzi?','Меня зовут Панда. А как зовут тебя?','name');
 else if(/^你(?:住在|在哪里住|住哪里|是哪国人|来自哪里|从哪里来)/u.test(s))result=response('我住在山里。你住在哪里？','Wǒ zhù zài shānlǐ. Nǐ zhù zài nǎlǐ?','Я живу в горах. А где живёшь ты?','city');
 else if(/^你(?:在做什么|干什么|现在做什么)/u.test(s))result=response('我在跟你聊天。你呢？','Wǒ zài gēn nǐ liáotiān. Nǐ ne?','Я сейчас разговариваю с тобой. А ты?','activity');
 else if(/^你(?:做什么工作|在哪里工作|上班吗|工作吗)/u.test(s))result=response('我在这里陪你练习中文。你做什么工作？','Wǒ zài zhèlǐ péi nǐ liànxí Zhōngwén. Nǐ zuò shénme gōngzuò?','Я здесь помогаю тебе практиковать китайский. А кем работаешь ты?','work');
 else if(/^你(?:会说中文吗|会中文吗|会说汉语吗|会说什么语言)/u.test(s))result=response('我会说中文。你每天学习中文吗？','Wǒ huì shuō Zhōngwén. Nǐ měitiān xuéxí Zhōngwén ma?','Я говорю по-китайски. А ты учишь китайский каждый день?','study');
 else if(/^你(?:今天|最近)?(?:怎么样|好吗|还好吗)/u.test(s)||s==='你好吗')result=response('我很好，谢谢！你今天怎么样？','Wǒ hěn hǎo, xièxie! Nǐ jīntiān zěnmeyàng?','У меня всё хорошо, спасибо! А как у тебя дела?','mood');
 else if(/^(?:你|你们)(?:今天)?(?:吃早饭了吗|吃饭了吗|吃早饭吗)/u.test(s))result=response('我早上吃早饭。你呢？','Wǒ zǎoshang chī zǎofàn. Nǐ ne?','Я завтракаю по утрам. А ты?','breakfast');
 else if(/^你(?:那里|那边|住的地方)?(?:的)?天气怎么样/u.test(s)||/^(?:你)?知道.*天气/u.test(s))result=response('我不知道你那里的天气。你能告诉我吗？','Wǒ bù zhīdào nǐ nàli de tiānqì. Nǐ néng gàosu wǒ ma?','Я не знаю погоду там, где ты находишься. Расскажешь?','weather');
 else if(/^你(?:(?:喜欢|爱)(?:我|跟我聊天|和我聊天)吗|(?:喜不喜欢|喜欢不喜欢|爱不爱)(?:我|跟我聊天|和我聊天))$/u.test(s))result=response('我喜欢和你聊天。','Wǒ xǐhuan hé nǐ liáotiān.','Мне нравится с тобой разговаривать.','friendly-chat');
 else if(/^你(?:几岁|多大)/u.test(s))result=response('我的年龄是个秘密。你呢？','Wǒ de niánlíng shì ge mìmì. Nǐ ne?','Мой возраст — секрет. А тебе сколько лет?','age');
 else if(/^(?:你好|您好|哈喽|嗨|早上好|下午好|晚上好)$/u.test(s))result=response('你好！你今天怎么样？','Nǐ hǎo! Nǐ jīntiān zěnmeyàng?','Привет! Как твои дела сегодня?','mood');
 else if(/^(?:谢谢|谢谢你|非常感谢|多谢)$/u.test(s))result=response('不客气！你还想练习什么？','Bú kèqi! Nǐ hái xiǎng liànxí shénme?','Пожалуйста! Что ещё хочешь потренировать?','topic');
 else if(/^(?:再见|拜拜|明天见)$/u.test(s))result=response('再见！明天见！','Zàijiàn! Míngtiān jiàn!','Пока! До завтра!',null);
 else if(/^我(?:叫|的名字叫)[\p{Script=Han}A-Za-z]{1,18}$/u.test(s))result=response('你好！你喜欢做什么？','Nǐ hǎo! Nǐ xǐhuan zuò shénme?','Привет! Что любишь делать?','likes');
 else if(/^我(?:不喜欢|不爱)/u.test(s))result=response('我知道了。那你喜欢什么？','Wǒ zhīdào le. Nà nǐ xǐhuan shénme?','Понятно. А что тебе нравится?','likes');
 else if(/^我(?:很)?喜欢/u.test(s))result=response('真好！你还喜欢什么？','Zhēn hǎo! Nǐ hái xǐhuan shénme?','Здорово! А что ещё тебе нравится?','likes');
 else if(/^我(?:住在|来自|是.*人)/u.test(s))result=response('我明白了。你喜欢你住的地方吗？','Wǒ míngbai le. Nǐ xǐhuan nǐ zhù de dìfang ma?','Поняла. Тебе нравится место, где ты живёшь?','city');
 else if(/^我(?:今天|每天|现在|平时)?(?:在)?(?:上班|工作|学习|学中文|吃饭|做饭|喝水|看书|休息|运动|跑步|睡觉)/u.test(s))result=response('我明白了！你今天还想做什么？','Wǒ míngbai le! Nǐ jīntiān hái xiǎng zuò shénme?','Поняла! Что ещё хочешь сделать сегодня?','activity');
 else if(/^我(?:今天|现在)?(?:很累|很好|不太好|很开心|很高兴|很忙|生病了)/u.test(s))result=response('我知道了。你想休息一下吗？','Wǒ zhīdào le. Nǐ xiǎng xiūxi yíxià ma?','Понятно. Хочешь немного отдохнуть?','mood');
 else if(/^我(?:早上)?(?:不吃|吃)(?:早饭|早餐)/u.test(s))result=response('明白了。你喜欢吃什么？','Míngbai le. Nǐ xǐhuan chī shénme?','Поняла. А что ты любишь есть?','food');
 else if(/^(?:我)?(?:喜欢|不喜欢)?(?:吃)?(?:竹子|饺子|面条|米饭|苹果|香蕉|蛋糕|咖啡|茶)$/u.test(s))result=response('听起来不错！你还喜欢吃什么？','Tīng qǐlái búcuò! Nǐ hái xǐhuan chī shénme?','Звучит неплохо! Что ещё любишь есть?','food');
 else if(/^(?:我)?(?:音乐|电影|看书|读书|跑步|运动|游泳|旅游|唱歌|画画|学中文)$/u.test(s))result=response('真好！你每天都喜欢做这件事吗？','Zhēn hǎo! Nǐ měitiān dōu xǐhuan zuò zhè jiàn shì ma?','Здорово! Тебе нравится делать это каждый день?','likes');
 else if((s==='是'||s==='不是'||s==='喜欢'||s==='不喜欢'||s==='会'||s==='不会'||s==='好'||s==='不好')&&context?.awaiting)result=response('明白了！你还想聊什么？','Míngbai le! Nǐ hái xiǎng liáo shénme?','Поняла! О чём ещё хочешь поговорить?','topic');
 else result=unknown();
 return withContext(result,context);
}
function withContext(result,context){
 const next=nextContext(context,result.awaiting);
 if(result.line[0].startsWith('我喜欢喝茶'))next.reason='tea';
 if(result.line[0].startsWith('我喜欢吃竹子'))next.reason='bamboo';
 return {...result,context:next};
}
