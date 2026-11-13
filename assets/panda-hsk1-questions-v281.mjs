// Panda AI v281: use reviewed questions and recorded vocabulary already taught in HSK 1 lessons 1–7.
// No paid model, no fabricated recording, no access to locked lessons.
import {topicPrompts} from './panda-live-dialogue-v272.mjs?v=319';
import {lookupPilotAudio} from './panda-live-audio.mjs?v=281';
import {normalize} from './panda-voice-pilot-engine.mjs?v=live6';
import {extensionPrompts} from './panda-hsk1-extensions-v282.mjs?v=284';
import {patternPrompts} from './panda-hsk1-patterns-v285.mjs?v=285';

const chinese=s=>String(s??'').trim().replace(/[。！？?！\s]+/g,'');
const question=s=>/[?？]$/.test(String(s||'').trim());
function prompt(zh,py,ru,lesson,accepted,instruction,extra={}){
 const item={hanzi:zh,pinyin:py,ru,lesson,accepted:accepted.filter(Boolean),options:[],instruction,
  audioKey:lookupPilotAudio(zh)?zh:null,...extra};
 return {...item,verifiedLines:[{},item]};
}
export function coursePromptBank(lesson,curriculum=[],date=new Date(),profile={}){
 const t=curriculum[lesson-1],base=topicPrompts(lesson,date,profile),seen=new Set(base.map(p=>chinese(p.hanzi))),pool=[...base];
 if(!t)return pool;
 const add=(p)=>{const key=chinese(p.hanzi);if(!key||seen.has(key))return;seen.add(key);pool.push(p)};
 // Every interrogative phrase in the existing lesson dialogues is a candidate question.
 // The next dialogue line gives a checked sample answer. Other legitimate answers
 // can be accepted by the existing grammar-aware response engine.
 for(let i=0;i<(t.dialogue||[]).length;i++){
  const entry=t.dialogue[i];if(!question(entry[1]))continue;
  const next=t.dialogue[i+1],accepted=next&&!question(next[1])?[next[1]]:[];
  const relative=entry[1].match(/你有(哥哥|姐姐|弟弟|妹妹)吗/);
  if(relative)accepted.push('我有'+relative[1],'我没有'+relative[1]);
  if(lesson===7&&/^明天下雨吗/.test(entry[1]))accepted.push('明天下雨','明天不下雨');
  if(lesson===3&&/^你有几个/.test(entry[1]))accepted.push('我有两个','我有三个');
  add(prompt(entry[1],entry[2],entry[3],lesson,accepted,
    'Ответь на вопрос по материалам урока '+lesson+'. '+(accepted.length?'Пример: '+accepted[0]:''),
    relative?{relative:relative[1]}:{}));
 }
 // The weekday availability question and its answer already have full native-voice clips.
 if(lesson===4)add(prompt('你星期几有空？','Nǐ xīngqī jǐ yǒu kòng?','В какой день недели ты свободен?',4,
  ['我星期六有空。'],'В учебном диалоге ответь: 我星期六有空。'));
 // Supplement existing lesson dialogue questions with verified alternate queries.
 // Questions without a full MP3 remain text-only and explicitly marked by the player.
 for(const extra of extensionPrompts(lesson,date))add(extra);
 // New validated families combine studied words into many real questions.
 const unlocked=profile.unlocked||[1,2,3,4,5,6,7];
 for(const patterned of patternPrompts(lesson,date,unlocked))add(patterned);
 // Revisit every taught word that has its own complete MP3. This is a listening
 // and spoken-repetition prompt, NOT a fabricated Chinese question recording.
 for(const item of t.words||[]){
  const [zh,py,ru]=item;
  if(!lookupPilotAudio(zh))continue;
  add(prompt(zh,py,ru,lesson,[zh],
    'Повтори слово вслух: '+zh+' — '+ru+'.', {intent:'repeat'}));
 }
 // Also reuse actual sentence clips in rules / worked examples, never synthesize phrases.
 for(const rule of t.rules||[]){
  const [heading,explanation,zh,py,ru]=rule;
  if(!zh||!lookupPilotAudio(zh)||question(zh))continue;
  add(prompt(zh,py,ru,lesson,[zh],'Повтори пример из правила «'+heading+'».',{intent:'repeat'}));
 }
 for(const item of t.listen?.items||[]){
  const [zh,ru]=item;if(!lookupPilotAudio(zh))continue;
  const known=(t.words||[]).find(w=>chinese(w[0])===chinese(zh));
  add(prompt(zh,known?.[1]||'',ru||known?.[2]||'',lesson,[zh],'Послушай и повтори китайское слово.',{intent:'repeat'}));
 }
 return pool;
}
export function pickCoursePrompt(lesson,curriculum=[],recent=[],date=new Date(),profile={}){
 const pool=coursePromptBank(lesson,curriculum,date,profile);
 if(!pool.length)return null;
 const unseen=pool.find(p=>!recent.some(x=>chinese(x)===chinese(p.hanzi)));
 return unseen||[...pool].sort((a,b)=>recent.findLastIndex(x=>chinese(x)===chinese(a.hanzi))-recent.findLastIndex(x=>chinese(x)===chinese(b.hanzi)))[0];
}
export function courseCoverage(curriculum=[]){
 return curriculum.map((topic,index)=>{
  const bank=coursePromptBank(index+1,curriculum);
  return {lesson:index+1,title:topic.name,prompts:bank.length,recorded:bank.filter(x=>x.audioKey&&lookupPilotAudio(x.audioKey)).length,
   actualQuestions:bank.filter(x=>question(x.hanzi)).length};
 });
}
