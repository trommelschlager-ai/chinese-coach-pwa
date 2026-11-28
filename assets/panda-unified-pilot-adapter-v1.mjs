/* Shared reviewed free chat. Exact voice is required for Panda AI; Street may explicitly permit reviewed text-only replies. */
import {initialSemanticState,reduceSemanticContext} from './panda-unified-context-v1.mjs';
import {planSemanticConversationTurn} from './panda-unified-replies-v1.mjs';
const SAFE_REPLIES=new Set(['那你休息一下吧。','你想学什么？','你为什么想学中文？','然后呢？','你打算什么时候去？','你接下来想做什么？','我在和你聊天。','我今天和你练习中文。','你打算怎么去？','祝你旅途愉快！','你有什么爱好？','你想吃什么？','好的。我们聊点别的吧！','你经常做这件事吗？','还要别的吗？','你周末喜欢做什么？','你还喜欢吃什么？','你周末有什么计划？','你早上吃早饭吗？','你晚上几点睡觉？','你今天忙吗？','你几点去上班？','你有兄弟姐妹吗？','明白了。你家有几口人？','我是虚拟熊猫，没有实际的旅行经历。','你想练习什么？','没关系，我们慢慢来。','你想买什么？','你喜欢什么颜色？','你想买几件？']);

/* Living Conversation: reviewed, bounded reactions. Never infer tone from text.
 * A short evaluation is interpreted only against the immediately preceding question. */
const livingClean=s=>String(s??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const evaluations={
 '非常好':['Fēicháng hǎo.','Очень хорошо.','positive'],
 '我非常好':['Wǒ fēicháng hǎo.','У меня всё отлично.','positive'],
 '很好':['Hěn hǎo.','Хорошо.','positive'],
 '我很好':['Wǒ hěn hǎo.','У меня всё хорошо.','positive'],
 '不错':['Búcuò.','Неплохо.','positive'],
 '挺好的':['Tǐng hǎo de.','Вполне хорошо.','positive'],
 '还好':['Hái hǎo.','Нормально.','neutral'],
 '一般':['Yìbān.','Так себе.','neutral'],
 '不好':['Bù hǎo.','Плохо.','negative'],
 '我不好':['Wǒ bù hǎo.','У меня не всё хорошо.','negative'],
 '不太好':['Bú tài hǎo.','Не очень хорошо.','negative']
};
const moods={
 '我今天很累':['Wǒ jīntiān hěn lèi.','Я сегодня очень устал(а).','tired'],
 '我很累':['Wǒ hěn lèi.','Я очень устал(а).','tired'],
 '我有点累':['Wǒ yǒudiǎn lèi.','Я немного устал(а).','tired'],
 '我今天很开心':['Wǒ jīntiān hěn kāixīn.','Я сегодня очень рад(а).','happy'],
 '我很开心':['Wǒ hěn kāixīn.','Я очень рад(а).','happy'],
 '我今天不开心':['Wǒ jīntiān bù kāixīn.','Я сегодня не в настроении.','sad'],
 '我不开心':['Wǒ bù kāixīn.','Я не в настроении.','sad']
};
const pools={
 wellbeing:[
 ['太好了！为什么这么开心？','Tài hǎo le! Wèishénme zhème kāixīn?','Отлично! Почему ты так рад(а)?'],
 ['真不错！你今天做了什么？','Zhēn búcuò! Nǐ jīntiān zuò le shénme?','Здорово! Что ты сегодня делал(а)?'],
 ['太好了！你今天有什么计划？','Tài hǎo le! Nǐ jīntiān yǒu shénme jìhuà?','Отлично! Какие у тебя планы на сегодня?']],
 sleep:[
 ['那就好！你睡了几个小时？','Nà jiù hǎo! Nǐ shuì le jǐ ge xiǎoshí?','Хорошо! Сколько часов ты спал(а)?'],
 ['真不错！你几点起床的？','Zhēn búcuò! Nǐ jǐ diǎn qǐchuáng de?','Здорово! Во сколько ты встал(а)?']],
 lesson:[
 ['谢谢！你今天学会了什么？','Xièxie! Nǐ jīntiān xuéhuì le shénme?','Спасибо! Чему ты сегодня научился(ась)?'],
 ['太好了！你还想学什么？','Tài hǎo le! Nǐ hái xiǎng xué shénme?','Отлично! Что ещё хочешь изучить?']],
 work:[
 ['真不错！你今天做了什么？','Zhēn búcuò! Nǐ jīntiān zuò le shénme?','Здорово! Что ты сегодня делал(а)?'],
 ['太好了！你喜欢你的工作吗？','Tài hǎo le! Nǐ xǐhuan nǐ de gōngzuò ma?','Отлично! Тебе нравится твоя работа?']],
 food:[
 ['真不错！你还喜欢吃什么？','Zhēn búcuò! Nǐ hái xǐhuan chī shénme?','Здорово! Что ещё ты любишь есть?'],
 ['太好了！你经常吃这个吗？','Tài hǎo le! Nǐ jīngcháng chī zhège ma?','Отлично! Ты часто это ешь?']],
 tired:[
 ['那你休息一下吧。','Nà nǐ xiūxi yíxià ba.','Тогда немного отдохни.'],
 ['你今天很忙吗？','Nǐ jīntiān hěn máng ma?','Ты сегодня очень занят(а)?']],
 sad:[
 ['怎么了？你想说说吗？','Zěnme le? Nǐ xiǎng shuōshuo ma?','Что случилось? Хочешь рассказать?'],
 ['没关系，我们慢慢来。','Méi guānxi, wǒmen mànmàn lái.','Ничего страшного, будем двигаться постепенно.']],
 neutral:[
 ['你想说说今天的事吗？','Nǐ xiǎng shuōshuo jīntiān de shì ma?','Хочешь рассказать о сегодняшнем дне?'],
 ['你今天想做什么？','Nǐ jīntiān xiǎng zuò shénme?','Что ты сегодня хочешь делать?']],
 negativeSleep:[
 ['你昨晚睡了几个小时？','Nǐ zuówǎn shuì le jǐ ge xiǎoshí?','Сколько часов ты спал(а) прошлой ночью?'],
 ['你今天想休息吗？','Nǐ jīntiān xiǎng xiūxi ma?','Хочешь сегодня отдохнуть?']],
 negativeLesson:[
 ['你觉得什么最难？','Nǐ juéde shénme zuì nán?','Что тебе кажется самым трудным?'],
 ['你想练习什么？','Nǐ xiǎng liànxí shénme?','Что хочешь потренировать?']],
 negativeOther:[
 ['为什么呢？','Wèishénme ne?','А почему?'],
 ['你能多说一点儿吗？','Nǐ néng duō shuō yìdiǎnr ma?','Можешь рассказать немного подробнее?']]
};
function livingTopic(previous){
 const q=String(previous??'').normalize('NFC').split(/[。！!]/u).at(-1).replace(/[\p{P}\s]/gu,'');
 if(/^(?:你)?(?:昨晚|昨天晚上|今天|最近)?睡得怎么样$/u.test(q))return 'sleep';
 if(/^(?:你觉得)?(?:今天的?|这节|这堂|这个)?(?:中文)?(?:课|课程)(?:怎么样|好吗)$/u.test(q))return 'lesson';
 if(/^(?:你觉得)?(?:你)?(?:今天的?|最近的?|你的)?工作(?:怎么样|好吗)$/u.test(q))return 'work';
 if(/^(?:你觉得)?(?:这个菜|这道菜|今天的饭|饭菜|这个|这家餐厅)(?:怎么样|好吃吗)$/u.test(q))return 'food';
 if(/^(?:你)?(?:今天|最近)?(?:怎么样|好吗|还好吗|过得怎么样)$/u.test(q)&&q!=='怎么样')return 'wellbeing';
 return null;
}
function planLiving(raw,previous,recent,lookupExact){
 const key=livingClean(raw),mood=Object.hasOwn(moods,key)?moods[key]:null,evalData=Object.hasOwn(evaluations,key)?evaluations[key]:null;
 const topic=livingTopic(previous);
 // Subject-explicit self reports are valid without a prior question; bare evaluations are not.
 const data=mood||evalData;
 if(!data||(!mood&&!topic&&!key.startsWith('我')))return null;
 if(!mood&&key.startsWith('我')&&topic&&topic!=='wellbeing')return null;
 const [pinyin,translation,polarity]=data;
 const group=mood?(polarity==='happy'?'wellbeing':polarity):polarity==='positive'?(topic||'wellbeing'):topic==='sleep'?'negativeSleep':topic==='lesson'?'negativeLesson':(!topic||topic==='wellbeing')?(polarity==='negative'?'sad':'neutral'):'negativeOther';
 const options=pools[group];
 if(!options)return null;
 const ranked=options.map(([hanzi,pinyin,ru],index)=>{
   const audio=typeof lookupExact==='function'?lookupExact(hanzi):null;
   return {line:{hanzi,pinyin,ru},audio:typeof audio?.src==='string'&&audio.src?audio:null,last:recent.lastIndexOf(livingClean(hanzi)),index};
 }).sort((a,b)=>a.last-b.last||Number(!!b.audio)-Number(!!a.audio)||a.index-b.index);
 const picked=ranked[0];
 return {kind:'living-reaction',line:picked.line,audio:picked.audio,voiceStatus:picked.audio?'registered-exact':'text-only',
  continuesLearnerTurn:false,toneVerified:false,semantic:{intent:'living-reaction',topic:topic||group,polarity},
  spoken:{known:true,pinyin,translation,toneVerified:false}};
}

export function createSemanticPilot({enabled=false,lookupExact=null,correctGrammar=null,metadata=null,allowTextOnly=false,livingConversation=false}={}){
 let state=initialSemanticState(),pending=false,recent=[];
 return {
  reset(){state=initialSemanticState();pending=false;recent=[];},
  observePanda(line,{continuesLearnerTurn=false,legacyFamily=false}={}){
   if(line?.hanzi)recent=[...recent,livingClean(line.hanzi)].slice(-24);
   state=reduceSemanticContext(state,{type:'panda',line,continuesLearnerTurn:pending&&continuesLearnerTurn===true,legacyFamily}).state;pending=false;
  },
  planLiving(raw,{mode='graded',confidence=null}={}){
   if(!enabled||!livingConversation||mode!=='free-chat'||!(confidence===null||(Number.isFinite(confidence)&&confidence>=.85)))return null;
   const living=planLiving(raw,state.lastSpeaker==='panda'?state.lastPandaTurn?.hanzi:null,recent,lookupExact);
   if(living){state=reduceSemanticContext(state,{type:'learner',raw}).state;pending=false;}
   return living;
  },
  plan(raw,{mode='graded',confidence=null}={}){
   if(!enabled||mode!=='free-chat'){state=initialSemanticState();pending=false;recent=[];return null;}
   if(livingConversation&&(confidence===null||(Number.isFinite(confidence)&&confidence>=.85))){
    const living=planLiving(raw,state.lastSpeaker==='panda'?state.lastPandaTurn?.hanzi:null,recent,lookupExact);
    if(living){state=reduceSemanticContext(state,{type:'learner',raw}).state;pending=false;return living;}
   }
   const oldMemory=state.hobbyMemory,oldTopics=state.topicMemory;
   const c=(confidence===null||(Number.isFinite(confidence)&&confidence>=.85))&&typeof correctGrammar==='function'?correctGrammar(raw,{confidence})?.spoken?.correction:null;
   const inline=c?.category==='grammar'&&!c.uncertain&&c.hanzi&&c.pinyin&&c.ru&&c.why?c:null;
   const effective=inline?inline.hanzi:raw;
   const step=planSemanticConversationTurn(state,effective,{lookupExact});
   const spoken=typeof metadata==='function'?metadata(effective,step.semantic):null;
   state=step.state;pending=!!step.semantic;
   const reply=step.reply;
   const reference=reply?.kind==='repeat-exact'||reply?.kind==='explain-exact';
   if(!reply||!(reply.voiceStatus==='registered-exact'||(allowTextOnly===true&&typeof metadata==='function'&&spoken&&reply.voiceStatus==='text-only'))||(!reference&&!SAFE_REPLIES.has(reply.line.hanzi))||(typeof metadata==='function'&&!spoken)||(inline&&!spoken)){
    // Never create an unconfirmed new fact when the experimental route falls back.
    // An explicit correction, however, must still invalidate the old memory.
    if(step.semantic?.intent!=='correct-hobby-memory')state={...state,hobbyMemory:oldMemory,topicMemory:oldTopics};
    pending=false;
    return null;
   }
   return {...reply,semantic:step.semantic,...(spoken?{spoken:inline?{...spoken,known:false,hanzi:String(raw),probable:inline.ru,correction:{...inline,inlineConversation:true,retry:'Продолжай разговор. Исправленный вариант можно повторить позже.'}}:spoken}:{}),inlineCorrection:!!inline};
  },
  snapshot(){return JSON.parse(JSON.stringify(state));}
 };
}
