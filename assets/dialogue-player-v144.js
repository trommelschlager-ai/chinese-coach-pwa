/* One transcript and media-event player for Panda Go and the five course lessons. */
(()=>{'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active=null;
 function mount(host,lesson,options={}){
  active?.destroy();
  let audio=null,run=0,state='idle',line=-1,whole=true;
  let pinyin=localStorage.getItem('chinese-coach-show-pinyin')!=='false',translation=localStorage.getItem('panda-go-dialogue-translation')!=='false';
  host.classList.add('pg-dialogue-player');
  host.innerHTML=`<div class="pg-dialogue-lines" role="region" aria-label="Весь текст диалога" tabindex="0">${lesson.dialogue.map(([who,hz,py,ru],i)=>`<article class="pg-bubble pg-surface" data-dialog-line="${i}"><button class="pg-icon-button" data-action="dialog-line" data-value="${i}" aria-label="Прослушать реплику ${i+1}"><img src="./assets/vendor/icons/volume-2.svg" alt=""></button><span><small class="pg-dialog-speaker">Собеседник ${esc(who)}</small><strong lang="zh-Hans">${esc(hz)}</strong><small class="pg-dialog-pinyin"${pinyin?'':' hidden'}>${esc(py)}</small><small class="pg-dialog-translation"${translation?'':' hidden'}>${esc(ru)}</small>${options.recordLine?`<button class="pg-secondary pg-record-line" data-action="dialog-record" data-value="${i}" aria-label="Записать реплику ${i+1}">Записать себя</button>`:''}</span></article>`).join('')}</div><div class="pg-dialogue-actions"><button class="pg-primary" data-action="dialog-all">▶ Слушать диалог</button><div class="pg-subtools pg-dialogue-main-tools">${options.onNotes?'<button class="pg-secondary pg-dialog-notes" data-action="dialog-notes">📖 Разбор</button>':''}<button class="pg-secondary" data-action="dialog-pause" disabled>Пауза</button><button class="pg-secondary" data-action="dialog-repeat">↻ Повторить</button></div><div class="pg-subtools"><button class="pg-secondary" data-action="pinyin" aria-pressed="${pinyin}">Пиньинь: ${pinyin?'показан':'скрыт'}</button><button class="pg-secondary" data-action="dialog-translation" aria-pressed="${translation}">Перевод: ${translation?'показан':'скрыт'}</button></div><div class="pg-dialog-status" data-dialog-status role="status" aria-live="polite"></div></div>`;
  function update(){
   const pause=host.querySelector('[data-action=dialog-pause]');pause.disabled=!['playing','paused'].includes(state);pause.textContent=state==='paused'?'Продолжить':'Пауза';
   const main=host.querySelector('[data-action=dialog-all]');
   main.textContent=state==='playing'?'Ⅱ Пауза':state==='paused'?'▶ Продолжить':'▶ Слушать диалог';
   main.setAttribute('aria-label',state==='playing'?'Приостановить диалог':state==='paused'?'Продолжить диалог':'Слушать весь диалог');
   host.querySelectorAll('[data-dialog-line]').forEach((el,i)=>{const current=i===line&&['playing','paused'].includes(state);el.classList.toggle('pg-speaking',current);if(current)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current')});
   host.querySelector('[data-dialog-status]').textContent=({idle:'',loading:'Загружается MP3…',playing:`Реплика ${line+1} из ${lesson.dialogue.length}`,paused:'Пауза',ended:'Диалог завершён. Все реплики доступны для чтения.',error:'Не удалось воспроизвести MP3. Попробуй ещё раз.'})[state];
  }
  function stop(){run++;if(audio){audio.onplaying=audio.onended=audio.onerror=null;audio.pause();audio=null}state='idle';line=-1;update()}
  async function play(index=0,all=true){
   window.stopLearningAudio?.();stop();whole=all;const token=run;
   async function next(i){
    if(token!==run||!host.isConnected)return;
    if(i>=lesson.dialogue.length){state='ended';line=-1;update();return}
    line=i;state='loading';update();
    let file;try{file=await window.getDialogueAudioFile(lesson.id,i)}catch{}
    if(token!==run||!host.isConnected)return;
    if(!file){state='error';update();return}
    const clip=new Audio(file);audio=clip;clip.playbackRate=1;clip.preservesPitch=true;
    const valid=()=>token===run&&audio===clip&&host.isConnected;
    clip.onplaying=()=>{if(!valid())return;state='playing';update();host.querySelector(`[data-dialog-line="${i}"]`).scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'})};
    clip.onended=()=>{if(!valid())return;if(whole)next(i+1);else{state='idle';line=-1;update()}};
    clip.onerror=()=>{if(valid()){state='error';update()}};
    try{await clip.play()}catch{if(valid()){state='error';update()}}
   }
   await next(index);
  }
  function pause(){if(!audio)return;if(state==='playing'){audio.pause();state='paused';update()}else if(state==='paused'){state='loading';update();Promise.resolve(audio.play()).catch(()=>{state='error';update()})}}
  function toggle(name,button){const isPy=name==='pinyin';if(isPy)pinyin=!pinyin;else translation=!translation;const value=isPy?pinyin:translation;try{localStorage.setItem(isPy?'chinese-coach-show-pinyin':'panda-go-dialogue-translation',String(value))}catch{}host.querySelectorAll(isPy?'.pg-dialog-pinyin':'.pg-dialog-translation').forEach(el=>el.hidden=!value);button.setAttribute('aria-pressed',String(value));button.textContent=(isPy?'Пиньинь: ':'Перевод: ')+(value?'показан':'скрыт')}
  function click(e){const b=e.target.closest('[data-action]');if(!b||!host.contains(b))return;e.stopPropagation();const a=b.dataset.action;if(a==='dialog-all'){if(state==='playing'||state==='paused')pause();else play()}else if(a==='dialog-repeat')play();else if(a==='dialog-notes')options.onNotes?.();else if(a==='dialog-line')play(Number(b.dataset.value),false);else if(a==='dialog-pause')pause();else if(a==='pinyin'||a==='dialog-translation')toggle(a,b);else if(a==='dialog-record')options.recordLine?.(Number(b.dataset.value))}
  if(Number.isInteger(options.initialLine)){const row=host.querySelector(`[data-dialog-line="${options.initialLine}"]`);row?.setAttribute('data-course-selected','true');row?.scrollIntoView({block:'nearest'})}host.addEventListener('click',click);window.addEventListener('learning-audio-stop',stop);
  const api={play,pause,stop,destroy(){stop();host.removeEventListener('click',click);window.removeEventListener('learning-audio-stop',stop);if(active===api)active=null}};active=api;return api;
 }
 window.PandaDialoguePlayer={mount};
 // Run after the existing lesson decorators; preserve their recording exercise.
 const previous=renderCoursePanel;
 renderCoursePanel=function(){
  previous();if(selectedStep!==2)return;
  const panel=document.getElementById('lesson-panel');
  const retained=[...panel.querySelectorAll('#focus-repeat,#focus-feedback,.speech-practice')];
  panel.replaceChildren();const host=document.createElement('div');panel.append(host);
  mount(host,COURSE.find(l=>l.id===selectedLesson),{initialLine:dialogueIndex,recordLine(i){dialogueIndex=i;rememberLesson();renderCoursePanel();const details=panel.querySelector('.pg-dialogue-practice');if(details)details.open=true;panel.querySelector('#focus-repeat')?.click()}});
  const next=document.getElementById('course-next'),prev=document.getElementById('course-prev');next.textContent='К проверке →';next.onclick=()=>chooseCourseStep(3);prev.onclick=()=>chooseCourseStep(1);
  if(retained.length){const details=document.createElement('details');details.className='pg-dialogue-practice';const summary=document.createElement('summary');summary.textContent='Запись и проверка слов · реплика '+(dialogueIndex+1);details.append(summary,...retained);panel.append(details)}
 };
})();
