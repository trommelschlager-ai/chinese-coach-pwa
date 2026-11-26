/* Isolated follow-up prototype. Only displayed questions affect pending context. No storage/network/live integration. */
import {newStage2Session,planStage2Turn} from './panda-unified-session-v2.mjs';
import {interpretTemporalAction} from './panda-unified-temporal-v2.mjs';
export function newFollowupSession(){return {version:1,base:newStage2Session(),asked:[],pending:null,study:{reason:null,duration:null,difficulty:null}};}
function studyQuestions(){
 return [
 {id:'study-reason',hanzi:'你为什么想学中文？',pinyin:'Nǐ wèishénme xiǎng xué Zhōngwén?',ru:'Почему ты хочешь учить китайский?',field:'reason'},
 {id:'study-duration',hanzi:'你学中文多久了？',pinyin:'Nǐ xué Zhōngwén duōjiǔ le?',ru:'Как давно ты учишь китайский?',field:'duration'},
 {id:'study-difficulty',hanzi:'你觉得中文难吗？',pinyin:'Nǐ juéde Zhōngwén nán ma?',ru:'Китайский кажется тебе сложным?',field:'difficulty'},
 ];
}
function observedFollowup(state,line){
 const current=state?.version===1?state:newFollowupSession();
 const question=studyQuestions().find(q=>q.hanzi===line?.hanzi);
 return {...current,asked:question?[...new Set([...current.asked,question.id])]:current.asked.slice(),pending:question?.id??null};
}
function parseStudyAnswer(raw,pending){
 const q=String(raw??'').trim().replace(/[。！？?!]+$/u,'').replace(/\s+/gu,'');
 if(pending==='study-duration'){
  const m=/^(?:我学中文)?(一|两|二|三|四|五|六|七|八|九|十)(年|个月)(了)?$/u.exec(q);
  if(!m)return null;
  const nums={一:[1,'yì'],两:[2,'liǎng'],二:[2,'èr'],三:[3,'sān'],四:[4,'sì'],五:[5,'wǔ'],六:[6,'liù'],七:[7,'qī'],八:[8,'bā'],九:[9,'jiǔ'],十:[10,'shí']};
  // In this duration expression use 两 rather than 二; defer uncommon variants.
  if(m[1]==='二')return null;
  const [value,basePy]=nums[m[1]],unit=m[2]==='年'?'year':'month';
  const py=m[1]==='一'&&unit==='month'?'yí':basePy;
  return {field:'duration',value:{value,unit},pinyin:[q.startsWith('我学中文')?'Wǒ xué Zhōngwén':'',py,unit==='year'?'nián':'ge yuè',m[3]?'le':''].filter(Boolean).join(' '),toneVerified:false};
 }
 if(pending==='study-reason'&&q.startsWith('因为')){
  const x=interpretTemporalAction(q.slice(2));
  if(x?.subject!=='我'||x.intent!=='express-temporal-action'||!['想','打算'].includes(x.modal)||x.negated)return null;
  return {field:'reason',value:{action:x.action,modal:x.modal,time:x.time??null},pinyin:'Yīnwèi '+x.pinyin.replace(/^Wǒ/u,'wǒ'),toneVerified:false};
 }
 if(pending==='study-difficulty'){
  const values={'难':['difficult','Nán.'],'很难':['difficult','Hěn nán.'],'不难':['not-difficult','Bù nán.'],'不太难':['not-very-difficult','Bú tài nán.'],'有点难':['somewhat-difficult','Yǒudiǎn nán.'],'中文很难':['difficult','Zhōngwén hěn nán.'],'我觉得中文很难':['difficult','Wǒ juéde Zhōngwén hěn nán.'],'我觉得中文不难':['not-difficult','Wǒ juéde Zhōngwén bù nán.']};
  if(Object.hasOwn(values,q))return {field:'difficulty',value:values[q][0],pinyin:values[q][1],toneVerified:false};
 }
 return null;
}
export function planContextualStudyTurn(session,raw,{lookupExact=null}={}){
 const state=session?.version===1?session:newFollowupSession();
 const step=planStage2Turn(state.base,raw,{lookupExact});
 const answer=parseStudyAnswer(raw,state.pending);
 const study={...state.study};
 if(answer)study[answer.field]=answer.value;
 const nextState={...state,base:step.state,study,pending:null};
 const sem=step.semantic;
 const studyTopic=!!answer||sem?.subject==='我'&&((sem.intent==='express-interest'&&sem.target==='中文'&&!sem.negated)||(sem.intent==='express-temporal-action'&&sem.action==='chinese'&&!sem.negated));
 // A question is considered asked only when caller confirms actual display.
 // Never force an unrelated topic into the study sequence.
 if(!studyTopic)return {state:nextState,semantic:sem,answer,response:step.response};
 const question=studyQuestions().find(q=>study[q.field]===null&&!state.asked.includes(q.id));
 const line=question?{hanzi:question.hanzi,pinyin:question.pinyin,ru:question.ru}:{hanzi:'你想学什么？',pinyin:'Nǐ xiǎng xué shénme?',ru:'Что ты хочешь изучать?'};
 const alreadyAsked=state.asked.includes('study-next');
 if(!question&&alreadyAsked)return {state:nextState,semantic:sem,answer,response:null};
 const audio=typeof lookupExact==='function'?lookupExact(line.hanzi):null;
 const response={kind:'study-followup',questionId:question?.id??'study-next',line,audio:typeof audio?.src==='string'&&audio.src?audio:null,voiceStatus:typeof audio?.src==='string'&&audio.src?'registered-exact':'text-only',toneVerified:false};
 return {state:nextState,semantic:sem,answer,response};
}
export function confirmStudyReply(state,line){
 if(line?.hanzi==='你想学什么？')return {...state,asked:[...new Set([...state.asked,'study-next'])],pending:null};
 return observedFollowup(state,line);
}
