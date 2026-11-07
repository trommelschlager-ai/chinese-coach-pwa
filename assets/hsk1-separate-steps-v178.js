/* Panda Go v178: separate working lesson screens.
   The approved HSK home, map and scenic seven-step staircase stay untouched.
   Uses existing v152 lesson renderers and saved progress without duplicate data. */
(() => {
 'use strict';
 const shell=document.getElementById('hsk1-app');
 const steps=document.getElementById('lesson-steps');
 const study=document.getElementById('lesson-study');
 const title=document.getElementById('stage-title');
 const text=document.getElementById('lesson-count');
 const content=document.getElementById('stage-content');
 const next=document.getElementById('lesson-next');
 const back=document.getElementById('lesson-prev');
 if(!shell||!study||!steps||!title||!text||!content)return;
 const lesson=Number(new URLSearchParams(location.search).get('lesson'))||1;
 const header=document.createElement('header');
 header.className='pg-stage-head';
 header.innerHTML='<button type="button" class="pg-stage-back" id="pg-stage-back" aria-label="К лестнице из семи шагов">‹</button>'+
  '<div class="pg-stage-heading"><small id="pg-stage-count">Урок '+lesson+' · Шаг 1 из 7</small><strong id="pg-stage-name">Новые слова</strong></div>'+
  '<a class="pg-stage-home" href="./hsk1-map.html" aria-label="К карте HSK 1">⌂</a>';
 const hint=document.createElement('p');
 hint.className='pg-stage-hint';
 hint.id='pg-stage-hint';
 hint.setAttribute('role','note');
 study.prepend(hint);
 study.prepend(header);
 const instructions=[
  'Сначала прослушай новые слова. Перелистывай группы кнопкой «Следующие слова».',
  'Послушай четыре тона и выполни четыре задания на слух.',
  'Разбери примеры и прослушай произношение перед следующим шагом.',
  'Нажми ▶, послушай разговор и повтори реплики вслух.',
  'Выбери слова в правильном порядке и нажми «Проверить».',
  'Прослушай образец, запиши себя и сравни. Автоматической оценки тонов пока нет.',
  'Ответь на итоговый вопрос. После завершения откроется карта HSK 1.'
 ];
 function activeIndex(){
  const m=(text.textContent||'').match(/Шаг\s+(\d+)/);
  return m?Math.max(0,Math.min(6,Number(m[1])-1)):0;
 }
 function refresh(){
  const i=activeIndex();
  document.body.dataset.pgStep=String(i+1);
  const count='Урок '+lesson+' · Шаг '+(i+1)+' из 7';
  const label=title.textContent||'Материалы урока';
  const n=document.getElementById('pg-stage-name'),c=document.getElementById('pg-stage-count');
  if(n.textContent!==label)n.textContent=label;
  if(c.textContent!==count)c.textContent=count;
  let instruction=instructions[i];
  if(i===0&&next.disabled){
   if(content.querySelector('[data-word-next]'))instruction='Для перехода к тонам сначала открой все группы слов. Нажми «Следующие слова».';
  }
  if(i===1&&next.disabled)instruction+=' Кнопка «Дальше» откроется после правильных ответов.';
  if(i===4&&next.disabled)instruction+=' Кнопка «Дальше» откроется после трёх собранных фраз.';
  if(i===5&&next.disabled)instruction+=' Затем нажми «Я повторил и сверил произношение».';
  if(i===6&&next.disabled)instruction+=' После правильного ответа станет доступно завершение.';
  if(hint.textContent!==instruction)hint.textContent=instruction;
 }
 function open(push=true){
  if(push&&location.hash!=='#step')history.pushState({pandaStage:true},'',location.pathname+location.search+'#step');
  document.body.classList.add('pg-study-open');
  refresh();
  window.scrollTo({top:0,left:0,behavior:'instant'});
  const n=document.getElementById('pg-stage-name');
  if(n&&typeof n.focus==='function'){n.tabIndex=-1;n.focus({preventScroll:true})}
 }
 function close(){
  document.body.classList.remove('pg-study-open');
  window.scrollTo({top:0,left:0,behavior:'instant'});
 }
 steps.addEventListener('click',event=>{
  const button=event.target.closest('button[data-step]');
  if(!button||button.disabled)return;
  open();
 });
 next.addEventListener('click',()=>{if(document.body.classList.contains('pg-study-open')){refresh();window.scrollTo({top:0,behavior:'instant'})}});
 back.addEventListener('click',()=>{if(document.body.classList.contains('pg-study-open')){refresh();window.scrollTo({top:0,behavior:'instant'})}});
 document.getElementById('pg-stage-back').addEventListener('click',()=>{
  if(location.hash==='#step'&&history.state?.pandaStage)history.back();else close();
 });
 window.addEventListener('popstate',()=>{
  if(location.hash==='#step')open(false);else close();
 });
 const observer=new MutationObserver(refresh);
 observer.observe(title,{childList:true,characterData:true,subtree:true});
 observer.observe(text,{childList:true,characterData:true,subtree:true});
 observer.observe(content,{childList:true,subtree:false});
 observer.observe(next,{attributes:true,attributeFilter:['disabled']});
 if(location.hash==='#step')open(false);else close();
 refresh();
})();
