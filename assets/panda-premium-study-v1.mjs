// Panda Go Premium study tools. Independent foundation; not wired into the live UI.
// No microphone recordings, fabricated scores or unconfirmed personal facts.
const DAY=86400000;
function cleanText(value,max=500){
 if(typeof value!=="string")throw new TypeError("Expected text");
 const s=value.trim().normalize("NFC");
 if(!s||[...s].length>max)throw new RangeError("Invalid text length");
 return s;
}

function validKey(value){const s=cleanText(value,100);if(!/^[a-z0-9][a-z0-9_-]*$/i.test(s))throw new Error("Invalid key");return s;}

function time(value){if(!Number.isSafeInteger(value)||value<0||value>8e15)throw new RangeError("Invalid timestamp");return value;}

function recordReview(previous,input){
 const {lessonId,wordId,correct,now}=input;
 const lesson=validKey(lessonId),word=validKey(wordId),at=time(now);
 if(typeof correct!=="boolean")throw new TypeError("Confirmed result required");
 if(previous&&(previous.lessonId!==lesson||previous.wordId!==word))throw new Error("Mismatched review");
 if(previous&&at<previous.lastAt)throw new Error("Stale result");
 // A correctly answered first encounter does not create an error card.
 if(!previous&&correct)return null;
 const streak=correct?Math.min(4,(previous?.streak||0)+1):0;
 const delay=[0,1,3,7,14][streak]*DAY;
 return {lessonId:lesson,wordId:word,streak,mistakes:(previous?.mistakes||0)+(correct?0:1),lastAt:at,dueAt:at+delay};
}

function dueReviews(cards,now){
 const at=time(now);return cards.filter(c=>c.dueAt<=at).slice().sort((a,b)=>a.dueAt-b.dueAt||b.mistakes-a.mistakes||a.wordId.localeCompare(b.wordId));
}

function confirmedStory(input){
 if(input?.confirmed!==true)throw new Error("STORY_CONFIRMATION_REQUIRED");
 const lessonId=validKey(input.lessonId);
 if(!Array.isArray(input.lines)||!input.lines.length||input.lines.length>30)throw new RangeError("No valid story lines");
 const lines=input.lines.map(line=>{
  const zh=cleanText(line.zh),py=cleanText(line.py),ru=cleanText(line.ru);
  if(!/\p{Script=Han}/u.test(zh)||/[.…]{3}|…|__custom__/.test(zh+py))throw new Error("Incomplete story");
  return {zh,py,ru};
 });
 return {lessonId,title:cleanText(input.title,120),lines,updatedAt:time(input.now),source:"learner-confirmed"};
}

function createStudyStore(storage,ownerId){
 const owner=validKey(ownerId),key="panda-premium-study-v1:"+owner;
 function read(){
  const raw=storage.getItem(key);
  if(raw===null)return {reviews:{},stories:{}};
  const data=JSON.parse(raw);
  if(!data||typeof data.reviews!=="object"||!data.reviews||typeof data.stories!=="object"||!data.stories)throw new Error("Invalid saved study data");
  return data;
 }
 function write(data){storage.setItem(key,JSON.stringify(data));}
 return Object.freeze({
  record(input){const data=read(),id=validKey(input.lessonId)+":"+validKey(input.wordId);const result=recordReview(Object.hasOwn(data.reviews,id)?data.reviews[id]:null,input);if(result){data.reviews[id]=result;write(data);}return result;},
  due(now){return dueReviews(Object.values(read().reviews),now);},
  saveStory(input){const story=confirmedStory(input),data=read();Object.defineProperty(data.stories,story.lessonId,{value:story,enumerable:true,configurable:true,writable:true});write(data);return story;},
  stories(){return Object.values(read().stories).sort((a,b)=>a.lessonId.localeCompare(b.lessonId,undefined,{numeric:true}));},
  deleteStory(lessonId){const data=read();delete data.stories[validKey(lessonId)];write(data);},
  clear(){storage.removeItem(key);}
 });
}
export {recordReview,dueReviews,confirmedStory,createStudyStore};
