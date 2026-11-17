/* Panda Go v326 — learner-facing question examples backed by verified answers.
 * Never advertise a free-form answer, recording, tone grade or locked lesson.
 * Entries are checked against the SAME engine used when the learner submits.
 */
import {answerLive} from './panda-live-dialogue-v272.mjs?v=qa-7fff6cb9';
import {PANDA_CLIPS} from '../panda-voice-clips-v365.mjs?v=365';
import {lookupPandaVoiceClip} from './panda-live-audio.mjs?v=qa-7fff6cb9';

export const ASK_CANDIDATES=Object.freeze([
 {lesson:1,title:'Основы и приветствие',questions:['你好吗？','你今天怎么样？','你今天好吗？','晚上好！你好吗？','你呢？','你吃饭了吗？','你吃了吗？']},
 {lesson:2,title:'Местоимения и представление',questions:['你叫什么名字？','你是谁？','你是老师吗？','你是学生吗？','他是学生吗？','她是老师吗？']},
 {lesson:3,title:'Числа',questions:['你几岁？','你多大？','你有几个？','十后面是几？','三十加二是多少？']},
 {lesson:4,title:'Дни недели',questions:['今天星期几？','明天星期几？','昨天星期几？','你星期几有空？','你今天有空吗？','你星期天有空吗？']},
 {lesson:5,title:'Даты и месяцы',questions:['今天几月几号？','明天几月几号？','现在几月？','今年是哪一年？','这个月有多少天？','下个月是几月？']},
 {lesson:6,title:'Семья',questions:['你有哥哥吗？','你有妹妹吗？','你有几个哥哥？','你姐姐怎么样？','你妹妹几岁？','你家有几口人？','你有弟弟和妹妹吗？']},
 {lesson:7,title:'Погода',questions:['今天天气怎么样？','明天天气怎么样？','今天下雪吗？','冬天天气怎么样？','夏天天气怎么样？','今天有风吗？']}
].map(group=>Object.freeze({...group,questions:Object.freeze([...group.questions])})));

// The 14 November Luvvoice recordings contain additional questions. Only
// include them when the current dialogue engine confirms it can understand
// and answer that exact question. Audio alone is NOT evidence of dialogue support.
const AUDIO_TOPIC=Object.freeze({
 '20261114-BWLSNa.mp3':1,'20261114-bsPFJr.mp3':1,'20261114-d9kQmz.mp3':1,
 '20261114-APqUx9.mp3':2,'20261114-W6Okix.mp3':2,
 '20261114-47SW44.mp3':2,'20261114-K0Uh5q.mp3':2,
 '20261114-FMAH9S.mp3':3,'20261114-M7EwcW.mp3':6,
 '20261114-7JVWfV.mp3':null // HSK2 "My day": audio-only until day-specific dialogue validation
});
const looksLikeQuestion=phrase=>/^(?:你|我|今天|明天|昨天|现在|今年|下个月|十后面|三十)/.test(phrase)
 && /(?:吗|呢|几|谁|什么|哪里|哪儿|多少|多久|怎么样|多大|哪个|为什么|怎么|几点|可以|有空)$/.test(phrase);
const recorderQuestions=new Map();
for(const clip of PANDA_CLIPS){
 const lesson=AUDIO_TOPIC[clip.file];
 if(!lesson||!looksLikeQuestion(clip.zh))continue;
 const items=recorderQuestions.get(lesson)||[];
 if(!items.includes(clip.zh))items.push(clip.zh);
 recorderQuestions.set(lesson,items);
}

export function availableAskGroups(allowed=[1],curriculum=[],date=new Date()){
 const unlocked=new Set((Array.isArray(allowed)?allowed:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=7));
 return ASK_CANDIDATES.filter(group=>unlocked.has(group.lesson)).map(group=>{
  const questions=[...new Set([...group.questions,...(recorderQuestions.get(group.lesson)||[])])].map(hanzi=>{
   // Do not offer unsupported or unreviewed forms. Tones and Russian translations
   // come from the existing authored response, never from a guess.
   const result=answerLive(hanzi,{allowed:[...unlocked],topic:group.lesson,curriculum,date,
    turn:1,profile:{family:{},recentQuestions:[]}});
   if(result.kind!=='question'||!result.reply||
    !result.spoken?.known||!result.spoken.pinyin||!result.spoken.translation)return null;
   return {hanzi,pinyin:result.spoken.pinyin,ru:result.spoken.translation,
    lesson:group.lesson,hasReplyAudio:Boolean(lookupPandaVoiceClip(hanzi)),hasRecordedReply:Boolean(lookupPandaVoiceClip(result.reply.hanzi||result.reply.panda))};
  }).filter(Boolean);
  return {lesson:group.lesson,title:group.title,questions};
 }).filter(group=>group.questions.length);
}
