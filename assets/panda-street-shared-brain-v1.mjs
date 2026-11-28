/* Panda Street AI shared brain v1.
 * Reuses the reviewed Panda Go HSK conversation and grammar engine.
 * Keeps Street conversation state separate and does NOT provide acoustic tone grading.
 */
import {saveGrammarReview,readDayReview,getReviewCardLine,dueDayReview,dayReviewStats,practiceDayReview,clearDayReview} from './panda-hsk2-day-understanding-v1.mjs?v=6';
import {answerLive,analyzeLearner,topicPrompts} from './panda-live-dialogue-v272.mjs?v=434';
import {correctPandaGrammarV2} from './panda-grammar-hsk12-v2.mjs?v=2';
import {correctCommonPhrase} from './panda-chat-corrections-v377.mjs?v=377';
import {accessibleLessons} from './panda-nonstop-v267.mjs?v=270';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {mergePandaFacts435} from './panda-natural-memory-v435.mjs?v=435';
import {readSharedPandaProfile,saveSharedPandaProfile} from './panda-cross-character-memory-v1.mjs';
import {createSemanticPilot} from './panda-unified-pilot-adapter-v1.mjs';
import {pilotLearnerMetadata} from './panda-unified-pilot-metadata-v1.mjs';

const clean=s=>String(s??'').normalize('NFC').replace(/[\s，。？！?!、,.]/g,'');
const line=(zh,py,ru)=>({zh,py,ru});
const normalizeLine=r=>r?line(r.hanzi||r.panda||r.zh||'',r.pinyin||r.py||'',r.ru||r.translation||''):null;
const STREET_FIRST=line('哈喽！最近怎么样？','Hālou! Zuìjìn zěnmeyàng?','Привет! Как дела?');
const STREET_NEXT=line('你呢？','Nǐ ne?','А ты?');

export function createStreetBrain({storage=(()=>{try{return globalThis.localStorage}catch{return null}})(),curriculum=[],unified=false,lookupMale=null,practiceDialogs=[]}={}){
 const practiceTurns=new Map(),practiceQuestions=new Map();
 for(const dialogue of practiceDialogs){
   if(dialogue.length>1)practiceQuestions.set(clean(dialogue[0].zh),{learner:dialogue[0],reply:dialogue[1]});
   for(let i=1;i+1<dialogue.length;i+=2){
     practiceTurns.set(clean(dialogue[i-1].zh)+':'+clean(dialogue[i].zh),
       {learner:dialogue[i],reply:dialogue[i+1]});
   }
 }
 const state={turn:0,mode:'nonstop',prompt:null,pending:null,topic:1,
  questions:[],profile:{...readSharedPandaProfile(storage),recentQuestions:[]},recent:[]};
 const semantic=createSemanticPilot({enabled:unified,lookupExact:typeof lookupMale==='function'?lookupMale:null,metadata:pilotLearnerMetadata,allowTextOnly:true,livingConversation:true});
 const observe=(p,linked=false)=>{if(unified&&state.mode==='nonstop'&&p?.zh)semantic.observePanda({hanzi:p.zh,pinyin:p.py,ru:p.ru},{continuesLearnerTurn:linked});};
 const allowed=()=>{try{return accessibleLessons(storage,1)}catch{return [1]}};
 const remember=(input,result)=>{
   if(!result?.spoken?.known||result.spoken.correction)return;
   state.profile=mergePandaFacts435(state.profile,result.spoken);
   state.profile.recentQuestions=state.questions.slice(-30);
   saveSharedPandaProfile(storage,state.profile);
 };
 function start(mode='nonstop'){
   state.mode=mode==='short'?'short':'nonstop';
   const opening=practiceDialogs[0]?.[0]||STREET_FIRST;
   state.prompt={hanzi:opening.zh,lesson:1,instruction:practiceDialogs.length?'Ответь на вопрос Панды.':'Ответь, как у тебя дела.'};
   state.pending=null;state.topic=1;
   state.questions.push(opening.zh);
   semantic.reset();observe(opening);
   return opening;
 }
 function setPrompt(prompt){
   const p=normalizeLine(prompt);
   if(p?.zh){
     state.prompt={hanzi:p.zh,lesson:prompt.lesson||1,instruction:'Ответь на вопрос Панды.'};
     state.questions.push(p.zh);observe(p);
   }
 }
 function nextQuestion(){
   if(state.pending){
     const p=state.pending;state.pending=null;setPrompt(p);return normalizeLine(p);
   }
   const topics=allowed();
   const lesson=topics[(Math.max(0,state.turn))%topics.length]||1;
   const pool=topicPrompts(lesson,new Date(),state.profile);
   const selected=pool.find(x=>!state.questions.some(y=>clean(y)===clean(x.hanzi)))||pool[0];
   if(selected){setPrompt(selected);state.topic=lesson;return normalizeLine(selected)}
   return start(state.mode);
 }
 function answer(input,{mode=state.mode,fromSpeech=false}={}){
   const raw=String(input??'').trim(),s=clean(raw);
   if(!raw)return {kind:'empty',message:'Напиши или скажи фразу по-китайски.'};
   state.turn++;
   state.mode=mode==='short'?'short':'nonstop';
   if(practiceQuestions.size){
     const turn=practiceTurns.get(clean(state.prompt?.hanzi)+':'+s)||practiceQuestions.get(s);
     if(turn){
       state.pending=null;
       setPrompt(turn.reply);
       return {kind:'answer',learner:line(raw,turn.learner.py,turn.learner.ru),
         panda:turn.reply,nextQuestion:null,toneVerified:false,message:'Ответ по смыслу подходит.'};
     }
   }
   const learned=allowed();
   if(state.mode==='short')semantic.reset();
   // Preserve the established Street greeting and reviewed correction behavior.
   // Unified responses are limited to reviewed metadata and the common allowlist.
   if(unified&&state.mode==='nonstop'){
     const planned=semantic.plan(raw,{mode:'free-chat'});
     if(planned?.spoken){
       const p=normalizeLine(planned.line);
       state.pending=null;state.prompt=null;
       observe(p,planned.continuesLearnerTurn===true);
       return {kind:'answer',panda:p,learner:line(raw,planned.spoken.pinyin,planned.spoken.translation),nextQuestion:null,
         unified:true,voiceStatus:planned.voiceStatus,toneVerified:false,
         message:planned.kind==='explain-exact'?'Значение предыдущей реплики показано в переводе. Тоны не оценивались.':'Панда поняла смысл. Тоны не оценивались.'};
     }
   }
   // A natural, valid statement is a conversation turn, not a grammar explanation.
   // Do not persist temporary busyness in the shared learner profile and never
   // claim acoustic tone assessment for text entry.
   if(['我有点忙','我很忙','我现在有点忙'].includes(s)){
     const variants={
       '我有点忙':['Wǒ yǒudiǎn máng.','Я немного занят.'],
       '我很忙':['Wǒ hěn máng.','Я очень занят.'],
       '我现在有点忙':['Wǒ xiànzài yǒudiǎn máng.','Сейчас я немного занят.']
     };
     state.pending=null;
     return {kind:'answer',
       learner:line(raw,...variants[s]),
       panda:line('好，那你先忙吧！','Hǎo, nà nǐ xiān máng ba!','Хорошо, тогда занимайся своими делами.'),
       nextQuestion:null,
       message:'Панда поняла твою реплику. Проверки тонов по звуку не было.'};
   }
   // Street-specific vocabulary supplements the SAME HSK engine.
   if(['哈喽','嗨','早啊'].includes(s)){
     const p=STREET_FIRST;
     setPrompt({...p,lesson:1});
     return {kind:'question',panda:p,learner:line(raw,s==='哈喽'?'Hālou':s==='嗨'?'Hāi':'Zǎo a','Привет!'),message:'Уличное приветствие · разговорная речь.'};
   }
   if(['还行吧','挺好的','还好','不错','一般'].includes(s)&&
      /最近怎么样|你好吗|今天怎么样/.test(clean(state.prompt?.hanzi||''))){
     const meaning={'还行吧':'Нормально вроде.','挺好的':'Вполне хорошо.','还好':'Нормально.','不错':'Неплохо.','一般':'Так себе.'};
     const py={'还行吧':'Hái xíng ba.','挺好的':'Tǐng hǎo de.','还好':'Hái hǎo.','不错':'Búcuò.','一般':'Yìbān.'};
     state.pending={...STREET_NEXT,lesson:1};
     return {kind:'answer',panda:line('挺好的！','Tǐng hǎo de!','Вполне хорошо!'),
       learner:line(raw,py[s],meaning[s]),nextQuestion:normalizeLine(state.pending),message:'Ответ по смыслу подходит.'};
   }
   const prompt=state.prompt;
   let result;
   try {
     result=correctPandaGrammarV2(raw,{prompt})||correctCommonPhrase(raw)||
       answerLive(raw,{allowed:learned,topic:state.topic,prompt,curriculum,date:new Date(),
         turn:state.turn,profile:{...state.profile,recentQuestions:state.questions.slice(-30)}});
   }catch(e){console.error('Street brain failed:',e);return {kind:'error',message:'Не удалось проверить фразу. Попробуй ещё раз.'};}
   const learner=result.spoken?.known?
     line(raw,result.spoken.pinyin||'',result.spoken.translation||''):
     line(raw,'',result.spoken?.probable||'Распознано; смысл пока не подтверждён');
   if(['correction','clarify','locked','empty','error'].includes(result.kind)){
     const fix=result.spoken?.correction;
     return {kind:result.kind,learner,message:result.message||'Попробуй уточнить фразу.',
       correction:fix?normalizeLine(fix):null,
       reviewCorrection:!fromSpeech&&fix?.category==='grammar'&&!fix.uncertain?{category:'grammar',hanzi:fix.hanzi,pinyin:fix.pinyin,ru:fix.ru}:null,
       why:fix?.why||result.message||''};
   }
   if(result.spoken?.known)remember(raw,result);
   if(result.lesson&&learned.includes(result.lesson))state.topic=result.lesson;
   let panda=normalizeLine(result.reply);
   const followup=result.followup&&learned.includes(result.followup.lesson||state.topic)?result.followup:null;
   if(followup&&state.mode==='nonstop'){
     state.pending=followup;
   }else if(state.mode==='nonstop'&&['answer','statement'].includes(result.kind)){
     const next=topicPrompts(state.topic,new Date(),state.profile)
       .find(x=>!state.questions.some(q=>clean(q)===clean(x.hanzi)));
     if(next)state.pending=next;
   }
   if(!panda&&result.kind==='explanation'){
     const explanation=result.explanation||result.message||'Проверь грамматику этой фразы.';
     return {kind:'explanation',learner,message:explanation};
   }
   if(!panda){
     return {kind:result.kind,learner,message:result.message||
       'Фраза разобрана, но для неё пока нет готового ответа.',nextQuestion:null};
   }
   // Return the real reviewed engine reply; the next question is offered separately.
   observe(panda);
   return {kind:result.kind,panda,learner,message:result.message||'',
     nextQuestion:state.mode==='nonstop'?normalizeLine(state.pending):null,
     explanation:result.explanation||''};
 }
 return {allowed,start,setPrompt,nextQuestion,answer,
   review:{save:(c,consent)=>saveGrammarReview(storage,c,consent),cards:()=>readDayReview(storage).map(x=>({...x,line:getReviewCardLine(x)})),due:()=>dueDayReview(storage).map(x=>({...x,line:getReviewCardLine(x)})),stats:()=>dayReviewStats(storage),practice:(zh,answer,consent)=>practiceDayReview(storage,zh,answer,consent),clear:()=>clearDayReview(storage)},
   getState:()=>({mode:state.mode,topic:state.topic,turn:state.turn,allowed:allowed()}),
   askCurriculum:(question,lesson=1)=>answerCurriculumQuestion(question,lesson,curriculum)};
}
