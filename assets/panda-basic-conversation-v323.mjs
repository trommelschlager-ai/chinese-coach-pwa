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
 const m=/^你(的)?(妈妈|爸爸|哥哥|姐姐|弟弟|妹妹)(现在|今天)?(怎么样了|怎么样|还好吗|好吗|好不好)$/.exec(s);
 if(!m)return null;
 const [,de,who,time='',ending]=m,person=RELATIVES[who];
 const relativeLabel=({妈妈:'твоя мама',爸爸:'твой папа',哥哥:'твой старший брат',姐姐:'твоя старшая сестра',弟弟:'твой младший брат',妹妹:'твоя младшая сестра'})[who];
 const translation='Как поживает '+relativeLabel+'?';
 const spoken={known:true,hanzi:input,pinyin:questionPinyin(Boolean(de),who,time,ending),
  translation:time==='今天'?'Как сегодня поживает '+relativeLabel+'?':time==='现在'?'Как сейчас поживает '+relativeLabel+'?':translation,
  topic:6};
 if(!allowed.includes(6)){
  return {kind:'locked',lesson:6,spoken,message:'Вопрос о семье относится к уроку 6. Выбери урок 6, чтобы поговорить о родственниках Панды.'};
 }
 const answer=person.has
  ?makeLine(person.gender+'很好，谢谢！','Tā hěn hǎo, xièxie!','У '+(person.gender==='她'?'неё':'него')+' всё хорошо, спасибо!')
  :makeLine('我没有'+who+'。','Wǒ méiyǒu '+person.py+'.','У меня нет '+person.ruNo+'.');
 // Ask the learner about their own family, without asserting any fact about it.
 const followup={hanzi:'你有'+who+'吗？',pinyin:'Nǐ yǒu '+person.py+' ma?',
  ru:'У тебя есть '+person.ru+'?',lesson:6,intent:'basic-family-v323',isContextual:true,
  accepted:['我有'+who,'我没有'+who],audioKey:lookupPilotAudio('你有'+who+'吗')?'你有'+who+'吗':null};
 return {kind:'question',lesson:6,spoken,reply:answer,followup,
  message:'Ответ Панды основан на её учебной вымышленной семье.'};
}
