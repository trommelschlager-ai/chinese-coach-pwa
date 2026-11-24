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
const STREET_NEXT=line('你晚上有什么计划？','Nǐ wǎnshang yǒu shénme jìhuà?','Какие у тебя планы на вечер?');

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
     const reaction=s==='一般'?line('这样啊。','Zhèyàng a.','Понятно.'):line('那就好！','Nà jiù hǎo!','Ну и хорошо!');
     return {kind:'answer',panda:reaction,
       learner:line(raw,py[s],meaning[s]),nextQuestion:normalizeLine(state.pending),message:'Ответ по смыслу подходит.'};
   }
   // Lesson 2: accept natural contextual replies before the generic HSK tutor.
   // For names not in the reviewed lexicon, do not fabricate their pinyin.
   const current=clean(state.prompt?.hanzi||'');
   if(/叫什么|什么名字/.test(current)&&/^我叫[\p{Script=Han}a-zA-Z]{1,16}$/u.test(s)){
     const known={'我叫小明':['Wǒ jiào Xiǎomíng.','Меня зовут Сяомин.'],'我叫安娜':['Wǒ jiào Ānnà.','Меня зовут Анна.']};
     const next=line('你哪儿人啊？','Nǐ nǎr rén a?','Ты откуда?');
     setPrompt({...next,lesson:1});state.pending=null;
     return {kind:'question',learner:line(raw,...(known[s]||['','Меня зовут '+s.slice(2)+'。'])),panda:next,nextQuestion:null,message:'Имя принято.'};
   }
   if(/哪儿人|哪里人/.test(current)&&['我是俄罗斯人','我从俄罗斯来的','我来自俄罗斯'].includes(s)){
     const detail={'我是俄罗斯人':['Wǒ shì Éluósī rén.','Я россиянин.'],'我从俄罗斯来的':['Wǒ cóng Éluósī lái de.','Я приехал из России.'],'我来自俄罗斯':['Wǒ láizì Éluósī.','Я из России.']};
     const next=line('你也学中文啊？','Nǐ yě xué Zhōngwén a?','Ты тоже учишь китайский?');
     setPrompt({...next,lesson:1});state.pending=null;
     return {kind:'question',learner:line(raw,...detail[s]),panda:next,nextQuestion:null,message:'Ответ по смыслу подходит.'};
   }
   if(/学中文/.test(current)&&['对啊刚学','对啊我学中文','我学中文','我也学中文'].includes(s)){
     const detail={'对啊刚学':['Duì a, gāng xué.','Ага, только начал учить.'],'对啊我学中文':['Duì a, wǒ xué Zhōngwén.','Ага, я учу китайский.'],'我学中文':['Wǒ xué Zhōngwén.','Я учу китайский.'],'我也学中文':['Wǒ yě xué Zhōngwén.','Я тоже учу китайский.']};
     const next=line('加个微信？','Jiā ge Wēixìn?','Добавимся в WeChat?');
     setPrompt({...next,lesson:1});state.pending=null;
     return {kind:'question',learner:line(raw,...detail[s]),panda:next,nextQuestion:null,message:'Ответ по смыслу подходит.'};
   }
   if(/加个微信/.test(current)&&['行啊','好啊','可以'].includes(s)){
     const detail={'行啊':['Xíng a!','Давай!'],'好啊':['Hǎo a!','Хорошо!'],'可以':['Kěyǐ.','Можно.']};
     state.prompt=null;state.pending=null;
     return {kind:'answer',learner:line(raw,...detail[s]),panda:line('那就好！','Nà jiù hǎo!','Ну и отлично!'),nextQuestion:null,message:'Знакомство завершено.'};
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
