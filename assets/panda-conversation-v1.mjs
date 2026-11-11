// Panda Go: guided spoken-dialogue exercises. Pure local logic, no paid AI API.
// Lessons 1/2/6/7 examples are grounded in the approved curriculum.
// The "Как дела?" scene explicitly introduces phrases NOT present in lesson 1.
const freeze=(s)=>Object.freeze(s);
const turn=(panda,pinyin,meaning,accept,expected,explanation,audio='',closing=null)=>freeze({
 panda,pinyin,meaning,accept:freeze(accept),expected,explanation,audio,closing
});
export const SCENES=Object.freeze([
 freeze({id:'hello',lesson:1,title:'Поздороваться',bonus:false,description:'Только слова и фразы из урока 1',
  introduce:freeze([]),turns:freeze([
   turn('你好！','Nǐ hǎo!','Привет!',['你好','nǐ hǎo','ni3 hao3','ní hǎo','ni2 hao3'],'你好！ Nǐ hǎo!','На приветствие отвечаем 你好。','你好'),
   turn('我是学生。','Wǒ shì xuésheng.','Я студент.',['我是学生','wǒ shì xuésheng','wo3 shi4 xue2sheng','wo3 shi4 xue2 sheng5'],'我是学生。Wǒ shì xuésheng.','Повтори знакомое предложение «Я студент».','我是学生')
  ])}),
 freeze({id:'howareyou',lesson:1,title:'Как дела?',bonus:true,description:'Дополнительный диалог: сначала выучим новые фразы',
  introduce:freeze([
   freeze({hanzi:'你好吗？',pinyin:'Nǐ hǎo ma?',meaning:'Как дела?',note:'吗 (ma) — вопросительная частица с нейтральным тоном.'}),
   freeze({hanzi:'我很好。',pinyin:'Wǒ hěn hǎo.',meaning:'У меня всё хорошо.',note:'很 (hěn) здесь связывает «я» и «хорошо», не обязательно «очень».'}),
   freeze({hanzi:'你呢？',pinyin:'Nǐ ne?',meaning:'А у тебя?',note:'呢 (ne) — нейтральный тон.'}),
   freeze({hanzi:'我也很好，谢谢！',pinyin:'Wǒ yě hěn hǎo, xièxie!',meaning:'У меня тоже всё хорошо, спасибо!',note:'也 (yě) — «тоже», 谢谢 (xièxie) — «спасибо».'})
  ]),turns:freeze([
   turn('你好！','Nǐ hǎo!','Привет!',['你好','nǐ hǎo','ni3 hao3','ní hǎo','ni2 hao3'],'你好！ Nǐ hǎo!','Ответь на приветствие.','你好'),
   turn('你好吗？','Nǐ hǎo ma?','Как дела?',['我很好你呢','我很好，你呢','wǒ hěn hǎo nǐ ne','wo3 hen3 hao3 ni3 ne5','wo3 hen3 hao3 ni3 ne'],'我很好，你呢？ Wǒ hěn hǎo, nǐ ne?','Скажи, что у тебя всё хорошо, и спроси «а у тебя?».','',freeze({panda:'我也很好，谢谢！',pinyin:'Wǒ yě hěn hǎo, xièxie!',meaning:'У меня тоже всё хорошо, спасибо!',audio:''}))
  ])}),
 freeze({id:'introduce',lesson:2,title:'Студент или учитель?',bonus:false,description:'Вопросы с 是 / 不是 / 吗 из урока 2',
  introduce:freeze([]),turns:freeze([
   turn('你是学生吗？','Nǐ shì xuésheng ma?','Ты студент?',['我是学生','我是学生。','我不是学生','我不是学生。','wǒ shì xuésheng','wo3 shi4 xue2 sheng5','wǒ bú shì xuésheng','wo3 bu2 shi4 xue2 sheng5'],'我是学生。 / 我不是学生。','Ответь полным предложением: «Я студент» или «Я не студент».',''),
   turn('你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?',['我是老师','我不是老师','wǒ shì lǎoshī','wo3 shi4 lao3 shi1','wǒ bú shì lǎoshī','wo3 bu2 shi4 lao3 shi1'],'我是老师。 / 我不是老师。','Ответь: «Я учитель» или «Я не учитель». В 不 перед 是 четвёртого тона произносим bú.','')
  ])}),
 freeze({id:'numbers',lesson:3,title:'Сколько у тебя?',bonus:false,description:'Числа и счётные слова из урока 3',
  context:'Представь: ты держишь два предмета, и панда спрашивает, сколько их у тебя.',
  introduce:freeze([]),turns:freeze([
   turn('你有几个？','Nǐ yǒu jǐ ge?','Сколько у тебя?',['我有两个','wǒ yǒu liǎng ge','wo3 you3 liang3 ge5'],'我有两个。 Wǒ yǒu liǎng ge.','Ответь: «У меня два».','')
  ])}),
 freeze({id:'weekdays',lesson:4,title:'Какой день недели?',bonus:false,description:'Дни недели из урока 4',
  context:'Представь, что сегодня пятница, а завтра суббота. Это учебный пример, не текущая дата.',
  introduce:freeze([]),turns:freeze([
   turn('今天星期几？','Jīntiān xīngqī jǐ?','Какой сегодня день недели?',['今天星期五','今天是星期五','jīntiān xīngqīwǔ','jin1 tian1 xing1 qi1 wu3','jīntiān shì xīngqīwǔ','jin1 tian1 shi4 xing1 qi1 wu3'],'今天是星期五。 Jīntiān shì xīngqīwǔ.','По условию сегодня пятница.','今天星期几'),
   turn('明天星期几？','Míngtiān xīngqī jǐ?','Какой завтра день недели?',['明天星期六','明天是星期六','míngtiān xīngqīliù','ming2 tian1 xing1 qi1 liu4','míngtiān shì xīngqīliù','ming2 tian1 shi4 xing1 qi1 liu4'],'明天星期六。 Míngtiān xīngqīliù.','После пятницы идёт суббота.','明天星期几')
  ])}),
 freeze({id:'dates',lesson:5,title:'Скажи дату',bonus:false,description:'Месяцы и числа из урока 5',
  context:'Представь, что сегодня 6 ноября. Дата учебная, не сегодняшняя.',
  introduce:freeze([]),turns:freeze([
   turn('今天几月几号？','Jīntiān jǐ yuè jǐ hào?','Какое сегодня число?',['今天十一月六号','今天是十一月六号','jīntiān shíyī yuè liù hào','jin1 tian1 shi2 yi1 yue4 liu4 hao4','jīntiān shì shíyī yuè liù hào','jin1 tian1 shi4 shi2 yi1 yue4 liu4 hao4'],'今天十一月六号。 Jīntiān shíyī yuè liù hào.','Скажи: «Сегодня шестое ноября».','')
  ])}),
 freeze({id:'family',lesson:6,title:'Поговорим о семье',bonus:false,description:'Изученные вопросы из урока 6',
  introduce:freeze([]),turns:freeze([
   turn('这是你妈妈吗？','Zhè shì nǐ māma ma?','Это твоя мама?',['这是我妈妈','这是我妈妈。','zhè shì wǒ māma','zhe4 shi4 wo3 ma1 ma5'],'这是我妈妈。 Zhè shì wǒ māma.','Ответь: «Это моя мама».','这是你妈妈吗'),
   turn('你有妹妹吗？','Nǐ yǒu mèimei ma?','У тебя есть младшая сестра?',['我有一个妹妹','我没有妹妹','wǒ yǒu yí ge mèimei','wo3 you3 yi2 ge5 mei4 mei5','wǒ méiyǒu mèimei','wo3 mei2 you3 mei4 mei5'],'我有一个妹妹。 / 我没有妹妹。','Ответь, есть ли у тебя младшая сестра.','你有妹妹吗')
  ])}),
 freeze({id:'weather',lesson:7,title:'Какая погода?',bonus:false,description:'Представь погоду и ответь по уроку 7',
  introduce:freeze([]),turns:freeze([
   turn('今天天气怎么样？','Jīntiān tiānqì zěnmeyàng?','Какая сегодня погода?',['今天很冷','今天很热','今天下雨','今天下雪','jīntiān hěn lěng','jin1 tian1 hen3 leng3','jīntiān hěn rè','jin1 tian1 hen3 re4','jīntiān xià yǔ','jin1 tian1 xia4 yu3','jīntiān xià xuě','jin1 tian1 xia4 xue3'],'今天很冷。 / 今天很热。 / 今天下雨。 / 今天下雪。','Скажи одно из предложений из урока 7; не ставь 是 перед 冷, 热 или 下雨.','')
  ])})
]);
export function normalizeSpoken(text){
 return String(text??'').trim().normalize('NFC').toLowerCase()
  .replace(/[\s\u3000。、！!？，?.,;；:：\-–—]/g,'')
  .replace(/ё/g,'е');
}
export function findScene(id){return SCENES.find(s=>s.id===id)||null}
export function validateTurn(sceneId,index,text){
 const scene=findScene(sceneId),item=scene?.turns?.[index];
 if(!item)return {ok:false,feedback:'Сначала выбери доступный диалог.'};
 const normalized=normalizeSpoken(text);
 if(!normalized)return {ok:false,feedback:'Попробуй сказать или написать ответ.'};
 if(item.accept.some(answer=>normalizeSpoken(answer)===normalized)){
  return {ok:true,feedback:'✅ Верно! '+item.expected,closing:item.closing||null};
 }
 const noTones=/^[a-z]+$/.test(normalized);
 return {ok:false,feedback:noTones
  ?'Пиньинь без тонов нельзя надёжно проверить. Добавь знаки тонов или ответь иероглифами. '+item.explanation
  :'Пока не совпадает с изученными вариантами. '+item.explanation};
}
