/* Panda Brain v302 — curated HSK1 lexicon, examples, tone guidance and limited sentence parser.
 * Source of truth: window.PANDA_HSK1_FOUNDATIONS (86 lesson entries, 80 distinct).
 * No TTS, model calls, actual weather, invented user facts or permission escalation.
 * All audio paths are resolved by the existing player, never generated here.
 */
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=live6';

const CATEGORY_ROWS=[
 ['местоимение','我 你 他 她 它 我们 你们 他们'],
 ['глагол-связка','是'],
 ['существительное','学生 老师 人 家 天气 风'],
 ['приветствие','你好'],
 ['иероглиф / ключ','口 木'],
 ['иероглиф; день в дате','日'],
 ['числительное','零 一 二 三 四 五 六 七 八 九 十 百'],
 ['обозначение недели','星期'],
 ['день недели','星期一 星期二 星期三 星期四 星期五 星期六 星期天 星期日'],
 ['наречие времени','今天 明天 昨天'],
 ['обозначение даты','年 月 号'],
 ['название месяца','一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月'],
 ['вопросительная частица','吗'],
 ['вопросительное слово','几'],
 ['существительное; родственник','妈妈 爸爸 哥哥 姐姐 弟弟 妹妹'],
 ['притяжательная конструкция','我的'],
 ['глагол','有 没有'],
 ['числительное со счётным словом','一个'],
 ['прилагательное (погода)','冷 热 晴 阴'],
 ['глагольное сочетание','下雨 下雪'],
 ['название времени года','春天 夏天 秋天 冬天']
];
const CATEGORY=new Map();
for(const [category,words] of CATEGORY_ROWS)for(const word of words.split(' ')){
 if(CATEGORY.has(word))throw Error('Duplicate grammatical category: '+word);
 CATEGORY.set(word,category);
}
const NEUTRAL=new Set(['吗','学生','我们','你们','他们','妈妈','爸爸','哥哥','姐姐','弟弟','妹妹','我的','一个']);
const TONE_EXPLANATIONS=Object.freeze({
 一:'Базовая форма yī. Перед 4-м тоном часто yí (一个), перед 1–3-м — yì (一百). В счёте и названиях месяцев встречается словарное yī.',
 一个:'一 здесь произносится yí, 个 — нейтральным тоном: yí ge.',
 是:'Четвёртый тон shì. В отрицании 不是 частица 不 произносится bú перед shì.',
 你好:'В сочетании 你好 первый третий тон обычно переходит во второй в речи: ní hǎo.',
 吗:'Вопросительная частица ma всегда произносится нейтральным тоном.',
 学生:'В слове 学生 второй слог sheng имеет нейтральный тон: xuésheng.',
 妈妈:'Второе ma — нейтральный тон; māma.',
 爸爸:'Второе ba — нейтральный тон; bàba.',
 哥哥:'Второе ge — нейтральный тон; gēge.',
 姐姐:'Второе jie — нейтральный тон; jiějie.',
 弟弟:'Второе di — нейтральный тон; dìdi.',
 妹妹:'Второе mei — нейтральный тон; mèimei.',
 我们:'Второе men — нейтральный тон; wǒmen.',
 你们:'Второе men — нейтральный тон; nǐmen.',
 他们:'Второе men — нейтральный тон; tāmen.',
 我的:'Второе de — нейтральный тон; wǒ de.',
 星期:'В обоих слогах первый тон: xīngqī.',
 没有:'méi — второй тон, yǒu — третий; отрицание глагола 有.'
});
// Explicit, native-grammar examples. Not a real-world diary or weather report.
const EXAMPLES=Object.freeze({
 我:['我是老师。','Wǒ shì lǎoshī.','Я учитель.'],
 你:['你是学生。','Nǐ shì xuésheng.','Ты ученик.'],
 他:['他是学生。','Tā shì xuésheng.','Он ученик.'],
 她:['她是老师。','Tā shì lǎoshī.','Она учитель.'],
 它:['它','tā','Оно (для предметов и животных).'],
 我们:['我们是学生。','Wǒmen shì xuésheng.','Мы ученики.'],
 你们:['你们是学生吗？','Nǐmen shì xuésheng ma?','Вы ученики?'],
 他们:['他们是学生。','Tāmen shì xuésheng.','Они ученики.'],
 你好:['你好！','Nǐ hǎo!','Привет!'],
 学生:['我是学生。','Wǒ shì xuésheng.','Я ученик.'],
 老师:['我是老师。','Wǒ shì lǎoshī.','Я учитель.'],
 是:['我是老师。','Wǒ shì lǎoshī.','Я учитель.'],
 人:['两个人','Liǎng ge rén','Два человека.'],
 口:['口','kǒu','Рот; иероглиф и ключ.'],
 木:['木','mù','Дерево; иероглиф и ключ.'],
 日:['日','rì','День; иероглиф.'],
 吗:['你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?'],
 零:['零','líng','Ноль.'],
 一:['一个人','Yí ge rén','Один человек.'],
 二:['二十','Èr shí','Двадцать.'],
 三:['三个人','Sān ge rén','Три человека.'],
 四:['四个人','Sì ge rén','Четыре человека.'],
 五:['五个人','Wǔ ge rén','Пять человек.'],
 六:['六个人','Liù ge rén','Шесть человек.'],
 七:['七个人','Qī ge rén','Семь человек.'],
 八:['八个人','Bā ge rén','Восемь человек.'],
 九:['九个人','Jiǔ ge rén','Девять человек.'],
 十:['十个人','Shí ge rén','Десять человек.'],
 百:['一百个人','Yì bǎi ge rén','Сто человек.'],
 星期:['今天星期三。','Jīntiān xīngqīsān.','Сегодня среда (учебный пример).'],
 星期一:['今天星期一。','Jīntiān xīngqīyī.','Сегодня понедельник (пример).'],
 星期二:['今天星期二。','Jīntiān xīngqīèr.','Сегодня вторник (пример).'],
 星期三:['今天星期三。','Jīntiān xīngqīsān.','Сегодня среда (пример).'],
 星期四:['今天星期四。','Jīntiān xīngqīsì.','Сегодня четверг (пример).'],
 星期五:['今天星期五。','Jīntiān xīngqīwǔ.','Сегодня пятница (пример).'],
 星期六:['今天星期六。','Jīntiān xīngqīliù.','Сегодня суббота (пример).'],
 星期天:['今天星期天。','Jīntiān xīngqītiān.','Сегодня воскресенье (пример).'],
 星期日:['今天星期日。','Jīntiān xīngqīrì.','Сегодня воскресенье (пример).'],
 今天:['今天很冷。','Jīntiān hěn lěng.','Сегодня холодно (учебный пример).'],
 明天:['明天下雨。','Míngtiān xià yǔ.','Завтра дождь (учебный пример).'],
 昨天:['昨天星期二。','Zuótiān xīngqīèr.','Вчера был вторник (пример).'],
 年:['二零二六年十一月六日','Èr líng èr liù nián shíyī yuè liù rì','6 ноября 2026 года (пример).'],
 月:['三月五号','Sān yuè wǔ hào','5 марта (пример).'],
 号:['三月五号','Sān yuè wǔ hào','5 марта (пример).'],
 几:['今天星期几？','Jīntiān xīngqī jǐ?','Какой сегодня день недели?'],
 妈妈:['这是我妈妈。','Zhè shì wǒ māma.','Это моя мама.'],
 爸爸:['这是我爸爸。','Zhè shì wǒ bàba.','Это мой папа.'],
 哥哥:['我没有哥哥。','Wǒ méiyǒu gēge.','У меня нет старшего брата.'],
 姐姐:['我有姐姐。','Wǒ yǒu jiějie.','У меня есть старшая сестра.'],
 弟弟:['我有弟弟。','Wǒ yǒu dìdi.','У меня есть младший брат.'],
 妹妹:['我有一个妹妹。','Wǒ yǒu yí ge mèimei.','У меня есть младшая сестра.'],
 家:['我家有五口人。','Wǒ jiā yǒu wǔ kǒu rén.','В моей семье пять человек.'],
 我的:['我的妈妈','Wǒ de māma','Моя мама.'],
 有:['我有一个妹妹。','Wǒ yǒu yí ge mèimei.','У меня есть младшая сестра.'],
 没有:['我没有哥哥。','Wǒ méiyǒu gēge.','У меня нет старшего брата.'],
 一个:['我有一个妹妹。','Wǒ yǒu yí ge mèimei.','У меня есть младшая сестра.'],
 天气:['今天天气怎么样？','Jīntiān tiānqì zěnmeyàng?','Какая сегодня погода?'],
 冷:['今天很冷。','Jīntiān hěn lěng.','Сегодня холодно (пример).'],
 热:['今天很热。','Jīntiān hěn rè.','Сегодня жарко (пример).'],
 晴:['今天是晴天。','Jīntiān shì qíngtiān.','Сегодня ясно (пример).'],
 阴:['今天是阴天。','Jīntiān shì yīntiān.','Сегодня пасмурно (пример).'],
 下雨:['今天下雨。','Jīntiān xià yǔ.','Сегодня идёт дождь (пример).'],
 下雪:['今天下雪。','Jīntiān xià xuě.','Сегодня идёт снег (пример).'],
 风:['今天有风。','Jīntiān yǒu fēng.','Сегодня ветрено (пример).'],
 春天:['春天天气很好。','Chūntiān tiānqì hěn hǎo.','Весной хорошая погода (пример).'],
 夏天:['夏天很热。','Xiàtiān hěn rè.','Летом жарко (пример).'],
 秋天:['秋天天气很好。','Qiūtiān tiānqì hěn hǎo.','Осенью хорошая погода (пример).'],
 冬天:['冬天很冷。','Dōngtiān hěn lěng.','Зимой холодно (пример).']
});
const MONTH_GENITIVE=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const TONE_MARKS={'\u0304':1,'\u0301':2,'\u030c':3,'\u0300':4};
const cache=new WeakMap();
const clean=s=>normalize(s);
function getTones(pinyin,word){
 const marks=[...String(pinyin).normalize('NFD')].map(x=>TONE_MARKS[x]).filter(Boolean);
 if(NEUTRAL.has(word))marks.push(0);
 return marks;
}
function createLexicon(curriculum){
 if(!Array.isArray(curriculum)||curriculum.length!==7)return new Map();
 const items=new Map();
 curriculum.forEach((lesson,i)=>(lesson.words||[]).forEach(row=>{
  if(!Array.isArray(row)||row.length<3)return;
  const [word,pinyin,translation]=row;
  if(typeof word!=='string'||typeof pinyin!=='string'||typeof translation!=='string')return;
  if(items.has(word)){items.get(word).sourceLessons.push(i+1);return}
  const monthIndex=MONTHS.indexOf(word);
  const ex=monthIndex>=0?[word+'五号',pinyin+' wǔ hào','5 '+MONTH_GENITIVE[monthIndex]+' (пример).']:EXAMPLES[word];
  if(!CATEGORY.has(word)||!ex)throw Error('Panda Brain v302: missing reviewed metadata for '+word);
  items.set(word,{word,pinyin,translation,category:CATEGORY.get(word),tones:getTones(pinyin,word),
   toneNote:TONE_EXPLANATIONS[word]||'',sourceLessons:[i+1],
   example:{hanzi:ex[0],pinyin:ex[1],ru:ex[2],audioKey:lookupPilotAudio(ex[0])?ex[0]:null},
   audioKey:lookupPilotAudio(word)?word:null});
 }));
 return items;
}
export function brainLexicon(curriculum=[]){
 if(!Array.isArray(curriculum))return new Map();
 if(!cache.has(curriculum))cache.set(curriculum,createLexicon(curriculum));
 return cache.get(curriculum);
}
export function brainCoverage(curriculum=[]){
 const items=[...brainLexicon(curriculum).values()];
 return {entries:(curriculum||[]).reduce((total,t)=>total+(t.words?.length||0),0),unique:items.length,
  byLesson:Array.from({length:7},(_,i)=>items.filter(x=>x.sourceLessons.includes(i+1)).length),
  categories:[...new Set(items.map(x=>x.category))].length,
  examples:items.filter(x=>x.example?.hanzi&&x.example.pinyin&&x.example.ru).length,
  recorded:items.filter(x=>x.audioKey).length};
}
const hasChinese=s=>/[\u3400-\u9fff]/.test(s);
function parseWordQuery(raw){
 const s=String(raw||'').trim();
 if(!s||s.length>180)return null;
 const compact=s.replace(/\s+/g,'').replace(/[？?。！!]+$/g,'').replace(/^(?:请问|请你|请)/,'');
 let m=/^用([\u3400-\u9fff]{1,8})造句$/.exec(compact);
 if(m)return {word:m[1],intent:'example'};
 m=/^([\u3400-\u9fff]{1,8}?)(是什么意思|什么意思|的意思是什么|怎么读|怎么念|怎么发音|的拼音是什么|是几声|的声调是什么|是什么声调|是什么词|是什么词性|是第几课的词|怎么用|怎么造句)$/.exec(compact);
 if(m){
  const ending=m[2],intent=/造句|怎么用/.test(ending)?'example':/怎么读|怎么念|发音|拼音|几声|声调/.test(ending)?'tone':/什么词|词性/.test(ending)?'grammar':/第几课/.test(ending)?'lesson':'meaning';
  return {word:m[1],intent};
 }
 const kind=/что значит|что означает|как переводится|переведи|как читается|как произнести|какой тон|какие тоны|пиньинь|часть речи|составь предложение|приведи пример|предложение со словом|к какому уроку/i.exec(s);
 if(!kind)return null;
 const matches=s.match(/[\u3400-\u9fff]{1,8}/g)||[];
 if(matches.length!==1)return null;
 return {word:matches[0],intent:/предложен|пример/.test(s)?'example':/тон|чита|произн|пиньинь/i.test(s)?'tone':/часть речи/i.test(s)?'grammar':/уроку/i.test(s)?'lesson':'meaning'};
}
export function brainQuestion(raw,allowed=[1],curriculum=[]){
 const request=parseWordQuery(raw);if(!request)return null;
 const item=brainLexicon(curriculum).get(request.word);
 if(!item)return {kind:'clarify',message:'Слова «'+request.word+'» пока нет в словаре семи уроков HSK 1. Я не буду придумывать перевод или тоны.',topic:null};
 const lesson=item.sourceLessons.find(n=>allowed.includes(n));
 if(!lesson)return {kind:'clarify',lesson:item.sourceLessons[0],message:'Это слово появится после открытия урока '+item.sourceLessons[0]+'. Пока не могу объяснять слова закрытых уроков.'};
 const tone=item.tones.map(n=>n===0?'нейтральный':n+'-й').join(' + ');
 const summary=item.word+' · '+item.pinyin+' · '+item.translation+'. Часть речи: '+item.category+'. Урок '+lesson+'.';
 const description=summary+(item.toneNote?' '+item.toneNote:'')+
   ' Пример: '+item.example.hanzi+' — '+item.example.pinyin+' — '+item.example.ru;
 const example=request.intent==='example',sentence=example?item.example:null;
 const reply=example?{...sentence,context:'Проверенный учебный пример, не утверждение о реальной погоде или дате.'}:
  {hanzi:item.word,pinyin:item.pinyin,ru:item.translation,audioKey:item.audioKey,context:
    (request.intent==='tone'?'Тоны: '+tone+'. ':'')+
    'Тип: '+item.category+'. '+(item.toneNote||'')};
 return {kind:'explanation',lesson,reply,spoken:{known:true,hanzi:String(raw).trim(),pinyin:null,
  translation:'Вопрос о слове '+item.word+'.',topic:lesson},explanation:description,
  vocabWord:item.word,vocabIntent:request.intent};
}
const SUBJECT=Object.freeze({
 我:['Wǒ','Я','мой'],你:['Nǐ','Ты','твой'],他:['Tā','Он','его'],她:['Tā','Она','её'],
 我们:['Wǒmen','Мы','наш'],你们:['Nǐmen','Вы','ваш'],他们:['Tāmen','Они','их']
});
const FAMILY=Object.freeze({
 妈妈:['māma','мама','мамы'],爸爸:['bàba','папа','папы'],
 哥哥:['gēge','старший брат','старшего брата'],姐姐:['jiějie','старшая сестра','старшей сестры'],
 弟弟:['dìdi','младший брат','младшего брата'],妹妹:['mèimei','младшая сестра','младшей сестры']
});
const NUMBER_ZH=['零','一','二','三','四','五','六','七','八','九','十'];
const NUMBER_PY=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ','shí'];
const TIME=Object.freeze({今天:['Jīntiān','Сегодня'],明天:['Míngtiān','Завтра'],昨天:['Zuótiān','Вчера']});
function composed(raw,pinyin,translation,topic,extra={}){
 return {known:true,hanzi:String(raw).trim(),pinyin,translation,topic,brainComposed:true,...extra};
}
export function interpretBrainSentence(raw,allowed=[1],curriculum=[]){
 const s=clean(raw);if(!s||s.length>100||!hasChinese(s))return null;
 const words=brainLexicon(curriculum);
 const learned=(...terms)=>terms.every(w=>words.has(w)&&words.get(w).sourceLessons.some(n=>allowed.includes(n)));
 let m=/^(我|你|他|她|我们|你们|他们)(有|没有)(妈妈|爸爸|哥哥|姐姐|弟弟|妹妹)$/.exec(s);
 if(m&&allowed.includes(6)&&learned(m[1],m[2],m[3])){
  const [pronoun,has,relative]=[SUBJECT[m[1]],m[2]==='有',FAMILY[m[3]]];
  const ru=m[1]==='我'?'У меня ':m[1]==='你'?'У тебя ':m[1]==='我们'?'У нас ':m[1]==='你们'?'У вас ':m[1]==='他们'?'У них ':m[1]==='她'?'У неё ':'У него ';
  return composed(raw,pronoun[0]+' '+(has?'yǒu':'méiyǒu')+' '+relative[0]+'.',
    ru+(has?'есть '+relative[1]:'нет '+relative[2])+'.',6,
    m[1]==='我'?{family:{present:has?[m[3]]:[],absent:has?null:m[3]}}:{});
 }
 m=/^我有(一|两|二|三|四|五|六|七|八|九|十)个(哥哥|姐姐|弟弟|妹妹)$/.exec(s);
 if(m&&allowed.includes(3)&&allowed.includes(6)&&learned('我','有',m[2])){
  const index=m[1]==='两'?2:NUMBER_ZH.indexOf(m[1]);
  if(index<1||index===2&&m[1]==='二')return null; // 两个, not 二个
  const numPy=index===1?'yí':index===2?'liǎng':NUMBER_PY[index];
  const forms={
   哥哥:['старший брат','старших брата','старших братьев'],姐姐:['старшая сестра','старшие сестры','старших сестёр'],
   弟弟:['младший брат','младших брата','младших братьев'],妹妹:['младшая сестра','младшие сестры','младших сестёр']
  };
  const form=index===1?0:index>=2&&index<=4?1:2;
  return composed(raw,'Wǒ yǒu '+numPy+' ge '+FAMILY[m[2]][0]+'.',
   'У меня '+index+' '+forms[m[2]][form]+'.',6,
   {family:{present:[m[2]],absent:null},fact:{familyCount:index,relative:m[2]}});
 }
 m=/^(我|你|他|她)?(的)?(妈妈|爸爸|哥哥|姐姐|弟弟|妹妹)是(老师|学生)$/.exec(s);
 if(m&&(!m[2]||m[1])&&allowed.includes(2)&&allowed.includes(6)&&learned(m[3],m[4],'是')){
  const p=m[1]?SUBJECT[m[1]][0]+' '+(m[2]?'de ':''):'';
  const feminine=/妈妈|姐姐|妹妹/.test(m[3]);
  const who=m[1]==='我'?(feminine?'Моя':'Мой'):m[1]==='你'?(feminine?'Твоя':'Твой'):m[1]==='他'?'Его':m[1]==='她'?'Её':'';
  const role=m[4]==='老师'?'учитель':'ученик';
  return composed(raw,p+FAMILY[m[3]][0]+' shì '+(m[4]==='老师'?'lǎoshī':'xuésheng')+'.',
   (who?who+' ':'')+FAMILY[m[3]][1]+' — '+role+'.',6);
 }
 m=/^(今天|明天|昨天)(是)?(晴天|阴天)$/.exec(s);
 if(m&&allowed.includes(7)&&allowed.includes(4)&&learned(m[1],'晴','阴')){
  const w=m[3]==='晴天'?['qíngtiān','ясно']:['yīntiān','пасмурно'];
  return composed(raw,TIME[m[1]][0]+' '+(m[2]?'shì ':'')+w[0]+'.',
   TIME[m[1]][1]+' '+w[1]+' (учебное описание, не прогноз).',7,{fact:{weather:m[3],time:m[1]}});
 }
 return null;
}
