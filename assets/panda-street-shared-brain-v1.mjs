/* Panda Street AI shared brain v1.
 * Reuses the reviewed Panda Go HSK conversation and grammar engine.
 * Keeps Street conversation state separate and does NOT provide acoustic tone grading.
 */
import {answerLive,analyzeLearner,topicPrompts} from './panda-live-dialogue-v272.mjs?v=434';
import {correctPandaGrammarV2} from './panda-grammar-hsk12-v2.mjs?v=2';
import {correctCommonPhrase} from './panda-chat-corrections-v377.mjs?v=377';
import {accessibleLessons} from './panda-nonstop-v267.mjs?v=270';
import {answerCurriculumQuestion} from './panda-curriculum-tutor.mjs';
import {mergePandaFacts435} from './panda-natural-memory-v435.mjs?v=435';
import {readSharedPandaProfile,saveSharedPandaProfile} from './panda-cross-character-memory-v1.mjs';

const clean=s=>String(s??'').normalize('NFC').replace(/[\s，。？！?!、,.]/g,'');
const line=(zh,py,ru)=>({zh,py,ru});
const normalizeLine=r=>r?line(r.hanzi||r.panda||r.zh||'',r.pinyin||r.py||'',r.ru||r.translation||''):null;
const STREET_FIRST=line('哈喽！最近怎么样？','Hālou! Zuìjìn zěnmeyàng?','Привет! Как дела?');
const STREET_NEXT=line('你呢？','Nǐ ne?','А ты?');

export function createStreetBrain({storage=(()=>{try{return globalThis.localStorage}catch{return null}})(),curriculum=[]}={}){
 const state={turn:0,mode:'nonstop',prompt:null,pending:null,topic:1,
  questions:[],profile:{...readSharedPandaProfile(storage),recentQuestions:[]},recent:[]};
 const allowed=()=>{try{return accessibleLessons(storage,1)}catch{return [1]}};
 const remember=(input,result)=>{
   if(!result?.spoken?.known||result.spoken.correction)return;
   state.profile=mergePandaFacts435(state.profile,result.spoken);
   state.profile.recentQuestions=state.questions.slice(-30);
   saveSharedPandaProfile(storage,state.profile);
 };
 function start(mode='nonstop'){
   state.mode=mode==='short'?'short':'nonstop';
   state.prompt={hanzi:STREET_FIRST.zh,lesson:1,instruction:'Ответь, как у тебя дела.'};
   state.pending=null;state.topic=1;
   state.questions.push(STREET_FIRST.zh);
   return STREET_FIRST;
 }
 function setPrompt(prompt){
   const p=normalizeLine(prompt);
   if(p?.zh){
     state.prompt={hanzi:p.zh,lesson:prompt.lesson||1,instruction:'Ответь на вопрос Панды.'};
     state.questions.push(p.zh);
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
 function answer(input,{mode=state.mode}={}){
   const raw=String(input??'').trim(),s=clean(raw);
   if(!raw)return {kind:'empty',message:'Напиши или скажи фразу по-китайски.'};
   state.turn++;
   state.mode=mode==='short'?'short':'nonstop';
   const learned=allowed();
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
   return {kind:result.kind,panda,learner,message:result.message||'',
     nextQuestion:state.mode==='nonstop'?normalizeLine(state.pending):null,
     explanation:result.explanation||''};
 }
 return {allowed,start,setPrompt,nextQuestion,answer,
   getState:()=>({mode:state.mode,topic:state.topic,turn:state.turn,allowed:allowed()}),
   askCurriculum:(question,lesson=1)=>answerCurriculumQuestion(question,lesson,curriculum)};
}
