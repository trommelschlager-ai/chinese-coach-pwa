// Reviewed HSK1 rules only. No network, inferred forecast, or acoustic scoring.
import {normalize,verifyAnswerFor} from './panda-voice-pilot-engine.mjs?v=live6';
import {interpretUtterance,interpretFamily,weekdayForDate} from './panda-live-conversation-v266.mjs?v=270';
import {answerNonStop} from './panda-nonstop-v267.mjs?v=270';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=live6';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {chineseNumber} from './panda-live-drafts.mjs?v=live6';
import {lookupExtendedQuestion,extensionAnswer,extensionStatement,rememberedFamilyFollowup} from './panda-hsk1-extensions-v282.mjs?v=284';
import {checkedExtensionReply,recognizeApprovedPhrase} from './panda-hsk1-answerbank-v284.mjs?v=284';
import {patternQuestion,patternStudentAnswer,patternPrompts,conversationalFollowup} from './panda-hsk1-patterns-v285.mjs?v=285';
import {questionVariant,learnerAnswerVariant} from './panda-hsk1-variants-v301.mjs?v=301';
import {brainQuestion,interpretBrainSentence} from './panda-brain-hsk1-v302.mjs?v=302';
import {answerHsk2Bridge} from './panda-hsk2-bridge-v304.mjs?v=307';
import {coachSentence} from './panda-sentence-coach-v319.mjs?v=319';
import {answerBasicConversation} from './panda-basic-conversation-v323.mjs?v=336';
const NUMPY=['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'];
export const numberPy=n=>n===100?'yì bǎi':n<10?NUMPY[n]:(n<20?'shí':NUMPY[Math.floor(n/10)]+'shí')+(n%10?(n%10===2?"'":'')+NUMPY[n%10]:'');
const ZH=n=>n===0?'零':chineseNumber(n);
const parseNumber=s=>{if(/^\d{1,3}$/.test(s)){const n=Number(s);return n>=0&&n<=100?n:null}if(s==='两')return 2;for(let n=0;n<=100;n++)if(ZH(n)===s)return n;return null};
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const strip=s=>normalize(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const known=(raw,pinyin,translation,topic,extra={})=>({known:true,hanzi:raw,pinyin,translation,topic,...extra});
const line=(hanzi,pinyin,ru,context='')=>({hanzi,pinyin,ru,audioKey:lookupPilotAudio(hanzi)?hanzi:null,context});
const ROLE='Учебная роль Панды: учитель, 3 года; семья из пяти: мама, папа, старший брат, младшая сестра и Панда.';
const WEATHER_CONTEXT='Учебная сценка: сегодня холодно, завтра дождь. Это не настоящий прогноз.';
const PERSONAL={我:['wǒ','Я'],你:['nǐ','Ты'],他:['tā','Он'],她:['tā','Она'],它:['tā','Оно'],我们:['wǒmen','Мы'],你们:['nǐmen','Вы'],他们:['tāmen','Они'],她们:['tāmen','Они']};
const ROLES={老师:['lǎoshī','учитель','учителя'],学生:['xuésheng','студент','студенты'],人:['rén','человек','люди']};
const MEMBERS={妈妈:['māma','мама','мамы'],爸爸:['bàba','папа','папы'],哥哥:['gēge','старший брат','старшего брата'],姐姐:['jiějie','старшая сестра','старшей сестры'],弟弟:['dìdi','младший брат','младшего брата'],妹妹:['mèimei','младшая сестра','младшей сестры']};
const TIMES={今天:['Jīntiān','Сегодня',0],明天:['Míngtiān','Завтра',1],昨天:['Zuótiān','Вчера',-1]};
const WEATHER={很冷:['hěn lěng','холодно'],很热:['hěn rè','жарко'],很好:['hěn hǎo','хорошая погода'],下雨:['xià yǔ','идёт дождь'],在下雨:['zài xià yǔ','идёт дождь'],下雪:['xià xuě','идёт снег'],晴天:['qíngtiān','ясно'],阴天:['yīntiān','пасмурно'],有风:['yǒu fēng','ветрено']};
function localDate(date,offset=0){const d=new Date(date);d.setDate(d.getDate()+offset);return d}
export function calendarReply(time='今天',kind='weekday',date=new Date()){
 const [py,ru,offset]=TIMES[time],d=localDate(date,offset);
 if(kind==='weekday'){const day=weekdayForDate(d);return line(time+'星期'+day.hanzi+'。',py+' xīngqī '+day.py+'.',ru+' '+day.ru+'.','По местному календарю устройства.')}
 const m=d.getMonth()+1,n=d.getDate();return line(time+ZH(m)+'月'+ZH(n)+'号。',py+' '+numberPy(m)+' yuè '+numberPy(n)+' hào.',ru+' '+n+'.'+String(m).padStart(2,'0')+'.','По местному календарю устройства.');
}
function buildPrompt(hanzi,pinyin,ru,topic,accepted,context='',meta={}){
 const p={hanzi,pinyin,ru,lesson:topic,accepted,options:[],instruction:'Можно ответить: '+accepted.slice(0,2).join(' / '),audioKey:lookupPilotAudio(hanzi)?hanzi:null,context,...meta};
 return {...p,verifiedLines:[{},p]};
}
export function topicPrompts(topic,date=new Date(),profile={}){
 switch(topic){
 case 1:return [buildPrompt('你好吗？','Nǐ hǎo ma?','Как дела?',1,['我很好','我很好你呢','我也很好谢谢','不好']),buildPrompt('你呢？','Nǐ ne?','А у тебя?',1,['我很好','我不好'])];
 case 2:return [buildPrompt('你是老师吗？','Nǐ shì lǎoshī ma?','Ты учитель?',2,['我是老师','我是学生','不是我是学生']),buildPrompt('你叫什么名字？','Nǐ jiào shénme míngzi?','Как тебя зовут?',2,['我叫小明'], '',{intent:'name'})];
 case 3:return [buildPrompt('你几岁？','Nǐ jǐ suì?','Сколько тебе лет?',3,['我二十五岁','我三十岁'],'Можно назвать свой возраст или играть роль.',{intent:'age'}),buildPrompt('你有几个？','Nǐ yǒu jǐ ge?','Сколько у тебя?',3,['我有两个','我有三个'],'Учебная сценка: считаем предметы.',{intent:'quantity'})];
 case 4:return ['今天','明天','昨天'].map(time=>{const r=calendarReply(time,'weekday',date),accepted=[normalize(r.hanzi),normalize(r.hanzi).replace(time,time+'是'),normalize(r.hanzi).replace(time,'')];if(r.hanzi.includes('星期日'))accepted.push(...accepted.map(s=>s.replace('星期日','星期天')));return buildPrompt(time+'星期几？',TIMES[time][0]+' xīngqī jǐ?',TIMES[time][1]+': какой день недели?',4,accepted,r.context,{intent:'weekday',time})});
 case 5:return ['今天','明天'].map(time=>{const r=calendarReply(time,'date',date),d=localDate(date,TIMES[time][2]),a=normalize(r.hanzi);return buildPrompt(time+'几月几号？',TIMES[time][0]+' jǐ yuè jǐ hào?',TIMES[time][1]+': какое число и месяц?',5,[a,a.replace(time,''),time+(d.getMonth()+1)+'月'+d.getDate()+'号'],r.context,{intent:'date',time,calendarDate:date.toISOString()})});
 case 6:{const p=Object.entries(MEMBERS).filter(([n])=>!['妈妈','爸爸'].includes(n)).map(([n,[py,ru]])=>buildPrompt('你有'+n+'吗？','Nǐ yǒu '+py+' ma?','У тебя есть '+ru+'?',6,['我有'+n,'我没有'+n],'',{relative:n}));const present=Object.keys(profile.family||{}).find(n=>profile.family[n]===true);if(present&&profile.hasNumbers)p.unshift(buildPrompt('你'+present+'几岁？','Nǐ '+MEMBERS[present][0]+' jǐ suì?','Сколько лет твоему родственнику: '+MEMBERS[present][1]+'?',6,['我'+present+'二十岁'], '',{intent:'relative-age',relative:present}));return p;}
 case 7:return ['今天','明天'].map(time=>buildPrompt(time+'天气怎么样？',TIMES[time][0]+' tiānqì zěnmeyàng?',TIMES[time][1]+': какая погода?',7,[time+'很冷',time+'下雨',time+'很热'], 'Расскажи о погоде у тебя или выбери учебную роль.',{intent:'weather',time}));
 default:return [];
 }
}
export function nextTopicPrompt(topic,recent=[],date=new Date(),profile={}){const pool=topicPrompts(topic,date,profile);return pool.find(p=>!recent.includes(p.hanzi))||[...pool].sort((a,b)=>recent.lastIndexOf(a.hanzi)-recent.lastIndexOf(b.hanzi))[0]||null}
const QUERY=[];
function query(keys,topic,pinyin,translation,reply){for(const key of keys)QUERY.push({key,topic,pinyin,translation,reply})}
query(['你叫什么名字','你叫什么'],2,'Nǐ jiào shénme míngzi?','Как тебя зовут?',()=>line('我叫熊猫。','Wǒ jiào Xióngmāo.','Меня зовут Панда.','Имя учебного персонажа.'));
query(['你是谁'],2,'Nǐ shì shéi?','Кто ты?',()=>line('我是熊猫老师。','Wǒ shì Xióngmāo lǎoshī.','Я учитель Панда.',ROLE));
query(['你是老师吗'],2,'Nǐ shì lǎoshī ma?','Ты учитель?',()=>line('是，我是老师。','Shì, wǒ shì lǎoshī.','Да, я учитель.',ROLE));
query(['你是学生吗'],2,'Nǐ shì xuésheng ma?','Ты студент?',()=>line('不是，我是老师。','Bú shì, wǒ shì lǎoshī.','Нет, я учитель.',ROLE));
query(['你几岁','你多大','你多大了'],3,'Nǐ jǐ suì?','Сколько тебе лет?',()=>line('我三岁。','Wǒ sān suì.','Мне три года.',ROLE));
query(['你有几个'],3,'Nǐ yǒu jǐ ge?','Сколько у тебя?',()=>line('我有两个。','Wǒ yǒu liǎng ge.','У меня два.','Учебная сценка: считаем предметы.'));
for(const [time,[py,ru]] of Object.entries(TIMES)){
 query([time+'星期几',time+'是星期几'],4,py+' xīngqī jǐ?',ru+': какой день недели?',d=>calendarReply(time,'weekday',d));
 query([time+'几月几号',time+'是几月几号',time+'几月几日',time+'是几月几日'],5,py+' jǐ yuè jǐ hào?',ru+': какое число и месяц?',d=>calendarReply(time,'date',d));
 if(time!=='昨天'){
  const tomorrow=time==='明天';
  query([time+'天气怎么样',time+'的天气怎么样'],7,py+' tiānqì zěnmeyàng?',ru+': какая погода?',()=>tomorrow?line('明天下雨。','Míngtiān xià yǔ.','Завтра будет дождь.',WEATHER_CONTEXT):line('今天很冷。','Jīntiān hěn lěng.','Сегодня холодно.',WEATHER_CONTEXT));
  for(const [condition,conditionPy,conditionRu,positive] of [['冷','lěng','холодно',!tomorrow],['热','rè','жарко',false],['下雨','xià yǔ','идёт дождь',tomorrow]])query([time+(condition==='下雨'?'':'天气')+condition+'吗',time+condition+'吗'],7,py+' '+(condition==='下雨'?'':'tiānqì ')+conditionPy+' ma?',ru+' '+conditionRu+'?',()=>line(positive?(tomorrow?'明天下雨。':'今天很冷。'):(condition==='下雨'?'今天不下雨。':time+'不'+condition+'。'),positive?(tomorrow?'Míngtiān xià yǔ.':'Jīntiān hěn lěng.'):py+(['下雨','热'].includes(condition)?' bú ':' bù ')+conditionPy+'.',positive?(tomorrow?'Завтра будет дождь.':'Сегодня холодно.'):ru+' '+(condition==='冷'?'не холодно.':condition==='热'?'не жарко.':'дождя нет.'),WEATHER_CONTEXT));
 }
}
for(const [time,[py,ru]] of Object.entries(TIMES)){
 query([time+'几号',time+'是几号'],5,py+' jǐ hào?',ru+': какое число?',d=>calendarReply(time,'date',d));
 for(const day of ['一','二','三','四','五','六','日','天']){
  const info=weekdayForDate(new Date(2026,10,{一:9,二:10,三:11,四:12,五:13,六:14,日:15,天:15}[day]));
  query([time+'星期'+day+'吗',time+'是星期'+day+'吗'],4,py+' xīngqī '+(day==='天'?'tiān':info.py)+' ma?',ru+' '+info.ru+'?',d=>calendarReply(time,'weekday',d));
 }
}
query(['今天几月','现在几月'],5,'Jīntiān jǐ yuè?','Какой сейчас месяц?',d=>line('现在'+ZH(d.getMonth()+1)+'月。','Xiànzài '+numberPy(d.getMonth()+1)+' yuè.','Сейчас '+['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'][d.getMonth()]+'.','По местному календарю устройства.'));
query(['今年是哪一年','今年几几年'],5,'Jīnnián shì nǎ yì nián?','Какой сейчас год?',d=>line('今年'+String(d.getFullYear()).split('').map(n=>ZH(Number(n))).join('')+'年。','Jīnnián '+String(d.getFullYear()).split('').map(n=>NUMPY[Number(n)]).join(' ')+' nián.','Сейчас '+d.getFullYear()+' год.','По местному календарю устройства.'));
for(const [member,[py,ru]] of Object.entries(MEMBERS))query(['你有'+member+'吗'],6,'Nǐ yǒu '+py+' ma?','У тебя есть '+ru+'?',()=>{const has=['妈妈','爸爸','哥哥','妹妹'].includes(member);return line('我'+(has?'有':'没有')+(has&&!['妈妈','爸爸'].includes(member)?'一个':'')+member+'。','Wǒ '+(has?'yǒu ':'méiyǒu ')+(has&&!['妈妈','爸爸'].includes(member)?'yí ge ':'')+py+'.','У меня '+(has?'есть '+ru:'нет '+MEMBERS[member][2])+'.',ROLE)});
for(const [member,[py,ru]] of Object.entries(MEMBERS)){
 const has=['妈妈','爸爸','哥哥','妹妹'].includes(member),age={妈妈:30,爸爸:32,哥哥:5,妹妹:1}[member];
 query(['你'+member+'几岁','你'+member+'多大'],6,'Nǐ '+py+' jǐ suì?','Сколько лет твоему родственнику: '+ru+'?',()=>has?line('我'+member+ZH(age)+'岁。','Wǒ '+py+' '+(age===1?'yí':numberPy(age))+' suì.',ru+': '+age+' лет.',ROLE):line('我没有'+member+'。','Wǒ méiyǒu '+py+'.','У меня нет '+MEMBERS[member][2]+'.',ROLE));
 for(const q of QUERY.slice(-2))q.requires=[3,6];
}
for(const member of ['哥哥','姐姐','弟弟','妹妹']){const py=MEMBERS[member][0],has=['哥哥','妹妹'].includes(member);query(['你有几个'+member],6,'Nǐ yǒu jǐ ge '+py+'?','Сколько у тебя братьев или сестёр: '+MEMBERS[member][1]+'?',()=>line('我'+(has?'有一个':'没有')+member+'。','Wǒ '+(has?'yǒu yí ge ':'méiyǒu ')+py+'.','У меня '+(has?'есть '+MEMBERS[member][1]:'нет '+MEMBERS[member][2])+'.',ROLE));}
query(['你家有几口人'],6,'Nǐ jiā yǒu jǐ kǒu rén?','Сколько человек в твоей семье?',()=>line('我家有五口人。','Wǒ jiā yǒu wǔ kǒu rén.','В моей семье пять человек.',ROLE));
for(const member of ['妈妈','爸爸'])query(['这是你'+member+'吗'],6,'Zhè shì nǐ '+MEMBERS[member][0]+' ma?','Это твой родственник: '+MEMBERS[member][1]+'?',()=>line('是，这是我'+member+'。','Shì, zhè shì wǒ '+MEMBERS[member][0]+'.','Да, это '+(member==='妈妈'?'моя мама.':'мой папа.'),'Учебная сценка. Реальную фотографию я не вижу.'));
// The question and answer are both recorded in the weekday lesson.
query(['你星期几有空'],4,'Nǐ xīngqī jǐ yǒu kòng?','В какой день недели у тебя есть время?',()=>line('我星期六有空。','Wǒ xīngqī liù yǒu kòng.','Я свободен в субботу.','Учебная ситуация, а не реальное расписание.'));
function findQuestion(s){return QUERY.find(q=>q.key===s.replace(/[呀啊]$/,''))}
function grammar(raw,allowed,contextTopic){
 const s=normalize(raw);
 const mood={很好:['Hěn hǎo.','Хорошо.'],不好:['Bù hǎo.','Плохо.'],我不好:['Wǒ bù hǎo.','У меня дела идут плохо.'],我也很好:['Wǒ yě hěn hǎo.','У меня тоже всё хорошо.']};if(allowed.includes(1)&&mood[s])return known(raw,mood[s][0],mood[s][1],1);
 let m=/^(我|你|他|她|它|我们|你们|他们|她们)(不是|是)(老师|学生|人)$/.exec(s);
 if(m&&(allowed.includes(2)||(allowed.includes(1)&&m[1]==='我'&&m[2]==='是'&&m[3]==='学生'))){const p=PERSONAL[m[1]],r=ROLES[m[3]],plural=m[1].includes('们');return known(raw,cap(p[0])+' '+(m[2]==='不是'?'bú shì':'shì')+' '+r[0]+'.',p[1]+' '+(m[2]==='不是'?'не ':'')+(plural?r[2]:r[1])+'.',allowed.includes(2)?2:1,{fact:{subject:m[1],role:m[3],negative:m[2]==='不是'}})}
 m=/^我叫([\u3400-\u9fffA-Za-z]{1,16})$/.exec(s);if(m&&allowed.includes(2)){const names={小明:['Xiǎomíng','Сяомин'],小红:['Xiǎohóng','Сяохун']};return known(raw,names[m[1]]?'Wǒ jiào '+names[m[1]][0]+'.':null,'Меня зовут '+(names[m[1]]?.[1]||m[1])+'.',2,{fact:{name:m[1]}})}
 m=/^(我)?([零一二两三四五六七八九十百\d]+)岁$/.exec(s);if(m&&allowed.includes(3)){const n=parseNumber(m[2]);if(n!==null&&n>0)return known(raw,(m[1]?'Wǒ ':'')+(m[2]==='两'?'liǎng':numberPy(n))+' suì.',(m[1]?'Мне ':'')+n+' '+(n%10===1&&n%100!==11?'год':n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?'года':'лет')+'.',3,{fact:{age:n}})}
 m=/^我有([一二两三四五六七八九十百\d]+)个$/.exec(s);if(m&&allowed.includes(3)){const n=parseNumber(m[1]);if(n!==null)return known(raw,'Wǒ yǒu '+(n===2?'liǎng':numberPy(n))+' ge.','У меня '+n+' (предметов).',3,{fact:{quantity:n}})}
 if(allowed.includes(6)){
  const family=interpretFamily(raw);if(family)return {...family,topic:6};
  m=/^我(没有|有)(妈妈|爸爸)$/.exec(s);if(m)return known(raw,'Wǒ '+(m[1]==='有'?'yǒu ':'méiyǒu ')+MEMBERS[m[2]][0]+'.','У меня '+(m[1]==='有'?'есть '+MEMBERS[m[2]][1]:'нет '+MEMBERS[m[2]][2])+'.',6,{family:{absent:m[1]==='没有'?m[2]:null,present:m[1]==='有'?[m[2]]:[]}});
  m=/^(?:这是)?我(?:的)?(妈妈|爸爸|哥哥|姐姐|弟弟|妹妹)$/.exec(s);if(m)return known(raw,(s.startsWith('这是')?'Zhè shì wǒ ':'Wǒ ')+(s.includes('的')?'de ':'')+MEMBERS[m[1]][0]+'.',(s.startsWith('这是')?'Это ':'')+(['妈妈','姐姐','妹妹'].includes(m[1])?'моя ':'мой ')+MEMBERS[m[1]][1]+'.',6);
  m=/^我家有([一二两三四五六七八九十\d]+)口人$/.exec(s);if(m){const n=parseNumber(m[1]);if(n>0&&n<=20)return known(raw,'Wǒ jiā yǒu '+(n===2?'liǎng':numberPy(n))+' kǒu rén.','В моей семье '+n+' человек.',6,{fact:{familySize:n}})}
  m=/^我(哥哥|姐姐|弟弟|妹妹)([一二两三四五六七八九十百\d]+)岁$/.exec(s);if(m){const n=parseNumber(m[2]);if(n>0)return known(raw,'Wǒ '+MEMBERS[m[1]][0]+' '+numberPy(n)+' suì.','Моему родственнику ('+MEMBERS[m[1]][1]+') '+n+' лет.',6,{fact:{relative:m[1],relativeAge:n}})}
 }
 if(allowed.includes(7)){
  m=/^(今天|明天|昨天)?(?:天气)?不(冷|热|下雨|下雪)$/.exec(s);if(m){const py={冷:'lěng',热:'rè',下雨:'xià yǔ',下雪:'xià xuě'}[m[2]],ru={冷:'не холодно',热:'не жарко',下雨:'дождя нет',下雪:'снега нет'}[m[2]];return known(raw,(m[1]?TIMES[m[1]][0]+' ':'')+(s.includes('天气')?'tiānqì ':'')+(m[2]==='冷'?'bù ':'bú ')+py+'.',(m[1]?TIMES[m[1]][1]+' ':'')+ru+'.',7,{fact:{weather:'不'+m[2],time:m[1]||'今天'}})}
  m=/^(今天|明天|昨天)?(?:天气)?(很冷|很热|很好|下雨|在下雨|下雪|晴天|阴天|有风)$/.exec(s);if(m){const t=m[1]||((contextTopic?.time)||'今天'),w=WEATHER[m[2]];return known(raw,(m[1]?TIMES[t][0]+' ':'')+(s.includes('天气')?'tiānqì ':'')+w[0]+'.',(m[1]?TIMES[t][1]+' ':'')+w[1]+'.',7,{fact:{weather:m[2],time:t}})}
  m=/^(春天|夏天|秋天|冬天)(很冷|很热|下雨|下雪)$/.exec(s);if(m){const seasons={春天:['Chūntiān','Весной'],夏天:['Xiàtiān','Летом'],秋天:['Qiūtiān','Осенью'],冬天:['Dōngtiān','Зимой']};return known(raw,seasons[m[1]][0]+' '+WEATHER[m[2]][0]+'.',seasons[m[1]][1]+' '+WEATHER[m[2]][1]+'.',7)}
 }
 if(allowed.includes(4)){
  m=/^(今天|明天|昨天)?(是)?星期([一二三四五六日天1-6])$/.exec(s);if(m){const day=weekdayForDate(new Date(2026,10,Number.isNaN(Number(m[3]))?({一:9,二:10,三:11,四:12,五:13,六:14,日:15,天:15}[m[3]]):8+Number(m[3])));return known(raw,(m[1]?TIMES[m[1]][0]+' ':'')+(m[2]?'shì ':'')+'xīngqī '+(m[3]==='天'?'tiān':day.py)+'.',(m[1]?TIMES[m[1]][1]+' ':'')+day.ru+'.',4)}
 }
 if(allowed.includes(5)){
  m=/^([零一二三四五六七八九\d]{4})年([一二三四五六七八九十\d]+)月([一二三四五六七八九十\d]+)(日|号)$/.exec(s);if(m){const digits='零一二三四五六七八九',year=Number([...m[1]].map(ch=>/\d/.test(ch)?ch:digits.indexOf(ch)).join('')),month=parseNumber(m[2]),day=parseNumber(m[3]);if(year>=1000&&month>0&&month<=12&&day>0&&day<=new Date(year,month,0).getDate())return known(raw,cap([...String(year)].map(ch=>NUMPY[Number(ch)]).join(' '))+' nián '+numberPy(month)+' yuè '+numberPy(day)+(m[4]==='号'?' hào.':' rì.'),day+'.'+String(month).padStart(2,'0')+'.'+year+'.',5)}
  m=/^(今天|明天|昨天)?(?:是)?([一二三四五六七八九十\d]+)月([一二三四五六七八九十\d]+)(号|日)$/.exec(s);if(m){const month=parseNumber(m[2]),day=parseNumber(m[3]);if(month>0&&month<=12&&day>0&&day<=new Date(2024,month,0).getDate())return known(raw,(m[1]?TIMES[m[1]][0]+' ':'')+(s.includes('是')?'shì ':'')+numberPy(month)+' yuè '+numberPy(day)+(m[4]==='日'?' rì.':' hào.'),(m[1]?TIMES[m[1]][1]+' ':'')+day+'.'+String(month).padStart(2,'0')+'.',5)}
 }
 if(allowed.includes(3)){const n=parseNumber(s);if(n!==null)return known(raw,cap(numberPy(n)),String(n),3)}
 return null;
}
function correction(raw,allowed,context,curriculum){
 const s=normalize(raw);let fixed,why;
 if(allowed.includes(6)&&/^(我|你|他|她)不有(哥哥|姐姐|弟弟|妹妹|妈妈|爸爸)$/.test(s)){fixed=s.replace('不有','没有');why='Отрицание 有 — 没有, а не 不有.'}
 if(allowed.includes(7)&&/^(今天|明天|昨天)(?:天气)?是(很冷|很热|冷|热)$/.test(s)){fixed=s.replace('是','');if(/(今天|明天|昨天|天气)(冷|热)$/.test(fixed))fixed=fixed.replace(/(冷|热)$/,'很$1');why='Для описания погоды перед 冷 / 热 связка 是 не нужна.'}
 if(allowed.includes(2)&&/^(我|你|他|她)是(很忙|很高兴|忙)$/.test(s)){fixed=s.replace('是','');if(fixed.endsWith('忙')&&!fixed.includes('很'))fixed=fixed.replace('忙','很忙');why='Перед прилагательным 忙 не ставят 是: 我很忙.'}
 if(allowed.includes(3)&&/^我是[一二两三四五六七八九十百\d]+岁$/.test(s)){fixed=s.replace('我是','我');why='Возраст выражают без 是: 我…岁.'}
 if(allowed.includes(4)&&/星期七$/.test(s)){fixed=s.replace('星期七','星期天');why='Воскресенье — 星期天 или 星期日, а не 星期七.'}
 if(!fixed)return null;
 const corrected=analyzeLearner(fixed,allowed,context,curriculum,false);if(!corrected.known)return null;
 return {known:false,hanzi:raw,topic:corrected.topic,translation:null,probable:corrected.translation,correction:{hanzi:fixed+'。',pinyin:corrected.pinyin,ru:corrected.translation,why}};
}
export function analyzeLearner(raw,allowed=[1],context=null,curriculum=[],checkErrors=true){
 raw=String(raw||'').trim();const s=normalize(raw),q=findQuestion(s),extraQuestion=lookupExtendedQuestion(raw);
 if(extraQuestion)return known(raw,extraQuestion.pinyin,extraQuestion.ru,extraQuestion.lesson);
 if(q){let py=q.pinyin;if(s.includes('的天气'))py=py.replace(' tiānqì',' de tiānqì');if(s.includes('是星期')||s.includes('是几月')||s.includes('是几号'))py=py.replace(' ',' shì ');if(s==='现在几月')py='Xiànzài jǐ yuè?';if(s==='今年几几年')py='Jīnnián jǐ jǐ nián?';if(s.endsWith('日'))py=py.replace('hào','rì');if(s==='你叫什么')py='Nǐ jiào shénme?';if(/^你(妈妈|爸爸|哥哥|姐姐|弟弟|妹妹)多大$/.test(s))py=py.replace('jǐ suì','duō dà');if(s.startsWith('你多大'))py='Nǐ duō dà'+(s.endsWith('了')?' le':'')+'?';return known(raw,py,q.translation,q.topic)}
 if(checkErrors){const c=correction(raw,allowed,context,curriculum);if(c)return c}
 const addition=extensionStatement(raw,allowed,context);if(addition)return addition;
 const parsed=grammar(raw,allowed,context);if(parsed)return parsed;
 const studied=recognizeApprovedPhrase(raw,allowed);if(studied)return studied;
 const order=[context?.lesson,...allowed].filter((n,i,a)=>allowed.includes(n)&&a.indexOf(n)===i);
 for(const topic of order){
  const t=curriculum[topic-1];
  const exact=[...(t?.dialogue||[]).map(x=>[x[1],x[2],x[3]]),...(t?.rules||[]).map(x=>[x[2],x[3],x[4]])].find(x=>normalize(x[0])===s);
  if(exact)return known(raw,exact[1],exact[2],topic);
  const original=interpretUtterance(raw,topic,curriculum);if(original.known)return {...original,topic};
 }
 // v302: compose only teacher-reviewed HSK1 grammatical families using unlocked words.
 const built=interpretBrainSentence(raw,allowed,curriculum);if(built)return built;
 // Tone checking here concerns written pinyin only, never a microphone recording.
 if(checkErrors&&/[a-z]/i.test(raw)&&!/[\u3400-\u9fff]/.test(raw))for(const topic of allowed){
  const candidates=[...(curriculum[topic-1]?.dialogue||[]).map(x=>[x[1],x[2],x[3]]),...(curriculum[topic-1]?.rules||[]).map(x=>[x[2],x[3],x[4]])];
  const same=candidates.find(x=>x[1]?.split(/\s+/).length>=3&&strip(x[1])===strip(raw));if(same&&normalize(same[1])!==s)return {known:false,hanzi:raw,topic,translation:null,probable:same[2],correction:{hanzi:same[0],pinyin:same[1],ru:same[2],why:'Проверь обозначения тонов в написанном пиньине. Это не оценка тонов голоса.'}};
 }
 const words=[];let remaining=raw;
 for(const w of allowed.flatMap(n=>curriculum[n-1]?.words||[]).sort((a,b)=>b[0].length-a[0].length))if(remaining.includes(w[0])&&!words.some(x=>x[0]===w[0])){words.push(w);remaining=remaining.split(w[0]).join(' ')}
 return {known:false,hanzi:raw,translation:null,words:words.slice(0,5)};
}
function answersPrompt(spoken,raw,prompt){
 if(!prompt)return false;const s=normalize(raw);
 if(prompt.intent==='pattern')return !!patternStudentAnswer(raw,prompt,[prompt.lesson,...(prompt.requires||[])],new Date(prompt.calendarDate||Date.now()));
 if(prompt.intent==='extension')return prompt.accepted?.some(a=>normalize(a)===s)||false;
 if(prompt.lesson===6&&spoken.family){const f=spoken.family,n=prompt.relative||'哥哥';return !f.present.includes(f.absent)&&(f.absent===n||f.present.includes(n))}
 if(prompt.lesson===2&&normalize(prompt.hanzi||prompt.panda)==='你是老师吗'&&spoken.fact?.role)return spoken.fact.subject==='我'&&(spoken.fact.role==='老师'||spoken.fact.role==='学生'&&!spoken.fact.negative);
 if(prompt.intent==='name')return !!spoken.fact?.name;
 if(prompt.intent==='age')return !!spoken.fact?.age;
 if(prompt.intent==='relative-age')return spoken.fact?.relative===prompt.relative&&!!spoken.fact?.relativeAge;
 if(prompt.intent==='quantity')return spoken.fact?.quantity!==undefined;
 if(prompt.intent==='repeat')return normalize(prompt.hanzi)===s;
 if(prompt.intent==='extension'&&prompt.accepted?.some(a=>normalize(a)===s))return true;
 if(prompt.intent==='weather')return spoken.topic===7&&spoken.fact?.weather&&(!/^(今天|明天|昨天)/.test(s)||s.startsWith(prompt.time));
 if(prompt.intent==='date'){
  const expected=calendarReply(prompt.time,'date',new Date(prompt.calendarDate||Date.now()));return [normalize(expected.hanzi),normalize(expected.hanzi).replace(prompt.time,''),normalize(expected.hanzi).replace(prompt.time,prompt.time+'是')].includes(s)||prompt.accepted?.includes(s);
 }
 return prompt.verifiedLines?verifyAnswerFor(prompt.verifiedLines,1,raw).ok:prompt.accepted?.some(a=>normalize(a)===s);
}
function lessonExplanation(raw,allowed,topic,curriculum){
 const s=normalize(raw),request=/(是什么意思|什么意思|怎么读|怎么说|的意思是什么)$/.exec(s);
 const rus=/(что значит|что означает|переведи|как читается|как сказать|объясни|грамматик|правил|порядок слов|тон|произнош)/i.test(raw);
 if(!request&&!rus)return null;
 const target=request?s.slice(0,request.index):null;
 if(target){const n=parseNumber(target);if(n!==null&&allowed.includes(3))return {kind:'explanation',lesson:3,reply:line(ZH(n),cap(numberPy(n)),String(n)),explanation:'Число '+n+': '+ZH(n)+' — '+numberPy(n)+'.'}}
 const order=[topic,...allowed].filter((n,i,a)=>allowed.includes(n)&&a.indexOf(n)===i);
 for(const n of order){
  const t=curriculum[n-1],word=(t?.words||[]).find(w=>target?normalize(w[0])===target:raw.includes(w[0]));
  if(word)return {kind:'explanation',lesson:n,reply:line(word[0],word[1],word[2]),explanation:word.join(' — ')};
 }
 if(rus&&allowed.includes(topic)){
  const text=answerCurriculumQuestion(raw,topic,curriculum);if(!text.includes('пока нет проверенного ответа')){
   const rule=curriculum[topic-1]?.rules?.[0];return {kind:'explanation',lesson:topic,reply:line(rule?.[2]||'你好！',rule?.[3]||'Nǐ hǎo!',rule?.[4]||'Привет!'),explanation:text};
  }
 }
 return {kind:'clarify',message:'Не нашла проверенного объяснения в пройденных уроках. Укажи слово или выбери нужную тему.'};
}

/* v301: follow up with a reviewed question from the same unlocked lesson.
 * A learner's question is never mistaken for the learner's own answer to it.
 * Avoid asking today's date/weekday/weather again immediately after giving it.
 */
function linkedQuestion(raw,lesson,allowed,date,profile={}){
 if(!allowed.includes(lesson))return null;
 const pool=[...topicPrompts(lesson,date,profile),...patternPrompts(lesson,date,allowed)];
 const recent=new Set((profile.recentQuestions||[]).map(normalize));
 const source=normalize(raw),relation=/哥哥|姐姐|弟弟|妹妹|妈妈|爸爸|春天|夏天|秋天|冬天/.exec(source)?.[0]||'';
 const isCalendar=[4,5,7].includes(lesson);
 let ranked=pool.filter(x=>!recent.has(normalize(x.hanzi))&&x.requires?.every(n=>allowed.includes(n))!==false);
 // Vocabulary questions lead to practice involving that exact learned word.
 if(source.length>1){const related=ranked.find(x=>normalize(x.hanzi).includes(source));if(related)return {...related,isContextual:true}}
 if(lesson===3&&(source.includes('后面')||source.includes('前面'))){
  const family=source.includes('后面')?'next-number':'previous-number';
  const peers=ranked.filter(x=>x.family===family);
  const current=peers.findIndex(x=>normalize(x.hanzi)===source);
  const next=peers[(current+1+peers.length)%peers.length];
  if(next)return {...next,isContextual:true};
 }
 if(isCalendar){
  const next=source.startsWith('今天')?'明天':source.startsWith('明天')?'今天':null;
  if(next){
   const day=ranked.filter(x=>normalize(x.hanzi).startsWith(next)&&
    (lesson===4?/星期几/.test(x.hanzi):lesson===5?/几月几号/.test(x.hanzi):/天气怎么样/.test(x.hanzi)));
   if(day.length)return {...day[0],isContextual:true};
  }
 }
 ranked=ranked.map((item,index)=>({item,index,score:
   (relation&&normalize(item.hanzi).includes(relation)?100:0)+
   (!isCalendar&&normalize(item.hanzi)===source?80:0)+
   (lesson===3&&source.includes('后面')&&item.family==='next-number'?40:0)+
   (lesson===6&&item.family==='relative-age'?10:0)
 })).sort((a,b)=>b.score-a.score||a.index-b.index);
 return ranked.length?{...ranked[0].item,isContextual:true}:null;
}
function extendQuestion(result,raw,allowed,date,profile){
 if(!result||result.kind!=='question'||!allowed.includes(result.lesson))return result;
 const linked=linkedQuestion(raw,result.lesson,allowed,date,profile);
 const retain=result.followup?.intent==='relative-age'||result.followup?.isContextual;
 return {...result,followup:retain?result.followup:(linked||result.followup||null)};
}
export function answerLive(raw,options={}){
 const {allowed=[1],topic=1,prompt=null,curriculum=[],date=new Date(),turn=0,profile={}}=options;
 raw=String(raw||'').trim();const s=normalize(raw);if(!raw)return {kind:'empty',message:'Скажи или напиши фразу на китайском.'};
 // Social and common-family questions must work before any broad fallback.
 // Keep our known corrections independent of experimental on-device AI.
 const basic=answerBasicConversation(raw,allowed);if(basic)return basic;
 // Rewrite only explicit meaning-preserving learner variants. Keep original
 // transcript visible, without claiming a made-up pinyin for the new wording.
 const variant=questionVariant(raw);
 // Previously reviewed questions keep their exact authored tone-marked pinyin,
 // translation and specific reply. Do not downgrade them to an alias fallback.
 if(variant&&!lookupExtendedQuestion(raw)&&!findQuestion(s)&&!patternQuestion(raw,allowed,date)&&normalize(variant.canonical)!==s){
  const resolved=answerLive(variant.canonical,options);
  if(resolved.kind==='question')return {...resolved,spoken:{...resolved.spoken,known:true,hanzi:raw,pinyin:null,topic:variant.lesson,variantOf:variant.canonical}};
  if(resolved.kind==='locked')return {...resolved,spoken:{known:false,hanzi:raw,pinyin:null,translation:null,topic:variant.lesson}};
  return {kind:'clarify',spoken:{known:false,hanzi:raw,translation:null},message:'Пока не нашла проверенного ответа на эту формулировку.'};
 }
 const answerVariant=learnerAnswerVariant(raw,prompt);
 if(answerVariant&&normalize(answerVariant)!==s){
  const resolved=answerLive(answerVariant,options);
  if(['answer','statement'].includes(resolved.kind)&&resolved.spoken?.known)
   return {...resolved,spoken:{...resolved.spoken,hanzi:raw,pinyin:null,variantOf:answerVariant}};
 }

 // Free HSK1→HSK2 bridge only. The unreleased HSK2 seed is NOT available here.
 const bridge=answerHsk2Bridge(raw,{prompt});if(bridge)return bridge;
 // Promote valid short HSK1/introductory phrases into full sentences, never marking them ungrammatical.
 const coached=coachSentence(raw,{allowed,prompt});if(coached)return coached;
 let spoken=analyzeLearner(raw,allowed,prompt,curriculum);
 if(!spoken.correction){
  // For short answers such as 是/没有, the active lesson question supplies the
  // missing subject and meaning; otherwise the response isn't safely translatable.
  spoken=patternStudentAnswer(raw,prompt,allowed,date)||spoken;
  if(!spoken.known)spoken=checkedExtensionReply(raw,prompt,allowed,date)||spoken;
 }
 const vocabulary=brainQuestion(raw,allowed,curriculum);
 if(vocabulary){
  if(vocabulary.kind==='explanation')return {...vocabulary,followup:linkedQuestion(vocabulary.vocabWord,vocabulary.lesson,allowed,date,profile)};
  return {...vocabulary,spoken};
 }
 const explanation=lessonExplanation(raw,allowed,topic,curriculum);if(explanation)return {...explanation,spoken};
 if(spoken.family?.absent&&spoken.family.present.includes(spoken.family.absent))return {kind:'clarify',spoken:{...spoken,known:false,translation:null},message:'В одной фразе одновременно сказано «есть» и «нет» об одном родственнике. Уточни, какой вариант ты имеешь в виду.'};
 if(spoken.correction)return {kind:'correction',spoken,lesson:spoken.topic,message:spoken.correction.why};
 const extension=extensionAnswer(raw,allowed,date,profile);
 if(extension){
  if(extension.kind==='locked')return {...extension,spoken};
  const followup=extension.lesson===6&&turn%2===0?rememberedFamilyFollowup(profile,allowed,[]):null;
  return extendQuestion({...extension,spoken,followup},raw,allowed,date,profile);
 }
 // Yes/no calendar and weather questions need a truth value. The older
 // general parser sometimes answered them with just the date/condition.
 const semanticBoolean=/^(今天|明天|昨天)是星期[一二三四五六天日]吗$/.test(s)
  ||/^(今天|明天|昨天)(下雨|下雪|冷|热)吗$/.test(s);
 if(semanticBoolean){
  const checked=patternQuestion(raw,allowed,date);
  if(checked)return extendQuestion(checked,raw,allowed,date,profile);
 }
 const q=findQuestion(s);
 if(q){
  if(!allowed.includes(q.topic)||q.requires?.some(n=>!allowed.includes(n)))return {kind:'locked',spoken,lesson:q.topic,message:'Это тема урока '+(q.requires?.find(n=>!allowed.includes(n))||q.topic)+'. Открой этот урок в выборе сверху или вернись к уже пройденным темам.'};
  const reply=q.reply(date),followup=turn%2===0?nextTopicPrompt(q.topic,[raw],date,profile):null;
  return extendQuestion({kind:'question',spoken,lesson:q.topic,reply,followup},raw,allowed,date,profile);
 }
 // Unknown variants of a known grammatical family are handled by the shared
 // slot engine, but old authored lesson dialogue takes precedence.
 const patternedQuestion=patternQuestion(raw,allowed,date);
 if(patternedQuestion)return extendQuestion(patternedQuestion,raw,allowed,date,profile);
 if(!spoken.known&&allowed.includes(7)&&(/(?:погод|прогноз)/i.test(raw)||/(真实|实际|现在|北京|莫斯科).*(天气|下雨|冷|热)/.test(s)))return {kind:'clarify',spoken,message:'Настоящий прогноз я не получаю. Могу поддержать учебный разговор о погоде: 今天天气怎么样？'};
 const old=answerNonStop(raw,allowed,prompt,curriculum,date);
 if(old.kind==='question')return extendQuestion({...old,spoken:spoken.known?spoken:old.spoken,followup:s==='谢谢'?null:turn%3===2?nextTopicPrompt(topic,[],date,profile):null},raw,allowed,date,profile);
 if(!spoken.known){return {kind:'clarify',spoken,message:spoken.words?.length?'Знакомые слова разобраны ниже. Уточни смысл или попробуй предложение из подсказки.':'Точный смысл пока не подтверждён. Попробуй фразу из пройденного урока или уточни вопрос.'}}
 const offQuestion=prompt&&!answersPrompt(spoken,raw,prompt)&&spoken.topic===prompt.lesson;
 if(offQuestion&&!spoken.brainComposed&&!spoken.family?.present?.length){return {kind:'statement',spoken,lesson:spoken.topic,message:'Фраза понятна, но это не ответ на текущий вопрос. '+prompt.instruction}}
 const active=spoken.topic||topic,answered=answersPrompt(spoken,raw,prompt);
 const futureProfile={...profile,family:{...profile.family,...Object.fromEntries((spoken.family?.present||[]).map(n=>[n,true]))}};
 if(spoken.family?.absent)futureProfile.family[spoken.family.absent]=false;
 const contextual=active===6?rememberedFamilyFollowup(futureProfile,allowed,profile.recentQuestions||[prompt?.hanzi||'']):null;
 const templatedFollowup=conversationalFollowup(spoken,allowed,futureProfile,profile.recentQuestions||[prompt?.hanzi||''],date);
 const followup=contextual||templatedFollowup||nextTopicPrompt(active,[],date,futureProfile);
 const isExtensionAnswer=answered&&(prompt?.intent==='extension'||prompt?.intent==='pattern');
 let reply=isExtensionAnswer?line('很好！','Hěn hǎo!','Отлично!'):line('谢谢！','Xièxie!','Спасибо!');
 if(!isExtensionAnswer&&active===2&&spoken.fact?.role)reply=line(spoken.fact.role==='老师'&&!spoken.fact.negative?'我也是老师。':'我是老师。',spoken.fact.role==='老师'&&!spoken.fact.negative?'Wǒ yě shì lǎoshī.':'Wǒ shì lǎoshī.',spoken.fact.role==='老师'&&!spoken.fact.negative?'Я тоже учитель.':'Я учитель.',ROLE);
 if(!isExtensionAnswer&&active===3&&spoken.fact?.age)reply=line('我三岁。','Wǒ sān suì.','Мне три года.',ROLE);
 if(!isExtensionAnswer&&active===4&&answered)reply=calendarReply(prompt?.time||'今天','weekday',date);
 if(!isExtensionAnswer&&active===5&&answered)reply=calendarReply(prompt?.time||'今天','date',date);
 if(!isExtensionAnswer&&active===6&&spoken.family)reply=line(normalize(raw).replace(/我/g,'你')+'。',(spoken.pinyin||'').replace(/Wǒ/g,'Nǐ').replace(/wǒ/g,'nǐ'),'Ты сообщил: '+spoken.translation.replace('У меня','У тебя'),'Повторяем смысл твоего ответа.');
 if(!isExtensionAnswer&&active===7&&spoken.fact?.weather)reply=line(normalize(raw)+'。',spoken.pinyin,'Ты сообщил: '+spoken.translation,'Повторяем твоё описание погоды, а не настоящий прогноз.');
 return {kind:answered?'answer':'statement',spoken,lesson:active,reply,followup:(answered||turn%2===0)?followup:null,message:answered?'Ответ по смыслу подходит.':offQuestion?'Поняла твою фразу, но это не ответ на предыдущий вопрос. Можно продолжить тему семьи.':'Я поняла твою фразу.'};
}
