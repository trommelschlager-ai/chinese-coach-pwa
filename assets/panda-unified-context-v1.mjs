/* Isolated shared dialogue dispatcher and ephemeral context. No UI integration, network or persistence. */
import {interpretContextualTurn,interpretLinkedTurn,interpretOpinion,interpretAction} from './panda-unified-semantics-v1.mjs';
function dispatchSemantic(raw,context={},parsers){
 const source=String(raw??'').trim();
 if(!source)return null;
 const normalized=source.normalize('NFC').replace(/[\p{P}\s]/gu,'');
 if(!normalized||normalized.length>160)return null;
 return parsers.contextual(source,context)||parsers.linked(source)||parsers.opinion(source)||parsers.action(source)||null;
}
export const interpretSemanticTurn=(raw,context={})=>dispatchSemantic(raw,context,{contextual:interpretContextualTurn,linked:interpretLinkedTurn,opinion:interpretOpinion,action:interpretAction});
export function initialSemanticState(){
 return {version:1,turn:0,lastSpeaker:null,lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:null};
}
function advanceSemanticState(state,event,interpret){
 const current=state?.version===1?state:initialSemanticState();
 if(event?.type==='reset'||event?.type==='topic-change')return {state:initialSemanticState(),semantic:null};
 if(event?.type==='panda'){
  const line=event.line;
  if(typeof line?.hanzi!=='string'||!line.hanzi.trim())return {state:current,semantic:null};
  const understood=interpret(line.hanzi,{});
  const pending=understood?.intent==='ask-yes-no'&&understood.subject==='你'?understood:null;
  // The caller must explicitly link Panda's reply to the immediately preceding learner action.
  // A topic label alone is not evidence that the utterance refers to that action.
  const previous=current.lastSpeaker==='learner'?current.lastLearnerSemantic:null;
  const linked=event.continuesLearnerTurn===true&&previous?.intent==='express-action'&&previous.subject==='我'&&(!pending||pending.action===previous.action)?previous:null;
  const lastPandaTurn={hanzi:line.hanzi,pinyin:typeof line.pinyin==='string'?line.pinyin:null,ru:typeof line.ru==='string'?line.ru:null};
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'panda',lastPandaTurn,pendingQuestion:pending,lastLearnerAction:linked,lastLearnerSemantic:null},semantic:understood};
 }
 if(event?.type==='learner'){
  const raw=String(event.raw??'').trim();
  if(!raw)return {state:current,semantic:null};
  // A pending question is consumed once; consecutive learner messages cannot reuse it.
  const context=current.lastSpeaker==='panda'?{lastPandaTurn:current.lastPandaTurn,pendingQuestion:current.pendingQuestion,lastLearnerAction:current.lastLearnerAction}:{};
  const semantic=interpret(raw,context);
  return {state:{version:1,turn:current.turn+1,lastSpeaker:'learner',lastPandaTurn:null,pendingQuestion:null,lastLearnerAction:null,lastLearnerSemantic:semantic},semantic};
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
