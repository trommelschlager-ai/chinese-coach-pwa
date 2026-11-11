// Panda Go Live — offline answer variants and privacy-minded revision memory.
// Stores lesson number, step number and mistake count only, never typed or recognized speech.
import {verifyAnswerFor} from './panda-voice-pilot-engine.mjs?v=live6';
export const MISTAKES_KEY='pg-panda-live-review-v1';
export const PRACTICE_VARIANTS=Object.freeze({
 1:[['你好','早上好','中午好','下午好','晚上好'],['我很好','我很好，你呢？']],
 2:[['你好','早上好','中午好','下午好','晚上好'],['我是老师','不是，我是学生']],
 3:[['你好','早上好','中午好','下午好','晚上好'],['我三岁','我二十五岁','我44岁']],
 4:[['你好','早上好','中午好','下午好','晚上好'],['星期一','今天星期一','今天是星期一']],
 5:[['你好','早上好','中午好','下午好','晚上好'],['三月五号','今天三月五号','今天是三月五号']],
 6:[['你好','早上好','中午好','下午好','晚上好'],['我有哥哥','我有两个哥哥','我没有哥哥']],
 7:[['你好','早上好','中午好','下午好','晚上好'],['今天很冷','今天天气很热','今天下雨','今天阴天'],['明天下雨','明天很冷','明天天气很好']]
});
export function validatedVariants(lesson,step,lines){
 const proposed=PRACTICE_VARIANTS[lesson]?.[step]||[];
 return proposed.filter(value=>verifyAnswerFor(lines,step,value).ok);
}
export function readMistakes(storage){
 try{
  const raw=JSON.parse(storage?.getItem(MISTAKES_KEY)||'[]');
  if(!Array.isArray(raw))return [];
  return raw.filter(x=>x&&Number.isInteger(x.lesson)&&x.lesson>=1&&x.lesson<=7&&Number.isInteger(x.step)&&x.step>=0&&x.step<=3&&Number.isInteger(x.count)&&x.count>0)
   .slice(0,25).map(x=>({lesson:x.lesson,step:x.step,count:Math.min(x.count,20)}));
 }catch{return []}
}
function write(storage,items){
 try{storage?.setItem(MISTAKES_KEY,JSON.stringify(items));return true}catch{return false}
}
export function noteMistake(storage,lesson,step){
 if(!Number.isInteger(lesson)||lesson<1||lesson>7||!Number.isInteger(step)||step<0||step>3)return 0;
 const items=readMistakes(storage),found=items.find(x=>x.lesson===lesson&&x.step===step);
 if(found)found.count=Math.min(20,found.count+1);
 else if(items.length<25)items.push({lesson,step,count:1});
 write(storage,items);
 return items.filter(x=>x.lesson===lesson).length;
}
export function clearReviewedMistake(storage,lesson,step){
 const items=readMistakes(storage);
 const next=items.filter(x=>x.lesson!==lesson||x.step!==step);
 if(items.length!==next.length)write(storage,next);
 return next.filter(x=>x.lesson===lesson).length;
}
export function hardestMistake(storage,lesson){
 return readMistakes(storage).filter(x=>x.lesson===lesson).sort((a,b)=>b.count-a.count||a.step-b.step)[0]||null;
}
