// Panda Go v284 — verified spoken responses to newly added HSK1 prompts.
// Whitelist only lesson-specific responses, never infer a translation or audio
// for an arbitrary utterance. Pinyin is checked orthographically, not acoustically.
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {lookupExtendedQuestion,extendedQuestions} from './panda-hsk1-extensions-v282.mjs?v=284';

const responses=[
 ['我今天很好','Wǒ jīntiān hěn hǎo.','Сегодня у меня всё хорошо.'],
 ['我很好','Wǒ hěn hǎo.','У меня всё хорошо.'],
 ['晚上好我很好','Wǎnshang hǎo, wǒ hěn hǎo.','Добрый вечер! У меня всё хорошо.'],
 ['晚上好','Wǎnshang hǎo.','Добрый вечер!'],
 ['你好我是学生','Nǐ hǎo, wǒ shì xuésheng.','Привет! Я студент.'],
 ['他是学生','Tā shì xuésheng.','Он студент.'],
 ['是他是学生','Shì, tā shì xuésheng.','Да, он студент.'],
 ['不是她是学生','Bú shì, tā shì xuésheng.','Нет, она студентка.'],
 ['她是学生','Tā shì xuésheng.','Она студентка.'],
 ['他们是学生','Tāmen shì xuésheng.','Они студенты.'],
 ['是他们是学生','Shì, tāmen shì xuésheng.','Да, они студенты.'],
 ['她是老师','Tā shì lǎoshī.','Она учитель.'],
 ['我有两个','Wǒ yǒu liǎng ge.','У меня два предмета.'],
 ['十一','Shí yī.','Одиннадцать.'],
 ['三十二','Sānshí èr.','Тридцать два.'],
 ['五个','Wǔ ge.','Пять штук.'],
 ['我今天有空','Wǒ jīntiān yǒu kòng.','Я сегодня свободен.'],
 ['有我今天有空','Yǒu, wǒ jīntiān yǒu kòng.','Да, я сегодня свободен.'],
 ['我星期天有空','Wǒ xīngqītiān yǒu kòng.','В воскресенье я свободен.'],
 ['我星期日有空','Wǒ xīngqīrì yǒu kòng.','В воскресенье я свободен.'],
 ['星期二','Xīngqīèr.','Вторник.'],
 ['我星期六去看电影','Wǒ xīngqīliù qù kàn diànyǐng.','В субботу я пойду в кино.'],
 ['我的生日是三月六号','Wǒ de shēngrì shì sān yuè liù hào.','Мой день рождения — 6 марта.'],
 ['我有爷爷','Wǒ yǒu yéye.','У меня есть дедушка по отцу.'],
 ['有我有爷爷','Yǒu, wǒ yǒu yéye.','Да, у меня есть дедушка по отцу.'],
 ['我有奶奶','Wǒ yǒu nǎinai.','У меня есть бабушка по отцу.'],
 ['我有外婆','Wǒ yǒu wàipó.','У меня есть бабушка по матери.'],
 ['这是我爷爷','Zhè shì wǒ yéye.','Это мой дедушка по отцу.'],
 ['是这是我爷爷','Shì, zhè shì wǒ yéye.','Да, это мой дедушка по отцу.'],
 ['我有妹妹没有弟弟','Wǒ yǒu mèimei, méiyǒu dìdi.','У меня есть младшая сестра, но нет младшего брата.'],
 ['我有弟弟和妹妹','Wǒ yǒu dìdi hé mèimei.','У меня есть младший брат и младшая сестра.'],
 ['今天不下雪','Jīntiān bú xià xuě.','Сегодня снег не идёт.'],
 ['今天下雪','Jīntiān xià xuě.','Сегодня идёт снег.'],
 ['现在不下雨','Xiànzài bú xià yǔ.','Сейчас дождь не идёт.'],
 ['现在下雨','Xiànzài xià yǔ.','Сейчас идёт дождь.'],
 ['冬天很冷','Dōngtiān hěn lěng.','Зимой холодно.'],
 ['今天有风','Jīntiān yǒu fēng.','Сегодня ветрено.'],
 ['今天没有风','Jīntiān méiyǒu fēng.','Сегодня нет ветра.'],
 ['夏天很热','Xiàtiān hěn rè.','Летом жарко.']
];
export const VERIFIED_EXTENSION_RESPONSES=Object.freeze(responses.map(([zh,pinyin,translation])=>Object.freeze({hanzi:zh,pinyin,translation})));
const BY_KEY=new Map(VERIFIED_EXTENSION_RESPONSES.map(x=>[normalize(x.hanzi),x]));
const monthNames=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const chineseDigits=['','一','二','三','四','五','六','七','八','九','十','十一','十二'];
const chineseMonthPy=['','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ','shí','shí yī','shí èr'];

// Translate any reviewed study answer in the correct unlocked lesson, even when
// the learner says it spontaneously rather than as the requested response.
const ALLOWED_IN=new Map();
for(const entry of extendedQuestions())for(const answer of entry.accepted){
 const key=normalize(answer);
 if(!ALLOWED_IN.has(key))ALLOWED_IN.set(key,new Set());
 ALLOWED_IN.get(key).add(entry.lesson);
}
export function recognizeApprovedPhrase(input,allowed=[1]){
 const key=normalize(input),item=BY_KEY.get(key),chapters=ALLOWED_IN.get(key);
 if(!item||!chapters)return null;
 const lesson=allowed.find(id=>chapters.has(id));
 return lesson?{known:true,hanzi:String(input).trim(),pinyin:item.pinyin,translation:item.translation,topic:lesson,exactCourseAnswer:true}:null;
}

export function checkedExtensionReply(input,prompt,allowed=[1],date=new Date()){
 if(!prompt||prompt.intent!=='extension'||!allowed.includes(prompt.lesson))return null;
 const question=lookupExtendedQuestion(prompt.hanzi);
 if(!question||question.lesson!==prompt.lesson)return null;
 const text=normalize(input);
 if(!prompt.accepted?.some(s=>normalize(s)===text))return null;
 let result=BY_KEY.get(text)||null;
 if(!result&&prompt.lesson===5&&normalize(prompt.hanzi)==='现在是几月'){
  const d=new Date(prompt.calendarDate||date);
  if(Number.isNaN(d.getTime()))return null;
  const month=d.getMonth()+1,word=chineseDigits[month];
  if([word+'月','现在'+word+'月','现在是'+word+'月',String(month)+'月','现在'+month+'月','现在是'+month+'月'].some(s=>normalize(s)===text))
   result={hanzi:input,pinyin:(text.startsWith('现在是')?'Xiànzài shì ':text.startsWith('现在')?'Xiànzài ':'')+chineseMonthPy[month]+' yuè.',translation:'Сейчас '+monthNames[month-1]+'.'};
 }
 if(!result)return null;
 return {known:true,hanzi:String(input).trim(),pinyin:result.pinyin,translation:result.translation,topic:prompt.lesson,
   exactCourseAnswer:true};
}
