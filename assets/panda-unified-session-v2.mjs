/* Stage 2 session-only facts and bounded response planner. No live UI, storage or network. */
import {interpretExtendedGrammar} from './panda-unified-extended-v2.mjs';
import {interpretTemporalAction} from './panda-unified-temporal-v2.mjs';
export function newStage2Session(){return {version:2,turn:0,facts:[]};}
function captureStage2Fact(semantic){
 if(semantic?.subject!=='我')return null;
 if(semantic.intent==='express-interest')return {key:'interest:'+semantic.target,kind:'interest',target:semantic.target,negated:semantic.negated};
 if(semantic.intent==='express-experience')return {key:'experience:'+semantic.verb+':'+semantic.object,kind:'experience',verb:semantic.verb,object:semantic.object,negated:semantic.negated};
 if(semantic.intent==='express-temporal-action'){
  if(semantic.aspect==='experiential'&&!semantic.time)return {key:'experience:'+semantic.verb+':'+semantic.object,kind:'experience',verb:semantic.verb,object:semantic.object,negated:semantic.negated};
  // No timeless assertion from relative dates. Scope all information to this session.
  if(!semantic.time||semantic.timeReference==='now')return null;
  const kind=['想','不想','打算','不打算'].includes(semantic.modal)?'intention':'action-report';
  return {key:[kind,semantic.time,semantic.action].join(':'),kind,time:semantic.time,action:semantic.action,negated:semantic.negated,aspect:semantic.aspect,modal:semantic.modal};
 }
 return null;
}
function stage2Response(semantic){
 if(!semantic)return null;
 const reply=(hanzi,pinyin,ru)=>({line:{hanzi,pinyin,ru},toneVerified:false});
 const why=()=>reply('为什么？','Wèishénme?','Почему?');
 const further=()=>reply('然后呢？','Ránhòu ne?','А дальше?');
 if(semantic.intent==='ask-experience'||semantic.intent==='ask-temporal-action'&&semantic.aspect==='experiential'){
  if(semantic.verb==='去')return reply('我是虚拟熊猫，没有实际的旅行经历。','Wǒ shì xūnǐ xióngmāo, méiyǒu shíjì de lǚxíng jīnglì.','Я виртуальная панда, у меня нет реального опыта путешествий.');
  return null;
 }
 if(semantic.intent==='express-interest'&&semantic.subject==='我'){
  if(semantic.negated)return why();
  if(semantic.target==='中文')return reply('你为什么想学中文？','Nǐ wèishénme xiǎng xué Zhōngwén?','Почему ты хочешь учить китайский?');
  if(semantic.target==='音乐')return reply('你喜欢听什么音乐？','Nǐ xǐhuan tīng shénme yīnyuè?','Какую музыку ты любишь слушать?');
  return why();
 }
 if(semantic.intent==='express-experience'&&semantic.subject==='我')return semantic.negated?why():further();
 if(semantic.intent==='express-temporal-action'&&semantic.subject==='我'){
  if(semantic.negated)return why();
  if(semantic.aspect==='experiential'||semantic.timeReference==='past')return further();
  if(semantic.timeReference==='future'&&['china','beijing'].includes(semantic.action))return reply('祝你旅途愉快！','Zhù nǐ lǚtú yúkuài!','Желаю приятного путешествия!');
  return null;
 }
 return null;
}
function applyStage2Turn(session,raw,lookupExact,parse){
 const state=session?.version===2&&Array.isArray(session.facts)?session:newStage2Session();
 const semantic=parse(raw);
 const fact=captureStage2Fact(semantic);
 const turn=state.turn+1;
 const facts=fact?[...state.facts.filter(f=>f.key!==fact.key),{...fact,turn}].slice(-40):state.facts.slice();
 const planned=stage2Response(semantic);
 const audio=planned&&typeof lookupExact==='function'?lookupExact(planned.line.hanzi):null;
 const response=planned?{...planned,audio:typeof audio?.src==='string'&&audio.src?audio:null,voiceStatus:typeof audio?.src==='string'&&audio.src?'registered-exact':'text-only'}:null;
 return {state:{version:2,turn,facts},semantic,response};
}
export const planStage2Turn=(state,raw,{lookupExact=null}={})=>applyStage2Turn(state,raw,lookupExact,q=>interpretExtendedGrammar(q)||interpretTemporalAction(q));
