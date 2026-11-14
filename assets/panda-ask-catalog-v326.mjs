/* Panda Go v326 — learner-facing question examples backed by verified answers.
 * Never advertise a free-form answer, recording, tone grade or locked lesson.
 * Entries are checked against the SAME engine used when the learner submits.
 */
import {answerLive} from './panda-live-dialogue-v272.mjs?v=326';

export const ASK_CANDIDATES=Object.freeze([
 {lesson:1,title:'Основы и приветствие',questions:['你好吗？','你今天怎么样？','你今天好吗？','晚上好！你好吗？','你呢？']},
 {lesson:2,title:'Местоимения и представление',questions:['你叫什么名字？','你是谁？','你是老师吗？','你是学生吗？','他是学生吗？','她是老师吗？']},
 {lesson:3,title:'Числа',questions:['你几岁？','你多大？','你有几个？','十后面是几？','三十加二是多少？']},
 {lesson:4,title:'Дни недели',questions:['今天星期几？','明天星期几？','昨天星期几？','你星期几有空？','你今天有空吗？','你星期天有空吗？']},
 {lesson:5,title:'Даты и месяцы',questions:['今天几月几号？','明天几月几号？','现在几月？','今年是哪一年？','这个月有多少天？','下个月是几月？']},
 {lesson:6,title:'Семья',questions:['你有哥哥吗？','你有妹妹吗？','你有几个哥哥？','你姐姐怎么样？','你妹妹几岁？','你家有几口人？','你有弟弟和妹妹吗？']},
 {lesson:7,title:'Погода',questions:['今天天气怎么样？','明天天气怎么样？','今天下雪吗？','冬天天气怎么样？','夏天天气怎么样？','今天有风吗？']}
].map(group=>Object.freeze({...group,questions:Object.freeze([...group.questions])})));

export function availableAskGroups(allowed=[1],curriculum=[],date=new Date()){
 const unlocked=new Set((Array.isArray(allowed)?allowed:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=7));
 return ASK_CANDIDATES.filter(group=>unlocked.has(group.lesson)).map(group=>{
  const questions=group.questions.map(hanzi=>{
   // Do not offer unsupported or unreviewed forms. Tones and Russian translations
   // come from the existing authored response, never from a guess.
   const result=answerLive(hanzi,{allowed:[...unlocked],topic:group.lesson,curriculum,date,
    turn:1,profile:{family:{},recentQuestions:[]}});
   if(result.kind!=='question'||!result.reply||
    !result.spoken?.known||!result.spoken.pinyin||!result.spoken.translation)return null;
   return {hanzi,pinyin:result.spoken.pinyin,ru:result.spoken.translation,
    lesson:group.lesson,hasReplyAudio:Boolean(result.reply.audioKey)};
  }).filter(Boolean);
  return {lesson:group.lesson,title:group.title,questions};
 }).filter(group=>group.questions.length);
}
