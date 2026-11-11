// Extension registry. Draft lessons are data only, not available exercises.
// A lesson is enabled only after vocabulary, branches and every speaker clip pass QA.
import {PILOT_LINES,REPLIES,NEW_WORDS} from './panda-voice-pilot-engine.mjs?v=live4';
import {LESSON2} from './panda-live-lesson2.mjs?v=live4';
import {DRAFT_CONVERSATIONS} from './panda-live-drafts.mjs?v=live4';
export const CONVERSATIONS=Object.freeze([
 Object.freeze({id:1,theme:'Основы и приветствие',requiresLesson:1,status:'pilot-audio-complete-device-test-pending',lines:PILOT_LINES,replies:REPLIES,newWords:NEW_WORDS}),
 LESSON2,
 ...DRAFT_CONVERSATIONS
]);
export function missingConversationAudio(lesson,lookup){
 return [...lesson.lines,...Object.values(lesson.replies)].filter(line=>!line.audioKey||!lookup(line.audioKey)).map(line=>line.panda||line.hanzi);
}

// Unfinished conversations require an explicit preview URL, never a normal lesson link.
export function selectConversation(search=''){
 const params=new URLSearchParams(search),id=Number(params.get('lesson')||1),preview=params.get('preview')==='1';
 return CONVERSATIONS.find(item=>item.id===id&&item.lines.length&&(!item.status.startsWith('draft')||preview))||CONVERSATIONS[0];
}

export function pendingVoiceQueue(lookup){
 const queue=new Map();
 for(const lesson of CONVERSATIONS)for(const phrase of missingConversationAudio(lesson,lookup)){
  if(!queue.has(phrase))queue.set(phrase,{phrase,lessons:[]});
  queue.get(phrase).lessons.push(lesson.id);
 }
 return [...queue.values()].map(item=>({...item,lessons:[...new Set(item.lessons)]}));
}
