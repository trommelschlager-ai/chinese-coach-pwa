/* Shared deterministic response policy. Not wired into live UI. Unknown cases return null for the established engine. */
import {initialSemanticState,reduceSemanticContext,planReferenceReply} from './panda-unified-context-v1.mjs';
function chooseSemanticReply(semantic,prior,referencePlanner){
 if(!semantic)return null;
 const line=(hanzi,pinyin,ru,kind='reply',continuesLearnerTurn=false)=>({kind,line:{hanzi,pinyin,ru},continuesLearnerTurn,toneVerified:false});
 const askWhy=()=>line('为什么？','Wèishénme?','Почему?','follow-up');
 const more=()=>line('然后呢？','Ránhòu ne?','А дальше?','follow-up');
 const rest=()=>line('那你休息一下吧。','Nà nǐ xiūxi yíxià ba.','Тогда немного отдохни.','follow-up',true);
 const clarify=()=>line('你想问什么？','Nǐ xiǎng wèn shénme?','Что ты хочешь спросить?','clarification');
 const virtual=(action,py,ru)=>line('我是虚拟熊猫，不能真的'+action+'。','Wǒ shì xūnǐ xióngmāo, bù néng zhēn de '+py+'.','Я виртуальная панда и не могу на самом деле '+ru+'.');
 const {intent,action,topic,modality,negated}=semantic;
 if(semantic.studyDifficulty===true||intent==='express-study-difficulty')return line('你想练习什么？','Nǐ xiǎng liànxí shénme?','Что ты хочешь потренировать?','follow-up',true);
 if(intent==='express-transport-plan')return line('祝你旅途愉快！','Zhù nǐ lǚtú yúkuài!','Желаю приятного путешествия!');
 if(intent==='ask-panda-travel-time')return line('我是虚拟熊猫，没有实际的旅行经历。','Wǒ shì xūnǐ xióngmāo, méiyǒu shíjì de lǚxíng jīnglì.','Я виртуальная панда, у меня нет реального опыта путешествий.');
 if(intent==='request-repeat'||intent==='request-meaning'){
  const p=referencePlanner(prior,semantic);
  return p?{...p,continuesLearnerTurn:false}:clarify();
 }
 if(intent==='correct-hobby-memory')return line('你有什么爱好？','Nǐ yǒu shénme àihào?','Какие у тебя увлечения?','follow-up');
 const fact=k=>{const f=prior?.topicMemory?.[k];return f&&Number.isFinite(f.at)&&prior.turn-f.at<=24?f:null;};
 const breakfast=()=>line('你早上吃早饭吗？','Nǐ zǎoshang chī zǎofàn ma?','Ты завтракаешь по утрам?','follow-up',true);
 const sleep=()=>line('你晚上几点睡觉？','Nǐ wǎnshang jǐ diǎn shuìjiào?','Во сколько ты ложишься спать?','follow-up',true);
 const busy=()=>line('你今天忙吗？','Nǐ jīntiān máng ma?','Ты сегодня занят(а)?','follow-up',true);
 const workTime=()=>line('你几点去上班？','Nǐ jǐ diǎn qù shàngbān?','Во сколько ты идёшь на работу?','follow-up',true);
 const study=()=>line('你为什么想学中文？','Nǐ wèishénme xiǎng xué Zhōngwén?','Почему ты хочешь учить китайский?','follow-up',true);
 const next=()=>line('你接下来想做什么？','Nǐ jiēxiàlai xiǎng zuò shénme?','Что ты хочешь делать дальше?','follow-up',true);
 const siblings=()=>line('你有兄弟姐妹吗？','Nǐ yǒu xiōngdì jiěmèi ma?','У тебя есть братья или сёстры?','follow-up',true);
 const familySize=()=>line('明白了。你家有几口人？','Míngbai le. Nǐ jiā yǒu jǐ kǒu rén?','Понятно. Сколько человек в твоей семье?','follow-up',true);
 const change=()=>line('好的。我们聊点别的吧！','Hǎo de. Wǒmen liáo diǎn bié de ba!','Хорошо. Давай поговорим о другом!','reply');
 if(intent==='request-topic-change'){
  if(semantic.value==='family'){
   if(fact('family-siblings')?.value==='skip'||fact('family-size')?.value==='skip')return change();
   return !fact('family-siblings')?siblings():!fact('family-size')?familySize():next();
  }
  if(semantic.value==='auto'){
   // Choose an unanswered non-family topic; never initiate personal family questions.
   const h=prior?.hobbyMemory;
   if(!h?.hobby||prior.turn-h.at>24)return line('你有什么爱好？','Nǐ yǒu shénme àihào?','Какие у тебя увлечения?','follow-up');
   if(!fact('daily-breakfast'))return breakfast();
   if(!fact('daily-sleep'))return sleep();
   if(!fact('study-reason'))return study();
   if(!fact('work-busy'))return busy();
   if(fact('work-busy')?.value!=='off'&&!fact('work-time'))return workTime();
   return next();
  }
  if(semantic.value==='daily')return !fact('daily-breakfast')?breakfast():!fact('daily-sleep')?sleep():next();
  if(semantic.value==='work')return !fact('work-busy')?busy():fact('work-busy')?.value!=='off'&&!fact('work-time')?workTime():next();
  if(semantic.value==='study')return !fact('study-reason')?study():next();
  if(semantic.value==='hobby'){
   const m=prior?.hobbyMemory;
   if(m?.hobby&&Number.isFinite(m.at)&&prior.turn-m.at<=24){
    if(!m.weekend)return line('你周末喜欢做什么？','Nǐ zhōumò xǐhuan zuò shénme?','Что ты любишь делать по выходным?','follow-up',true);
    if(!m.plan)return line('你周末有什么计划？','Nǐ zhōumò yǒu shénme jìhuà?','Какие у тебя планы на выходные?','follow-up',true);
    return line('你接下来想做什么？','Nǐ jiēxiàlai xiǎng zuò shénme?','Что ты хочешь делать дальше?','follow-up',true);
   }
   return line('你有什么爱好？','Nǐ yǒu shénme àihào?','Какие у тебя увлечения?','follow-up');
  }
  if(semantic.value==='food')return line('你想吃什么？','Nǐ xiǎng chī shénme?','Что ты хочешь поесть?','follow-up');
  return line('好的。我们聊点别的吧！','Hǎo de. Wǒmen liáo diǎn bié de ba!','Хорошо. Давай поговорим о другом!','reply');
 }
 if(intent==='answer-open-reviewed'){
  if(semantic.slot==='study-practice')return semantic.value==='skip'?change():semantic.value==='unknown'?line('你想学什么？','Nǐ xiǎng xué shénme?','Что ты хочешь изучать?','follow-up'):line('没关系，我们慢慢来。','Méi guānxi, wǒmen mànmàn lái.','Ничего страшного, будем двигаться постепенно.');
  if(semantic.slot==='family-siblings')return semantic.value==='skip'?change():fact('family-size')?next():familySize();
  if(semantic.slot==='family-size')return semantic.value==='skip'?change():next();
  if(semantic.slot==='daily-breakfast')return fact('daily-sleep')?next():sleep();
  if(semantic.slot==='daily-sleep')return next();
  if(semantic.slot==='work-busy')return semantic.value==='off'||fact('work-time')?next():workTime();
  if(semantic.slot==='work-time')return next();
  if(semantic.slot==='study-reason'&&semantic.value!=='china-trip')return next();
  if(semantic.slot==='hobby')return line('你经常做这件事吗？','Nǐ jīngcháng zuò zhè jiàn shì ma?','Ты часто этим занимаешься?','follow-up',true);
  if(semantic.slot==='hobby-frequency')return line('你周末喜欢做什么？','Nǐ zhōumò xǐhuan zuò shénme?','Что ты любишь делать по выходным?','follow-up',true);
  if(semantic.slot==='food')return line('还要别的吗？','Hái yào bié de ma?','Хочешь что-нибудь ещё?','follow-up',true);
  if(semantic.slot==='food-more'&&semantic.value==='yes')return line('你还喜欢吃什么？','Nǐ hái xǐhuan chī shénme?','Что ещё ты любишь есть?','follow-up',true);
  if(['hobby-weekend','hobby-plan','food-more','food-preference'].includes(semantic.slot))return line('你接下来想做什么？','Nǐ jiēxiàlai xiǎng zuò shénme?','Что ты хочешь делать дальше?','follow-up',true);
  if(semantic.slot==='next-action')return semantic.value==='rest'?rest():semantic.value==='study'?line('你为什么想学中文？','Nǐ wèishénme xiǎng xué Zhōngwén?','Почему ты хочешь учить китайский?','follow-up',true):null;
  if(semantic.slot==='study-reason'&&semantic.value==='china-trip')return line('你打算什么时候去？','Nǐ dǎsuàn shénme shíhou qù?','Когда ты собираешься поехать?','follow-up',true);
  if(semantic.slot==='travel-time'&&semantic.value==='undecided')return line('好的。我们聊点别的吧！','Hǎo de. Wǒmen liáo diǎn bié de ba!','Хорошо. Давай поговорим о другом!');
  if(semantic.slot==='travel-time')return line('你打算怎么去？','Nǐ dǎsuàn zěnme qù?','Как ты собираешься добраться?','follow-up',true);
  if(semantic.slot==='travel-method')return line('祝你旅途愉快！','Zhù nǐ lǚtú yúkuài!','Желаю приятного путешествия!','reply');
  return null;
 }
 if(intent==='acknowledgement')return clarify(); // do not assume an answer to a stale question
 if(intent==='answer-yes-no'){
  if(!semantic.accepted)return line('那你想做什么？','Nà nǐ xiǎng zuò shénme?','А что ты хочешь делать?','follow-up');
  if(action==='休息')return rest();
  if(action==='喝茶')return line('你喜欢喝什么茶？','Nǐ xǐhuan hē shénme chá?','Какой чай ты любишь пить?','follow-up');
  if(action==='学中文'||action==='学习中文')return line('你为什么想学中文？','Nǐ wèishénme xiǎng xué Zhōngwén?','Почему ты хочешь учить китайский?','follow-up');
  return more();
 }
 if(intent==='express-opinion'){
  if(semantic.target==='中文'&&semantic.quality==='难'&&!negated)return line('你觉得什么最难？','Nǐ juéde shénme zuì nán?','Что тебе кажется самым трудным?','follow-up');
  if(semantic.target==='中文'&&semantic.quality==='简单'&&!negated)return line('你想学什么？','Nǐ xiǎng xué shénme?','Что ты хочешь изучать?','follow-up');
  return askWhy();
 }
 if(intent==='ask-opinion'||intent==='confirm-opinion'){
  if(semantic.target==='中文'&&intent==='ask-opinion'&&!semantic.quality)return line('我觉得中文很有意思。','Wǒ juéde Zhōngwén hěn yǒu yìsi.','Мне кажется, что китайский очень интересный.');
  return null; // cannot invent having seen a film, read a book, or knowing local weather
 }
 if(intent==='express-linked-actions'){
  if(semantic.relation==='cause'&&semantic.clauses?.[1]?.meaning==='want-rest')return rest();
  if(semantic.relation==='concession'&&semantic.clauses?.[1]?.topic==='study')return line('你为什么想学中文？','Nǐ wèishénme xiǎng xué Zhōngwén?','Почему ты хочешь учить китайский?','follow-up');
  if(semantic.relation==='sequence'||semantic.relation==='immediate')return more();
  if(semantic.relation==='simultaneous')return line('你经常这样做吗？','Nǐ jīngcháng zhèyàng zuò ma?','Ты часто так делаешь?','follow-up');
  return null;
 }
 if(intent==='express-action'){
  if(negated)return askWhy(); // do not suggest doing the very thing the learner refuses
  if(action==='休息'&&['desire','intention','plan'].includes(modality))return rest();
  if(modality==='ability-or-future')return line('你能多说一点吗？','Nǐ néng duō shuō yìdiǎn ma?','Можешь рассказать чуть подробнее?','clarification');
  if(topic==='study')return line('你为什么想学中文？','Nǐ wèishénme xiǎng xué Zhōngwén?','Почему ты хочешь учить китайский?','follow-up',true);
  if(action==='喝茶')return line('你喜欢喝什么茶？','Nǐ xǐhuan hē shénme chá?','Какой чай ты любишь пить?','follow-up',true);
  if(action==='喝咖啡')return line('你每天喝咖啡吗？','Nǐ měitiān hē kāfēi ma?','Ты пьёшь кофе каждый день?','follow-up',true);
  if(action==='去公园')return line('你打算什么时候去？','Nǐ dǎsuàn shénme shíhou qù?','Когда ты собираешься пойти?','follow-up',true);
  return line('你接下来想做什么？','Nǐ jiēxiàlai xiǎng zuò shénme?','Что ты хочешь делать дальше?','follow-up');
 }
 if(intent==='ask-action'){
  if(semantic.time==='现在'&&modality==='activity')return line('我在和你聊天。','Wǒ zài hé nǐ liáotiān.','Я разговариваю с тобой.');
  if(semantic.time==='今天'&&['activity','desire','intention','plan'].includes(modality))return line('我今天和你练习中文。','Wǒ jīntiān hé nǐ liànxí Zhōngwén.','Сегодня я практикую с тобой китайский.');
  return null;
 }
 if(['ask-yes-no','reciprocal-action','reciprocal-question'].includes(intent)){
  if(semantic.needsClarification)return clarify();
  if(intent==='ask-yes-no'&&negated)return null; // polarity of negative questions needs separate handling
  if(semantic.time&&semantic.time!=='现在'&&semantic.time!=='今天')return null;
  if(action==='学中文'||action==='学习中文')return line('我可以帮你学中文。','Wǒ kěyǐ bāng nǐ xué Zhōngwén.','Я могу помочь тебе учить китайский.');
  if(action==='休息')return line('我不用休息，我们可以聊天。','Wǒ bú yòng xiūxi, wǒmen kěyǐ liáotiān.','Мне не нужно отдыхать, мы можем поговорить.');
  const physical={喝茶:['hē chá','пить чай'],喝咖啡:['hē kāfēi','пить кофе'],游泳:['yóuyǒng','плавать'],跑步:['pǎobù','бегать'],做饭:['zuòfàn','готовить'],吃饭:['chīfàn','есть'],吃早饭:['chī zǎofàn','завтракать'],去公园:['qù gōngyuán','ходить в парк'],睡觉:['shuìjiào','спать']};
  if(Object.hasOwn(physical,action))return virtual(action,...physical[action]);
  return null;
 }
 return null;
}
function attachReplyAudio(plan,lookupExact){
 if(!plan)return null;
 const audio=typeof lookupExact==='function'?lookupExact(plan.line.hanzi):null;
 return {...plan,audio:typeof audio?.src==='string'&&audio.src?audio:null,voiceStatus:typeof audio?.src==='string'&&audio.src?'registered-exact':'text-only',toneVerified:false};
}
export function planSemanticConversationTurn(state,raw,{lookupExact=null}={}){
 const prior=state??initialSemanticState();
 const step=reduceSemanticContext(prior,{type:'learner',raw});
 const reply=attachReplyAudio(chooseSemanticReply(step.semantic,prior,planReferenceReply),lookupExact);
 // Commit Panda's reply only once the caller actually displays it, not when planned.
 return {state:step.state,semantic:step.semantic,reply,handled:!!reply};
}
