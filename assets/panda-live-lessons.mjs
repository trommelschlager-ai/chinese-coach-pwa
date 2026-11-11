// Extension registry. Draft lessons are data only, not available exercises.
// A lesson is enabled only after vocabulary, branches and every speaker clip pass QA.
import {PILOT_LINES,REPLIES,NEW_WORDS} from './panda-voice-pilot-engine.mjs';
export const CONVERSATIONS=Object.freeze([
 Object.freeze({id:1,theme:'Основы и приветствие',requiresLesson:1,status:'pilot-missing-audio',lines:PILOT_LINES,replies:REPLIES,newWords:NEW_WORDS}),
 ...['Местоимения и представление','Числа','Дни недели','Даты и месяцы','Семья','Погода'].map((theme,i)=>Object.freeze({id:i+2,theme,requiresLesson:i+2,status:'draft',lines:[],replies:{},newWords:[]}))
]);
export function missingConversationAudio(lesson,lookup){
 return [...lesson.lines,...Object.values(lesson.replies)].filter(line=>!line.audioKey||!lookup(line.audioKey)).map(line=>line.panda||line.hanzi);
}
