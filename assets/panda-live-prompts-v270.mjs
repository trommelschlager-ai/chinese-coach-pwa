// A small, reviewed question bank. Missing audio stays explicitly text-only.
import {promptFor} from './panda-nonstop-v267.mjs?v=270';
import {prepareConversation} from './panda-live-conversation-v266.mjs?v=270';
const relatives=[['弟弟','dìdi','младший брат'],['姐姐','jiějie','старшая сестра'],['妹妹','mèimei','младшая сестра']];
export function choosePracticePrompt(conversations,allowed,recent=[],date=new Date(),preferred=null){
 const pool=[];
 for(const id of allowed){
  const main=promptFor(conversations,id,date);if(main)pool.push({...main,context:id===5?'Учебная сценка: сегодня 5 марта. Это не дата на телефоне.':main.context});
  const c=conversations.find(c=>c.id===id);if(!c)continue;
  const prepared=prepareConversation(c,date);
  if(id===1&&main)pool.push({...main,hanzi:'你呢？',pinyin:'Nǐ ne?',ru:'А у тебя?',audioKey:null});
  for(const line of prepared.lines.slice(2))pool.push({...line,hanzi:line.panda,lesson:id,lessonName:c.theme,verifiedLines:[c.lines[0],line],context:c.context||''});
  if(id===6)for(const [relative,py,ru] of relatives){
   const line={hanzi:`你有${relative}吗？`,pinyin:`Nǐ yǒu ${py} ma?`,ru:`У тебя есть ${ru}?`,audioKey:null,relative,lesson:6,lessonName:c.theme,
    instruction:`Вопрос про ${relative} (${ru}). Ответь 我有${relative} или 我没有${relative}.`,accepted:[`我有${relative}`,`我没有${relative}`],options:[]};
   pool.push({...line,verifiedLines:[c.lines[0],line]});
  }
 }
 // Least recently asked, preferring the selected chapter on the first question.
 const candidates=preferred?pool.filter(x=>x.lesson===preferred):pool;
 const unseen=candidates.find(x=>!recent.includes(x.hanzi));
 const line=unseen||[...candidates].sort((a,b)=>recent.lastIndexOf(a.hanzi)-recent.lastIndexOf(b.hanzi))[0];
 return line?{line}:null;
}
