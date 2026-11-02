(()=>{
 'use strict';
 const KEY='chinese-coach-daily-v98';
 const steps=[
  {title:'Тоны · 1 минута',hint:'Послушай четыре тона и повтори каждый по три раза.',route:'index.html?daily=1#tones'},
  {title:'Пять слов · 4 минуты',hint:'Открой «Местоимения и указатели». Послушай и повтори 我, 你, 他, 她, 我们.',route:'index.html?daily=1#topics/words'},
  {title:'Один иероглиф · 2 минуты',hint:'Посмотри порядок черт и напиши один иероглиф сам.',route:'hanzi-lab.html?daily=1#return-menu'},
  {title:'Короткий диалог · 3 минуты',hint:'Открой «Приветствия и знакомство». Послушай разговор и повтори реплики.',route:'index.html?daily=1#topics/dialogues'},
  {title:'Закрепление · 3 минуты',hint:'Проверь пять слов в карточках на память. Незнакомые слова отметь «Повторить позже».',route:'index.html?daily=1#topics/practice'}
 ];
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 function read(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return s&&s.day===today()&&Number.isInteger(s.step)&&s.step>=0&&s.step<=steps.length?s:null}catch{return null}}
 function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
 const bar=document.createElement('aside');bar.id='daily-study-progress';bar.setAttribute('aria-label','Занятие сегодня');document.getElementById('launch-menu')?.append(bar); // Keep daily-plan progress on the home menu, never above lessons or games.
 function navigate(s){
  const step=steps[s.step];if(!step){render();return}
  if(document.getElementById('launch-menu')){
   if(s.step===0)window.go('tones');
   else if(s.step===1)window.openLearningTopics('words');
   else if(s.step===3)window.openLearningTopics('dialogues');
   else if(s.step===4)window.openPracticeChoices();
   else location.assign('./'+step.route);
  }else location.assign('./'+step.route);
  render();
 }
 function render(){
  const s=read();bar.hidden=!s||s.paused===true;if(bar.hidden)return;
  if(s.step===steps.length){bar.innerHTML='<strong>✓ Занятие завершено. Повтори сложные слова завтра.</strong><button type="button" data-daily-close>Закрыть</button>'}
  else{const step=steps[s.step];bar.innerHTML='<div><strong>Шаг '+(s.step+1)+' из '+steps.length+' · '+step.title+'</strong><div>'+step.hint+'</div></div><button type="button" data-daily-next>Шаг выполнен →</button><button type="button" data-daily-close>Пауза</button>'}
  bar.querySelector('[data-daily-close]').onclick=()=>{s.paused=true;save(s);render()};
  const next=bar.querySelector('[data-daily-next]');if(next)next.onclick=()=>{s.step++;save(s);navigate(s)};
 }
 const settings=document.querySelector('#app-settings .settings-content');
 if(settings){
  const voices=document.createElement('details');voices.className='dialogue-voice-settings';
  voices.innerHTML='<summary>Вариант голосов в диалогах</summary><p>Выбор применяется к диалогам о стране, времени и кафе.</p><p data-dialogue-voice-caption></p><button type="button" data-dialogue-voice-toggle></button>';
  const update=()=>{const old=localStorage.getItem('chinese-coach-dialogue-original-v72')==='1';voices.querySelector('[data-dialogue-voice-caption]').textContent=old?'Xiaoxiao / Yunxi':'Xiaoxuan / Yunjian';voices.querySelector('button').textContent=old?'Включить новые голоса':'Сравнить со старыми'};
  voices.querySelector('button').onclick=()=>{const old=localStorage.getItem('chinese-coach-dialogue-original-v72')==='1';localStorage.setItem('chinese-coach-dialogue-original-v72',old?'0':'1');window.dispatchEvent(new Event('learning-audio-stop'));update()};
  update();settings.append(voices);
 }
 const menu=document.querySelector('#launch-menu .six-screen-content');
 if(menu){
  const start=document.createElement('button');start.type='button';start.className='daily-start';start.innerHTML='Занятие сегодня <small>10–15 минут · тоны, слова, письмо, диалог и закрепление</small>';menu.prepend(start);
  const dialog=document.createElement('dialog');dialog.id='daily-plan';dialog.innerHTML='<h2>Занятие сегодня</h2><p>Короткий маршрут для начинающего. Переходи дальше, когда закончишь шаг.</p><ol>'+steps.map(s=>'<li><b>'+s.title+'</b><br>'+s.hint+'</li>').join('')+'</ol><button type="button" data-daily-start>Начать / продолжить</button><button type="button" data-daily-dismiss>Закрыть</button>';document.body.append(dialog);
  start.onclick=()=>dialog.showModal();dialog.querySelector('[data-daily-dismiss]').onclick=()=>dialog.close();
  dialog.querySelector('[data-daily-start]').onclick=()=>{const previous=read(),s=previous&&previous.step<steps.length?{...previous,paused:false}:{day:today(),step:0,paused:false};save(s);dialog.close();navigate(s)};
 }
 window.addEventListener('daily-progress-restored',render);render();
})();
