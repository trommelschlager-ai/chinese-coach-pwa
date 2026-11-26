/* Isolated shared dialogue dispatcher and ephemeral context. No UI integration, network or persistence. */
import {interpretContextualTurn,interpretLinkedTurn,interpretOpinion,interpretAction} from './panda-unified-semantics-v1.mjs';

// Reviewed open-question answers: only bind to the immediately preceding
// question. Travel time/method are carried only through an explicitly linked
// China-trip chain, never inferred from an unrelated short answer.
const cleanOpen=s=>String(s??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const OPEN_ANSWERS=Object.freeze({
 'study-reason':{
  '因为我想去中国':['Yīnwèi wǒ xiǎng qù Zhōngguó.','Потому что я хочу поехать в Китай.','china-trip'],
  '我想去中国':['Wǒ xiǎng qù Zhōngguó.','Я хочу поехать в Китай.','china-trip'],
  '想去中国':['Xiǎng qù Zhōngguó.','Хочу поехать в Китай.','china-trip']
 },
 'travel-time':{
  '明天':['Míngtiān.','Завтра.','明天'],
  '下周':['Xià zhōu.','На следующей неделе.','下周'],
  '下个月':['Xià ge yuè.','В следующем месяце.','下个月'],
  '明年':['Míngnián.','В следующем году.','明年']
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
 'travel-method':{
  '坐飞机':['Zuò fēijī.','На самолёте.','坐飞机'],
  '坐火车':['Zuò huǒchē.','На поезде.','坐火车'],
  '坐高铁':['Zuò gāotiě.','На скоростном поезде.','坐高铁']
 }
});
function interpretOpenAnswer(raw,context){
 const pending=context.pendingQuestion;
 if(pending?.intent!=='ask-open-reviewed'||!Object.hasOwn(OPEN_ANSWERS,pending.slot))return null;
 const answers=OPEN_ANSWERS[pending.slot],key=cleanOpen(raw);
 if(!Object.hasOwn(answers,key))return null;
 const [pinyin,translation,value]=answers[key];
 return {raw:String(raw),intent:'answer-open-reviewed',construction:'contextual-open-answer',slot:pending.slot,value,topic:pending.slot==='hobby'?'leisure':pending.slot==='food'?'food':'travel',reference:pending.raw,pinyin,translation,toneVerified:false};
}
function reviewedOpenQuestion(hanzi,previous,linked){
 const s=cleanOpen(hanzi);
 let slot=null;
 if(s==='你为什么想学中文')slot='study-reason';
 else if(s==='你有什么爱好')slot='hobby';
 else if(s==='你想吃什么')slot='food';
 else if(linked&&previous?.intent==='answer-open-reviewed'&&previous.slot==='study-reason'&&previous.value==='china-trip'&&s==='你打算什么时候去')slot='travel-time';
 else if(linked&&previous?.intent==='answer-open-reviewed'&&previous.slot==='travel-time'&&s==='你打算怎么去')slot='travel-method';
 return slot?{intent:'ask-open-reviewed',subject:'你',slot,raw:hanzi}:null;
}


const TOPIC_REQUESTS=Object.freeze({
 '换个话题吧':['Huàn ge huàtí ba.','Давай сменим тему.','other'],
 '我们聊点别的吧':['Wǒmen liáo diǎn bié de ba.','Давай поговорим о другом.','other'],
 '聊聊爱好吧':['Liáoliao àihào ba.','Давай поговорим об увлечениях.','hobby'],
 '我们聊聊爱好吧':['Wǒmen liáoliao àihào ba.','Давай поговорим об увлечениях.','hobby'],
 '聊聊吃的吧':['Liáoliao chī de ba.','Давай поговорим о еде.','food'],
 '我们聊聊吃的吧':['Wǒmen liáoliao chī de ba.','Давай поговорим о еде.','food']
});
function interpretTopicRequest(raw){
 const key=cleanOpen(raw);
 if(!Object.hasOwn(TOPIC_REQUESTS,key))return null;
 const [pinyin,translation,value]=TOPIC_REQUESTS[key];
 return {raw:String(raw),intent:'request-topic-change',value,pinyin,translation,toneVerified:false};
}

function dispatchSemantic(raw,context={},parsers){
 const source=String(raw??'').trim();
 if(!source)return null;
 const normalized=source.normalize('NFC').replace(/[\p{P}\s]/gu,'');
 if(!normalized||normalized.length>160)return null;
 return parsers.contextual(source,context)||interpretTopicRequest(source)||interpretOpenAnswer(source,context)||parsers.linked(source)||parsers.opinion(source)||parsers.action(source)||null;
}
export const interpretSemanticTurn=(raw,context={})=>dispatchSemantic(raw,context,{contextual:interpretContextualTurn,linked:interpretLinkedTurn,opinion:interpretOpinion,action:interpretAction});
export function initialSemanticState(){
 return {version:1,turn:0,lastSpeaker:null,lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:null,resumeQuestion:null};
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
  const pending=resumed||reviewedOpenQuestion(line.hanzi,previous,event.continuesLearnerTurn===true)||(understood?.intent==='ask-yes-no'&&understood.subject==='你'?understood:null);
  // The caller must explicitly link Panda's reply to the immediately preceding learner action.
  // A topic label alone is not evidence that the utterance refers to that action.
  const linked=event.continuesLearnerTurn===true&&previous?.intent==='express-action'&&previous.subject==='我'&&(!pending||pending.action===previous.action)?previous:null;
  const lastPandaTurn={hanzi:line.hanzi,pinyin:typeof line.pinyin==='string'?line.pinyin:null,ru:typeof line.ru==='string'?line.ru:null};
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'panda',lastPandaTurn,pendingQuestion:pending,lastLearnerAction:linked,lastLearnerSemantic:null,resumeQuestion:null},semantic:understood};
 }
 if(event?.type==='learner'){
  const raw=String(event.raw??'').trim();
  if(!raw)return {state:current,semantic:null};
  // A pending question is consumed once; consecutive learner messages cannot reuse it.
  const context=current.lastSpeaker==='panda'?{lastPandaTurn:current.lastPandaTurn,pendingQuestion:current.pendingQuestion,lastLearnerAction:current.lastLearnerAction}:{};
  const semantic=interpret(raw,context);
  const resumeQuestion=semantic&&['request-repeat','request-meaning'].includes(semantic.intent)&&semantic.reference===context.lastPandaTurn?.hanzi&&context.pendingQuestion?{hanzi:semantic.reference,pending:context.pendingQuestion}:null;
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'learner',lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:semantic,resumeQuestion},semantic};
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
