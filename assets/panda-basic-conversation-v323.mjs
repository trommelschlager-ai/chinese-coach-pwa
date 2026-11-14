// Panda Go v323 — verified basic social dialogue, not a generative model.
// Chinese and tone-marked pinyin are reviewed for THESE exact constructions.
// No made-up MP3, acoustic scoring or real personal facts.
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=live6';

const RELATIVES=Object.freeze({
 妈妈:{py:'māma',ru:'мама',ruNo:'мамы',gender:'她',has:true},
 爸爸:{py:'bàba',ru:'папа',ruNo:'папы',gender:'他',has:true},
 哥哥:{py:'gēge',ru:'старший брат',ruNo:'старшего брата',gender:'他',has:true},
 姐姐:{py:'jiějie',ru:'старшая сестра',ruNo:'старшей сестры',gender:'她',has:false},
 弟弟:{py:'dìdi',ru:'младший брат',ruNo:'младшего брата',gender:'他',has:false},
 妹妹:{py:'mèimei',ru:'младшая сестра',ruNo:'младшей сестры',gender:'她',has:true}
});
const makeLine=(hanzi,pinyin,ru)=>({hanzi,pinyin,ru,audioKey:lookupPilotAudio(hanzi)?hanzi:null});
const normalizeText=raw=>normalize(String(raw??''));
function questionPinyin(withDe,who,time,ending) {
 const a='Nǐ '+(withDe?'de ':'')+RELATIVES[who].py+' ';
 const b=time==='现在'?'xiànzài ':time==='今天'?'jīntiān ':'';
 const tails={怎么样:'zěnmeyàng?',怎么样了:'zěnmeyàng le?',还好吗:'hái hǎo ma?',好吗:'hǎo ma?',好不好:'hǎo bù hǎo?'};
 return a+b+tails[ending];
}
const getCorrection=(raw,correct,pinyin,ru,why)=>({
 kind:'correction',lesson:1,
 spoken:{known:false,hanzi:String(raw).trim(),topic:1,translation:null,
  probable:'Возможно, ты хотел спросить: '+ru,
  correction:{hanzi:correct,pinyin,ru,why}
 },
 message:why
});
export function answerBasicConversation(raw,allowed=[1]){
 const input=String(raw??'').trim(),s=normalizeText(input);
 if(!input||input.length>160)return null;
 // v336: everyday meal check-in. This is a complete question, even if the
 // current Non-Stop prompt happens to be about weather or another topic.
 if(/^你吃(饭)?了(吗|没有)$/.test(s)){
  const includesMeal=s.includes('饭');
  const spoken={known:true,hanzi:input,
   pinyin:includesMeal?(s.endsWith('没有')?'Nǐ chī fàn le méiyǒu?':'Nǐ chī fàn le ma?'):(s.endsWith('没有')?'Nǐ chī le méiyǒu?':'Nǐ chī le ma?'),
   translation:'Ты уже поел?',topic:1};
  const reply=makeLine('吃了，谢谢。','Chī le, xièxie.','Да, поела, спасибо.');
  const followup={hanzi:'你呢？',pinyin:'Nǐ ne?',ru:'А ты?',lesson:1,intent:'meal-checkin',
   isContextual:true,accepted:['我吃了','我吃饭了','我还没吃','我还没吃饭','我还没有吃','我还没有吃饭']};
  return {kind:'question',lesson:1,spoken,reply,followup,
   message:'Повседневный учебный диалог о еде; ответ вымышленного персонажа.'};
 }
 const mealResponse=/^我(还没|还没有)?吃(饭)?了?$/.exec(s);
 if(mealResponse){
  const [,notYet='',food='']=mealResponse;
  // "我吃" alone is an unfinished statement: don't mark it as a full answer.
  if((!notYet&&!s.endsWith('了'))||(notYet&&s.endsWith('了')))return null;
  const isNo=!!notYet;
  const spoken={known:true,hanzi:input,topic:1,
   pinyin:isNo?'Wǒ hái '+(notYet==='还没'?'méi':'méiyǒu')+' chī'+(food?' fàn':'')+'.':
    'Wǒ chī'+(food?' fàn':'')+' le.',
   translation:isNo?'Я ещё не ел.':'Я уже поел.'};
  return {kind:'statement',lesson:1,spoken,
   reply:makeLine('好的，我明白了。','Hǎo de, wǒ míngbai le.','Хорошо, я поняла.'),
   followup:null};
 }
 // A doubled 今天 occurs in speech recognition. Do not treat it as a valid
 // question, nor claim that acoustic tones were actually checked.
 if(/^(?:你)?今天今天(?:怎么样|好吗)$/.test(s)){
  return getCorrection(input,'你今天怎么样？','Nǐ jīntiān zěnmeyàng?','Как у тебя дела сегодня?',
   'Сегодня (今天, jīntiān) повторено дважды. Если спрашиваешь о самочувствии, скажи: 你今天怎么样？ Если о погоде: 今天天气怎么样？ Проверь распознанный текст.');
 }
 if(/^今天今天天气怎么样$/.test(s)){
  return getCorrection(input,'今天天气怎么样？','Jīntiān tiānqì zěnmeyàng?','Какая сегодня погода?',
   '今天 повторено дважды. Правильно: 今天天气怎么样？');
 }
 // v336: these everyday introductory questions and their replies have
 // EXACT written Luvvoice clips in the user's November corpus.
 const DAILY={
  '你住在哪儿':['Nǐ zhù zài nǎr?','Где ты живёшь?','我住在中国。','Wǒ zhù zài Zhōngguó.','Я живу в Китае.','Учебная сценка: Панда — вымышленный персонаж.'],
  '你住在哪里':['Nǐ zhù zài nǎlǐ?','Где ты живёшь?','我住在中国。','Wǒ zhù zài Zhōngguó.','Я живу в Китае.','Учебная сценка: Панда — вымышленный персонаж.'],
  '你会说中文吗':['Nǐ huì shuō Zhōngwén ma?','Ты умеешь говорить по-китайски?','会，我会说中文。','Huì, wǒ huì shuō Zhōngwén.','Да, я умею говорить по-китайски.'],
  '你为什么学习中文':['Nǐ wèishénme xuéxí Zhōngwén?','Почему ты изучаешь китайский?','因为我喜欢中文。','Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский язык.'],
  '你每天学习吗':['Nǐ měitiān xuéxí ma?','Ты учишься каждый день?','是，我每天学习。','Shì, wǒ měitiān xuéxí.','Да, я занимаюсь каждый день.'],
  '你累吗':['Nǐ lèi ma?','Ты устал?','我不累。','Wǒ bú lèi.','Я не устала.'],
  '你开心吗':['Nǐ kāixīn ma?','Ты рад?','我很开心。','Wǒ hěn kāixīn.','Я очень рада.'],
  '你高兴吗':['Nǐ gāoxìng ma?','Ты рад?','我很高兴。','Wǒ hěn gāoxìng.','Я рада.'],
  '你现在有空吗':['Nǐ xiànzài yǒu kòng ma?','У тебя сейчас есть время?','有，我现在有空。','Yǒu, wǒ xiànzài yǒu kòng.','Да, сейчас я свободна.']
 };
 const daily=DAILY[s];
 if(daily){
  const [pinyin,translation,response,responsePy,responseRu,context]=daily;
  const reply=makeLine(response,responsePy,responseRu);
  if(context)reply.context=context;
  return {kind:'question',lesson:1,
   spoken:{known:true,hanzi:input,pinyin,translation,topic:1},
   reply,followup:{hanzi:'你呢？',pinyin:'Nǐ ne?',ru:'А ты?',lesson:1,intent:'daily-checkin',
    isContextual:true,accepted:[]}};
 }
 const m=/^你(的)?(妈妈|爸爸|哥哥|姐姐|弟弟|妹妹)(现在|今天)?(怎么样了|怎么样|还好吗|好吗|好不好)$/.exec(s);
 if(!m)return null;
 const [,de,who,time='',ending]=m,person=RELATIVES[who];
 const relativeLabel=({妈妈:'твоя мама',爸爸:'твой папа',哥哥:'твой старший брат',姐姐:'твоя старшая сестра',弟弟:'твой младший брат',妹妹:'твоя младшая сестра'})[who];
 const translation='Как поживает '+relativeLabel+'?';
 const spoken={known:true,hanzi:input,pinyin:questionPinyin(Boolean(de),who,time,ending),
  translation:time==='今天'?'Как сегодня поживает '+relativeLabel+'?':time==='现在'?'Как сейчас поживает '+relativeLabel+'?':translation,
  topic:6};
 // Even a new learner may ask a simple social question about Panda's family.
 // This does not unlock the lesson-six curriculum or the unreviewed HSK2 draft.
 const lesson=allowed.includes(6)?6:1;
 spoken.topic=lesson;
 const answer=person.has
  ?makeLine(person.gender+'很好，谢谢！','Tā hěn hǎo, xièxie!','У '+(person.gender==='她'?'неё':'него')+' всё хорошо, спасибо!')
  :makeLine('我没有'+who+'。','Wǒ méiyǒu '+person.py+'.','У меня нет '+person.ruNo+'.');
 // Ask the learner about their own family, without asserting any fact about it.
 const followup={hanzi:'你有'+who+'吗？',pinyin:'Nǐ yǒu '+person.py+' ma?',
  ru:'У тебя есть '+person.ru+'?',lesson:6,intent:'basic-family-v323',isContextual:true,
  accepted:['我有'+who,'我没有'+who],audioKey:lookupPilotAudio('你有'+who+'吗')?'你有'+who+'吗':null};
 return {kind:'question',lesson,spoken,reply:answer,followup:lesson===6?followup:null,
  message:'Ответ Панды основан на её учебной вымышленной семье.'};
}
