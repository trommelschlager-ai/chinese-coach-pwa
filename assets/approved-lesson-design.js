/* Approved premium study screens v56. All learning data, scoring, media and progress remain in the course engine. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const ensure=(el,selector,make)=>{
  if(!el||el.querySelector(selector))return;
  make();
 };
 function enhanceWord(panel){
  const card=panel.querySelector('.focus-wordcard');if(!card)return;
  const phrase=card.querySelector('.focus-phrase');if(!phrase)return;
  ensure(phrase,'.approved-word-sound',()=>{
   const button=document.createElement('button');button.className='approved-word-sound';button.type='button';
   button.textContent='🔊';button.setAttribute('aria-label','Послушать китайское слово');
   const ru=phrase.querySelector('.focus-russian');ru?.before(button);
   button.onclick=()=>speakChinese(COURSE[selectedLesson-1].vocab[vocabIndex][0],.94);
  });
  if(!card.querySelector('.approved-gold-divider')){
   const divider=document.createElement('div');divider.className='approved-gold-divider';
   divider.textContent='━━━ ❀ ━━━';phrase.after(divider);
  }
  for(const [selector,icon,title,description] of [
   ['.speech-practice','🎤','Тренировать произношение','Слушай, повторяй и сравни свой голос'],
   ['.recall-practice','🧠','Проверить память','Вспомни перевод']
  ]){
   const detail=card.querySelector(selector);if(!detail)return;
   detail.classList.add('approved-action-accordion');
   const sum=detail.querySelector('summary');
   if(sum){
    sum.innerHTML='<span class="approved-accordion-icon" aria-hidden="true">'+icon+'</span>'+
     '<span class="approved-accordion-copy"><strong>'+title+'</strong><small>'+description+'</small></span>'+
     '<span class="approved-accordion-chevron" aria-hidden="true">⌄</span>';
   }
  }
 }
 function enhanceDialogue(panel){
  const transcript=panel.querySelector('.dialogue-transcript');if(!transcript)return;
  transcript.classList.add('approved-chat');
  const lesson=COURSE[selectedLesson-1];
  const practice=panel.querySelector('.focus-dialog-card');
  const originalRepeat=practice?.querySelector('#focus-repeat');
  const recognition=practice?.querySelector('.speech-practice');
  const feedback=practice?.querySelector('#focus-feedback');
  const rows=[...transcript.querySelectorAll('.dialogue-row')];
  rows.forEach((row,i)=>{
   const line=lesson.dialogue[i];if(!line)return;
   const [who,hz,py,ru]=line;
   row.classList.toggle('current-line',i===dialogueIndex);
   row.dataset.speaker=who;
   const image=who==='B'?'./assets/meaning-man.webp':'./assets/meaning-woman.webp';
   row.innerHTML='<div class="approved-speaker"><img class="approved-avatar" src="'+image+'" alt="" loading="lazy">'+
    '<span class="approved-speaker-label">Собеседник '+safe(who)+'</span></div>'+
    '<div class="approved-chat-bubble"><strong class="approved-chat-hanzi" lang="zh-Hans">'+safe(hz)+'</strong>'+
    '<span class="approved-chat-pinyin">'+safe(py)+'</span>'+
    '<span class="approved-chat-russian">'+safe(ru)+'</span>'+
    '<div class="approved-chat-actions">'+
    '<button type="button" class="btn approved-chat-listen" data-chat-listen="'+i+'" aria-label="Слушать реплику '+(i+1)+'">🔊 Слушать</button>'+
    '<button type="button" class="btn approved-chat-repeat" data-chat-repeat="'+i+'" aria-label="Повторить реплику '+(i+1)+'">🎤 Повторить</button>'+
    '</div></div>';
  });
  const active=rows[dialogueIndex]?.querySelector('.approved-chat-bubble');
  if(active&&originalRepeat){
   originalRepeat.className='btn approved-chat-repeat';
   originalRepeat.textContent='🎤 Повторить';
   originalRepeat.setAttribute('aria-label','Повторить текущую реплику или остановить запись');
   active.querySelector('[data-chat-repeat]')?.replaceWith(originalRepeat);
   if(feedback)active.append(feedback);
   if(recognition){
    recognition.className='speech-practice approved-extra-check';
    const summary=recognition.querySelector('summary');
    if(summary)summary.textContent='Дополнительная проверка слов ▾';
    active.append(recognition);
   }
  }
  practice?.remove();
  transcript.querySelectorAll('[data-chat-listen]').forEach(button=>button.addEventListener('click',()=>{
   const i=Number(button.dataset.chatListen);
   if(lesson.dialogue[i]){
    if(typeof window.playDialogueLine==='function')window.playDialogueLine(lesson.id,i);
    else speakChinese(lesson.dialogue[i][1],.94);
   }
  }));
  transcript.querySelectorAll('[data-chat-repeat]').forEach(button=>button.addEventListener('click',()=>{
   const i=Number(button.dataset.chatRepeat);
   if(!Number.isInteger(i)||!lesson.dialogue[i])return;
   dialogueIndex=i;rememberLesson();renderCoursePanel();
   panel.querySelector('#focus-repeat')?.click();
  }));
  const existing=panel.querySelector('.dialogue-full');
  if(existing && !panel.querySelector('.approved-dialogue-toolbar')){
   const toolbar=document.createElement('div');toolbar.className='approved-dialogue-toolbar';
   const loop=document.createElement('button');loop.type='button';loop.className='btn soft approved-loop';
   loop.textContent='↻ Повторять по репликам';
   loop.onclick=()=>{
    const current=panel.querySelector('.current-line .approved-chat-repeat')||panel.querySelector('.approved-chat-repeat');
    current?.click();
   };
   existing.textContent='▶ Слушать весь диалог';
   existing.before(toolbar);
   toolbar.append(existing,loop);
  }
 }
 function enhancePanel(){
  const panel=$('lesson-panel');if(!panel)return;
  if(selectedStep===1)enhanceWord(panel);
  if(selectedStep===2)enhanceDialogue(panel);
 }
 const basePanel=renderCoursePanel;
 renderCoursePanel=function(){basePanel();enhancePanel()};
 // This file loads after the base UI has already been initially rendered.
 if($('lesson-panel')?.children.length)enhancePanel();
 const quizAudio=document.createElement('button');
 quizAudio.type='button';quizAudio.className='approved-quiz-listen';
 quizAudio.textContent='🔊';quizAudio.setAttribute('aria-label','Послушать китайское слово');
 $('quizpinyin')?.after(quizAudio);
 quizAudio.onclick=()=>{const item=quiz[qi];if(item)speakChinese(item.hz,.94)};
})();