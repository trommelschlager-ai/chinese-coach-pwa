// Panda Go Non-Stop v267 — deterministic, no API requests; only studied/current HSK1.
import {verifyAnswerFor,normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {prepareConversation,interpretUtterance,replyToExtraSpeech} from './panda-live-conversation-v266.mjs?v=266';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=live6';
export const TOPIC_IDS=['foundations','pronouns','numbers','weekdays','dates','family','weather'];
const safeJSON=(storage,key)=>{try{return JSON.parse(storage?.getItem(key)||'null')}catch{return null}};
const isDone=(storage,id,index,complete)=>{
 const v=safeJSON(storage,'pg-hsk1-v3-'+id)||{};
 if(complete.includes(id)||v.completed===true)return true;
 const i=index+1;
 const key=i===2?'pg-hsk1-v203-pronouns':i===3?'pg-hsk1-v213-numbers':i===4?'pg-hsk1-v215-weekdays':i===5?'pg-hsk1-l5-v227':i>=6?'pg-hsk1-l'+i+'-v231':'';
 const legacy=key?safeJSON(storage,key)||{}:{};
 if(i===4&&safeJSON(storage,'pg-hsk1-v214-weekdays')?.done===true)return true;
 return legacy.done===true||legacy.completed===true;
};
export function accessibleLessons(storage,current=1){
 const done=safeJSON(storage,'pg-hsk1-v3-complete'),completed=Array.isArray(done)?done:[];
 const active=Number.isInteger(Number(current))?Math.min(7,Math.max(1,Number(current))):1;
 const ids=TOPIC_IDS.map((id,index)=>isDone(storage,id,index,completed)?index+1:null).filter(Boolean);
 // Lesson 1 is foundational; currently selected lesson is allowed for practice.
 return [...new Set([1,...ids,active])].sort((a,b)=>a-b);
}
export function promptFor(conversations,lesson,date=new Date()){
 const source=conversations.find(x=>x.id===lesson);
 if(!source||source.lines?.length<2)return null;
 const c=prepareConversation(source,date),line=c.lines[1];
 if(!lookupPilotAudio(line.audioKey))return null;
 return {...line,hanzi:line.hanzi||line.panda,lesson,lessonName:c.theme,verifiedLines:c.lines,context:c.context||''};
}
export function nextPrompt(conversations,allowed,index=0,date=new Date()){
 const valid=(allowed||[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=7);
 if(!valid.length)return null;
 for(let i=0;i<valid.length;i++){
  const lesson=valid[(index+i)%valid.length];
  const line=promptFor(conversations,lesson,date);
  if(line)return {line,nextIndex:index+i+1};
 }
 return null;
}
// There are only a few fully grounded question->answer voice pairs.
// If there is no clip, NEVER claim the Panda spoke it.
const QUESTION_RESPONSES={
 '你好吗':{hanzi:'很好！',pinyin:'Hěn hǎo!',ru:'Хорошо!',audioKey:'很好',requires:1},
 '你呢':{hanzi:'很好！',pinyin:'Hěn hǎo!',ru:'Хорошо!',audioKey:'很好',requires:1},
 '你是老师吗':{hanzi:'我是老师。',pinyin:'Wǒ shì lǎoshī.',ru:'Я учитель.',audioKey:'我是老师',requires:2},
 '你几岁':{hanzi:'我三岁。',pinyin:'Wǒ sān suì.',ru:'Мне три года (игровой персонаж).',audioKey:'我三岁',requires:3},
 '你有哥哥吗':{hanzi:'我有一个哥哥。',pinyin:'Wǒ yǒu yí ge gēge.',ru:'У меня есть старший брат (роль Панды).',audioKey:'我有一个哥哥',requires:6}
};
export function answerNonStop(input,allowed,currentPrompt,topics=[],date=new Date()){
 const raw=String(input??'').trim(),s=normalize(raw),scope=new Set(allowed||[]);
 if(!raw)return {kind:'empty',message:'Скажи или напиши фразу на китайском.'};
 // Do not allow a prompt from a locked chapter.
 if(currentPrompt&&scope.has(currentPrompt.lesson)){
  const match=verifyAnswerFor(currentPrompt.verifiedLines,1,raw);
  if(match.ok){
   const spoken=interpretUtterance(raw,currentPrompt.lesson,topics);
   return {kind:'answer',lesson:currentPrompt.lesson,spoken,message:'Отлично! Переходим к следующему вопросу.'};
  }
 }
 const direct=QUESTION_RESPONSES[s];
 if(direct&&scope.has(direct.requires)&&lookupPilotAudio(direct.audioKey)){
  const spoken=interpretUtterance(raw,direct.requires,topics);
  return {kind:'question',lesson:direct.requires,spoken,reply:direct};
 }
 // Interpret the same utterance only against unlocked and currently selected lessons.
 for(const lesson of allowed||[]){
  if(!scope.has(lesson))continue;
  const spoken=interpretUtterance(raw,lesson,topics);
  if(spoken.known)return {kind:'statement',lesson,spoken,message:'Панда поняла фразу из изученного материала.'};
 }
 return {kind:'unknown',message:'Эту фразу я пока не знаю в пройденных уроках. Выбери подсказку или спроси по изученной теме.'};
}
