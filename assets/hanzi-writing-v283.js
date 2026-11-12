/* Panda Go unified handwriting studio v283 — real Hanzi Writer stroke-order quiz.
 * Does not alter lesson completion, audio, or speaking progress.
 */
(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const tabs=byId('writing-tabs'),strip=byId('writing-characters'),canvas=byId('writing-canvas');
if(!tabs||!strip||!canvas)return;
const fallbackPages=[
 'hsk1-first-v189.html','hsk1-second-v203.html','hsk1-third-v212.html',
 'hsk1-fourth-v214.html','hsk1-fifth-v227.html','hsk1-family-v231.html','hsk1-weather-v231.html'
];
const KEY='pg-hanzi-writing-v283';
const fromParam=Number(new URLSearchParams(location.search).get('lesson'));
const entryLesson=Number.isInteger(fromParam)&&fromParam>=1&&fromParam<=7?fromParam:1;
let currentLesson=entryLesson,index=0,writer=null,generation=0,lessons=[],completed={};
try{
 const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(saved&&typeof saved==='object'&&!Array.isArray(saved))completed=saved;
}catch{}
byId('writing-back').href='./'+fallbackPages[entryLesson-1];
function status(message,kind=''){
 const box=byId('writing-status');box.textContent=message;
 box.className='writing-status'+(kind?' '+kind:'');
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(completed))}catch{}}
function active(){return lessons[currentLesson-1]?.characters[index]}
function makeButton(label,cls,attr,value){
 const btn=document.createElement('button');btn.type='button';btn.className=cls;btn.textContent=label;
 btn.setAttribute(attr,String(value));return btn;
}
function counts(lesson){
 const a=lesson.characters;
 return a.reduce((n,x)=>n+(completed[lesson.id+':'+x[0]]===true?1:0),0);
}
function tabsRender(){
 tabs.replaceChildren();
 for(const lesson of lessons){
  const btn=makeButton('Урок '+lesson.id,'writing-tab','data-lesson',lesson.id);
  btn.setAttribute('role','tab');btn.setAttribute('aria-selected',lesson.id===currentLesson?'true':'false');
  btn.setAttribute('aria-label','Урок '+lesson.id+' — '+lesson.title);
  tabs.append(btn);
 }
}
function chipsRender(){
 strip.replaceChildren();
 const lesson=lessons[currentLesson-1];
 for(let i=0;i<lesson.characters.length;i++){
  const ch=lesson.characters[i][0];
  const btn=makeButton(ch,'writing-char-btn','data-character-index',i);
  if(completed[lesson.id+':'+ch]===true)btn.classList.add('done');
  btn.setAttribute('aria-selected',i===index?'true':'false');
  btn.setAttribute('aria-label',ch+(completed[lesson.id+':'+ch]?' — написан правильно':' — тренировка письма'));
  strip.append(btn);
 }
 byId('writing-lesson-name').textContent='Урок '+lesson.id+' · '+lesson.title;
 byId('writing-lesson-count').textContent='Освоено '+counts(lesson)+' из '+lesson.characters.length;
 const total=lessons.reduce((n,l)=>n+l.characters.length,0);
 const done=lessons.reduce((n,l)=>n+counts(l),0);
 byId('writing-progress').textContent=done+' / '+total;
}
function clearWriter(){
 generation++;
 try{writer?.cancelQuiz?.();writer?.pauseAnimation?.()}catch{}
 writer=null;
 canvas.replaceChildren();
}
function setupWriter(){
 const item=active();if(!item)return;
 const [hanzi,py,meaning]=item;
 clearWriter();const token=generation;
 byId('writing-selected-hanzi').textContent=hanzi;
 byId('writing-pinyin').textContent=py;
 byId('writing-meaning').textContent=meaning;
 byId('writing-strokes').textContent='';
 const isDone=completed[currentLesson+':'+hanzi]===true;
 status(isDone?'✓ Уже написан. Можешь повторить.':'Нажми «Показать черты», затем «Писать».',isDone?'success':'');
 if(!window.HanziWriter){status('Библиотека письма не загрузилась. Обнови страницу.','error');return}
 const width=Math.max(160,Math.min(268,Math.round(canvas.getBoundingClientRect().width||240)));
 try{
  writer=window.HanziWriter.create('writing-canvas',hanzi,{
   width,height:width,padding:15,
   showOutline:true,showCharacter:false,strokeColor:'#7336ad',drawingColor:'#a350d0',
   outlineColor:'#e3cce9',highlightColor:'#e6a2d1',
   showHintAfterMisses:2,acceptBackwardsStrokes:false,
   strokeAnimationSpeed:1,delayBetweenStrokes:300,
   charDataLoader:(ch,onComplete,onError)=>{
    fetch('./assets/hanzi-data/'+encodeURIComponent(ch)+'.json')
     .then(r=>{if(!r.ok)throw Error('missing stroke data '+ch);return r.json()})
     .then(data=>{
      if(token!==generation)return;
      byId('writing-strokes').textContent=data.strokes?.length+' черт';
      onComplete(data);
     })
     .catch(e=>{if(token===generation){status('Не удалось загрузить черты. Проверь соединение и обнови страницу.','error');onError?.(e)}});
   }
  });
 }catch{status('Не удалось запустить письмо на этом устройстве.','error')}
}
function selectCharacter(i){
 if(!lessons.length)return;
 const max=lessons[currentLesson-1].characters.length;
 index=Math.max(0,Math.min(i,max-1));
 chipsRender();setupWriter();
}
function selectLesson(n){
 if(!Number.isInteger(n)||n<1||n>lessons.length)return;
 currentLesson=n;index=0;
 try{history.replaceState(null,'','?lesson='+n)}catch{}
 tabsRender();selectCharacter(0);
}
function demo(){
 if(!writer){status('Сначала выбери иероглиф.','error');return}
 const token=generation;status('Смотри порядок и направление черт.');
 try{
  writer.cancelQuiz?.();
  Promise.resolve(writer.animateCharacter()).then(()=>{
   if(token===generation)status('Теперь нажми «Писать» и повтори иероглиф пальцем.');
  }).catch(()=>{if(token===generation)status('Анимация недоступна.','error')});
 }catch{status('Анимация недоступна.','error')}
}
function write(){
 if(!writer){status('Пропись ещё не загрузилась.','error');return}
 const token=generation,ch=active()[0],lesson=currentLesson;
 let mistakes=0;
 status('Веди пальцем по чертам в правильном порядке.');
 try{
  writer.cancelQuiz?.();
  writer.quiz({
   onCorrectStroke:info=>{
    if(token!==generation)return;
    const left=Number(info?.strokesRemaining);
    status(Number.isFinite(left)&&left>0?'Верно! Осталось черт: '+left:'Хорошо! Продолжай.');
   },
   onMistake:()=>{
    if(token!==generation)return;
    mistakes++;
    status(mistakes>=2?'Проверь направление черты: появится подсказка.':'Почти! Попробуй провести черту ещё раз.');
   },
   onComplete:()=>{
    if(token!==generation)return;
    completed[lesson+':'+ch]=true;persist();
    chipsRender();
    status('✓ '+ch+' написан правильно! Можешь выбрать следующий.','success');
   }
  });
 }catch{status('Не удалось запустить проверку черт.','error')}
}
tabs.addEventListener('click',e=>{
 const btn=e.target.closest('[data-lesson]');
 if(btn)selectLesson(Number(btn.dataset.lesson));
});
strip.addEventListener('click',e=>{
 const btn=e.target.closest('[data-character-index]');
 if(btn)selectCharacter(Number(btn.dataset.characterIndex));
});
byId('writing-demo').addEventListener('click',demo);
byId('writing-write').addEventListener('click',write);
byId('writing-reset').addEventListener('click',()=>{setupWriter();status('Поле очищено. Начни заново.')});
byId('writing-next').addEventListener('click',()=>{
 if(!lessons.length)return;
 selectCharacter((index+1)%lessons[currentLesson-1].characters.length);
 strip.querySelector('[aria-selected="true"]')?.scrollIntoView?.({block:'nearest',inline:'center',behavior:'smooth'});
});
window.addEventListener('pagehide',clearWriter);
fetch('./assets/hanzi-writing-curriculum-v283.json')
 .then(r=>{if(!r.ok)throw Error('curriculum missing');return r.json()})
 .then(data=>{
  if(!Array.isArray(data.lessons)||data.lessons.length!==7)throw Error('invalid curriculum');
  lessons=data.lessons;
  selectLesson(entryLesson);
 })
 .catch(()=>status('Не удалось загрузить список иероглифов. Обнови страницу.','error'));
})();