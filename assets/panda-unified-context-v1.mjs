/* Isolated shared dialogue dispatcher and ephemeral context. No UI integration, network or persistence. */
import {interpretContextualTurn,interpretLinkedTurn,interpretOpinion,interpretAction} from './panda-unified-semantics-v1.mjs';

// Reviewed open-question answers: only bind to the immediately preceding
// question. Travel time/method are carried only through an explicitly linked
// China-trip chain, never inferred from an unrelated short answer.
const cleanOpen=s=>String(s??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const OPEN_ANSWERS=Object.freeze({
 "daily-breakfast":{"吃":["Chī.","Да, завтракаю.","yes"],"吃早饭":["Chī zǎofàn.","Завтракаю.","yes"],"我吃早饭":["Wǒ chī zǎofàn.","Я завтракаю.","yes"],"我早上吃早饭":["Wǒ zǎoshang chī zǎofàn.","Я завтракаю утром.","yes"],"不吃":["Bù chī.","Нет, не завтракаю.","no"],"我不吃早饭":["Wǒ bù chī zǎofàn.","Я не завтракаю.","no"]},
 "daily-sleep":{"九点":["Jiǔ diǎn.","В девять вечера.","21"],"十点":["Shí diǎn.","В десять вечера.","22"],"十一点":["Shíyī diǎn.","В одиннадцать вечера.","23"],"十二点":["Shí'èr diǎn.","В полночь.","00"],"我晚上十点睡觉":["Wǒ wǎnshang shí diǎn shuìjiào.","Я ложусь спать в десять вечера.","22"]},
 "work-busy":{"忙":["Máng.","Занят(а).","yes"],"很忙":["Hěn máng.","Очень занят(а).","yes"],"我今天很忙":["Wǒ jīntiān hěn máng.","Я сегодня очень занят(а).","yes"],"不忙":["Bù máng.","Не занят(а).","no"]},
 "work-time":{"我八点去上班":["Wǒ bā diǎn qù shàngbān.","Я иду на работу в восемь.","8"],"我九点去上班":["Wǒ jiǔ diǎn qù shàngbān.","Я иду на работу в девять.","9"],"我十点去上班":["Wǒ shí diǎn qù shàngbān.","Я иду на работу в десять.","10"],"八点":["Bā diǎn.","В восемь.","8"],"九点":["Jiǔ diǎn.","В девять.","9"],"十点":["Shí diǎn.","В десять.","10"],"我不上班":["Wǒ bú shàngbān.","Я не хожу на работу.","none"]},
 "family-siblings":{"有":["Yǒu.","Есть.","yes"],"没有":["Méiyǒu.","Нет.","no"],"我没有兄弟姐妹":["Wǒ méiyǒu xiōngdì jiěmèi.","У меня нет братьев и сестёр.","no"],"我有一个哥哥":["Wǒ yǒu yí ge gēge.","У меня есть старший брат.","older-brother"],"我有一个姐姐":["Wǒ yǒu yí ge jiějie.","У меня есть старшая сестра.","older-sister"],"我有一个弟弟":["Wǒ yǒu yí ge dìdi.","У меня есть младший брат.","younger-brother"],"我有一个妹妹":["Wǒ yǒu yí ge mèimei.","У меня есть младшая сестра.","younger-sister"],"不想说":["Bù xiǎng shuō.","Не хочу говорить.","skip"],"我不想说":["Wǒ bù xiǎng shuō.","Я не хочу говорить.","skip"]},
 "family-size":{"两口人":["Liǎng kǒu rén.","Два человека.","2"],"三口人":["Sān kǒu rén.","Три человека.","3"],"四口人":["Sì kǒu rén.","Четыре человека.","4"],"五口人":["Wǔ kǒu rén.","Пять человек.","5"],"我家有三口人":["Wǒ jiā yǒu sān kǒu rén.","В моей семье три человека.","3"],"我家有四口人":["Wǒ jiā yǒu sì kǒu rén.","В моей семье четыре человека.","4"],"不想说":["Bù xiǎng shuō.","Не хочу говорить.","skip"],"我不想说":["Wǒ bù xiǎng shuō.","Я не хочу говорить.","skip"]},
 'study-reason':{
  '因为我想去中国':['Yīnwèi wǒ xiǎng qù Zhōngguó.','Потому что я хочу поехать в Китай.','china-trip'],
  '我想去中国':['Wǒ xiǎng qù Zhōngguó.','Я хочу поехать в Китай.','china-trip'],
  '想去中国':['Xiǎng qù Zhōngguó.','Хочу поехать в Китай.','china-trip'],
  '因为我想和朋友说中文':['Yīnwèi wǒ xiǎng hé péngyou shuō Zhōngwén.','Потому что хочу говорить по-китайски с друзьями.','friends'],
  '因为我喜欢中文':['Yīnwèi wǒ xǐhuan Zhōngwén.','Потому что мне нравится китайский.','interest']
 },
 'travel-time':{
  '明天':['Míngtiān.','Завтра.','明天'],
  '下周':['Xià zhōu.','На следующей неделе.','下周'],
  '下个月':['Xià ge yuè.','В следующем месяце.','下个月'],
  '明年':['Míngnián.','В следующем году.','明年'],
  '我明天去中国':['Wǒ míngtiān qù Zhōngguó.','Я завтра поеду в Китай.','明天'],
  '我下个月去中国':['Wǒ xià ge yuè qù Zhōngguó.','Я поеду в Китай в следующем месяце.','下个月'],
  '下个月我想去中国':['Xià ge yuè wǒ xiǎng qù Zhōngguó.','В следующем месяце я хочу поехать в Китай.','下个月'],
  '我下个月想去中国':['Wǒ xià ge yuè xiǎng qù Zhōngguó.','Я хочу поехать в Китай в следующем месяце.','下个月'],
  '我还没想好':['Wǒ hái méi xiǎng hǎo.','Я ещё не решил(а).','undecided']
 },
 'hobby':{
  '跑步':['Pǎobù.','Бегать.','跑步'],
  '我喜欢跑步':['Wǒ xǐhuan pǎobù.','Я люблю бегать.','跑步'],
  '看书':['Kàn shū.','Читать книги.','看书'],
  '我喜欢看书':['Wǒ xǐhuan kàn shū.','Я люблю читать книги.','看书'],
  '听音乐':['Tīng yīnyuè.','Слушать музыку.','听音乐'],
  '我喜欢听音乐':['Wǒ xǐhuan tīng yīnyuè.','Я люблю слушать музыку.','听音乐'],
  '游泳':['Yóuyǒng.','Плавать.','游泳'],
  '我喜欢游泳':['Wǒ xǐhuan yóuyǒng.','Я люблю плавать.','游泳']
 },
 'food':{
  '面条':['Miàntiáo.','Лапшу.','面条'],
  '我想吃面条':['Wǒ xiǎng chī miàntiáo.','Я хочу поесть лапши.','面条'],
  '米饭':['Mǐfàn.','Рис.','米饭'],
  '我想吃米饭':['Wǒ xiǎng chī mǐfàn.','Я хочу поесть риса.','米饭'],
  '饺子':['Jiǎozi.','Пельмени.','饺子'],
  '我想吃饺子':['Wǒ xiǎng chī jiǎozi.','Я хочу поесть пельменей.','饺子']
 },
 'hobby-frequency':{
  '经常':['Jīngcháng.','Часто.','often'],
  '不经常':['Bù jīngcháng.','Не часто.','rarely'],
  '每天':['Měitiān.','Каждый день.','daily'],
  '有时候':['Yǒu shíhou.','Иногда.','sometimes'],
  '是的':['Shì de.','Да.','often'],
  '对':['Duì.','Да, верно.','often']
 },
 'hobby-weekend':{
  '跑步':['Pǎobù.','Бегать.','跑步'],
  '看书':['Kàn shū.','Читать книги.','看书'],
  '听音乐':['Tīng yīnyuè.','Слушать музыку.','听音乐'],
  '游泳':['Yóuyǒng.','Плавать.','游泳'],
  '我周末常常跑步':['Wǒ zhōumò chángcháng pǎobù.','По выходным я часто бегаю.','跑步'],
  '我周末喜欢看书':['Wǒ zhōumò xǐhuan kàn shū.','По выходным я люблю читать.','看书'],
  '我周末喜欢游泳':['Wǒ zhōumò xǐhuan yóuyǒng.','По выходным я люблю плавать.','游泳'],
  '休息':['Xiūxi.','Отдыхать.','休息']
 },
 'hobby-plan':{
  '跑步':['Pǎobù.','Бегать.','跑步'],
  '看书':['Kàn shū.','Читать книги.','看书'],
  '游泳':['Yóuyǒng.','Плавать.','游泳'],
  '休息':['Xiūxi.','Отдыхать.','休息'],
  '我打算跑步':['Wǒ dǎsuàn pǎobù.','Я собираюсь бегать.','跑步'],
  '我打算看书':['Wǒ dǎsuàn kàn shū.','Я собираюсь читать.','看书'],
  '我打算休息':['Wǒ dǎsuàn xiūxi.','Я собираюсь отдыхать.','休息'],
  '还没想好':['Hái méi xiǎng hǎo.','Ещё не решил(а).','undecided']
 },
 'food-more':{
  '不要了':['Bú yào le.','Больше не нужно.','no'],
  '不用了':['Bú yòng le.','Больше не нужно.','no'],
  '没有了':['Méiyǒu le.','Больше ничего.','no'],
  '还要':['Hái yào.','Хочу ещё.','yes'],
  '还要米饭':['Hái yào mǐfàn.','Ещё риса.','米饭'],
  '还要面条':['Hái yào miàntiáo.','Ещё лапши.','面条'],
  '还要饺子':['Hái yào jiǎozi.','Ещё пельменей.','饺子']
 },
 'food-preference':{
  '米饭':['Mǐfàn.','Рис.','米饭'],
  '面条':['Miàntiáo.','Лапшу.','面条'],
  '饺子':['Jiǎozi.','Пельмени.','饺子'],
  '我喜欢吃米饭':['Wǒ xǐhuan chī mǐfàn.','Я люблю есть рис.','米饭'],
  '我喜欢吃面条':['Wǒ xǐhuan chī miàntiáo.','Я люблю есть лапшу.','面条'],
  '我喜欢吃饺子':['Wǒ xǐhuan chī jiǎozi.','Я люблю есть пельмени.','饺子']
 },
 'next-action':{
  '休息':['Xiūxi.','Отдыхать.','rest'],
  '我想休息':['Wǒ xiǎng xiūxi.','Я хочу отдохнуть.','rest'],
  '学习中文':['Xuéxí Zhōngwén.','Изучать китайский.','study'],
  '我想学中文':['Wǒ xiǎng xué Zhōngwén.','Я хочу учить китайский.','study'],
  '学中文':['Xué Zhōngwén.','Учить китайский.','study']
 },
 'travel-method':{
  '坐飞机':['Zuò fēijī.','На самолёте.','坐飞机'],
  '坐火车':['Zuò huǒchē.','На поезде.','坐火车'],
  '坐高铁':['Zuò gāotiě.','На скоростном поезде.','坐高铁'],
  '我打算坐飞机':['Wǒ dǎsuàn zuò fēijī.','Я планирую лететь на самолёте.','坐飞机'],
  '我想坐火车':['Wǒ xiǎng zuò huǒchē.','Я хочу поехать на поезде.','坐火车']
 }
});
function interpretOpenAnswer(raw,context){
 const pending=context.pendingQuestion;
 if(pending?.intent!=='ask-open-reviewed'||!Object.hasOwn(OPEN_ANSWERS,pending.slot))return null;
 const answers=OPEN_ANSWERS[pending.slot],key=cleanOpen(raw);
 if(!Object.hasOwn(answers,key))return null;
 const [pinyin,translation,value]=answers[key];
 return {raw:String(raw),intent:'answer-open-reviewed',construction:'contextual-open-answer',slot:pending.slot,value,topic:pending.slot.startsWith('hobby')?'leisure':pending.slot.startsWith('food')?'food':pending.slot==='next-action'||pending.slot.startsWith('daily')?'daily':pending.slot.startsWith('work')?'work':pending.slot.startsWith('family')?'family':pending.slot==='study-reason'?'study':'travel',reference:pending.raw,pinyin,translation,toneVerified:false};
}
function reviewedOpenQuestion(hanzi,previous,linked,memory){
 const s=cleanOpen(hanzi);
 let slot=null;
 if(s==='你为什么想学中文')slot='study-reason';
 else if(s==='你有什么爱好')slot='hobby';
 else if(s==='你想吃什么')slot='food';
 else if(s==='你早上吃早饭吗')slot='daily-breakfast';
 else if(s==='你今天忙吗')slot='work-busy';
 else if(s==='你晚上几点睡觉')slot='daily-sleep';
 else if(s==='你几点去上班')slot='work-time';
 else if(s==='你有兄弟姐妹吗')slot='family-siblings';
 else if(s==='明白了你家有几口人')slot='family-size';
 else if(linked&&previous?.intent==='request-topic-change'&&['daily','work','study','family','auto'].includes(previous.value)&&s==='你接下来想做什么')slot='next-action';
 else if(linked&&previous?.intent==='request-topic-change'&&previous.value==='hobby'&&memory?.hobby){
  if(s==='你周末喜欢做什么'&&!memory.weekend)slot='hobby-weekend';
  else if(s==='你周末有什么计划'&&memory.weekend&&!memory.plan)slot='hobby-plan';
  else if(s==='你接下来想做什么'&&memory.plan)slot='next-action';
 }
 else if(linked&&previous?.intent==='answer-open-reviewed'&&previous.slot==='study-reason'&&previous.value==='china-trip'&&s==='你打算什么时候去')slot='travel-time';
 else if(linked&&previous?.intent==='answer-open-reviewed'&&previous.slot==='travel-time'&&s==='你打算怎么去')slot='travel-method';
 else if(linked&&previous?.intent==='answer-open-reviewed'){
  if(previous.slot==='hobby'&&s==='你经常做这件事吗')slot='hobby-frequency';
  else if(previous.slot==='hobby-frequency'&&s==='你周末喜欢做什么')slot='hobby-weekend';
  else if(previous.slot==='food'&&s==='还要别的吗')slot='food-more';
  else if(previous.slot==='food-more'&&previous.value==='yes'&&s==='你还喜欢吃什么')slot='food-preference';
  else if(['hobby-weekend','hobby-plan','food-more','food-preference','daily-sleep','daily-breakfast','work-busy','work-time','study-reason','family-siblings','family-size'].includes(previous.slot)&&s==='你接下来想做什么')slot='next-action';
 }
 return slot?{intent:'ask-open-reviewed',subject:'你',slot,raw:hanzi}:null;
}


const TOPIC_REQUESTS=Object.freeze({
 '换个话题吧':['Huàn ge huàtí ba.','Давай сменим тему.','other'],
 '我们聊点别的吧':['Wǒmen liáo diǎn bié de ba.','Давай поговорим о другом.','other'],
 '聊聊爱好吧':['Liáoliao àihào ba.','Давай поговорим об увлечениях.','hobby'],
 '我们聊聊爱好吧':['Wǒmen liáoliao àihào ba.','Давай поговорим об увлечениях.','hobby'],
 '聊聊我的一天吧':['Liáoliao wǒ de yì tiān ba.','Давай поговорим о моём дне.','daily'],
 '聊聊工作吧':['Liáoliao gōngzuò ba.','Давай поговорим о работе.','work'],
 '聊聊家庭吧':['Liáoliao jiātíng ba.','Давай поговорим о семье.','family'],
 '你来选话题吧':['Nǐ lái xuǎn huàtí ba.','Выбери тему разговора.','auto'],
 '你选吧':['Nǐ xuǎn ba.','Выбирай ты.','auto'],
 '聊聊学习中文吧':['Liáoliao xuéxí Zhōngwén ba.','Давай поговорим об изучении китайского.','study'],
 '聊聊吃的吧':['Liáoliao chī de ba.','Давай поговорим о еде.','food'],
 '我们聊聊吃的吧':['Wǒmen liáoliao chī de ba.','Давай поговорим о еде.','food']
});
function interpretTopicRequest(raw){
 const key=cleanOpen(raw);
 if(!Object.hasOwn(TOPIC_REQUESTS,key))return null;
 const [pinyin,translation,value]=TOPIC_REQUESTS[key];
 return {raw:String(raw),intent:'request-topic-change',value,pinyin,translation,toneVerified:false};
}


// A bounded, session-only record of answered hobby questions. Not a user profile.
// Keep no raw transcript, names, addresses, travel dates or inferred preferences.
// Facts expire together after 24 turns; resets and explicit corrections clear them.
const emptyHobbyMemory=()=>({hobby:null,weekend:null,plan:null,at:0});
function recentHobbyMemory(state){
 const m=state?.hobbyMemory;
 return m&&Number.isFinite(m.at)&&state.turn-m.at<=24?m:emptyHobbyMemory();
}
function interpretHobbyCorrection(raw,context){
 const key=cleanOpen(raw),m=/^我不喜欢(跑步|看书|听音乐|游泳)了$/u.exec(key);
 if(!m||context.hobbyMemory?.hobby!==m[1])return null;
 const py={跑步:'pǎobù',看书:'kàn shū',听音乐:'tīng yīnyuè',游泳:'yóuyǒng'}[m[1]];
 const ru={跑步:'бегать',看书:'читать книги',听音乐:'слушать музыку',游泳:'плавать'}[m[1]];
 return {raw:String(raw),intent:'correct-hobby-memory',value:m[1],pinyin:'Wǒ bù xǐhuan '+py+' le.',translation:'Я больше не люблю '+ru+'.',toneVerified:false};
}
function updateHobbyMemory(state,semantic){
 const current=recentHobbyMemory(state),at=state.turn+1;
 if(semantic?.intent==='correct-hobby-memory')return emptyHobbyMemory();
 if(semantic?.intent!=='answer-open-reviewed')return current;
 if(semantic.slot==='hobby')return {...emptyHobbyMemory(),hobby:semantic.value,at};
 if(semantic.slot==='hobby-weekend'&&current.hobby)return {...current,weekend:semantic.value,at};
 if(semantic.slot==='hobby-plan'&&current.hobby)return {...current,plan:semantic.value,at};
 return current;
}

// Separate, short-lived, reviewed session facts. No persistence.
const TOPIC_FACTS=['daily-breakfast','daily-sleep','work-busy','work-time','study-reason','family-siblings','family-size'];
function recentTopicMemory(state){
 const entries=state?.topicMemory||{};
 return Object.fromEntries(TOPIC_FACTS.filter(k=>entries[k]&&Number.isFinite(entries[k].at)&&state.turn-entries[k].at<=24).map(k=>[k,entries[k]]));
}
function updateTopicMemory(state,semantic){
 const m=recentTopicMemory(state);
 if(semantic?.intent==='answer-open-reviewed'&&TOPIC_FACTS.includes(semantic.slot))m[semantic.slot]={value:semantic.value,at:state.turn+1};
 return m;
}

function interpretTravelQuestion(raw,context){
 const key=cleanOpen(raw);
 const questions={
  '什么时候去中国':['Shénme shíhou qù Zhōngguó?','Когда ехать в Китай?'],
  '什么时候去':['Shénme shíhou qù?','Когда ехать?'],
  '你什么时候去中国':['Nǐ shénme shíhou qù Zhōngguó?','Когда ты поедешь в Китай?'],
  '你打算什么时候去中国':['Nǐ dǎsuàn shénme shíhou qù Zhōngguó?','Когда ты собираешься поехать в Китай?']
 };
 if(!Object.hasOwn(questions,key))return null;
 const [pinyin,translation]=questions[key];
 if(!key.startsWith('你')&&context.pendingQuestion?.slot==='travel-time'&&context.lastPandaTurn?.hanzi){
  return {raw:String(raw),intent:'request-meaning',reference:context.lastPandaTurn.hanzi,travelQuestion:true,pinyin,translation,toneVerified:false};
 }
 if(key==='什么时候去')return null;
 return {raw:String(raw),intent:'ask-panda-travel-time',pinyin,translation,toneVerified:false};
}

function dispatchSemantic(raw,context={},parsers){
 const source=String(raw??'').trim();
 if(!source)return null;
 const normalized=source.normalize('NFC').replace(/[\p{P}\s]/gu,'');
 if(!normalized||normalized.length>160)return null;
 return interpretTopicRequest(source)||interpretHobbyCorrection(source,context)||interpretTravelQuestion(source,context)||interpretOpenAnswer(source,context)||parsers.contextual(source,context)||parsers.linked(source)||parsers.opinion(source)||parsers.action(source)||null;
}
export const interpretSemanticTurn=(raw,context={})=>dispatchSemantic(raw,context,{contextual:interpretContextualTurn,linked:interpretLinkedTurn,opinion:interpretOpinion,action:interpretAction});
export function initialSemanticState(){
 return {version:1,turn:0,lastSpeaker:null,lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:null,resumeQuestion:null,hobbyMemory:emptyHobbyMemory(),topicMemory:{}};
}
function advanceSemanticState(state,event,interpret){
 const current=state?.version===1?state:initialSemanticState();
 if(event?.type==='reset'||event?.type==='topic-change')return {state:initialSemanticState(),semantic:null};
 if(event?.type==='panda'){
  const line=event.line;
  if(typeof line?.hanzi!=='string'||!line.hanzi.trim())return {state:current,semantic:null};
  const understood=interpret(line.hanzi,{});
  const previous=current.lastSpeaker==='learner'?current.lastLearnerSemantic:null;
  // Re-open the exact previously displayed question only after an explicit repeat/meaning request.
  const resumed=previous&&['request-repeat','request-meaning'].includes(previous.intent)&&current.resumeQuestion?.hanzi===line.hanzi?current.resumeQuestion.pending:null;
  const pending=resumed||reviewedOpenQuestion(line.hanzi,previous,event.continuesLearnerTurn===true,recentHobbyMemory(current))||(understood?.intent==='ask-yes-no'&&understood.subject==='你'?understood:null);
  // The caller must explicitly link Panda's reply to the immediately preceding learner action.
  // A topic label alone is not evidence that the utterance refers to that action.
  const linked=event.continuesLearnerTurn===true&&previous?.intent==='express-action'&&previous.subject==='我'&&(!pending||pending.action===previous.action)?previous:null;
  const lastPandaTurn={hanzi:line.hanzi,pinyin:typeof line.pinyin==='string'?line.pinyin:null,ru:typeof line.ru==='string'?line.ru:null};
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'panda',lastPandaTurn,pendingQuestion:pending,lastLearnerAction:linked,lastLearnerSemantic:null,resumeQuestion:null,hobbyMemory:recentHobbyMemory(current),topicMemory:recentTopicMemory(current)},semantic:understood};
 }
 if(event?.type==='learner'){
  const raw=String(event.raw??'').trim();
  if(!raw)return {state:current,semantic:null};
  // A pending question is consumed once; consecutive learner messages cannot reuse it.
  const context=current.lastSpeaker==='panda'?{lastPandaTurn:current.lastPandaTurn,pendingQuestion:current.pendingQuestion,lastLearnerAction:current.lastLearnerAction,hobbyMemory:recentHobbyMemory(current)}:{hobbyMemory:recentHobbyMemory(current)};
  const semantic=interpret(raw,context);
  const resumeQuestion=semantic&&['request-repeat','request-meaning'].includes(semantic.intent)&&semantic.reference===context.lastPandaTurn?.hanzi&&context.pendingQuestion?{hanzi:semantic.reference,pending:context.pendingQuestion}:null;
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'learner',lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:semantic,resumeQuestion,hobbyMemory:updateHobbyMemory(current,semantic),topicMemory:updateTopicMemory(current,semantic)},semantic};
 }
 return {state:current,semantic:null};
}
export const reduceSemanticContext=(state,event)=>advanceSemanticState(state,event,interpretSemanticTurn);
export function planReferenceReply(state,semantic){
 // Only repeat/explain the actual referenced Panda utterance, never synthesize audio.
 if(!semantic||!['request-repeat','request-meaning'].includes(semantic.intent)||semantic.needsClarification)return null;
 const line=state?.lastSpeaker==='panda'?state.lastPandaTurn:null;
 if(!line||line.hanzi!==semantic.reference||!line.pinyin||!line.ru)return null;
 return {kind:semantic.intent==='request-repeat'?'repeat-exact':'explain-exact',line:{hanzi:line.hanzi,pinyin:line.pinyin,ru:line.ru},lookupExactAudio:true,toneVerified:false};
}
