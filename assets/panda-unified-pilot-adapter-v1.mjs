/* Disabled by default; no production imports. Only free chat and exact registered reviewed candidates. */
import {initialSemanticState,reduceSemanticContext} from './panda-unified-context-v1.mjs';
import {planSemanticConversationTurn} from './panda-unified-replies-v1.mjs';
const SAFE_REPLIES=new Set(['那你休息一下吧。','你想学什么？','你为什么想学中文？','然后呢？','你打算什么时候去？','你接下来想做什么？','我在和你聊天。','我今天和你练习中文。','你打算怎么去？','祝你旅途愉快！','你有什么爱好？','你想吃什么？','好的。我们聊点别的吧！','你经常做这件事吗？','还要别的吗？']);
export function createSemanticPilot({enabled=false,lookupExact=null}={}){
 let state=initialSemanticState(),pending=false;
 return {
  reset(){state=initialSemanticState();pending=false;},
  observePanda(line,{continuesLearnerTurn=false}={}){
   state=reduceSemanticContext(state,{type:'panda',line,continuesLearnerTurn:pending&&continuesLearnerTurn===true}).state;pending=false;
  },
  plan(raw,{mode='graded'}={}){
   if(!enabled||mode!=='free-chat'){state=initialSemanticState();pending=false;return null;}
   const step=planSemanticConversationTurn(state,raw,{lookupExact});
   state=step.state;pending=!!step.semantic;
   const reply=step.reply;
   if(!reply||reply.voiceStatus!=='registered-exact')return null;
   const reference=reply.kind==='repeat-exact'||reply.kind==='explain-exact';
   if(!reference&&!SAFE_REPLIES.has(reply.line.hanzi))return null;
   return {...reply,semantic:step.semantic};
  },
  snapshot(){return JSON.parse(JSON.stringify(state));}
 };
}
