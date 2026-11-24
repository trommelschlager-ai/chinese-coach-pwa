/* Panda Go HSK 1: optional listening and shape exercises.
 * Scores measure recognition of known examples, NOT recorded pronunciation.
 * Uses ONLY four existing lesson-1 MP3 files; no network, storage, or microphone.
 */
export const sampleTones=[
 {hanzi:'妈',pinyin:'mā',tone:1,src:'./assets/lesson1-xiaoxiao-v260/ma1.mp3',meaning:'мама'},
 {hanzi:'麻',pinyin:'má',tone:2,src:'./assets/lesson1-xiaoxiao-v260/ma2.mp3',meaning:'конопля / онемение'},
 {hanzi:'马',pinyin:'mǎ',tone:3,src:'./assets/lesson1-xiaoxiao-v260/ma3.mp3',meaning:'лошадь'},
 {hanzi:'骂',pinyin:'mà',tone:4,src:'./assets/lesson1-xiaoxiao-v260/ma4.mp3',meaning:'ругать'}
];
export const explanations=['ровный →','восходящий ↗','низкий / нисходяще-восходящий ↘↗','нисходящий ↘'];
export function shuffle(source,random=Math.random){
 const arr=[...source];
 for(let i=arr.length-1;i>0;i--){
  const j=Math.floor(Math.max(0,Math.min(.99999999,random()))*(i+1));
  [arr[i],arr[j]]=[arr[j],arr[i]];
 }
 return arr;
}
export function makeListeningRound(random=Math.random){
 const order=shuffle([0,1,2,3,0,1,2,3],random);
 // Avoid adjacent same tones where possible; balanced is still guaranteed.
 for(let i=1;i<order.length;i++){
  if(order[i]!==order[i-1])continue;
  const j=order.findIndex((v,k)=>k>i&&v!==order[i]&&(i+1>=order.length||order[i+1]!==v));
  if(j>i)[order[i],order[j]]=[order[j],order[i]];
 }
 return order;
}
export function checkAnswer(selected,expected){
 return Number.isInteger(selected)&&Number.isInteger(expected)&&selected===expected;
}
const $=id=>document.getElementById(id);
if(typeof document!=='undefined'&&$('hear-play')&&$('shape-prompt')){
 const hearing={order:[],index:0,score:0,answered:false,listened:false,playing:null};
 const shapes={order:[],index:0,score:0,answered:false};
 const hearButtons=[...document.querySelectorAll('[data-hear]')];
 const shapeButtons=[...document.querySelectorAll('[data-shape]')];
 const playAudio=async(index)=>{
  if(hearing.playing){try{hearing.playing.pause();hearing.playing.currentTime=0;}catch{}}
  const clip=new Audio(sampleTones[index].src);
  hearing.playing=clip;
  clip.onended=()=>{if(hearing.playing===clip)hearing.playing=null;};
  try{
   await clip.play();
   hearing.listened=true;
   if(!hearing.answered)$('hear-feedback').textContent='Теперь выбери номер услышанного тона.';
  }catch{
   $('hear-feedback').textContent='Звук не запустился. Нажми «Слушать слово» ещё раз.';
  }
 };
 const resetHearing=()=>{
  hearing.playing?.pause();hearing.playing=null;
  Object.assign(hearing,{order:makeListeningRound(),index:0,score:0,answered:false,listened:false});
  showHearing();
 };
 const showHearing=()=>{
  hearing.answered=false;hearing.listened=false;
  const finished=hearing.index>=hearing.order.length;
  $('hear-count').textContent=(finished?8:hearing.index)+' / 8';
  $('hear-progress').setAttribute('aria-valuenow',String(Math.min(8,hearing.index)));
  $('hear-progress-fill').style.width=(Math.min(8,hearing.index)/8*100)+'%';
  $('hear-play').disabled=finished;
  $('hear-next').disabled=true;
  $('hear-next').textContent='Следующий звук →';
  hearButtons.forEach(b=>{b.disabled=finished;b.classList.remove('correct','wrong');b.setAttribute('aria-pressed','false');});
  $('hear-feedback').textContent=finished
   ?'Тест завершён: '+hearing.score+' из 8. Это проверка слуха, не оценка произношения. Нажми «Начать заново», чтобы повторить.'
   :'Нажми «Слушать слово», затем выбери тон.';
 };
 const chooseHearing=(index)=>{
  if(hearing.answered||hearing.index>=8)return;
  if(!hearing.listened){$('hear-feedback').textContent='Сначала нажми «Слушать слово».';return;}
  hearing.answered=true;
  const expected=hearing.order[hearing.index],ok=checkAnswer(index,expected);
  if(ok)hearing.score++;
  hearButtons.forEach((b,i)=>{
   b.disabled=true;
   b.setAttribute('aria-pressed',String(i===index));
   if(i===expected)b.classList.add('correct');
   else if(i===index)b.classList.add('wrong');
  });
  const t=sampleTones[expected];
  $('hear-feedback').textContent=(ok?'Верно! ':'Пока нет. ')+'Это '+t.hanzi+' ('+t.pinyin+'), '+explanations[expected]+'. '+(hearing.index===7?'Нажми «Результат».':'Можно прослушать ещё раз.');
  $('hear-next').disabled=false;
  $('hear-next').textContent=hearing.index===7?'Показать результат →':'Следующий звук →';
 };
 $('hear-play').addEventListener('click',()=>{if(hearing.index<8)void playAudio(hearing.order[hearing.index]);});
 hearButtons.forEach(b=>b.addEventListener('click',()=>chooseHearing(Number(b.dataset.hear))));
 $('hear-next').addEventListener('click',()=>{
  if(!hearing.answered)return;
  hearing.playing?.pause();hearing.playing=null;
  hearing.index++;showHearing();
 });
 $('hear-restart').addEventListener('click',resetHearing);
 const resetShapes=()=>{Object.assign(shapes,{order:shuffle([0,1,2,3]),index:0,score:0,answered:false});showShape();};
 const showShape=()=>{
  shapes.answered=false;
  const finished=shapes.index>=4;
  $('shape-count').textContent=(finished?4:shapes.index)+' / 4';
  $('shape-prompt').textContent=finished?'✓':sampleTones[shapes.order[shapes.index]].pinyin;
  $('shape-next').disabled=true;
  $('shape-next').textContent='Следующий тон →';
  shapeButtons.forEach(b=>{b.disabled=finished;b.classList.remove('correct','wrong');b.setAttribute('aria-pressed','false');});
  $('shape-feedback').textContent=finished
   ?'Упражнение завершено: '+shapes.score+' из 4. Это знание тоновых обозначений, а не проверка речи.'
   :'Выбери подходящее направление.';
 };
 const chooseShape=index=>{
  if(shapes.answered||shapes.index>=4)return;
  shapes.answered=true;
  const expected=shapes.order[shapes.index],ok=checkAnswer(index,expected);
  if(ok)shapes.score++;
  shapeButtons.forEach((b,i)=>{
   b.disabled=true;
   b.setAttribute('aria-pressed',String(i===index));
   if(i===expected)b.classList.add('correct');
   else if(i===index)b.classList.add('wrong');
  });
  $('shape-feedback').textContent=(ok?'Верно! ':'Исправляем: ')+sampleTones[expected].pinyin+' — '+explanations[expected]+'. Третий тон в связной речи может быть просто низким.';
  $('shape-next').disabled=false;
  $('shape-next').textContent=shapes.index===3?'Показать результат →':'Следующий тон →';
 };
 shapeButtons.forEach(b=>b.addEventListener('click',()=>chooseShape(Number(b.dataset.shape))));
 $('shape-next').addEventListener('click',()=>{if(!shapes.answered)return;shapes.index++;showShape();});
 $('shape-restart').addEventListener('click',resetShapes);
 window.addEventListener('pagehide',()=>{hearing.playing?.pause();hearing.playing=null;});
 resetHearing();resetShapes();
}

/* Curated standard Mandarin examples, not an unrestricted sandhi parser.
 * Quiz checks knowledge of the usual pronunciation; never scores microphone. */
export const contextToneExamples=[
 {
  "zh": "你好",
  "written": "nǐ hǎo",
  "spoken": "ní hǎo",
  "target": 0,
  "answer": 2,
  "why": "В сочетании двух третьих тонов первый обычно становится восходящим."
 },
 {
  "zh": "很好",
  "written": "hěn hǎo",
  "spoken": "hén hǎo",
  "target": 0,
  "answer": 2,
  "why": "Перед третьим тоном третий обычно меняется на второй."
 },
 {
  "zh": "洗脸",
  "written": "xǐ liǎn",
  "spoken": "xí liǎn",
  "target": 0,
  "answer": 2,
  "why": "Первый из двух третьих тонов становится восходящим."
 },
 {
  "zh": "不是",
  "written": "bù shì",
  "spoken": "bú shì",
  "target": 0,
  "answer": 2,
  "why": "不 перед четвёртым тоном произносится вторым."
 },
 {
  "zh": "不喝",
  "written": "bù hē",
  "spoken": "bù hē",
  "target": 0,
  "answer": 4,
  "why": "Перед первым тоном 不 сохраняет четвёртый."
 },
 {
  "zh": "一天",
  "written": "yī tiān",
  "spoken": "yì tiān",
  "target": 0,
  "answer": 4,
  "why": "一 перед первым, вторым или третьим тоном обычно становится четвёртым."
 },
 {
  "zh": "一块",
  "written": "yī kuài",
  "spoken": "yí kuài",
  "target": 0,
  "answer": 2,
  "why": "一 перед четвёртым тоном обычно становится вторым."
 },
 {
  "zh": "妈妈",
  "written": "māma",
  "spoken": "māma",
  "target": 1,
  "answer": 0,
  "why": "Второе ma безударное, короткое, без фиксированной высоты; после первого тона обычно ниже."
 },
 {
  "zh": "早上",
  "written": "zǎoshang",
  "spoken": "zǎoshang",
  "target": 1,
  "answer": 0,
  "why": "上 в этом слове обычно нейтральный; после третьего тона нейтральный слог может звучать относительно высоко."
 },
 {
  "zh": "谢谢",
  "written": "xièxie",
  "spoken": "xièxie",
  "target": 1,
  "answer": 0,
  "why": "Второй слог обычно нейтральный, короткий; после четвёртого тона часто низкий."
 }
];
export function checkContextTone(index,answer){
 const item=contextToneExamples[index];
 return !!item&&Number.isInteger(answer)&&item.answer===answer;
}
if(typeof document!=='undefined'&&$('context-prompt')){
 let index=0,score=0,answered=false;
 const choices=[...document.querySelectorAll('[data-context-tone]')];
 function show(){
  answered=false;
  const item=contextToneExamples[index];
  $('context-count').textContent=index+' / '+contextToneExamples.length;
  $('context-next').disabled=true;
  choices.forEach(b=>{b.disabled=!item;b.classList.remove('correct','wrong');b.setAttribute('aria-pressed','false');});
  $('context-pinyin').textContent=item?item.written:'';
  $('context-prompt').replaceChildren();
  if(!item){
   $('context-prompt').textContent='✓';
   $('context-feedback').textContent='Результат: '+score+' из '+contextToneExamples.length+'. Это знание правил, не оценка голоса.';
   return;
  }
  [...item.zh].forEach((h,i)=>{
   const span=document.createElement('span');span.textContent=h;
   if(i===item.target){span.style.textDecoration='underline';span.style.color='#8a3da6';}
   $('context-prompt').append(span);
  });
  $('context-feedback').textContent='Какой тон обычно слышен у подчёркнутого слога?';
 }
 choices.forEach(b=>b.addEventListener('click',()=>{
  const item=contextToneExamples[index];
  if(answered||!item)return;
  answered=true;
  const answer=Number(b.dataset.contextTone),ok=checkContextTone(index,answer);
  if(ok)score++;
  document.dispatchEvent(new window.CustomEvent('panda-tone-rule-answer',{detail:{index,correct:ok}}));
  choices.forEach(btn=>{
   const n=Number(btn.dataset.contextTone);
   btn.disabled=true;btn.setAttribute('aria-pressed',String(n===answer));
   if(n===item.answer)btn.classList.add('correct');else if(n===answer)btn.classList.add('wrong');
  });
  $('context-feedback').textContent=(ok?'Верно! ':'Правильный вариант: ')+item.spoken+'. '+item.why;
  $('context-next').disabled=false;
 }));
 $('context-next').addEventListener('click',()=>{if(answered){index++;show();}});
 $('context-restart').addEventListener('click',()=>{index=0;score=0;show();});
 show();
}

/* Optional aggregate knowledge statistics. Never store speech, words or F0. */
if(typeof document!=='undefined'&&$('tone-stats-opt-in')){
 const key='panda-tone-rule-stats-v1';
 const groups=['3+3','不','一','轻声'];
 const groupOf=i=>i<3?0:i<5?1:i<7?2:3;
 const empty=()=>groups.map(()=>({total:0,wrong:0}));
 let enabled=false,stats=empty();
 try{
  const raw=JSON.parse(window.localStorage.getItem(key)||'null');
  if(raw?.enabled===true&&Array.isArray(raw.stats)&&raw.stats.length===4&&raw.stats.every(v=>Number.isSafeInteger(v.total)&&Number.isSafeInteger(v.wrong)&&v.wrong>=0&&v.total>=v.wrong)){enabled=true;stats=raw.stats;}
 }catch{}
 $('tone-stats-opt-in').checked=enabled;
 function draw(){
  $('tone-stats-result').replaceChildren();
  if(!enabled){$('tone-stats-result').textContent='Статистика выключена.';return}
  groups.forEach((label,i)=>{
   const p=document.createElement('p');const s=stats[i];p.textContent=label+': ошибок '+s.wrong+' из '+s.total+' ответов';$('tone-stats-result').append(p);
  });
 }
 function persist(){try{if(enabled)window.localStorage.setItem(key,JSON.stringify({enabled:true,stats}));else window.localStorage.removeItem(key)}catch{$('tone-stats-result').append(' Хранилище недоступно.');}}
 $('tone-stats-opt-in').onchange=()=>{enabled=$('tone-stats-opt-in').checked;if(!enabled)stats=empty();draw();persist()};
 $('tone-stats-clear').onclick=()=>{enabled=false;stats=empty();$('tone-stats-opt-in').checked=false;draw();persist()};
 document.addEventListener('panda-tone-rule-answer',e=>{
  const {index,correct}=e.detail||{};
  if(!enabled||!Number.isInteger(index)||index<0||index>=contextToneExamples.length||typeof correct!=='boolean')return;
  const s=stats[groupOf(index)];
  if(s.total<Number.MAX_SAFE_INTEGER){s.total++;if(!correct)s.wrong++;}
  draw();persist();
 });
 draw();
}
