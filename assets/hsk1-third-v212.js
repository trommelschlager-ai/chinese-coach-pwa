/* Panda Go HSK1 Lesson 3 v212 — numbers and composition.
   Independent 10-screen lesson; preserves all older lesson progress.
   Human voice: existing licensed Yue Tan numbers 1-10. Multi-digit examples are
   sequential assemblies of the SAME human speaker, labeled as such.
*/
(()=>{
'use strict';
const area=document.getElementById('pg3-stage'),
 title=document.getElementById('pg3-title'),subtitle=document.getElementById('pg3-subtitle'),
 counter=document.getElementById('pg3-count'),bar=document.getElementById('pg3-progress'),
 fill=document.getElementById('pg3-progress-fill'),prev=document.getElementById('pg3-prev'),
 next=document.getElementById('pg3-next'),scroll=document.getElementById('pg3-scroll'),
 notice=document.getElementById('pg3-notice');
if(!area||!prev||!next)return;
const KEY='pg-hsk1-v212-numbers',DONE_KEY='pg-hsk1-v3-complete',TOTAL=10;
const entries=[
 ['一','yī','один'],['二','èr','два'],['三','sān','три'],
 ['四','sì','четыре'],['五','wǔ','пять'],['六','liù','шесть'],
 ['七','qī','семь'],['八','bā','восемь'],['九','jiǔ','девять'],
 ['十','shí','десять']
];
const byHanzi=Object.fromEntries(entries.map(x=>[x[0],x]));
const formulas={
 '十一':['十','一'],'十二':['十','二'],
 '二十':['二','十'],'二十三':['二','十','三']
};
const structures={
 '十一':['shí yī','одиннадцать'],'十二':['shí èr','двенадцать'],
 '二十':['èr shí','двадцать'],'二十三':['èr shí sān','двадцать три']
};
const listening=[
 {sound:'二',answer:'二',choices:['一','二','三']},
 {sound:'三',answer:'三',choices:['三','一','二']},
 {sound:'一',answer:'一',choices:['二','三','一']}
];
const review=[
 {sound:'九',answer:'九',choices:['六','九','七']},
 {sound:'四',answer:'四',choices:['十','四','七']},
 {sound:'十二',answer:'十二',choices:['十一','二十','十二']},
 {sound:'二十三',answer:'二十三',choices:['二十','二十三','十三']}
];
const defaults=()=>({
 step:0,maxStep:0,completed:false,
 viewed:{1:[],2:[]},highlight:{1:'一',2:'六'},
 quiz:{4:0,8:0},tries:{},score:0,heard:false,
 written:[],writeChar:'一',build:[],buildDone:false
});
let state=defaults();
try{
 const old=JSON.parse(localStorage.getItem(KEY)||'null');
 if(old&&typeof old==='object'){
  state.step=Number.isInteger(old.step)?Math.min(TOTAL-1,Math.max(0,old.step)):0;
  state.maxStep=Number.isInteger(old.maxStep)?Math.min(TOTAL-1,Math.max(0,old.maxStep)):0;
  state.completed=old.completed===true;
  for(const n of [1,2]){
   if(Array.isArray(old.viewed?.[n]))state.viewed[n]=old.viewed[n].filter(x=>byHanzi[x]);
   if(byHanzi[old.highlight?.[n]])state.highlight[n]=old.highlight[n];
  }
  for(const n of [4,8])if(Number.isInteger(old.quiz?.[n]))state.quiz[n]=Math.max(0,Math.min((n===4?listening:review).length,old.quiz[n]));
  if(old.tries&&typeof old.tries==='object')state.tries=old.tries;
  state.score=Number.isInteger(old.score)?Math.max(0,Math.min(review.length,old.score)):0;
  state.written=Array.isArray(old.written)?old.written.filter(x=>['一','二','三'].includes(x)):[];
  if(['一','二','三'].includes(old.writeChar))state.writeChar=old.writeChar;
  state.build=Array.isArray(old.build)?old.build.filter(x=>['二','十','三'].includes(x)).slice(0,3):[];
  state.buildDone=old.buildDone===true;
 }
}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sound=null,sequenceId=0,writer=null,writerGeneration=0;
function stopSound(){
 sequenceId++;
 if(sound){sound.onended=null;sound.onerror=null;try{sound.pause()}catch{}sound=null}
}
function stopWriter(){
 writerGeneration++;
 if(writer){try{writer.cancelQuiz?.()}catch{}try{writer.pauseAnimation?.()}catch{}}
 writer=null;
}
const speaker=()=>window.PANDA_HSK1_NATIVE_HUMAN_V167||{};
const voiceFile=(word)=>speaker()[word]||null;
function playNumber(word){
 stopSound();
 const playItems=formulas[word]||[word],generation=sequenceId;
 let k=0;
 const playNext=()=>{
  if(generation!==sequenceId)return;
  if(k>=playItems.length){sound=null;return}
  const item=playItems[k++],file=voiceFile(item);
  if(!file){inform('Для этого числа пока нет проверенной записи.');return}
  try{
   const audio=new Audio(file);sound=audio;audio.preload='auto';audio.preservesPitch=true;
   audio.playbackRate=.97;
   audio.onended=()=>{
    if(generation!==sequenceId||sound!==audio)return;
    sound=null;
    if(k<playItems.length){
     // A short transition; not a claim that the assembled phrase was recorded fluently.
     playNext();
    }
   };
   audio.onerror=()=>inform('Аудио не загрузилось. Проверь соединение.');
   const promise=audio.play();
   if(promise&&typeof promise.catch==='function')promise.catch(()=>inform('Нажми «Слушать» ещё раз.'));
  }catch{inform('Не удалось воспроизвести запись.')}
 };
 playNext();
}
function inform(text){notice.textContent=text;notice.hidden=!text}
function audioButton(word,label='▶ Слушать'){
 const available=(formulas[word]||[word]).every(item=>!!voiceFile(item));
 return '<button type="button" class="pg3-audio" data-play="'+e(word)+'"'+(available?'':' disabled')+'>'+e(label)+'</button>';
}
const numbersCard=(row)=>'<div class="pg3-intro-num"><strong lang="zh-Hans">'+row[0]+'</strong><span>'+row[1]+'</span><small>'+row[2]+'</small></div>';
const chapterText=[
 ['Урок 3 · числа','Числа и их строение','Изучим числа и научимся составлять 11, 12, 20 и 23'],
 ['Урок 3 · числа','Новое число','Нажми карточку, послушай и запомни числа от 1 до 5'],
 ['Урок 3 · числа','Числа от 6 до 10','Слушай, сравнивай тоны и запоминай'],
 ['Урок 3 · письмо','Напиши иероглиф','Показываем черты — затем повторяешь пальцем'],
 ['Урок 3 · практика','Тренировка слуха','Что ты услышал? Выбери правильный вариант'],
 ['Урок 3 · строение','Числа 11 и 12','После десяти прибавляем нужное число'],
 ['Урок 3 · строение','Как получить 20?','Два десятка — это 二十'],
 ['Урок 3 · практика','Собери число','Из трёх иероглифов составь число 23'],
 ['Урок 3 · практика','Проверим знания','Четыре вопроса на слух и построение чисел'],
 ['Урок 3 · отлично!','Числа освоены!','Теперь ты умеешь считать и составлять числа']
];
function intro(){
 return '<div class="pg3-hero"><img src="./assets/panda-explorer-v174.svg" alt="Панда в соломенной шляпе и красной одежде">'+
 '<div class="pg3-hero-text"><strong class="pg3-hero-title">Урок 3</strong>'+
 '<strong>Числа и их строение</strong><span>Учимся считать по-китайски вместе с пандой</span></div></div>'+
 '<div class="pg3-card"><div class="pg3-intro-numbers">'+entries.slice(0,5).map(numbersCard).join('')+'</div></div>'+
 '<div class="pg3-card pg3-lesson-goals"><h3>В этом уроке ты:</h3>'+
 '<p><span class="pg3-goal-icon">🀄</span>Выучишь числа от 1 до 10 и их тоны</p>'+
 '<p><span class="pg3-goal-icon">✍️</span>Попробуешь написать 一, 二, 三</p>'+
 '<p><span class="pg3-goal-icon">🎯</span>Соберёшь числа 11, 12, 20 и 23</p></div>';
}
function numbersScreen(step){
 const list=step===1?entries.slice(0,5):entries.slice(5);
 const chosen=state.highlight[step];
 const info=byHanzi[chosen];
 const count=list.filter(x=>state.viewed[step].includes(x[0])).length;
 return '<div class="pg3-card"><h2>🔴 Слушай и запоминай</h2>'+
 '<p class="pg3-muted">Открой каждую карточку — в уроке одна женская запись носительницы для всех десяти чисел. Изучено '+count+' из 5.</p>'+
 '<div class="pg3-numbers-grid">'+list.map(row=>
 '<button type="button" data-number="'+row[0]+'" class="'+(row[0]===chosen?'selected ':'')+(state.viewed[step].includes(row[0])?'visited':'')+'">'+
 '<strong lang="zh-Hans">'+row[0]+'</strong><span class="pin">'+row[1]+'</span><small>'+row[2]+'</small></button>').join('')+'</div>'+
 '<div class="pg3-current-number"><strong lang="zh-Hans">'+info[0]+'</strong><div><span>'+info[1]+'</span><br><small>'+info[2]+'</small></div>'+
 audioButton(chosen,'▶ Слушать')+'</div></div>'+
 (step===1?'<div class="pg3-card"><div class="pg3-example"><span class="apple" aria-label="яблоко">🍎</span>'+
 '<div class="txt"><strong>一个苹果</strong><span>yí ge píngguǒ</span><small>одно яблоко</small></div></div>'+
 '<p class="pg3-tip"><strong>Важно:</strong> отдельно 一 читается yī (1-й тон). Перед четвёртым тоном 个 (gè) в этом выражении оно звучит yí (2-й тон). Пример дополнительный, без отдельного аудио.</p></div>':
 '<div class="pg3-card"><p class="pg3-tip"><strong>Сравни:</strong> 四 sì — четвёртый тон (↘), 十 shí — второй тон (↗). Это разные слова, тренируй их на слух.</p></div>');
}
function writing(){
 return '<div class="pg3-card pg3-writing"><p class="pg3-muted pg3-center">Выбери иероглиф, затем смотри направление черт и попробуй написать его пальцем.</p>'+
 '<div class="pg3-char-buttons">'+['一','二','三'].map(x=>'<button type="button" data-char="'+x+'" class="'+(x===state.writeChar?'active':'')+'">'+x+'</button>').join('')+'</div>'+
 '<div class="pg3-writing-square"><div id="pg3-writer" aria-label="Пропись иероглифа '+state.writeChar+'"></div></div>'+
 '<div class="pg3-write-buttons"><button type="button" data-demo>▶ Показать черты</button><button type="button" data-write>✍️ Написать самому</button></div>'+
 '<p class="pg3-write-state" data-writing-status>'+(state.written.includes(state.writeChar)?'✓ Ты уже написал '+state.writeChar+' правильно.':'Напиши '+state.writeChar+'. Порядок черт важен.')+'</p>'+
 '<p class="pg3-muted pg3-center">Пропись необязательна для перехода дальше.</p></div>';
}
function question(step){
 const seq=step===4?listening:review,index=state.quiz[step];
 if(index>=seq.length)return '<div class="pg3-card"><h2 class="pg3-center">✓ Проверка завершена</h2><p class="pg3-muted pg3-center">Переходи к следующему экрану.</p></div>';
 const obj=seq[index],isHeard=state.heard,choices=obj.choices;
 return '<div class="pg3-card pg3-questions"><div class="pg3-question-count">Вопрос '+(index+1)+' из '+seq.length+'</div>'+
 '<h2>Что ты услышал?</h2>'+
 '<p class="pg3-muted pg3-center">Прослушай число и выбери правильный вариант.</p>'+
 audioButton(obj.sound,'🔊 Слушать число')+
 '<div class="pg3-answer-list">'+choices.map(x=>'<button class="pg3-answer" type="button" data-answer="'+x+'"'+(isHeard?'':' disabled')+'>'+
 '<i class="radio" aria-hidden="true"></i><strong lang="zh-Hans">'+x+'</strong><span>'+((byHanzi[x]||structures[x]||['',''])[0])+'</span></button>').join('')+'</div>'+
 '<p class="pg3-muted pg3-center">'+(isHeard?'Выбери один вариант ответа.':'Сначала нажми «Слушать число».')+'</p></div>';
}
function pair(){
 return '<div class="pg3-card"><p class="pg3-composition">10 = 十 (shí). Затем добавляем нужную единицу:</p>'+
 '<div class="pg3-number-pair">'+[
 ['十一','shí yī','одиннадцать'],['十二','shí èr','двенадцать']
 ].map(x=>'<div><strong lang="zh-Hans">'+x[0]+'</strong><div class="py">'+x[1]+'</div><small>'+x[2]+'</small>'+
 audioButton(x[0],'▶ Слушать')+'</div>').join('')+'</div>'+
 '<p class="pg3-tip">🧩 <strong>11 = 十 + 一</strong> · <strong>12 = 十 + 二</strong>.<br>Числа построены из частей, а не из новых неизвестных иероглифов. Озвучка составных чисел соединяет записи одного голоса.</p></div>';
}
function twenties(){
 return '<div class="pg3-card"><div class="pg3-composition"><div class="big" lang="zh-Hans">二十</div><div class="py">èr shí</div><div>двадцать</div></div>'+
 '<div class="pg3-center">'+audioButton('二十','🔊 Слушать 20')+'</div>'+
 '<p class="pg3-tip"><strong>二 (2) × 十 (10) = 二十 (20).</strong> Сначала указываем количество десятков. Чтобы назвать 23, добавим 三 (3).</p>'+
 '<img class="pg3-number-illustration" src="./assets/panda-explorer-v174.svg" alt="Панда подсказывает структуру числа"></div>'+
 '<div class="pg3-card pg3-center"><h3>Послушай ещё два числа</h3>'+audioButton('十一','11 · 十一')+' '+audioButton('十二','12 · 十二')+'</div>';
}
function build(){
 const result=state.build.join('');
 return '<div class="pg3-card pg3-build-target"><h2>Как строится число 23?</h2>'+
 (state.buildDone?'<div class="pg3-built-result" lang="zh-Hans">二十三</div><strong>èr shí sān — двадцать три</strong>':
 '<p class="pg3-muted">Нажми три плитки в правильном порядке</p>')+'</div>'+
 '<div class="pg3-card"><div class="pg3-slot-row">'+[0,1,2].map(i=>'<div class="pg3-slot '+(state.build[i]?'filled':'')+'">'+(state.build[i]||'')+'</div>').join('')+'</div>'+
 '<div class="pg3-tile-row">'+['三','二','十'].map(x=>'<button type="button" data-tile="'+x+'" class="pg3-tile"'+(state.build.includes(x)||state.buildDone?' disabled':'')+'>'+x+'</button>').join('')+'</div>'+
 '<div class="pg3-build-controls"><button type="button" data-clear'+(state.buildDone?' disabled':'')+'>↺ Сбросить</button>'+
 '<button type="button" class="pg3-check" data-check'+(result.length!==3||state.buildDone?' disabled':'')+'>Проверить ✓</button></div>'+
 (state.buildDone?'<p class="pg3-center">✓ Отлично! 二 (2) + 十 (10) + 三 (3) = 23.</p><div class="pg3-center">'+audioButton('二十三','▶ Слушать число')+'</div>':
 '<p class="pg3-tip">💡 <strong>Подсказка:</strong> сначала два десятка (二十), затем добавляем 三.</p>')+'</div>';
}
function finalScreen(){
 return '<div class="pg3-card pg3-center">'+
 '<img src="./assets/panda-explorer-v174.svg" alt="Панда поздравляет с завершением урока" style="max-height:135px;max-width:145px">'+
 '<h2 class="pg3-finish-head">🎉 Урок 3 завершён!</h2>'+
 '<p class="pg3-finish-score">С первой попытки: '+state.score+' из '+review.length+'</p>'+
 '<p class="pg3-muted">Ты выучил числа 1–10 и научился составлять 11, 12, 20 и 23. Закрепи произношение с помощью кнопок ниже.</p>'+
 '<div class="pg3-review-list">'+entries.map(x=>'<button type="button" data-play="'+x[0]+'" aria-label="Слушать '+x[2]+'">'+
 '<strong lang="zh-Hans">'+x[0]+'</strong><span>'+x[1]+'</span></button>').join('')+'</div>'+
 '<div class="pg3-finish-links"><a class="primary" href="./hsk1-lesson.html?lesson=4">Следующий урок →</a>'+
 '<a href="./hsk1-map.html">К карте HSK1</a><button type="button" data-restart>↻ Повторить урок 3</button></div></div>';
}
const screens=[intro,()=>numbersScreen(1),()=>numbersScreen(2),writing,()=>question(4),pair,twenties,build,()=>question(8),finalScreen];
function isReady(step){
 if(step===1||step===2)return state.viewed[step].length>=5;
 if(step===4||step===8)return state.quiz[step]>=(step===4?listening:review).length;
 if(step===7)return state.buildDone;
 return true;
}
function markComplete(){
 state.completed=true;
 try{
  const list=JSON.parse(localStorage.getItem(DONE_KEY)||'[]');
  const merged=Array.isArray(list)?list:[];
  if(!merged.includes('numbers'))merged.push('numbers');
  localStorage.setItem(DONE_KEY,JSON.stringify(merged));
 }catch{}
 save();
}
function render(){
 stopSound();stopWriter();
 const step=state.step,info=chapterText[step];
 if(step===9&&!state.completed)markComplete();
 state.maxStep=Math.max(state.maxStep,step);
 document.querySelector('#pg3-label').textContent=info[0];
 title.textContent=info[1];subtitle.textContent=info[2];
 counter.textContent=(step+1)+' из '+TOTAL;
 fill.style.width=((step+1)/TOTAL*100)+'%';
 bar.setAttribute('aria-valuenow',String(step+1));
 area.innerHTML=screens[step]();
 inform('');
 prev.disabled=step===0;
 next.hidden=step===9;
 next.disabled=step===9||!isReady(step);
 next.textContent=step===0?'▶ Начать урок →':step===8?'Завершить урок →':'Дальше →';
 if(step===3)initWriting();
 save();
 scroll.scrollTop=0;
}
function forward(){
 if(!isReady(state.step)){inform('Сначала выполни задание на этом экране.');return}
 if(state.step<9){state.step++;state.heard=false;render()}
}
function backward(){
 if(state.step>0){state.step--;state.heard=false;render()}
}
function initWriting(){
 const node=document.getElementById('pg3-writer');
 if(!node||!window.HanziWriter)return;
 const current=state.writeChar,generation=++writerGeneration;
 try{
  writer=HanziWriter.create('pg3-writer',current,{
   width:Math.max(150,Math.min(234,node.clientWidth||210)),
   height:Math.max(150,Math.min(234,node.clientWidth||210)),
   padding:7,showCharacter:false,showOutline:true,
   strokeColor:'#a60d16',radicalColor:'#a60d16',
   outlineColor:'#e8cb9e',drawingColor:'#cb1b1e',highlightColor:'#e59b32',
   showHintAfterMisses:3,strokeAnimationSpeed:1.05,delayBetweenStrokes:430,
   acceptBackwardsStrokes:false,
   charDataLoader:(character,onComplete,onError)=>{
    if(!['一','二','三'].includes(character)){onError(new Error('No character data'));return}
    fetch('./assets/hanzi-data/'+encodeURIComponent(character)+'.json')
      .then(r=>{if(!r.ok)throw new Error('No stroke data');return r.json()})
      .then(data=>{if(generation===writerGeneration)onComplete(data)})
      .catch(error=>{if(generation===writerGeneration)onError(error)})
   }
  });
 }catch{inform('Пропись временно недоступна. Можно продолжить урок.')}
}
function writingStatus(message){
 const node=area.querySelector('[data-writing-status]');
 if(node)node.textContent=message;
}
function quizAnswer(word){
 const step=state.step,seq=step===4?listening:review,i=state.quiz[step],q=seq[i];
 if(!q||!state.heard)return;
 if(word!==q.answer){
  const key=step+'-'+i;
  state.tries[key]=(state.tries[key]||0)+1;
  inform('Пока неверно. Послушай ещё раз и сравни иероглифы.');
  save();return;
 }
 if(step===8&&!state.tries[step+'-'+i])state.score++;
 state.quiz[step]=i+1;state.heard=false;
 if(state.quiz[step]>=seq.length&&step!==8){state.step++;render();return}
 if(step===8&&state.quiz[8]>=seq.length){state.step=9;render();return}
 render();
}
function selectNumber(hz){
 const step=state.step,list=step===1?entries.slice(0,5):entries.slice(5);
 if(!list.some(x=>x[0]===hz))return;
 state.highlight[step]=hz;
 if(!state.viewed[step].includes(hz))state.viewed[step].push(hz);
 render();
 playNumber(hz);
}
area.addEventListener('click',ev=>{
 const btn=ev.target.closest('button');if(!btn||btn.disabled)return;
 if(btn.hasAttribute('data-number')){selectNumber(btn.dataset.number);return}
 if(btn.hasAttribute('data-play')){
  const word=btn.dataset.play;
  if((state.step===4||state.step===8)&&word===(state.step===4?listening:review)[state.quiz[state.step]]?.sound){
   state.heard=true;render();playNumber(word);return;
  }
  playNumber(word);return;
 }
 if(btn.hasAttribute('data-answer')){quizAnswer(btn.dataset.answer);return}
 if(btn.hasAttribute('data-char')){
  if(['一','二','三'].includes(btn.dataset.char)){state.writeChar=btn.dataset.char;render()}return;
 }
 if(btn.hasAttribute('data-demo')){
  if(!writer){inform('Пропись недоступна, проверь подключение.');return}
  try{writer.cancelQuiz?.();writingStatus('Смотри на порядок черт.');writer.animateCharacter()}catch{inform('Анимация не запустилась.')}
  return;
 }
 if(btn.hasAttribute('data-write')){
  if(!writer){inform('Пропись недоступна.');return}
  const selected=state.writeChar,generation=writerGeneration;
  try{
   writer.cancelQuiz?.();
   writer.quiz({
    onCorrectStroke:info=>{if(generation===writerGeneration)writingStatus('Верно! Осталось '+info.strokesRemaining+' черт.')},
    onComplete:()=>{
     if(generation!==writerGeneration)return;
     if(!state.written.includes(selected))state.written.push(selected);
     save();writingStatus('✓ Написано правильно! Можно выбрать следующий иероглиф.');
    }
   });
  }catch{inform('Не удалось включить тренировку.')}
  return;
 }
 if(btn.hasAttribute('data-tile')){
  if(state.step===7&&!state.build.includes(btn.dataset.tile)&&state.build.length<3){state.build.push(btn.dataset.tile);render()}
  return;
 }
 if(btn.hasAttribute('data-clear')){
  state.build=[];render();return;
 }
 if(btn.hasAttribute('data-check')){
  if(state.build.join('')==='二十三'){state.buildDone=true;inform('✓ Правильно! 二十三 — 23.');render()}
  else{state.build=[];render();inform('Попробуй снова: сначала 二十 (20), затем 三 (3).')}
  return;
 }
 if(btn.hasAttribute('data-restart')){
  state=defaults();render();return;
 }
});
prev.addEventListener('click',backward);
next.addEventListener('click',forward);
window.addEventListener('pagehide',()=>{stopSound();stopWriter()});
render();
})();