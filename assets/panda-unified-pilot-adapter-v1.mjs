/* Disabled by default; no production imports. Only free chat and exact registered reviewed candidates. */
import {initialSemanticState,reduceSemanticContext} from './panda-unified-context-v1.mjs';
import {planSemanticConversationTurn} from './panda-unified-replies-v1.mjs';
const SAFE_REPLIES=new Set(['那你休息一下吧。','你想学什么？','你为什么想学中文？','然后呢？','你打算什么时候去？','你接下来想做什么？','我在和你聊天。','我今天和你练习中文。','你打算怎么去？','祝你旅途愉快！','你有什么爱好？','你想吃什么？','好的。我们聊点别的吧！','你经常做这件事吗？','还要别的吗？','你周末喜欢做什么？','你还喜欢吃什么？','你周末有什么计划？','你早上吃早饭吗？','你晚上几点睡觉？','你今天忙吗？','你几点去上班？','你有兄弟姐妹吗？','明白了。你家有几口人？']);
export function createSemanticPilot({enabled=false,lookupExact=null}={}){
 let state=initialSemanticState(),pending=false;
 return {
  reset(){state=initialSemanticState();pending=false;},
  observePanda(line,{continuesLearnerTurn=false}={}){
   state=reduceSemanticContext(state,{type:'panda',line,continuesLearnerTurn:pending&&continuesLearnerTurn===true}).state;pending=false;
  },
  plan(raw,{mode='graded'}={}){
   if(!enabled||mode!=='free-chat'){state=initialSemanticState();pending=false;return null;}
   const oldMemory=state.hobbyMemory,oldTopics=state.topicMemory;
   const step=planSemanticConversationTurn(state,raw,{lookupExact});
   state=step.state;pending=!!step.semantic;
   const reply=step.reply;
   const reference=reply?.kind==='repeat-exact'||reply?.kind==='explain-exact';
   if(!reply||reply.voiceStatus!=='registered-exact'||(!reference&&!SAFE_REPLIES.has(reply.line.hanzi))){
    // Never create an unconfirmed new fact when the experimental route falls back.
    // An explicit correction, however, must still invalidate the old memory.
    if(step.semantic?.intent!=='correct-hobby-memory')state={...state,hobbyMemory:oldMemory,topicMemory:oldTopics};
    return null;
   }
   return {...reply,semantic:step.semantic};
  },
  snapshot(){return JSON.parse(JSON.stringify(state));}
 };
}
