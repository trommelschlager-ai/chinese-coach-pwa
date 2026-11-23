// v515: bounded everyday intents, original learner words preserved.
const norm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const places={
 俄罗斯:['Éluósī','Россия','России','России',1],中国:['Zhōngguó','Китай','Китае','Китая',1],德国:['Déguó','Германия','Германии','Германии',1],法国:['Fǎguó','Франция','Франции','Франции',1],英国:['Yīngguó','Великобритания','Великобритании','Великобритании',1],美国:['Měiguó','США','США','США',1],吉尔吉斯斯坦:["Jí'ěrjísīsītǎn",'Кыргызстан','Кыргызстане','Кыргызстана',1],荷兰:['Hélán','Нидерланды','Нидерландах','Нидерландов',1],
 莫斯科:['Mòsīkē','Москва','Москве','Москвы'],北京:['Běijīng','Пекин','Пекине','Пекина'],上海:['Shànghǎi','Шанхай','Шанхае','Шанхая'],广州:['Guǎngzhōu','Гуанчжоу','Гуанчжоу','Гуанчжоу'],深圳:['Shēnzhèn','Шэньчжэнь','Шэньчжэне','Шэньчжэня'],圣彼得堡:['Shèng Bǐdébǎo','Санкт-Петербург','Санкт-Петербурге','Санкт-Петербурга'],阿姆斯特丹:['Āmǔsītèdān','Амстердам','Амстердаме','Амстердама']
};
const A={
 city:['你现在住在哪里？','Nǐ xiànzài zhù zài nǎlǐ?','Где ты сейчас живёшь?'],
 thanks:['谢谢你告诉我。','Xièxie nǐ gàosu wǒ.','Спасибо, что рассказал(а).'],
 run:['我喜欢跑步。','Wǒ xǐhuan pǎobù.','Я люблю бегать.'],
 running:['你经常跑步吗？','Nǐ jīngcháng pǎobù ma?','Ты часто бегаешь?'],
 dream:['我想帮助更多人学习中文。','Wǒ xiǎng bāngzhù gèng duō rén xuéxí Zhōngwén.','Я хочу помочь большему числу людей учить китайский.'],
 activity:['我在跟你聊天。','Wǒ zài gēn nǐ liáotiān.','Я сейчас разговариваю с тобой.'],
 movie:['我喜欢喜剧片。','Wǒ xǐhuan xǐjùpiàn.','Я люблю комедии.'],
 clarify:['你说的是什么？','Nǐ shuō de shì shénme?','О каком предмете ты говоришь?'],
 music:['我喜欢听音乐。','Wǒ xǐhuan tīng yīnyuè.','Я люблю слушать музыку.'],
 read:['我喜欢看书。','Wǒ xǐhuan kàn shū.','Я люблю читать.'],
 swim:['我喜欢游泳。','Wǒ xǐhuan yóuyǒng.','Я люблю плавать.'],
 price:['五十块钱。','Wǔshí kuài qián.','Пятьдесят юаней.'],
 count:['有两件。','Yǒu liǎng jiàn.','Есть две штуки.'],
 unknownPrice:['我不知道实际的价格。','Wǒ bù zhīdào shíjì de jiàgé.','Я не знаю реальную цену.'],
 unknownCount:['我不知道实际的数量。','Wǒ bù zhīdào shíjì de shùliàng.','Я не знаю реальное количество.']
};
const Q={
 你的最喜欢爱好是什么:['Nǐ de zuì xǐhuan àihào shì shénme?','Какое у тебя любимое хобби?',A.run,'likes','Исправь текст: 你最喜欢的爱好是什么？'],
 你最喜欢的爱好是什么:['Nǐ zuì xǐhuan de àihào shì shénme?','Какое у тебя любимое хобби?',A.run,'likes'],
 你最喜欢什么爱好:['Nǐ zuì xǐhuan shénme àihào?','Какое увлечение тебе больше всего нравится?',A.run,'likes'],
 你最喜欢做什么:['Nǐ zuì xǐhuan zuò shénme?','Что ты больше всего любишь делать?',A.run,'likes'],
 你的梦想是什么:['Nǐ de mèngxiǎng shì shénme?','О чём ты мечтаешь?',A.dream,'dream'],
 你有什么梦想:['Nǐ yǒu shénme mèngxiǎng?','Какая у тебя мечта?',A.dream,'dream'],
 你在干什么:['Nǐ zài gàn shénme?','Что ты сейчас делаешь?',A.activity,'activity'],
 你在做什么:['Nǐ zài zuò shénme?','Что ты сейчас делаешь?',A.activity,'activity'],
 你现在在干什么:['Nǐ xiànzài zài gàn shénme?','Что ты сейчас делаешь?',A.activity,'activity'],
 你现在在做什么:['Nǐ xiànzài zài zuò shénme?','Что ты сейчас делаешь?',A.activity,'activity'],
 你干什么呢:['Nǐ gàn shénme ne?','Чем ты сейчас занимаешься?',A.activity,'activity'],
 你喜欢什么电影:['Nǐ xǐhuan shénme diànyǐng?','Какие фильмы тебе нравятся?',A.movie,'movie'],
 你最喜欢什么电影:['Nǐ zuì xǐhuan shénme diànyǐng?','Какие фильмы тебе нравятся больше всего?',A.movie,'movie'],
 你喜欢看什么电影:['Nǐ xǐhuan kàn shénme diànyǐng?','Какие фильмы ты любишь смотреть?',A.movie,'movie'],
 你喜欢什么类型的电影:['Nǐ xǐhuan shénme lèixíng de diànyǐng?','Какой жанр кино тебе нравится?',A.movie,'movie'],
 你喜欢看什么类型的电影:['Nǐ xǐhuan kàn shénme lèixíng de diànyǐng?','Какой жанр фильмов ты любишь смотреть?',A.movie,'movie']
};
const H={跑步:['pǎobù','бега',A.run],游泳:['yóuyǒng','плавания',A.swim],看书:['kàn shū','чтения',A.read],听音乐:['tīng yīnyuè','музыки',A.music],看电影:['kàn diànyǐng','кино',['我喜欢看电影。','Wǒ xǐhuan kàn diànyǐng.','Я люблю смотреть фильмы.']]};
const items={'':['',''],这个:['zhège','это'],这个东西:['zhège dōngxi','эта вещь'],那个:['nàge','то'],那个东西:['nàge dōngxi','та вещь'],这件衣服:['zhè jiàn yīfu','эта одежда'],那件衣服:['nà jiàn yīfu','та одежда'],这本书:['zhè běn shū','эта книга'],那本书:['nà běn shū','та книга'],这个苹果:['zhège píngguǒ','это яблоко'],这杯茶:['zhè bēi chá','эта чашка чая'],这杯咖啡:['zhè bēi kāfēi','эта чашка кофе']};

// Accept a bare name ONLY after Panda has explicitly asked 你叫什么名字？.
// A Latin/Cyrillic name has no invented Mandarin reading; known Chinese
// transcriptions can show verified pinyin. This does NOT assess voice tones.
const FRIENDLY_NAME_PINYIN=Object.freeze({
 '安东':['Āndōng','Антон'],'小明':['Xiǎomíng','Сяомин'],
 '小红':['Xiǎohóng','Сяохун'],'安娜':['Ānnà','Анна'],
 '小丽':['Xiǎolì','Сяоли'],'玛丽':['Mǎlì','Мэри']
});
const NOT_NAMES=new Set([
 '你好','你好吗','您好','谢谢','谢谢你','我爱你','很好','我很好',
 '不好','我不好','非常好','今天','明天','昨天','休息','跑步',
 '可以','不可以','不知道','没有','没空','不是','再见','吃饭',
 'привет','здравствуйте','спасибо','пока','да','нет','хорошо',
 'hello','thanks','hi','yes','no','good','fine'
]);
export function extractFriendlyLearnerName(raw){
 const text=String(raw||'').normalize('NFC').trim().replace(/[。！？!?.,，]+$/u,'').trim();
 if(!text)return null;
 const compact=text.replace(/\s+/g,'');
 const explicit=compact.match(/^(?:我叫|我的名字是)([\p{Script=Han}]{1,12})$/u);
 const hanzi=explicit?.[1]||(/^[\p{Script=Han}]{2,4}$/u.test(compact)?compact:null);
 if(hanzi){
  if(NOT_NAMES.has(hanzi))return null;
  const info=FRIENDLY_NAME_PINYIN[hanzi];
  return {name:hanzi,display:info?.[1]||hanzi,pinyin:info?.[0]||null,explicit:!!explicit};
 }
 if(!/^[\p{Script=Latin}\p{Script=Cyrillic}][\p{Script=Latin}\p{Script=Cyrillic}\p{M}' -]{1,39}$/u.test(text))return null;
 if(text.split(/\s+/).length>2||NOT_NAMES.has(text.toLocaleLowerCase()))return null;
 return {name:text,display:text,pinyin:null,explicit:false};
}

export function everydayMeaning(raw,id,context){
 const k=norm(raw);
 const out=(py,ru,reply,awaiting,coachNote,extra={})=>({spoken:[raw,py,ru],reply,context:{...context,awaiting,lastClarification:null,...extra},coachNote});
 // A recognised friendly introduction is a valid beginner utterance.
 // Never treat it as bad pronunciation or invent a new voice recording.
 if(context?.awaiting==='friendly-name'){
  const parsed=extractFriendlyLearnerName(raw);
  if(parsed){
   const py=parsed.pinyin?(parsed.explicit?'Wǒ jiào '+parsed.pinyin+'.':parsed.pinyin+'.'):null;
   return out(py,parsed.explicit?'Меня зовут '+parsed.display+'.':'Имя: '+parsed.display+'.',
    ['很高兴认识你！你今天怎么样？','Hěn gāoxìng rènshi nǐ! Nǐ jīntiān zěnmeyàng?','Рада познакомиться! Как у тебя сегодня дела?'],'friendly-mood');
  }
 }
 if(context?.awaiting==='friendly-mood'){
  if(k==='我很好'||k==='很好')return out(k==='我很好'?'Wǒ hěn hǎo.':'Hěn hǎo.','У меня всё хорошо.',
   ['太好了！你想聊什么？','Tài hǎo le! Nǐ xiǎng liáo shénme?','Здорово! О чём хочешь поговорить?'],'topic');
  if(k==='我不好'||k==='不好')return out(k==='我不好'?'Wǒ bù hǎo.':'Bù hǎo.','У меня дела не очень.',
   ['怎么了？','Zěnme le?','Что случилось?'],'wellbeing');
 }
 if(k==='我爱你')return out('Wǒ ài nǐ!','Я тебя люблю!',
  ['谢谢你！我很开心！你叫什么名字？','Xièxie nǐ! Wǒ hěn kāixīn! Nǐ jiào shénme míngzi?','Спасибо! Мне очень приятно! Как тебя зовут?'],'friendly-name');
 if(Object.hasOwn(Q,k))return out(...Q[k]);
 if(Object.hasOwn(places,k)){const v=places[k];return out(v[0],v[1]+'.',v[4]?A.city:A.thanks,v[4]?'city':'city-known',null,{mentionedPlace:k});}
 const m=k.match(/^我(现在)?住在(.+)$/);if(m&&Object.hasOwn(places,m[2])){const v=places[m[2]];return out('Wǒ '+(m[1]?'xiànzài ':'')+'zhù zài '+v[0]+'.','Я '+(m[1]?'сейчас ':'')+'живу в '+v[2]+'.',A.thanks,'city-known',null,{learnerCity:m[2]});}
 const o=k.match(/^我来自(.+)$/);if(o&&Object.hasOwn(places,o[1])){const v=places[o[1]];return out('Wǒ láizì '+v[0]+'.','Я родом из '+v[3]+'.',A.city,'city',null,{learnerOrigin:o[1]});}
 const h=k.match(/^(那)?(跑步|游泳|看书|听音乐|看电影)(怎么样|好不好)$/);if(h){const v=H[h[2]];return out((h[1]?'Nà, ':'')+v[0]+' '+(h[3]==='怎么样'?'zěnmeyàng?':'hǎo bu hǎo?'),'Как насчёт '+v[1]+'?',h[2]==='跑步'&&context?.awaiting==='topic'?A.running:v[2],h[2]==='跑步'?'run-frequency':'likes');}
 const price=k.match(/^(.*?)(多少钱|多少块钱|多少元)$/);if(price&&Object.hasOwn(items,price[1])){const v=items[price[1]],py={多少钱:'duōshao qián',多少块钱:'duōshao kuài qián',多少元:'duōshao yuán'}[price[2]],role=id===108&&/衣服|本书|苹果|杯/.test(price[1]);return out([v[0],py].filter(Boolean).join(' ')+'?','Сколько стоит'+(v[1]?' '+v[1]:'')+'?',role?A.price:A.clarify,'shopping-object',role?'Учебный пример: цена условная.':null,{shoppingQuestion:'price'});}
 const count=k.match(/^(这个东西|这种东西|这件衣服|这种衣服|这些衣服)?(有)?(多少件|几件)$/);
 if(count){const v={这个东西:['zhège dōngxi','этого товара'],这种东西:['zhè zhǒng dōngxi','этого вида товара'],这件衣服:['zhè jiàn yīfu','этой одежды'],这种衣服:['zhè zhǒng yīfu','этой одежды'],这些衣服:['zhèxiē yīfu','этой одежды'],'':['','']}[count[1]||''];const role=id===108&&/衣服/.test(count[1]||'');return out([v[0],count[2]?'yǒu':'',count[3]==='几件'?'jǐ jiàn':'duōshao jiàn'].filter(Boolean).join(' ')+'?','Сколько единиц'+(v[1]?' '+v[1]:'')+'?',role?A.count:A.clarify,'shopping-object',count[1]==='这个东西'?'Исправь текст: для количества естественнее 这种东西有多少件？; для цены 这个东西多少钱？':role?'Учебный пример: количество условное.':null,{shoppingQuestion:'count'});}
 const products={衣服:['yīfu','Одежда'],书:['shū','Книга'],苹果:['píngguǒ','Яблоко'],茶:['chá','Чай'],咖啡:['kāfēi','Кофе']};
 if(context?.awaiting==='shopping-object'&&Object.hasOwn(products,k)){const v=products[k];return out(v[0],v[1]+'.',context.shoppingQuestion==='count'?(id===108?A.count:A.unknownCount):(id===108?A.price:A.unknownPrice),'shopping',id===108?'Учебный пример: значение условное.':null);}
 return null;
}
